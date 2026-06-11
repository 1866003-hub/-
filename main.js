// 1. 基本セットアップ
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // 青空

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(1.5, 1.6, 5); // プレイヤーの初期位置

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- 【バグ対策】スタートボタンと画面中央のドットをCSSで作る ---
// 画面中央の白い丸（照準）
const crosshair = document.createElement('div');
crosshair.style.position = 'absolute';
crosshair.style.top = '50%';
crosshair.style.left = '50%';
crosshair.style.width = '8px';
crosshair.style.height = '8px';
crosshair.style.background = 'white';
crosshair.style.transform = 'translate(-50%, -50%)';
crosshair.style.borderRadius = '50%';
crosshair.style.pointerEvents = 'none';
crosshair.style.display = 'none'; // 最初は隠しておく
document.body.appendChild(crosshair);

// デバッグ用：スタートボタン
const startButton = document.createElement('button');
startButton.innerHTML = '🎮 ゲームをスタートする';
startButton.style.position = 'absolute';
startButton.style.top = '50%';
startButton.style.left = '50%';
startButton.style.transform = 'translate(-50%, -50%)';
startButton.style.padding = '15px 30px';
startButton.style.fontSize = '20px';
startButton.style.backgroundColor = '#556B2F';
startButton.style.color = 'white';
startButton.style.border = 'none';
startButton.style.cursor = 'pointer';
startButton.style.borderRadius = '5px';
document.body.appendChild(startButton);

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

// 5. 【修正】ボタンクリックで確実にPointer Lockを発動させる
startButton.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
});

// ロック状態の変化を監視してボタンを消し、照準を出す
document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === renderer.domElement) {
        startButton.style.display = 'none';
        crosshair.style.display = 'block';
    } else {
        startButton.style.display = 'block';
        crosshair.style.display = 'none';
    }
});

// マウス移動で視点を動かす
document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === renderer.domElement) {
        camera.rotation.y -= event.movementX * 0.002;
        camera.rotation.x -= event.movementY * 0.002;
        camera.rotation.x = Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, camera.rotation.x));
    }
});
camera.rotation.order = "YXZ";

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

// 6. 穴掘り処理
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(0, 0); // 常に画面中央

document.addEventListener('mousedown', (e) => {
    if (document.pointerLockElement !== renderer.domElement) return;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(allBlocks);

    if (intersects.length > 0) {
        const hitBlock = intersects[0].object;
        
        if (intersects[0].distance < 5) {
            if (hitBlock.name === "diamond") {
                scene.remove(hitBlock);
                document.exitPointerLock(); 
                alert("💎✨ 相棒！一人称視点でダイヤ発掘成功だ！ ✨💎");
            } else {
                scene.remove(hitBlock);
                const index = allBlocks.indexOf(hitBlock);
                if (index > -1) allBlocks.splice(index, 1);
            }
        }
    }
});

// 7. 定期実行（移動ループ）
const playerSpeed = 0.05;

function animate() {
    requestAnimationFrame(animate);

    if (document.pointerLockElement === renderer.domElement) {
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
    }

    camera.position.y = 1.6; // プレイヤーの目の高さ固定

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
