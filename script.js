"use strict";

// ── Engine & Renderer ─────────────────────────────────────────────────────────
const { Engine, Render, World, Bodies, Body, Constraint, Mouse, MouseConstraint, Events, Composite, Vector } = Matter;

const W = GAME_CONFIG.canvas.width;
const H = GAME_CONFIG.canvas.height;
const SLING_X = GAME_CONFIG.slingAnchor.x;
const SLING_Y = GAME_CONFIG.slingAnchor.y;
const GROUND_Y = GAME_CONFIG.groundY;

const engine = Engine.create({ gravity: { y: 1 } });
const render = Render.create({
  element: document.getElementById("game-container"),
  engine,
  options: { width: W, height: H, wireframes: false, background: "#0d1b2a" },
});

// ── Game State ────────────────────────────────────────────────────────────────
let playerState = loadPlayerState();
let currentLevel = playerState.currentLevel || 1;
let selectedCat = "orange";
let activeBooster = null;
let score = 0;
let catsUsed = 0;
let catBody = null;
let slingConstraint = null;
let firing = false;
let levelLoaded = false;
let gamePhase = "idle"; // idle | playing | won | lost

// Live enemy tracking: { body, type, health, maxHealth }
let enemies = [];
// Obstacle bodies
let obstacles = [];
// Static world bodies (ground, walls, sling posts)
let staticBodies = [];
// Swarm cats in flight
let swarmBodies = [];

// ── DOM refs ──────────────────────────────────────────────────────────────────
const elLivesIcons  = document.getElementById("lives-icons");
const elLevelNum    = document.getElementById("level-num");
const elGemsCount   = document.getElementById("gems-count");
const elScoreCount  = document.getElementById("score-count");
const elCatsLeft    = document.getElementById("cats-left");
const elOverlay     = document.getElementById("screen-overlay");
const elScreenTitle = document.getElementById("screen-title");
const elScreenBody  = document.getElementById("screen-body");
const elScreenBtns  = document.getElementById("screen-buttons");
const elDailyPopup  = document.getElementById("daily-bonus-popup");
const elDailyText   = document.getElementById("daily-bonus-text");

// ── HUD Updaters ──────────────────────────────────────────────────────────────
function updateHUD() {
  elLivesIcons.textContent = "❤️".repeat(playerState.lives) + "🖤".repeat(Math.max(0, playerState.maxLives - playerState.lives));
  elLevelNum.textContent = currentLevel;
  elGemsCount.textContent = playerState.gems;
  elScoreCount.textContent = score;

  const levelConfig = getLevel(currentLevel);
  const catsRemaining = Math.max(0, levelConfig.catLimit - catsUsed);
  elCatsLeft.textContent = catsRemaining;

  Object.keys(BOOSTERS).forEach((key) => {
    const el = document.getElementById("cnt-" + key);
    if (el) el.textContent = playerState.boosters[key] || 0;
    const btn = document.getElementById("btn-" + key);
    if (btn) {
      btn.disabled = (playerState.boosters[key] || 0) === 0;
      btn.classList.toggle("active-booster", activeBooster === key);
    }
  });
}

// ── Cat Selector Buttons ──────────────────────────────────────────────────────
document.querySelectorAll(".cat-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedCat = btn.dataset.cat;
    document.querySelectorAll(".cat-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// ── Booster Buttons ───────────────────────────────────────────────────────────
document.querySelectorAll(".booster-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.booster;
    if ((playerState.boosters[key] || 0) === 0) return;
    activeBooster = activeBooster === key ? null : key;
    updateHUD();
  });
});

// ── World Build Helpers ───────────────────────────────────────────────────────
function buildStaticWorld() {
  // Ground
  const ground = Bodies.rectangle(W / 2, GROUND_Y + 10, W, 20, {
    isStatic: true,
    render: { fillStyle: "#2d5a27" },
    label: "ground",
  });
  // Left wall
  const leftWall = Bodies.rectangle(-5, H / 2, 10, H, { isStatic: true, render: { visible: false } });
  // Ceiling
  const ceiling = Bodies.rectangle(W / 2, -5, W, 10, { isStatic: true, render: { visible: false } });

  staticBodies = [ground, leftWall, ceiling];
  World.add(engine.world, staticBodies);

  // Draw slingshot posts (visual rectangles)
  const postL = Bodies.rectangle(SLING_X - 14, SLING_Y + 30, 8, 80, {
    isStatic: true,
    render: { fillStyle: "#5c3d11" },
    label: "sling-post",
    collisionFilter: { mask: 0 },
  });
  const postR = Bodies.rectangle(SLING_X + 14, SLING_Y + 30, 8, 80, {
    isStatic: true,
    render: { fillStyle: "#5c3d11" },
    label: "sling-post",
    collisionFilter: { mask: 0 },
  });
  World.add(engine.world, [postL, postR]);
}

