// ==========================================
// 0. 安全装置：Three.js の読み込みを監視して、確実に起動させる
// ==========================================
function initGame() {
    // 既存のUI要素をすべてクリアして真っ白を防止
    document.body.innerHTML = '';
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.backgroundColor = '#87CEEB';

    // ==========================================
    // 1. システム・画面の基本セットアップ
    // ==========================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); 
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.015); 

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(25, 8, 25); // スポーン位置を少し調整

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false; 
    document.body.appendChild(renderer.domElement);

    // 照準（クロスヘア）
    const crosshair = document.createElement('div');
    crosshair.style.position = 'absolute'; crosshair.style.top = '50%'; crosshair.style.left = '50%';
    crosshair.style.width = '10px'; crosshair.style.height = '10px'; crosshair.style.background = 'white';
    crosshair.style.transform = 'translate(-50%, -50%)'; crosshair.style.borderRadius = '50%'; crosshair.style.pointerEvents = 'none';
    document.body.appendChild(crosshair);

    // 高度・バイオームUI
    const heightUI = document.createElement('div');
    heightUI.style.position = 'absolute'; heightUI.style.bottom = '85px'; heightUI.style.left = '20px';
    heightUI.style.color = '#00FF00'; heightUI.style.fontSize = '18px'; heightUI.style.fontFamily = 'monospace';
    heightUI.style.textShadow = '2px 2px 2px black'; document.body.appendChild(heightUI);

    // 操作説明
    const infoText = document.createElement('div');
    infoText.style.position = 'absolute'; infoText.style.top = '15px'; infoText.style.width = '100%'; infoText.style.textAlign = 'center';
    infoText.style.color = 'white'; infoText.style.fontSize = '15px'; infoText.style.fontFamily = 'sans-serif'; infoText.style.textShadow = '1px 1px 3px black';
    infoText.innerHTML = '⚙️ 【E】：クラフト / 【1〜9】：ホットバー選択 / 左クリック：攻撃・採掘 / 右クリック：設置・かまど';
    document.body.appendChild(infoText);

    // ==========================================
    // 2. テクスチャ自動生成
    // ==========================================
    function createMinecraftTexture(baseColor, noiseFactor, patternType) {
        const canvas = document.createElement('canvas');
        canvas.width = 16; canvas.height = 16;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = baseColor; ctx.fillRect(0, 0, 16, 16);
        for (let x = 0; x < 16; x++) {
            for (let y = 0; y < 16; y++) {
                let n = (Math.random() - 0.5) * noiseFactor;
                if (patternType === 'grass' && y > 4 && y < 12) n -= 15; 
                if (patternType === 'log' && (x === 0 || x === 15 || y === 0 || y === 15)) n -= 30; 
                if (patternType === 'plank' && y % 4 === 0) n -= 40; 
                if (patternType === 'stone' && (x + y) % 5 === 0) n -= 20; 
                ctx.fillStyle = `rgba(${n > 0 ? 255 : 0}, ${n > 0 ? 255 : 0}, ${n > 0 ? 255 : 0}, ${Math.abs(n) / 255})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestFilter;
        return texture;
    }

    // ==========================================
    // 3. ライティング・マテリアル
    // ==========================================
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.4); dirLight.position.set(20, 40, 20); scene.add(dirLight);

    const mats = {
        grass:   new THREE.MeshStandardMaterial({ map: createMinecraftTexture('#5c8e32', 40, 'grass'), roughness: 0.9 }),
        dirt:    new THREE.MeshStandardMaterial({ map: createMinecraftTexture('#866043', 30, 'dirt'), roughness: 0.9 }),
        stone:   new THREE.MeshStandardMaterial({ map: createMinecraftTexture('#737373', 40, 'stone'), roughness: 0.9 }),
        iron:    new THREE.MeshStandardMaterial({ map: createMinecraftTexture('#d8af93', 50, 'stone'), roughness: 0.8 }),
        gold:    new THREE.MeshStandardMaterial({ map: createMinecraftTexture('#fcee4b', 60, 'stone'), roughness: 0.6 }),
        diamond: new THREE.MeshStandardMaterial({ map: createMinecraftTexture('#4dedf0', 60, 'stone'), roughness: 0.5 }),
        bedrock: new THREE.MeshStandardMaterial({ map: createMinecraftTexture('#1a1a1a', 80, 'none'), roughness: 1.0 }),
        log:     new THREE.MeshStandardMaterial({ map: createMinecraftTexture('#6b5336', 40, 'log'), roughness: 0.9 }),
        leaves:  new THREE.MeshStandardMaterial({ map: createMinecraftTexture('#3b6622', 60, 'none'), roughness: 0.9, transparent: true, alphaTest: 0.5 }),
        furnace: new THREE.MeshStandardMaterial({ map: createMinecraftTexture('#4a4a4a', 50, 'log'), roughness: 0.8 }),
        sand:    new THREE.MeshStandardMaterial({ map: createMinecraftTexture('#dbcd9f', 15, 'none'), roughness: 0.9 }), 
        water:   new THREE.MeshStandardMaterial({ color: 0x1E90FF, transparent: true, opacity: 0.6, roughness: 0.2 }),
        pig:     new THREE.MeshStandardMaterial({ map: createMinecraftTexture('#f0a7b4', 20, 'none'), roughness: 0.8 }),
        zombie:  new THREE.MeshStandardMaterial({ map: createMinecraftTexture('#3b7a57', 30, 'none'), roughness: 0.8 })
    };

    const geometry = new THREE.BoxGeometry(1, 1, 1);

    // プレイヤーの手
    const handGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.8);
    const matHand = new THREE.MeshStandardMaterial({ map: createMinecraftTexture('#bc9374', 20, 'none'), roughness: 0.9 });
    const handMesh = new THREE.Mesh(handGeometry, matHand); handMesh.position.set(0.5, -0.4, -0.8); camera.add(handMesh); scene.add(camera);

    // 物理・移動用パラメータ
    let velocityY = 0; 
    const GRAVITY = 0.03;      
    const JUMP_FORCE = 0.35;    
    let isGrounded = false; 
    const PLAYER_HEIGHT = 1.6;

    // ==========================================
    // 4. ホットバー ＆ インベントリ ＆ UI
    // ==========================================
    const hotbarContainer = document.createElement('div');
    hotbarContainer.style.position = 'absolute'; hotbarContainer.style.bottom = '20px'; hotbarContainer.style.left = '50%';
    hotbarContainer.style.transform = 'translateX(-50%)'; hotbarContainer.style.display = 'flex'; hotbarContainer.style.gap = '5px';
    hotbarContainer.style.background = 'rgba(0,0,0,0.5)'; hotbarContainer.style.padding = '5px'; hotbarContainer.style.borderRadius = '5px';
    document.body.appendChild(hotbarContainer);

    const slotTypes = ["log", "plank", "stick", "stone", "furnace", "raw_meat", "cooked_meat", "iron_ingot", "diamond"];
    const slotNames = ["🪵原木", "🪵板材", "🥢棒", "🪨石", "🔥炉", "🍖生肉", "🥩焼肉", "🪙鉄ｲﾝｺﾞ", "💎ダ"];
    const slotsUI = [];

    for(let i=0; i<9; i++) {
        const slot = document.createElement('div');
        slot.style.width = '52px'; slot.style.height = '52px'; slot.style.border = '3px solid #8b8b8b';
        slot.style.background = 'rgba(139,139,139,0.3)'; slot.style.display = 'flex'; slot.style.flexDirection = 'column';
        slot.style.alignItems = 'center'; slot.style.justifyContent = 'center'; slot.style.color = 'white';
        slot.style.fontFamily = 'sans-serif'; slot.style.fontSize = '10px'; hotbarContainer.appendChild(slot); slotsUI.push(slot);
    }

    // クラフトメニュー
    const craftMenu = document.createElement('div');
    craftMenu.style.position = 'absolute'; craftMenu.style.top = '50%'; craftMenu.style.left = '50%'; craftMenu.style.transform = 'translate(-50%, -50%)';
    craftMenu.style.width = '360px'; craftMenu.style.background = 'rgba(40, 40, 40, 0.95)'; craftMenu.style.border = '4px solid #fff';
    craftMenu.style.padding = '15px'; craftMenu.style.color = 'white'; craftMenu.style.fontFamily = 'sans-serif'; craftMenu.style.display = 'none'; craftMenu.style.zIndex = '100';
    document.body.appendChild(craftMenu);

    craftMenu.innerHTML = `<h3 style="margin-top:0; text-align:center; color:#FFD700;">🎒 3x3 本格クラフトメニュー</h3><div style="display:flex; justify-content:center; gap:15px; margin-bottom:15px;"><div style="display:grid; grid-template-columns: repeat(3, 45px); gap:5px;" id="dynamicCraftGrid"></div><div style="display:flex; align-items:center; font-size:24px;">➔</div><div style="display:flex; flex-direction:column; align-items:center; justify-content:center;"><div id="dynamicCraftOutput" style="width:65px; height:50px; border:3px dashed #FFD700; background:rgba(255,215,0,0.1); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:bold; text-align:center; padding:2px; box-sizing:border-box;">空</div><button id="dynamicBtnExecuteCraft" style="margin-top:8px; padding:3px 12px; font-size:12px;">作成</button></div></div>`;
    
    const craftMatrix = [null, null, null, null, null, null, null, null, null];
    const gridContainer = document.getElementById('dynamicCraftGrid');
    
    for (let i = 0; i < 9; i++) {
        const btn = document.createElement('button');
        btn.style.width = '45px'; btn.style.height = '45px'; btn.style.background = '#555'; btn.style.border = '2px solid #8b8b8b';
        btn.style.color = 'white'; btn.style.fontSize = '11px'; btn.style.cursor = 'pointer'; btn.innerText = "空";
        btn.addEventListener('click', () => handleGridClick(i)); gridContainer.appendChild(btn);
    }

    // かまどメニュー
    const furnaceMenu = document.createElement('div');
    furnaceMenu.style.position = 'absolute'; furnaceMenu.style.top = '50%'; furnaceMenu.style.left = '50%'; furnaceMenu.style.transform = 'translate(-50%, -50%)';
    furnaceMenu.style.width = '280px'; furnaceMenu.style.background = 'rgba(30, 30, 30, 0.95)'; furnaceMenu.style.border = '4px solid #FF4500';
    furnaceMenu.style.padding = '15px'; furnaceMenu.style.color = 'white'; furnaceMenu.style.fontFamily = 'sans-serif'; furnaceMenu.style.display = 'none'; furnaceMenu.style.zIndex = '101';
    document.body.appendChild(furnaceMenu);
    furnaceMenu.innerHTML = `<h3 style="margin-top:0; text-align:center; color:#FF4500;">🔥 かまど精錬システム</h3><div style="display:flex; flex-direction:column; gap:8px; margin-bottom:15px;"><button id="dynamicBtnCookMeat" style="padding:6px; font-size:12px; background:#FF4500; color:white; border:none; cursor:pointer;">🍖生肉を焼く ➔ 🥩ステーキ</button><button id="dynamicBtnSmeltIron" style="padding:6px; font-size:12px; background:#708090; color:white; border:none; cursor:pointer;">🪨石を焼く ➔ 🪙鉄インゴット</button></div><button id="dynamicBtnCloseFurnace" style="width:100%; padding:4px;">閉じる</button>`;

    // 世界データ・ブロック管理
    const worldData = {}; const blockHP = {}; const activeBlocks = {}; const allBlocksArray = []; 
    const WORLD_SIZE = 50; const Y_MIN = -15; const Y_MAX = 15; const SEA_LEVEL = 4;
    const blockMaxHP = { grass:1, dirt:1, stone:5, iron:5, gold:8, diamond:8, bedrock:99999, log:2, leaves:1, furnace:4, sand:1, water:1 };
    
    // 【修正：ボスの指示】最初はすべての所持品を完全に「0」にして空っぽからスタート！
    const inventory = { log: 0, plank: 0, stick: 0, stone: 0, furnace: 0, raw_meat: 0, cooked_meat: 0, iron_ingot: 0, diamond: 0 };
    let selectedSlot = 0; 

    let playerTool = "👊 素手"; 
    let playerAttackPower = 1;

    const mobsArray = []; const dropsArray = [];
    let lastChunkX = NaN, lastChunkY = NaN, lastChunkZ = NaN; 

    // モブ生成
    function spawnMob(type, x, y, z) {
        const mobGroup = new THREE.Group(); 
        const bodyGeo = type === 'pig' ? new THREE.BoxGeometry(0.6, 0.6, 0.9) : new THREE.BoxGeometry(0.6, 0.8, 0.4);
        const bodyMesh = new THREE.Mesh(bodyGeo, mats[type]); bodyMesh.position.y = type === 'pig' ? 0.5 : 0.7; mobGroup.add(bodyMesh);
        const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const headMesh = new THREE.Mesh(headGeo, mats[type]); headMesh.position.set(0, type === 'pig' ? 0.7 : 1.2, type === 'pig' ? -0.5 : 0); mobGroup.add(headMesh);
        const legGeo = new THREE.BoxGeometry(0.16, 0.4, 0.16); const legs = [];
        const positions = type === 'pig' ? [[-0.2, 0.2, 0.3], [0.2, 0.2, 0.3], [-0.2, 0.2, -0.3], [0.2, 0.2, -0.3]] : [[-0.15, 0.2, 0], [0.15, 0.2, 0], [-0.15, 0.2, 0], [0.15, 0.2, 0]]; 
        for(let i=0; i<4; i++) { const leg = new THREE.Mesh(legGeo, mats[type]); leg.position.set(positions[i][0], positions[i][1], positions[i][2]); mobGroup.add(leg); legs.push(leg); }
        mobGroup.position.set(x, y, z); mobGroup.userData = { type: type, hp: (type === "zombie" ? 3 : 1), walkTimer: 0, dirX: 0, dirZ: 0, legs: legs };
        scene.add(mobGroup); mobsArray.push(mobGroup);
    }

    function spawnDropItem(type, position) {
        const dropGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3); const dropMesh = new THREE.Mesh(dropGeo, mats[type]);
        dropMesh.position.copy(position); dropMesh.userData = { type: type }; scene.add(dropMesh); dropsArray.push(dropMesh);
    }

    function updateGameUI() {
        let biomeName = "🌾 草原"; const px = Math.floor(camera.position.x); const pz = Math.floor(camera.position.z);
        if (px < 25 && pz < 25) biomeName = "🌳 森林"; else if (px >= 45) biomeName = "⏳ 砂漠"; else if (pz >= 45) biomeName = "🌊 海";
        if (pz >= 20 && pz <= 24 && px < 45) biomeName = "🏞️ 川";
        
        heightUI.innerHTML = `高度 (Y): ${Math.floor(camera.position.y - PLAYER_HEIGHT)} | バイオーム: ${biomeName} | 装備: ${playerTool} (攻撃:${playerAttackPower})`;
        
        for(let i=0; i<9; i++) {
            const type = slotTypes[i];
            slotsUI[i].innerHTML = `<div>${slotNames[i]}</div><div style="font-weight:bold; font-size:13px; margin-top:2px;">${inventory[type] || 0}</div>`;
            slotsUI[i].style.border = (i === selectedSlot) ? '3px solid #FFFF00' : '3px solid #8b8b8b';
            slotsUI[i].style.background = (i === selectedSlot) ? 'rgba(255,255,0,0.2)' : 'rgba(139,139,139,0.3)';
        }
    }

    // 地形生成ループ
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
                    if (y >= -5) type = (rand < 0.04) ? "iron" : "stone";
                    else type = (rand < 0.02) ? "diamond" : "stone";
                }
                if (type) { worldData[`${x},${y},${z}`] = type; blockHP[`${x},${y},${z}`] = blockMaxHP[type]; }
            }

            if (biome === "forest" && Math.random() < 0.05) {
                for (let h = 1; h <= 3; h++) { worldData[`${x},${surfaceY + h},${z}`] = "log"; blockHP[`${x},${surfaceY + h},${z}`] = blockMaxHP["log"]; }
                const leafY = surfaceY + 4; 
                for (let lx = -1; lx <= 1; lx++) { 
                    for (let lz = -1; lz <= 1; lz++) { 
                        for (let ly = 0; ly <= 1; ly++) { 
                            const leafKey = `${x + lx},${leafY + ly},${z + lz}`; 
                            if (!worldData[leafKey]) { worldData[leafKey] = "leaves"; blockHP[leafKey] = blockMaxHP["leaves"]; } 
                        } 
                    } 
                }
            }
            if (Math.random() < 0.008 && biome !== "ocean" && biome !== "river") {
                if (biome === "desert") spawnMob("zombie", x, surfaceY + 1, z);
                else spawnMob("pig", x, surfaceY + 1, z);
            }
        }
    }

    function updateChunks(force = false) {
        const px = Math.floor(camera.position.x); 
        const py = Math.floor(camera.position.y); 
        const pz = Math.floor(camera.position.z);
        
        if (!force && px === lastChunkX && py === lastChunkY && pz === lastChunkZ) return;
        lastChunkX = px; lastChunkY = py; lastChunkZ = pz;

        const r = 16; 
        const currentKeys = {};
        
        for (let x = px - r; x <= px + r; x++) {
            for (let z = pz - r; z <= pz + r; z++) {
                for (let y = py - 8; y <= py + 8; y++) {
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
        
        for (const key in activeBlocks) { 
            if (!currentKeys[key]) { 
                scene.remove(activeBlocks[key]); 
                const index = allBlocksArray.indexOf(activeBlocks[key]); 
                if (index > -1) allBlocksArray.splice(index, 1); 
                delete activeBlocks[key]; 
            } 
        }
    }

    function handleGridClick(index) {
        if (craftMatrix[index] === null) {
            const type = slotTypes[selectedSlot];
            if (["log", "plank", "stick", "stone"].includes(type) && inventory[type] > 0) { craftMatrix[index] = type; inventory[type]--; }
        } else { const type = craftMatrix[index]; inventory[type]++; craftMatrix[index] = null; }
        checkCraftRecipe(); updateGameUI();
    }

    function checkCraftRecipe() {
        const grid = document.getElementById('dynamicCraftGrid').children;
        for(let i=0; i<9; i++) {
            let sym = "空";
            if(craftMatrix[i] === "log") sym = "🪵";
            else if(craftMatrix[i] === "plank") sym = "📦";
            else if(craftMatrix[i] === "stick") sym = "🥢";
            else if(craftMatrix[i] === "stone") sym = "🪨";
            grid[i].innerText = sym;
        }
        const out = document.getElementById('dynamicCraftOutput'); 
        const nonNulls = craftMatrix.filter(x => x !== null);

        if (nonNulls.length === 1 && nonNulls[0] === "log") { out.innerText = "🪵板材x4"; return; }
        if (craftMatrix[1] === "plank" && craftMatrix[4] === "plank" && craftMatrix[0]===null && craftMatrix[2]===null && craftMatrix[3]===null && craftMatrix[5]===null && craftMatrix[6]===null && craftMatrix[7]===null && craftMatrix[8]===null) { out.innerText = "🥢棒x4"; return; }
        if (craftMatrix[4] === "plank" && craftMatrix[7] === "plank" && craftMatrix[0]===null && craftMatrix[1]===null && craftMatrix[2]===null && craftMatrix[3]===null && craftMatrix[5]===null && craftMatrix[6]===null && craftMatrix[8]===null) { out.innerText = "🥢棒x4"; return; }
        if (craftMatrix[0] === "stone" && craftMatrix[1] === "stone" && craftMatrix[2] === "stone" && craftMatrix[4] === "stick" && craftMatrix[7] === "stick" && craftMatrix[3]===null && craftMatrix[5]===null && craftMatrix[6]===null && craftMatrix[8]===null) { out.innerText = "⛏️石ツルハシ"; return; }
        if (craftMatrix[1] === "stone" && craftMatrix[4] === "stone" && craftMatrix[7] === "stick" && craftMatrix[0]===null && craftMatrix[2]===null && craftMatrix[3]===null && craftMatrix[5]===null && craftMatrix[6]===null && craftMatrix[8]===null) { out.innerText = "⚔️石の剣"; return; }
        if (craftMatrix[1] === "stone" && craftMatrix[4] === "stick" && craftMatrix[7] === "stick" && craftMatrix[0]===null && craftMatrix[2]===null && craftMatrix[3]===null && craftMatrix[5]===null && craftMatrix[6]===null && craftMatrix[8]===null) { out.innerText = "🥄石スコップ"; return; }
        if (craftMatrix[0] === "stone" && craftMatrix[1] === "stone" && craftMatrix[2] === "stone" && craftMatrix[3] === "stone" && craftMatrix[4] === null && craftMatrix[5] === "stone" && craftMatrix[6] === "stone" && craftMatrix[7] === "stone" && craftMatrix[8] === "stone") { out.innerText = "🔥かまどx1"; return; }

        out.innerText = "空";
    }

    document.getElementById('dynamicBtnExecuteCraft').addEventListener('click', () => {
        const result = document.getElementById('dynamicCraftOutput').innerText; if (result === "空") return;
        if (result === "🪵板材x4") inventory.plank += 4;
        else if (result === "🥢棒x4") inventory.stick += 4;
        else if (result === "⛏️石ツルハシ") { playerTool = "⛏️ 石ツルハシ"; playerAttackPower = 1.5; alert("⛏️ 石ツルハシをクラフト！"); }
        else if (result === "🔥かまどx1") inventory.furnace += 1;
        else if (result === "⚔️石の剣") { playerTool = "⚔️ 石の剣"; playerAttackPower = 3.5; alert("⚔️ 石の剣をクラフト！"); }
        else if (result === "🥄石スコップ") { playerTool = "🥄 石スコップ"; playerAttackPower = 1.0; alert("🥄 石スコップをクラフト！"); }
        
        for(let i=0; i<9; i++) craftMatrix[i] = null; checkCraftRecipe(); updateGameUI();
    });

    document.getElementById('dynamicBtnCookMeat').addEventListener('click', () => { if (inventory.raw_meat >= 1) { inventory.raw_meat--; inventory.cooked_meat++; updateGameUI(); alert("🥩 ステーキを焼いた！"); } });
    document.getElementById('dynamicBtnSmeltIron').addEventListener('click', () => { if (inventory.stone >= 1) { inventory.stone--; inventory.iron_ingot++; updateGameUI(); alert("🪙 鉄インゴット精錬！"); } });
    document.getElementById('dynamicBtnCloseFurnace').addEventListener('click', () => { furnaceMenu.style.display = 'none'; isFurnaceOpen = false; });

    let isDragging = false; let previousMousePosition = { x: 0, y: 0 }; let rotationY = 0; let rotationX = 0; let isCraftOpen = false; let isFurnaceOpen = false;
    window.addEventListener('mousedown', (e) => { if(isCraftOpen || isFurnaceOpen) return; isDragging = true; previousMousePosition = { x: e.clientX, y: e.clientY }; });
    window.addEventListener('mousemove', (e) => {
        if (!isDragging || isCraftOpen || isFurnaceOpen) return;
        const deltaX = e.clientX - previousMousePosition.x; const deltaY = e.clientY - previousMousePosition.y;
        rotationY -= deltaX * 0.012; rotationX -= deltaY * 0.012; rotationX = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, rotationX));
        camera.rotation.set(rotationX, rotationY, 0, "YXZ"); previousMousePosition = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener('mouseup', () => { isDragging = false; });

    const keys = { w: false, a: false, s: false, d: false };
    window.addEventListener('keydown', (e) => { 
        if(e.key.toLowerCase() === 'e') { isCraftOpen = !isCraftOpen; craftMenu.style.display = isCraftOpen ? 'block' : 'none'; furnaceMenu.style.display = 'none'; isFurnaceOpen = false; checkCraftRecipe(); isDragging = false; return; }
        if
