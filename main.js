// main.js

let DEV_MODE = false;

// включение из консоли: enableDevMode()
window.enableDevMode = function () {
  DEV_MODE = true;
  alert('Dev mode enabled');
  updateUI();
};

// --- Базовые переменные ---
let coins = 0;
let ballLevel = 1;
let upgradeCost = 10;

let maxActiveBalls = 1;
let maxBallsUpgradeCost = 50;

let autoDropLevel = 0;
let autoDropUpgradeCost = 100;
let autoDropTimer = 0;

// Prestige
let allTimeCoins = 0;
let allTimeCoinsSpentOnPrestige = 0;
let crystals = 0;
let crystalMultiplier = 1;

// Prestige upgrades
let prestigeBoosterLevel = 0;
let prestigeBoosterCost = 5;

let softSaveLevel = 0;
let softSaveCost = 5;

let prestigeSpeedLevel = 0;
let prestigeSpeedCost = 5;

let goldenPowerLevel = 0;
let goldenPowerCost = 5;

let slotMasteryLevel = 0;
let slotMasteryCost = 5;

// Box
let boxCost = 10;

// Special ball
let baseSpecialChance = 0.05;         // 5%
let baseSpecialValuePerHit = 0.2;     // per hit at ballLevel 1
let specialChance;
let specialValuePerHit;

// Настройки
let hitEffectsEnabled = true;

// --- UI элементы ---
const coinsSpan = document.getElementById('coins');
const coinsUpgradesSpan = document.getElementById('coinsUpgrades');

const ballLevelSpan = document.getElementById('ballLevel');
const ballLevelUpgradeSpan = document.getElementById('ballLevelUpgrade');
const upgradeCostSpan = document.getElementById('upgradeCost');

const upgradeBallBtn = document.getElementById('upgradeBallBtn');

const maxBallsSpan = document.getElementById('maxBalls');
const maxBallsCostSpan = document.getElementById('maxBallsCost');
const autoDropLevelSpan = document.getElementById('autoDropLevel');
const autoDropCostSpan = document.getElementById('autoDropCost');
const upgradeMaxBallsBtn = document.getElementById('upgradeMaxBallsBtn');
const upgradeAutoDropBtn = document.getElementById('upgradeAutoDropBtn');

// Prestige UI
const allTimeCoinsSpan = document.getElementById('allTimeCoins');
const crystalsSpan = document.getElementById('crystals');
const crystalsGainSpan = document.getElementById('crystalsGain');
const crystalMultiplierSpan = document.getElementById('crystalMultiplier');
const prestigeBtn = document.getElementById('prestigeBtn');

// Prestige upgrades UI
const prestigeBoosterLevelSpan = document.getElementById('prestigeBoosterLevel');
const prestigeBoosterCostSpan = document.getElementById('prestigeBoosterCost');
const buyPrestigeBoosterBtn = document.getElementById('buyPrestigeBoosterBtn');

const softSaveLevelSpan = document.getElementById('softSaveLevel');
const softSaveCostSpan = document.getElementById('softSaveCost');
const buySoftSaveBtn = document.getElementById('buySoftSaveBtn');

const prestigeSpeedLevelSpan = document.getElementById('prestigeSpeedLevel');
const prestigeSpeedCostSpan = document.getElementById('prestigeSpeedCost');
const buyPrestigeSpeedBtn = document.getElementById('buyPrestigeSpeedBtn');

const goldenPowerLevelSpan = document.getElementById('goldenPowerLevel');
const goldenPowerCostSpan = document.getElementById('goldenPowerCost');
const buyGoldenPowerBtn = document.getElementById('buyGoldenPowerBtn');

const slotMasteryLevelSpan = document.getElementById('slotMasteryLevel');
const slotMasteryCostSpan = document.getElementById('slotMasteryCost');
const buySlotMasteryBtn = document.getElementById('buySlotMasteryBtn');

const boxCostSpan = document.getElementById('boxCost');
const buyBoxBtn = document.getElementById('buyBoxBtn');

