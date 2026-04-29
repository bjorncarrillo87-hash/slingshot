"use strict";

// Platform Y and enemy center Y reference (obstacle h=12 unless noted):
// Ground:  y=565 h=14 → top=558 | mouse=548 sq=547 pig=545 dog=542
// Low:     y=490 h=12 → top=484 | mouse=474 sq=473 pig=471 dog=468
// Mid:     y=420 h=12 → top=414 | mouse=404 sq=403 pig=401 dog=398
// High:    y=350 h=12 → top=344 | mouse=334 sq=333 pig=331 dog=328
// V.High:  y=280 h=12 → top=274 | mouse=264 sq=263 pig=261 dog=258
// Sky:     y=215 h=12 → top=209 | mouse=199 sq=198 pig=196 dog=193

// Tiers: easy=1-5, medium=6-10, hard=11-15, brutal=16-20

const LEVELS = [
  // ── EASY ──────────────────────────────────────────────────────────────────
  {
    // Tutorial: two mice side by side on one platform
    level: 1, tier: "easy", catLimit: 5, targetScore: 200,
    enemies: [
      { type: "mouse", x: 800, y: 548 },
      { type: "mouse", x: 950, y: 548 },
    ],
    obstacles: [
      { x: 875, y: 565, w: 240, h: 14 },
    ],
  },
  {
    // Elevated centre: mouse on a raised platform flanked by ground mice
    level: 2, tier: "easy", catLimit: 5, targetScore: 300,
    enemies: [
      { type: "mouse", x: 720, y: 548 },
      { type: "mouse", x: 880, y: 474 },
      { type: "mouse", x: 1040, y: 548 },
    ],
    obstacles: [
      { x: 880, y: 490, w: 120, h: 12 },
      { x: 880, y: 565, w: 440, h: 14 },
    ],
  },
  {
    // Pigeon on a mid platform, mice on the ground on either side
    level: 3, tier: "easy", catLimit: 6, targetScore: 350,
    enemies: [
      { type: "mouse",  x: 750, y: 548 },
      { type: "pigeon", x: 920, y: 401 },
      { type: "mouse",  x: 1060, y: 548 },
    ],
    obstacles: [
      { x: 920, y: 420, w: 120, h: 12 },
      { x: 900, y: 565, w: 400, h: 14 },
    ],
  },
  {
    // Two pigeons on separate high platforms — different angles needed
    level: 4, tier: "easy", catLimit: 6, targetScore: 400,
    enemies: [
      { type: "pigeon", x: 760, y: 331 },
      { type: "mouse",  x: 900, y: 548 },
      { type: "pigeon", x: 1050, y: 401 },
    ],
    obstacles: [
      { x: 760,  y: 350, w: 100, h: 12 },
      { x: 1050, y: 420, w: 100, h: 12 },
      { x: 900,  y: 565, w: 400, h: 14 },
    ],
  },
  {
    // Staircase: four enemies descending left-to-right across heights
    level: 5, tier: "easy", catLimit: 7, targetScore: 480,
    enemies: [
      { type: "mouse",    x: 700,  y: 548 },
      { type: "pigeon",   x: 820,  y: 331 },
      { type: "squirrel", x: 940,  y: 403 },
      { type: "mouse",    x: 1060, y: 474 },
    ],
    obstacles: [
      { x: 820,  y: 350, w:  90, h: 12 },
      { x: 940,  y: 420, w:  90, h: 12 },
      { x: 1060, y: 490, w:  90, h: 12 },
      { x: 880,  y: 565, w: 440, h: 14 },
    ],
  },
  // ── MEDIUM ────────────────────────────────────────────────────────────────
  {
    // V-shape: enemies climb from ground → high → very-high → low
    level: 6, tier: "medium", catLimit: 7, targetScore: 500,
    enemies: [
      { type: "squirrel", x: 700,  y: 473 },
      { type: "squirrel", x: 830,  y: 333 },
      { type: "pigeon",   x: 950,  y: 261 },
      { type: "mouse",    x: 1070, y: 474 },
    ],
    obstacles: [
      { x: 700,  y: 490, w: 100, h: 12 },
      { x: 830,  y: 350, w:  90, h: 12 },
      { x: 950,  y: 280, w:  90, h: 12 },
      { x: 1070, y: 490, w:  90, h: 12 },
      { x: 880,  y: 565, w: 460, h: 14 },
    ],
  },
  {
    // Dog on a mid platform, mice ground left & right
    level: 7, tier: "medium", catLimit: 8, targetScore: 440,
    enemies: [
      { type: "mouse", x: 700,  y: 548 },
      { type: "dog",   x: 880,  y: 398 },
      { type: "mouse", x: 1060, y: 548 },
    ],
    obstacles: [
      { x: 880, y: 420, w: 120, h: 12 },
      { x: 880, y: 565, w: 480, h: 14 },
    ],
  },
  {
    // Tower: dog perched above pigeon on a two-story stack
    level: 8, tier: "medium", catLimit: 8, targetScore: 520,
    enemies: [
      { type: "dog",    x: 830, y: 258 },
      { type: "pigeon", x: 830, y: 401 },
      { type: "mouse",  x: 1040, y: 548 },
    ],
    obstacles: [
      { x: 830, y: 280, w:  90, h: 12 },
      { x: 830, y: 420, w: 110, h: 12 },
      { x: 940, y: 565, w: 340, h: 14 },
    ],
  },
  {
    // Ascending staircase with heavy enemies: one shot can't reach all
    level: 9, tier: "medium", catLimit: 8, targetScore: 650,
    enemies: [
      { type: "squirrel", x: 680,  y: 473 },
      { type: "dog",      x: 820,  y: 328 },
      { type: "pigeon",   x: 960,  y: 261 },
      { type: "squirrel", x: 1080, y: 403 },
    ],
    obstacles: [
      { x: 680,  y: 490, w:  90, h: 12 },
      { x: 820,  y: 350, w: 110, h: 12 },
      { x: 960,  y: 280, w:  90, h: 12 },
      { x: 1080, y: 420, w:  90, h: 12 },
      { x: 880,  y: 565, w: 480, h: 14 },
    ],
  },
  {
    // Two dogs high + pigeon in the sky — steep angles required
    level: 10, tier: "medium", catLimit: 9, targetScore: 680,
    enemies: [
      { type: "dog",    x: 760,  y: 258 },
      { type: "pigeon", x: 880,  y: 196 },
      { type: "dog",    x: 1000, y: 328 },
    ],
    obstacles: [
      { x: 760,  y: 280, w: 110, h: 12 },
      { x: 880,  y: 215, w:  80, h: 12 },
      { x: 1000, y: 350, w: 110, h: 12 },
      { x: 880,  y: 565, w: 400, h: 14 },
    ],
  },
  // ── HARD ──────────────────────────────────────────────────────────────────
  {
    // Dog at v.high left, squirrel low right — split trajectory needed
    level: 11, tier: "hard", catLimit: 8, targetScore: 480,
    enemies: [
      { type: "mouse",    x: 700,  y: 548 },
      { type: "dog",      x: 860,  y: 258 },
      { type: "squirrel", x: 1010, y: 473 },
    ],
    obstacles: [
      { x: 860,  y: 280, w: 100, h: 12 },
      { x: 1010, y: 490, w:  90, h: 12 },
      { x: 860,  y: 565, w: 400, h: 14 },
    ],
  },
  {
    // Dog tower (two-story) left + squirrel on a mid platform right
    level: 12, tier: "hard", catLimit: 9, targetScore: 650,
    enemies: [
      { type: "dog",      x: 780,  y: 258 },
      { type: "dog",      x: 780,  y: 398 },
      { type: "squirrel", x: 1000, y: 403 },
    ],
    obstacles: [
      { x: 780,  y: 280, w: 110, h: 12 },
      { x: 780,  y: 420, w: 110, h: 12 },
      { x: 1000, y: 420, w:  90, h: 12 },
      { x: 880,  y: 565, w: 380, h: 14 },
    ],
  },
  {
    // Pigeon castle: two pigeons stacked, mice on the ground flanking
    level: 13, tier: "hard", catLimit: 9, targetScore: 550,
    enemies: [
      { type: "mouse",  x: 710, y: 548 },
      { type: "pigeon", x: 840, y: 331 },
      { type: "pigeon", x: 840, y: 196 },
      { type: "mouse",  x: 970, y: 548 },
    ],
    obstacles: [
      { x: 840, y: 350, w: 100, h: 12 },
      { x: 840, y: 215, w:  80, h: 12 },
      { x: 840, y: 565, w: 380, h: 14 },
    ],
  },
  {
    // Five-enemy spread across all five heights — wide field
    level: 14, tier: "hard", catLimit: 8, targetScore: 650,
    enemies: [
      { type: "squirrel", x: 700,  y: 473 },
      { type: "squirrel", x: 820,  y: 333 },
      { type: "pigeon",   x: 930,  y: 261 },
      { type: "squirrel", x: 1030, y: 403 },
      { type: "squirrel", x: 1110, y: 473 },
    ],
    obstacles: [
      { x: 700,  y: 490, w:  90, h: 12 },
      { x: 820,  y: 350, w:  90, h: 12 },
      { x: 930,  y: 280, w:  80, h: 12 },
      { x: 1030, y: 420, w:  90, h: 12 },
      { x: 1110, y: 490, w:  80, h: 12 },
      { x: 880,  y: 565, w: 500, h: 14 },
    ],
  },
  {
    // Pyramid: pigeons mid, dog at apex — requires precision arc
    level: 15, tier: "hard", catLimit: 9, targetScore: 750,
    enemies: [
      { type: "mouse",  x: 680,  y: 548 },
      { type: "pigeon", x: 800,  y: 401 },
      { type: "dog",    x: 900,  y: 328 },
      { type: "pigeon", x: 1000, y: 401 },
      { type: "mouse",  x: 1100, y: 548 },
    ],
    obstacles: [
      { x: 800,  y: 420, w:  90, h: 12 },
      { x: 900,  y: 350, w: 110, h: 12 },
      { x: 1000, y: 420, w:  90, h: 12 },
      { x: 880,  y: 565, w: 500, h: 14 },
    ],
  },
  // ── BRUTAL ────────────────────────────────────────────────────────────────
  {
    // Dog on stacked tower left, dog mid right, mouse ground — split required
    level: 16, tier: "brutal", catLimit: 9, targetScore: 620,
    enemies: [
      { type: "dog",   x: 760,  y: 258 },
      { type: "mouse", x: 920,  y: 548 },
      { type: "dog",   x: 1060, y: 398 },
    ],
    obstacles: [
      { x: 760,  y: 280, w: 110, h: 12 },
      { x: 760,  y: 350, w: 110, h: 12 },
      { x: 1060, y: 420, w: 100, h: 12 },
      { x: 920,  y: 565, w: 420, h: 14 },
    ],
  },
  {
    // Cascading: each enemy one level lower from left to right
    level: 17, tier: "brutal", catLimit: 9, targetScore: 720,
    enemies: [
      { type: "pigeon",   x: 700,  y: 331 },
      { type: "dog",      x: 840,  y: 258 },
      { type: "pigeon",   x: 980,  y: 401 },
      { type: "squirrel", x: 1080, y: 473 },
    ],
    obstacles: [
      { x: 700,  y: 350, w:  90, h: 12 },
      { x: 840,  y: 280, w: 110, h: 12 },
      { x: 980,  y: 420, w:  90, h: 12 },
      { x: 1080, y: 490, w:  80, h: 12 },
      { x: 880,  y: 565, w: 440, h: 14 },
    ],
  },
  {
    // Fortress: pigeon at sky, dogs flanking mid, mouse ground
    level: 18, tier: "brutal", catLimit: 9, targetScore: 750,
    enemies: [
      { type: "dog",    x: 780, y: 398 },
      { type: "pigeon", x: 880, y: 196 },
      { type: "dog",    x: 980, y: 328 },
      { type: "mouse",  x: 880, y: 548 },
    ],
    obstacles: [
      { x: 780, y: 420, w: 100, h: 12 },
      { x: 880, y: 215, w:  80, h: 12 },
      { x: 880, y: 350, w: 100, h: 12 },
      { x: 980, y: 350, w: 100, h: 12 },
      { x: 880, y: 565, w: 400, h: 14 },
    ],
  },
  {
    // Six-enemy chaos: all six heights occupied, wide spread
    level: 19, tier: "brutal", catLimit: 10, targetScore: 820,
    enemies: [
      { type: "mouse",    x: 650,  y: 548 },
      { type: "squirrel", x: 760,  y: 403 },
      { type: "pigeon",   x: 860,  y: 261 },
      { type: "dog",      x: 950,  y: 328 },
      { type: "squirrel", x: 1040, y: 473 },
      { type: "mouse",    x: 1130, y: 548 },
    ],
    obstacles: [
      { x: 760,  y: 420, w:  90, h: 12 },
      { x: 860,  y: 280, w:  80, h: 12 },
      { x: 950,  y: 350, w: 110, h: 12 },
      { x: 1040, y: 490, w:  80, h: 12 },
      { x: 880,  y: 565, w: 540, h: 14 },
    ],
  },
  {
    // Final boss: sky pigeon, two v.high dogs, pigeon v.high right + ground mice
    level: 20, tier: "brutal", catLimit: 10, targetScore: 950,
    enemies: [
      { type: "dog",    x: 730,  y: 258 },
      { type: "pigeon", x: 830,  y: 196 },
      { type: "dog",    x: 930,  y: 328 },
      { type: "pigeon", x: 1030, y: 261 },
      { type: "mouse",  x: 730,  y: 548 },
      { type: "mouse",  x: 1030, y: 548 },
    ],
    obstacles: [
      { x: 730,  y: 280, w: 100, h: 12 },
      { x: 830,  y: 215, w:  80, h: 12 },
      { x: 830,  y: 350, w: 100, h: 12 },
      { x: 930,  y: 350, w: 110, h: 12 },
      { x: 1030, y: 280, w:  90, h: 12 },
      { x: 730,  y: 565, w: 100, h: 14 },
      { x: 880,  y: 565, w: 500, h: 14 },
    ],
  },
];

function getLevel(num) {
  return LEVELS[num - 1] || LEVELS[LEVELS.length - 1];
}

const TOTAL_LEVELS = LEVELS.length;
