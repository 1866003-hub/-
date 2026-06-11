// 1. 基本セットアップ
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(30, 12, 30); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 画面中央の「＋」マーク
const crosshair = document.createElement('div');
crosshair.style.position = 'absolute'; crosshair.style.top = '50%'; crosshair.style.left = '50%';
crosshair.style.width = '10px'; crosshair.style.height = '10px'; crosshair.style.background = 'white';
crosshair.style.transform = 'translate(-50%, -50%)'; crosshair.style.borderRadius = '50%'; crosshair.style.pointerEvents = 'none';
document.body.appendChild(crosshair);

// UIのセットアップ
const heightUI = document.createElement('div');
heightUI.style.position = 'absolute'; heightUI.style.bottom = '85px'; heightUI.style.left = '20px';
heightUI.style.color = '#00FF00'; heightUI.style.fontSize = '18px'; heightUI.style.fontFamily = 'monospace';
heightUI.style.textShadow = '2px 2px 2px black'; document.body.appendChild(heightUI);

const infoText = document.createElement('div');
infoText.style.position = 'absolute'; infoText.style.top = '15px'; infoText.style.width = '100%'; infoText.style.textAlign = 'center';
infoText.style.color = 'white'; infoText.style.fontSize = '15px'; infoText.style.fontFamily = 'sans-serif'; infoText.style.textShadow = '1px 1px 3px black';
infoText.innerHTML = '⚙️ 地面完全復活！ / 【E】キーでインベントリ開閉 / かまど右クリックで精錬 / 【1〜9】スロット選択';
document.body.appendChild(infoText);

// --- ホットバーUI（9スロット） ---
const hotbarContainer = document.createElement('div');
hotbarContainer.style.position = 'absolute'; hotbarContainer.style.bottom = '20px'; hotbarContainer.style.left = '50%';
hotbarContainer.style.transform = 'translateX(-50%)'; hotbarContainer.style.display = 'flex'; hotbarContainer.style.gap = '5px';
hotbarContainer.style.background = 'rgba(0,0,0,0.5)'; hotbarContainer.style.padding = '5px'; hotbarContainer.style.borderRadius = '5px';
document.body.appendChild(hotbarContainer);

const slotTypes = ["log", "plank", "stone", "furnace", "raw_meat", "cooked_meat", "iron_ingot", "gold_ingot", "diamond"];
const slotNames = ["🪵原木", "🪵板材", "🪨石", "🔥炉", "🍖生肉", "🥩焼肉", "🪙鉄ｲﾝｺﾞ", "🪙金ｲﾝｺﾞ", "💎ダ"];
const slotsUI = [];

for(let i=0; i<9; i++) {
    const slot = document.createElement('div');
    slot.style.width = '52px'; slot.style.height = '52px'; slot.style.border = '3px solid #8b8b8b';
    slot.style.background = 'rgba(139,139,139,0.3)'; slot.style.display = 'flex'; slot.style.flexDirection = 'column';
    slot.style.alignItems = 'center'; slot.style.justifyContent = 'center'; slot.style.color = 'white';
    slot.style.fontFamily = 'sans-serif'; slot.style.fontSize = '10px'; hotbarContainer.appendChild(slot); slotsUI.push(slot);
}

// --- 3x3クラフト＆インベントリ画面UI ---
const craftMenu = document.createElement('div');
craftMenu.style.position = 'absolute'; craftMenu.style.top = '50%'; craftMenu.style.left = '50%'; craftMenu.style.transform = 'translate(-50%, -50%)';
craftMenu.style.width = '350px'; craftMenu.style.background = 'rgba(40, 40, 40, 0.95)'; craftMenu.style.border = '4px solid #fff';
craftMenu.style.padding = '15px'; craftMenu.style.color = 'white'; craftMenu.style.fontFamily = 'sans-serif'; craftMenu.style.display = 'none'; craftMenu.style.zIndex = '100';
document.body.appendChild(craftMenu);

