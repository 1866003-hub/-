
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