// Special ball UI
const specialChanceDisplay = document.getElementById('specialChanceDisplay');
const specialValueDisplay = document.getElementById('specialValueDisplay');

// Box overlay UI
const boxOverlay = document.getElementById('boxOverlay');
const closeBoxBtn = document.getElementById('closeBoxBtn');
const boxCardTitle0 = document.getElementById('boxCardTitle0');
const boxCardDesc0 = document.getElementById('boxCardDesc0');
const boxCardTitle1 = document.getElementById('boxCardTitle1');
const boxCardDesc1 = document.getElementById('boxCardDesc1');
const boxCardTitle2 = document.getElementById('boxCardTitle2');
const boxCardDesc2 = document.getElementById('boxCardDesc2');
const boxCardChooseBtns = document.querySelectorAll('.box-card-choose-btn');

// Dev panel UI
const devPanel = document.getElementById('devPanel');
const devGiveCoinsBtn = document.getElementById('devGiveCoinsBtn');
const devGiveCrystalsBtn = document.getElementById('devGiveCrystalsBtn');
const devResetPrestigeSpentBtn = document.getElementById('devResetPrestigeSpentBtn');

// Settings
const hardResetBtn = document.getElementById('hardResetBtn');
const hitEffectsToggle = document.getElementById('hitEffectsToggle');
const settingsToggleBtn = document.getElementById('settingsToggleBtn');
const settingsPanel = document.getElementById('settingsPanel');
const settingsCloseBtn = document.getElementById('settingsCloseBtn');

// Telegram WebApp
let tg = null;
try {
  if (window.Telegram && window.Telegram.WebApp) {
    tg = window.Telegram.WebApp;
    tg.expand();
    tg.setBackgroundColor('#020617');
    if (tg.setBottomBarColor) {
      tg.setBottomBarColor('#020617');
    }
  }
} catch (e) {
  console.warn('Telegram WebApp not available', e);
}

// --- Canvas ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const width = Math.min(window.innerWidth - 20, 400);
  const height = Math.min(window.innerHeight - 260, 600);
  canvas.width = width;
  canvas.height = height;
}
resizeCanvas();
window.addEventListener('resize', () => {
  resizeCanvas();
  setupBoard();
});

// --- Plinko ---
const pegs = [];
const slots = [];
const balls = [];
const hitPopups = [];

const PEG_RADIUS = 5;
const BALL_RADIUS = 6;
const GRAVITY = 0.25;
const BOUNCE = 0.8;
const FRICTION = 0.99;

// Slot mastery
function getSlotBonusMultiplier() {
  return 1 + slotMasteryLevel * 0.05;
}

function setupBoard() {
  pegs.length = 0;
  slots.length = 0;

  const rows = 7;
  const cols = 9;
  const spacingX = canvas.width / (cols + 1);
  const spacingY = canvas.height / (rows + 4);

  for (let row = 0; row < rows; row++) {
    const offsetX = (row % 2 === 0) ? spacingX : spacingX / 2;
    for (let col = 0; col < cols; col++) {
      const x = offsetX + col * spacingX;
      const y = spacingY * (row + 1);
      pegs.push({ x, y, r: PEG_RADIUS });
    }
  }

  const slotCount = cols + 1;
  const slotWidth = canvas.width / slotCount;
  const slotHeight = 40;
  const baseY = canvas.height - slotHeight;

  const baseMultipliers = [1, 1, 2, 2, 3, 5, 3, 2, 2, 1];
  const bonus = getSlotBonusMultiplier();

  for (let i = 0; i < slotCount; i++) {
    const x = i * slotWidth;
    const m = (baseMultipliers[i] || 1) * bonus;
    slots.push({
      x,
      y: baseY,
      w: slotWidth,
      h: slotHeight,
      baseMultiplier: baseMultipliers[i] || 1,
      multiplier: m
    });
  }
}
setupBoard();

