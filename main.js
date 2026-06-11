// 1. シーン・カメラ・レンダラーの基本セットアップ
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // マイクラっぽい青空の色

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(3, 3, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// カメラをマウスでぐるぐる動かせるようにする
const controls = new THREE.OrbitControls(camera, renderer.domElement);

// 2. 光（ライト）を入れる（これがないと真っ暗になります）
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 15);
scene.add(directionalLight);

// 3. ブロック（立方体）を1個作る（まずは土ブロックの代わりの茶色）
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
const block = new THREE.Mesh(geometry, material);
scene.add(block);

// 4. クリックでブロックを消す仕組み（レイキャスター）
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    // 画面中央（照準の位置）の座標を設定
    mouse.x = 0;
    mouse.y = 0;
    
    raycaster.setFromCamera(mouse, camera);
    // 画面内のオブジェクトと照準が当たっているかチェック
    const intersects = raycaster.intersectObjects(scene.children);

    for (let i = 0; i < intersects.length; i++) {
        // 当たったオブジェクトが「ブロック」だったら消す
        if (intersects[i].object === block) {
            scene.remove(block);
            alert("ブロックを掘った！次はダイヤを出すぞ！");
        }
    }
});

// 5. 毎フレーム描画するループ処理
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// 画面のサイズが変わったときの対策
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