function buildObstacles(levelConfig) {
  obstacles = levelConfig.obstacles.map((o) => {
    const body = Bodies.rectangle(o.x, o.y, o.w, o.h, {
      isStatic: true,
      render: { fillStyle: "#8B4513" },
      label: "obstacle",
    });
    return body;
  });
  World.add(engine.world, obstacles);
}

function buildEnemies(levelConfig) {
  enemies = levelConfig.enemies.map((e) => {
    const props = getEnemyProperties(e.type);
    const body = Bodies.circle(e.x, e.y, props.radius, {
      restitution: 0.4,
      friction: 0.5,
      render: { fillStyle: props.color },
      label: "enemy_" + e.type,
    });
    World.add(engine.world, body);
    return { body, type: e.type, health: props.health, maxHealth: props.health, points: props.points };
  });
}

function spawnCat() {
  const levelConfig = getLevel(currentLevel);
  if (catsUsed >= levelConfig.catLimit) return;

  const props = getCatProperties(selectedCat);

  if (catBody) {
    World.remove(engine.world, catBody);
    catBody = null;
  }
  if (slingConstraint) {
    World.remove(engine.world, slingConstraint);
    slingConstraint = null;
  }

  catBody = Bodies.circle(SLING_X, SLING_Y, props.radius, {
    restitution: props.restitution,
    friction: 0.1,
    density: props.mass / (Math.PI * props.radius * props.radius),
    render: { fillStyle: props.color },
    label: "cat_" + selectedCat,
  });

  slingConstraint = Constraint.create({
    pointA: { x: SLING_X, y: SLING_Y },
    bodyB: catBody,
    stiffness: 0.05,
    length: 0,
    render: { strokeStyle: "#cc9944", lineWidth: 2 },
  });

  World.add(engine.world, [catBody, slingConstraint]);
  firing = false;
}

// ── Launch Detection ──────────────────────────────────────────────────────────
function onEndDrag(e) {
  if (e.body !== catBody) return;
  if (gamePhase !== "playing") return;

  const cat = getCatProperties(selectedCat);
  let powerMult = cat.powerMultiplier;
  let speedMult = cat.speedMultiplier;

  // Apply boosters
  if (activeBooster === "superStrength") {
    powerMult *= 1.5;
    consumeBooster("superStrength");
  }
  if (activeBooster === "slowMotion") {
    enemies.forEach((en) => Body.setVelocity(en.body, { x: 0, y: 0 }));
    consumeBooster("slowMotion");
  }

  firing = true;
  catsUsed++;
  updateHUD();

  // Cat swarm: duplicate 2 extra cats offset slightly
  if (activeBooster === "catSwarm") {
    consumeBooster("catSwarm");
    spawnSwarmCats(cat);
  }
}

function consumeBooster(key) {
  if ((playerState.boosters[key] || 0) > 0) {
    playerState.boosters[key]--;
    playerState.stats.boostersUsed++;
    activeBooster = null;
    savePlayerState(playerState);
    updateHUD();
  }
}

function spawnSwarmCats(catProps) {
  [-25, 25].forEach((offsetY) => {
    const sc = Bodies.circle(SLING_X, SLING_Y + offsetY, catProps.radius, {
      restitution: catProps.restitution,
      density: catProps.mass / (Math.PI * catProps.radius * catProps.radius),
      render: { fillStyle: catProps.color },
      label: "cat_swarm",
    });
    // Launch in same direction as main cat with slight spread
    const vel = Vector.mult(Vector.normalise({ x: catBody.velocity.x, y: catBody.velocity.y + offsetY * 0.05 }), 12);
    Body.setVelocity(sc, vel);
    World.add(engine.world, sc);
    swarmBodies.push(sc);
  });
}

// ── After-Update: auto-reset sling ───────────────────────────────────────────
Events.on(engine, "afterUpdate", () => {
  if (!firing || !catBody) return;

  const dx = Math.abs(catBody.position.x - SLING_X);
  const dy = Math.abs(catBody.position.y - SLING_Y);

  if (dx < 25 && dy < 25) {
    // Cat returned to anchor — it failed to launch properly, reset
    const levelConfig = getLevel(currentLevel);
    if (catsUsed < levelConfig.catLimit) {
      spawnCat();
    } else {
      checkLevelEnd();
    }
    firing = false;
  }
});

