/* ===== CONFIG ===== */
const START_MONEY = GAME_CONFIG.start_money;
const MAX_TURNS = GAME_CONFIG.max_turns;
const SECTOR_CONFIG = GAME_CONFIG.sectors;

/* ===== AUDIO ===== */
const bgSound = document.getElementById("bgSound");
bgSound.src = GAME_CONFIG.sound.bg;

let soundEnabled = true;
const volumeSlider = document.getElementById("volumeSlider");

function applyVolume(v){
    bgSound.volume = v / 100;
}
applyVolume(volumeSlider.value);
volumeSlider.oninput = e => applyVolume(e.target.value);

function toggleSound(){
    soundEnabled = !soundEnabled;
    document.getElementById("soundToggle").innerText = soundEnabled ? "🔊" : "🔇";
    if (!soundEnabled) bgSound.pause();
    else if (document.body.classList.contains("started")) bgSound.play();
}

/* ===== STATE ===== */
let player = "";
let money = START_MONEY;
let turns = MAX_TURNS;
let leaderboard = SAVED_LEADERBOARD || {};
let spinning = false;
let outOfMoneyNotified = false;
/* ===== INIT LEADERBOARD ===== */
function renderBoard(){
    const ul = document.getElementById("board");
    ul.innerHTML = "";
    Object.entries(leaderboard)
      .sort((a,b)=>b[1]-a[1])
      .forEach(([n,m])=>{
        const li = document.createElement("li");
        li.innerText = `${n}: ${m}$`;
        ul.appendChild(li);
      });
}
renderBoard();

/* ===== LOGIN ===== */
function startGame(){
    const name = document.getElementById("playerName").value.trim();
    if (!name) return alert("Nhập tên người chơi");

    if (leaderboard[name]) {
        return alert("Tên này đã tồn tại, vui lòng nhập tên khác");
    }

    player = name;
    document.body.classList.add("started");
    document.getElementById("login").classList.add("hidden");
    document.getElementById("game").classList.remove("hidden");
    document.getElementById("currentPlayer").innerText = `👤 ${player}`;

    if (soundEnabled) bgSound.play();
    updateUI();
}

/* ===== WHEEL DRAW (GIỮ NGUYÊN) ===== */
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const sectors = SECTOR_CONFIG.map(s=>s.label);
const colors = [
    "#B0BEC5", // x0 - xám
    "#FFB3C6", // x1
    "#FFD6A5", // x2
    "#FDFFB6", // x3
    "#CAFFBF", // x4
    "#BDB2FF"  // x5
];
const arc = 2*Math.PI/sectors.length;
let angle = 0;

function drawWheel(){
    ctx.clearRect(0,0,420,420);
    sectors.forEach((s,i)=>{
        ctx.beginPath();
        ctx.moveTo(210,210);
        ctx.arc(210,210,210,i*arc,(i+1)*arc);
        ctx.fillStyle=colors[i];
        ctx.fill();
        ctx.save();
        ctx.translate(210,210);
        ctx.rotate(i*arc+arc/2);
        ctx.fillStyle="#333";
        ctx.font="bold 20px Arial";
        ctx.fillText(s,90,10);
        ctx.restore();
    });
}
drawWheel();

/* ===== SPIN ===== */
function pick(){
    let pool=[];
    SECTOR_CONFIG.forEach(s=>{ for(let i=0;i<s.weight;i++) pool.push(s.label); });
    return pool[Math.floor(Math.random()*pool.length)];
}

function spinWheel(){
    if (spinning || turns <= 0 || money < 100) {
        alert("Số tiền hiện tại không đủ để cược (tối thiểu 100$)");
        return;
    }

    const bet = parseInt(document.getElementById("bet").value);
    if (!bet) return alert("Vui lòng nhập tiền cược");
    if (bet < 100) return alert("Tiền cược tối thiểu là 100$");
    if (bet % 100 !== 0) return alert("Tiền cược phải chẵn 100 ,200 ,300,...");
    if (bet > money) return alert("Tiền cược vượt quá số tiền hiện có");

    spinning = true;
    turns--;

    const target = pick();                  // x0, x1, x2...
    const idx = sectors.indexOf(target);
    const sliceAngle = 360 / sectors.length;

    /* ===============================
       RESET GÓC – QUAN TRỌNG NHẤT
    =============================== */
    angle = 0;
    canvas.style.transition = "none";
    canvas.style.transform = "rotate(0deg)";

    // ép browser render lại
    canvas.offsetHeight;

    /* ===============================
       TÍNH GÓC QUAY CHUẨN
       Kim ở 12h (−90deg)
    =============================== */
    const targetAngle =
        360 * 5 +                            // quay 5 vòng cho đẹp
        (360 - (idx * sliceAngle + sliceAngle / 2)) -
        90;

    angle = targetAngle;

    canvas.style.transition = "transform 4s cubic-bezier(.33,1,.68,1)";
    canvas.style.transform = `rotate(${angle}deg)`;

    setTimeout(()=>{
        const mul = parseInt(target.replace("x",""));

        if (mul === 0) {
            money -= bet;
        } else {
            money = money - bet + bet * mul;
        }

        if (money < 0) money = 0;

        document.getElementById("result").innerText = target;

        updateUI();
        saveScore();

        spinning = false;
    }, 4200);
}


/* ===== SAVE SCORE ===== */
function saveScore(){
    leaderboard[player] = money;
    renderBoard();

    fetch("/api/leaderboard", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({player, money})
    });
}
/* =========================
   ❄️ SNOW EFFECT (FINAL)
========================= */
const snow = document.getElementById("snow");
const sctx = snow.getContext("2d");

function resizeSnow() {
    snow.width = window.innerWidth;
    snow.height = window.innerHeight;
}
resizeSnow();
window.addEventListener("resize", resizeSnow);

let flakes = Array.from({ length: 120 }, () => ({
    x: Math.random() * snow.width,
    y: Math.random() * snow.height,
    r: Math.random() * 3 + 1,
    speed: Math.random() * 1.5 + 0.5
}));

function drawSnow() {
    sctx.clearRect(0, 0, snow.width, snow.height);
    sctx.fillStyle = "rgba(255,255,255,0.8)";

    flakes.forEach(f => {
        sctx.beginPath();
        sctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        sctx.fill();

        f.y += f.speed;

        if (f.y > snow.height) {
            f.y = -5;
            f.x = Math.random() * snow.width;
        }
    });
}

setInterval(drawSnow, 33);


/* ===== UI ===== */
function updateUI(){
    document.getElementById("money").innerText = money;
    document.getElementById("turns").innerText = turns;

    const betInput = document.getElementById("bet");
    const spinBtn = document.getElementById("spinBtn");

    if (money < 100 || turns <= 0) {
        betInput.disabled = true;
        spinBtn.disabled = true;
    } else {
        betInput.disabled = false;
        spinBtn.disabled = false;
    }

    // ===== HẾT TIỀN =====
    if (money === 0 && !outOfMoneyNotified) {
        outOfMoneyNotified = true;
        alert("Hết tiền rồi, đen bạc đỏ tình nhé, hoan hỉ 😄");
    }
}