craftMenu.innerHTML = `
    <h3 style="margin-top:0; text-align:center; color:#FFD700;">🎒 3x3 クラフトインベントリ</h3>
    <div style="display:flex; justify-content:center; gap:15px; margin-bottom:15px;">
        <div style="display:grid; grid-template-columns: repeat(3, 45px); gap:5px;" id="craftGrid"></div>
        <div style="display:flex; align-items:center; font-size:24px;">➔</div>
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center;">
            <div id="craftOutput" style="width:50px; height:50px; border:3px dashed #FFD700; background:rgba(255,215,0,0.1); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold;">空</div>
            <button id="btnExecuteCraft" style="margin-top:8px; padding:3px 8px; font-size:12px;">作成</button>
        </div>
    </div>
    <div style="background:rgba(0,0,0,0.4); padding:8px; border-radius:5px; font-size:11px; line-height:1.4;">
        <strong>📖 本家レシピの並べ方（マスをクリックで配置/回収）:</strong><br>
        ・🪵板材x4 ➔ 【原木】をどこか1マスだけに置く<br>
        ・⛏️石ツルハシ ➔ 【一番上の横3マス】に【石】を並べる<br>
        ・🔥かまど ➔ 【真ん中以外の周り8マス】に【石】を並べる
    </div>
`;

const craftMatrix = [null, null, null, null, null, null, null, null, null];
const gridContainer = document.getElementById('craftGrid');
for (let i = 0; i < 9; i++) {
    const btn = document.createElement('button');
    btn.style.width = '45px'; btn.style.height = '45px'; btn.style.background = '#555'; btn.style.border = '2px solid #8b8b8b';
    btn.style.color = 'white'; btn.style.fontSize = '11px'; btn.style.cursor = 'pointer'; btn.innerText = "空";
    btn.addEventListener('click', () => handleGridClick(i)); gridContainer.appendChild(btn);
}

// --- かまど（精錬）画面UI ---
const furnaceMenu = document.createElement('div');
furnaceMenu.style.position = 'absolute'; furnaceMenu.style.top = '50%'; furnaceMenu.style.left = '50%'; furnaceMenu.style.transform = 'translate(-50%, -50%)';
furnaceMenu.style.width = '280px'; furnaceMenu.style.background = 'rgba(30, 30, 30, 0.95)'; furnaceMenu.style.border = '4px solid #FF4500';
furnaceMenu.style.padding = '15px'; furnaceMenu.style.color = 'white'; furnaceMenu.style.fontFamily = 'sans-serif'; furnaceMenu.style.display = 'none'; furnaceMenu.style.zIndex = '101';
document.body.appendChild(furnaceMenu);

furnaceMenu.innerHTML = `
    <h3 style="margin-top:0; text-align:center; color:#FF4500;">🔥 かまど精錬システム</h3>
    <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:15px;">
        <button id="btnCookMeat" style="padding:6px; font-size:12px; background:#FF4500; color:white; border:none; cursor:pointer;">🍖生肉を焼く ➔ 🥩ステーキ</button>
        <button id="btnSmeltIron" style="padding:6px; font-size:12px; background:#708090; color:white; border:none; cursor:pointer;">🪨鉄鉱石を焼く ➔ 🪙鉄インゴット</button>
        <button id="btnSmeltGold" style="padding:6px; font-size:12px; background:#DAA520; color:white; border:none; cursor:pointer;">🪨金鉱石を焼く ➔ 🪙金インゴット</button>
    </div>
    <button id="btnCloseFurnace" style="width:100%; padding:4px;">閉じる</button>
`;

// 2. ライトとマテリアル設定
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6); dirLight.position.set(20, 60, 20); scene.add(dirLight);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const mats = {
    grass:       new THREE.MeshLambertMaterial({ color: 0x556B2F }),
    dirt:        new THREE.MeshLambertMaterial({ color: 0x8B4513 }),
    stone:       new THREE.MeshLambertMaterial({ color: 0x808080 }),
    iron:        new THREE.MeshLambertMaterial({ color: 0xD2B48C }), 
    gold:        new THREE.MeshLambertMaterial({ color: 0xFFD700 }), 
    diamond:     new THREE.MeshLambertMaterial({ color: 0x00FFFF }),
    bedrock:     new THREE.MeshLambertMaterial({ color: 0x111111 }),
    log:         new THREE.MeshLambertMaterial({ color: 0x5c4033 }),
    leaves:      new THREE.MeshLambertMaterial({ color: 0x228b22 }),
    furnace:     new THREE.MeshLambertMaterial({ color: 0x4F4F4F }), 
    sand:        new THREE.MeshLambertMaterial({ color: 0xEDC9AF }),
    water:       new THREE.MeshLambertMaterial({ color: 0x1E90FF, transparent: true, opacity: 0.6 }),
    pig:         new THREE.MeshLambertMaterial({ color: 0xFFC0CB }), 
    zombie:      new THREE.MeshLambertMaterial({ color: 0x2E8B57 })  
};

const handGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.8);
const matHand = new THREE.MeshLambertMaterial({ color: 0xbc9374 });
const handMesh = new THREE.Mesh(handGeometry, matHand); handMesh.position.set(0.5, -0.4, -0.8); camera.add(handMesh); scene.add(camera);

// 4. ゲームデータ管理
const worldData = {}; const blockHP = {}; const activeBlocks = {}; const allBlocksArray = []; 
const WORLD_SIZE = 60; const Y_MIN = -100; const Y_MAX = 100; const SEA_LEVEL = 4;
const blockMaxHP = { grass:1, dirt:1, stone:6, iron:6, gold:15, diamond:15, bedrock:99999, log:3, leaves:1, furnace:6, sand:1, water:1 };

const inventory = { log: 0, plank: 0, stone: 0, furnace: 0, raw_meat: 0, cooked_meat: 0, iron_ingot: 0, gold_ingot: 0, diamond: 0, iron_ore: 0, gold_ore: 0 };
let selectedSlot = 0; let playerTool = "👊 素手"; let playerPower = 1;

const mobsArray = []; const dropsArray = [];
function spawnMob(type, x, y, z) {
    const mobGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8); const mobMesh = new THREE.Mesh(mobGeo, mats[type]);
    mobMesh.position.set(x, y + 0.4, z); mobMesh.userData = { type: type, hp: (type === "zombie" ? 3 : 1), walkTimer: 0, dirX: 0, dirZ: 0 };
    scene.add(mobMesh); mobsArray.push(mobMesh);
}
function spawnDropItem(type, position) {
    const dropGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3); const dropMesh = new THREE.Mesh(dropGeo, mats[type]);
    dropMesh.position.copy(position); dropMesh.userData = { type: type }; scene.add(dropMesh); dropsArray.push(dropMesh);
}

function updateGameUI() {
    let biomeName = "🌾 草原"; const px = Math.floor(camera.position.x); const pz = Math.floor(camera.position.z);
    if (px < 25 && pz < 25) biomeName = "🌳 森林"; else if (px >= 45) biomeName = "⏳ 砂漠"; else if (pz >= 45) biomeName = "🌊 海";
    if (pz >= 20 && pz <= 24 && px < 45) biomeName = "🏞️ 川";

    heightUI.innerHTML = `高度 (Y): ${Math.floor(camera.position.y)} | バイオーム: ${biomeName} | 装備: ${playerTool}<br><span style="font-size:12px; color:#aaa;">(未精錬ストック ➔ 🪨鉄鉱石: ${inventory.iron_ore} | 🪨金鉱石: ${inventory.gold_ore})</span>`;
    
    for(let i=0; i<9; i++) {
        const type = slotTypes[i];
        slotsUI[i].innerHTML = `<div>${slotNames[i]}</div><div style="font-weight:bold; font-size:13px; margin-top:2px;">${inventory[type] || 0}</div>`;
        slotsUI[i].style.border = (i === selectedSlot) ? '3px solid #FFFF00' : '3px solid #8b8b8b';
        slotsUI[i].style.background = (i === selectedSlot) ? 'rgba(255,255,0,0.2)' : 'rgba(139,139,139,0.3)';
    }
}