// --- Special ball helpers ---
function recalcSpecialStats() {
  specialChance = baseSpecialChance * (1 + goldenPowerLevel * 0.25);
  specialValuePerHit = baseSpecialValuePerHit * (1 + goldenPowerLevel * 0.5);
}

recalcSpecialStats();

// jackpot focus из коробки
let boxJackpotFocusLevel = 0;

function getSpawnX() {
  const center = canvas.width / 2;
  if (boxJackpotFocusLevel <= 0) return center;

  const maxOffset = canvas.width * 0.3;
  const rand = (Math.random() - 0.5) * maxOffset;
  const focused = center + rand / (1 + boxJackpotFocusLevel);
  return Math.max(BALL_RADIUS, Math.min(canvas.width - BALL_RADIUS, focused));
}

function createBall() {
  const activeCount = balls.filter(b => b.alive).length;
  if (activeCount >= maxActiveBalls) return;

  const x = getSpawnX();
  const y = 10;
  const vx = (Math.random() - 0.5) * 1.5;
  const vy = 0;

  const isSpecial = Math.random() < specialChance;

  balls.push({
    x,
    y,
    vx,
    vy,
    r: BALL_RADIUS,
    alive: true,
    special: isSpecial
  });
}

function resolveBallPegCollision(ball, peg) {
  const dx = ball.x - peg.x;
  const dy = ball.y - peg.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = ball.r + peg.r;

  if (dist < minDist && dist > 0) {
    const overlap = minDist - dist;
    const nx = dx / dist;
    const ny = dy / dist;

    ball.x += nx * overlap;
    ball.y += ny * overlap;

    const dot = ball.vx * nx + ball.vy * ny;
    ball.vx -= 2 * dot * nx;
    ball.vy -= 2 * dot * ny;

    ball.vx *= BOUNCE;
    ball.vy *= BOUNCE;

    if (ball.special) {
      const baseHitIncome = ballLevel * specialValuePerHit;
      const total = baseHitIncome * getTotalIncomeMultiplier();
      const gain = Math.max(1, Math.floor(total));
      coins += gain;
      allTimeCoins += gain;
      spawnHitPopup(ball.x, ball.y, gain);
    }
  }
}

function updateBalls(deltaTime) {
  for (const ball of balls) {
    if (!ball.alive) continue;

    ball.vy += GRAVITY;
    ball.vx *= FRICTION;
    ball.vy *= FRICTION;

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x - ball.r < 0) {
      ball.x = ball.r;
      ball.vx = -ball.vx * BOUNCE;
    } else if (ball.x + ball.r > canvas.width) {
      ball.x = canvas.width - ball.r;
      ball.vx = -ball.vx * BOUNCE;
    }

    if (ball.y - ball.r > canvas.height) {
      ball.alive = false;
      continue;
    }

    for (const peg of pegs) {
      resolveBallPegCollision(ball, peg);
    }

    for (const slot of slots) {
      if (
        ball.y + ball.r >= slot.y &&
        ball.x >= slot.x &&
        ball.x <= slot.x + slot.w
      ) {
        handleBallInSlot(ball, slot);
        break;
      }
    }
  }
}

function getTotalIncomeMultiplier() {
  const prestigeSpeedMult = 1 + prestigeSpeedLevel * 0.5;
  return crystalMultiplier * prestigeSpeedMult;
}

function handleBallInSlot(ball, slot) {
  ball.alive = false;
  const baseGain = ballLevel * slot.multiplier;
  const totalMult = getTotalIncomeMultiplier();
  const gain = Math.max(1, Math.floor(baseGain * totalMult));
  coins += gain;
  allTimeCoins += gain;
  spawnHitPopup(ball.x, slot.y, gain);
  updateUI();
}

// --- Hit popups ---
function spawnHitPopup(x, y, value) {
  if (!hitEffectsEnabled) return;

  hitPopups.push({
    x,
    y: y + 10,
    text: '+' + value,
    alpha: 1,
    vy: -0.3
  });
}

