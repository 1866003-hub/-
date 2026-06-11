// 1. 基本セットアップ
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // 青空

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(2, 4, 5); // 3x3が見やすい位置に調整

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(1, -1, 1); // 3x3の真ん中にカメラを向ける

// 2. ライト
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

// 3. ブロックの準備
const geometry = new THREE.BoxGeometry(1, 1, 1);
const matGrass = new THREE.MeshLambertMaterial({ color: 0x556B2F }); // 草
const matDirt  = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // 土
const matDiamond = new THREE.MeshLambertMaterial({ color: 0x00FFFF }); // ダイヤ

// 4. 3x3x3 の世界を作る（合計27個なので激軽！）
const allBlocks = [];
const SIZE = 3;

// ダイヤを隠す場所をランダムで1箇所決める（最下層 y=-2 のどこか）
const diamondX = Math.floor(Math.random() * SIZE);
const diamondZ = Math.floor(Math.random() * SIZE);

for (let x = 0; x < SIZE; x++) {
    for (let y = 0; y >= -2; y--) { // 上から 0, -1, -2 の3層
        for (let z = 0; z < SIZE; z++) {
            
            let currentMaterial;
            let blockType = "";

            if (y === 0) {
                currentMaterial = matGrass;
                blockType = "grass";
            } else if (y === -1) {
                currentMaterial = matDirt;
                blockType = "dirt";
            } else if (y === -2) {
                // 最下層で、ランダムに決まった座標だけダイヤにする
                if (x === diamondX && z === diamondZ) {
                    currentMaterial = matDiamond;
                    blockType = "diamond";
                } else {
                    currentMaterial = matDirt; // 周りは土で隠す
                    blockType = "dirt";
                }
            }

            const block = new THREE.Mesh(geometry, currentMaterial);
            block.position.set(x, y, z);
            block.name = blockType;
            
            scene.add(block);
            allBlocks.push(block);
        }
    }
}

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
            // ちょっと豪華なクリアメッセージ
            alert("💎✨ おめでとう！！！ ✨💎\n地下深くに隠されたダイヤモンドを掘り当てた！\n完全クリアです！");
        } else {
            scene.remove(hitBlock);
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
