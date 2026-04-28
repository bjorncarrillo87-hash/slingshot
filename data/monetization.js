"use strict";

const GEM_PACKAGES = {
  small:  { gems: 50,   cost: "$0.99",  bonus: 0 },
  medium: { gems: 300,  cost: "$4.99",  bonus: 10 },
  large:  { gems: 700,  cost: "$9.99",  bonus: 20 },
  mega:   { gems: 4500, cost: "$49.99", bonus: 500 },
};

const BOOSTERS = {
  meteorShower: {
    name: "Meteor Shower",
    description: "2x impact damage",
    cost: 99,
    effect: "multiplier_2x",
    emoji: "☄️",
  },
  superStrength: {
    name: "Super Strength",
    description: "+50% launch power",
    cost: 99,
    effect: "power_1.5x",
    emoji: "💪",
  },
  slowMotion: {
    name: "Slow Motion",
    description: "Enemies move slower",
    cost: 99,
    effect: "slow_0.5x",
    emoji: "🐌",
  },
  catSwarm: {
    name: "Cat Swarm",
    description: "Launch 3 cats at once",
    cost: 199,
    effect: "multi_cat",
    emoji: "🐱",
  },
};

// Default player save state
const DEFAULT_PLAYER_STATE = {
  lives: 5,
  maxLives: 5,
  gems: 50,
  lastLifeRefill: null,
  currentLevel: 1,
  highScores: {},
  levelStars: {},
  boosters: { meteorShower: 0, superStrength: 0, slowMotion: 0, catSwarm: 0 },
  lastLoginDate: null,
  loginStreak: 0,
  stats: {
    gamesPlayed: 0,
    gamesWon: 0,
    levelsCompleted: 0,
    totalScore: 0,
    gemsSpent: 0,
    boostersUsed: 0,
  },
};

function loadPlayerState() {
  // Always start from a deep-cloned default so nested objects aren't shared
  const def = JSON.parse(JSON.stringify(DEFAULT_PLAYER_STATE));
  try {
    const saved = localStorage.getItem("pounce_player");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Shallow-merge top-level, then deep-merge each nested object
      const merged = Object.assign({}, def, parsed);
      merged.stats      = Object.assign({}, def.stats,      parsed.stats      || {});
      merged.boosters   = Object.assign({}, def.boosters,   parsed.boosters   || {});
      merged.highScores = Object.assign({}, parsed.highScores || {});
      merged.levelStars = Object.assign({}, parsed.levelStars || {});
      return merged;
    }
  } catch (e) {}
  return def;
}

function savePlayerState(state) {
  try {
    localStorage.setItem("pounce_player", JSON.stringify(state));
  } catch (e) {}
}

function checkDailyBonus(state) {
  const today = new Date().toDateString();
  if (state.lastLoginDate === today) return null;
  const boosterKeys = Object.keys(BOOSTERS);
  const reward = boosterKeys[Math.floor(Math.random() * boosterKeys.length)];
  state.boosters[reward] = (state.boosters[reward] || 0) + 1;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  state.loginStreak = state.lastLoginDate === yesterday ? (state.loginStreak || 0) + 1 : 1;
  state.lastLoginDate = today;
  return { booster: reward, streak: state.loginStreak };
}

function refillLifeIfReady(state) {
  if (state.lives >= state.maxLives) return false;
  const now = Date.now();
  const last = state.lastLifeRefill || now;
  const elapsed = now - last;
  if (elapsed >= GAME_CONFIG.lifeRefillTime) {
    const gained = Math.floor(elapsed / GAME_CONFIG.lifeRefillTime);
    state.lives = Math.min(state.maxLives, state.lives + gained);
    state.lastLifeRefill = now;
    return true;
  }
  return false;
}
