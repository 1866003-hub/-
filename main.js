function initGame() {
    // 1. シーンとカメラの基本設定
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); 
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.03); // 霧を少し濃くして先を自然に隠す（超軽量化）

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.set(25, 12, 25); 

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" }); 
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 照準（画面中央のプラスマーク）
    const crosshair = document.createElement('div');
    crosshair.style.position = 'absolute'; crosshair.style.top = '50%'; crosshair.style.left = '50%';
    crosshair.style.width = '12px'; crosshair.style.height = '12px';
    crosshair.style.border = '2px solid white';
    crosshair.style.transform = 'translate(-50%, -50%)'; crosshair.style.pointerEvents = 'none';
    document.body.appendChild(crosshair);

    // 座標などの表示UI
    const heightUI = document.createElement('div');
    heightUI.style.position = 'absolute'; heightUI.style.bottom = '90px'; heightUI.style.left = '20px';
    heightUI.style.color = '#FFF'; heightUI.style.fontSize = '16px'; heightUI.style.fontFamily = 'monospace';
    heightUI.style.textShadow = '2px 2px 2px black'; document.body.appendChild(heightUI);

    const infoText = document.createElement('div');
    infoText.style.position = 'absolute'; infoText.style.top = '15px'; infoText.style.width = '100%'; infoText.style.textAlign = 'center';
    infoText.style.color = 'white'; infoText.style.fontSize = '15px'; infoText.style.fontFamily = 'sans-serif'; infoText.style.textShadow = '1px 1px 3px black';
    infoText.innerHTML = '🎒【E】キーでインベントリ開閉 | マウスホイールでスロット選択 | ⚔️左クリックで攻撃';
    document.body.appendChild(infoText);

    // 2. ライト（光）の設定
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9); scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.3); dirLight.position.set(10, 40, 20); scene.add(dirLight);

    // ブロック・モブの色設定
    function cMat(hexColor) { 
        return new THREE.MeshBasicMaterial({ color: hexColor }); // 影の計算を無くして超軽量化（MeshStandard -> MeshBasic）
    }

    const mats = {
        grass: cMat(0x5b8731), log: cMat(0x675131), dirt: cMat(0x866043), 
        stone: cMat(0x737373), iron: cMat(0xd8af93), diamond: cMat(0x4dedf2),
        bedrock: cMat(0x222222), leaves: cMat(0x245116), furnace: cMat(0x3a3a3a), 
        sand: cMat(0xddcc99), water: new THREE.MeshBasicMaterial({ color: 0x3377FF, transparent: true, opacity: 0.6 }),
        chest: cMat(0x967140),
        pig: cMat(0xFFB6C1),     
        zombie: cMat(0x556B2F)   
    };

    const geometry = new THREE.BoxGeometry(1, 1, 1);

    // プレイヤーの手
    const handMesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.8), cMat(0xffdbac)); 
    handMesh.position.set(0.45, -0.35, -0.7); camera.add(handMesh); scene.add(camera);

    let velocityY = 0; const GRAVITY = 0.03; const JUMP_FORCE = 0.35; let isGrounded = false; const PLAYER_HEIGHT = 1.6;

    // 3. アイテムとインベントリの設定
    const ITEM_IDS = ["log", "dirt", "stone", "iron", "diamond", "furnace", "chest", "sand"];
    const ITEM_NAMES = { log:"原木", dirt:"土", stone:"丸石", iron:"鉄鉱石", diamond:"ダイヤモンド", furnace:"かまど", chest:"チェスト", sand:"砂" };
    const ITEM_ICONS = { log:"🪵", dirt:"🟫", stone:"🪨", iron:"🪙", diamond:"💎", furnace:"🔥", chest:"🧳", sand:"⏳" };

    const inventory = { log: 0, dirt: 0, stone: 0, iron: 0, diamond: 0, furnace: 0, chest: 0, sand: 0 };
    const hotbarSlots = [null, null, null, null, null, null, null, null, null];
    let selectedSlot = 0;
    let isScreenOpen = false;

    // 4. UIの作成
    const hotbarContainer = document.createElement('div');
    hotbarContainer.style.position = 'absolute'; hotbarContainer.style.bottom = '20px'; hotbarContainer.style.left = '50%';
    hotbarContainer.style.transform = 'translateX(-50%)'; hotbarContainer.style.display = 'flex'; hotbarContainer.style.gap = '5px';
    hotbarContainer.style.background = 'rgba(30,30,30,0.85)'; hotbarContainer.style.padding = '6px'; hotbarContainer.style.border = '3px solid #3c3c3c';
    document.body.appendChild(hotbarContainer);

    const slotsUI = [];
    for(let i=0; i<9; i++) {
        const slot = document.createElement('div');
        slot.style.width = '55px'; slot.style.height = '55px'; slot.style.border = '3px solid #555';
        slot.style.background = 'rgba(0,0,0,0.5)'; slot.style.display = 'flex'; slot.style.flexDirection = 'column';
        slot.style.alignItems = 'center'; slot.style.justifyContent = 'center'; slot.style.color = 'white';
        slot.style.fontFamily = 'monospace'; slot.style.fontSize = '12px';
        hotbarContainer.appendChild(slot); slotsUI.push(slot);
    }

    const inventoryMenu = document.createElement('div');
    inventoryMenu.style.position = 'absolute'; inventoryMenu.style.top = '50%'; inventoryMenu.style.left = '50%'; inventoryMenu.style.transform = 'translate(-50%, -50%)';
    inventoryMenu.style.width = '450px'; inventoryMenu.style.background = 'rgba(40, 40, 40, 0.95)'; inventoryMenu.style.border = '4px solid #fff';
    inventoryMenu.style.padding = '20px'; inventoryMenu.style.color = 'white'; inventoryMenu.style.fontFamily = 'sans-serif'; inventoryMenu.style.display = 'none'; inventoryMenu.style.zIndex = '100';
    document.body.appendChild(inventoryMenu);

    function renderInventoryMenu() {
        let html = `<h3 style="margin-top:0; text-align:center; color:#FFD700;">🎒 インベントリ</h3>`;
        html += `<div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:8px; margin-bottom:15px;">`;
        ITEM_IDS.forEach(id => {
            const count = inventory[id] || 0;
            html += `<div onclick="moveItemToHotbar('${id}')" style="background:#555; padding:8px; border:2px solid #777; display:flex; justify-content:space-between; cursor:pointer;">
                <span>${ITEM_ICONS[id]} ${ITEM_NAMES[id]}</span>
                <strong>${count}</strong>
            </div>`;
        });
        html += `</div><h4>👇 下のスロットをクリックしてインベントリに戻す</h4>`;
        html += `<div style="display:grid; grid-template-columns: repeat(9, 1fr); gap:4px;">`;
        for(let i=0; i<9; i++) {
            const id = hotbarSlots[i];
            html += `<div onclick="removeSlotItem(${i})" style="height:45px; background:#333; border:2px solid #999; display:flex; justify-content:center; align-items:center; font-size:18px; cursor:pointer;">
                ${id ? ITEM_ICONS[id] : ""}
            </div>`;
        }
        html += `</div>`;
        inventoryMenu.innerHTML = html;
    }

    window.moveItemToHotbar = function(id) {
        let index = hotbarSlots.indexOf(null);
        if (index === -1) index = selectedSlot;
        hotbarSlots[index] = id;
        renderInventoryMenu();
        updateGameUI();
    };

    window.removeSlotItem = function(index) {
        hotbarSlots[index] = null;
        renderInventoryMenu();
        updateGameUI();
    };

    function updateGameUI() {
        heightUI.innerHTML = `📍 X:${Math.floor(camera.position.x)} Z:${Math.floor(camera.position.z)} Y:${Math.floor(camera.position.y - PLAYER_HEIGHT)}`;
        for(let i=0; i<9; i++) {
            const id = hotbarSlots[i];
            slotsUI[i].innerHTML = id ? `<div style="font-size:16px;">${ITEM_ICONS[id]}</div>` : `<div style="color:#444;">空</div>`;
            slotsUI[i].style.border = (i === selectedSlot) ? '3px solid #FFF' : '3px solid #555';
            slotsUI[i].style.background = (i === selectedSlot) ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.5)';
        }
    }

    // 5. ワールド生成エンジン（Chromebook用にRADIUS=12に調整）
    const worldData = {}; 
    const instancedMeshes = {};
    const RADIUS = 12; // 👈 軽くてしっかり遠くまで見える12に調整
    const mobsArray = []; 

    Object.keys(mats).forEach(type => {
        if (type === 'pig' || type === 'zombie') return; 
        const mesh = new THREE.InstancedMesh(geometry, mats[type], 15000); 
        mesh.count = 0;
        scene.add(mesh);
        instancedMeshes[type] = mesh;
    });

    function spawnMob(type, x, y, z) {
        if (mobsArray.length > 10) return; // モブの最大数を10匹にして軽量化
        const mobGroup = new THREE.Group();
        const isPig = (type === "pig");
        const bodyMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.6, isPig ? 0.6 : 0.8, isPig ? 0.9 : 0.4), 
            mats[type]
        );
        bodyMesh.position.y = isPig ? 0.4 : 0.7;
        mobGroup.add(bodyMesh);

        mobGroup.position.set(x, y, z);
        mobGroup.userData = { type: type, hp: isPig ? 3 : 6, walkTimer: 0, dirX: 0, dirZ: 0 };
        scene.add(mobGroup);
        mobsArray.push(mobGroup);
    }

    // 🌲 地形と木の生成ロジック
    function generateWorldDataAt(x, z) {
        if (worldData[`${x},0,${z}`] !== undefined) return;
        
        // サイン・コサインの計算を軽くして地形のデコボコをはっきりさせる
        const surfaceY = 4 + Math.floor(Math.sin(x * 0.15) * Math.cos(z * 0.15) * 3);
        
        for (let y = surfaceY; y >= -4; y--) {
            let type = "stone";
            if (y === -4) type = "bedrock";
            else if (y === surfaceY) type = "grass";
            else if (y < surfaceY && y > surfaceY - 3) type = "dirt";
            else {
                if (Math.random() < 0.02) type = "diamond";
                else if (Math.random() < 0.05) type = "iron";
            }
            worldData[`${x},${y},${z}`] = type;
        }

        // 🌲 一定確率で木を生成
        if (Math.random() < 0.015 && worldData[`${x},${surfaceY},${z}`] === "grass") {
            // 幹を4ブロック積み上げる
            for (let ty = 1; ty <= 4; ty++) {
                worldData[`${x},${surfaceY + ty},${z}`] = "log";
            }
            // 葉っぱを乗せる
            for (let lx = -1; lx <= 1; lx++) {
                for (let lz = -1; lz <= 1; lz++) {
                    for (let ly = 3; ly <= 5; ly++) {
                        if (!worldData[`${x+lx},${surfaceY+ly},${z+lz}`]) {
                            worldData[`${x+lx},${surfaceY+ly},${z+lz}`] = "leaves";
                        }
                    }
                }
            }
        }

        // 🎲 モブをスポーン
        if (Math.random() < 0.01) {
            const mobType = Math.random() > 0.4 ? "pig" : "zombie";
            spawnMob(mobType, x, surfaceY + 1, z);
        }
    }

    const dummy = new THREE.Object3D();
    function updateChunks() {
        const px = Math.floor(camera.position.x);
        const py = Math.floor(camera.position.y);
        const pz = Math.floor(camera.position.z);
        
        Object.keys(instancedMeshes).forEach(type => { if(instancedMeshes[type]) instancedMeshes[type].count = 0; });

        for (let x = px - RADIUS; x <= px + RADIUS; x++) {
            for (let z = pz - RADIUS; z <= pz + RADIUS; z++) {
                generateWorldDataAt(x, z);
                for (let y = py - 6; y <= py + 6; y++) {
                    const type = worldData[`${x},${y},${z}`];
                    if (type && instancedMeshes[type]) {
                        const mesh = instancedMeshes[type];
                        if (mesh.count < 15000) {
                            dummy.position.set(x, y, z);
                            dummy.updateMatrix();
                            mesh.setMatrixAt(mesh.count, dummy.matrix);
                            mesh.count++;
                        }
                    }
                }
            }
        }
        Object.keys(instancedMeshes).forEach(type => { if(instancedMeshes[type]) instancedMeshes[type].instanceMatrix.needsUpdate = true; });
    }

    // 6. 操作の設定
    let isDragging = false; let previousMousePosition = { x: 0, y: 0 };
    let rotationY = 0; let rotationX = 0;

    window.addEventListener('mousedown', (e) => { if(isScreenOpen) return; isDragging = true; previousMousePosition = { x: e.clientX, y: e.clientY }; });
    window.addEventListener('mousemove', (e) => {
        if (!isDragging || isScreenOpen) return;
        rotationY -= (e.clientX - previousMousePosition.x) * 0.007; // カメラの感度を少しなめらかに
        rotationX -= (e.clientY - previousMousePosition.y) * 0.007;
        rotationX = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, rotationX));
        camera.rotation.set(rotationX, rotationY, 0, "YXZ");
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener('mouseup', () => { isDragging = false; });

    window.addEventListener('wheel', (e) => {
        if(isScreenOpen) return;
        selectedSlot = e.deltaY > 0 ? (selectedSlot + 1) % 9 : (selectedSlot - 1 + 9) % 9;
        updateGameUI();
    }, { passive: true });

    const keys = { w: false, a: false, s: false, d: false };
    window.addEventListener('keydown', (e) => { 
        if(e.key.toLowerCase() === 'e') {
            isScreenOpen = !isScreenOpen;
            inventoryMenu.style.display = isScreenOpen ? 'block' : 'none';
            if(isScreenOpen) renderInventoryMenu();
            isDragging = false; return;
        }
        if(["1","2","3","4","5","6","7","8","9"].includes(e.key)) { selectedSlot = parseInt(e.key) - 1; updateGameUI(); return; }
        if(e.key === ' ' || e.code === 'Space') { if (isGrounded) { velocityY = JUMP_FORCE; isGrounded = false; } return; }
        const key = e.key.toLowerCase(); if(key in keys) keys[key] = true; 
    });
    window.addEventListener('keyup', (e) => { const key = e.key.toLowerCase(); if(key in keys) keys[key] = false; });

    // 7. ブロックの破壊・設置＆モブ攻撃
    const raycaster = new THREE.Raycaster(); const screenCenter = new THREE.Vector2(0, 0);
    window.addEventListener('pointerdown', (e) => {
        if(isScreenOpen) return;
        raycaster.setFromCamera(screenCenter, camera);

        if (e.button === 0) {
            const mobIntersects = raycaster.intersectObjects(mobsArray, true);
            if (mobIntersects.length > 0 && mobIntersects[0].distance <= 5) {
                let hitMob = mobIntersects[0].object;
                while (hitMob.parent && hitMob.parent.type !== "Scene") { hitMob = hitMob.parent; }
                
                hitMob.userData.hp -= 2; 
                hitMob.position.y += 0.5; 
                
                if (hitMob.userData.hp <= 0) {
                    scene.remove(hitMob);
                    mobsArray.splice(mobsArray.indexOf(hitMob), 1);
                    alert(`💥 モブを倒した！`);
                }
                return;
            }
        }

        const activeMeshes = Object.values(instancedMeshes);
        const intersects = raycaster.intersectObjects(activeMeshes);
        
        if (intersects.length > 0 && intersects[0].distance <= 5) {
            const hit = intersects[0];
            const matrix = new THREE.Matrix4();
            hit.object.getMatrixAt(hit.instanceId, matrix);
            const pos = new THREE.Vector3().setFromMatrixPosition(matrix);
            
            const bx = Math.round(pos.x); const by = Math.round(pos.y); const bz = Math.round(pos.z);
            const blockKey = `${bx},${by},${bz}`;

            if (e.button === 0) { 
                if (worldData[blockKey] && worldData[blockKey] !== "bedrock") {
                    const droppedType = worldData[blockKey];
                    inventory[droppedType] = (inventory[droppedType] || 0) + 1;
                    delete worldData[blockKey];
                    updateChunks(); updateGameUI();
                }
            } else if (e.button === 2) { 
                const currentBuildType = hotbarSlots[selectedSlot];
                if (currentBuildType) {
                    const normal = hit.face.normal.clone();
                    const nx = bx + Math.round(normal.x);
                    const ny = by + Math.round(normal.y);
                    const nz = bz + Math.round(normal.z);
                    if (!worldData[`${nx},${ny},${nz}`]) {
                        // プレイヤーの足元に重なる場合は設置しない判定（めり込みバグ対策）
                        const pX = Math.floor(camera.position.x + 0.5);
                        const pZ = Math.floor(camera.position.z + 0.5);
                        const pY = Math.floor(camera.position.y - PLAYER_HEIGHT + 0.5);
                        if (!(nx === pX && nz === pZ && (ny === pY || ny === pY + 1))) {
                            worldData[`${nx},${ny},${nz}`] = currentBuildType;
                            updateChunks(); updateGameUI();
                        }
                    }
                }
            }
        }
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());
    updateChunks(); updateGameUI();

    // 8. メインループ
    function animate() {
        requestAnimationFrame(animate);
        
        if (!isScreenOpen) {
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); forward.y = 0; forward.normalize();
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion); right.y = 0; right.normalize();
            if (keys.w) camera.position.addScaledVector(forward, 0.12);
            if (keys.s) camera.position.addScaledVector(forward, -0.12);
            if (keys.a) camera.position.addScaledVector(right, -0.12);
            if (keys.d) camera.position.addScaledVector(right, 0.12);
        }
        
        // モブの移動
        mobsArray.forEach(mob => {
            mob.userData.walkTimer += 0.05;
            const speed = mob.userData.type === 'pig' ? 0.015 : 0.025; 
            
            if (mob.userData.type === "pig") {
                if (mob.userData.walkTimer > 5) {
                    mob.userData.walkTimer = 0;
                    mob.userData.dirX = (Math.random() - 0.5) * speed;
                    mob.userData.dirZ = (Math.random() - 0.5) * speed;
                }
                mob.position.x += mob.userData.dirX;
                mob.position.z += mob.userData.dirZ;
            } else {
                const dx = camera.position.x - mob.position.x;
                const dz = camera.position.z - mob.position.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist < 15) { 
                    mob.position.x += (dx / dist) * speed;
                    mob.position.z += (dz / dist) * speed;
                }
            }

            const mx = Math.round(mob.position.x);
            const mz = Math.round(mob.position.z);
            let mobGroundY = 4;
            for (let my = 10; my >= -4; my--) {
                if (worldData[`${mx},${my},${mz}`]) { mobGroundY = my; break; }
            }
            mob.position.y = mobGroundY + 0.5;
        });

        // プレイヤーの重力と段差（衝突）判定の厳密化
        velocityY -= GRAVITY; camera.position.y += velocityY;
        
        const pX = Math.round(camera.position.x); 
        const pZ = Math.round(camera.position.z);
        let highestGroundY = -99;
        
        // 足元のブロックを正しく探す
        for (let checkY = Math.floor(camera.position.y); checkY >= -5; checkY--) {
            if (worldData[`${pX},${checkY},${pZ}`]) { 
                highestGroundY = checkY; 
                break; 
            }
        }
        
        const groundThreshold = highestGroundY + 0.5 + PLAYER_HEIGHT;
        
        // 1段勝手に登るバグを防止する厳密な接地判定
        if (camera.position.y <= groundThreshold) { 
            camera.position.y = groundThreshold; 
            velocityY = 0; 
            isGrounded = true; 
        } else { 
            isGrounded = false; 
        }

        updateChunks();
        updateGameUI(); // 座標UIの更新タイミングをループ内に変更してリアルタイム化
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
}

function setupStartButton() {
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.onclick = () => {
            const screen = document.getElementById('startScreen');
            if (screen) screen.style.display = 'none'; 
            initGame(); 
        };
    }
}

const checkThreeLoaded = setInterval(() => { 
    if (typeof THREE !== 'undefined' && document.getElementById('startBtn')) { 
        clearInterval(checkThreeLoaded); 
        setupStartButton();
    } 
}, 50);