function updateHitPopups() {
  for (const p of hitPopups) {
    p.y += p.vy;
    p.alpha -= 0.02;
  }
  for (let i = hitPopups.length - 1; i >= 0; i--) {
    if (hitPopups[i].alpha <= 0) hitPopups.splice(i, 1);
  }
}

function drawHitPopups() {
  for (const p of hitPopups) {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = '#facc15';
    ctx.font = '13px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;
}

// --- Рендер ---
function drawBoard() {
  ctx.fillStyle = '#6b7280';
  for (const peg of pegs) {
    ctx.beginPath();
    ctx.arc(peg.x, peg.y, peg.r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const slot of slots) {
    let color = '#4b5563';
    const roundedMult = Math.round(slot.multiplier * 10) / 10;
    if (roundedMult >= 2 && roundedMult < 3) color = '#facc15';
    else if (roundedMult >= 3 && roundedMult < 5) color = '#f97316';
    else if (roundedMult >= 5) color = '#ef4444';

    ctx.fillStyle = color;
    ctx.fillRect(slot.x, slot.y, slot.w, slot.h);

    ctx.fillStyle = '#e5e7eb';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(
      'x' + roundedMult.toFixed(1),
      slot.x + slot.w / 2,
      slot.y + slot.h / 2 + 4
    );
  }
}

function drawBalls() {
  for (const ball of balls) {
    if (!ball.alive) continue;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = ball.special ? '#facc15' : '#f97316';
    ctx.fill();
  }
}

// --- Авто-дроп ---
function updateAutoDrop(deltaTime) {
  if (autoDropLevel <= 0) return;

  const interval = Math.max(200, 1500 - autoDropLevel * 200);
  autoDropTimer += deltaTime;
  if (autoDropTimer >= interval) {
    autoDropTimer = 0;
    createBall();
  }
}

// --- Prestige logic ---
// считаем только прирост с прошлого престижа
function computeCrystalsGain() {
  const effectiveCoins = allTimeCoins - allTimeCoinsSpentOnPrestige;
  if (effectiveCoins < 5000) return 0;

  const base = effectiveCoins / 5000;
  let gain = Math.floor(Math.pow(base, 0.6));
  gain = Math.floor(gain * (1 + prestigeBoosterLevel * 0.25));
  if (gain < 0) gain = 0;
  return gain;
}

function updateCrystalMultiplier() {
  crystalMultiplier = 1 + crystals * 0.15;
}

// --- Box bonuses ---
const BOX_BONUS_TYPES = [
  {
    id: 'slot_mult',
    title: 'Slot Multiplier',
    desc: '+0.1 to all slot multipliers permanently.',
    apply: () => {
      slotMasteryLevel += 1;
      slotMasteryCost += 3;
      setupBoard();
    }
  },
  {
    id: 'jackpot_focus',
    title: 'Jackpot Focus',
    desc: 'Balls spawn slightly closer to the center (better for big slots).',
    apply: () => {
      boxJackpotFocusLevel++;
    }
  },
  {
    id: 'golden_boost',
    title: 'Golden Boost',
    desc: '+25% income from special ball hits.',
    apply: () => {
      goldenPowerLevel += 1;
      goldenPowerCost += 3;
      recalcSpecialStats();
    }
  },
  {
    id: 'crystal_gain',
    title: 'Crystal Gain',
    desc: '+15% crystals from prestige.',
    apply: () => {
      prestigeBoosterLevel += 1;
      prestigeBoosterCost += 3;
    }
  },
  {
    id: 'soft_save_plus',
    title: 'Soft Save+',
    desc: '+5% preserved normal upgrades after prestige.',
    apply: () => {
      softSaveLevel += 1;
      softSaveCost += 3;
    }
  }
];

let currentBoxOptions = [];

function openBox() {
  if (crystals < boxCost) return;
  crystals -= boxCost;

  const pool = [...BOX_BONUS_TYPES];
  currentBoxOptions = [];
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    currentBoxOptions.push(pool.splice(idx, 1)[0]);
  }

  if (currentBoxOptions[0]) {
    boxCardTitle0.textContent = currentBoxOptions[0].title;
    boxCardDesc0.textContent = currentBoxOptions[0].desc;
  }
  if (currentBoxOptions[1]) {
    boxCardTitle1.textContent = currentBoxOptions[1].title;
    boxCardDesc1.textContent = currentBoxOptions[1].desc;
  }
  if (currentBoxOptions[2]) {
    boxCardTitle2.textContent = currentBoxOptions[2].title;
    boxCardDesc2.textContent = currentBoxOptions[2].desc;
  }

  boxOverlay.classList.add('open');
  updateUI();
}

function chooseBoxOption(index) {
  const opt = currentBoxOptions[index];
  if (!opt) return;
  opt.apply();
  currentBoxOptions = [];
  boxOverlay.classList.remove('open');
  updateUI();
}

// --- Save / load ---
const SAVE_KEY = 'plinko_incremental_save_v4';

function saveGame() {
  const data = {
    coins,
    ballLevel,
    upgradeCost,
    maxActiveBalls,
    maxBallsUpgradeCost,
    autoDropLevel,
    autoDropUpgradeCost,
    hitEffectsEnabled,
    allTimeCoins,
    allTimeCoinsSpentOnPrestige,
    crystals,

    prestigeBoosterLevel,
    prestigeBoosterCost,
    softSaveLevel,
    softSaveCost,
    prestigeSpeedLevel,
    prestigeSpeedCost,
    goldenPowerLevel,
    goldenPowerCost,
    slotMasteryLevel,
    slotMasteryCost,

    boxCost,
    boxJackpotFocusLevel
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Save failed', e);
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data) return;

    if (typeof data.coins === 'number') coins = data.coins;
    if (typeof data.ballLevel === 'number') ballLevel = data.ballLevel;
    if (typeof data.upgradeCost === 'number') upgradeCost = data.upgradeCost;
    if (typeof data.maxActiveBalls === 'number') maxActiveBalls = data.maxActiveBalls;
    if (typeof data.maxBallsUpgradeCost === 'number') maxBallsUpgradeCost = data.maxBallsUpgradeCost;
    if (typeof data.autoDropLevel === 'number') autoDropLevel = data.autoDropLevel;
    if (typeof data.autoDropUpgradeCost === 'number') autoDropUpgradeCost = data.autoDropUpgradeCost;
    if (typeof data.hitEffectsEnabled === 'boolean') hitEffectsEnabled = data.hitEffectsEnabled;
    if (typeof data.allTimeCoins === 'number') allTimeCoins = data.allTimeCoins;
    if (typeof data.allTimeCoinsSpentOnPrestige === 'number') {
      allTimeCoinsSpentOnPrestige = data.allTimeCoinsSpentOnPrestige;
    }
    if (typeof data.crystals === 'number') crystals = data.crystals;

    if (typeof data.prestigeBoosterLevel === 'number') prestigeBoosterLevel = data.prestigeBoosterLevel;
    if (typeof data.prestigeBoosterCost === 'number') prestigeBoosterCost = data.prestigeBoosterCost;
    if (typeof data.softSaveLevel === 'number') softSaveLevel = data.softSaveLevel;
    if (typeof data.softSaveCost === 'number') softSaveCost = data.softSaveCost;
    if (typeof data.prestigeSpeedLevel === 'number') prestigeSpeedLevel = data.prestigeSpeedLevel;
    if (typeof data.prestigeSpeedCost === 'number') prestigeSpeedCost = data.prestigeSpeedCost;
    if (typeof data.goldenPowerLevel === 'number') goldenPowerLevel = data.goldenPowerLevel;
    if (typeof data.goldenPowerCost === 'number') goldenPowerCost = data.goldenPowerCost;
    if (typeof data.slotMasteryLevel === 'number') slotMasteryLevel = data.slotMasteryLevel;
    if (typeof data.slotMasteryCost === 'number') slotMasteryCost = data.slotMasteryCost;

    if (typeof data.boxCost === 'number') boxCost = data.boxCost;
    if (typeof data.boxJackpotFocusLevel === 'number') boxJackpotFocusLevel = data.boxJackpotFocusLevel;
  } catch (e) {
    console.warn('Load failed', e);
  }
  updateCrystalMultiplier();
  recalcSpecialStats();
  setupBoard();
}

