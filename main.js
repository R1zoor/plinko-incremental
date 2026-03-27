// main.js

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
let allTimeCoinsSpentOnPrestige = 0; // учитываем уже "потраченные" на престиж монеты
let crystals = 0;
let crystalMultiplier = 1;

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

// Settings
const hardResetBtn = document.getElementById('hardResetBtn');
const hitEffectsToggle = document.getElementById('hitEffectsToggle');
const settingsToggleBtn = document.getElementById('settingsToggleBtn');
const settingsPanel = document.getElementById('settingsPanel');
const settingsCloseBtn = document.getElementById('settingsCloseBtn');

// --- Canvas ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const width = Math.min(window.innerWidth - 20, 400);
  const height = Math.min(window.innerHeight - 220, 600);
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

  const multipliers = [1, 1, 2, 2, 3, 5, 3, 2, 2, 1];

  for (let i = 0; i < slotCount; i++) {
    const x = i * slotWidth;
    slots.push({
      x,
      y: baseY,
      w: slotWidth,
      h: slotHeight,
      multiplier: multipliers[i] || 1
    });
  }
}

setupBoard();

function createBall() {
  const activeCount = balls.filter(b => b.alive).length;
  if (activeCount >= maxActiveBalls) return;

  const x = canvas.width / 2;
  const y = 10;
  const vx = (Math.random() - 0.5) * 1.5;
  const vy = 0;
  balls.push({ x, y, vx, vy, r: BALL_RADIUS, alive: true });
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

function handleBallInSlot(ball, slot) {
  ball.alive = false;
  const baseGain = ballLevel * slot.multiplier;
  const gain = Math.floor(baseGain * crystalMultiplier);
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
    if (slot.multiplier === 2) color = '#facc15';
    else if (slot.multiplier === 3) color = '#f97316';
    else if (slot.multiplier === 5) color = '#ef4444';

    ctx.fillStyle = color;
    ctx.fillRect(slot.x, slot.y, slot.w, slot.h);

    ctx.fillStyle = '#e5e7eb';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(
      'x' + slot.multiplier,
      slot.x + slot.w / 2,
      slot.y + slot.h / 2 + 4
    );
  }
}

function drawBalls() {
  ctx.fillStyle = '#f97316';
  for (const ball of balls) {
    if (!ball.alive) continue;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
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
function computeCrystalsGain() {
  const effectiveCoins = allTimeCoins - allTimeCoinsSpentOnPrestige;
  if (effectiveCoins < 10000) return 0;

  const base = effectiveCoins / 10000;
  const gain = Math.floor(Math.pow(base, 0.4)); // мягкая кривая[web:112][web:114]
  return gain;
}

function updateCrystalMultiplier() {
  crystalMultiplier = 1 + crystals * 0.1;
}

// --- Save / load ---
const SAVE_KEY = 'plinko_incremental_save_prestige_v2';

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
    crystals
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
  } catch (e) {
    console.warn('Load failed', e);
  }
  updateCrystalMultiplier();
}

// --- Hard reset ---
function hardReset() {
  if (!confirm('Hard reset EVERYTHING? This includes crystals.')) return;

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
  updateCrystalMultiplier();

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

  // считаем, что все текущие allTimeCoins уже учтены
  allTimeCoinsSpentOnPrestige = allTimeCoins;

  // сброс обычного прогресса
  coins = 0;
  ballLevel = 1;
  upgradeCost = 10;
  maxActiveBalls = 1;
  maxBallsUpgradeCost = 50;
  autoDropLevel = 0;
  autoDropUpgradeCost = 100;
  autoDropTimer = 0;

  updateUI();
}

// --- UI ---
function updateUI() {
  coinsSpan.textContent = coins;
  if (coinsUpgradesSpan) coinsUpgradesSpan.textContent = coins;

  ballLevelSpan.textContent = ballLevel;
  if (ballLevelUpgradeSpan) ballLevelUpgradeSpan.textContent = ballLevel;
  upgradeCostSpan.textContent = upgradeCost;

  if (maxBallsSpan) maxBallsSpan.textContent = maxActiveBalls;
  if (maxBallsCostSpan) maxBallsCostSpan.textContent = maxBallsUpgradeCost;
  if (autoDropLevelSpan) autoDropLevelSpan.textContent = autoDropLevel;
  if (autoDropCostSpan) autoDropCostSpan.textContent = autoDropUpgradeCost;

  if (hitEffectsToggle) hitEffectsToggle.checked = hitEffectsEnabled;

  // Prestige UI
  if (allTimeCoinsSpan) allTimeCoinsSpan.textContent = allTimeCoins;
  if (crystalsSpan) crystalsSpan.textContent = crystals;
  if (crystalMultiplierSpan) crystalMultiplierSpan.textContent = crystalMultiplier.toFixed(2);

  const gain = computeCrystalsGain();
  if (crystalsGainSpan) crystalsGainSpan.textContent = gain;
  if (prestigeBtn) prestigeBtn.disabled = gain <= 0;

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