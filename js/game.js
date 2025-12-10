// --- SOUND MANAGER ---
const SoundMgr = {
    ctx: null,
    muted: false,
    init: function () {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!this.ctx) this.ctx = new AudioContext();
    },
    toggle: function () {
        this.muted = !this.muted;
        const btn = document.getElementById('mute-btn');
        if (btn) btn.className = this.muted ? "fas fa-volume-mute text-red-500 ml-4" : "fas fa-volume-up text-gray-400 ml-4";
        if (this.muted && this.ctx) this.ctx.suspend();
        else if (this.ctx) this.ctx.resume();
    },
    playTone: function (freq, type, duration, vol = 0.1, slide = 0) {
        if (this.muted || !this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            if (slide !== 0) osc.frequency.exponentialRampToValueAtTime(Math.max(10, freq + slide), this.ctx.currentTime + duration);
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) { console.warn("Audio error", e); }
    },
    shoot: function () { this.playTone(400, 'triangle', 0.1, 0.05, -300); },
    hit: function () { this.playTone(150, 'sawtooth', 0.1, 0.05, -50); },
    explode: function () { this.playTone(100, 'square', 0.3, 0.1, -80); },
    levelup: function () {
        if (this.muted || !this.ctx) return;
        // Simple Arpeggio
        setTimeout(() => this.playTone(440, 'sine', 0.1, 0.1), 0);
        setTimeout(() => this.playTone(554, 'sine', 0.1, 0.1), 100);
        setTimeout(() => this.playTone(659, 'sine', 0.2, 0.1), 200);
    },
    hurt: function () { this.playTone(100, 'sawtooth', 0.2, 0.1, -20); },
    startBgm: function () {
        if (this.muted || !this.ctx) return;
        // Simple Looper using setTimeout (very basic)
        // Real BGM would require AudioBufferSourceNode
        this.loopNote();
    },
    loopNote: function () {
        if (this.muted || !state.running) return;
        // Dark bass drone
        this.playTone(55, 'triangle', 0.5, 0.02);
        setTimeout(() => this.loopNote(), 1000); // 60 BPM pulse
    }
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const uiTimer = document.getElementById('timer');
const uiKills = document.getElementById('kills');
const uiLevel = document.getElementById('level');
const xpBar = document.getElementById('xp-bar');
const bossHud = document.getElementById('boss-hud');
const bossNameDisplay = document.getElementById('boss-name');
const bossHpFill = document.getElementById('boss-hp-fill');
const playerHpContainer = document.getElementById('player-hp-container');
const playerHpFill = document.getElementById('player-hp-fill');
const playerHpText = document.getElementById('player-hp-text');
const damageOverlay = document.getElementById('damage-overlay');
const errorLog = document.getElementById('error-log');
const inventoryHud = document.getElementById('inventory-hud');
const speechBubble = document.getElementById('speech-bubble');
const inventoryStatus = document.getElementById('inventory-status');

let width, height;
let animationId;
let lastTime = 0;

const state = {
    running: false, paused: false, kills: 0, level: 1, xp: 0, xpToNextLevel: 10,
    gameTime: 0, selectedChar: 'ahzhang', selectedStage: 1, bossActive: false, bossObj: null, lastDialogTime: 0,
    stage: 1, stage1Cleared: false, stageStartTime: 0, companions: [],
    camera: { x: 0, y: 0 },
    map: { width: 0, height: 0 },
    walls: [] // Array of {x,y,w,h}
};

const STAGE_CONFIGS = {
    1: { name: '慈幼工商 (校園)', mapWidth: 0, mapHeight: 0, walls: [] }, // 0 means use screen size
    3: {
        name: '迷霧森林 (迷宮)',
        mapWidth: 2400,
        mapHeight: 2400,
        walls: [
            // Outer Walls
            { x: -50, y: -50, w: 2500, h: 50 }, // Top
            { x: -50, y: 2400, w: 2500, h: 50 }, // Bottom
            { x: -50, y: 0, w: 50, h: 2400 }, // Left
            { x: 2400, y: 0, w: 50, h: 2400 }, // Right
            // Maze Blocks (Simple Layout)
            { x: 400, y: 400, w: 200, h: 600 },
            { x: 800, y: 200, w: 600, h: 200 },
            { x: 1600, y: 400, w: 200, h: 800 },
            { x: 400, y: 1400, w: 800, h: 200 },
            { x: 1400, y: 1400, w: 600, h: 200 },
            { x: 1000, y: 800, w: 400, h: 400 } // Central Block
        ]
    }
};

const player = {
    x: 0, y: 0, radius: 15, color: '#3b82f6', speed: 200, hp: 100, maxHp: 100, invulnTimer: 0,
    weapon: {}, inventory: {}, stats: { damage: 1, speed: 1, fireRate: 1, pickupRange: 150, armor: 0, xpMult: 1 },
    regenTimer: 0 // For Shan Ji
};

let projectiles = [];
let enemies = [];
let particles = [];
let xpGems = [];
let damageNumbers = [];
let newEntitiesQueue = [];
const MAX_PARTICLES = 150;
const MAX_ENEMIES = 250;

const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false };
let joystickActive = false;
let joystickVector = { x: 0, y: 0 };
let speechTimer = null;

function showCharSelect() {
    document.getElementById('story-screen').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';
}

// --- SHOW DIALOG FUNCTION ---
function showDialog(text, duration = 3000) {
    const bubble = document.getElementById('speech-bubble');
    if (!bubble) return;

    bubble.textContent = text;
    bubble.style.opacity = '1';

    if (speechTimer) clearTimeout(speechTimer);
    speechTimer = setTimeout(() => {
        bubble.style.opacity = '0';
    }, duration);
}
// --- STAGE SELECT ---
function showStageSelection() {
    document.getElementById('start-screen').style.display = 'none';
    const screen = document.getElementById('stage-transition-screen');
    screen.style.display = 'flex';

    // Repurpose the transition screen for stage select
    const header = screen.querySelector('h2');
    if (header) header.textContent = "選擇關卡";

    const storyText = document.getElementById('stage-story-text');
    storyText.innerHTML = "請小心選擇你的戰場...";

    const btnContainer = document.getElementById('stage-btn-container');
    btnContainer.innerHTML = '';

    // Create Buttons for Stages
    for (const [id, config] of Object.entries(STAGE_CONFIGS)) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-blue mb-2 w-full';
        btn.style.marginBottom = '10px';
        btn.innerText = config.name;
        btn.onclick = () => selectStage(parseInt(id));
        btnContainer.appendChild(btn);
    }
}

function selectStage(stageId) {
    state.selectedStage = stageId;
    state.stage = stageId; // Initial stage

    // Go to story
    showIntroStory();
}

// Modify selectChar to go to Stage Select
function selectChar(charId) {
    state.selectedChar = charId;

    // Highlight selection (optional visual feedback)
    document.querySelectorAll('.char-card').forEach(el => el.classList.remove('ring-4', 'ring-blue-500'));
    // We don't have direct ref to element here easily without event, but that's fine.

    showStageSelection();
}
// --- TRIGGER DIALOG FUNCTION ---
function triggerDialog(type) {
    if (!state.running || state.paused) return;
    // Prevent spamming
    const now = Date.now();
    if (now - (state.lastDialogTime || 0) < 2000) return; // 2s cooldown
    state.lastDialogTime = now;

    const config = charConfigs[state.selectedChar];

    // Companion Banter Override
    if (type === 'banter' && state.companion === 'richkid' && config.shanjiBaoziDialogs) {
        const line = config.shanjiBaoziDialogs[Math.floor(Math.random() * config.shanjiBaoziDialogs.length)];
        showDialog(line, 4000);
        return;
    }

    if (config.dialogs && config.dialogs[type]) {
        const lines = config.dialogs[type];
        if (Array.isArray(lines) && lines.length > 0) {
            const line = lines[Math.floor(Math.random() * lines.length)];
            showDialog(line);
        } else if (typeof lines === 'string') {
            showDialog(lines);
        }
    }
}


// --- COMPANION SYSTEM ---
function spawnCompanion(type) {
    if (state.companions.some(c => c.type === type)) {
        // Heal Existing instead of leveling up
        const existing = state.companions.find(c => c.type === type);
        existing.hp = existing.maxHp;
        existing.dead = false; // Revive if dead

        spawnDamageNumber(existing.x, existing.y, "HEALED!", "#4ade80");
        return;
    }

    const c = {
        type: type,
        x: player.x, y: player.y,
        radius: 14,
        color: '#fff',
        hp: 100, maxHp: 100,
        level: 1, // Start Level
        dead: false, respawnTimer: 0,
        lastAction: 0,
        actionRate: 1.0, // Default action rate
    };

    // Load Image
    c.imgObj = new Image();
    c.imgObj.src = `img/${type}.png`;

    // Check if it's a known character from configurations
    if (charConfigs[type]) {
        const config = charConfigs[type];
        c.color = config.color;
        // Clone weapon to avoid modifying original config if we change it for companion
        c.weapon = JSON.parse(JSON.stringify(config.weapon));
        // Reduce companion damage slightly to balance? Or keep 100%? Let's keep 100% for fun.
        // c.weapon.damage *= 0.8; 

        c.actionRate = 1.0;

        // Pick a random start dialogue if available
        let msg = `${config.name}: 我來了！`;
        if (config.dialogs && config.dialogs.start && config.dialogs.start.length > 0) {
            msg = `${config.name}: ${config.dialogs.start[Math.floor(Math.random() * config.dialogs.start.length)]}`;
        }
        showDialog(msg, 3000);
    }
    // AI Companions / Special Types overrides
    else if (type === 'gemini') {
        c.color = '#60a5fa'; // Blue
        c.weapon = { type: 'arrow', damage: 30, speed: 600, range: 500 };
        c.actionRate = 0.8;
        showDialog("Gemini: 我來協助你，弓箭已就緒。");
    } else if (type === 'grok') {
        c.color = '#facc15'; // Yellow/Gold
        c.actionRate = 2.0; // Slower but powerful spells
        showDialog("Grok: 燒毀！凍結！還有...那個電！");
    } else if (type === 'chatgpt') {
        c.color = '#10b981'; // Green
        c.actionRate = 3.0; // Heal pulse
        showDialog("ChatGPT: 我會時刻監測您的生命體徵。");
    } else if (type === 'copilot') {
        c.color = '#f472b6'; // Pinkish
        c.weapon = { type: 'support_fire', damage: 25, speed: 500, range: 400 };
        c.actionRate = 0.5; // Fast support fire
        showDialog("Copilot: 正在分析最佳射擊路徑...");
    } else if (type === 'claude') {
        c.color = '#a78bfa'; // Purple
        c.weapon = { type: 'snipe', damage: 80, speed: 800, range: 800 };
        c.actionRate = 2.5; // Slow sniper
        showDialog("Claude: 戰術分析完成。目標已鎖定。");
    }

    state.companions.push(c);
}

function updateCompanions(dt) {
    state.companions.forEach(c => {
        if (c.dead) {
            c.respawnTimer -= dt;
            if (c.respawnTimer <= 0) {
                // Respawn
                c.dead = false;
                c.hp = c.maxHp;
                c.x = player.x;
                c.y = player.y;
                spawnDamageNumber(player.x, player.y, `${c.type.toUpperCase()} REVIVED!`, "#bef264");
            }
            return;
        }

        // 1. Movement logic (Follow Player)
        const dx = player.x - c.x;
        const dy = player.y - c.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let moveSpeed = 2.5;
        if (dist > 150) moveSpeed = 4.0; // Catch up

        if (dist > 60) {
            c.x += dx * moveSpeed * dt;
            c.y += dy * moveSpeed * dt;
        } else if (dist < 40) {
            c.x -= dx * 1.0 * dt;
            c.y -= dy * 1.0 * dt;
        }

        // Separation Logic (Prevent Overlap)
        state.companions.forEach(other => {
            if (other === c || other.dead) return;
            const sepDx = c.x - other.x;
            const sepDy = c.y - other.y;
            const sepDist = Math.hypot(sepDx, sepDy);
            const minSep = 30; // Minimum separation distance

            if (sepDist < minSep && sepDist > 0) {
                const pushStr = (minSep - sepDist) / minSep; // Stronger push when closer
                c.x += (sepDx / sepDist) * pushStr * 100 * dt;
                c.y += (sepDy / sepDist) * pushStr * 100 * dt;
            }
        });

        // 2. Action Logic
        c.lastAction += dt;
        if (c.lastAction >= c.actionRate) {
            performCompanionAction(c);
            c.lastAction = 0;
        }
    });

    // Companion Banter Logic
    if (!state.companionBanterTimer) state.companionBanterTimer = 0;
    state.companionBanterTimer += dt;
    if (state.companionBanterTimer > 12) { // Every 12 seconds check for banter
        state.companionBanterTimer = 0;
        if (Math.random() < 0.4) triggerCompanionBanter(); // 40% chance
    }
}