// ── Collision: damage enemies ─────────────────────────────────────────────────
Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach(({ bodyA, bodyB }) => {
    handleCatEnemyCollision(bodyA, bodyB);
    handleCatEnemyCollision(bodyB, bodyA);
  });
});

function handleCatEnemyCollision(catCandidate, enemyCandidate) {
  if (!catCandidate.label || !catCandidate.label.startsWith("cat_")) return;
  if (!enemyCandidate.label || !enemyCandidate.label.startsWith("enemy_")) return;

  const enemyRecord = enemies.find((e) => e.body === enemyCandidate);
  if (!enemyRecord || enemyRecord.health <= 0) return;

  let damage = 1;
  if (activeBooster === "meteorShower") {
    damage = 2;
    consumeBooster("meteorShower");
  }

  enemyRecord.health -= damage;

  if (enemyRecord.health <= 0) {
    // Kill enemy
    World.remove(engine.world, enemyCandidate);
    const gained = enemyRecord.points;
    score += gained;
    elScoreCount.textContent = score;
    showFloatingScore("+" + gained, enemyCandidate.position);
    checkLevelEnd();
  }
}

// ── Floating Score Text ───────────────────────────────────────────────────────
function showFloatingScore(text, pos) {
  const el = document.createElement("div");
  el.className = "enemy-label";
  el.textContent = text;
  el.style.left = pos.x + "px";
  el.style.top = (pos.y - 20) + "px";
  el.style.color = "#ffd700";
  el.style.fontWeight = "bold";
  el.style.position = "absolute";
  el.style.pointerEvents = "none";
  el.style.zIndex = "50";
  document.getElementById("game-container").appendChild(el);
  let opacity = 1;
  let yOffset = 0;
  const anim = setInterval(() => {
    opacity -= 0.04;
    yOffset -= 1.5;
    el.style.opacity = opacity;
    el.style.top = (pos.y - 20 + yOffset) + "px";
    if (opacity <= 0) {
      clearInterval(anim);
      el.remove();
    }
  }, 30);
}

// ── Render: draw emoji on enemies ─────────────────────────────────────────────
Events.on(render, "afterRender", () => {
  const ctx = render.context;
  enemies.forEach((en) => {
    if (en.health <= 0) return;
    const pos = en.body.position;
    const props = getEnemyProperties(en.type);
    ctx.font = `${props.radius * 1.6}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(props.symbol, pos.x, pos.y);

    // Health bar for multi-health enemies
    if (props.health > 1) {
      const bw = props.radius * 2.4;
      const bh = 4;
      const bx = pos.x - bw / 2;
      const by = pos.y - props.radius - 8;
      ctx.fillStyle = "#555";
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = en.health === en.maxHealth ? "#4caf50" : "#ff9800";
      ctx.fillRect(bx, by, bw * (en.health / en.maxHealth), bh);
    }
  });

  // Draw cat emoji on cat body
  if (catBody) {
    const props = getCatProperties(selectedCat);
    const pos = catBody.position;
    ctx.font = `${props.radius * 1.8}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🐱", pos.x, pos.y);
  }

  swarmBodies.forEach((sb) => {
    const pos = sb.position;
    ctx.font = "14px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🐱", pos.x, pos.y);
  });

  // Aim guide dots when dragging
  if (catBody && !firing) {
    const dx = catBody.position.x - SLING_X;
    const dy = catBody.position.y - SLING_Y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      drawAimGuide(catBody.position, { x: -dx * GAME_CONFIG.launchForce * 80, y: -dy * GAME_CONFIG.launchForce * 80 });
    }
  }
});

