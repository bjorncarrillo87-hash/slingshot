"use strict";

// Canvas dimensions: 1200 x 650
// Slingshot anchor: x=200, y=480
// Ground: y=580
// Enemy placement zone: x=600–1100, y=varies

const LEVELS = [
  {
    level: 1,
    catLimit: 5,
    targetScore: 200,
    enemies: [
      { type: "mouse", x: 750, y: 545 },
      { type: "mouse", x: 850, y: 545 },
    ],
    obstacles: [
      { shape: "rect", x: 800, y: 560, w: 120, h: 15 },
    ],
  },
  {
    level: 2,
    catLimit: 5,
    targetScore: 400,
    enemies: [
      { type: "mouse", x: 750, y: 545 },
      { type: "mouse", x: 850, y: 545 },
      { type: "mouse", x: 950, y: 545 },
    ],
    obstacles: [
      { shape: "rect", x: 850, y: 560, w: 200, h: 15 },
    ],
  },
  {
    level: 3,
    catLimit: 6,
    targetScore: 500,
    enemies: [
      { type: "mouse", x: 700, y: 545 },
      { type: "pigeon", x: 820, y: 490 },
      { type: "mouse", x: 950, y: 545 },
    ],
    obstacles: [
      { shape: "rect", x: 820, y: 510, w: 80, h: 12 },
      { shape: "rect", x: 820, y: 560, w: 250, h: 15 },
    ],
  },
  {
    level: 4,
    catLimit: 6,
    targetScore: 700,
    enemies: [
      { type: "pigeon", x: 720, y: 490 },
      { type: "mouse", x: 820, y: 545 },
      { type: "pigeon", x: 950, y: 490 },
    ],
    obstacles: [
      { shape: "rect", x: 720, y: 510, w: 80, h: 12 },
      { shape: "rect", x: 950, y: 510, w: 80, h: 12 },
      { shape: "rect", x: 835, y: 560, w: 300, h: 15 },
    ],
  },
  {
    level: 5,
    catLimit: 7,
    targetScore: 900,
    enemies: [
      { type: "mouse", x: 680, y: 545 },
      { type: "pigeon", x: 780, y: 490 },
      { type: "squirrel", x: 880, y: 545 },
      { type: "mouse", x: 980, y: 545 },
    ],
    obstacles: [
      { shape: "rect", x: 780, y: 510, w: 80, h: 12 },
      { shape: "rect", x: 830, y: 560, w: 350, h: 15 },
    ],
  },
  {
    level: 6,
    catLimit: 7,
    targetScore: 1100,
    enemies: [
      { type: "squirrel", x: 700, y: 545 },
      { type: "pigeon", x: 800, y: 440 },
      { type: "squirrel", x: 900, y: 545 },
      { type: "mouse", x: 1000, y: 545 },
    ],
    obstacles: [
      { shape: "rect", x: 800, y: 460, w: 80, h: 12 },
      { shape: "rect", x: 800, y: 510, w: 80, h: 12 },
      { shape: "rect", x: 850, y: 560, w: 360, h: 15 },
    ],
  },
  {
    level: 7,
    catLimit: 8,
    targetScore: 1400,
    enemies: [
      { type: "dog", x: 780, y: 530 },
      { type: "mouse", x: 680, y: 545 },
      { type: "mouse", x: 900, y: 545 },
    ],
    obstacles: [
      { shape: "rect", x: 780, y: 555, w: 100, h: 15 },
      { shape: "rect", x: 790, y: 560, w: 320, h: 15 },
    ],
  },
  {
    level: 8,
    catLimit: 8,
    targetScore: 1700,
    enemies: [
      { type: "dog", x: 760, y: 530 },
      { type: "pigeon", x: 880, y: 490 },
      { type: "mouse", x: 990, y: 545 },
    ],
    obstacles: [
      { shape: "rect", x: 760, y: 555, w: 90, h: 15 },
      { shape: "rect", x: 880, y: 510, w: 80, h: 12 },
      { shape: "rect", x: 875, y: 560, w: 290, h: 15 },
    ],
  },
  {
    level: 9,
    catLimit: 8,
    targetScore: 2000,
    enemies: [
      { type: "squirrel", x: 670, y: 545 },
      { type: "dog", x: 790, y: 528 },
      { type: "pigeon", x: 910, y: 490 },
      { type: "squirrel", x: 1020, y: 545 },
    ],
    obstacles: [
      { shape: "rect", x: 790, y: 555, w: 100, h: 15 },
      { shape: "rect", x: 910, y: 510, w: 80, h: 12 },
      { shape: "rect", x: 845, y: 560, w: 400, h: 15 },
    ],
  },
  {
    level: 10,
    catLimit: 9,
    targetScore: 2500,
    enemies: [
      { type: "dog", x: 720, y: 528 },
      { type: "dog", x: 870, y: 528 },
      { type: "pigeon", x: 1000, y: 490 },
    ],
    obstacles: [
      { shape: "rect", x: 720, y: 555, w: 90, h: 15 },
      { shape: "rect", x: 870, y: 555, w: 90, h: 15 },
      { shape: "rect", x: 1000, y: 510, w: 80, h: 12 },
      { shape: "rect", x: 860, y: 560, w: 340, h: 15 },
    ],
  },
];

function getLevel(num) {
  return LEVELS[num - 1] || LEVELS[LEVELS.length - 1];
}

const TOTAL_LEVELS = LEVELS.length;