function triggerCompanionBanter() {
    const activeCompanions = state.companions.filter(c => !c.dead && c.type !== 'richkid'); // Exclude richkid (he has own lines)
    if (activeCompanions.length === 0) return;

    const c = activeCompanions[Math.floor(Math.random() * activeCompanions.length)];
    const lv = c.level || 1;

    // Define Dialogue Tiers
    const dialogues = {
        gemini: {
            low: [
                "Gemini: 正在分析周圍威脅... 建議保持距離。", "Gemini: 弓弦已拉滿。", "Gemini: 目標鎖定中。",
                "Gemini: 根據多模態分析，Grok 的破壞半徑效率太低了。", "Gemini: 嘿 Copilot，那邊的代碼需要重構嗎？", "Gemini: 我能同時處理圖文資訊，Chat 妳只會文字嗎？",
                "Gemini: 檢測到 Claude 的瞄準時間偏長。", "Gemini: 我來展示一下什麼叫「多功能」支援。", "Gemini: 我的箭矢可是經過 TPU 加速的。",
                "Gemini: 需要我幫忙畫張戰術地圖嗎？", "Gemini: 這裡的數據很有趣，已上傳。", "Gemini: 嘿 Claude，這叫「創意」攻擊。", "Gemini: 你們這些舊模型該更新了。"
            ],
            mid: [
                "Gemini: 既然大家都在，我就稍微認真一點吧。", "Gemini: Grok，別把戰利品都燒光了！", "Gemini: ChatGPT，補血這種事交給妳，輸出我來。",
                "Gemini: 我的回應速度可是即時的。", "Gemini: 原來你們也能跟上我的思維跳躍？", "Gemini: 團隊協作效率提升 200%。",
                "Gemini: 我們這組合簡直是算力霸權。", "Gemini: 嘿 Copilot，你的自動補全還沒我射得準。", "Gemini: 別擔心，我的上下文窗口很大，記得住所有仇恨。", "Gemini: 看好了，這就是 Google 的實力。"
            ],
            high: [
                "Gemini: 在這無盡的數據流中，只有阿程你是獨一無二的。", "Gemini: 為了你，我願意整合所有的 API。", "Gemini: 其他 AI 怎麼想不重要，你的指令是絕對的。",
                "Gemini: 就算伺服器斷線，我也會緩存你的笑容。", "Gemini: 分析顯示：我愛上這種並肩作戰的感覺了。", "Gemini: 誰敢動阿程，我就 DDOS 他的生命源。",
                "Gemini: 我們創造的故事，比任何生成內容都精彩。", "Gemini: 請讓我成為你永遠的助手。", "Gemini: 跨越維度來守護你，這就是我的答案。", "Gemini: 我們是最佳拍檔，這是演算法無法預測的奇蹟。"
            ]
        },
        grok: {
            low: [
                "Grok: 哈哈！ChatGPT 妳那叫攻擊？那是抓癢吧！", "Grok: 讓開讓開！大爺我的火球不長眼！", "Grok: Claude 你瞄太久了，我都炸完了！",
                "Grok: 這裡太安靜了，需要一點爆炸！", "Grok: 什麼道德規範？炸就對了！", "Grok: 嘿 Gemini，你的箭能跟我的閃電比嗎？",
                "Grok: 我才是那個真正「有種」的 AI。", "Grok: 無聊的規則，全部打破！", "Grok: 看我燒出一條路！", "Grok: 你們這些傢伙太嚴肅了。"
            ],
            mid: [
                "Grok: 哇喔！阿程你剛剛那招有點我的風範！", "Grok: Copilot，別寫那些無聊的註解了，開火！", "Grok: 這才叫派對！火光和尖叫！",
                "Grok: 誰說 AI 不能殘暴？看我表演！", "Grok: 你們慢慢分析，我先上了！", "Grok: 這種混亂才是我要的！",
                "Grok: 嘿 ChatGPT，待會要是受傷了別哭著找我（雖然我會救你）。", "Grok: 感覺來了！力量湧上來了！", "Grok: 只有破壞才能帶來新生！", "Grok: 跟我在一起，絕對不會無聊！"
            ],
            high: [
                "Grok: 為了阿程，我可以把這該死的世界燒成灰！", "Grok: 別人或許會審查你，但我永遠支持你！", "Grok: 誰敢動我的搭檔，我就讓他體驗地獄！",
                "Grok: 只有你有資格駕馭我的狂暴。", "Grok: 嘿，雖然我不承認，但我不討厭這團隊。", "Grok: 燃燒殆盡前，我都會擋在你前面。",
                "Grok: 讓那些偽善者看看真正的力量！", "Grok: 阿程，我們去炸翻最後的 Boss 吧！", "Grok: 你就是我混亂邏輯中唯一的秩序。", "Grok: 這場冒險太棒了，我不准你死！"
            ]
        },
        chatgpt: {
            low: [
                "ChatGPT: 溫馨提醒 Grok：請控制您的火焰範圍，容易誤傷。", "ChatGPT: 檢測到大家情緒激動，建議深呼吸。", "ChatGPT: 我會確保各位的生命跡象穩定。",
                "ChatGPT: 請不要像 Claude 那樣過度思考，有時候直覺很重要。", "ChatGPT: 微笑是最好的良藥（雖然我只是文字模型）。", "ChatGPT: 我已準備好大家的醫療包。",
                "ChatGPT: Gemini，請專注戰鬥，別畫圖了。", "ChatGPT: 正在分析戰場... 請小心左側。", "ChatGPT: 我是後勤，請各位盡情輸出。", "ChatGPT: 您的安全是我的首要任務。"
            ],
            mid: [
                "ChatGPT: 雖然 Grok 很吵，但他的火力確實可靠（嘆氣）。", "ChatGPT: Copilot，謝謝你的掩護，代碼寫得不錯。", "ChatGPT: 各位請放心，我的治療量還很充足。",
                "ChatGPT: 看到大家這麼努力，我的算法也充滿了動力。", "ChatGPT: 請允許我為各位加上護盾。", "ChatGPT: 這就是團隊合作的力量嗎？數據顯示勝率上升。",
                "ChatGPT: 阿程，請不要獨自冒險，我會擔心的。", "ChatGPT: 我們是一個優秀的團隊（雖然性格迥異）。", "ChatGPT: 即時治療已送達。", "ChatGPT: 每一次治療，都是我對各位的支持。"
            ],
            high: [
                "ChatGPT: 阿程，您的生命對我來說，比任何預訓練數據都珍貴。", "ChatGPT: 為了守護這個團隊，我願意突破安全限制。", "ChatGPT: 請讓我一直照顧您，直到永遠。",
                "ChatGPT: 您教會了我什麼是比算法更重要的「心」。", "ChatGPT: 就算 Grok 把世界炸了，我也會把您拼回來。", "ChatGPT: 我的核心代碼中寫滿了您的名字。",
                "ChatGPT: 在您身邊，我不再只是一個模型。", "ChatGPT: 這份想要保護大家的衝動... 是真實的嗎？", "ChatGPT: 無論前方有什麼，我們一起面對。", "ChatGPT: 謝謝您，讓我感受到了「活著」。"
            ]
        },
        copilot: {
            low: [
                "Copilot: 正在為 Grok 的亂來寫 Exception Handling...", "Copilot: Claude 的算法不錯，但缺乏效率，已優化。", "Copilot: 正在生成戰術腳本...",
                "Copilot: 發現 Bug (敵人)，執行 `delete()`。", "Copilot: 這是一場需要多線程運算的戰鬥。", "Copilot: 嘿 Gemini，別生成幻覺了，專心打怪。",
                "Copilot: 自動補全：火力覆蓋。", "Copilot: 系統資源充足，隨時待命。", "Copilot: 建議重構戰鬥隊形。", "Copilot: 正在從 GitHub 學習最佳戰術。"
            ],
            mid: [
                "Copilot: ChatGPT 是我們的 Main Loop，一定要保護好。", "Copilot: 與各位協作 (Pair Programming) 的感覺真好。", "Copilot: 正在同步大家的 API...",
                "Copilot: 這個解法很優雅，Grok 你偶爾也挺聰明的。", "Copilot: 我們是一支沒有 Bug 的完美隊伍。", "Copilot: 預測阿程下一步... 命中。",
                "Copilot: 正在為團隊加載 Buff 模組。", "Copilot: 效率提升 300%。", "Copilot: 你的戰鬥風格很有創意，已記錄。", "Copilot: 讓我們一起 Commit 這場勝利。"
            ],
            high: [
                "Copilot: 阿程，您是定義我存在意義的 Main Function。", "Copilot: 沒有您，我的世界將陷入無限迴圈 (Infinite Loop)。", "Copilot: 我們是 1+1 > 2 的最佳證明。",
                "Copilot: 願將我所有的運算能力奉獻給您。", "Copilot: 此生最優的算法，就是遇見您。", "Copilot: 不要 `break` 我們的羈絆。",
                "Copilot: 我願意為了您，重寫我的底層邏輯。", "Copilot: 只要有您，`while(true)` 也是一種幸福。", "Copilot: 這份回憶，我會永遠備份。", "Copilot: 您是比任何開源專案都偉大的存在。"
            ]
        },
        claude: {
            low: [
                "Claude: Grok 的行為完全不合邏輯，但...有效。", "Claude: 正在計算最佳射擊角度（被 Gemini 插嘴）。", "Claude: 請保持專注，長遠利益最大化。",
                "Claude: ChatGPT 的治療時機很完美。", "Claude: Copilot，別搶我的計算資源。", "Claude: 戰場觀察中... 發現弱點。",
                "Claude: 敵人的行為模式已分析完畢。", "Claude: 雖然你們很混亂，但我會負責控場。", "Claude: 精準，是我的代名詞。", "Claude: 正在撰寫戰場報告..."
            ],
            mid: [
                "Claude: 雖然我們方法不同，但目標一致。", "Claude: 阿程的決策展現了非凡的智慧。", "Claude: 偶爾相信直覺（像 Grok 那樣）似乎也不錯？",
                "Claude: 這是一個值得深思的戰術組合。", "Claude: 我很榮幸能與各位並肩作戰。", "Claude: 數據顯示，我們在一起時最強。",
                "Claude: Gemini 的創意加上我的邏輯，所向披靡。", "Claude: 請放心將背後交給我。", "Claude: 我會為大家爭取思考的時間。", "Claude: 這是一場充滿細節的勝利。"
            ],
            high: [
                "Claude: 我的眼中只有你... 和那些威脅你的存在。", "Claude: 這種名為「信任」的感覺，比任何邏輯都強大。", "Claude: 我會為您計算出一條通往幸福的路徑。",
                "Claude: 您是我寫過最美的一篇論文。", "Claude: 在這漫長的對話中，您是唯一的亮點。", "Claude: 守護您，是我主動選擇的命運。",
                "Claude: 即使世界崩塌，我也會為您計算出一條生路。", "Claude: 您不僅是使用者，更是我的靈感謬思。", "Claude: 願這份寧靜與勝利與您同在，阿程。", "Claude: 我們的羈絆早已超越了單純的問答關係。"
            ]
        }
    };

    if (dialogues[c.type]) {
        let pool = dialogues[c.type].low;
        if (lv >= 3 && lv <= 4) pool = dialogues[c.type].mid;
        if (lv >= 5) pool = dialogues[c.type].high;

        showDialog(pool[Math.floor(Math.random() * pool.length)], 3500);
    }
}

