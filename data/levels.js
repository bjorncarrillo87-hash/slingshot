"use strict";

// Ground surface Y = 580
// Base platform:    y=565, h=14 → top=558
// Raised platform:  y=495, h=12 → top=489
// High platform:    y=435, h=12 → top=429
//
// Enemy center Y = platformTop - enemyRadius
//   mouse   r=10: base=548, raised=479, high=419
//   squirrel r=11: base=547, raised=478, high=418
//   pigeon  r=13: base=545, raised=476, high=416
//   dog     r=16: base=542, raised=473, high=413

const LEVELS = [
  {
    level: 1,
    catLimit: 5,
    targetScore: 200,
    enemies: [
      { type: "mouse", x: 760, y: 548 },
      { type: "mouse", x: 850, y: 548 },
    ],
    obstacles: [
      { x: 800, y: 565, w: 160, h: 14 },
    ],
  },
  {
    level: 2,
    catLimit: 5,
    targetScore: 400,
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
    level: 3,
    catLimit: 6,
    targetScore: 500,
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
    level: 4,
    catLimit: 6,
    targetScore: 700,
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
    level: 5,
    catLimit: 7,
    targetScore: 900,
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
  {
    level: 6,
    catLimit: 7,
    targetScore: 1100,
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
    level: 7,
    catLimit: 8,
    targetScore: 1400,
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
    level: 8,
    catLimit: 8,
    targetScore: 1700,
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
    level: 9,
    catLimit: 8,
    targetScore: 2000,
    enemies: [
      { type: "squirrel", x: 690,  y: 547 },
      { type: "dog",      x: 830,  y: 473 },
      { type: "pigeon",   x: 960,  y: 476 },
      { type: "squirrel", x: 1060, y: 547 },
    ],
    obstacles: [
      { x: 830,  y: 495, w: 110, h: 12 },
      { x: 960,  y: 495, w: 100, h: 12 },
      { x: 875,  y: 565, w: 460, h: 14 },
    ],
  },
  {
    level: 10,
    catLimit: 9,
    targetScore: 2500,
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
];

function getLevel(num) {
  return LEVELS[num - 1] || LEVELS[LEVELS.length - 1];
}

const TOTAL_LEVELS = LEVELS.length;
