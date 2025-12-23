// Game Data Definitions
// NOTE: To add a custom image for a character, add `image: 'img/filename.png'` to their config object.
// Image should be approx 64x64px PNG with transparency.

const charConfigs = {
    shooter: {
        name: '幾何特工', color: '#3b82f6', radius: 15,
        weapon: { type: 'gun', damage: 20, fireRate: 0.5, range: 400, speed: 550, count: 1, pierce: 0, size: 4 },
        deathQuote: "我只是想回家...",
        forestStory: [
            "雖然逃出了學校，但這裡的植被太茂密了，視野極差。\n我回想起剛剛在混亂中，有個怪人拿著奇怪的裝置在掃描。\n\n「喂！那個拿槍的！掩護我一下！」",
            {
                text: "是那個自稱駭客的阿程。\n他似乎知道些什麼，但也可能只是個累贅。\n\n還是算了，獨狼行動效率最高。",
                choices: [
                    { text: "獨狼行動 (開始遊戲)", action: "none" }
                ]
            }
        ],
        innate: { fireRate: 0.9 }, // 10% faster
        dialogs: {
            start: ["任務開始。", "掃蕩區域。", "希望這次能準時下班。"],
            levelUp: ["火力升級。", "裝備更新完畢。", "更有把握了。"],
            hurt: ["中彈！", "請求支援！", "護甲受損！"],
            lowHp: ["情況危急！", "我需要醫療包！", "快撐不住了..."],
            killStreak: ["清除目標。", "效率不錯。", "像打靶一樣。"],
            boss: ["發現高價值目標！", "準備迎戰 Boss。", "這傢伙看起來很硬。"],
            final: ["任務完成，準備撤離。"]
        }
    },
    fisherman: {
        name: '阿星', color: '#06b6d4', radius: 16,
        weapon: { type: 'hook', damage: 45, fireRate: 1.2, range: 300, speed: 500, count: 1, pierce: 999, size: 8, returnSpeed: 600 },
        deathQuote: "魚線...斷了。",
        forestStory: [
            // Chapter 1: School Campus
            "【第一章：校園浩劫】\n\n「哇！千年校慶的人潮跟魚群一樣多！」\n\n我本來正開心地在園遊會的撈金魚攤位，跟老闆比拼誰的網子比較薄。\n阿璋還在旁邊直播：「各位觀眾！這就是傳說中的『神之一手』阿星！」\n\n原本約好大家結束後要去溪邊烤肉，連釣竿都準備好了...",
            {
                text: "結果突然間，旁邊的遊客發出了不像人類的嘶吼聲。\n攤位被掀翻，金魚灑了一地，但我只來得及抓起我的釣竿。\n\n混亂中，我看見阿傑正試圖發動他的改裝車，但似乎遇到了麻煩。",
                choices: [
                    { text: "幫阿傑修車一起逃 (隊友: 阿傑加入)", action: "recruit_ahjie" },
                    { text: "顧好釣竿自己閃人 (獲得:速度+30%)", action: "abandon_ahjie" }
                ]
            },
            "廣播室裡傳來斷斷續續的聲音...\n\n『...慈幼...附近...森林...安全...』\n\n看來得往森林方向移動了。但那裡真的安全嗎？",
            // Chapter 2: Misty Forest
            "【第二章：迷霧森林】\n\n森林入口處，一個熟悉的身影卡在樹叢裡掙扎著。\n\n「學長！！救我！！」\n\n是包子...這傢伙身上的名牌衣服都刮破了，VIP卡散落一地。",
            {
                text: "「學長，我知道我以前常凹你請客，但這次我會保護你的！」包子拼命地說。\n\n雖然他沒什麼戰力...但至少能擋個子彈？",
                choices: [
                    { text: "救包子當肉盾 (隊友: 包子加入)", action: "recruit_richkid" },
                    { text: "順便拿走他的VIP補給箱 (獲得:立即升2級)", action: "loot_richkid" }
                ]
            },
            "深入森林後，發現一個廢棄的研究站。\n\n資料夾上寫著：『東方錶面工廠 - 永生計劃』\n\n東方錶面...那不是包子家的企業嗎？",
            {
                text: "突然，前方傳來腳步聲。\n\n是山雞！她帶著一小隊倖存者。\n\n「阿星...你釣魚的技術能幫我們獲取食物。跟我們一起吧。」",
                choices: [
                    { text: "加入山雞的隊伍 (隊友: 山雞加入)", action: "recruit_shanji" },
                    { text: "謝謝，但我習慣獨來獨往 (獲得:攻擊+50%)", action: "abandon_shanji" }
                ]
            },
            "檔案裡的真相讓人不寒而慄...\n\n千年校慶是人體實驗場，總統也參與其中。\n\n包子（如果在隊）：「學長...我爸可能跟這件事有關...我們必須去工廠看看。」",
            // Chapter 3: Factory
            "【第三章：錶面之下】\n\n東方錶面工廠籠罩在詭異的綠光中。\n\n入口處堆滿了變異的工人屍體。",
            "深入工廠核心，突然有人從陰影中走出來。\n\n「我我我早早就就知知道...這這是是個個騙騙局局...」\n\n是耀哥！他手裡拿著病毒核心樣本，眼神瘋狂。",
            {
                text: "耀哥：「他他們們想想要要永永生生...但但這這只只是是謊謊言言！\n我我們們必必須須毁毁掉掉它它！」\n\n他遞給你兩個選擇...",
                choices: [
                    { text: "啟動自毀裝置，徹底消滅病毒", action: "ending_destroy" },
                    { text: "竊取樣本，尋找解藥", action: "ending_cure" },
                    { text: "推開耀哥，自己帶樣本逃走", action: "ending_escape" }
                ]
            }
        ],
        innate: { pickupRange: 1.5 }, // +50% range
        dialogs: {
            start: ["今天浪況不錯。", "來釣大魚囉！", "我快到了！(其實還在家)", "再五分鐘！"],
            levelUp: ["換個更強的餌。", "這竿子手感不錯。", "升級釣具！"],
            hurt: ["魚鉤勾到手了！", "好痛！", "被魚咬了！"],
            lowHp: ["要翻船了...", "快沒力氣捲線了...", "救生衣呢？"],
            killStreak: ["爆桶了！", "這條魚真大！", "天才小釣手就是我。"],
            boss: ["這條是大物！", "小心爆線！", "看我把你釣上來！"],
            final: "⋯⋯這輩子最大的漁獲。"
        }
    },
    richkid: {
        name: '包子', color: '#fbbf24', radius: 14,
        weapon: { type: 'card', damage: 35, fireRate: 0.9, range: 450, speed: 700, count: 1, bounces: 2, bounceRange: 300, size: 10 },
        deathQuote: "學長...這次沒辦法買單了...",
        forestStory: [
            "「今天的消費，全由黃公子買單！」我在 VIP 包廂裡對著阿星學長、阿傑還有阿璋大喊。\n\n難得我們四個死黨聚在一起參加這場千年校慶。阿傑剛還在吹噓他的新改裝，阿璋忙著直播，阿星學長則是在物色哪裡可以偷閒釣魚。\n本來應該是個完美的兄弟聚會，直到那個服務生咬了我的保鑣一口。",
            {
                text: "「護駕！護駕！」\n場面瞬間失控，人群尖叫著四散奔逃。混亂中，我跟學長他們走散了。\n那雙限量版球鞋全是泥巴，但我現在顧不了那麼多。\n\n「學長！你在哪裡？」我邊跑邊喊。\n\n前方似乎有一個熟悉的身影......",
                choices: [
                    { text: "那是阿星學長！快去會合 (隊友: 阿星加入)", action: "recruit_fisherman" },
                    { text: "不管了，先躲起來再說", action: "none" }
                ]
            }
        ],
        innate: { maxHp: 20, armor: 1 }, // Bonus stats
        dialogs: {
            start: ["這裡我買下來了。", "學長在哪裡？", "今天的消費由黃公子買單！"],
            levelUp: ["這是我用錢買的。", "再加碼投資！", "這裝備多少錢？我買了。"],
            hurt: ["護駕！護駕！", "我的名牌衣！", "好痛！我要告你！"],
            lowHp: ["快叫直升機！", "我有錢，別殺我！", "學長救我！"],
            killStreak: ["錢果然是萬能的。", "看清楚了嗎學長！", "全部打包帶走。"],
            boss: ["這傢伙值多少錢？", "能用錢解決嗎？", "這什麼醜八怪！"],
            final: "學長！我們活下來了！"
        }
    },
    ahzhang: {
        name: '阿璋', color: '#a3a3a3', radius: 15,
        weapon: { type: 'glitch', damage: 25, fireRate: 0.7, range: 350, speed: 400, count: 1, splitCount: 3, size: 14 },
        deathQuote: "微波爐...壞了。",
        forestStory: [
            "「各位觀眾，現在我們位於慈幼工商千年校慶現場！刷一波 666！」\n\n我正拿著穩定器直播，畫面裡是阿傑在炫耀他的新車。\n「這車速絕對有 200！」我也跟著起鬨。\n聊天室突然有人刷：「主播後面！那是真的喪屍嗎？」\n我還以為是特效，直到阿傑的車窗被血手印拍響。",
            {
                text: "訊號突然中斷，4G 變成了 E。\n當我慌忙逃竄時，發現總是吹牛的耀哥這次沒有吹牛，他正在被一群債主（喪屍）追殺。\n\n「耀哥？這也是節目效果嗎？」\n\n雖然他以前騙過我錢，但也是個難得的素材...",
                choices: [
                    { text: "拍下耀哥的窘境並救他 (隊友: 耀哥加入)", action: "recruit_yaoge" },
                    { text: "這素材太血腥了，會被黃標，算了", action: "none" }
                ]
            }
        ],
        innate: { thorns: 10 }, // Thorns
        dialogs: {
            start: ["複製成功。", "微波爐在看我。", "Loading..."],
            levelUp: ["系統更新。", "下載完成。", "Bug 修復中..."],
            hurt: ["Error 404.", "連線中斷。", "痛痛痛痛痛"],
            lowHp: ["電量不足。", "系統即將關閉。", "藍屏警告。"],
            killStreak: ["Ctrl+C, Ctrl+V.", "刪除檔案。", "格式化完成。"],
            boss: ["發現巨大 Bug。", "這是病毒嗎？", "防火牆被突破。"],
            final: "斷線重連成功。"
        }
    },
    ahjie: {
        name: '阿傑', color: '#ef4444', radius: 15,
        weapon: { type: 'car', damage: 60, fireRate: 1.5, range: 500, speed: 700, count: 1, pierce: 5, size: 20 },
        deathQuote: "這台車還沒繳分期付款...",
        forestStory: [
            "「這台可是我改了三個月的猛獸！」\n我們相約在校門口集合，引擎聲轟隆隆地響，吸引了不少目光。\n包子那傢伙還說要包下我的副駕駛座。\n\n「待會載你們去跑山，保證刺激！」\n\n當時的我沒想到，真正的「刺激」不是跑山，而是跑路。",
            {
                text: "人群突然像發瘋一樣湧向我的車。\n我只能棄車逃命。\n\n回頭一看，阿璋還拿著手機在那邊直播這場災難，完全沒注意到後面的危險。\n\n「那個笨蛋！為了流量命都不要了？」",
                choices: [
                    { text: "把阿璋拖上逃亡路線 (隊友: 阿璋加入)", action: "recruit_ahzhang" },
                    { text: "他自己會照顧自己，先溜", action: "none" }
                ]
            }
        ],
        innate: { speed: 1.2 }, // +20% speed
        dialogs: {
            start: ["上車，沒時間解釋了！", "這路況真差。", "油門踩到底！"],
            levelUp: ["改裝引擎！", "氮氣加速！", "換個新輪胎。"],
            hurt: ["板金凹了啦！", "要叫保險了！", "誰撞我？！"],
            lowHp: ["煞車失靈了！", "要火燒車了！", "快跳車！"],
            killStreak: ["路殺！", "全倒！", "這台車真耐撞。"],
            boss: ["這台是砂石車嗎？", "這撞下去會全損吧...", "閃遠點！"],
            final: "呼⋯⋯好險車沒壞。"
        }
    },
    shanji: {
        name: '山雞', color: '#d946ef', radius: 14,
        weapon: { type: 'tool_minion', damage: 40, fireRate: 1.5, range: 400, speed: 180, count: 2, size: 10 },
        deathQuote: "工具人都死光了嗎...",
        forestStory: [
            "千年校慶的喧鬧聲中，我正忙著把那些『追求者送的（醜）禮物』分送給姐妹們。\n\n「這給妳！這顏色超適合妳！」我把那個宅男送的包包塞給小美，臉上堆滿笑容。\n心裡卻在想：『終於把這佔位置的垃圾丟掉了。』\n\n就在我還在計算信用卡額度時，旁邊的同學突然張口咬住了另一個人的脖子。",
            {
                text: "「啊啊啊！」尖叫聲四起，我也跟著人群逃竄。\n這時，我看見那個蠢蛋包子正跌坐在地，手裡還揮舞著那張無限卡。\n\n「學姐！救我！我有錢！」包子哭喊著。\n\n那個沒用的富二代... 雖然很廢，但帶著他說不定能當個擋箭牌（或提款機）？",
                choices: [
                    { text: "命令包子跟上 (隊友: 包子加入)", action: "recruit_richkid" },
                    { text: "不管他，自己逃命", action: "none" }
                ]
            }
        ],
        innate: { regen: 3 }, // 3hp/5s
        dialogs: {
            start: ["好累喔，不想動。", "這裡好髒。", "誰來幫我拿包包？"],
            levelUp: ["勉強變強一點。", "這有好玩嗎？", "謝謝（敷衍）。"],
            hurt: ["你有事嗎？", "你有病嗎？", "好痛喔！"],
            lowHp: ["我要回家了！", "沒人愛我...", "救命啊！"],
            killStreak: ["工具人真好用。", "就這樣？", "我不喜歡暴力。"],
            boss: ["你有病嗎？", "快幫我處理掉！", "我不想看到它！"],
            final: "終於結束了，腳好痠。"
        },
        shanjiBaoziDialogs: [
            "包子：山雞！我來幫妳擋子彈！\n山雞：那是你應該做的。",
            "包子：這森林好多泥巴，我揹妳吧？\n山雞：不要，你流汗很臭。",
            "包子：我有黑卡，怪物能買通嗎？\n山雞：白癡。",
            "山雞：我渴了。\n包子：我馬上叫直升機空投斐濟水！",
            "山雞：走快點好不好？\n包子：遵命！",
            "包子：山雞，我們這算是在約會嗎？\n山雞：算你在加班。",
            "山雞：那個好噁心，你處理一下。\n包子：交給我的保鑣！...啊，我保鑣不在..."
        ]
    },
    ahcheng: {
        name: '阿程', color: '#22c55e', radius: 15,
        weapon: { type: 'binary', damage: 18, fireRate: 0.1, range: 450, speed: 400, count: 1, pierce: 3, size: 12 },
        deathQuote: "系統...關機...",
        forestStory: [
            "手機響了，是那個熟悉的號碼... 山雞。\n「阿程，能不能借我點錢？我們... 很久沒見了，出來聚聚吧？」\n\n你心裡明白，這大概率又是一次利用。但... 萬一她這次是真的想念舊情呢？\n雖然理智告訴你不要去，但身體卻誠實地前往了約定地點。",
            {
                text: "然而，當你到達現場時，還沒見到她的人影，周圍卻發生了可怕的異變...\n\n不遠處，你看見山雞被困在涼亭裡，高跟鞋跑斷了跟。\n\n「得救了... 得救了...」你喃喃自語，轉身離開了這裡。\n\n系統提示：已迴避高風險目標。",
                choices: [
                    { text: "忽略無效輸入，迴避風險 (開始遊戲)", action: "none" }
                ]
            }
        ], innate: { damage: 1.1, xpMult: 1.1 }, // +10% dmg/xp
        dialogs: {
            start: ["初始化環境...", "載入模組。", "讓我們開始 Debug。", "這不科學。", "到是是為什麼，是什麼原因。", "好煩，一直打哈欠。"],
            levelUp: ["算法優化。", "效能提升。", "重構代碼。", "根據書本所寫，應該是.....。"],
            hurt: ["Exception caught.", "發現漏洞！", "警告：攻擊判定。"],
            lowHp: ["記憶體溢出！", "Stack Overflow!", "核心過熱！"],
            killStreak: ["垃圾回收 (GC).", "執行緒終止。", "清除快取。", "變身.....假面騎士。", "龜派氣功。"],
            boss: ["偵測到大型物件。", "這是個難解的 Bug。", "需要更多算力。", "讓我分析一下。"],
            final: "System.exit(0);"
        }
    },
    yaoge: {
        name: '耀哥', color: '#a855f7', radius: 15,
        weapon: { type: 'scam_box', damage: 80, fireRate: 1.2, range: 200, speed: 0, count: 1, pierce: 1, size: 15 },
        deathQuote: "等等，我還沒跑路啊...",
        forestStory: [
            "你看... 這些樹... 都是... 珍貴的... 檜木... 我... 我有門路... \n本來想趁校慶來學校推銷我的新項目『檜木幣』，結果客戶都變成了喪屍。",
            {
                text: "「等等，我還沒跑路啊...」\n\n逃跑途中，我看見富家子弟包子正在撒錢（其實是嚇掉了錢包）。\n\n如果有個人幫我墊背，或者... 需要周轉資金的話...",
                choices: [
                    { text: "保護『大客戶』包子 (隊友: 包子加入)", action: "recruit_richkid" },
                    { text: "這單風險太高，止損離場", action: "none" }
                ]
            }
        ],
        innate: { xpMult: 1.25 }, // +25% xp
        dialogs: {
            start: ["有好康的要介紹給你。", "保證獲利。", "我是來幫大家的。"],
            levelUp: ["擴大經營。", "吸收更多下線。", "這波穩賺不賠。"],
            hurt: ["別動手，有話好說！", "我還錢就是了！", "誤會，都是誤會！"],
            lowHp: ["要跑路了！", "資金鍊斷裂！", "別抓我！"],
            killStreak: ["割韭菜囉！", "這單賺翻了。", "笨蛋真多。"],
            boss: ["這個客戶有點難搞。", "這單幹完就財富自由！", "大肥羊出現了。"],
            final: "伺服器關閉，捲款潛逃！"
        }
    }
};