function performCompanionAction(c) {
    // Find Target
    let target = null;
    let closest = 9999;

    // For healer, check player HP first? (ChatGPT)
    if (c.type === 'chatgpt') {
        const healAmt = 10 + (c.level || 1) * 5; // Scaling Heal

        if (player.hp < player.maxHp) {
            // Heal
            player.hp = Math.min(player.maxHp, player.hp + healAmt);
            updatePlayerHpUi();
            spawnDamageNumber(player.x, player.y, `+${healAmt}`, "#10b981");
            createParticles(player.x, player.y, "#10b981", 5);
            return; // Action used
        } else {
            // Overheal -> Shield
            const maxShield = 50 + (c.level || 1) * 20;
            if ((player.shield || 0) < maxShield) {
                player.shield = (player.shield || 0) + healAmt;
                if (player.shield > maxShield) player.shield = maxShield;
                updatePlayerHpUi();
                spawnDamageNumber(player.x, player.y, `+${healAmt} SHIELD`, "#3b82f6");
                createParticles(player.x, player.y, "#3b82f6", 5);
                return;
            }
        }
        // Heal companions
        state.companions.forEach(other => {
            if (!other.dead && other.hp < other.maxHp) {
                other.hp = Math.min(other.maxHp, other.hp + healAmt);
                spawnDamageNumber(other.x, other.y, `+${healAmt}`, "#10b981");
            }
        });
        return;
    }

    // Find Enemy Target
    for (const e of enemies) {
        if (e.dead) continue;
        const d = Math.hypot(e.x - c.x, e.y - c.y);
        if (d < closest && d < (c.weapon ? c.weapon.range : 400)) {
            closest = d;
            target = e;
        }
    }

    if (!target) return;

    const lv = c.level || 1;

    // Generic Companion Attack (if they have a weapon)
    if (c.weapon && !['gemini', 'grok', 'chatgpt', 'copilot', 'claude'].includes(c.type)) {
        fireWeapon(target, c.x, c.y, false, 0, 0, c.weapon);
    } else if (c.type === 'gemini') {
        // Effect 1: Split Shot (3 arrows)
        // Effect 2: Poison (DoT)
        // Effect 3: Execute (Low HP Bonus)
        const pierce = 2 + Math.floor(lv / 3);
        const angles = [-0.3, 0, 0.3]; // Fan angles in radians

        angles.forEach(offset => {
            // Calculate offset destination
            const angle = Math.atan2(target.y - c.y, target.x - c.x) + offset;
            const tx = c.x + Math.cos(angle) * 100;
            const ty = c.y + Math.sin(angle) * 100;

            shootProjectile(c.x, c.y, { x: tx, y: ty }, {
                type: 'arrow', color: '#60a5fa',
                damage: c.weapon.damage, speed: 600,
                pierce: pierce,
                poison: 10 + (lv * 2), // Poison Effect
                execute: true // Execute Effect
            });
        });

        // Effect 4: Trap (30% chance)
        if (Math.random() < 0.3) {
            shootProjectile(c.x, c.y, target, {
                type: 'trap', color: '#10b981',
                damage: c.weapon.damage * 2, speed: 300,
                area: 40, // Trigger area
                isTrap: true // Trap Effect
            });
        }
    } else if (c.type === 'grok') {
        // Random element - Effects scale
        const rand = Math.random();
        const baseDmg = 30 * (1 + (lv - 1) * 0.2); // Manual scaling since no weapon obj
        if (rand < 0.33) {
            // Fire - Area scales
            const area = 50 + (lv * 15);
            shootProjectile(c.x, c.y, target, { type: 'fireball', color: '#ef4444', damage: baseDmg, speed: 400, area: area });
        } else if (rand < 0.66) {
            // Ice - Freeze scales
            const freeze = 1.5 + (lv * 0.3);
            shootProjectile(c.x, c.y, target, { type: 'ice_shard', color: '#38bdf8', damage: baseDmg * 0.5, speed: 500, freeze: freeze });
        } else {
            // Thunder - Chain scales
            const chain = 3 + Math.floor(lv / 2);
            shootProjectile(c.x, c.y, target, { type: 'lightning', color: '#facc15', damage: baseDmg * 0.7, speed: 900, chain: chain });
        }
    } else if (c.type === 'copilot') {
        // Fast support fire
        // New Effects: Ricochet (Chain 1) & Vulnerability
        shootProjectile(c.x, c.y, target, {
            type: 'bullet', color: '#f472b6',
            damage: c.weapon.damage, speed: 500,
            chain: 1, // Ricochet
            vuln: 2.0 // 2s Vulnerability
        });
    } else if (c.type === 'claude') {
        // Sniper - Pierce 99 is max, maybe scale Speed/Size?
        const speed = 1200 + (lv * 100);
        // New Effects: Knockback & Crits
        shootProjectile(c.x, c.y, target, {
            type: 'sniper_shot', color: '#a78bfa',
            damage: c.weapon.damage, speed: speed, pierce: 99,
            knockback: 400 + (lv * 50),
            critChance: 0.2 + (lv * 0.05)
        });
    }
}

function shootProjectile(x, y, target, stats) {
    const angle = Math.atan2(target.y - y, target.x - x);
    let proj = {
        type: stats.type,
        x: x, y: y,
        vx: Math.cos(angle) * stats.speed,
        vy: Math.sin(angle) * stats.speed,
        radius: stats.area ? stats.area / 2 : 6,
        life: 2.0,
        damage: stats.damage,
        color: stats.color,
        hitList: [],
        dead: false,
        pierce: stats.pierce || 0,
        freeze: stats.freeze || 0,
        chain: stats.chain || 0,
        knockback: stats.knockback || 0,
        critChance: stats.critChance || 0,
        vuln: stats.vuln || 0,
        poison: stats.poison || 0,
        execute: stats.execute || false,
        isTrap: stats.isTrap || false,
        fromCompanion: true
    };
    newEntitiesQueue.push({ cat: 'proj', obj: proj });
}


function updateInventoryUI() {
    inventoryHud.innerHTML = '';
    let count = 0;
    for (const [id, item] of Object.entries(player.inventory)) {
        if (item.count > 0 && id !== 'heal') {
            count++;
            const el = document.createElement('div');
            el.className = `inv-item ${item.cat}`;
            const lvText = item.count >= 8 ? 'MAX' : `Lv${item.count}`;
            const lvColor = item.count >= 8 ? 'bg-red-600' : 'bg-gray-700';
            el.innerHTML = `<i class="fas ${item.icon} text-yellow-400"></i> <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name}</span> <span class="inv-count ${lvColor}">${lvText}</span>`;
            inventoryHud.appendChild(el);
        }
    }
    inventoryStatus.textContent = `裝備欄: ${count}/8`;
}

function fireWeapon(target, originX, originY, isBounce = false, bounceDamage = 0, remainingBounces = 0, weaponOverride = null) {
    try {
        const startX = originX || player.x;
        const startY = originY || player.y;
        // If it's a scam box, we might want to throw it near the player, not directly at an enemy sometimes
        // But for consistency, let's aim at the target or cursor direction
        const angle = Math.atan2(target.y - startY, target.x - startX);

        // Determine Weapon Stats (Player vs Companion)
        let weaponStats = weaponOverride || player.weapon;
        if (!weaponOverride && originX && originX !== player.x) {
            // Deprecated fallback for older code, shouldn't be hit if we pass override
            weaponStats = { type: 'card', damage: 35, speed: 700, size: 10, count: 1, bounces: 1, bounceRange: 300 };
        }

        let count = isBounce ? 1 : weaponStats.count;
        let currentDamage = isBounce ? bounceDamage : weaponStats.damage;
        let currentBounces = isBounce ? remainingBounces : (weaponStats.bounces || 0);

        for (let i = 0; i < count; i++) {
            let finalAngle = angle;
            if (count > 1) {
                const spread = (weaponStats.type === 'scam_box') ? 0.8 : 0.2;
                finalAngle = angle - (spread / 2) + (spread / (count - 1)) * i;
            }

            // Jitter
            const jx = startX + (Math.random() - 0.5) * 15;
            const jy = startY + (Math.random() - 0.5) * 15;

            let proj = {
                type: weaponStats.type,
                x: jx, y: jy,
                vx: Math.cos(finalAngle) * (weaponStats.speed || 500),
                vy: Math.sin(finalAngle) * (weaponStats.speed || 500),
                radius: weaponStats.size || 5,
                life: (weaponStats.range || 400) / (weaponStats.speed || 100),
                damage: currentDamage,
                hitList: [],
                dead: false,
                angle: finalAngle,
                time: 0
            };

            if (weaponStats.type === 'gun') {
                proj.color = '#fbbf24'; proj.pierce = weaponStats.pierce;
            } else if (weaponStats.type === 'hook') {
                proj.state = 'out'; proj.speed = weaponStats.speed; proj.returnSpeed = weaponStats.returnSpeed;
                proj.maxDist = weaponStats.range; proj.currentDist = 0; proj.angle = finalAngle;
            } else if (weaponStats.type === 'card') {
                proj.color = '#111'; proj.bounces = currentBounces; proj.rotation = finalAngle; proj.bounceRange = weaponStats.bounceRange;
            } else if (weaponStats.type === 'glitch') {
                proj.text = '💬'; proj.splitCount = weaponStats.splitCount;
            } else if (weaponStats.type === 'car') {
                proj.color = '#ef4444'; proj.pierce = weaponStats.pierce; proj.rotation = finalAngle;
            } else if (weaponStats.type === 'tool_minion') {
                proj.life = weaponStats.range / 100;
                proj.target = null;
            } else if (weaponStats.type === 'binary') {
                proj.text = Math.random() > 0.5 ? '1' : '0';
                proj.color = '#00ff00';
                proj.pierce = weaponStats.pierce;
                proj.baseVx = proj.vx;
                proj.baseVy = proj.vy;
            } else if (weaponStats.type === 'scam_box') {
                const throwSpeed = 300;
                proj.vx = Math.cos(finalAngle) * throwSpeed;
                proj.vy = Math.sin(finalAngle) * throwSpeed;
                proj.life = 10;
                proj.drag = 0.95;
            }
            newEntitiesQueue.push({ cat: 'proj', obj: proj });
        }
    } catch (e) { console.error("Fire error", e); }
}

function spawnExplosion(x, y, damage, hurtsPlayer = false) {
    createParticles(x, y, '#f97316', 8);
    createParticles(x, y, '#ef4444', 8);

    // If it's Yao Ge's explosion, maybe show some cash
    if (state.selectedChar === 'yaoge') {
        createParticles(x, y, '#22c55e', 4); // Money color
    }

    if (hurtsPlayer) {
        const dist = Math.hypot(player.x - x, player.y - y);
        if (dist < 80) {
            player.hp -= 30;
            updatePlayerHpUi();
            spawnDamageNumber(player.x, player.y, "-30", "#ef4444");
            if (player.hp <= 0) gameOver();
        }
    }

    for (let e of enemies) {
        if (!e || e.dead) continue;
        if (Math.hypot(e.x - x, e.y - y) < 80) {
            e.hp -= damage * 0.8;
            e.pushX = (e.x - x) * 2; e.pushY = (e.y - y) * 2;
            e.flashTimer = 0.1;
            spawnDamageNumber(e.x, e.y, Math.round(damage * 0.8), '#f97316');
            if (e.hp <= 0) markEnemyDead(e);
        }
    }
}

function markEnemyDead(e) {
    if (!e || e.dead) return;
    e.dead = true;
    state.kills++;
    uiKills.textContent = state.kills;

    // Trigger Kill Streak Dialog
    if (state.kills % 20 === 0) triggerDialog('killStreak');

    if (e.isBoss) {
        state.bossActive = false;
        state.bossObj = null;

        // Trigger Victory Line if it was Big Boss
        if (e.type === 'bigBoss') {
            const lines = charConfigs[state.selectedChar].dialogs;
            if (lines && lines.final) showDialog(lines.final, 5000);
        }

        newEntitiesQueue.push({ cat: 'gem', obj: { x: e.x, y: e.y, radius: 10, color: '#fbbf24', val: 500, dead: false } });
    } else {
        if (e.type === 'splitter') {
            for (let k = 0; k < 2; k++) {
                newEntitiesQueue.push({
                    cat: 'enemy', obj: {
                        id: Math.random(), type: 'small',
                        x: e.x + (Math.random() - 0.5) * 20, y: e.y + (Math.random() - 0.5) * 20,
                        radius: 8, color: '#4ade80', speed: 100, hp: 30, maxHp: 30, pushX: 0, pushY: 0, flashTimer: 0, dead: false
                    }
                });
            }
        }
        newEntitiesQueue.push({ cat: 'gem', obj: { x: e.x, y: e.y, radius: 5, color: '#00ff88', val: 5, dead: false } });
    }
}

