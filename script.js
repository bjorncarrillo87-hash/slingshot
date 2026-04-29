"use strict";

const { Engine, Render, Runner, World, Bodies, Body, Constraint, Mouse, MouseConstraint, Events } = Matter;

const W = GAME_CONFIG.canvas.width;
const H = GAME_CONFIG.canvas.height;
const SLING_X = GAME_CONFIG.slingAnchor.x;
const SLING_Y = GAME_CONFIG.slingAnchor.y;
const GROUND_Y = GAME_CONFIG.groundY;
const MAX_PULL = 110;
const MIN_DRAG = 15; // minimum pixels of pull before a launch is registered

// ── Engine (created once, never cleared) ──────────────────────────────────────
const engine = Engine.create({ gravity: { y: 1 } });
const runner = Runner.create();
const render = Render.create({
  element: document.getElementById("game-container"),
  engine,
  options: { width: W, height: H, wireframes: false, background: "#0d1b2a" },
});

// ── Mouse (created once, lives across levels) ─────────────────────────────────
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
let pendingBooster = null;   // booster locked in at drag-release, applied when sling detaches
let score = 0;
let catsUsed = 0;
let catBody = null;
let slingConstraint = null;
let firing = false;
let gamePhase = "idle";

// Bodies managed per-level
let enemies = [];     // { body, type, health, maxHealth, points }
let levelBodies = []; // ground, walls, posts, obstacles
let swarmBodies = []; // extra cats from catSwarm booster

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

  const tier = getTier(currentLevel);
  const elTierBadge = document.getElementById("tier-badge");
  if (elTierBadge) {
    elTierBadge.textContent = tier.label;
    elTierBadge.style.color = tier.color;
  }

  const savedStars = (playerState.levelStars || {})[currentLevel] || 0;
  const elStarsHud = document.getElementById("stars-hud");
  if (elStarsHud) {
    elStarsHud.textContent = savedStars > 0
      ? "★".repeat(savedStars) + "☆".repeat(3 - savedStars)
      : "☆☆☆";
    elStarsHud.style.color = savedStars > 0 ? "#ffd700" : "#444";
  }

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
  levelBodies.forEach((b) => World.remove(engine.world, b));
  enemies.forEach((e) => { if (e.health > 0) World.remove(engine.world, e.body); });
  // Remove swarm cats from previous level
  swarmBodies.forEach((b) => { try { World.remove(engine.world, b); } catch (_) {} });
  if (catBody) { World.remove(engine.world, catBody); catBody = null; }
  if (slingConstraint) { World.remove(engine.world, slingConstraint); slingConstraint = null; }
  levelBodies = [];
  enemies = [];
  swarmBodies = [];
  firing = false;
  pendingBooster = null;
}

function buildLevel(levelConfig) {
  const ground = Bodies.rectangle(W / 2, GROUND_Y + 10, W, 20, {
    isStatic: true, label: "ground",
    render: { fillStyle: "#2d5a27" },
  });
  const wallL   = Bodies.rectangle(-5,    H / 2, 10, H, { isStatic: true, render: { visible: false } });
  const wallR   = Bodies.rectangle(W + 5, H / 2, 10, H, { isStatic: true, render: { visible: false } });
  const ceiling = Bodies.rectangle(W / 2, -5,    W, 10, { isStatic: true, render: { visible: false } });
  const postL   = Bodies.rectangle(SLING_X - 14, SLING_Y + 30, 8, 80, {
    isStatic: true, label: "sling-post",
    render: { fillStyle: "#5c3d11" },
    collisionFilter: { mask: 0 },
  });
  const postR   = Bodies.rectangle(SLING_X + 14, SLING_Y + 30, 8, 80, {
    isStatic: true, label: "sling-post",
    render: { fillStyle: "#5c3d11" },
    collisionFilter: { mask: 0 },
  });

  const obstacles = levelConfig.obstacles.map((o) =>
    Bodies.rectangle(o.x, o.y, o.w, o.h, {
      isStatic: true, label: "obstacle",
      render: { fillStyle: "#8B4513" },
    })
  );

  levelBodies = [ground, wallL, wallR, ceiling, postL, postR, ...obstacles];
  World.add(engine.world, levelBodies);

  enemies = levelConfig.enemies.map((e) => {
    const props = getEnemyProperties(e.type);
    const body = Bodies.circle(e.x, e.y, props.radius, {
      restitution: 0.2,
      friction: 0.8,
      frictionAir: 0.08,
      render: { fillStyle: props.color },
      label: "enemy_" + e.type,
    });
    World.add(engine.world, body);
    return { body, type: e.type, health: props.health, maxHealth: props.health, points: props.points };
  });
}

