"use strict";

// Ground surface Y = 580
// Base platform:    y=565, h=14 → top=558
// Raised platform:  y=495, h=12 → top=489
// High platform:    y=435, h=12 → top=429
// Sky platform:     y=375, h=12 → top=369
//
// Enemy center Y = platformTop - enemyRadius
//   mouse    r=10: base=548, raised=479, high=419, sky=359
//   squirrel r=11: base=547, raised=478, high=418, sky=358
//   pigeon   r=13: base=545, raised=476, high=416, sky=356
//   dog      r=16: base=542, raised=473, high=413, sky=353

// Tiers: easy=1-5, medium=6-10, hard=11-15, brutal=16-20

const LEVELS = [
  // ── EASY ──────────────────────────────────────────────────────────────────
  {
    level: 1, tier: "easy", catLimit: 5, targetScore: 200,
    enemies: [
      { type: "mouse", x: 760, y: 548 },
      { type: "mouse", x: 850, y: 548 },
    ],
    obstacles: [
      { x: 800, y: 565, w: 160, h: 14 },
    ],
  },
  {
    level: 2, tier: "easy", catLimit: 5, targetScore: 300,
    enemies: [
      { type: "mouse", x: 740, y: 548 },
      { type: "mouse", x: 850, y: 548 },
      { type: "mouse", x: 960, y: 548 },
    ],
    obstacles: [
      { x: 850, y: 565, w: 280, h: 14 },
    ],
  },
  {
    level: 3, tier: "easy", catLimit: 6, targetScore: 350,
    enemies: [
      { type: "mouse",  x: 730, y: 548 },
      { type: "pigeon", x: 860, y: 476 },
      { type: "mouse",  x: 990, y: 548 },
    ],
    obstacles: [
      { x: 860, y: 495, w: 100, h: 12 },
      { x: 860, y: 565, w: 340, h: 14 },
    ],
  },
  {
    level: 4, tier: "easy", catLimit: 6, targetScore: 400,
    enemies: [
      { type: "pigeon", x: 730, y: 476 },
      { type: "mouse",  x: 850, y: 548 },
      { type: "pigeon", x: 970, y: 476 },
    ],
    obstacles: [
      { x: 730, y: 495, w: 100, h: 12 },
      { x: 970, y: 495, w: 100, h: 12 },
      { x: 850, y: 565, w: 360, h: 14 },
    ],
  },
  {
    level: 5, tier: "easy", catLimit: 7, targetScore: 480,
    enemies: [
      { type: "mouse",    x: 710, y: 548 },
      { type: "pigeon",   x: 840, y: 476 },
      { type: "squirrel", x: 940, y: 547 },
      { type: "mouse",    x: 1040, y: 548 },
    ],
    obstacles: [
      { x: 840, y: 495, w: 100, h: 12 },
      { x: 880, y: 565, w: 400, h: 14 },
    ],
  },
  // ── MEDIUM ────────────────────────────────────────────────────────────────
  {
    level: 6, tier: "medium", catLimit: 7, targetScore: 500,
    enemies: [
      { type: "squirrel", x: 730,  y: 547 },
      { type: "pigeon",   x: 860,  y: 416 },
      { type: "squirrel", x: 950,  y: 547 },
      { type: "mouse",    x: 1050, y: 548 },
    ],
    obstacles: [
      { x: 860, y: 435, w: 100, h: 12 },
      { x: 860, y: 495, w: 100, h: 12 },
      { x: 890, y: 565, w: 400, h: 14 },
    ],
  },
  {
    level: 7, tier: "medium", catLimit: 8, targetScore: 440,
    enemies: [
      { type: "mouse", x: 700, y: 548 },
      { type: "dog",   x: 840, y: 473 },
      { type: "mouse", x: 970, y: 548 },
    ],
    obstacles: [
      { x: 840, y: 495, w: 110, h: 12 },
      { x: 840, y: 565, w: 360, h: 14 },
    ],
  },
  {
    level: 8, tier: "medium", catLimit: 8, targetScore: 520,
    enemies: [
      { type: "dog",    x: 760, y: 473 },
      { type: "pigeon", x: 910, y: 476 },
      { type: "mouse",  x: 1020, y: 548 },
    ],
    obstacles: [
      { x: 760, y: 495, w: 110, h: 12 },
      { x: 910, y: 495, w: 100, h: 12 },
      { x: 890, y: 565, w: 340, h: 14 },
    ],
  },
  {
    level: 9, tier: "medium", catLimit: 8, targetScore: 650,
    enemies: [
      { type: "squirrel", x: 690,  y: 547 },
      { type: "dog",      x: 830,  y: 473 },
      { type: "pigeon",   x: 960,  y: 476 },
      { type: "squirrel", x: 1060, y: 547 },
    ],
    obstacles: [
      { x: 830, y: 495, w: 110, h: 12 },
      { x: 960, y: 495, w: 100, h: 12 },
      { x: 875, y: 565, w: 460, h: 14 },
    ],
  },
  {
    level: 10, tier: "medium", catLimit: 9, targetScore: 680,
    enemies: [
      { type: "dog",    x: 750,  y: 473 },
      { type: "dog",    x: 910,  y: 473 },
      { type: "pigeon", x: 1040, y: 476 },
    ],
    obstacles: [
      { x: 750,  y: 495, w: 110, h: 12 },
      { x: 910,  y: 495, w: 110, h: 12 },
      { x: 1040, y: 495, w:  90, h: 12 },
      { x: 900,  y: 565, w: 420, h: 14 },
    ],
  },
  // ── HARD ──────────────────────────────────────────────────────────────────
  {
    level: 11, tier: "hard", catLimit: 8, targetScore: 480,
    enemies: [
      { type: "mouse",    x: 700, y: 548 },
      { type: "dog",      x: 840, y: 473 },
      { type: "squirrel", x: 960, y: 547 },
    ],
    obstacles: [
      { x: 840, y: 495, w: 110, h: 12 },
      { x: 860, y: 565, w: 400, h: 14 },
    ],
  },
  {
    level: 12, tier: "hard", catLimit: 9, targetScore: 650,
    enemies: [
      { type: "dog",      x: 750, y: 473 },
      { type: "squirrel", x: 870, y: 547 },
      { type: "dog",      x: 990, y: 473 },
    ],
    obstacles: [
      { x: 750, y: 495, w: 110, h: 12 },
      { x: 990, y: 495, w: 110, h: 12 },
      { x: 870, y: 565, w: 380, h: 14 },
    ],
  },
  {
    level: 13, tier: "hard", catLimit: 9, targetScore: 550,
    enemies: [
      { type: "mouse",  x: 710, y: 548 },
      { type: "pigeon", x: 840, y: 416 },
      { type: "pigeon", x: 840, y: 476 },
      { type: "mouse",  x: 970, y: 548 },
    ],
    obstacles: [
      { x: 840, y: 435, w: 100, h: 12 },
      { x: 840, y: 495, w: 100, h: 12 },
      { x: 840, y: 565, w: 380, h: 14 },
    ],
  },
  {
    level: 14, tier: "hard", catLimit: 8, targetScore: 650,
    enemies: [
      { type: "squirrel", x: 720, y: 547 },
      { type: "squirrel", x: 800, y: 547 },
      { type: "pigeon",   x: 860, y: 416 },
      { type: "squirrel", x: 920, y: 547 },
      { type: "squirrel", x: 1000, y: 547 },
    ],
    obstacles: [
      { x: 860, y: 435, w: 90, h: 12 },
      { x: 860, y: 565, w: 380, h: 14 },
    ],
  },
  {
    level: 15, tier: "hard", catLimit: 9, targetScore: 750,
    enemies: [
      { type: "mouse",  x: 680, y: 548 },
      { type: "pigeon", x: 760, y: 476 },
      { type: "dog",    x: 860, y: 473 },
      { type: "pigeon", x: 960, y: 476 },
      { type: "mouse",  x: 1040, y: 548 },
    ],
    obstacles: [
      { x: 760,  y: 495, w: 100, h: 12 },
      { x: 860,  y: 495, w: 110, h: 12 },
      { x: 960,  y: 495, w: 100, h: 12 },
      { x: 860,  y: 565, w: 480, h: 14 },
    ],
  },
  // ── BRUTAL ────────────────────────────────────────────────────────────────
  {
    level: 16, tier: "brutal", catLimit: 9, targetScore: 620,
    enemies: [
      { type: "dog",    x: 760, y: 413 },
      { type: "mouse",  x: 860, y: 548 },
      { type: "dog",    x: 960, y: 413 },
    ],
    obstacles: [
      { x: 760, y: 435, w: 110, h: 12 },
      { x: 760, y: 495, w: 110, h: 12 },
      { x: 960, y: 435, w: 110, h: 12 },
      { x: 960, y: 495, w: 110, h: 12 },
      { x: 860, y: 565, w: 420, h: 14 },
    ],
  },
  {
    level: 17, tier: "brutal", catLimit: 9, targetScore: 720,
    enemies: [
      { type: "pigeon",   x: 700, y: 476 },
      { type: "dog",      x: 840, y: 413 },
      { type: "pigeon",   x: 980, y: 476 },
      { type: "squirrel", x: 840, y: 547 },
    ],
    obstacles: [
      { x: 700, y: 495, w:  90, h: 12 },
      { x: 840, y: 435, w: 110, h: 12 },
      { x: 840, y: 495, w: 110, h: 12 },
      { x: 980, y: 495, w:  90, h: 12 },
      { x: 840, y: 565, w: 440, h: 14 },
    ],
  },
  {
    level: 18, tier: "brutal", catLimit: 9, targetScore: 750,
    enemies: [
      { type: "dog",    x: 760, y: 473 },
      { type: "pigeon", x: 850, y: 416 },
      { type: "dog",    x: 940, y: 473 },
      { type: "mouse",  x: 850, y: 548 },
    ],
    obstacles: [
      { x: 760, y: 495, w: 110, h: 12 },
      { x: 850, y: 435, w: 100, h: 12 },
      { x: 940, y: 495, w: 110, h: 12 },
      { x: 850, y: 565, w: 400, h: 14 },
    ],
  },
  {
    level: 19, tier: "brutal", catLimit: 10, targetScore: 820,
    enemies: [
      { type: "mouse",    x: 660,  y: 548 },
      { type: "squirrel", x: 750,  y: 547 },
      { type: "pigeon",   x: 840,  y: 476 },
      { type: "dog",      x: 930,  y: 473 },
      { type: "squirrel", x: 1020, y: 547 },
      { type: "mouse",    x: 1100, y: 548 },
    ],
    obstacles: [
      { x: 840,  y: 495, w:  90, h: 12 },
      { x: 930,  y: 495, w: 110, h: 12 },
      { x: 880,  y: 565, w: 540, h: 14 },
    ],
  },
  {
    level: 20, tier: "brutal", catLimit: 10, targetScore: 950,
    enemies: [
      { type: "dog",    x: 730, y: 473 },
      { type: "pigeon", x: 820, y: 416 },
      { type: "dog",    x: 920, y: 473 },
      { type: "pigeon", x: 1010, y: 476 },
      { type: "mouse",  x: 730,  y: 548 },
      { type: "mouse",  x: 1010, y: 548 },
    ],
    obstacles: [
      { x: 820,  y: 435, w: 100, h: 12 },
      { x: 730,  y: 495, w: 110, h: 12 },
      { x: 820,  y: 495, w: 100, h: 12 },
      { x: 920,  y: 495, w: 110, h: 12 },
      { x: 1010, y: 495, w:  90, h: 12 },
      { x: 870,  y: 565, w: 480, h: 14 },
    ],
  },
];

function getLevel(num) {
  return LEVELS[num - 1] || LEVELS[LEVELS.length - 1];
}

const TOTAL_LEVELS = LEVELS.length;