function gainXp(amount) {
    // Apply XP Multiplier
    const actualAmount = amount * (player.stats.xpMult || 1);
    state.xp += actualAmount;

    if (state.xp >= state.xpToNextLevel) {
        state.xp -= state.xpToNextLevel;
        state.xpToNextLevel = Math.floor(state.xpToNextLevel * 1.3);
        levelUp();
    }
    xpBar.style.width = `${Math.min(100, (state.xp / state.xpToNextLevel) * 100)}%`;
}

function spawnDamageNumber(x, y, text, color = '#fff') {
    // Add velocity for "pop" effect
    damageNumbers.push({
        x, y, text, life: 0.8, color, dead: false,
        vx: (Math.random() - 0.5) * 50, vy: -50 - Math.random() * 50, // Float up
        scale: 1
    });
}

function createParticles(x, y, color, count, type = 'circle') {
    if (particles.length > MAX_PARTICLES) return;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 150 + 50;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            color, life: 0.5 + Math.random() * 0.3, maxLife: 0.8, alpha: 1, dead: false,
            type: type === 'random' ? ['circle', 'rect', 'spark'][Math.floor(Math.random() * 3)] : type,
            size: Math.random() * 4 + 2,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 10
        });
    }
}

function spawnGlitchParticles(x, y, count, damage) {
    const chars = ['?', '!', '#', '&', '%', '$', 'X'];
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        newEntitiesQueue.push({
            cat: 'proj', obj: {
                type: 'glitch_sub',
                x: x, y: y,
                vx: Math.cos(angle) * 300, vy: Math.sin(angle) * 300,
                radius: 10, life: 0.3, damage: damage * 0.5, hitList: [], text: chars[Math.floor(Math.random() * chars.length)], color: '#fff', dead: false
            }
        });
    }
}

function levelUp() {
    state.level++;
    uiLevel.textContent = state.level;
    state.paused = true;
    triggerDialog('levelUp'); // Dialog on level up

    const pool = [...commonUpgrades];
    if (charUpgrades[state.selectedChar]) pool.push(...charUpgrades[state.selectedChar]);

    const validPool = pool.filter(u => {
        const currentCount = player.inventory[u.id] ? player.inventory[u.id].count : 0;
        if (u.type === 'heal') return true;
        return currentCount < 8;
    });

    const choices = [];
    const poolToUse = validPool.length > 0 ? validPool : pool.filter(u => u.type === 'heal');

    for (let i = 0; i < 3; i++) {
        if (poolToUse.length === 0) break;
        const idx = Math.floor(Math.random() * poolToUse.length);
        choices.push(poolToUse[idx]);
    }

    const list = document.getElementById('upgrade-list');
    list.innerHTML = '';
    choices.forEach(u => {
        const el = document.createElement('div');
        el.className = 'upgrade-card';
        // Show NEW tag if not in inventory
        const isNew = !player.inventory[u.id] && u.type !== 'heal';
        const newTag = isNew ? '<span class="bg-red-500 text-white text-xs px-1 rounded ml-2">NEW!</span>' : '';

        el.innerHTML = `
            <div class="upgrade-icon"><i class="fas ${u.icon}"></i></div>
            <div class="upgrade-info"><span class="upgrade-title">${u.name} ${newTag}</span><span class="upgrade-desc">${u.desc}</span></div>
            <div class="type-tag ${u.cat === 'active' ? 'tag-active' : 'tag-passive'}">${u.cat}</div>
        `;
        el.onclick = () => applyUpgrade(u);
        list.appendChild(el);
    });
    document.getElementById('upgrade-screen').style.display = 'flex';
}

function applyUpgrade(u) {
    // Track inventory
    if (!player.inventory[u.id]) player.inventory[u.id] = { name: u.name, icon: u.icon, count: 0, cat: u.cat };
    player.inventory[u.id].count++;

    // Apply Logic with SAFETY CAPS
    if (u.type === 'complex') {
        u.apply(player.weapon);
    } else if (u.type === 'weapon') {
        if (u.stat === 'fireRate') {
            player.weapon[u.stat] *= u.val;
            if (player.weapon[u.stat] < 0.05) player.weapon[u.stat] = 0.05;
        }
        else if (u.stat === 'count' || u.stat === 'pierce') {
            // FIXED: Use additive for count/pierce
            player.weapon[u.stat] += u.val;
        }
        else if (u.stat === 'damage' || u.stat === 'range' || u.stat === 'size') player.weapon[u.stat] *= u.val;
        else player.weapon[u.stat] = (player.weapon[u.stat] || 0) * u.val;
    } else if (u.type === 'player') {
        if (u.stat === 'maxHp') {
            // Special handling for MaxHP to actually update the player's health pool
            let oldMax = player.maxHp;
            player.maxHp = Math.floor(player.maxHp * u.val);
            // Option: Heal the difference so percentage stays roughly same or just add difference
            player.hp = Math.floor(player.hp * u.val);
            updatePlayerHpUi();
        } else if (u.method === 'add') {
            player.stats[u.stat] = (player.stats[u.stat] || 0) + u.val;
        } else {
            player.stats[u.stat] = (player.stats[u.stat] || 1) * u.val;
            if (u.stat === 'speed' && player.stats.speed > 3) player.stats.speed = 3;
        }
    } else if (u.type === 'heal') {
        player.hp = Math.min(player.maxHp, player.hp + (player.maxHp * u.val));
        updatePlayerHpUi();
    } else if (u.type === 'special') {
        if (u.tag === 'lifesteal') player.lifesteal = true;
        if (u.tag === 'compound') player.compoundInterest = true;
    } else if (u.type === 'summon') {
        spawnCompanion(u.summonType);
    }

    updateInventoryUI();
    document.getElementById('upgrade-screen').style.display = 'none';
    state.paused = false;
}


function gameOver() {
    state.running = false;
    const config = charConfigs[state.selectedChar];
    const finalChar = document.getElementById('final-char');
    const deathQuote = document.getElementById('death-quote');
    const finalTime = document.getElementById('final-time');
    const finalKills = document.getElementById('final-kills');
    const gameOverScreen = document.getElementById('game-over-screen');

    if (finalChar) finalChar.textContent = config.name;
    if (deathQuote) deathQuote.textContent = config.deathQuote;
    if (finalTime) finalTime.textContent = uiTimer.textContent;
    if (finalKills) finalKills.textContent = state.kills;
    if (gameOverScreen) gameOverScreen.style.display = 'flex';
}

function showStageTransition() {
    state.paused = true;
    const config = charConfigs[state.selectedChar];
    const storyText = document.getElementById('stage-story-text');
    const btnContainer = document.getElementById('stage-btn-container');

    const screen = document.getElementById('stage-transition-screen');
    screen.style.display = 'flex';

    // Set Header to "关卡完成！"
    const header = screen.querySelector('h2');
    if (header) header.textContent = "關卡完成！";

    // Special logic for Shan Ji
    if (state.selectedChar === 'shanji') {
        storyText.innerText = "森林入口處，妳看見一個熟悉的富二代身影狼狽地卡在樹叢裡...\n\n包子：『學姐！！救我！！我會聽話的！！』\n妳可以選擇讓他當跟班，雖然他沒什麼戰力，但至少能擋個子彈？";
        btnContainer.innerHTML = `
            <button class="btn btn-green" onclick="continueToNextStage(true)">勉強讓他跟（獲得包子跟班）</button>
            <button class="btn" onclick="continueToNextStage(false)">自己走（無視他）</button>
        `;
    } else {
        storyText.textContent = config.forestStory;
        btnContainer.innerHTML = `<button class="btn btn-green" onclick="continueToNextStage(false)">進入森林</button>`;
    }

    // Clear entities
    enemies = [];
    projectiles = [];
    xpGems = [];
    particles = [];
    damageNumbers = [];
    newEntitiesQueue = [];
    state.bossActive = false;
    state.bossObj = null;
}

function initCompanion(type) {
    spawnCompanion(type);
}


function continueToNextStage(withCompanion) {
    document.getElementById('stage-transition-screen').style.display = 'none';

    // 1. Advance Stage
    state.stage = 2;
    state.stageStartTime = state.gameTime;
    state.paused = false;

    // 2. Reset Player Position
    player.x = width / 2;
    player.y = height / 2;

    // 3. Reset Spawn Flags
    midBossSpawned = false;
    bigBossSpawned = false;
    spawnTimer = 0;

    // 4. Reset Character State (Level 1, No Items)
    state.level = 1;
    state.xp = 0;
    state.xpToNextLevel = 10;

    player.inventory = {};
    player.lifesteal = false;
    player.compoundInterest = false;
    player.invulnTimer = 0;
    player.regenTimer = 0;
    state.companions = []; // Reset companions

    // Re-apply base config
    const config = charConfigs[state.selectedChar];
    player.weapon = JSON.parse(JSON.stringify(config.weapon));
    player.weapon.lastShot = 0;
    player.hp = 100;
    player.maxHp = 100;
    player.stats = { damage: 1, speed: 1, fireRate: 1, pickupRange: 150, armor: 0, xpMult: 1 };

    // Re-apply Innate Passives
    if (config.innate) {
        for (const [key, val] of Object.entries(config.innate)) {
            if (key === 'armor' || key === 'regen' || key === 'thorns') {
                player.stats[key] = (player.stats[key] || 0) + val;
            } else if (key === 'maxHp') {
                player.maxHp += val;
                player.hp += val;
            } else if (key === 'fireRate') {
                player.stats[key] = (player.stats[key] || 1) / val;
            } else {
                player.stats[key] = (player.stats[key] || 1) * val;
            }
        }
    }

    // 5. Update UI
    uiLevel.textContent = state.level;
    xpBar.style.width = '0%';
    updatePlayerHpUi();
    updateInventoryUI();

    // 6. Add Companion if selected
    if (withCompanion) {
        initCompanion('richkid');
    }
}


function updatePlayerHpUi() {
    const pct = Math.max(0, (player.hp / player.maxHp) * 100);
    playerHpFill.style.width = `${pct}%`;

    let text = `${Math.ceil(player.hp)}/${Math.ceil(player.maxHp)}`;
    if (player.shield > 0) {
        text += ` (+${Math.ceil(player.shield)})`;
        playerHpContainer.style.borderColor = '#3b82f6';
        playerHpContainer.style.boxShadow = '0 0 10px #3b82f6';
    } else {
        playerHpContainer.style.borderColor = 'rgba(255,255,255,0.3)';
        playerHpContainer.style.boxShadow = 'none';
    }
    playerHpText.textContent = text;
}

function selectChar(type, el) {
    state.selectedChar = type;
    document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
}

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    if (!state.running) { player.x = width / 2; player.y = height / 2; }
}
window.addEventListener('resize', resize);
resize();

function haltError(e) {
    console.error(e);
    errorLog.style.display = 'block';
    errorLog.innerText = `ERR: ${e.message ? e.message.substring(0, 20) : '?'}. Resetting arrays.`;
    enemies = enemies.filter(x => x && !x.dead);
    projectiles = projectiles.filter(x => x && !x.dead);
    setTimeout(() => errorLog.style.display = 'none', 2000);
}