// --- Hard reset ---
function hardReset() {
  if (!confirm('Hard reset EVERYTHING? This includes crystals and bonuses.')) return;

  coins = 0;
  ballLevel = 1;
  upgradeCost = 10;
  maxActiveBalls = 1;
  maxBallsUpgradeCost = 50;
  autoDropLevel = 0;
  autoDropUpgradeCost = 100;
  autoDropTimer = 0;

  hitEffectsEnabled = true;
  allTimeCoins = 0;
  allTimeCoinsSpentOnPrestige = 0;
  crystals = 0;
  crystalMultiplier = 1;

  prestigeBoosterLevel = 0;
  prestigeBoosterCost = 5;
  softSaveLevel = 0;
  softSaveCost = 5;
  prestigeSpeedLevel = 0;
  prestigeSpeedCost = 5;
  goldenPowerLevel = 0;
  goldenPowerCost = 5;
  slotMasteryLevel = 0;
  slotMasteryCost = 5;
  boxCost = 10;
  boxJackpotFocusLevel = 0;

  recalcSpecialStats();
  setupBoard();

  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    console.warn('Clear save failed', e);
  }

  if (hitEffectsToggle) hitEffectsToggle.checked = hitEffectsEnabled;
  updateUI();
}

// --- Prestige reset ---
function doPrestige() {
  const gain = computeCrystalsGain();
  if (gain <= 0) return;
  if (!confirm(`Prestige now and gain ${gain} crystals?`)) return;

  crystals += gain;
  updateCrystalMultiplier();

  // фиксируем точку, от которой дальше считаем новые монеты
  allTimeCoinsSpentOnPrestige = allTimeCoins;

  // Soft Save
  const keepPercent = Math.min(softSaveLevel * 0.15, 0.9);

  const keptBallLevel = 1 + Math.floor((ballLevel - 1) * keepPercent);
  const keptMaxBalls = 1 + Math.floor((maxActiveBalls - 1) * keepPercent);
  const keptAutoDropLevel = Math.floor(autoDropLevel * keepPercent);

  coins = 0;
  ballLevel = keptBallLevel;
  upgradeCost = Math.floor(10 * Math.pow(1.5, ballLevel - 1));

  maxActiveBalls = keptMaxBalls;
  maxBallsUpgradeCost = Math.floor(50 * Math.pow(1.8, maxActiveBalls - 1));

  autoDropLevel = keptAutoDropLevel;
  autoDropUpgradeCost = 100 * Math.pow(2, autoDropLevel);
  autoDropTimer = 0;

  updateUI();
}