const commonUpgrades = [
    { id: 'speed', name: '輕量化靴', desc: '移動速度 +15%', icon: 'fa-shoe-prints', type: 'player', stat: 'speed', val: 1.15, cat: 'passive' },
    { id: 'heal', name: '急救包', desc: '恢復 30% HP', icon: 'fa-heart-pulse', type: 'heal', val: 0.3, cat: 'consumable' },
    { id: 'dmg-boost', name: '力量強化', desc: '傷害 +20%', icon: 'fa-dumbbell', type: 'weapon', stat: 'damage', val: 1.2, cat: 'passive' },
    { id: 'magnet', name: '強力磁鐵', desc: '拾取範圍 +30%', icon: 'fa-magnet', type: 'player', stat: 'pickupRange', val: 1.3, cat: 'passive' },
    { id: 'armor', name: '防彈背心', desc: '受到的傷害減少 2點', icon: 'fa-shield-halved', type: 'player', stat: 'armor', val: 2, method: 'add', cat: 'passive' },
    { id: 'cooldown', name: '能量飲料', desc: '冷卻時間減少 10%', icon: 'fa-bolt', type: 'weapon', stat: 'fireRate', val: 0.9, cat: 'passive' },
    { id: 'duration', name: '懷錶', desc: '持續時間/射程 +20%', icon: 'fa-clock', type: 'weapon', stat: 'range', val: 1.2, cat: 'passive' },
    { id: 'scope', name: '瞄準鏡', desc: '子彈大小/範圍 +15%', icon: 'fa-crosshairs', type: 'weapon', stat: 'size', val: 1.15, cat: 'passive' }
];

