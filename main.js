// 1. 基本セットアップ
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // 青空

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(1.5, 1.6, 5.5); // ちょっと後ろに引いて建築しやすく

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 画面中央の「＋」マーク
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

// 4. 最初の大地を作る
const allBlocks = [];
const SIZE = 3;

for (let x = 0; x < SIZE; x++) {
    for (let y = 0; y >= -2; y--) {
        for (let z = 0; z < SIZE; z++) {
            let currentMaterial = matDirt;
            let blockType = "dirt";

            if (y === 0) {
                currentMaterial = matGrass;
                blockType = "grass";
            }

            const block = new THREE.Mesh(geometry, currentMaterial);
            block.position.set(x, y, z);
            block.name = blockType;
            
            scene.add(block);
            allBlocks.push(block);
        }
    }
}

// 5. ドラッグで視点変更システム
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let rotationY = 0;
let rotationX = 0;

window.addEventListener('mousedown', (e) => {
    // 左・右クリックの単発押し時はドラッグ開始とみなさない（建築・採掘を優先）
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;

    // 移動量が少なすぎる場合は無視（クリック時のブレ対策）
    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;

    rotationY -= deltaX * 0.005;
    rotationX -= deltaY * 0.005;
    rotationX = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, rotationX));

    camera.rotation.set(rotationX, rotationY, 0, "YXZ");
    previousMousePosition = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mouseup', () => {
    isDragging = false;
});

// キーボード移動
const keys = { w: false, a: false, s: false, d: false };
window.addEventListener('keydown', (e) => { 
    const key = e.key.toLowerCase();
    if(key in keys) keys[key] = true; 
});
window.addEventListener('keyup', (e) => { 
    const key = e.key.toLowerCase();
    if(key in keys) keys[key] = false; 
});

// 6. 【超進化】破壊と建築（左クリックで掘る / 右クリックで置く）
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(0, 0); // 常に画面中央

// ブラウザの右クリックメニューを禁止する（ゲームの邪魔になるため）
window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

window.addEventListener('pointerdown', (e) => {
    // 視線の先にあるブロックを感知
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(allBlocks);

    if (intersects.length > 0) {
        const hit = intersects[0];
        const hitBlock = hit.object;

        if (hit.distance < 6) { // 手が届く距離
            
            if (e.button === 0) {
                // --- 【左クリック】ブロックを破壊 ---
                scene.remove(hitBlock);
                const index = allBlocks.indexOf(hitBlock);
                if (index > -1) allBlocks.splice(index, 1);
                
            } else if (e.button === 2) {
                // --- 【右クリック】ブロックを設置 ---
                // 当たった面の向き（法線ベクトル）を取得
                const normal = hit.face.normal;
                
                // 新しいブロックの座標を計算（当たったブロックの隣）
                const newPos = hitBlock.position.clone().add(normal);
                
                // ダイヤモンドブロックを生成して配置！
                const newBlock = new THREE.Mesh(geometry, matDiamond);
                newBlock.position.copy(newPos);
                newBlock.name = "diamond_built";
                
                scene.add(newBlock);
                allBlocks.push(newBlock); // 次からこのブロックも掘ったり上に置いたりできる
            }
        }
    }
});

// 7. 移動ループ
const playerSpeed = 0.06;

function animate() {
    requestAnimationFrame(animate);

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

    camera.position.y = 1.6; // 目の高さ固定

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