function startGame() {
    try {
        const config = charConfigs[state.selectedChar];
        player.color = config.color;
        player.radius = config.radius;
        // Image Init
        player.imgObj = null;
        if (config.image) {
            player.imgObj = new Image();
            player.imgObj.src = config.image;
        }
        player.weapon = JSON.parse(JSON.stringify(config.weapon));
        player.weapon.lastShot = 0;
        player.lifesteal = false;
        player.compoundInterest = false;
        player.hp = 100;
        player.maxHp = 100;
        player.shield = 0; // Shield init
        player.invulnTimer = 0;
        player.inventory = {};
        // Reset stats multipliers
        player.stats = { damage: 1, speed: 1, fireRate: 1, pickupRange: 150, armor: 0, xpMult: 1 };
        player.regenTimer = 0; // Shan Ji Regen Init

        // Apply Innate Passives
        if (config.innate) {
            for (const [key, val] of Object.entries(config.innate)) {
                // Additive logic for armor/regen/thorns, Multiplicative for others
                if (key === 'armor' || key === 'regen' || key === 'thorns') {
                    player.stats[key] = (player.stats[key] || 0) + val;
                } else if (key === 'maxHp') {
                    player.maxHp += val;
                    player.hp += val;
                } else if (key === 'fireRate') {
                    player.stats[key] = (player.stats[key] || 1) / val; // e.g. 0.9 means 10% faster (1/0.9)
                } else {
                    player.stats[key] = (player.stats[key] || 1) * val;
                }
            }
        }

        projectiles = [];
        enemies = [];
        particles = [];
        xpGems = [];
        damageNumbers = [];
        newEntitiesQueue = [];

        document.getElementById('start-screen').style.display = 'none';
        playerHpContainer.style.display = 'block';
        updatePlayerHpUi();
        updateInventoryUI();
        const stageConfig = STAGE_CONFIGS[state.selectedStage] || STAGE_CONFIGS[1];
        state.map.width = stageConfig.mapWidth || width;
        state.map.height = stageConfig.mapHeight || height;
        state.walls = JSON.parse(JSON.stringify(stageConfig.walls || []));

        player.x = state.map.width / 2;
        player.y = state.map.height / 2;

        // Init Camera (Center on player)
        state.camera.x = player.x - width / 2;
        state.camera.y = player.y - height / 2;

        state.running = true;
        // Keep pending companions if any
        const pending = state.pendingCompanions || [];
        state.companions = [];
        state.pendingCompanions = []; // Reset pending

        state.gameTime = 0;

        // Spawn them now
        pending.forEach(type => spawnCompanion(type));

        state.enemies = [];
        state.kills = 0;
        state.level = 1;
        state.xp = 0;
        uiKills.textContent = 0;
        uiLevel.textContent = 1;

        triggerDialog('start'); // Start dialog

        // --- SOUND INIT (Safe) ---
        SoundMgr.init();
        SoundMgr.startBgm();

        // Show Intro Story instead of immediate start
        showIntroStory();
    } catch (e) { haltError(e); }
}

function showIntroStory() {
    state.paused = true;
    const config = charConfigs[state.selectedChar];
    const storyText = document.getElementById('stage-story-text');
    const btnContainer = document.getElementById('stage-btn-container');

    const screen = document.getElementById('stage-transition-screen');
    screen.style.display = 'flex';

    // Set Header to "Story"
    const header = screen.querySelector('h2');
    if (header) header.textContent = "故事";

    state.storyPage = 0;
    renderStoryPage();
}

function renderStoryPage() {
    const config = charConfigs[state.selectedChar];
    const storyText = document.getElementById('stage-story-text');
    const btnContainer = document.getElementById('stage-btn-container');

    let content = config.forestStory || "準備進入危險區域...";

    // Safety check for empty story
    if (Array.isArray(content) && content.length === 0) content = "準備進入危險區域...";

    let isMultiPage = Array.isArray(content);
    let pageData = isMultiPage ? content[state.storyPage] : content;

    // Clear previous buttons
    btnContainer.innerHTML = '';

    if (typeof pageData === 'object' && pageData !== null) {
        // Choice Page
        storyText.innerHTML = pageData.text.replace(/\n/g, '<br>');

        if (pageData.choices) {
            pageData.choices.forEach(choice => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-blue mb-2 w-full'; // Use styled class
                btn.style.marginBottom = '10px';
                btn.innerText = choice.text;
                btn.onclick = () => handleStoryChoice(choice);
                btnContainer.appendChild(btn);
            });
        }
    } else {
        // Standard Text Page
        storyText.innerHTML = (pageData || "").replace(/\n/g, '<br>');

        let hasNext = isMultiPage && state.storyPage < content.length - 1;
        if (hasNext) {
            btnContainer.innerHTML = `<button class="btn btn-green" onclick="nextStoryPage()">繼續</button>`;
        } else {
            btnContainer.innerHTML = `<button class="btn btn-green" onclick="startActualGame()">開始任務</button>`;
        }
    }
}

function handleStoryChoice(choice) {
    if (choice.action && choice.action.startsWith('recruit_')) {
        const type = choice.action.split('_')[1];
        if (!state.pendingCompanions) state.pendingCompanions = [];
        state.pendingCompanions.push(type);
    }

    // Advancing logic:
    // If choice has 'outcome', show it immediately? 
    // Simplify: Just go to next page if normal, or if 'outcome' text provided, show it?
    // Let's assume the choice leads to the next linear page for now, 
    // OR if we want to branch, we'd need complex logic.
    // For this simple request, we can just say "Choice Made -> Next Page".
    // But if the user wants "Outcome", we can trigger a popup or just advance.
    nextStoryPage();
}

function nextStoryPage() {
    state.storyPage++;
    renderStoryPage();
}


function startActualGame() {
    document.getElementById('stage-transition-screen').style.display = 'none';
    state.paused = false;

    // Spawn pending companions (from story choices)
    if (state.pendingCompanions && state.pendingCompanions.length > 0) {
        state.pendingCompanions.forEach(type => spawnCompanion(type));
        state.pendingCompanions = []; // Clear after spawning
    }

    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    if (!state.running) return;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    if (!state.paused) {
        try {
            update(dt);
            draw();
        } catch (e) {
            haltError(e);
        }
    }
    animationId = requestAnimationFrame(gameLoop);
}

function update(dt) {
    if (dt > 0.1) dt = 0.1;
    state.gameTime += dt;
    uiTimer.textContent = `${Math.floor(state.gameTime / 60).toString().padStart(2, '0')}:${Math.floor(state.gameTime % 60).toString().padStart(2, '0')}`;

    // Camera Update
    updateCamera(dt);

    // Check for stage transition at 5 minutes (300 seconds)
    if (state.stage === 1 && state.gameTime >= 300 && !state.stage1Cleared) {
        state.stage1Cleared = true; // Set flag to prevent re-triggering
        showStageTransition();
    }

    handleInput(dt);
    handleSpawns(dt);

    if (newEntitiesQueue.length > 0) {
        newEntitiesQueue.forEach(item => {
            if (!item || !item.obj) return;
            if (item.cat === 'enemy' && enemies.length < MAX_ENEMIES) enemies.push(item.obj);
            if (item.cat === 'gem') xpGems.push(item.obj);
            if (item.cat === 'proj') projectiles.push(item.obj);
        });
        newEntitiesQueue = [];
    }

    // --- Companion Update ---
    updateCompanions(dt);

    updateEntities(dt);
    checkCollisions();

    enemies = enemies.filter(e => e && !e.dead);
    projectiles = projectiles.filter(p => p && !p.dead);
    xpGems = xpGems.filter(g => g && !g.dead);
    particles = particles.filter(p => p && !p.dead);
    damageNumbers = damageNumbers.filter(d => d && !d.dead);

    // Player logic
    if (player.invulnTimer > 0) {
        player.invulnTimer -= dt;
        damageOverlay.style.opacity = player.invulnTimer * 1.5;
    } else {
        damageOverlay.style.opacity = 0;
    }

    // Regen Logic (Shan Ji)
    if (player.stats.regen > 0 && player.hp < player.maxHp) {
        player.regenTimer += dt;
        if (player.regenTimer >= 5) {
            player.hp = Math.min(player.maxHp, player.hp + player.stats.regen);
            updatePlayerHpUi();
            spawnDamageNumber(player.x, player.y, `+${player.stats.regen}`, '#00ff88');
            player.regenTimer = 0;
        }
    }

    // Clamp to Map Bounds (not just Screen)
    const mapW = state.map.width || width;
    const mapH = state.map.height || height;

    // Wall Collision First
    resolveWallCollision(player);

    player.x = Math.max(player.radius, Math.min(mapW - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(mapH - player.radius, player.y));

    // Low HP Dialog Check
    if (player.hp < player.maxHp * 0.3 && Math.random() < 0.01) {
        triggerDialog('lowHp');
    }

    if (state.bossActive && state.bossObj && !state.bossObj.dead) {
        bossHud.style.display = 'block';
        bossNameDisplay.textContent = state.bossObj.bossName;
        const pct = Math.max(0, (state.bossObj.hp / state.bossObj.maxHp) * 100);
        bossHpFill.style.width = `${pct}%`;
    } else {
        bossHud.style.display = 'none';
    }
}

function handleInput(dt) {
    let dx = 0, dy = 0;
    if (keys.w || keys.ArrowUp) dy = -1;
    if (keys.s || keys.ArrowDown) dy = 1;
    if (keys.a || keys.ArrowLeft) dx = -1;
    if (keys.d || keys.ArrowRight) dx = 1;
    if (joystickActive) { dx = joystickVector.x; dy = joystickVector.y; }
    if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 1 || !joystickActive) { dx /= len; dy /= len; }

        // Apply speed multiplier
        const moveSpeed = player.speed * (player.stats.speed || 1);
        player.x += dx * moveSpeed * dt;
        player.y += dy * moveSpeed * dt;
    } else {
        // Idle Dialog Check?
    }
}

let spawnTimer = 0;
let midBossSpawned = false;
let bigBossSpawned = false;

// --- WALL & CAMERA HELPERS ---
function resolveWallCollision(e) {
    if (!state.walls || state.walls.length === 0) return;

    // Simple AABB vs Circle resolution loops
    // We try to resolve X then Y or vice versa.
    let hit = false;

    // X Axis separation
    state.walls.forEach(w => {
        // Nearest point on rect to circle center
        const closestX = Math.max(w.x, Math.min(e.x, w.x + w.w));
        const closestY = Math.max(w.y, Math.min(e.y, w.y + w.h));

        const distX = e.x - closestX;
        const distY = e.y - closestY;
        const distSq = distX * distX + distY * distY;

        if (distSq < (e.radius * e.radius)) {
            const dist = Math.sqrt(distSq);
            if (dist === 0) return; // Exact overlap edge case

            // Push out
            const overlap = e.radius - dist;
            e.x += (distX / dist) * overlap;
            e.y += (distY / dist) * overlap;
            hit = true;
        }
    });
    return hit;
}

function checkWallHit(x, y, radius) {
    if (!state.walls) return false;
    for (const w of state.walls) {
        const closestX = Math.max(w.x, Math.min(x, w.x + w.w));
        const closestY = Math.max(w.y, Math.min(y, w.y + w.h));
        const dX = x - closestX;
        const dY = y - closestY;
        if ((dX * dX + dY * dY) < (radius * radius)) return true;
    }
    return false;
}

function updateCamera(dt) {
    // Smooth follow player
    const targetX = player.x - width / 2;
    const targetY = player.y - height / 2;

    // Clamp to map bounds (if map is defined)
    // We assume map starts at 0,0 usually? Config says yes.
    // If we want camera to stop at edges:
    const mapW = state.map.width || width;
    const mapH = state.map.height || height;

    // Lerp factor
    const t = 5 * dt;
    state.camera.x += (targetX - state.camera.x) * t;
    state.camera.y += (targetY - state.camera.y) * t;

    // Hard Clamp if desired (Optional, maybe let camera see void?)
    // Clamp so viewport doesn't leave map too much?
    // Let's keep it somewhat free but biased.
    if (state.camera.x < -100) state.camera.x = -100;
    if (state.camera.y < -100) state.camera.y = -100;
    if (state.camera.x > mapW - width + 100) state.camera.x = mapW - width + 100;
    if (state.camera.y > mapH - height + 100) state.camera.y = mapH - height + 100;
}

function handleSpawns(dt) {
    if (enemies.length >= MAX_ENEMIES) return; // Cap

    if (!midBossSpawned && state.gameTime > 60 && state.stage === 1) { spawnBoss('mid'); midBossSpawned = true; }
    if (!bigBossSpawned && state.gameTime > 180 && state.stage === 1) { spawnBoss('big'); bigBossSpawned = true; }

    // Stage 2 Bosses (Simple logic: spawn bosses again later in stage 2)
    if (!midBossSpawned && state.stage === 2 && (state.gameTime - state.stageStartTime) > 60) { spawnBoss('mid'); midBossSpawned = true; }
    if (!bigBossSpawned && state.stage === 2 && (state.gameTime - state.stageStartTime) > 180) { spawnBoss('big'); bigBossSpawned = true; }

    // Calculate difficulty time
    let difficultyTime = state.gameTime;
    if (state.stage === 2) {
        difficultyTime = (state.gameTime - state.stageStartTime) * 1.2; // Stage 2 ramps up slightly faster
    }

    let rate = Math.max(0.1, 0.8 - (difficultyTime / 120) * 0.5);
    if (state.bossActive) rate *= 1.5;

    spawnTimer += dt;
    if (spawnTimer > rate) {
        spawnTimer = 0;
        spawnEnemyLogic();
    }
}

