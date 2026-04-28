"use strict";

const ENEMY_TYPES = {
  mouse: {
    name: "Garden Mouse",
    health: 1,
    color: "#808080",
    radius: 10,
    symbol: "🐭",
    points: 100,
  },
  pigeon: {
    name: "Pigeon",
    health: 2,
    color: "#A9A9A9",
    radius: 13,
    symbol: "🕊️",
    points: 200,
  },
  dog: {
    name: "Dog Pup",
    health: 3,
    color: "#8B4513",
    radius: 16,
    symbol: "🐕",
    points: 300,
  },
  squirrel: {
    name: "Squirrel",
    health: 1,
    color: "#CD853F",
    radius: 11,
    symbol: "🐿️",
    points: 150,
  },
};

function getEnemyProperties(type) {
  return ENEMY_TYPES[type] || ENEMY_TYPES.mouse;
}