// 【バグ完全修正】ワールド＆モブ生成ループ
for (let x = 0; x < WORLD_SIZE; x++) {
    for (let z = 0; z < WORLD_SIZE; z++) {
        let biome = "grassland"; let surfaceY = 5;
        if (x >= 45) { biome = "desert"; surfaceY = 6; }
        else if (x < 25 && z < 25) { biome = "forest"; surfaceY = 5; }
        else if (z >= 45) { biome = "ocean"; surfaceY = 1; }
        if (z >= 20 + Math.sin(x*0.2)*2 && z <= 24 + Math.sin(x*0.2)*2 && x < 45) { biome = "river"; surfaceY = 1; }

        for (let y = surfaceY; y >= Y_MIN; y--) {
            let type = null;
            if (y === Y_MIN) type = "bedrock";
            else if (y > surfaceY && y <= SEA_LEVEL && (biome === "ocean" || biome === "river")) type = "water";
            else if (y === surfaceY) type = (biome === "desert" || biome === "ocean" || biome === "river") ? "sand" : "grass";
            else if (y < surfaceY && y > surfaceY - 3) type = (biome === "desert") ? "sand" : "dirt";
            else if (y <= surfaceY - 3) {
                const rand = Math.random();
                if (y >= -30) type = (rand < 0.04) ? "iron" : "stone";
                else type = (rand < 0.02) ? "diamond" : (rand < 0.03 ? "gold" : "stone");
            }
            if (type) { const key = `${x},${y},${z}`; worldData[key] = type; blockHP[key] = blockMaxHP[type]; }
        }

        // 木の生成
        if (biome === "forest" && Math.random() < 0.08) {
            for (let h = 1; h <= 3; h++) { worldData[`${x},${surfaceY + h},${z}`] = "log"; blockHP[`${x},${surfaceY + h},${z}`] = blockMaxHP["log"]; }
            const leafY = surfaceY + 4; for (let lx = -1; lx <= 1; lx++) { for (let lz = -1; lz <= 1; lz++) { for (let ly = 0; ly <= 1; ly++) { const leafKey = `${x + lx},${leafY + ly},${z + lz}`; if (!worldData[leafKey]) { worldData[leafKey] = "leaves"; blockHP[leafKey] = blockMaxHP["leaves"]; } } } }
        }

        // モブ配置のバグを修正（代入を比較演算子 '===' に！）
        if (Math.random() < 0.015 && biome !== "ocean" && biome !== "river") {
            if (biome === "desert") spawnMob("zombie", x, surfaceY, z); 
            else spawnMob("pig", x, surfaceY, z);
        }
    }
}

function updateChunks() {
    const px = Math.floor(camera.position.x); const py = Math.floor(camera.position.y); const pz = Math.floor(camera.position.z);
    const r = 5; const currentKeys = {};
    for (let x = px - r; x <= px + r; x++) {
        for (let y = py - r; y <= py + r; y++) {
            for (let z = pz - r; z <= pz + r; z++) {
                const key = `${x},${y},${z}`;
                if (worldData[key]) {
                    currentKeys[key] = true;
                    if (!activeBlocks[key]) {
                        const block = new THREE.Mesh(geometry, mats[worldData[key]]);
                        block.position.set(x, y, z); block.name = worldData[key]; block.userData = { key: key };
                        scene.add(block); activeBlocks[key] = block; allBlocksArray.push(block);
                    }
                }
            }
        }
    }
    for (const key in activeBlocks) { if (!currentKeys[key]) { scene.remove(activeBlocks[key]); const index = allBlocksArray.indexOf(activeBlocks[key]); if (index > -1) allBlocksArray.splice(index, 1); delete activeBlocks[key]; } }
}

function handleGridClick(index) {
    if (craftMatrix[index] === null) {
        const type = slotTypes[selectedSlot];
        if (["log", "stone"].includes(type) && inventory[type] > 0) { craftMatrix[index] = type; inventory[type]--; }
    } else {
        const type = craftMatrix[index]; inventory[type]++; craftMatrix[index] = null;
    }
    checkCraftRecipe(); updateGameUI();
}

function checkCraftRecipe() {
    const grid = document.getElementById('craftGrid').children;
    for(let i=0; i<9; i++) grid[i].innerText = craftMatrix[i] ? (craftMatrix[i] === "log" ? "🪵" : "🪨") : "空";
    const out = document.getElementById('craftOutput');
    const nonNulls = craftMatrix.filter(x => x !== null);
    
    if (nonNulls.length === 1 && nonNulls[0] === "log") { out.innerText = "🪵板材x4"; return; }
    if (craftMatrix[0] === "stone" && craftMatrix[1] === "stone" && craftMatrix[2] === "stone" &&
        craftMatrix[3] === null && craftMatrix[4] === null && craftMatrix[5] === null &&
        craftMatrix[6] === null && craftMatrix[7] === null && craftMatrix[8] === null) { out.innerText = "⛏️石ツルハシ"; return; }
    if (craftMatrix[0] === "stone" && craftMatrix[1] === "stone" && craftMatrix[2] === "stone" &&
        craftMatrix[3] === "stone" && craftMatrix[4] === null    && craftMatrix[5] === "stone" &&
        craftMatrix[6] === "stone" && craftMatrix[7] === "stone" && craftMatrix[8] === "stone") { out.innerText = "🔥かまどx1"; return; }
    out.innerText = "空";
}

