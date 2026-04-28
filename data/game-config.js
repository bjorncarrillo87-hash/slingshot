"use strict";

const GAME_CONFIG = {
  maxLives: 5,
  lifeRefillTime: 30 * 60 * 1000,
  lifeRefillCost: 99,
  gemsPerLevel: 10,
  startingGems: 50,
  canvas: { width: 1200, height: 650 },
  slingAnchor: { x: 200, y: 480 },
  groundY: 580,
  launchForce: 0.035,
};

const DIFFICULTY_TIERS = {
  easy:   { label: "Easy",   levels: [1,  5],  color: "#4caf50", bg: "#071a0f", starMultiplier: 1.2 },
  medium: { label: "Medium", levels: [6,  10], color: "#ffc107", bg: "#1a1500", starMultiplier: 1.5 },
  hard:   { label: "Hard",   levels: [11, 15], color: "#ff7043", bg: "#1a0a00", starMultiplier: 1.8 },
  brutal: { label: "BRUTAL", levels: [16, 20], color: "#e53935", bg: "#0f0000", starMultiplier: 2.0 },
};

function getTier(levelNum) {
  for (const [key, t] of Object.entries(DIFFICULTY_TIERS)) {
    if (levelNum >= t.levels[0] && levelNum <= t.levels[1]) return { key, ...t };
  }
  return { key: "brutal", ...DIFFICULTY_TIERS.brutal };
}

// Stars: 3 = score >= targetScore*1.5 AND cats left >= 40% of limit
//        2 = score >= targetScore
//        1 = level completed
function calcStars(score, targetScore, catsUsed, catLimit) {
  const catsLeft = catLimit - catsUsed;
  if (score >= targetScore * 1.5 && catsLeft >= Math.ceil(catLimit * 0.4)) return 3;
  if (score >= targetScore) return 2;
  return 1;
}
