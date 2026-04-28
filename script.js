"use strict";

const { Engine, Render, Runner, World, Bodies, Body, Constraint, Mouse, MouseConstraint, Events, Vector } = Matter;

const W = GAME_CONFIG.canvas.width;
const H = GAME_CONFIG.canvas.height;
const SLING_X = GAME_CONFIG.slingAnchor.x;
const SLING_Y = GAME_CONFIG.slingAnchor.y;
const GROUND_Y = GAME_CONFIG.groundY;

// ── Engine setup (created once, never cleared) ────────────────────────────────
const engine = Engine.create({ gravity: { y: 1 } });
const runner = Runner.create();
const render = Render.create({
  element: document.getElementById("game-container"),
  engine,
  options: { width: W, height: H, wireframes: false, background: "#0d1b2a" },
});

// ── Mouse (created once, stays alive across levels) ──────────────────────────
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse,
  constraint: { render: { visible: false } },
});
render.mouse = mouse;
World.add(engine.world, mouseConstraint);

// ── Game state ────────────────────────────────────────────────────────────────
let playerState = loadPlayerState();
let currentLevel = playerState.currentLevel || 1;
let selectedCat = "orange";
let activeBooster = null;
let score = 0;
let catsUsed = 0;
let catBody = null;
let slingConstraint = null;
let firing = false;
let gamePhase = "idle";

// Bodies managed per-level (cleared on reload)
let enemies = [];    // { body, type, health, maxHealth, points }
let levelBodies = []; // obstacles + ground + posts

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

// ── HUD ───────────────────────────────────────────────────────────────────────
function updateHUD() {
  const lives = Math.max(0, playerState.lives);
  const empty = Math.max(0, playerState.maxLives - lives);
  elLivesIcons.textContent = "❤️".repeat(lives) + "🖤".repeat(empty);
  elLevelNum.textContent = currentLevel;
  elGemsCount.textContent = playerState.gems;
  elScoreCount.textContent = score;
  const remaining = Math.max(0, getLevel(currentLevel).catLimit - catsUsed);
  elCatsLeft.textContent = remaining;

  Object.keys(BOOSTERS).forEach((key) => {
    const cnt = document.getElementById("cnt-" + key);
    if (cnt) cnt.textContent = playerState.boosters[key] || 0;
    const btn = document.getElementById("btn-" + key);
    if (btn) {
      btn.disabled = (playerState.boosters[key] || 0) === 0;
      btn.classList.toggle("active-booster", activeBooster === key);
    }
  });
}

// ── Cat selector ──────────────────────────────────────────────────────────────
document.querySelectorAll(".cat-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedCat = btn.dataset.cat;
    document.querySelectorAll(".cat-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// ── Booster selector ─────────────────────────────────────────────────────────
document.querySelectorAll(".booster-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.booster;
    if ((playerState.boosters[key] || 0) === 0) return;
    activeBooster = activeBooster === key ? null : key;
    updateHUD();
  });
});

// ── Level body management ─────────────────────────────────────────────────────
function clearLevel() {
  // Remove per-level bodies without touching mouseConstraint or engine runner
  levelBodies.forEach((b) => World.remove(engine.world, b));
  enemies.forEach((e) => { if (e.health > 0) World.remove(engine.world, e.body); });
  if (catBody) { World.remove(engine.world, catBody); catBody = null; }
  if (slingConstraint) { World.remove(engine.world, slingConstraint); slingConstraint = null; }
  levelBodies = [];
  enemies = [];
  firing = false;
}