document.getElementById('btnExecuteCraft').addEventListener('click', () => {
    const result = document.getElementById('craftOutput').innerText; if (result === "空") return;
    if (result === "🪵板材x4") inventory.plank += 4;
    else if (result === "⛏️石ツルハシ") { playerTool = "🪨石ツルハシ"; playerPower = 3; alert("⛏️ 石のツルハシを作った！(採掘力3倍)"); }
    else if (result === "🔥かまどx1") inventory.furnace += 1;
    for(let i=0; i<9; i++) craftMatrix[i] = null; checkCraftRecipe(); updateGameUI();
});

document.getElementById('btnCookMeat').addEventListener('click', () => {
    if (inventory.raw_meat >= 1) { inventory.raw_meat--; inventory.cooked_meat++; updateGameUI(); alert("🥩 ステーキが焼き上がった！"); }
    else { alert("❌ 生肉がありません！"); }
});
document.getElementById('btnSmeltIron').addEventListener('click', () => {
    if (inventory.iron_ore >= 1) { inventory.iron_ore--; inventory.iron_ingot++; updateGameUI(); alert("🪙 鉄鉱石を精錬して【鉄インゴット】を作った！"); }
    else { alert("❌ 鉄鉱石がありません！"); }
});
document.getElementById('btnSmeltGold').addEventListener('click', () => {
    if (inventory.gold_ore >= 1) { inventory.gold_ore--; inventory.gold_ingot++; updateGameUI(); alert("🪙 金鉱石を精錬して【金インゴット】を作った！"); }
    else { alert("❌ 金鉱石がありません！"); }
});
document.getElementById('btnCloseFurnace').addEventListener('click', () => { furnaceMenu.style.display = 'none'; isFurnaceOpen = false; });

let isDragging = false; let previousMousePosition = { x: 0, y: 0 };
let rotationY = 0; let rotationX = 0; let isCraftOpen = false; let isFurnaceOpen = false;

window.addEventListener('mousedown', (e) => { if(isCraftOpen || isFurnaceOpen) return; isDragging = true; previousMousePosition = { x: e.clientX, y: e.clientY }; });
window.addEventListener('mousemove', (e) => {
    if (!isDragging || isCraftOpen || isFurnaceOpen) return;
    const deltaX = e.clientX - previousMousePosition.x; const deltaY = e.clientY - previousMousePosition.y;
    rotationY -= deltaX * 0.015; rotationX -= deltaY * 0.015;
    rotationX = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, rotationX));
    camera.rotation.set(rotationX, rotationY, 0, "YXZ"); previousMousePosition = { x: e.clientX, y: e.clientY };
});
window.addEventListener('mouseup', () => { isDragging = false; });

const keys = { w: false, a: false, s: false, d: false, q: false, e: false };
window.addEventListener('keydown', (e) => { 
    if(e.key.toLowerCase() === 'e') { isCraftOpen = !isCraftOpen; craftMenu.style.display = isCraftOpen ? 'block' : 'none'; furnaceMenu.style.display = 'none'; isFurnaceOpen = false; checkCraftRecipe(); isDragging = false; return; }
    if(["1","2","3","4","5","6","7","8","9"].includes(e.key)) { selectedSlot = parseInt(e.key) - 1; updateGameUI(); return; }
    const key = e.key.toLowerCase(); if(key in keys) keys[key] = true; 
});
window.addEventListener('keyup', (e) => { const key = e.key.toLowerCase(); if(key in keys) keys[key] = false; });

let handSwingTimer = 0; let isSwinging = false;
const raycaster = new THREE.Raycaster(); const screenCenter = new THREE.Vector2(0, 0);

