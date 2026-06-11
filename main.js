// 1. 基本セットアップ
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // 青空

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// プレイヤーの初期位置（目の高さ）
camera.position.set(1.5, 1.6, 5); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

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

// 5. 【新機能】マイクラ風の一人称操作（Pointer Lock）
// 画面をクリックすると、マウスの矢印が消えてゲーム画面にロックされます
window.addEventListener('click', () => {
    if (document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock();
    }
});

// マウスを動かしたときに、カメラをキョロキョロ動かす
let moveX = 0;
let moveY = 0;
document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement === renderer.domElement) {
        camera.rotation.y -= event.movementX * 0.002;
        camera.rotation.x -= event.movementY * 0.002;
        // 真上や真下を向きすぎないように制限
        camera.rotation.x = Math.max(-Math.PI/2.5, Math.min(Math.PI/2.5, camera.rotation.x));
    }
});
camera.rotation.order = "YXZ"; // 首振りのバグを防ぐ設定

// キーボード移動の判定用
const keys = { w: false, a: false, s: false, d: false };
window.addEventListener('keydown', (e) => { if(e.key in keys) keys[e.key] = true; });
window.addEventListener('keyup', (e) => { if(e.key in keys) keys[e.key] = false; });

// 6. 穴掘り（一人称なので、画面中央の「視線の先」にあるブロックを掘る）
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(0, 0); // 常に画面中央

// ロックされている状態でクリックしたら掘る
document.addEventListener('mousedown', (e) => {
    if (document.pointerLockElement !== renderer.domElement) return;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(allBlocks);

    if (intersects.length > 0) {
        const hitBlock = intersects[0].object;
        
        // プレイヤーの手が届く距離（4マス以内）だけ掘れる
        if (intersects[0].distance < 4) {
            if (hitBlock.name === "diamond") {
                scene.remove(hitBlock);
                document.exitPointerLock(); // ロック解除
                alert("💎✨ 相棒！ついに一人称視点でダイヤを掘り当てたぞ！ ✨💎");
            } else {
                scene.remove(hitBlock);
                const index = allBlocks.indexOf(hitBlock);
                if (index > -1) allBlocks.splice(index, 1);
            }
        }
    }
});

// 7. 【新機能】重力と移動のループ処理
let velocityY = 0; // 落下速度
const gravity = 0.01; // 重力の強さ
const playerSpeed = 0.05;

function animate() {
    requestAnimationFrame(animate);

    // --- キーボード移動 ---
    if (document.pointerLockElement === renderer.domElement) {
        // カメラの向いている方向を基準に前後に移動
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        forward.y = 0; // 宙に浮かないように
        forward.normalize();

        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        right.y = 0;
        right.normalize();

        if (keys.w) camera.position.addScaledVector(forward, playerSpeed);
        if (keys.s) camera.position.addScaledVector(forward, -playerSpeed);
        if (keys.a) camera.position.addScaledVector(right, -playerSpeed);
        if (keys.d) camera.position.addScaledVector(right, playerSpeed);
    }

    // --- 簡易的な重力と着地判定 ---
    velocityY -= gravity; // 毎フレーム、下に落ちる力を加える
    camera.position.y += velocityY;

    // プレイヤーの足元の高さをチェック（ y = 0.5 の位置が草ブロックの表面の上 ）
    if (camera.position.y < 1.6) { 
        camera.position.y = 1.6; // 地面に固定
        velocityY = 0; // 落下を止める
    }

    renderer.render(scene, camera);
}
animate();