const charUpgrades = {
    shooter: [
        { id: 'multishot', name: '彈幕支援', desc: '子彈數量 +1', icon: 'fa-person-military-rifle', type: 'weapon', stat: 'count', val: 1, cat: 'active' },
        { id: 'pierce', name: '爆裂彈頭', desc: '穿透力 +1', icon: 'fa-explosion', type: 'weapon', stat: 'pierce', val: 1, cat: 'active' },
        { id: 'tac-nuke', name: '戰術核彈', desc: '傷害 +40%', icon: 'fa-radiation', type: 'weapon', stat: 'damage', val: 1.4, cat: 'active' },
        { id: 'laser', name: '鐳射瞄準', desc: '子彈速度 +25%', icon: 'fa-bullseye', type: 'weapon', stat: 'speed', val: 1.25, cat: 'active' },
        { id: 'vest', name: '戰術背心', desc: '減傷 +3', icon: 'fa-shirt', type: 'player', stat: 'armor', val: 3, method: 'add', cat: 'passive' },
        { id: 'adrenaline', name: '腎上腺素', desc: '跑速 +20%', icon: 'fa-syringe', type: 'player', stat: 'speed', val: 1.2, cat: 'passive' },
        { id: 'grip', name: '穩定握把', desc: '射程 +30%', icon: 'fa-hand-holding', type: 'weapon', stat: 'range', val: 1.3, cat: 'passive' },
        { id: 'ammo', name: '彈藥包', desc: '冷卻 -15%', icon: 'fa-box', type: 'weapon', stat: 'fireRate', val: 0.85, cat: 'passive' }
    ],
    fisherman: [
        { id: 'multi-rod', name: '多重釣組', desc: '魚鉤數量 +1', icon: 'fa-clone', type: 'weapon', stat: 'count', val: 1, cat: 'active' },
        { id: 'big-hook', name: '巨型魚鉤', desc: '魚鉤體積 +30%', icon: 'fa-anchor', type: 'weapon', stat: 'size', val: 1.3, cat: 'active' },
        { id: 'net', name: '拖釣網', desc: '魚鉤射程 +40%', icon: 'fa-network-wired', type: 'weapon', stat: 'range', val: 1.4, cat: 'active' },
        { id: 'electric', name: '電擊魚鉤', desc: '傷害 +30%', icon: 'fa-bolt', type: 'weapon', stat: 'damage', val: 1.3, cat: 'active' },
        { id: 'patience', name: '耐心等待', desc: '回血 +20 (單次)', icon: 'fa-hourglass', type: 'heal', val: 0.2, cat: 'passive' },
        { id: 'muscle', name: '蠻力拉竿', desc: '傷害 +25%', icon: 'fa-arm-muscle', type: 'weapon', stat: 'damage', val: 1.25, cat: 'passive' },
        { id: 'vest-fish', name: '交際應酬', desc: '拾取範圍 +50%', icon: 'fa-users', type: 'player', stat: 'pickupRange', val: 1.5, cat: 'passive' },
        { id: 'soup', name: '高級料理', desc: '最大血量 +20%', icon: 'fa-utensils', type: 'player', stat: 'maxHp', val: 1.2, cat: 'passive' }
    ],
    richkid: [
        { id: 'limit-break', name: '額度調升', desc: '彈射次數 +1', icon: 'fa-credit-card', type: 'weapon', stat: 'bounces', val: 1, cat: 'active' },
        { id: 'cashback', name: '現金回饋', desc: '攻擊機率吸血', icon: 'fa-hand-holding-dollar', type: 'special', tag: 'lifesteal', cat: 'active' },
        { id: 'throw-money', name: '撒幣之術', desc: '傷害範圍 +30%', icon: 'fa-coins', type: 'weapon', stat: 'size', val: 1.3, cat: 'active' },
        { id: 'black-card', name: '黑卡特權', desc: '傷害 +30%', icon: 'fa-id-card', type: 'weapon', stat: 'damage', val: 1.3, cat: 'active' },
        { id: 'capitalism', name: '全面收購', desc: '拾取範圍 +40%', icon: 'fa-city', type: 'player', stat: 'pickupRange', val: 1.4, cat: 'passive' },
        { id: 'compound', name: '複利效應', desc: '彈射傷害遞增', icon: 'fa-chart-line', type: 'special', tag: 'compound', cat: 'passive' },
        { id: 'money-shield', name: '家族企業', desc: '減傷 +2', icon: 'fa-building', type: 'player', stat: 'armor', val: 2, method: 'add', cat: 'passive' },
        { id: 'doctor', name: '時間管理', desc: '冷卻 -15%', icon: 'fa-user-clock', type: 'weapon', stat: 'fireRate', val: 0.85, cat: 'passive' }
    ],
    ahzhang: [
        { id: 'keyboard-warrior', name: '鍵盤戰士', desc: '攻速 +20%', icon: 'fa-keyboard', type: 'weapon', stat: 'fireRate', val: 0.8, cat: 'active' },
        { id: 'more-nonsense', name: '嚴重跳針', desc: '亂碼數量 +2', icon: 'fa-comments', type: 'weapon', stat: 'splitCount', val: 2, cat: 'active' },
        { id: 'block-list', name: '封鎖名單', desc: '擊退力提升', icon: 'fa-ban', type: 'weapon', stat: 'damage', val: 1.2, cat: 'active' },
        { id: 'spam', name: '廢文連發', desc: '發射數量 +1', icon: 'fa-copy', type: 'weapon', stat: 'count', val: 1, cat: 'active' },
        { id: 'comfort', name: '自我感覺良好', desc: '最大血量 +25%', icon: 'fa-face-laugh-beam', type: 'player', stat: 'maxHp', val: 1.25, cat: 'passive' },
        { id: 'lonely-field', name: '邊緣立場', desc: '減傷 +3', icon: 'fa-circle-notch', type: 'player', stat: 'armor', val: 3, method: 'add', cat: 'passive' },
        { id: 'hand-speed', name: '單身手速', desc: '攻速 +15%', icon: 'fa-hand-pointer', type: 'weapon', stat: 'fireRate', val: 0.85, cat: 'passive' },
        { id: 'invisible', name: '已讀不回', desc: '跑速 +10%', icon: 'fa-comment-slash', type: 'player', stat: 'speed', val: 1.1, cat: 'passive' }
    ],
    ahjie: [
        { id: 'nitro', name: '氮氣加速', desc: '車速與傷害大幅提升', icon: 'fa-fire', type: 'complex', apply: (w) => { w.speed *= 1.3; w.damage *= 1.3; }, cat: 'active' },
        { id: 'brake-fail', name: '煞車失靈', desc: '穿透 +5', icon: 'fa-car-burst', type: 'weapon', stat: 'pierce', val: 5, cat: 'active' },
        { id: 'reverse', name: '逆向行駛', desc: '車子變大 +25%', icon: 'fa-road', type: 'weapon', stat: 'size', val: 1.25, cat: 'active' },
        { id: 'horn', name: '喇叭聲', desc: '發車頻率 +20%', icon: 'fa-bullhorn', type: 'weapon', stat: 'fireRate', val: 0.8, cat: 'active' },
        { id: 'insurance', name: '無賴精神', desc: '最大血量 +30%', icon: 'fa-face-grin-tongue-squint', type: 'player', stat: 'maxHp', val: 1.3, cat: 'passive' },
        { id: 'roll-cage', name: '強制險', desc: '減傷 +4', icon: 'fa-file-shield', type: 'player', stat: 'armor', val: 4, method: 'add', cat: 'passive' },
        { id: 'spare-tire', name: '肇事逃逸', desc: '跑速 +20%', icon: 'fa-person-running', type: 'player', stat: 'speed', val: 1.2, cat: 'passive' },
        { id: 'engine-mod', name: '改裝排氣管', desc: '傷害 +25%', icon: 'fa-gears', type: 'weapon', stat: 'damage', val: 1.25, cat: 'passive' }
    ],
    shanji: [
        { id: 'emotional-blackmail', name: '情緒勒索', desc: '召喚數量 +1 (大家都要幫我)', icon: 'fa-users', type: 'weapon', stat: 'count', val: 1, cat: 'active' },
        { id: 'on-call', name: '隨傳隨到', desc: '工具人跑得更快 (+20%)', icon: 'fa-stopwatch', type: 'weapon', stat: 'speed', val: 1.2, cat: 'active' },
        { id: 'project-manage', name: '漁場管理', desc: '拾取範圍 +40%', icon: 'fa-fish-fins', type: 'player', stat: 'pickupRange', val: 1.4, cat: 'passive' },
        { id: 'kpi', name: '責任制', desc: '要求工具人全力輸出 (傷害 +40%)', icon: 'fa-chart-pie', type: 'weapon', stat: 'damage', val: 1.4, cat: 'active' },
        { id: 'coffee', name: '說走就走', desc: '跑速 +20%', icon: 'fa-plane-departure', type: 'player', stat: 'speed', val: 1.2, cat: 'passive' },
        { id: 'responsibility', name: '冷暴力', desc: '冷卻 -15%', icon: 'fa-snowflake', type: 'weapon', stat: 'fireRate', val: 0.85, cat: 'passive' },
        { id: 'group-buy', name: '團購優惠', desc: '拾取範圍 +40%', icon: 'fa-bag-shopping', type: 'player', stat: 'pickupRange', val: 1.4, cat: 'passive' },
        { id: 'office-love', name: '公主病', desc: '減傷 +3', icon: 'fa-crown', type: 'player', stat: 'armor', val: 3, method: 'add', cat: 'passive' }
    ],
    ahcheng: [
        // Original Active Upgrades (Restored)
        { id: 'optimization', name: '代碼優化', desc: '傷害 +30%', icon: 'fa-file-code', type: 'weapon', stat: 'damage', val: 1.3, cat: 'active' },
        { id: 'ddos', name: 'DDOS 攻擊', desc: '發射數量 +1', icon: 'fa-network-wired', type: 'weapon', stat: 'count', val: 1, cat: 'active' },
        { id: 'overclock', name: 'CPU 超頻', desc: '攻速 +20%', icon: 'fa-microchip', type: 'weapon', stat: 'fireRate', val: 0.8, cat: 'active' },
        { id: 'big-data', name: '大數據模型', desc: '子彈範圍 +30%', icon: 'fa-database', type: 'weapon', stat: 'size', val: 1.3, cat: 'active' },

        // Summons
        { id: 'summon-gemini', name: '具現化：Gemini', desc: '召喚一位弓箭手守護者 (HP:100)', icon: 'fa-star', type: 'summon', summonType: 'gemini', cat: 'active' },
        { id: 'summon-grok', name: '具現化：Grok', desc: '召喚一位元素法師 (HP:100, 火/雷/冰)', icon: 'fa-bolt', type: 'summon', summonType: 'grok', cat: 'active' },
        { id: 'summon-chatgpt', name: '具現化：ChatGPT', desc: '召喚一位治癒者 (HP:100, 回血/護盾)', icon: 'fa-comment-dots', type: 'summon', summonType: 'chatgpt', cat: 'active' },
        { id: 'summon-copilot', name: '具現化：Copilot', desc: '召喚一位全能支援 (HP:100)', icon: 'fa-plane', type: 'summon', summonType: 'copilot', cat: 'active' },
        { id: 'summon-claude', name: '具現化：Claude', desc: '召喚一位戰術狙擊手 (HP:100)', icon: 'fa-brain', type: 'summon', summonType: 'claude', cat: 'active' },
        { id: 'machine-learning', name: '機器學習', desc: '拾取範圍 +30%', icon: 'fa-robot', type: 'player', stat: 'pickupRange', val: 1.3, cat: 'passive' },
        { id: 'firewall', name: '防火牆', desc: '減傷 +3', icon: 'fa-fire-extinguisher', type: 'player', stat: 'armor', val: 3, method: 'add', cat: 'passive' },
        { id: 'multi-thread', name: 'AI 託管', desc: '攻速 +15%', icon: 'fa-robot', type: 'weapon', stat: 'fireRate', val: 0.85, cat: 'passive' },
        { id: 'cloud-backup', name: '雲端備份', desc: '最大血量 +20%', icon: 'fa-cloud-arrow-up', type: 'player', stat: 'maxHp', val: 1.2, cat: 'passive' }
    ],
    yaoge: [
        { id: 'pig-butchering', name: '殺豬盤', desc: '陷阱傷害大幅提升 (+30%)', icon: 'fa-piggy-bank', type: 'weapon', stat: 'damage', val: 1.3, cat: 'active' },
        { id: 'atm-hack', name: 'ATM 盜刷', desc: '爆炸範圍變大 (+25%)', icon: 'fa-money-bill-wave', type: 'weapon', stat: 'size', val: 1.25, cat: 'active' },
        { id: 'fake-guarantee', name: '假一賠十', desc: '一次丟出更多個包裹 (+1)', icon: 'fa-box-open', type: 'weapon', stat: 'count', val: 1, cat: 'active' },
        { id: 'ponzi', name: '龐氏騙局', desc: '丟擲頻率 +20%', icon: 'fa-pyramid', type: 'weapon', stat: 'fireRate', val: 0.8, cat: 'active' },
        { id: 'liar', name: '話術洗腦', desc: '冷卻減少 10%', icon: 'fa-comment-dots', type: 'weapon', stat: 'fireRate', val: 0.9, cat: 'passive' },
        { id: 'fake-id', name: '跑路預備', desc: '跑速 +15%', icon: 'fa-person-running', type: 'player', stat: 'speed', val: 1.15, cat: 'passive' },
        { id: 'shell-company', name: '空殼公司', desc: '減傷 +2', icon: 'fa-building-shield', type: 'player', stat: 'armor', val: 2, method: 'add', cat: 'passive' },
        { id: 'run-away', name: '人頭帳戶', desc: '拾取範圍 +50%', icon: 'fa-user-secret', type: 'player', stat: 'pickupRange', val: 1.5, cat: 'passive' }
    ]
};