// --- UI ---
function updateUI() {
  if (coinsSpan) coinsSpan.textContent = coins;
  if (coinsUpgradesSpan) coinsUpgradesSpan.textContent = coins;

  if (ballLevelSpan) ballLevelSpan.textContent = ballLevel;
  if (ballLevelUpgradeSpan) ballLevelUpgradeSpan.textContent = ballLevel;
  if (upgradeCostSpan) upgradeCostSpan.textContent = upgradeCost;

  if (maxBallsSpan) maxBallsSpan.textContent = maxActiveBalls;
  if (maxBallsCostSpan) maxBallsCostSpan.textContent = maxBallsUpgradeCost;
  if (autoDropLevelSpan) autoDropLevelSpan.textContent = autoDropLevel;
  if (autoDropCostSpan) autoDropCostSpan.textContent = autoDropUpgradeCost;

  if (hitEffectsToggle) hitEffectsToggle.checked = hitEffectsEnabled;

  if (allTimeCoinsSpan) allTimeCoinsSpan.textContent = allTimeCoins;
  if (crystalsSpan) crystalsSpan.textContent = crystals;
  if (crystalMultiplierSpan) crystalMultiplierSpan.textContent = crystalMultiplier.toFixed(2);

  const gain = computeCrystalsGain();
  if (crystalsGainSpan) crystalsGainSpan.textContent = gain;
  if (prestigeBtn) prestigeBtn.disabled = gain <= 0;

  if (prestigeBoosterLevelSpan) prestigeBoosterLevelSpan.textContent = prestigeBoosterLevel;
  if (prestigeBoosterCostSpan) prestigeBoosterCostSpan.textContent = prestigeBoosterCost;

  if (softSaveLevelSpan) softSaveLevelSpan.textContent = softSaveLevel;
  if (softSaveCostSpan) softSaveCostSpan.textContent = softSaveCost;

  if (prestigeSpeedLevelSpan) prestigeSpeedLevelSpan.textContent = prestigeSpeedLevel;
  if (prestigeSpeedCostSpan) prestigeSpeedCostSpan.textContent = prestigeSpeedCost;

  if (goldenPowerLevelSpan) goldenPowerLevelSpan.textContent = goldenPowerLevel;
  if (goldenPowerCostSpan) goldenPowerCostSpan.textContent = goldenPowerCost;

  if (slotMasteryLevelSpan) slotMasteryLevelSpan.textContent = slotMasteryLevel;
  if (slotMasteryCostSpan) slotMasteryCostSpan.textContent = slotMasteryCost;

  if (boxCostSpan) boxCostSpan.textContent = boxCost;

  if (specialChanceDisplay) {
    specialChanceDisplay.textContent = (specialChance * 100).toFixed(1) + '%';
  }
  if (specialValueDisplay) {
    specialValueDisplay.textContent = specialValuePerHit.toFixed(2);
  }

  if (devPanel) {
    devPanel.style.display = DEV_MODE ? 'block' : 'none';
  }

  saveGame();
}

