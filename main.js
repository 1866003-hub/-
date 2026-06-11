// 1. 基本セットアップ
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // 青空

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(10, 5, 25); // 初期位置

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

// 案内テキスト
const infoText = document.createElement('div');
infoText.style.position = 'absolute';
infoText.style.top = '20px';
infoText.style.width = '100%';
infoText.style.textAlign = 'center';
infoText.style.color = 'white';
infoText.style.fontSize = '16px';
infoText.style.fontFamily = 'sans-serif';
infoText.style.textShadow = '1px 1px 3px black';
infoText.innerHTML = '🖱️ ドラッグで高速視点変更！ 【W,A,S,D】移動 / 【Q】上昇 【E】下降';
document.body.appendChild(infoText);

// 2. ライト
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(20, 40, 20);
scene.add(dirLight);

// 3. ブロックの準備
const geometry = new THREE.BoxGeometry(1, 1, 1);
const matGrass = new THREE.MeshLambertMaterial({ color: 0x556B2F });
const matDirt  = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
const matDiamond = new THREE.MeshLambertMaterial({ color: 0x00FFFF });

// --- 【新機能】カメラにくっついて動く「プレイヤーの手（腕）」を作る ---
const handGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.8); // 細長い直方体
const matHand = new THREE.MeshLambertMaterial({ color: 0xbc9374 }); // スティーブっぽい肌色
const handMesh = new THREE.Mesh(handGeometry, matHand);

// 手をカメラの右下・少し前に配置して、カメラの子要素にする
handMesh.position.set(0.5, -0.4, -0.8);
camera.add(handMesh);
scene.add(camera); // カメラをシーンに追加することで子要素の手も映る

// 4. 20 x 20 の地形生成
const allBlocks = [];
const WORLD_SIZE = 20;

for (let x = 0; x < WORLD_SIZE; x++) {
    for (let z = 0; z < WORLD_SIZE; z++) {
        const heightEffect = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 2;
        const surfaceY = Math.round(heightEffect);

        for (let y = surfaceY; y > surfaceY - 3; y--) {
            let currentMaterial = matDirt;
            let blockType = "dirt";

            if (y === surfaceY) {
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

// 5. ドラッグ視点変更（感度3倍版）
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
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

    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;

    rotationY -= deltaX * 0.015;
    rotationX -= deltaY * 0.015;
    rotationX = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, rotationX));

    camera.rotation.set(rotationX, rotationY, 0, "YXZ");
    previousMousePosition = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mouseup', () => { isDragging = false; });

// キーボード移動
const keys = { w: false, a: false, s: false, d: false, q: false, e: false };
window.addEventListener('keydown', (e) => { 
    const key = e.key.toLowerCase();
    if(key in keys) keys[key] = true; 
});
window.addEventListener('keyup', (e) => { 
    const key = e.key.toLowerCase();
    if(key in keys) keys[key] = false; 
});

// 腕の振りのアニメーション用変数
let handSwingTimer = 0;
let isSwinging = false;

// 6. 破壊と建築
const raycaster = new THREE.Raycaster();
const screenCenter = new THREE.Vector2(0, 0);

window.addEventListener('contextmenu', (e) => { e.preventDefault(); });

window.addEventListener('pointerdown', (e) => {
    // クリックされたら腕振りアニメーションをスタート！
    isSwinging = true;
    handSwingTimer = 0;

    raycaster.setFromCamera(screenCenter, camera);
    const intersects = raycaster.intersectObjects(allBlocks);

    if (intersects.length > 0) {
        const hit = intersects[0];
        const hitBlock = hit.object;

        if (hit.distance < 15) {
            if (e.button === 0) {
                // 左クリック：破壊
                scene.remove(hitBlock);
                const index = allBlocks.indexOf(hitBlock);
                if (index > -1) allBlocks.splice(index, 1);
            } else if (e.button === 2) {
                // 右クリック：建築
                const normal = hit.face.normal;
                const newPos = hitBlock.position.clone().add(normal);
                
                const newBlock = new THREE.Mesh(geometry, matDiamond);
                newBlock.position.copy(newPos);
                newBlock.name = "diamond_built";
                
                scene.add(newBlock);
                allBlocks.push(newBlock);
            }
        }
    }
});

// 7. 移動とアニメーションのループ
const playerSpeed = 0.12;

function animate() {
    requestAnimationFrame(animate);

    // --- 【新機能】手がポコポコ動くアニメーション処理 ---
    if (isSwinging) {
        handSwingTimer += 0.2;
        // サイン波を使って、手を手前・奥に往復させる運動を作る
        handMesh.position.z = -0.8 + Math.sin(handSwingTimer) * 0.15;
        handMesh.position.y = -0.4 + Math.cos(handSwingTimer) * 0.05;

        if (handSwingTimer > Math.PI) { // 1往復したら止める
            isSwinging = false;
            handMesh.position.set(0.5, -0.4, -0.8); // 元の位置に戻す
        }
    }

    // --- キーボード移動 ---
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
    if (keys.q) camera.position.y += playerSpeed;
    if (keys.e) camera.position.y -= playerSpeed;

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
