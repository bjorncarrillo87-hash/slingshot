"use strict";

const CAT_TYPES = {
  orange: {
    name: "Orange Tabby",
    mass: 1.0,
    restitution: 0.7,
    speedMultiplier: 1.0,
    powerMultiplier: 1.0,
    color: "#FF8C00",
    radius: 15,
    description: "Balanced cat. Good all-around.",
    emoji: "🟠",
  },
  chonky: {
    name: "Chonky Cat",
    mass: 2.0,
    restitution: 0.5,
    speedMultiplier: 0.8,
    powerMultiplier: 1.8,
    color: "#FFA500",
    radius: 20,
    description: "Heavy hitter. Slow but powerful.",
    emoji: "🔶",
  },
  ninja: {
    name: "Ninja Cat",
    mass: 0.7,
    restitution: 0.9,
    speedMultiplier: 1.3,
    powerMultiplier: 0.6,
    color: "#8B4513",
    radius: 12,
    description: "Fast & light. Bounces everywhere.",
    emoji: "🟫",
  },
  sleepy: {
    name: "Sleepy Cat",
    mass: 1.2,
    restitution: 1.1,
    speedMultiplier: 0.9,
    powerMultiplier: 0.9,
    color: "#FF69B4",
    radius: 15,
    description: "Unpredictable. Extra bounce.",
    emoji: "🩷",
  },
};

function getCatProperties(type) {
  return CAT_TYPES[type] || CAT_TYPES.orange;
}
