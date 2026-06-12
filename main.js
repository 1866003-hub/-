function initGame() {
    document.body.innerHTML = '';
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';

    // 画面を水色にする
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); 

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5; 

    const renderer = new THREE.WebGLRenderer(); 
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 真ん中に緑色の箱をひとつだけ置く
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // アニメーション（箱を回転させる）
    function animate() {
        requestAnimationFrame(animate);
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
    }
    animate();
}

// Three.jsが読み込まれたらスタート
const checkThree = setInterval(() => { 
    if (typeof THREE !== 'undefined') { 
        clearInterval(checkThree); 
        initGame(); 
    } 
}, 50);