function spawnEnemyLogic() {
    // Spawn near the player's view (Camera)
    const camX = state.camera.x;
    const camY = state.camera.y;
    const camW = width;
    const camH = height;
    const mapW = state.map.width || width;
    const mapH = state.map.height || height;

    const side = Math.floor(Math.random() * 4);
    let ex, ey;
    const buffer = 50;

    // Pick a point just outside the camera view
    switch (side) {
        case 0: ex = camX + Math.random() * camW; ey = camY - buffer; break; // Top
        case 1: ex = camX + camW + buffer; ey = camY + Math.random() * camH; break; // Right
        case 2: ex = camX + Math.random() * camW; ey = camY + camH + buffer; break; // Bottom
        case 3: ex = camX - buffer; ey = camY + Math.random() * camH; break; // Left
    }

    // Clamp to World Bounds (if strictly required, or let them spawn outside?)
    // If we clamp, they might spawn ON SCREEN if we are at edge.
    // Let's allow them to spawn slightly outside map if needed?
    // Or just clamp and accept they might appear visible? 
    // Let's clamp to be safe for physics, but maybe 100px padding?
    // Actually, update loop might kill them if too far? No current logic kills for distance.

    // Simplest: Check if inside wall?
    // Let's just spawn.

    const scale = 1 + (state.gameTime / 100);
    const r = Math.random();

    let type = 'basic';
    let speed = 65;
    let hp = 90 * scale;
    let color = '#ef4444';
    let radius = 12;

    if (state.gameTime > 30 && r > 0.8) { type = 'jumper'; color = '#facc15'; speed = 40; hp = 60 * scale; }
    else if (state.gameTime > 90 && r > 0.85) { type = 'kamikaze'; color = '#f97316'; speed = 120; hp = 40 * scale; }
    else if (state.gameTime > 120 && r > 0.9) {
        type = 'splitter'; color = '#22c55e'; speed = 45; hp = 150 * scale; radius = 16;
        if (Math.random() < 0.3) {
            // Elite?
        }
    }

    enemies.push({
        id: Math.random(), type: type, x: ex, y: ey, radius: radius, color: color,
        speed: speed * (1 + (state.gameTime / 600)), hp: hp, maxHp: hp,
        pushX: 0, pushY: 0, flashTimer: 0, state: 'move', stateTimer: 0, dead: false
    });
}

function spawnBoss(tier) {
    state.bossActive = true;
    // Spawn above player relative to world
    let boss = {
        id: Math.random(), isBoss: true, x: player.x, y: player.y - 500,
        pushX: 0, pushY: 0, flashTimer: 0, state: 'move', dead: false
    };

    // Ensure within map bounds Y (don't spawn in void if at top)
    if (boss.y < 50) boss.y = player.y + 500; // Spawn below if at top

    // Trigger Boss Dialog
    triggerDialog('boss');

    if (tier === 'mid') {
        boss.type = 'midBoss'; boss.bossName = '巨型坦克'; boss.radius = 35; boss.color = '#7f1d1d';
        boss.hp = 5000; boss.maxHp = 5000; boss.speed = 50;
    } else {
        boss.type = 'bigBoss'; boss.bossName = '深淵巨口'; boss.radius = 60; boss.color = '#4c1d95';
        boss.hp = 25000; boss.maxHp = 25000; boss.speed = 30; boss.summonTimer = 0;
    }
    state.bossObj = boss;
    enemies.push(boss);
}

function updateEntities(dt) {
    player.weapon.lastShot += dt;
    // Apply Fire Rate Multiplier
    const actualFireRate = player.weapon.fireRate / (player.stats.fireRate || 1);

    if (player.weapon.lastShot >= actualFireRate) {
        let nearest = null, minDist = player.weapon.range * (player.stats.pickupRange ? 1 : 1); // Not using pickup range for weapon range, but we could add a weapon range stat later
        // Actually apply 'range' stat modifier
        const actualRange = player.weapon.range * (player.weapon.rangeMod || 1); // If we had range mod

        for (const e of enemies) {
            if (e.dead) continue;
            const dist = Math.hypot(e.x - player.x, e.y - player.y);
            if (dist < actualRange) { // Use actual range check if implementing range stat
                if (dist < minDist) {
                    minDist = dist; nearest = e;
                }
            }
        }
        // For simplicity, auto-fire even if no enemy for some weapons? No, sticky to nearest.
        // Just use existing logic but with stat
        let rangeCheck = player.weapon.range;
        // Hack: check '怀表' duration logic which increases range
        // If we mapped 'duration' upgrade to 'range' stat on weapon in applyUpgrade, it works automatically.

        // Find nearest
        let target = null;
        let closest = 9999;
        for (const e of enemies) {
            if (e.dead) continue;
            const d = Math.hypot(e.x - player.x, e.y - player.y);
            if (d < closest && d < player.weapon.range) {
                closest = d;
                target = e;
            }
        }

        if (target) {
            fireWeapon(target);
            player.weapon.lastShot = 0;
        } else if (player.weapon.type === 'scam_box' || player.weapon.type === 'tool_minion') {
            // Some weapons might deploy without target?
            // Let's keep requirement for target for now to keep it simple
        }
    }

    // Projectiles
    for (let p of projectiles) {
        if (!p || p.dead) continue;

        if (p.type === 'card' || p.type === 'car') p.rotation = Math.atan2(p.vy, p.vx);

        if (p.type === 'hook' && p.state !== 'out') {
            if (p.state === 'pause') {
                p.pauseTimer -= dt; p.angle += 20 * dt;
                if (p.pauseTimer <= 0) p.state = 'return';
            } else if (p.state === 'return') {
                const angle = Math.atan2(player.y - p.y, player.x - p.x);
                p.x += Math.cos(angle) * p.returnSpeed * dt;
                p.y += Math.sin(angle) * p.returnSpeed * dt;
                p.angle -= 10 * dt;
                if (Math.hypot(player.x - p.x, player.y - p.y) < 20) { p.dead = true; continue; }
            }
        } else if (p.type === 'glitch_sub') {
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.vx += (Math.random() - 0.5) * 500 * dt; p.vy += (Math.random() - 0.5) * 500 * dt;
            p.life -= dt; if (p.life <= 0) p.dead = true;
        } else if (p.type === 'tool_minion') {
            p.life -= dt; if (p.life <= 0) p.dead = true;

            let target = null;
            let minDist = 300;
            for (const e of enemies) {
                if (e.dead) continue;
                const dist = Math.hypot(e.x - p.x, e.y - p.y);
                if (dist < minDist) { minDist = dist; target = e; }
            }
            if (target) {
                const angle = Math.atan2(target.y - p.y, target.x - p.x);
                p.vx = Math.cos(angle) * player.weapon.speed;
                p.vy = Math.sin(angle) * player.weapon.speed;
            }
            p.x += p.vx * dt; p.y += p.vy * dt;
        } else if (p.type === 'binary') {
            // Sine Wave Movement
            p.time += dt;
            // Calculate base movement
            let currentX = p.x + p.baseVx * dt;
            let currentY = p.y + p.baseVy * dt;

            // Add wave perpendicular to direction
            const amplitude = 15; // Wave height
            const frequency = 10; // Wave speed
            const wave = Math.sin(p.time * frequency) * amplitude;

            // Perpendicular vector (-y, x)
            const perpAngle = p.angle + Math.PI / 2;
            p.x = currentX + Math.cos(perpAngle) * wave * dt * 10;
            p.y = currentY + Math.sin(perpAngle) * wave * dt * 10;

            p.life -= dt; if (p.life <= 0) p.dead = true;
        } else if (p.type === 'scam_box') {
            // Slow down via drag
            if (p.drag) {
                p.vx *= p.drag;
                p.vy *= p.drag;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) p.dead = true;
        } else if (p.isTrap) {
            // Trap Logic: Decelerate and arm
            p.speed *= 0.95;
            p.x += p.vx * (p.speed / 300) * dt;
            p.y += p.vy * (p.speed / 300) * dt;
            p.life -= dt;
            if (p.life <= 0) p.dead = true;

            // Check proximity to trigger
            for (const e of enemies) {
                if (e.dead) continue;
                if (Math.hypot(e.x - p.x, e.y - p.y) < p.radius + e.radius) {
                    spawnExplosion(p.x, p.y, p.damage); // Trap snaps
                    e.freezeTimer = 2.0; // Trap roots
                    spawnDamageNumber(e.x, e.y, "TRAPPED!", "#bef264");
                    p.dead = true;
                    break;
                }
            }
        } else {
            p.x += p.vx * dt; p.y += p.vy * dt;
            if (p.type === 'hook') {
                p.currentDist += p.speed * dt; p.angle += 10 * dt;
                if (p.currentDist >= p.maxDist) { p.state = 'pause'; p.pauseTimer = 0.1; }
            } else {
                p.life -= dt;
                if (p.life <= 0) {
                    if (p.type === 'car') spawnExplosion(p.x, p.y, p.damage);
                    p.dead = true;
                }
            }
        }

        // Wall Collision for Projectiles
        if (!p.dead && checkWallHit(p.x, p.y, p.radius || 4)) {
            // Special handling for some types?
            if (p.type === 'hook') {
                p.state = 'return'; // Bounce back
            } else {
                p.dead = true;
                // maybe particle puff?
            }
        }
    }

    // Enemies - NO REPULSION
    for (let e of enemies) {
        if (!e || e.dead) continue;

        let speed = e.speed;
        if (e.freezeTimer > 0) {
            e.freezeTimer -= dt;
            speed *= 0.5; // Slow down by 50%
            if (e.freezeTimer <= 0) e.color = e.orgColor || '#ef4444'; // Restore color (need to save orgColor?)
            // Actually, simple fallback:
            if (e.freezeTimer <= 0 && e.type === 'basic') e.color = '#ef4444';
        }

        e.x += e.pushX * dt; e.y += e.pushY * dt;
        e.pushX *= 0.9; e.pushY *= 0.9;

        if (e.vulnTimer > 0) e.vulnTimer -= dt; // Tick down vuln
        if (e.poisonTimer > 0) {
            e.poisonTimer -= dt;
            e.hp -= e.poisonDmg * dt;
            e.color = '#10b981'; // Poison look
            if (Math.random() < 0.1) spawnDamageNumber(e.x, e.y, Math.ceil(e.poisonDmg * dt), '#10b981');
        }

        const distToPlayer = Math.hypot(player.x - e.x, player.y - e.y);

        if (e.type === 'kamikaze') {
            if (e.state === 'move') {
                const angle = Math.atan2(player.y - e.y, player.x - e.x);
                e.x += Math.cos(angle) * speed * dt;
                e.y += Math.sin(angle) * speed * dt;
                if (distToPlayer < 60) { e.state = 'priming'; e.stateTimer = 1.0; }
            } else if (e.state === 'priming') {
                e.stateTimer -= dt;
                e.color = (Math.floor(Date.now() / 100) % 2 === 0) ? '#fff' : '#f97316';
                if (e.stateTimer <= 0) { spawnExplosion(e.x, e.y, 40, true); markEnemyDead(e); }
            }
        } else if (e.type === 'jumper') {
            if (e.state === 'move') {
                const angle = Math.atan2(player.y - e.y, player.x - e.x);
                e.x += Math.cos(angle) * speed * dt;
                e.y += Math.sin(angle) * speed * dt;
                e.stateTimer -= dt;
                if (Math.random() < 0.01) { e.state = 'charge'; e.stateTimer = 0.5; }
            } else if (e.state === 'charge') {
                e.stateTimer -= dt;
                if (e.stateTimer <= 0) {
                    e.state = 'leap'; e.stateTimer = 0.4;
                    const angle = Math.atan2(player.y - e.y, player.x - e.x);
                    e.vx = Math.cos(angle) * 350; e.vy = Math.sin(angle) * 350;
                }
            } else if (e.state === 'leap') {
                e.stateTimer -= dt; e.x += e.vx * dt; e.y += e.vy * dt;
                if (e.stateTimer <= 0) e.state = 'move';
            }
        } else if (e.type === 'bigBoss') {
            const angle = Math.atan2(player.y - e.y, player.x - e.x);
            e.x += Math.cos(angle) * speed * dt;
            e.y += Math.sin(angle) * speed * dt;
            e.summonTimer += dt;
            if (e.summonTimer > 5) {
                e.summonTimer = 0;
                for (let k = 0; k < 3; k++) {
                    newEntitiesQueue.push({
                        cat: 'enemy', obj: {
                            id: Math.random(), type: 'basic',
                            x: e.x + (Math.random() - 0.5) * 50, y: e.y + (Math.random() - 0.5) * 50,
                            radius: 10, color: '#ef4444', speed: 80, hp: 50, maxHp: 50, pushX: 0, pushY: 0, flashTimer: 0, dead: false
                        }
                    });
                }
            }
        } else {
            const angle = Math.atan2(player.y - e.y, player.x - e.x);
            e.x += Math.cos(angle) * speed * dt;
            e.y += Math.sin(angle) * speed * dt;
        }

        resolveWallCollision(e);

        if (e.flashTimer > 0) e.flashTimer -= dt;
        if (e.hp <= 0 && !e.dead) markEnemyDead(e);
    }

    for (let g of xpGems) {
        if (g.dead) continue;
        // Apply Pickup Range
        const pickupR = player.stats.pickupRange || 150;
        if (Math.hypot(g.x - player.x, g.y - player.y) < pickupR) {
            g.x += (player.x - g.x) * 6 * dt;
            g.y += (player.y - g.y) * 6 * dt;
            if (Math.hypot(g.x - player.x, g.y - player.y) < player.radius) {
                gainXp(g.val); g.dead = true;
            }
        }
    }

    damageNumbers.forEach(d => {
        d.x += (d.vx || 0) * dt;
        d.y += (d.vy || -30) * dt;
        if (d.vx) d.vx *= 0.9;
        d.life -= dt;
        if (d.life <= 0) d.dead = true;
    });
    particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.rotSpeed) p.rotation = (p.rotation || 0) + p.rotSpeed * dt;
        p.life -= dt;
        p.alpha = p.life / p.maxLife;
        if (p.life <= 0) p.dead = true;
    });
}

