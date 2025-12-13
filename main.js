import * as THREE from 'three';

const canvasEl = document.querySelector('#canvas');
const cleanBtn = document.querySelector('.clean-btn');

const pointer = {
    x: 0.66,
    y: 0.3,
    clicked: true,
    vanishCanvas: false
};

// عداد النقرات
let clickCount = 0;
const maxClicks = 17;
let canClick = true;

// عناصر DOM
const clickCountEl = document.getElementById('clickCount');
const nameEl = document.querySelector('.name');
const counterEl = document.querySelector('.counter');

// Preview animation
window.setTimeout(() => {
    pointer.x = 0.75;
    pointer.y = 0.5;
    pointer.clicked = true;
}, 700);

let basicMaterial, shaderMaterial;
let renderer = new THREE.WebGLRenderer({
    canvas: canvasEl,
    alpha: true,
    antialias: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
let sceneShader = new THREE.Scene();
let sceneBasic = new THREE.Scene();
let camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
let clock = new THREE.Clock();

let renderTargets = [
    new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight),
    new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight)
];

createPlane();
updateSize();

window.addEventListener('resize', () => {
    updateSize();
    cleanCanvas();
});

render();

let isTouchScreen = false;

// معالج النقر
window.addEventListener('click', e => {
    if (!isTouchScreen && canClick) {
        pointer.x = e.clientX / window.innerWidth;
        pointer.y = e.clientY / window.innerHeight;
        pointer.clicked = true;
        
        clickCount++;
        updateClickCount();
    }
});

// معالج اللمس
window.addEventListener('touchstart', e => {
    isTouchScreen = true;
    if (canClick) {
        e.preventDefault();
        pointer.x = e.touches[0].clientX / window.innerWidth;
        pointer.y = e.touches[0].clientY / window.innerHeight;
        pointer.clicked = true;
        
        clickCount++;
        updateClickCount();
    }
});

// معالج السحب (إذا أردت العد عند السحب أيضاً)
window.addEventListener('touchmove', e => {
    if (e.touches.length === 1 && canClick) {
        e.preventDefault();
        pointer.x = e.touches[0].clientX / window.innerWidth;
        pointer.y = e.touches[0].clientY / window.innerHeight;
        pointer.clicked = true;
        
        clickCount++;
        updateClickCount();
    }
});

cleanBtn.addEventListener('click', cleanCanvas);

// تحديث العداد
function updateClickCount() {
    if (clickCountEl) {
        clickCountEl.textContent = clickCount;
    }
    
    // عندما يصل إلى 17، ابدأ الانتقال
    if (clickCount >= maxClicks) {
        startTransition();
    }
}

// وظيفة الانتقال
function startTransition() {
    canClick = false;
    
    // إضافة تأثير تلاشي للورود
    const vanishDuration = 1500; // 1.5 ثانية
    pointer.vanishCanvas = true;
    
    // إخفاء النص والعناصر الأخرى بتأثير
    if (nameEl) {
        nameEl.style.opacity = '0';
    }
    
    if (counterEl) {
        counterEl.style.opacity = '0';
    }
    
    if (cleanBtn) {
        cleanBtn.style.transition = 'opacity 1s ease';
        cleanBtn.style.opacity = '0';
    }
    
    // بعد انتهاء التأثير، انتقل إلى الصفحة الجديدة
    setTimeout(() => {
        window.location.href = 'part2/index.html';
    }, vanishDuration);
}

function cleanCanvas() {
    if (!canClick) return;
    
    pointer.vanishCanvas = true;
    setTimeout(() => {
        pointer.vanishCanvas = false;
    }, 50);
}

function createPlane() {
    shaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
            u_stop_time: { type: 'f', value: 0 },
            u_stop_randomizer: {
                type: 'v2',
                value: new THREE.Vector2(Math.random(), Math.random()),
            },
            u_cursor: { type: 'v2', value: new THREE.Vector2(pointer.x, pointer.y) },
            u_ratio: { type: 'f', value: window.innerWidth / window.innerHeight },
            u_texture: { type: 't', value: null },
            u_clean: { type: 'f', value: 1 },
        },
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent,
    });
    
    basicMaterial = new THREE.MeshBasicMaterial();
    const planeGeometry = new THREE.PlaneGeometry(2, 2);
    const planeBasic = new THREE.Mesh(planeGeometry, basicMaterial);
    const planeShader = new THREE.Mesh(planeGeometry, shaderMaterial);
    
    sceneBasic.add(planeBasic);
    sceneShader.add(planeShader);
}

function render() {
    shaderMaterial.uniforms.u_clean.value = pointer.vanishCanvas ? 0 : 1;
    shaderMaterial.uniforms.u_texture.value = renderTargets[0].texture;

    if (pointer.clicked) {
        shaderMaterial.uniforms.u_cursor.value = new THREE.Vector2(
            pointer.x,
            1 - pointer.y
        );
        shaderMaterial.uniforms.u_stop_randomizer.value = new THREE.Vector2(
            Math.random(),
            Math.random()
        );
        shaderMaterial.uniforms.u_stop_time.value = 0;
        pointer.clicked = false;
    }
    
    shaderMaterial.uniforms.u_stop_time.value += clock.getDelta();

    renderer.setRenderTarget(renderTargets[1]);
    renderer.render(sceneShader, camera);
    basicMaterial.map = renderTargets[1].texture;
    renderer.setRenderTarget(null);
    renderer.render(sceneBasic, camera);

    let tmp = renderTargets[0];
    renderTargets[0] = renderTargets[1];
    renderTargets[1] = tmp;

    requestAnimationFrame(render);
}

function updateSize() {
    if (shaderMaterial && shaderMaterial.uniforms.u_ratio) {
        shaderMaterial.uniforms.u_ratio.value = window.innerWidth / window.innerHeight;
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Update render targets
    renderTargets.forEach(target => {
        target.setSize(window.innerWidth, window.innerHeight);
    });
}

// تحديث العداد عند البدء
updateClickCount();