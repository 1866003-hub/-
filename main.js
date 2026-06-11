// 1. 基本セットアップ
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // 青空

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2, 3, 5); // ブロックが見えやすい位置

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);

// 2. ライト
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

// 3. ブロックの準備（色を変える）
const geometry = new THREE.BoxGeometry(1, 1, 1);
const matGrass = new THREE.MeshLambertMaterial({ color: 0x556B2F }); // 草（緑）
const matDirt  = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // 土（茶）
const matDiamond = new THREE.MeshLambertMaterial({ color: 0x00FFFF }); // ダイヤ（水色）

// 4. 安全のために、まずは「3個のブロック」を縦に並べる（ミニ地下）
const allBlocks = [];

// 1番上：草ブロック (y = 0)
const block1 = new THREE.Mesh(geometry, matGrass);
block1.position.set(0, 0, 0);
block1.name = "grass";
scene.add(block1);
allBlocks.push(block1);

// 真ん中：土ブロック (y = -1)
const block2 = new THREE.Mesh(geometry, matDirt);
block2.position.set(0, -1, 0);
block2.name = "dirt";
scene.add(block2);
allBlocks.push(block2);

// 一番下：ダイヤ鉱石 (y = -2)
const block3 = new THREE.Mesh(geometry, matDiamond);
block3.position.set(0, -2, 0);
block3.name = "diamond";
scene.add(block3);
allBlocks.push(block3);

// 5. クリックで掘る処理
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', () => {
    mouse.x = 0; // 画面中央
    mouse.y = 0;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(allBlocks);

    if (intersects.length > 0) {
        const hitBlock = intersects[0].object;
        
        if (hitBlock.name === "diamond") {
            scene.remove(hitBlock);
            alert("💎 ダイヤモンドを発見！目標達成！ 💎");
        } else {
            scene.remove(hitBlock);
            // リストから消す
            const index = allBlocks.indexOf(hitBlock);
            if (index > -1) allBlocks.splice(index, 1);
        }
    }
});

// 6. ループ処理
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