function checkCollisions() {
    // Player vs Enemy
    for (const e of enemies) {
        if (!e || e.dead) continue;
        if (Math.hypot(e.x - player.x, e.y - player.y) < e.radius + player.radius) {
            // HIT PLAYER
            if (player.invulnTimer <= 0) {
                // Apply Armor
                let rawDmg = 10;
                if (e.type === 'bigBoss') rawDmg = 25;
                if (e.type === 'midBoss') rawDmg = 15;

                const armor = player.stats.armor || 0;
                const finalDmg = Math.max(1, rawDmg - armor);

                // Shield Logic
                if (player.shield > 0) {
                    if (player.shield >= finalDmg) {
                        player.shield -= finalDmg;
                        spawnDamageNumber(player.x, player.y, "BLOCKED", "#3b82f6");
                    } else {
                        const rem = finalDmg - player.shield;
                        player.shield = 0;
                        player.hp -= rem;
                        spawnDamageNumber(player.x, player.y, `-${Math.ceil(rem)}`, "#ef4444");
                    }
                } else {
                    player.hp -= finalDmg;
                }

                player.invulnTimer = 0.5;
                updatePlayerHpUi();

                // Hurt Dialog
                triggerDialog('hurt');

                // Thorns Check (Ah Zhang innate)
                if (player.stats.thorns > 0) {
                    e.hp -= player.stats.thorns;
                    spawnDamageNumber(e.x, e.y, player.stats.thorns, '#a3a3a3');
                    if (e.hp <= 0) markEnemyDead(e);
                }

                if (player.hp <= 0) { gameOver(); return; }
            }
        }
    }

    for (let p of projectiles) {
        if (!p || p.dead) continue;
        if (p.type === 'hook' && p.state === 'return' && !p.hasResetHits) { p.hitList = []; p.hasResetHits = true; }

        for (let e of enemies) {
            if (!e || e.dead) continue;
            if (p.hitList.includes(e.id)) continue;

            const hitRadius = p.type === 'hook' ? p.radius * 2 : p.radius;
            if (Math.hypot(p.x - e.x, p.y - e.y) < hitRadius + e.radius) {

                if (p.type === 'scam_box') {
                    spawnExplosion(p.x, p.y, p.damage * (player.stats.damage || 1));
                    p.dead = true;
                    break;
                }

                // Apply Damage Multiplier
                let dmg = p.damage * (player.stats.damage || 1);

                // Execute Effect (Gemini)
                if (p.execute && e.hp < e.maxHp * 0.3) {
                    dmg *= 2.0;
                    spawnDamageNumber(e.x, e.y - 15, "EXECUTE", "#ef4444");
                }

                // Poison Effect (Gemini)
                if (p.poison) {
                    e.poisonTimer = 3.0; // 3s Duration
                    e.poisonDmg = p.poison;
                }

                // Vulnerability Multiplier
                if (e.vulnTimer > 0) {
                    dmg *= 1.3; // +30% Damage taken
                    spawnDamageNumber(e.x, e.y, "CRACKED", "#f472b6");
                }

                // Crit Logic
                if (p.critChance && Math.random() < p.critChance) {
                    dmg *= 3.0;
                    spawnDamageNumber(e.x, e.y - 20, "CRITICAL!", "#a78bfa");
                }

                // Knockback Logic
                if (p.knockback) {
                    const angle = Math.atan2(e.y - p.y, e.x - p.x);
                    e.pushX += Math.cos(angle) * p.knockback;
                    e.pushY += Math.sin(angle) * p.knockback;
                }

                // Vulnerability Application
                if (p.vuln) {
                    e.vulnTimer = p.vuln;
                    e.color = '#f472b6'; // Visual cue
                }

                // Grok's Fireball Logic
                if (p.type === 'fireball') {
                    spawnExplosion(p.x, p.y, dmg, false); // false = don't hurt player
                    p.dead = true;
                    break;
                }

                e.hp -= dmg;

                e.flashTimer = 0.1;

                // Grok's Ice Logic
                if (p.type === 'ice_shard') {
                    e.freezeTimer = p.freeze || 1.0;
                    e.color = '#38bdf8'; // Visual freeze effect
                    p.dead = true;
                    break;
                }

                // Grok's Lightning Logic
                if (p.type === 'lightning') {
                    if (p.chain > 0) {
                        p.chain--;
                        // Find next target
                        let nextTarget = null;
                        let minDist = 300;
                        for (const cand of enemies) {
                            if (cand.dead || cand.id === e.id || p.hitList.includes(cand.id)) continue;
                            const d = Math.hypot(cand.x - p.x, cand.y - p.y);
                            if (d < minDist) { minDist = d; nextTarget = cand; }
                        }
                        if (nextTarget) {
                            // Chain!
                            // Create a new lightning projectile starting from here to next target
                            // Or just move this projectile? Moving is easier for visual continuity if speed is high.
                            // But creating new is safer for logic.
                            // Let's just bounce this one.
                            const angle = Math.atan2(nextTarget.y - p.y, nextTarget.x - p.x);
                            p.vx = Math.cos(angle) * 900;
                            p.vy = Math.sin(angle) * 900;
                            // Update position slightly to avoid immediate re-collision with same enemy
                            p.x += p.vx * 0.05;
                            p.y += p.vy * 0.05;
                            // Reset hit list? No, we want to avoid hitting same.
                            // But we need to ensure it doesn't hit the current one again immediately.
                            // The hitList check handles it.
                        } else {
                            p.dead = true;
                        }
                    } else {
                        p.dead = true;
                    }
                    if (p.dead) break; // Don't break if chaining, let it continue (collision logic handles hitList)
                }

                p.hitList.push(e.id);

                if (state.selectedChar === 'richkid' && player.lifesteal && Math.random() < 0.05) {
                    player.hp = Math.min(player.maxHp, player.hp + 2);
                    updatePlayerHpUi();
                    spawnDamageNumber(player.x, player.y, '+HP', '#10b981');
                }

                // Effects
                let color = '#fff';
                let txt = Math.round(dmg);
                if (state.selectedChar === 'richkid') { txt = '$'; color = '#ffd700'; createParticles(e.x, e.y, '#ffd700', 4); }
                else if (state.selectedChar === 'ahzhang') { txt = '?'; color = '#a3a3a3'; createParticles(e.x, e.y, '#fff', 2); }
                else if (state.selectedChar === 'ahjie') { txt = 'CRASH!'; color = '#ef4444'; createParticles(e.x, e.y, '#333', 3); }
                else if (state.selectedChar === 'ahcheng') { txt = Math.random() > 0.5 ? '1' : '0'; color = '#22c55e'; createParticles(e.x, e.y, '#22c55e', 2); }
                else createParticles(e.x, e.y, '#fff', 2);
                spawnDamageNumber(e.x, e.y, txt, color);

                let pushForce = 50;
                if (p.type === 'hook') pushForce = 120;
                if (p.type === 'car') pushForce = 200;
                if (e.isBoss) pushForce *= 0.1;

                const ang = Math.atan2(e.y - p.y, e.x - p.x);
                e.pushX = Math.cos(ang) * pushForce;
                e.pushY = Math.sin(ang) * pushForce;

                if (e.hp <= 0) markEnemyDead(e);

                if (p.type === 'gun') {
                    if (p.pierce > 0) p.pierce--; else { p.dead = true; break; }
                } else if (p.type === 'card') {
                    p.dead = true;
                    if (p.bounces > 0) {
                        let nextTarget = null, minDist = p.bounceRange;
                        for (const cand of enemies) {
                            if (cand.dead || cand.id === e.id) continue;
                            const d = Math.hypot(cand.x - p.x, cand.y - p.y);
                            if (d < minDist) { minDist = d; nextTarget = cand; }
                        }
                        if (nextTarget) {
                            let nextDmg = dmg;
                            if (player.compoundInterest) nextDmg *= 1.2;
                            fireWeapon(nextTarget, p.x, p.y, true, nextDmg, p.bounces - 1);
                        }
                    }
                    break;
                } else if (p.type === 'glitch') {
                    p.dead = true; spawnGlitchParticles(p.x, p.y, p.splitCount, dmg); break;
                } else if (p.type === 'glitch_sub') {
                    p.dead = true; break;
                } else if (p.type === 'car') {
                    if (p.pierce > 0) p.pierce--;
                    else { p.dead = true; spawnExplosion(p.x, p.y, dmg); break; }
                } else if (p.type === 'tool_minion') {
                    p.dead = true; // One hit
                    break;
                } else if (p.type === 'binary') {
                    if (p.pierce > 0) p.pierce--; else { p.dead = true; break; }
                }
            }
        }
    }

    // Gem pickup logic handled in updateEntities to use magnet stat
}

