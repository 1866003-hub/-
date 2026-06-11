// 1. 基本セットアップ
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // 青空

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// プレイヤーの初期位置（ブロックのすぐ手前に立つ）
camera.position.set(1.5, 1.6, 4.5); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 画面中央の「＋」マーク（今回は最初からずっと表示！）
const crosshair = document.createElement('div');
crosshair.style.position = 'absolute';
crosshair.style.top = '50%';
crosshair.style.left = '50%';
crosshair.style.width = '10px';
crosshair.style.height = '10px';
crosshair.style.background = 'white';
crosshair.style.transform = 'translate(-50%, -50%)';
crosshair.style.borderRadius = '50%';
crosshair.style.pointerEvents = 'none';
document.body.appendChild(crosshair);

// 2. ライト
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

// 3. ブロックの準備
const geometry = new THREE.BoxGeometry(1, 1, 1);
const matGrass = new THREE.MeshLambertMaterial({ color: 0x556B2F }); // 草
const matDirt  = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // 土
const matDiamond = new THREE.MeshLambertMaterial({ color: 0x00FFFF }); // ダイヤ

// 4. 3x3x3 の世界を作る
const allBlocks = [];
const SIZE = 3;

const diamondX = Math.floor(Math.random() * SIZE);
const diamondZ = Math.floor(Math.random() * SIZE);

for (let x = 0; x < SIZE; x++) {
    for (let y = 0; y >= -2; y--) {
        for (let z = 0; z < SIZE; z++) {
            let currentMaterial = matDirt;
            let blockType = "dirt";

            if (y === 0) {
                currentMaterial = matGrass;
                blockType = "grass";
            } else if (y === -2 && x === diamondX && z === diamondZ) {
                currentMaterial = matDiamond;
                blockType = "diamond";
            }

            const block = new THREE.Mesh(geometry, currentMaterial);
            block.position.set(x, y, z);
            block.name = blockType;
            
            scene.add(block);
            allBlocks.push(block);
        }
    }
}

// 5. 【バグ回避】ドラッグで視点を動かすシステム（ブラウザに怒られない！）
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// カメラの回転角度を管理する変数
let rotationY = 0;
let rotationX = 0;

window.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;

    rotationY -= deltaX * 0.005;
    rotationX -= deltaY * 0.005;
    
    // 真上・真下を向きすぎない制限
    rotationX = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, rotationX));

    // カメラに角度を適用
    camera.rotation.set(rotationX, rotationY, 0, "YXZ");

    previousMousePosition = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

// キーボード移動の判定
const keys = { w: false, a: false, s: false, d: false };
window.addEventListener('keydown', (e) => { 
    const key = e.key.toLowerCase();
    if(key in keys) keys[key] = true; 
});
window.addEventListener('keyup', (e) => { 
    const key = e.key.toLowerCase();
    if(key in keys) keys[key] = false; 
});

// 6. 穴掘り（画面中央の「＋」の先にあるブロックをダブルクリック、または長押し解除で掘る）
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(0, 0); // 常に画面中央

// ドラッグ移動と「クリック（採掘）」を区別するため、クリックされたら判定
window.addEventListener('click', (e) => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(allBlocks);

    if (intersects.length > 0) {
        const hitBlock = intersects[0].object;
        
        // 目の前（距離5マス以内）のブロックなら掘れる
        if (intersects[0].distance < 5) {
            if (hitBlock.name === "diamond") {
                scene.remove(hitBlock);
                alert("💎✨ 相棒！見事に一人称視点でダイヤを見つけたぞ！完全クリア！ ✨💎");
            } else {
                scene.remove(hitBlock);
                const index = allBlocks.indexOf(hitBlock);
                if (index > -1) allBlocks.splice(index, 1);
            }
        }
    }
});

// 7. 移動の定期実行ループ
const playerSpeed = 0.06;

function animate() {
    requestAnimationFrame(animate);

    // カメラの向いている水平方向を計算して移動
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.y = 0; 
    forward.normalize();

    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    right.y = 0;
    right.normalize();

    if (keys.w) camera.position.addScaledVector(forward, playerSpeed);
    if (keys.s) camera.position.addScaledVector(forward, -playerSpeed);
    if (keys.a) camera.position.addScaledVector(right, -playerSpeed);
    if (keys.d) camera.position.addScaledVector(right, playerSpeed);

    camera.position.y = 1.6; // プレイヤーの目の高さ固定

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