// Companion Interaction Dialogues (阿星和隊友的互動對話)
const companionDialogues = {
    // 阿傑 (ahjie) - 技師，愛改裝車
    ahjie: {
        onKill: [
            { star: "這招學會了嗎？", ahjie: "學長你這技術...比我改車還穩。" },
            { star: "釣魚就是要耐心。", ahjie: "對付這些怪物，我的扳手比較實在。" },
            { star: "又一條上鉤了。", ahjie: "你這釣竿真的很猛...改天幫你改裝一下？" },
            { ahjie: "搞定！引擎聲真好聽。", star: "你還在想你的車？" },
            { ahjie: "這些怪物零件不能回收嗎？", star: "你想改裝殭屍？" }
        ],
        onLevelUp: [
            { star: "感覺越來越順手了。", ahjie: "就像磨合期過了一樣。" },
            { ahjie: "學長，你需要升級裝備嗎？我可以幫忙。", star: "釣竿不需要改裝，靠的是技術。" },
            { star: "這感覺...不錯。", ahjie: "變強的感覺跟改完車一樣爽！" },
            { ahjie: "我們配合越來越好了。", star: "就像你和你的車。" }
        ],
        onHurt: [
            { ahjie: "學長小心！", star: "沒事，小傷而已。" },
            { star: "痛！這怪物有兩下子。", ahjie: "撐住！我掩護你！" },
            { ahjie: "靠！差點被咬到！", star: "專心點，這不是在改車。" },
            { star: "這比被魚鉤刺到還痛...", ahjie: "學長你還好嗎？！" }
        ],
        onBoss: [
            { star: "這傢伙看起來不好對付。", ahjie: "交給我，我有準備！" },
            { ahjie: "這...這是什麼怪物？！", star: "冷靜，就當作釣大魚。" },
            { star: "準備好了嗎？", ahjie: "隨時可以！發動引擎！" }
        ],
        onPickup: [
            { star: "撿到好東西了。", ahjie: "可以拿來改裝嗎？" },
            { ahjie: "這個零件不錯！", star: "...那是補給品不是零件。" }
        ],
        random: [
            { ahjie: "學長，你那台改裝車還在嗎？", star: "什麼改裝車？我只有腳踏車。" },
            { star: "你最喜歡改什麼車？", ahjie: "當然是那台 180...可惜了。" },
            { ahjie: "學長以前也釣到過這麼大的『魚』嗎？", star: "殭屍不算魚，阿傑。" },
            { star: "你那個渦輪增壓真的有用嗎？", ahjie: "當然！可以從 180 衝到 200！" },
            { ahjie: "學長，疫情過後要不要一起去環島？", star: "好啊，你開車我釣魚。" },
            { star: "你有想過改裝釣竿嗎？", ahjie: "...學長認真的？那我可以試試看。" }
        ]
    },

    // 包子 (richkid) - 有錢少爺
    richkid: {
        onKill: [
            { star: "解決了。", richkid: "學長好厲害！" },
            { richkid: "看我的信用卡飛鏢！", star: "你還真的用信用卡當武器..." },
            { star: "這條魚有點醜。", richkid: "學長...那是殭屍不是魚。" },
            { richkid: "學長！我有幫上忙嗎？", star: "有，當肉盾很稱職。" },
            { star: "搞定。", richkid: "不愧是學長！太帥了！" }
        ],
        onLevelUp: [
            { richkid: "學長！我變強了！", star: "錢果然能買到經驗值..." },
            { star: "感覺不錯。", richkid: "學長，需要什麼裝備嗎？我買給你！" },
            { richkid: "升級的感覺真好！", star: "你終於體會到努力的成果了。" },
            { star: "繼續保持。", richkid: "學長誇我了！我會更努力的！" }
        ],
        onHurt: [
            { richkid: "學長！！", star: "我沒事，別慌。" },
            { star: "嘶...有點痛。", richkid: "學長！要不要叫直升機？" },
            { richkid: "嗚...我的名牌衣服...", star: "現在還在意這個？" },
            { star: "包子，小心點！", richkid: "對不起學長！我會更小心的！" }
        ],
        onBoss: [
            { star: "準備好了嗎，包子？", richkid: "我...我會保護學長的！" },
            { richkid: "這怪物...能用錢買通嗎？", star: "我看不行。" },
            { star: "這次敵人很強，注意安全。", richkid: "學長...我怕..." }
        ],
        onPickup: [
            { richkid: "學長！這個我買給你！", star: "撿到的東西不用買..." },
            { star: "不錯的收穫。", richkid: "學長喜歡嗎？我還有錢！" }
        ],
        random: [
            { richkid: "學長，疫情結束後...我們還能一起釣魚嗎？", star: "當然，我教你。" },
            { star: "你以前都在做什麼？", richkid: "買東西、逛街...現在想想好空虛。" },
            { richkid: "學長為什麼這麼喜歡釣魚？", star: "因為釣魚不會問一堆問題。" },
            { star: "你家真的那麼有錢？", richkid: "嗯...但錢買不到學長的陪伴。" },
            { richkid: "學長，你有女朋友嗎？", star: "釣竿就是我的女朋友。" },
            { star: "包子，你長大了。", richkid: "都是學長教得好！" },
            { richkid: "學長，我可以一直跟著你嗎？", star: "...先活下來再說。" },
            { star: "你以前常凹我請客啊。", richkid: "對不起學長...這次換我保護你。" }
        ]
    },

    // 山雞 (shanji) - 獨立女性
    shanji: {
        onKill: [
            { star: "又一個。", shanji: "效率不錯，阿星。" },
            { shanji: "清理完畢。", star: "你的戰鬥經驗比我豐富。" },
            { star: "這招還行吧？", shanji: "還行？算你謙虛。" },
            { shanji: "配合得不錯。", star: "你也是。" },
            { star: "搞定。", shanji: "別大意，還有更多。" }
        ],
        onLevelUp: [
            { shanji: "變強了。", star: "我也是。" },
            { star: "升級了。", shanji: "繼續保持，我們需要更強。" },
            { shanji: "實力提升對生存很重要。", star: "說得對。" },
            { star: "感覺越來越好。", shanji: "別驕傲，還早得很。" }
        ],
        onHurt: [
            { shanji: "阿星！你還好嗎？", star: "小傷，沒事。" },
            { star: "痛...失誤了。", shanji: "專心點！這不是玩笑！" },
            { shanji: "該死...大意了。", star: "需要幫忙嗎？" },
            { star: "山雞小心！", shanji: "我知道該怎麼做。" }
        ],
        onBoss: [
            { star: "這次的敵人不簡單。", shanji: "正合我意。" },
            { shanji: "來吧，讓我看看你有多強。", star: "別衝動。" },
            { star: "準備好了嗎？", shanji: "隨時可以，你呢？" }
        ],
        onPickup: [
            { shanji: "有用的東西。", star: "資源很重要。" },
            { star: "這個不錯。", shanji: "留著，說不定用得上。" }
        ],
        random: [
            { shanji: "你為什麼要幫我？", star: "因為我們是隊友。" },
            { star: "你以前是做什麼的？", shanji: "不重要，重要的是活下來。" },
            { shanji: "你的釣魚技術...很特別。", star: "謝謝誇獎？" },
            { star: "你相信人嗎？", shanji: "相信自己就夠了。" },
            { shanji: "疫情結束後你有什麼打算？", star: "繼續釣魚吧，你呢？" },
            { star: "你好像很獨立。", shanji: "必須的，在這世界沒人能靠。" },
            { shanji: "阿星，我們是什麼關係？", star: "盟友吧...暫時。" },
            { star: "你不信任我嗎？", shanji: "信任是奢侈品，阿星。" }
        ]
    }
};