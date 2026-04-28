const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",

  // clean imports
  moduleFileExtensions: ["ts", "js"],

  testMatch: ["**/*.test.ts"],

  transform: {
    "^.+\\.ts$": "ts-jest",
  },

  clearMocks: true,
};