function buildLevel(levelConfig) {
  // Ground
  const ground = Bodies.rectangle(W / 2, GROUND_Y + 10, W, 20, {
    isStatic: true, label: "ground",
    render: { fillStyle: "#2d5a27" },
  });
  // Walls
  const wallL = Bodies.rectangle(-5, H / 2, 10, H, { isStatic: true, render: { visible: false } });
  const wallR = Bodies.rectangle(W + 5, H / 2, 10, H, { isStatic: true, render: { visible: false } });
  const ceiling = Bodies.rectangle(W / 2, -5, W, 10, { isStatic: true, render: { visible: false } });
  // Slingshot posts
  const postL = Bodies.rectangle(SLING_X - 14, SLING_Y + 30, 8, 80, {
    isStatic: true, label: "sling-post",
    render: { fillStyle: "#5c3d11" },
    collisionFilter: { mask: 0 },
  });
  const postR = Bodies.rectangle(SLING_X + 14, SLING_Y + 30, 8, 80, {
    isStatic: true, label: "sling-post",
    render: { fillStyle: "#5c3d11" },
    collisionFilter: { mask: 0 },
  });

  // Obstacles
  const obstacles = levelConfig.obstacles.map((o) =>
    Bodies.rectangle(o.x, o.y, o.w, o.h, {
      isStatic: true, label: "obstacle",
      render: { fillStyle: "#8B4513" },
    })
  );

  levelBodies = [ground, wallL, wallR, ceiling, postL, postR, ...obstacles];
  World.add(engine.world, levelBodies);

  // Enemies
  enemies = levelConfig.enemies.map((e) => {
    const props = getEnemyProperties(e.type);
    const body = Bodies.circle(e.x, e.y, props.radius, {
      restitution: 0.4, friction: 0.5,
      render: { fillStyle: props.color },
      label: "enemy_" + e.type,
    });
    World.add(engine.world, body);
    return { body, type: e.type, health: props.health, maxHealth: props.health, points: props.points };
  });
}

// ── Spawn next cat on sling ───────────────────────────────────────────────────
function spawnCat() {
  if (catBody) { World.remove(engine.world, catBody); catBody = null; }
  if (slingConstraint) { World.remove(engine.world, slingConstraint); slingConstraint = null; }

  const levelConfig = getLevel(currentLevel);
  if (catsUsed >= levelConfig.catLimit) return;

  const props = getCatProperties(selectedCat);
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

// ── Launch (mouse release) ────────────────────────────────────────────────────
Events.on(mouseConstraint, "enddrag", (e) => {
  if (e.body !== catBody || gamePhase !== "playing") return;

  // Apply superStrength velocity boost before sling releases
  if (activeBooster === "superStrength") {
    const vel = catBody.velocity;
    Body.setVelocity(catBody, { x: vel.x * 1.5, y: vel.y * 1.5 });
    consumeBooster("superStrength");
  }
  if (activeBooster === "slowMotion") {
    enemies.forEach((en) => { if (en.health > 0) Body.setVelocity(en.body, { x: 0, y: 0 }); });
    consumeBooster("slowMotion");
  }

  firing = true;
  catsUsed++;
  updateHUD();

  if (activeBooster === "catSwarm") {
    consumeBooster("catSwarm");
    spawnSwarmCats();
  }
});

function consumeBooster(key) {
  if ((playerState.boosters[key] || 0) > 0) {
    playerState.boosters[key]--;
    playerState.stats.boostersUsed++;
    activeBooster = null;
    savePlayerState(playerState);
    updateHUD();
  }
}

function spawnSwarmCats() {
  const props = getCatProperties(selectedCat);
  [-22, 22].forEach((offsetY) => {
    const sc = Bodies.circle(SLING_X, SLING_Y + offsetY, props.radius, {
      restitution: props.restitution,
      density: props.mass / (Math.PI * props.radius * props.radius),
      render: { fillStyle: props.color },
      label: "cat_swarm",
    });
    const baseVel = catBody ? catBody.velocity : { x: 8, y: -5 };
    Body.setVelocity(sc, { x: baseVel.x * 0.9, y: baseVel.y + offsetY * 0.05 });
    World.add(engine.world, sc);
  });
}

// ── Collision: damage enemies ─────────────────────────────────────────────────
Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach(({ bodyA, bodyB }) => {
    tryDamage(bodyA, bodyB);
    tryDamage(bodyB, bodyA);
  });
});

function tryDamage(attacker, target) {
  if (!attacker.label || !attacker.label.startsWith("cat_")) return;
  if (!target.label || !target.label.startsWith("enemy_")) return;
  const rec = enemies.find((e) => e.body === target);
  if (!rec || rec.health <= 0) return;

  let dmg = 1;
  if (activeBooster === "meteorShower") { dmg = 2; consumeBooster("meteorShower"); }

  rec.health -= dmg;
  if (rec.health <= 0) {
    rec.health = 0;
    World.remove(engine.world, target);
    score += rec.points;
    elScoreCount.textContent = score;
    floatScore("+" + rec.points, target.position);
    checkWin();
  }
}

