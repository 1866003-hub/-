// 1. 基本セットアップ
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // 青空

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// 全体が見えるようにカメラを少し引く
camera.position.set(5, 8, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(5, 0, 5); // カメラの回転中心を地面の真ん中に

// 2. ライト
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 15);
scene.add(directionalLight);

// 3. 【激軽対策】InstancedMeshを使って100個のブロックを1発で描画する
const WORLD_SIZE = 10; // 10 x 10 マス
const maxBlocks = WORLD_SIZE * WORLD_SIZE;

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshLambertMaterial({ color: 0x556B2F }); // 草ブロックっぽい緑色

// 大量配置用の特殊なメッシュ
const blockCluster = new THREE.InstancedMesh(geometry, material, maxBlocks);
scene.add(blockCluster);

// ブロックの位置データを保存する配列（後で掘るために使う）
const dummy = new THREE.Object3D();
let blockCount = 0;

for (let x = 0; x < WORLD_SIZE; x++) {
    for (let z = 0; z < WORLD_SIZE; z++) {
        // y=0 の高さに平らに並べる
        dummy.position.set(x, 0, z);
        dummy.updateMatrix();
        
        // i番目のブロックの位置を設定
        blockCluster.setMatrixAt(blockCount, dummy.matrix);
        blockCount++;
    }
}
// 変更を画面に反映
blockCluster.instanceMatrix.needsUpdate = true;

// 4. クリックでブロックを消す（掘る）処理
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    mouse.x = 0; // 画面中央
    mouse.y = 0;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(blockCluster); // 集団（Cluster）に対して判定

    if (intersects.length > 0) {
        // 何番目のインスタンス（ブロック）に当たったかを取得
        const instanceId = intersects[0].instanceId;
        
        // 当たったブロックを「見えない位置」に吹き飛ばして消す（超高速トリック）
        const zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
        blockCluster.setMatrixAt(instanceId, zeroMatrix);
        blockCluster.instanceMatrix.needsUpdate = true;
        
        console.log("ブロックID " + instanceId + " を掘った！");
    }
});

// 5. ループ処理
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