// ── Spawn cat on sling ────────────────────────────────────────────────────────
function spawnCat() {
  if (catBody)        { World.remove(engine.world, catBody);        catBody = null; }
  if (slingConstraint){ World.remove(engine.world, slingConstraint); slingConstraint = null; }

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

// ── Drag helpers ──────────────────────────────────────────────────────────────
function currentDragDist() {
  if (!catBody) return 0;
  const dx = catBody.position.x - SLING_X;
  const dy = catBody.position.y - SLING_Y;
  return Math.sqrt(dx * dx + dy * dy);
}

function registerLaunch() {
  // Lock in the booster at the moment of release — applied when sling detaches
  pendingBooster = activeBooster;
  firing = true;
  catsUsed++;
  updateHUD();
}

// Mouse released outside the canvas — still trigger launch if pulled far enough
window.addEventListener("mouseup", () => {
  if (!firing && catBody && gamePhase === "playing") {
    if (currentDragDist() >= MIN_DRAG) registerLaunch();
  }
});

// ── Launch detection (inside canvas) ─────────────────────────────────────────
Events.on(mouseConstraint, "enddrag", (e) => {
  if (e.body !== catBody || gamePhase !== "playing") return;
  // Ignore tiny accidental clicks — prevents sling deadlock
  if (currentDragDist() < MIN_DRAG) return;
  registerLaunch();
});

// ── Booster helpers ───────────────────────────────────────────────────────────
function consumeBooster(key) {
  if ((playerState.boosters[key] || 0) > 0) {
    playerState.boosters[key]--;
    playerState.stats.boostersUsed++;
    activeBooster = null;
    savePlayerState(playerState);
    updateHUD();
  }
}

// Called after sling releases — velocity is real at this point
function applyPendingBooster() {
  if (!pendingBooster || !catBody) return;

  if (pendingBooster === "superStrength") {
    const v = catBody.velocity;
    Body.setVelocity(catBody, { x: v.x * 1.5, y: v.y * 1.5 });
    consumeBooster("superStrength");
  }
  if (pendingBooster === "slowMotion") {
    enemies.forEach((en) => {
      if (en.health > 0) Body.setVelocity(en.body, { x: 0, y: 0 });
    });
    consumeBooster("slowMotion");
  }
  if (pendingBooster === "catSwarm") {
    consumeBooster("catSwarm");
    spawnSwarmCats(); // called AFTER sling releases — real velocity available
  }

  pendingBooster = null;
}

function spawnSwarmCats() {
  if (!catBody) return;
  const props = getCatProperties(selectedCat);
  const vel = catBody.velocity;
  const pos = catBody.position;

  [-22, 22].forEach((offsetY) => {
    const sc = Bodies.circle(pos.x, pos.y + offsetY, props.radius, {
      restitution: props.restitution,
      density: props.mass / (Math.PI * props.radius * props.radius),
      render: { fillStyle: props.color },
      label: "cat_swarm",
    });
    Body.setVelocity(sc, { x: vel.x * 0.9, y: vel.y + offsetY * 0.04 });
    World.add(engine.world, sc);
    swarmBodies.push(sc);
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
  if (!target.label   || !target.label.startsWith("enemy_")) return;
  const rec = enemies.find((e) => e.body === target);
  if (!rec || rec.health <= 0) return;

  // meteorShower booster doubles damage — consumed on first hit
  let dmg = 1;
  if (activeBooster === "meteorShower") {
    dmg = 2;
    consumeBooster("meteorShower");
  }

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

  // Clamp cat: only draggable LEFT of anchor; max pull radius
  if (catBody && !firing) {
    let nx = catBody.position.x;
    let ny = catBody.position.y;
    let clamped = false;
    if (nx > SLING_X) { nx = SLING_X; clamped = true; }
    const dx = nx - SLING_X;
    const dy = ny - SLING_Y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > MAX_PULL) {
      nx = SLING_X + (dx / dist) * MAX_PULL;
      ny = SLING_Y + (dy / dist) * MAX_PULL;
      clamped = true;
    }
    if (clamped) {
      Body.setPosition(catBody, { x: nx, y: ny });
      Body.setVelocity(catBody, { x: 0, y: 0 });
    }
  }

  // Detach sling once cat moves far enough — THEN apply multipliers & boosters
  if (firing && catBody && slingConstraint) {
    const dx = catBody.position.x - SLING_X;
    const dy = catBody.position.y - SLING_Y;
    if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
      World.remove(engine.world, slingConstraint);
      slingConstraint = null;

      // Apply cat speed multiplier (real velocity now available)
      const catProps = getCatProperties(selectedCat);
      if (catProps.speedMultiplier !== 1.0) {
        const v = catBody.velocity;
        Body.setVelocity(catBody, {
          x: v.x * catProps.speedMultiplier,
          y: v.y * catProps.speedMultiplier,
        });
      }

      // Apply booster effects (also now have real velocity)
      applyPendingBooster();
    }
  }

  // Cat has landed or left screen — spawn next or trigger lose
  if (firing && catBody && !slingConstraint) {
    const pos = catBody.position;
    const vel = catBody.velocity;
    const offScreen = pos.x > W + 60 || pos.y > H + 60 || pos.x < -60;
    const settled   = Math.abs(vel.x) < 0.8 && Math.abs(vel.y) < 0.8 && pos.x > SLING_X + 40;

    if (offScreen || settled) {
      World.remove(engine.world, catBody);
      catBody = null;
      firing = false;

      // meteorShower is consumed on hit inside tryDamage; if the cat missed,
      // deactivate it so it doesn't silently carry over to the next shot.
      if (activeBooster === "meteorShower") {
        activeBooster = null;
        updateHUD();
      }

      if (enemies.filter((e) => e.health > 0).length === 0) return; // win handled

      const cfg = getLevel(currentLevel);
      if (catsUsed < cfg.catLimit) {
        spawnCat();
      } else {
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
  const cfg      = getLevel(currentLevel);
  const catsLeft = Math.max(0, cfg.catLimit - catsUsed);
  const bonus    = catsLeft * GAME_CONFIG.unusedCatBonus;
  score += bonus;
  elScoreCount.textContent = score;

  const stars = calcStars(score, cfg.targetScore, catsUsed, cfg.catLimit);

  playerState.gems += GAME_CONFIG.gemsPerLevel + (stars * 5);
  playerState.stats.levelsCompleted++;
  playerState.stats.gamesWon++;
  playerState.stats.totalScore += score;
  if (!playerState.levelStars) playerState.levelStars = {};
  const prevStars = playerState.levelStars[currentLevel] || 0;
  if (stars > prevStars) playerState.levelStars[currentLevel] = stars;
  const best = playerState.highScores[currentLevel] || 0;
  if (score > best) playerState.highScores[currentLevel] = score;
  if (currentLevel < TOTAL_LEVELS) {
    playerState.currentLevel = Math.max(playerState.currentLevel || 1, currentLevel + 1);
  }
  savePlayerState(playerState);
  setTimeout(() => showScreen("win", stars), 800);
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

  enemies.forEach((en) => {
    if (en.health <= 0) return;
    const pos   = en.body.position;
    const props = getEnemyProperties(en.type);
    ctx.font         = `${props.radius * 1.6}px serif`;
    ctx.textAlign    = "center";
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
    const pos   = catBody.position;
    ctx.font         = `${props.radius * 1.8}px serif`;
    ctx.textAlign    = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🐱", pos.x, pos.y);
  }

  // Aim guide while dragging back
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
  let px = start.x, py = start.y;
  let vx = vel.x * 0.045, vy = vel.y * 0.045;
  for (let i = 0; i < 30; i++) {
    vx *= 0.995; vy += 0.18;
    px += vx * 3; py += vy * 3;
    if (px > W || py > H || px < 0) break;
    ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

// ── Screen overlay ────────────────────────────────────────────────────────────
function starsHTML(n) {
  return `<span class="stars-display">${"★".repeat(n)}<span class="stars-empty">${"☆".repeat(3 - n)}</span></span>`;
}

function showScreen(type, stars) {
  elOverlay.classList.remove("hidden");
  elScreenBtns.innerHTML = "";
  const tier = getTier(currentLevel);

  if (type === "win") {
    const next     = currentLevel + 1;
    const gemBonus = GAME_CONFIG.gemsPerLevel + (stars * 5);
    const isLast   = currentLevel >= TOTAL_LEVELS;
    elScreenTitle.innerHTML = isLast ? "🎉 You Won POUNCE!" : "🏆 Level Complete!";
    elScreenBody.innerHTML =
      starsHTML(stars) + "<br>" +
      `<span class="tier-label" style="color:${tier.color}">${tier.label}</span> Level ${currentLevel}<br>` +
      `Score: <strong>${score}</strong><br>` +
      `+${gemBonus} 💎 earned` +
      (isLast ? "<br><em>All 20 levels cleared!</em>" : "");
    if (!isLast) addBtn("Next Level ▶", "primary", () => loadLevel(next));
    addBtn("Replay", "secondary", () => loadLevel(currentLevel));
    addBtn("Levels",  "secondary", showLevelSelect);
  } else if (type === "lose") {
    elScreenTitle.textContent = "😿 Level Failed!";
    elScreenBody.innerHTML =
      `<span class="tier-label" style="color:${tier.color}">${tier.label}</span> Level ${currentLevel}<br>` +
      `Lives: <strong>${playerState.lives} ❤️</strong><br>` +
      (playerState.lives === 0
        ? "Out of lives! Wait 30 min or use 99 💎"
        : "Try again?");
    if (playerState.lives > 0) {
      addBtn("Retry 🔄", "primary", () => loadLevel(currentLevel));
    } else {
      addBtn("Refill Lives (99 💎)", "gem", () => {
        if (playerState.gems >= 99) {
          playerState.gems -= 99;
          playerState.lives = playerState.maxLives;
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
  elScreenTitle.textContent = "🗺️ Level Select";
  elScreenBtns.innerHTML = "";

  const unlocked   = playerState.currentLevel || 1;
  const levelStars = playerState.levelStars || {};

  ["easy", "medium", "hard", "brutal"].forEach((tierKey) => {
    const t = DIFFICULTY_TIERS[tierKey];
    const header = document.createElement("div");
    header.className = "tier-header";
    header.innerHTML = `<span style="color:${t.color}">── ${t.label} ──</span>`;
    elScreenBtns.appendChild(header);

    for (let i = t.levels[0]; i <= t.levels[1]; i++) {
      const ok    = i <= unlocked;
      const stars = levelStars[i] || 0;
      const btn   = document.createElement("button");
      btn.className = "screen-btn level-select-btn";
      btn.style.borderColor = ok ? t.color : "#333";
      btn.style.opacity = ok ? "1" : "0.3";
      btn.innerHTML =
        `<span class="lsb-num">${i}</span>` +
        `<span class="lsb-stars" style="color:${stars > 0 ? "#ffd700" : "#444"}">${"★".repeat(stars)}${"☆".repeat(3 - stars)}</span>`;
      btn.disabled = !ok;
      btn.title = ok ? `Level ${i} — ${t.label}` : "Locked";
      btn.addEventListener("click", () => { elOverlay.classList.add("hidden"); loadLevel(i); });
      elScreenBtns.appendChild(btn);
    }
  });

  const back = document.createElement("button");
  back.className = "screen-btn btn-secondary";
  back.textContent = "← Back";
  back.style.marginTop = "16px";
  back.addEventListener("click", () => elOverlay.classList.add("hidden"));
  elScreenBtns.appendChild(back);
  elScreenBody.textContent = "";
}

// ── Load level ────────────────────────────────────────────────────────────────
function loadLevel(num) {
  currentLevel = Math.max(1, Math.min(num, TOTAL_LEVELS));
  score        = 0;
  catsUsed     = 0;
  gamePhase    = "playing";
  activeBooster  = null;
  pendingBooster = null;
  elOverlay.classList.add("hidden");

  render.options.background = getTier(currentLevel).bg;
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
    elDailyPopup.classList.add("hidden");
    updateHUD();
  }, { once: true });
}

// ── Boot ──────────────────────────────────────────────────────────────────────
Runner.run(runner, engine);
Render.run(render);
checkAndShowDailyBonus();
loadLevel(currentLevel);