// ── Single afterUpdate handler ────────────────────────────────────────────────
Events.on(engine, "afterUpdate", () => {
  if (gamePhase !== "playing") return;

  // Detach sling constraint once cat moves far enough away
  if (firing && catBody && slingConstraint) {
    const dx = catBody.position.x - SLING_X;
    const dy = catBody.position.y - SLING_Y;
    if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
      World.remove(engine.world, slingConstraint);
      slingConstraint = null;
    }
  }

  // Check if fired cat has settled or left screen — then spawn next
  if (firing && catBody && !slingConstraint) {
    const pos = catBody.position;
    const vel = catBody.velocity;
    const offScreen = pos.x > W + 60 || pos.y > H + 60 || pos.x < -60;
    const settled = Math.abs(vel.x) < 0.8 && Math.abs(vel.y) < 0.8 && pos.x > SLING_X + 40;

    if (offScreen || settled) {
      World.remove(engine.world, catBody);
      catBody = null;
      firing = false;

      const cfg = getLevel(currentLevel);
      const aliveEnemies = enemies.filter((e) => e.health > 0);

      if (aliveEnemies.length === 0) return; // win already handled by checkWin

      if (catsUsed < cfg.catLimit) {
        spawnCat();
      } else {
        // Out of cats — lose
        triggerLose();
      }
    }
  }
});

// ── Win / Lose ────────────────────────────────────────────────────────────────
function checkWin() {
  if (gamePhase !== "playing") return;
  if (enemies.filter((e) => e.health > 0).length > 0) return;

  gamePhase = "won";
  const cfg = getLevel(currentLevel);
  const bonus = Math.max(0, cfg.catLimit - catsUsed) * 50;
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
}

function triggerLose() {
  if (gamePhase !== "playing") return;
  gamePhase = "lost";
  playerState.lives = Math.max(0, playerState.lives - 1);
  if (playerState.lives === 0) playerState.lastLifeRefill = Date.now();
  playerState.stats.gamesPlayed++;
  savePlayerState(playerState);
  setTimeout(() => showScreen("lose"), 800);
}

// ── Floating score text ───────────────────────────────────────────────────────
function floatScore(text, pos) {
  const el = document.createElement("div");
  Object.assign(el.style, {
    position: "absolute", pointerEvents: "none", zIndex: "50",
    left: pos.x + "px", top: (pos.y - 20) + "px",
    color: "#ffd700", fontWeight: "bold", fontSize: "14px",
  });
  el.textContent = text;
  document.getElementById("game-container").appendChild(el);
  let opacity = 1, dy = 0;
  const id = setInterval(() => {
    opacity -= 0.04; dy -= 1.5;
    el.style.opacity = opacity;
    el.style.top = (pos.y - 20 + dy) + "px";
    if (opacity <= 0) { clearInterval(id); el.remove(); }
  }, 30);
}

// ── Render overlay (emojis + health bars + aim guide) ────────────────────────
Events.on(render, "afterRender", () => {
  const ctx = render.context;

  // Enemy emojis & health bars
  enemies.forEach((en) => {
    if (en.health <= 0) return;
    const pos = en.body.position;
    const props = getEnemyProperties(en.type);
    ctx.font = `${props.radius * 1.6}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(props.symbol, pos.x, pos.y);

    if (en.maxHealth > 1) {
      const bw = props.radius * 2.6, bh = 4;
      const bx = pos.x - bw / 2, by = pos.y - props.radius - 9;
      ctx.fillStyle = "#444";
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = en.health < en.maxHealth ? "#ff9800" : "#4caf50";
      ctx.fillRect(bx, by, bw * (en.health / en.maxHealth), bh);
    }
  });

  // Cat emoji on sling body
  if (catBody) {
    const props = getCatProperties(selectedCat);
    const pos = catBody.position;
    ctx.font = `${props.radius * 1.8}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🐱", pos.x, pos.y);
  }

  // Aim guide while pulling back
  if (catBody && !firing) {
    const dx = catBody.position.x - SLING_X;
    const dy = catBody.position.y - SLING_Y;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      drawAimGuide(catBody.position, { x: -dx * 2.4, y: -dy * 2.4 });
    }
  }
});