// --- Апгрейды ---
upgradeBallBtn.addEventListener('click', () => {
  if (coins < upgradeCost) return;
  coins -= upgradeCost;
  ballLevel++;
  upgradeCost = Math.floor(10 * Math.pow(1.5, ballLevel - 1));
  updateUI();
});

if (upgradeMaxBallsBtn) {
  upgradeMaxBallsBtn.addEventListener('click', () => {
    if (coins < maxBallsUpgradeCost) return;
    coins -= maxBallsUpgradeCost;
    maxActiveBalls++;
    maxBallsUpgradeCost = Math.floor(maxBallsUpgradeCost * 1.8);
    updateUI();
  });
}

if (upgradeAutoDropBtn) {
  upgradeAutoDropBtn.addEventListener('click', () => {
    if (coins < autoDropUpgradeCost) return;
    coins -= autoDropUpgradeCost;
    autoDropLevel++;
    autoDropUpgradeCost = Math.floor(autoDropUpgradeCost * 2);
    updateUI();
  });
}

// Prestige button
if (prestigeBtn) {
  prestigeBtn.addEventListener('click', () => {
    doPrestige();
  });
}

// Prestige upgrades
if (buyPrestigeBoosterBtn) {
  buyPrestigeBoosterBtn.addEventListener('click', () => {
    if (crystals < prestigeBoosterCost) return;
    crystals -= prestigeBoosterCost;
    prestigeBoosterLevel++;
    prestigeBoosterCost = Math.floor(prestigeBoosterCost * 1.6 + 1);
    updateUI();
  });
}

if (buySoftSaveBtn) {
  buySoftSaveBtn.addEventListener('click', () => {
    if (crystals < softSaveCost) return;
    crystals -= softSaveCost;
    softSaveLevel++;
    softSaveCost = Math.floor(softSaveCost * 1.7 + 1);
    updateUI();
  });
}

