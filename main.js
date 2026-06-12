// ==========================================
// 0. 安全装置：Three.js の読み込みを監視
// ==========================================
function initGame() {
    document.body.innerHTML = '';
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.backgroundColor = '#87CEEB';

    // ==========================================
    // 1. 基本セットアップ
    // ==========================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); 
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.015); 

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(25, 12, 25); 

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" }); 
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 照準（クロスヘア）
    const crosshair = document.createElement('div');
    crosshair.style.position = 'absolute'; crosshair.style.top = '50%'; crosshair.style.left = '50%';
    crosshair.style.width = '12px'; crosshair.style.height = '12px';
    crosshair.style.border = '2px solid white';
    crosshair.style.transform = 'translate(-50%, -50%)'; crosshair.style.pointerEvents = 'none';
    document.body.appendChild(crosshair);

    // 高度・バイオームUI
    const heightUI = document.createElement('div');
    heightUI.style.position = 'absolute'; heightUI.style.bottom = '90px'; heightUI.style.left = '20px';
    heightUI.style.color = '#FFF'; heightUI.style.fontSize = '16px'; heightUI.style.fontFamily = 'monospace';
    heightUI.style.textShadow = '2px 2px 2px black'; document.body.appendChild(heightUI);

    // 操作説明
    const infoText = document.createElement('div');
    infoText.style.position = 'absolute'; infoText.style.top = '15px'; infoText.style.width = '100%'; infoText.style.textAlign = 'center';
    infoText.style.color = 'white'; infoText.style.fontSize = '15px'; infoText.style.fontFamily = 'sans-serif'; infoText.style.textShadow = '1px 1px 3px black';
    infoText.innerHTML = '🎒【E】インベントリ開閉 | マウスホイールでスロット選択 | チェストを置いて右クリックで収納！';
    document.body.appendChild(infoText);

    // ==========================================
    // 2. テクスチャ読み込みと最適化設定
    // ==========================================
    const textureLoader = new THREE.TextureLoader();
    function loadMcTexture(url) {
        const tex = textureLoader.load(url);
        tex.magFilter = THREE.NearestFilter; 
        tex.minFilter = THREE.NearestFilter;
        return tex;
    }

    const texGrass = loadMcTexture('https://raw.githubusercontent.com/VoxelSaga/Assets/main/textures/blocks/grass_side.png');
    const texGrassTop = loadMcTexture('https://raw.githubusercontent.com/VoxelSaga/Assets/main/textures/blocks/grass_top.png');
    const texDirt = loadMcTexture('https://raw.githubusercontent.com/VoxelSaga/Assets/main/textures/blocks/dirt.png');
    const texStone = loadMcTexture('https://raw.githubusercontent.com/VoxelSaga/Assets/main/textures/blocks/stone.png');
    const texIron = loadMcTexture('https://raw.githubusercontent.com/VoxelSaga/Assets/main/textures/blocks/iron_ore.png');
    const texDiamond = loadMcTexture('https://raw.githubusercontent.com/VoxelSaga/Assets/main/textures/blocks/diamond_ore.png');
    const texBedrock = loadMcTexture('https://raw.githubusercontent.com/VoxelSaga/Assets/main/textures/blocks/bedrock.png');
    const texLog = loadMcTexture('https://raw.githubusercontent.com/VoxelSaga/Assets/main/textures/blocks/log_oak.png');
    const texLogTop = loadMcTexture('https://raw.githubusercontent.com/VoxelSaga/Assets/main/textures/blocks/log_oak_top.png');
    const texLeaves = loadMcTexture('https://raw.githubusercontent.com/VoxelSaga/Assets/main/textures/blocks/leaves_oak.png');
    const texFurnace = loadMcTexture('https://raw.githubusercontent.com/VoxelSaga/Assets/main/textures/blocks/furnace_front_on.png');
    const texSand = loadMcTexture('https://raw.githubusercontent.com/VoxelSaga/Assets/main/textures/blocks/sand.png');
    const texSkin = loadMcTexture('https://raw.githubusercontent.com/VoxelSaga/Assets/main/textures/entity/steve.png');
    const texChest = loadMcTexture('https://raw.githubusercontent.com/VoxelSaga/Assets/main/textures/blocks/planks_oak.png');

    // ==========================================
    // 3. マテリアルの事前生成＆共通化（軽量化の肝）
    // ==========================================
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9); scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.3); dirLight.position.set(10, 40, 20); scene.add(dirLight);

    const mStd = (t) => new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 });
    const mColor = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 });

    const mats = {
        grass: [mStd(texGrass), mStd(texGrass), mStd(texGrassTop), mStd(texDirt), mStd(texGrass), mStd(texGrass)],
        log: [mStd(texLog), mStd(texLog), mStd(texLogTop), mStd(texLogTop), mStd(texLog), mStd(texLog)],
        dirt: mStd(texDirt), 
        stone: mStd(texStone), 
        iron: mStd(texIron), 
        diamond: mStd(texDiamond),
        bedrock: mStd(texBedrock), 
        leaves: new THREE.MeshStandardMaterial({ map: texLeaves, transparent: true, alphaTest: 0.3, roughness: 0.8 }),
        furnace: mStd(texFurnace), 
        sand: mStd(texSand), 
        water: new THREE.MeshStandardMaterial({ color: 0x3377FF, transparent: true, opacity: 0.6, roughness: 0.1 }),
        chest: mStd(texChest), 
        pig: mColor(0xFFB6C1), 
        zombie: mColor(0x556B2F)
    };

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const handMesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.8), mStd(texSkin)); 
    handMesh.position.set(0.45, -0.35, -0.7); camera.add(handMesh); scene.add(camera);

    let velocityY = 0; const GRAVITY = 0.03; const JUMP_FORCE = 0.35; let isGrounded = false; const PLAYER_HEIGHT = 1.6;
    let bobTimer = 0; let currentBobY = 0; let currentBobX = 0;

    // ==========================================
    // 4. アイテムデータ定義＆システム
    // ==========================================
    const ITEM_IDS = ["log", "plank", "stick", "stone", "iron", "iron_ingot", "diamond", "furnace", "chest", "raw_meat", "cooked_meat"];
    const ITEM_NAMES = { log:"原木", plank:"板材", stick:"棒", stone:"丸石", iron:"鉄鉱石", iron_ingot:"鉄インゴット", diamond:"ダイヤモンド", furnace:"かまど", chest:"チェスト", raw_meat:"生肉", cooked_meat:"ステーキ" };
    const ITEM_ICONS = { log:"🪵", plank:"📦", stick:"🥢", stone:"🪨", iron:"🪙", iron_ingot:"🔗", diamond:"💎", furnace:"🔥", chest:"🧳", raw_meat:"🍖", cooked_meat:"🥩" };

    const inventory = { log: 0, plank: 0, stick: 0, stone: 0, iron: 0, iron_ingot: 0, diamond: 0, furnace: 0, chest: 0, raw_meat: 0, cooked_meat: 0 };
    const hotbarSlots = [null, null, null, null, null, null, null, null, null];
    let selectedSlot = 0;
    let playerTool = "👊 素手"; let playerAttackPower = 1;

    const chestStorage = {}; 
    let currentOpenedChestKey = null; 

    // ==========================================
    // 5. UI構築
    // ==========================================
    const hotbarContainer = document.createElement('div');
    hotbarContainer.style.position = 'absolute'; hotbarContainer.style.bottom = '20px'; hotbarContainer.style.left = '50%';
    hotbarContainer.style.transform = 'translateX(-50%)'; hotbarContainer.style.display = 'flex'; hotbarContainer.style.gap = '5px';
    hotbarContainer.style.background = 'rgba(30,30,30,0.85)'; hotbarContainer.style.padding = '6px'; hotbarContainer.style.border = '3px solid #3c3c3c';
    document.body.appendChild(hotbarContainer);

    const slotsUI = [];
    for(let i=0; i<9; i++) {
        const slot = document.createElement('div');
        slot.style.width = '55px'; slot.style.height = '55px'; slot.style.border = '3px solid #8b8b8b';
        slot.style.background = 'rgba(0,0,0,0.4)'; slot.style.display = 'flex'; slot.style.flexDirection = 'column';
        slot.style.alignItems = 'center'; slot.style.justifyContent = 'center'; slot.style.color = 'white';
        slot.style.fontFamily = 'monospace'; slot.style.fontSize = '12px'; slot.style.cursor = 'pointer';
        hotbarContainer.appendChild(slot); slotsUI.push(slot);
    }

    const inventoryMenu = document.createElement('div');
    inventoryMenu.style.position = 'absolute'; inventoryMenu.style.top = '50%'; inventoryMenu.style.left = '50%'; inventoryMenu.style.transform = 'translate(-50%, -50%)';
    inventoryMenu.style.width = '500px'; inventoryMenu.style.background = 'rgba(40, 40, 40, 0.95)'; inventoryMenu.style.border = '4px solid #fff';
    inventoryMenu.style.padding = '20px'; inventoryMenu.style.color = 'white'; inventoryMenu.style.fontFamily = 'sans-serif'; inventoryMenu.style.display = 'none'; inventoryMenu.style.zIndex = '100';
    document.body.appendChild(inventoryMenu);

    const chestMenu = document.createElement('div');
    chestMenu.style.position = 'absolute'; chestMenu.style.top = '50%'; chestMenu.style.left = '50%'; chestMenu.style.transform = 'translate(-50%, -50%)';
    chestMenu.style.width = '420px'; chestMenu.style.background = 'rgba(45, 35, 25, 0.98)'; chestMenu.style.border = '4px solid #CD853F';
    chestMenu.style.padding = '20px'; chestMenu.style.color = 'white'; chestMenu.style.fontFamily = 'sans-serif'; chestMenu.style.display = 'none'; chestMenu.style.zIndex = '105';
    document.body.appendChild(chestMenu);

    const furnaceMenu = document.createElement('div');
    furnaceMenu.style.position = 'absolute'; furnaceMenu.style.top = '50%'; furnaceMenu.style.left = '50%'; furnaceMenu.style.transform = 'translate(-50%, -50%)';
    furnaceMenu.style.width = '280px'; furnaceMenu.style.background = 'rgba(30, 30, 30, 0.95)'; furnaceMenu.style.border = '4px solid #FF4500';
    furnaceMenu.style.padding = '15px'; furnaceMenu.style.color = 'white'; furnaceMenu.style.fontFamily = 'sans-serif'; furnaceMenu.style.display = 'none'; furnaceMenu.style.zIndex = '101';
    document.body.appendChild(furnaceMenu);
    furnaceMenu.innerHTML = `<h3 style="margin-top:0; text-align:center; color:#FF4500;">🔥 かまど精錬</h3><div style="display:flex; flex-direction:column; gap:8px; margin-bottom:15px;"><button id="btnCookMeat" style="padding:6px; background:#FF4500; color:white; border:none; cursor:pointer;">🍖生肉を焼く ➔ ステーキ</button><button id="btnSmeltIron" style="padding:6px; background:#708090; color:white; border:none; cursor:pointer;">🪙鉄鉱石を焼く ➔ 鉄インゴット</button></div><button id="btnCloseFurnace" style="width:100%; padding:4px;">閉じる</button>`;

    const craftMatrix = [null, null, null, null, null, null, null, null, null];
    let isScreenOpen = false;

    // ==========================================
    // 6. UIのレンダリング
    // ==========================================
    function renderInventoryMenu() {
        let html = `<h2 style="margin-top:0; text-align:center; color:#FFD700; font-size:18px;">🎒 インベントリ ＆ クラフト（3x3）</h2>`;
        html += `<div style="display:flex; justify-content:space-between; margin-bottom:20px;">`;
        html += `<div style="width:50%;"><h4>📦 所持品アイテム一覧</h4><div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:6px; max-height:200px; overflow-y:auto; padding-right:5px;">`;
        ITEM_IDS.forEach(id => {
            const count = inventory[id] || 0;
            html += `<div onclick="moveItemToHotbar('${id}')" style="background:#555; padding:6px; border:2px solid #777; border-radius:4px; display:flex; justify-content:between; align-items:center; cursor:pointer; font-size:13px;">
                <span>${ITEM_ICONS[id]} ${ITEM_NAMES[id]}</span>
                <span style="font-weight:bold; background:#222; padding:1px 6px; border-radius:3px; margin-left:auto;">${count}</span>
            </div>`;
        });
        html += `</div></div>`;
        html += `<div style="width:45%; border-left:2px solid #666; padding-left:15px;"><h4>🛠️ クラフト</h4>`;
        html += `<div style="display:flex; gap:10px; align-items:center;"><div style="display:grid; grid-template-columns: repeat(3, 40px); gap:4px;">`;
        for(let i=0; i<9; i++) {
            const itemId = craftMatrix[i];
            html += `<button onclick="handleCraftGridClick(${i})" style="width:40px; height:40px; background:#333; border:2px solid #8b8b8b; color:white; font-size:14px; cursor:pointer;">${itemId ? ITEM_ICONS[itemId] : "空"}</button>`;
        }
        html += `</div><div style="font-size:20px;">➔</div><div style="text-align:center;">`;
        html += `<div id="craftOutput" style="width:85px; height:45px; border:2px dashed #FFD700; background:rgba(255,215,0,0.1); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:bold; padding:2px; box-sizing:border-box;">空</div>`;
        html += `<button id="btnExecuteCraft" style="margin-top:5px; width:100%; padding:4px 0; font-size:12px; cursor:pointer;">作成</button>`;
        html += `</div></div></div></div>`;
        html += `<h4>👇 マウスホイールで使うホットバーの配置</h4>`;
        html += `<div style="display:grid; grid-template-columns: repeat(9, 1fr); gap:4px;">`;
        for(let i=0; i<9; i++) {
            const id = hotbarSlots[i];
            html += `<div onclick="removeSlotItem(${i})" style="height:45px; background:${i===selectedSlot?'#777':'#333'}; border:2px solid ${i===selectedSlot?'#fff':'#999'}; display:flex; justify-content:center; align-items:center; font-size:18px; cursor:pointer;">
                ${id ? ITEM_ICONS[id] : ""}
            </div>`;
        }
        html += `</div>`;
        
        inventoryMenu.innerHTML = html;
        document.getElementById('btnExecuteCraft').onclick = executeCraft;
        checkCraftRecipe();
    }

    function renderChestMenu() {
        const chestData = chestStorage[currentOpenedChestKey] || {};
        let html = `<h3 style="margin-top:0; text-align:center; color:#CD853F;">🧳 チェスト保管庫</h3>`;
        html += `<div style="display:flex; gap:15px; margin-bottom:15px;">`;
        html += `<div style="width:50%;"><h5>📥 チェストの中</h5><div style="display:grid; grid-template-columns:1fr; gap:4px; max-height:220px; overflow-y:auto;">`;
        ITEM_IDS.forEach(id => {
            html += `<div onclick="takeFromChest('${id}')" style="background:#5c4033; padding:6px; border:1px solid #8b5a2b; display:flex; justify-content:space-between; cursor:pointer; font-size:13px;">
                <span>${ITEM_ICONS[id]} ${ITEM_NAMES[id]}</span>
                <span style="font-weight:bold;">${chestData[id] || 0}個 ➔</span>
            </div>`;
        });
        html += `</div></div>`;
        html += `<div style="width:50%;"><h5>📤 自分の持ち物（クリックして預ける）</h5><div style="display:grid; grid-template-columns:1fr; gap:4px; max-height:220px; overflow-y:auto;">`;
        ITEM_IDS.forEach(id => {
            html += `<div onclick="putInChest('${id}')" style="background:#444; padding:6px; border:1px solid #666; display:flex; justify-content:space-between; cursor:pointer; font-size:13px;">
                <span>${ITEM_ICONS[id]} ${ITEM_NAMES[id]}</span>
                <span style="font-weight:bold; color:#FFD700;">${inventory[id] || 0}個</span>
            </div>`;
        });
        html += `</div></div>`;
        html += `</div>`;
        html += `<button id="btnCloseChest" style="width:100%; padding:6px; background:#CD853F; color:white; border:none; cursor:pointer; font-weight:bold;">チェストを閉じる</button>`;
        chestMenu.innerHTML = html;
        document.getElementById('btnCloseChest').onclick = () => { chestMenu.style.display='none'; isScreenOpen=false; currentOpenedChestKey=null; };
    }

    // ==========================================
    // 7. アイテムロジック
    // ==========================================
    window.moveItemToHotbar = function(id) {
        if (!inventory[id] || inventory[id] <= 0) return;
        let idx = hotbarSlots.indexOf(null);
        if (idx === -1) { idx = selectedSlot; if (hotbarSlots[idx]) inventory[hotbarSlots[idx]]++; }
        hotbarSlots[idx] = id; inventory[id]--;
        renderInventoryMenu(); updateGameUI();
    };

    window.removeSlotItem = function(index) {
        const id = hotbarSlots[index];
        if (id) { inventory[id]++; hotbarSlots[index] = null; renderInventoryMenu(); updateGameUI(); }
    };

    window.handleCraftGridClick = function(i) {
        if (craftMatrix[i] === null) {
            const currentHandId = hotbarSlots[selectedSlot];
            if (currentHandId && inventory[currentHandId] > 0) { craftMatrix[i] = currentHandId; inventory[currentHandId]--; } 
            else if (currentHandId && hotbarSlots[selectedSlot]) { craftMatrix[i] = currentHandId; hotbarSlots[selectedSlot] = null; }
        } else { inventory[craftMatrix[i]]++; craftMatrix[i] = null; }
        renderInventoryMenu(); updateGameUI();
    };

    window.putInChest = function(id) {
        if (inventory[id] > 0) {
            if (!chestStorage[currentOpenedChestKey]) chestStorage[currentOpenedChestKey] = {};
            chestStorage[currentOpenedChestKey][id] = (chestStorage[currentOpenedChestKey][id] || 0) + 1;
            inventory[id]--; renderChestMenu(); updateGameUI();
        }
    };

    window.takeFromChest = function(id) {
        const chestData = chestStorage[currentOpenedChestKey];
        if (chestData && chestData[id] > 0) { chestData[id]--; inventory[id] = (inventory[id] || 0) + 1; renderChestMenu(); updateGameUI(); }
    };

    function checkCraftRecipe() {
        const out = document.getElementById('craftOutput'); if(!out) return;
        const nonNulls = craftMatrix.filter(x => x !== null);
        if (nonNulls.length === 1 && nonNulls[0] === "log") { out.innerText = "📦板材x4"; return; }
        if (craftMatrix[1] === "plank" && craftMatrix[4] === "plank" && nonNulls.length === 2) { out.innerText = "🥢棒x4"; return; }
        if (craftMatrix[0] === "stone" && craftMatrix[1] === "stone" && craftMatrix[2] === "stone" && craftMatrix[4] === "stick" && craftMatrix[7] === "stick") { out.innerText = "⛏️石ツルハシ"; return; }
        if (craftMatrix[0] === "iron_ingot" && craftMatrix[1] === "iron_ingot" && craftMatrix[2] === "iron_ingot" && craftMatrix[4] === "stick" && craftMatrix[7] === "stick") { out.innerText = "⛏️鉄ツルハシ"; return; }
        if (craftMatrix[0] === "diamond" && craftMatrix[1] === "diamond" && craftMatrix[2] === "diamond" && craftMatrix[4] === "stick" && craftMatrix[7] === "stick") { out.innerText = "⛏️ダイヤツル"; return; }
        if (craftMatrix[1] === "stone" && craftMatrix[4] === "stone" && craftMatrix[7] === "stick") { out.innerText = "⚔️石の剣"; return; }
        if (craftMatrix[1] === "iron_ingot" && craftMatrix[4] === "iron_ingot" && craftMatrix[7] === "stick") { out.innerText = "⚔️鉄の剣"; return; }
        if (craftMatrix[1] === "diamond" && craftMatrix[4] === "diamond" && craftMatrix[7] === "stick") { out.innerText = "⚔️ダイヤの剣"; return; }
        if (craftMatrix[0] === "stone" && craftMatrix[1] === "stone" && craftMatrix[2] === "stone" && craftMatrix[3] === "stone" && craftMatrix[5] === "stone" && craftMatrix[6] === "stone" && craftMatrix[7] === "stone" && craftMatrix[8] === "stone" && nonNulls.length === 8) { out.innerText = "🔥かまどx1"; return; }
        if (craftMatrix[0] === "plank" && craftMatrix[1] === "plank" && craftMatrix[2] === "plank" && craftMatrix[3] === "plank" && craftMatrix[5] === "plank" && craftMatrix[6] === "plank" && craftMatrix[7] === "plank" && craftMatrix[8] === "plank" && nonNulls.length === 8) { out.innerText = "🧳チェストx1"; return; }
        out.innerText = "空";
    }

    function executeCraft() {
        const result = document.getElementById('craftOutput').innerText; if (result === "空") return;
        if (result === "📦板材x4") inventory.plank += 4;
        else if (result === "🥢棒x4") inventory.stick += 4;
        else if (result === "🔥かまどx1") inventory.furnace += 1;
        else if (result === "🧳チェストx1") inventory.chest += 1;
        else if (result === "⛏️石ツルハシ") { playerTool = "⛏️ 石ツルハシ"; playerAttackPower = 2.0; }
        else if (result === "⚔️石の剣") { playerTool = "⚔️ 石の剣"; playerAttackPower = 3.5; }
        else if (result === "⛏️鉄ツルハシ") { playerTool = "⛏️ 鉄ツルハシ"; playerAttackPower = 4.0; }
        else if (result === "⚔️鉄の剣") { playerTool = "⚔️ 鉄の剣"; playerAttackPower = 5.5; }
        else if (result === "⛏️ダイヤツル") { playerTool = "💎 ダイヤのツルハシ"; playerAttackPower = 7.0; }
        else if (result === "⚔️ダイヤの剣") { playerTool = "💎 ダイヤの剣"; playerAttackPower = 9.0; }
        for(let i=0; i<9; i++) craftMatrix[i] = null;
        renderInventoryMenu(); updateGameUI();
    }

    document.getElementById('btnCookMeat').onclick = () => { if (inventory.raw_meat >= 1) { inventory.raw_meat--; inventory.cooked_meat++; updateGameUI(); alert("🥩 ステーキを焼いた！"); } };
    document.getElementById('btnSmeltIron').onclick = () => { if (inventory.iron >= 1) { inventory.iron--; inventory.iron_ingot++; updateGameUI(); alert("🪙 鉄インゴットを精錬した！"); } };
    document.getElementById('btnCloseFurnace').onclick = () => { furnaceMenu.style.display = 'none'; isScreenOpen = false; };

    // ==========================================
    // 8. ワールドデータ・描画エンジン（劇的軽量化）
    // ==========================================
    const worldData = {}; const blockHP = {}; const activeBlocks = {}; const allBlocksArray = []; 
    const Y_MIN = -15; const Y_MAX = 15; const SEA_LEVEL = 4;
    const blockMaxHP = { grass:1, dirt:1, stone:4, iron:6, diamond:12, bedrock:99999, log:2, leaves:1, furnace:4, chest: 3, sand:1, water:1 };
    const mobsArray = []; const dropsArray = [];
    let lastChunkX = NaN, lastChunkY = NaN, lastChunkZ = NaN; 

    function generateBlockDataAt(x, z) {
        if (worldData[`${x},5,${z}`] !== undefined) return; 
        let biome = "grassland"; let surfaceY = 5; const seedValue = Math.sin(x * 0.05) * Math.cos(z * 0.05);
        if (seedValue > 0.4) { biome = "desert"; surfaceY = 6; } else if (seedValue < -0.4) { biome = "ocean"; surfaceY = 1; } else if (x % 14 === 0 && z % 14 === 0) { biome = "forest"; surfaceY = 5; }

        for (let y = surfaceY; y >= Y_MIN; y--) {
            let type = null; const bKey = `${x},${y},${z}`;
            if (y === Y_MIN) type = "bedrock";
            else if (y > surfaceY && y <= SEA_LEVEL && biome === "ocean") type = "water";
            else if (y === surfaceY) type = (biome === "desert" || biome === "ocean") ? "sand" : "grass";
            else if (y < surfaceY && y > surfaceY - 3) type = (biome === "desert") ? "sand" : "dirt";
            else {
                const rand = Math.random();
                if (y <= -4 && rand < 0.01) type = "diamond";
                if (type === null && rand < 0.03) type = "iron";
                if (type === null) type = "stone";
            }
            if (type) { worldData[bKey] = type; blockHP[bKey] = blockMaxHP[type]; }
        }
        if (biome === "forest" && Math.random() < 0.3) {
            for (let h = 1; h <= 3; h++) { worldData[`${x},${surfaceY + h},${z}`] = "log"; blockHP[`${x},${surfaceY + h},${z}`] = blockMaxHP["log"]; }
            for (let lx = -1; lx <= 1; lx++) { for (let lz = -1; lz <= 1; lz++) { const leafKey = `${x + lx},${surfaceY + 4},${z + lz}`; if (!worldData[leafKey]) { worldData[leafKey] = "leaves"; blockHP[leafKey] = blockMaxHP["leaves"]; } } }
        }
        if (Math.random() < 0.02 && biome !== "ocean") spawnMob(Math.random() > 0.3 ? "pig" : "zombie", x, surfaceY + 1, z);
    }

    function spawnMob(type, x, y, z) {
        if (mobsArray.length > 20) return; // 制限を微調整
        const mobGroup = new THREE.Group();
        const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, type==='pig'?0.6:0.8, type==='pig'?0.9:0.4), mats[type]);
        bodyMesh.position.y = type==='pig'?0.5:0.7; mobGroup.add(bodyMesh);
        mobGroup.position.set(x, y, z); mobGroup.userData = { type: type, hp: (type === "zombie" ? 4 : 2), walkTimer: 0, dirX: 0, dirZ: 0 };
        scene.add(mobGroup); mobsArray.push(mobGroup);
    }

    function spawnDropItem(type, position) {
        const dropMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), Array.isArray(mats[type]) ? mats[type][0] : mats[type]);
        dropMesh.position.copy(position); dropMesh.userData = { type: type }; scene.add(dropMesh); dropsArray.push(dropMesh);
    }

    // 負荷軽減のため、不要なフレームでの書き換え処理を除外したUI更新関数
    let lastUiText = "";
    function updateGameUI() {
        let biomeName = "🌾 平原"; const px = Math.floor(camera.position.x); const pz = Math.floor(camera.position.z);
        const v = Math.sin(px * 0.05) * Math.cos(pz * 0.05);
        if (v > 0.4) biomeName = "⏳ 砂漠"; else if (v < -0.4) biomeName = "🌊 海"; else if (px % 14 === 0 || pz % 14 === 0) biomeName = "🌳 森林";
        
        const uiText = `📍 X:${px} Z:${pz} Y:${Math.floor(camera.position.y - PLAYER_HEIGHT - currentBobY)} | ${biomeName} | 🛠️ ${playerTool}`;
        if(lastUiText !== uiText) { heightUI.innerHTML = uiText; lastUiText = uiText; }
        
        for(let i=0; i<9; i++) {
            const id = hotbarSlots[i];
            slotsUI[i].innerHTML = id ? `<div style="font-size:16px; margin-bottom:2px;">${ITEM_ICONS[id]}</div><div style="font-weight:bold; font-size:10px;">選択中</div>` : `<div style="color:#444; font-size:11px;">空</div>`;
            slotsUI[i].style.border = (i === selectedSlot) ? '3px solid #FFF' : '3px solid #555';
            slotsUI[i].style.background = (i === selectedSlot) ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.5)';
        }
    }

    function updateChunks(force = false) {
        const px = Math.floor(camera.position.x); const py = Math.floor(camera.position.y); const pz = Math.floor(camera.position.z);
        if (!force && px === lastChunkX && py === lastChunkY && pz === lastChunkZ) return;
        lastChunkX = px; lastChunkY = py; lastChunkZ = pz; 
        const radius = 8; // 描画半径を10➔8にして、ゲーム体験を変えずにFPSを劇的に向上
        const currentVisibleKeys = {};
        
        for (let x = px - radius; x <= px + radius; x++) {
            for (let z = pz - radius; z <= pz + radius; z++) {
                generateBlockDataAt(x, z); 
                for (let y = py - 5; y <= py + 5; y++) {
                    const key = `${x},${y},${z}`;
                    if (worldData[key]) {
                        currentVisibleKeys[key] = true;
                        if (!activeBlocks[key]) {
                            const block = new THREE.Mesh(geometry, mats[worldData[key]]);
                            block.position.set(x, y, z); block.name = worldData[key]; block.userData = { key: key };
                            scene.add(block); activeBlocks[key] = block; allBlocksArray.push(block);
                        }
                    }
                }
            }
        }
        for (const key in activeBlocks) { 
            if (!currentVisibleKeys[key]) { 
                scene.remove(activeBlocks[key]); 
                const index = allBlocksArray.indexOf(activeBlocks[key]); 
                if (index > -1) allBlocksArray.splice(index, 1); 
                delete activeBlocks[key]; 
            } 
        }
    }

    // ==========================================
    // 9. コントロール
    // ==========================================
    let isDragging = false; let previousMousePosition = { x: 0, y: 0 }; let rotationY = 0; let rotationX = 0;
    window.addEventListener('mousedown', (e) => { if(isScreenOpen) return; isDragging = true; previousMousePosition = { x: e.clientX, y: e.clientY }; });
    window.addEventListener('mousemove', (e) => {
        if (!isDragging || isScreenOpen) return;
        rotationY -= (e.clientX - previousMousePosition.x) * 0.01; rotationX -= (e.clientY - previousMousePosition.y) * 0.01;
        rotationX = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, rotationX));
        camera.rotation.set(rotationX, rotationY, 0, "YXZ"); previousMousePosition = { x: e.clientX, y: e.clientY };
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
            isScreenOpen = !isScreenOpen; inventoryMenu.style.display = isScreenOpen ? 'block' : 'none';
            if(!isScreenOpen) { furnaceMenu.style.display='none'; chestMenu.style.display='none'; currentOpenedChestKey=null; } 
            else { renderInventoryMenu(); }
            isDragging = false; return;
        }
        if(["1","2","3","4","5","6","7","8","9"].includes(e.key)) { selectedSlot = parseInt(e.key) - 1; updateGameUI(); return; }
        if(e.key === ' ' || e.code === 'Space') { if (isGrounded) { velocityY = JUMP_FORCE; isGrounded = false; } return; }
        const key = e.key.toLowerCase(); if(key in keys) keys[key] = true; 
    });
    window.addEventListener('keyup', (e) => { const key = e.key.toLowerCase(); if(key in keys) keys[key] = false; });

    const raycaster = new THREE.Raycaster(); const screenCenter = new THREE.Vector2(0, 0);
    let isSwinging = false; let handSwingTimer = 0;

    window.addEventListener('pointerdown', (e) => {
        if(isScreenOpen) return;
        isSwinging = true; handSwingTimer = 0; raycaster.setFromCamera(screenCenter, camera);

        const mobIntersects = raycaster.intersectObjects(mobsArray, true); 
        if (mobIntersects.length > 0 && mobIntersects[0].distance <= 5 && e.button === 0) {
            let rootMob = mobIntersects[0].object; while(rootMob.parent && rootMob.parent.type !== "Scene") { rootMob = rootMob.parent; }
            rootMob.userData.hp -= playerAttackPower; rootMob.position.y += 0.3;
            if (rootMob.userData.hp <= 0) { if (rootMob.userData.type === "pig") spawnDropItem("raw_meat", rootMob.position); scene.remove(rootMob); mobsArray.splice(mobsArray.indexOf(rootMob), 1); }
            return;
        }

        const intersects = raycaster.intersectObjects(allBlocksArray);
        if (intersects.length > 0 && intersects[0].distance <= 5) {
            const hit = intersects[0]; const hitBlock = hit.object; const blockKey = hitBlock.userData.key;
            if (e.button === 0) { 
                if (hitBlock.name !== "bedrock" && hitBlock.name !== "water") {
                    if (hitBlock.name === "diamond" && !playerTool.includes("鉄") && !playerTool.includes("ダイヤ")) { alert("🔒 ダイヤは鉄以上のツルハシが必要です！"); return; }
                    blockHP[blockKey] -= playerTool.includes("ツルハシ") ? playerAttackPower * 1.8 : 1;
                    if (blockHP[blockKey] <= 0) {
                        let dropType = hitBlock.name; if (dropType === "grass") dropType = "dirt";
                        inventory[dropType] = (inventory[dropType] || 0) + 1