function drawAimGuide(start, vel) {
  const ctx = render.context;
  ctx.save();
  ctx.setLineDash([4, 7]);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  let px = start.x, py = start.y, vx = vel.x * 0.045, vy = vel.y * 0.045;
  for (let i = 0; i < 30; i++) {
    vx *= 0.995; vy += 0.18; px += vx * 3; py += vy * 3;
    if (px > W || py > H || px < 0) break;
    ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

// ── Screen overlay ────────────────────────────────────────────────────────────
function showScreen(type) {
  elOverlay.classList.remove("hidden");
  elScreenBtns.innerHTML = "";

  if (type === "win") {
    const next = currentLevel + 1;
    elScreenTitle.textContent = "🏆 Level Complete!";
    elScreenBody.innerHTML =
      `Score: <strong>${score}</strong><br>` +
      `+${GAME_CONFIG.gemsPerLevel} 💎 earned<br>` +
      (next <= TOTAL_LEVELS ? `Ready for Level ${next}?` : "You cleared all levels! 🎉");
    if (next <= TOTAL_LEVELS) addBtn("Next Level ▶", "primary", () => loadLevel(next));
    addBtn("Replay", "secondary", () => loadLevel(currentLevel));
    addBtn("Levels", "secondary", showLevelSelect);
  } else if (type === "lose") {
    elScreenTitle.textContent = "😿 Failed!";
    elScreenBody.innerHTML =
      `Lives: <strong>${playerState.lives} ❤️</strong><br>` +
      (playerState.lives === 0 ? "Out of lives! Wait 30 min or spend 99 💎" : "Want to try again?");
    if (playerState.lives > 0) {
      addBtn("Retry 🔄", "primary", () => loadLevel(currentLevel));
    } else {
      addBtn("Refill Lives (99 💎)", "gem", () => {
        if (playerState.gems >= 99) {
          playerState.gems -= 99; playerState.lives = playerState.maxLives;
          playerState.stats.gemsSpent += 99;
          savePlayerState(playerState);
          loadLevel(currentLevel);
        } else {
          alert("Not enough gems!");
        }
      });
    }
    addBtn("Levels", "secondary", showLevelSelect);
  }

  updateHUD();
}

function addBtn(label, style, cb) {
  const btn = document.createElement("button");
  btn.className = `screen-btn btn-${style}`;
  btn.textContent = label;
  btn.addEventListener("click", () => { elOverlay.classList.add("hidden"); cb(); });
  elScreenBtns.appendChild(btn);
}

function showLevelSelect() {
  elOverlay.classList.remove("hidden");
  elScreenTitle.textContent = "🗺️ Levels";
  elScreenBody.textContent = "Choose a level:";
  elScreenBtns.innerHTML = "";
  const unlocked = playerState.currentLevel || 1;
  for (let i = 1; i <= TOTAL_LEVELS; i++) {
    const best = playerState.highScores[i];
    const ok = i <= unlocked;
    const btn = document.createElement("button");
    btn.className = "screen-btn btn-secondary";
    btn.style.opacity = ok ? "1" : "0.35";
    btn.textContent = `L${i}` + (best ? ` ★${best}` : "");
    btn.disabled = !ok;
    btn.addEventListener("click", () => { elOverlay.classList.add("hidden"); loadLevel(i); });
    elScreenBtns.appendChild(btn);
  }
  const back = document.createElement("button");
  back.className = "screen-btn btn-secondary";
  back.textContent = "← Back";
  back.style.marginTop = "12px";
  back.addEventListener("click", () => elOverlay.classList.add("hidden"));
  elScreenBtns.appendChild(back);
}

// ── Load level ────────────────────────────────────────────────────────────────
function loadLevel(num) {
  currentLevel = Math.max(1, Math.min(num, TOTAL_LEVELS));
  score = 0;
  catsUsed = 0;
  gamePhase = "playing";
  activeBooster = null;
  elOverlay.classList.add("hidden");

  clearLevel();
  buildLevel(getLevel(currentLevel));
  spawnCat();
  updateHUD();
}

// ── Daily bonus ───────────────────────────────────────────────────────────────
function checkAndShowDailyBonus() {
  refillLifeIfReady(playerState);
  const result = checkDailyBonus(playerState);
  savePlayerState(playerState);
  if (!result) return;
  const b = BOOSTERS[result.booster];
  elDailyText.innerHTML =
    `${b.emoji} <strong>${b.name}</strong> booster added!<br>` +
    `Login streak: <strong>${result.streak} day${result.streak > 1 ? "s" : ""}</strong>`;
  elDailyPopup.classList.remove("hidden");
  document.getElementById("daily-bonus-ok").addEventListener("click", () => {
    elDailyPopup.classList.add("hidden"); updateHUD();
  }, { once: true });
}

// ── Boot ──────────────────────────────────────────────────────────────────────
Runner.run(runner, engine);
Render.run(render);
checkAndShowDailyBonus();
loadLevel(currentLevel);