if (buyPrestigeSpeedBtn) {
  buyPrestigeSpeedBtn.addEventListener('click', () => {
    if (crystals < prestigeSpeedCost) return;
    crystals -= prestigeSpeedCost;
    prestigeSpeedLevel++;
    prestigeSpeedCost = Math.floor(prestigeSpeedCost * 1.7 + 1);
    updateUI();
  });
}

if (buyGoldenPowerBtn) {
  buyGoldenPowerBtn.addEventListener('click', () => {
    if (crystals < goldenPowerCost) return;
    crystals -= goldenPowerCost;
    goldenPowerLevel++;
    goldenPowerCost = Math.floor(goldenPowerCost * 1.7 + 1);
    recalcSpecialStats();
    updateUI();
  });
}

if (buySlotMasteryBtn) {
  buySlotMasteryBtn.addEventListener('click', () => {
    if (crystals < slotMasteryCost) return;
    crystals -= slotMasteryCost;
    slotMasteryLevel++;
    slotMasteryCost = Math.floor(slotMasteryCost * 1.7 + 1);
    setupBoard();
    updateUI();
  });
}

// Box
if (buyBoxBtn) {
  buyBoxBtn.addEventListener('click', () => {
    openBox();
  });
}

if (closeBoxBtn && boxOverlay) {
  closeBoxBtn.addEventListener('click', () => {
    boxOverlay.classList.remove('open');
  });
  boxOverlay.addEventListener('click', (e) => {
    if (e.target === boxOverlay) {
      boxOverlay.classList.remove('open');
    }
  });
}

boxCardChooseBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const index = parseInt(btn.dataset.index, 10);
    chooseBoxOption(index);
  });
});

// Dev panel
if (devGiveCoinsBtn) {
  devGiveCoinsBtn.addEventListener('click', () => {
    if (!DEV_MODE) return;
    const add = 1e6;
    coins += add;
    allTimeCoins += add;
    updateUI();
  });
}

if (devGiveCrystalsBtn) {
  devGiveCrystalsBtn.addEventListener('click', () => {
    if (!DEV_MODE) return;
    crystals += 100;
    updateCrystalMultiplier();
    updateUI();
  });
}

if (devResetPrestigeSpentBtn) {
  devResetPrestigeSpentBtn.addEventListener('click', () => {
    if (!DEV_MODE) return;
    // считаем, что "новых" монет пока нет
    allTimeCoinsSpentOnPrestige = allTimeCoins;
    updateUI();
  });
}

// Settings
if (hardResetBtn) {
  hardResetBtn.addEventListener('click', () => {
    hardReset();
  });
}

if (hitEffectsToggle) {
  hitEffectsToggle.addEventListener('change', () => {
    hitEffectsEnabled = hitEffectsToggle.checked;
    saveGame();
  });
}

if (settingsToggleBtn && settingsPanel) {
  settingsToggleBtn.addEventListener('click', () => {
    settingsPanel.classList.add('open');
  });
}
if (settingsCloseBtn && settingsPanel) {
  settingsCloseBtn.addEventListener('click', () => {
    settingsPanel.classList.remove('open');
  });
}
if (settingsPanel) {
  settingsPanel.addEventListener('click', (e) => {
    if (e.target === settingsPanel) {
      settingsPanel.classList.remove('open');
    }
  });
}

// Клик по вкладке Game — дроп шара
const gameTab = document.getElementById('gameTab');
gameTab.addEventListener('click', (e) => {
  if (e.target.tagName.toLowerCase() === 'button') return;
  createBall();
});

// Табы
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;

    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));

    tab.classList.add('active');
    document.getElementById(target).classList.add('active');
  });
});

// Главный цикл
let lastTime = performance.now();

function gameLoop(now) {
  const deltaTime = now - lastTime;
  lastTime = now;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updateAutoDrop(deltaTime);
  updateBalls(deltaTime);
  updateHitPopups();
  drawBoard();
  drawBalls();
  drawHitPopups();

  requestAnimationFrame(gameLoop);
}

// Старт
loadGame();
updateUI();
requestAnimationFrame(gameLoop);