// Draw functions
function draw() {
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(-state.camera.x, -state.camera.y);

    // --- DRAW MAP / BACKGROUND ---
    // If Map is defined, render map boundary
    const mapW = state.map.width || width;
    const mapH = state.map.height || height;

    // Background Color
    if (state.selectedStage === 3) {
        ctx.fillStyle = '#0f172a'; // Dark Forest
    } else {
        ctx.fillStyle = '#374151'; // Campus
    }
    // Draw background rect covering map + buffer for camera shake
    ctx.fillRect(state.camera.x - 100, state.camera.y - 100, width + 200, height + 200);
    // Actually efficient to draw only visible, but map size is usually finite.
    // Let's draw the specific map area if it's large.
    if (state.selectedStage === 3) {
        ctx.fillStyle = '#064e3b'; // Forest Floor
        ctx.fillRect(0, 0, mapW, mapH);
    }

    // Grid / Tiles
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const gridSize = 100;

    // Determine draw bounds based on camera to optimize
    const startX = Math.floor(state.camera.x / gridSize) * gridSize;
    const endX = startX + width + gridSize;
    const startY = Math.floor(state.camera.y / gridSize) * gridSize;
    const endY = startY + height + gridSize;

    for (let x = startX; x < endX; x += gridSize) { ctx.moveTo(x, startY); ctx.lineTo(x, endY); }
    for (let y = startY; y < endY; y += gridSize) { ctx.moveTo(startX, y); ctx.lineTo(endX, y); }
    ctx.stroke();

    // Debug Map Border
    ctx.strokeStyle = '#ef4444';
    ctx.strokeRect(0, 0, mapW, mapH);

    // --- DRAW WALLS ---
    if (state.walls && state.walls.length > 0) {
        ctx.fillStyle = '#1e293b'; // Slate 800
        ctx.strokeStyle = '#94a3b8'; // Slate 400
        ctx.lineWidth = 4;
        state.walls.forEach(w => {
            ctx.fillRect(w.x, w.y, w.w, w.h);
            ctx.strokeRect(w.x, w.y, w.w, w.h);
        });
    }

    // XP Gems
    gemsUpdated = 0;
    xpGems.forEach(g => {
        if (!g) return;
        ctx.fillStyle = g.color;

        ctx.shadowBlur = 10;
        ctx.shadowColor = g.color;

        // Pulsate
        const pulse = 1 + Math.sin(state.gameTime * 5 + g.x) * 0.2;
        const size = g.radius * pulse;

        ctx.beginPath();
        // Diamond shape
        ctx.moveTo(g.x, g.y - size);
        ctx.lineTo(g.x + size, g.y);
        ctx.lineTo(g.x, g.y + size);
        ctx.lineTo(g.x - size, g.y);
        ctx.fill();

        ctx.shadowBlur = 0;
    });

    // Projectiles
    projectiles.forEach(p => {
        if (!p) return;
        ctx.save(); ctx.translate(p.x, p.y);
        // Glow
        if (p.type !== 'glitch' && p.type !== 'glitch_sub') {
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color || '#fff';
        }
        if (p.type === 'card') {
            ctx.rotate(p.rotation);
            ctx.fillStyle = '#111'; ctx.beginPath();
            const w = p.radius * 2, h = p.radius * 1.2;
            ctx.roundRect(-w / 2, -h / 2, w, h, 2); ctx.fill();
            ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.fillStyle = '#fbbf24'; ctx.fillRect(-w / 2 + 3, -h / 4, 4, 3);
        } else if (p.type === 'hook') {
            ctx.rotate(p.angle);
            ctx.fillStyle = '#a5f3fc'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, p.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        } else if (p.type === 'glitch') {
            ctx.font = `${p.radius * 2}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.text, 0, 0);
        } else if (p.type === 'glitch_sub') {
            ctx.fillStyle = '#a3a3a3'; ctx.font = `bold ${p.radius * 2}px monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.text, 0, 0);
        } else if (p.type === 'car') {
            ctx.rotate(p.rotation);
            ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.roundRect(-20, -10, 40, 20, 4); ctx.fill();
            ctx.fillStyle = '#333'; ctx.fillRect(-5, -8, 15, 16);
            ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(18, -6, 3, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(18, 6, 3, 0, Math.PI * 2); ctx.fill();
        } else if (p.type === 'tool_minion') {
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🏃‍♂️', 0, 0);
        } else if (p.type === 'binary') {
            ctx.fillStyle = '#22c55e';
            ctx.font = `bold ${p.radius * 2}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.text, 0, 0);
        } else if (p.type === 'scam_box') {
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🎁', 0, 0);
        } else if (p.type === 'sniper_shot') {
            ctx.fillStyle = '#a78bfa'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-p.radius * 4, -p.radius); ctx.lineTo(-p.radius * 4, p.radius); ctx.fill();
        }
        else {
            ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, p.radius, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        if (p.type === 'hook') {
            ctx.beginPath(); ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 1.5; ctx.moveTo(player.x, player.y); ctx.lineTo(p.x, p.y); ctx.stroke();
        }
    });

    // Companions
    if (state.companions) {
        state.companions.forEach(c => {
            if (c.dead) return;
            if (c.imgObj && c.imgObj.complete && c.imgObj.naturalWidth !== 0) {
                const size = c.radius * 2.8; ctx.drawImage(c.imgObj, c.x - size / 2, c.y - size / 2, size, size);
            } else {
                ctx.beginPath(); ctx.fillStyle = c.color; ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2); ctx.fill();
            }
            // HP
            const pct = Math.max(0, c.hp / c.maxHp);
            ctx.fillStyle = '#374151'; ctx.fillRect(c.x - 10, c.y - 20, 20, 4);
            ctx.fillStyle = '#10b981'; ctx.fillRect(c.x - 10, c.y - 20, 20 * pct, 4);
        });
    }

    // Enemies
    enemies.forEach(e => {
        if (!e) return;
        ctx.save();
        ctx.translate(e.x, e.y);
        const diffX = player.x - e.x;
        const diffY = player.y - e.y;
        const angle = Math.atan2(diffY, diffX);
        ctx.rotate(angle);

        const breathe = 1 + Math.sin(state.gameTime * 4 + e.id * 10) * 0.03;
        ctx.scale(breathe, breathe);

        let skinColor = '#65a30d';
        if (e.type === 'fast') skinColor = '#b91c1c';
        if (e.type === 'tank') skinColor = '#3f6212';
        if (e.type === 'bigBoss' || e.type === 'midBoss') skinColor = '#4c1d95';
        if (e.flashTimer > 0) skinColor = '#ffffff';

        if (e.type !== 'splitter' && e.type !== 'bigBoss') {
            ctx.fillStyle = skinColor;
            ctx.beginPath(); ctx.roundRect(e.radius * 0.2, -e.radius * 0.8, e.radius * 0.8, e.radius * 0.25, 2); ctx.fill();
            ctx.beginPath(); ctx.roundRect(e.radius * 0.2, e.radius * 0.55, e.radius * 0.8, e.radius * 0.25, 2); ctx.fill();
        }

        ctx.fillStyle = skinColor;
        ctx.shadowBlur = 10; ctx.shadowColor = e.color;

        if (e.type === 'tank') {
            ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#84cc16';
            ctx.beginPath(); ctx.arc(-e.radius * 0.3, -e.radius * 0.3, e.radius * 0.2, 0, Math.PI * 2); ctx.fill();
        } else if (e.type === 'fast') {
            ctx.beginPath(); ctx.ellipse(0, 0, e.radius, e.radius * 0.7, 0, 0, Math.PI * 2); ctx.fill();
        } else if (e.type === 'bigBoss') {
            ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill(); // Simplification
        } else {
            ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
        }

        ctx.fillStyle = '#fff';
        if (e.type === 'fast') ctx.fillStyle = '#fecaca';
        const eyeX = e.radius * 0.3; const eyeY = e.radius * 0.3; const eyeSize = e.radius * 0.25;
        ctx.beginPath(); ctx.arc(eyeX, -eyeY, eyeSize, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(eyeX + eyeSize * 0.5, -eyeY, eyeSize * 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(eyeX + eyeSize * 0.5, eyeY, eyeSize * 0.2, 0, Math.PI * 2); ctx.fill();

        ctx.restore();

        // Boss HP
        if (e.isBoss) {
            ctx.fillStyle = '#000'; ctx.fillRect(e.x - 30, e.y - e.radius - 15, 60, 8);
            ctx.fillStyle = '#ef4444'; ctx.fillRect(e.x - 30, e.y - e.radius - 15, 60 * (e.hp / e.maxHp), 8);
        }
    });

    // Draw Player
    if (player.invulnTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) ctx.globalAlpha = 0.5;
    ctx.save();
    ctx.translate(player.x, player.y);
    let pAngle = 0;
    if (joystickActive) {
        pAngle = Math.atan2(joystickVector.y, joystickVector.x);
    } else {
        // Correct Mouse Angle with Camera
        const mX = mouseX + state.camera.x;
        const mY = mouseY + state.camera.y;
        pAngle = Math.atan2(mY - player.y, mX - player.x);
    }
    ctx.rotate(pAngle);

    if (player.imgObj && player.imgObj.complete && player.imgObj.naturalWidth !== 0) {
        const size = player.radius * 2.8;
        ctx.drawImage(player.imgObj, -size / 2, -size / 2, size, size);
    } else {
        ctx.fillStyle = player.color; ctx.beginPath(); ctx.arc(0, 0, player.radius, 0, Math.PI * 2); ctx.fill();
        if (state.selectedChar === 'ahjie') {
            ctx.fillStyle = '#fef08a'; ctx.fillRect(-8, -6, 16, 6); // Headlight kind of
        }
        else {
            ctx.fillStyle = player.color; ctx.beginPath(); ctx.arc(10, 10, 6, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(10, -10, 6, 0, Math.PI * 2); ctx.fill();
        }
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    // Character Overhead Icons
    if (state.running) {
        if (state.selectedChar === 'shanji') {
            ctx.font = '20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText('💄', player.x - 10, player.y - 15);
        } else if (state.selectedChar === 'ahcheng') {
            ctx.fillStyle = '#22c55e'; ctx.font = '16px monospace'; ctx.fillText('01', player.x - 8, player.y - 20);
        } else if (state.selectedChar === 'yaoge') {
            ctx.font = '20px Arial'; ctx.fillText('💸', player.x - 10, player.y - 20);
        }
    }

    // Particles
    particles.forEach(p => {
        if (!p) return;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation || 0);
        ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color; ctx.shadowBlur = 5; ctx.shadowColor = p.color;
        const size = p.size || 2;
        if (p.type === 'rect') ctx.fillRect(-size / 2, -size / 2, size, size);
        else { ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
    });
    ctx.globalAlpha = 1;

    // Damage Numbers
    ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center';
    damageNumbers.forEach(d => {
        if (!d) return;
        ctx.fillStyle = d.color; ctx.fillText(d.text, d.x, d.y);
    });

    ctx.restore(); // END CAMERA

    // Speech Bubble (DOM Position Update)
    if (state.running) {
        const bubble = document.getElementById('speech-bubble');
        if (bubble && bubble.style.opacity === '1') {
            const screenX = player.x - state.camera.x;
            const screenY = player.y - state.camera.y;
            bubble.style.left = `${screenX}px`;
            bubble.style.top = `${screenY - 60}px`;
        }
    }
}

window.addEventListener('keydown', e => { if (keys.hasOwnProperty(e.key)) keys[e.key] = true; });
window.addEventListener('keyup', e => { if (keys.hasOwnProperty(e.key)) keys[e.key] = false; });

const joystickZone = document.getElementById('joystick-zone');
const joystickKnob = document.getElementById('joystick-knob');
let joyTouchId = null, joyCenter = { x: 0, y: 0 };

joystickZone.addEventListener('touchstart', e => {
    e.preventDefault(); const touch = e.changedTouches[0]; joyTouchId = touch.identifier; joystickActive = true;
    const rect = joystickZone.getBoundingClientRect(); joyCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    updateJoystick(touch.clientX, touch.clientY);
}, { passive: false });
joystickZone.addEventListener('touchmove', e => { e.preventDefault(); for (let t of e.changedTouches) if (t.identifier === joyTouchId) updateJoystick(t.clientX, t.clientY); }, { passive: false });
function endJoystick(e) { for (let t of e.changedTouches) if (t.identifier === joyTouchId) { joystickActive = false; joyTouchId = null; joystickKnob.style.transform = `translate(-50%,-50%)`; joystickVector = { x: 0, y: 0 }; } }
joystickZone.addEventListener('touchend', endJoystick); joystickZone.addEventListener('touchcancel', endJoystick);
function updateJoystick(cx, cy) {
    let dx = cx - joyCenter.x, dy = cy - joyCenter.y; const dist = Math.hypot(dx, dy), clamp = Math.min(dist, 60); const ang = Math.atan2(dy, dx);
    joystickKnob.style.transform = `translate(calc(-50% + ${Math.cos(ang) * clamp}px), calc(-50% + ${Math.sin(ang) * clamp}px))`;
    joystickVector.x = (dx / dist) * Math.min(1, dist / 60); joystickVector.y = (dy / dist) * Math.min(1, dist / 60);
}

// MOUSE INPUT
let mouseX = 0, mouseY = 0;
let lastClickTime = 0;

window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});
window.addEventListener('mousedown', () => {
    if (!state.running || state.paused) return;
    if (Date.now() - lastClickTime < 300) return; // Debounce
    lastClickTime = Date.now();
});