window.addEventListener('contextmenu', (e) => { e.preventDefault(); });
window.addEventListener('pointerdown', (e) => {
    if(isCraftOpen || isFurnaceOpen) return;
    isSwinging = true; handSwingTimer = 0;
    raycaster.setFromCamera(screenCenter, camera);

    const mobIntersects = raycaster.intersectObjects(mobsArray);
    if (mobIntersects.length > 0 && mobIntersects[0].distance <= 5 && e.button === 0) {
        const hitMob = mobIntersects[0].object; hitMob.userData.hp -= 1; hitMob.position.y += 0.5;
        if (hitMob.userData.hp <= 0) { if (hitMob.userData.type === "pig") spawnDropItem("raw_meat", hitMob.position); scene.remove(hitMob); mobsArray.splice(mobsArray.indexOf(hitMob), 1); }
        return;
    }

    const intersects = raycaster.intersectObjects(allBlocksArray);
    if (intersects.length > 0 && intersects[0].distance <= 5) {
        const hit = intersects[0]; const hitBlock = hit.object; const blockKey = hitBlock.userData.key;

        if (e.button === 0) {
            if (hitBlock.name !== "bedrock") {
                blockHP[blockKey] -= playerPower;
                if (blockHP[blockKey] <= 0) {
                    let dropType = hitBlock.name; if (dropType === "grass") dropType = "dirt";
                    if (dropType === "iron") { inventory.iron_ore++; alert("🪨 鉄鉱石をゲット！"); }
                    else if (dropType === "gold") { inventory.gold_ore++; alert("🪨 金鉱石をゲット！"); }
                    else if (dropType !== "leaves") { inventory[dropType] = (inventory[dropType] || 0) + 1; }
                    scene.remove(hitBlock); allBlocksArray.splice(allBlocksArray.indexOf(hitBlock), 1);
                    delete activeBlocks[blockKey]; delete worldData[blockKey]; updateGameUI();
                }
            }
        } else if (e.button === 2) {
            if (hitBlock.name === "furnace") { isFurnaceOpen = true; furnaceMenu.style.display = 'block'; isDragging = false; }
            else {
                const currentBuildType = slotTypes[selectedSlot];
                if (inventory[currentBuildType] > 0) {
                    const normal = hit.face.normal; const newPos = hitBlock.position.clone().add(normal);
                    const newKey = `${newPos.x},${newPos.y},${newPos.z}`;
                    if (newPos.y <= Y_MAX && newPos.y >= Y_MIN) {
                        worldData[newKey] = currentBuildType; blockHP[newKey] = blockMaxHP[currentBuildType];
                        inventory[currentBuildType]--; updateChunks(); updateGameUI();
                    }
                }
            }
        }
    }
});

const playerSpeed = 0.15;
function animate() {
    requestAnimationFrame(animate);
    if (isSwinging) {
        handSwingTimer += 0.2; handMesh.position.z = -0.8 + Math.sin(handSwingTimer) * 0.15; handMesh.position.y = -0.4 + Math.cos(handSwingTimer) * 0.05;
        if (handSwingTimer > Math.PI) { isSwinging = false; handMesh.position.set(0.5, -0.4, -0.8); }
    }
    if (!isCraftOpen && !isFurnaceOpen) {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion); forward.y = 0; forward.normalize();
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion); right.y = 0; right.normalize();
        if (keys.w) camera.position.addScaledVector(forward, playerSpeed); if (keys.s) camera.position.addScaledVector(forward, -playerSpeed);
        if (keys.a) camera.position.addScaledVector(right, -playerSpeed); if (keys.d) camera.position.addScaledVector(right, playerSpeed);
        if (keys.q) camera.position.y += playerSpeed; if (keys.e) camera.position.y -= playerSpeed;
    }

    mobsArray.forEach(mob => {
        mob.userData.walkTimer += 0.05;
        if (mob.userData.type === "pig") {
            if (mob.userData.walkTimer > 5) { mob.userData.walkTimer = 0; mob.userData.dirX = (Math.random() - 0.5) * 0.03; mob.userData.dirZ = (Math.random() - 0.5) * 0.03; }
            mob.position.x += mob.userData.dirX; mob.position.z += mob.userData.dirZ;
        } else if (mob.userData.type === "zombie") {
            const dx = camera.position.x - mob.position.x; const dz = camera.position.z - mob.position.z; const dist = Math.sqrt(dx*dx + dz*dz);
            if (dist < 15) { mob.position.x += (dx / dist) * 0.02; mob.position.z += (dz / dist) * 0.02; }
        }
        if(mob.position.y > 5.4) mob.position.y -= 0.05;
    });

    for (let i = dropsArray.length - 1; i >= 0; i--) {
        const drop = dropsArray[i]; const dx = camera.position.x - drop.position.x; const dy = camera.position.y - drop.position.y; const dz = camera.position.z - drop.position.z; const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist < 4) { drop.position.x += (dx / dist) * 0.15; drop.position.y += (dy / dist) * 0.15; drop.position.z += (dz / dist) * 0.15; if (dist < 0.8) { inventory[drop.userData.type]++; scene.remove(drop); dropsArray.splice(i, 1); updateGameUI(); } }
    }

    updateChunks(); updateGameUI(); renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
