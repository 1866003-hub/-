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

// 案内テキスト（画面上部にうっすら表示）
const infoText = document.createElement('div');
infoText.style.position = 'absolute';
infoText.style.top = '20px';
infoText.style.width = '100%';
infoText.style.textAlign = 'center';
infoText.style.color = 'white';
infoText.style.fontSize = '16px';
infoText.style.fontFamily = 'sans-serif';
infoText.style.textShadow = '1px 1px 3px black';
infoText.innerHTML = '🖱️ 画面を【ダブルクリック】でマイクラ操作モード起動 / 【Esc】で解除';
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

// 5. 【究極修正】ダブルクリックで確実ロック＆ドラッグ不要の視点移動
window.addEventListener('dblclick', () => {
    // ダブルクリックされたら、ブラウザの制限を突破してマウスをロック！
    renderer.domElement.requestPointerLock();
});

// ロック状態に応じて案内テキストを切り替える
document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === renderer.domElement) {
        infoText.innerHTML = '🚀 マイクラモード中！ 【W,A,S,D】移動 / 【Q】上昇 【E】下降 / 【Esc】でマウス解放';
    } else {
        infoText.innerHTML = '🖱️ 画面を【ダブルクリック】でマイクラ操作モード起動 / 【Esc】で解除';
    }
});

// マウスを動かすだけでキョロキョロ動く（ドラッグ一切不要！）
document.addEventListener('mousemove', (event) => {
    // マウスがロックされている時だけ視点を動かす
    if (document.pointerLockElement === renderer.domElement) {
        camera.rotation.y -= event.movementX * 0.002;
        camera.rotation.x -= event.movementY * 0.002;
        camera.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, camera.rotation.x));
    }
});
camera.rotation.order = "YXZ";

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

// 6. 破壊と建築（マウスがロックされている時だけ作動）
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(0, 0);

window.addEventListener('contextmenu', (e) => { e.preventDefault(); });

window.addEventListener('pointerdown', (e) => {
    // マウスがロックされていない時はクリックを無視（誤作動防止）
    if (document.pointerLockElement !== renderer.domElement) return;

    raycaster.setFromCamera(mouse, camera);
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

// 7. 移動ループ
const playerSpeed = 0.12;

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
        if (keys.q) camera.position.y += playerSpeed;
        if (keys.e) camera.position.y -= playerSpeed;
    }

    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