function drawAimGuide(startPos, vel) {
  const ctx = render.context;
  ctx.save();
  ctx.setLineDash([4, 6]);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  let px = startPos.x;
  let py = startPos.y;
  let vx = vel.x;
  let vy = vel.y;
  const grav = 0.001 * 60;
  ctx.moveTo(px, py);
  for (let i = 0; i < 25; i++) {
    px += vx * 4;
    vy += grav * 4;
    py += vy * 4;
    if (px > W || py > H) break;
    ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

// ── Level End Check ───────────────────────────────────────────────────────────
function checkLevelEnd() {
  if (gamePhase !== "playing") return;

  const aliveEnemies = enemies.filter((e) => e.health > 0);
  const levelConfig = getLevel(currentLevel);
  const catsRemaining = levelConfig.catLimit - catsUsed;

  if (aliveEnemies.length === 0) {
    // WIN
    gamePhase = "won";
    const bonus = catsRemaining * 50;
    score += bonus;
    elScoreCount.textContent = score;
    playerState.gems += GAME_CONFIG.gemsPerLevel;
    playerState.stats.levelsCompleted++;
    playerState.stats.gamesWon++;
    playerState.stats.totalScore += score;
    const best = playerState.highScores[currentLevel] || 0;
    if (score > best) playerState.highScores[currentLevel] = score;
    if (currentLevel < TOTAL_LEVELS) playerState.currentLevel = currentLevel + 1;
    savePlayerState(playerState);
    setTimeout(() => showScreen("win"), 800);
    return;
  }

  // Out of cats but enemies remain
  if (catsRemaining <= 0 && firing === false && !catBody) {
    gamePhase = "lost";
    playerState.lives = Math.max(0, playerState.lives - 1);
    if (playerState.lives === 0) playerState.lastLifeRefill = Date.now();
    playerState.stats.gamesPlayed++;
    savePlayerState(playerState);
    setTimeout(() => showScreen("lose"), 800);
  }
}

// ── Periodic "no cats left" check (after last cat lands) ─────────────────────
Events.on(engine, "afterUpdate", () => {
  if (gamePhase !== "playing" || firing) return;
  if (!catBody) {
    const levelConfig = getLevel(currentLevel);
    if (catsUsed >= levelConfig.catLimit) {
      const aliveEnemies = enemies.filter((e) => e.health > 0);
      if (aliveEnemies.length > 0) {
        gamePhase = "lost";
        playerState.lives = Math.max(0, playerState.lives - 1);
        if (playerState.lives === 0) playerState.lastLifeRefill = Date.now();
        playerState.stats.gamesPlayed++;
        savePlayerState(playerState);
        setTimeout(() => showScreen("lose"), 800);
      }
    }
  }
});

// ── Screen Overlay ────────────────────────────────────────────────────────────
function showScreen(type) {
  elOverlay.classList.remove("hidden");
  const levelConfig = getLevel(currentLevel);

  if (type === "win") {
    const nextLevel = currentLevel + 1;
    elScreenTitle.textContent = "🏆 Level Complete!";
    elScreenBody.innerHTML =
      `Score: <strong>${score}</strong><br>` +
      `Gems earned: <strong>+${GAME_CONFIG.gemsPerLevel} 💎</strong><br>` +
      (nextLevel <= TOTAL_LEVELS ? `Next up: Level ${nextLevel}` : "You've completed all levels!");
    elScreenBtns.innerHTML = "";
    if (nextLevel <= TOTAL_LEVELS) {
      addScreenBtn("Next Level ▶", "primary", () => {
        currentLevel++;
        loadLevel(currentLevel);
      });
    }
    addScreenBtn("Replay", "secondary", () => loadLevel(currentLevel - 1 < 1 ? 1 : currentLevel - 1));
    addScreenBtn("Level Select", "secondary", showLevelSelect);
  } else if (type === "lose") {
    elScreenTitle.textContent = "😿 Level Failed!";
    const hasLives = playerState.lives > 0;
    elScreenBody.innerHTML =
      `Lives remaining: <strong>${playerState.lives} ❤️</strong><br>` +
      (!hasLives ? `Out of lives! Wait 30 min or spend 99 💎 to refill.` : `Try again?`);
    elScreenBtns.innerHTML = "";
    if (hasLives) {
      addScreenBtn("Retry 🔄", "primary", () => loadLevel(currentLevel));
    } else {
      addScreenBtn("Refill Lives (99 💎)", "gem", () => {
        if (playerState.gems >= 99) {
          playerState.gems -= 99;
          playerState.lives = playerState.maxLives;
          playerState.stats.gemsSpent += 99;
          savePlayerState(playerState);
          loadLevel(currentLevel);
        } else {
          alert("Not enough gems! (Coming soon: gem shop)");
        }
      });
    }
    addScreenBtn("Level Select", "secondary", showLevelSelect);
  } else if (type === "levelSelect") {
    showLevelSelect();
    return;
  }

  updateHUD();
}

function addScreenBtn(label, style, onClick) {
  const btn = document.createElement("button");
  btn.className = `screen-btn btn-${style}`;
  btn.textContent = label;
  btn.addEventListener("click", () => {
    elOverlay.classList.add("hidden");
    onClick();
  });
  elScreenBtns.appendChild(btn);
}

function showLevelSelect() {
  elOverlay.classList.remove("hidden");
  elScreenTitle.textContent = "🗺️ Level Select";
  elScreenBody.textContent = "Choose a level to play:";
  elScreenBtns.innerHTML = "";
  for (let i = 1; i <= TOTAL_LEVELS; i++) {
    const best = playerState.highScores[i];
    const unlocked = i <= (playerState.currentLevel || 1);
    const btn = document.createElement("button");
    btn.className = "screen-btn " + (unlocked ? "btn-secondary" : "btn-primary");
    btn.style.opacity = unlocked ? "1" : "0.4";
    btn.textContent = `L${i}` + (best ? ` ★${best}` : "");
    btn.disabled = !unlocked;
    btn.addEventListener("click", () => {
      elOverlay.classList.add("hidden");
      loadLevel(i);
    });
    elScreenBtns.appendChild(btn);
  }
  // Back button
  const back = document.createElement("button");
  back.className = "screen-btn btn-secondary";
  back.textContent = "← Back";
  back.style.marginTop = "12px";
  back.addEventListener("click", () => elOverlay.classList.add("hidden"));
  elScreenBtns.appendChild(back);
}

// ── Load / Reload Level ───────────────────────────────────────────────────────
function clearWorld() {
  // Remove everything except static engine composites
  World.clear(engine.world);
  Engine.clear(engine);
  enemies = [];
  obstacles = [];
  staticBodies = [];
  swarmBodies = [];
  catBody = null;
  slingConstraint = null;
  firing = false;

  // Re-attach mouse after world clear
  const mouseObj = Mouse.create(render.canvas);
  const mc = MouseConstraint.create(engine, {
    mouse: mouseObj,
    constraint: { render: { visible: false } },
  });
  render.mouse = mouseObj;
  World.add(engine.world, mc);
  Events.on(mc, "enddrag", onEndDrag);
}

function loadLevel(num) {
  currentLevel = Math.max(1, Math.min(num, TOTAL_LEVELS));
  score = 0;
  catsUsed = 0;
  gamePhase = "playing";
  activeBooster = null;
  elOverlay.classList.add("hidden");

  clearWorld();
  buildStaticWorld();

  const levelConfig = getLevel(currentLevel);
  buildObstacles(levelConfig);
  buildEnemies(levelConfig);
  spawnCat();
  updateHUD();
}

// ── Sling reset after each shot ───────────────────────────────────────────────
Events.on(engine, "afterUpdate", () => {
  if (!firing || !catBody) return;
  const dx = catBody.position.x - SLING_X;
  const dy = catBody.position.y - SLING_Y;

  // Detach sling constraint once cat is moving away fast enough
  if (slingConstraint && (Math.abs(dx) > 30 || Math.abs(dy) > 30)) {
    World.remove(engine.world, slingConstraint);
    slingConstraint = null;
  }

  // Once cat has flown and come to rest near anchor OR exits canvas, spawn next
  if (!slingConstraint) {
    const offScreen = catBody.position.x > W + 50 || catBody.position.y > H + 50 || catBody.position.x < -50;
    const slowEnough = Math.abs(catBody.velocity.x) < 0.8 && Math.abs(catBody.velocity.y) < 0.8;

    if (offScreen || (slowEnough && catBody.position.x > SLING_X + 30)) {
      const levelConfig = getLevel(currentLevel);
      if (gamePhase !== "playing") return;
      if (catsUsed < levelConfig.catLimit) {
        spawnCat();
      }
      firing = false;
      catBody = null;
      checkLevelEnd();
    }
  }
});

// ── Daily Bonus ───────────────────────────────────────────────────────────────
function checkAndShowDailyBonus() {
  refillLifeIfReady(playerState);
  const result = checkDailyBonus(playerState);
  savePlayerState(playerState);
  if (result) {
    const booster = BOOSTERS[result.booster];
    elDailyText.innerHTML =
      `${booster.emoji} <strong>${booster.name}</strong> booster added!<br>` +
      `Login streak: <strong>${result.streak} day${result.streak > 1 ? "s" : ""}</strong>`;
    elDailyPopup.classList.remove("hidden");
    document.getElementById("daily-bonus-ok").addEventListener("click", () => {
      elDailyPopup.classList.add("hidden");
      updateHUD();
    }, { once: true });
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────────
(function init() {
  Engine.run(engine);
  Render.run(render);

  checkAndShowDailyBonus();
  loadLevel(currentLevel);
})();
