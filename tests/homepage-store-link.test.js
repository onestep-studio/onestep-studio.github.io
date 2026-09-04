const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
const gamePage = fs.readFileSync(path.join(root, "games", "tiny-defense", "index.html"), "utf8");

assert.match(
  home,
  /<a class="game-card reveal" href="\/games\/tiny-defense\/#stores"/,
  "the Tiny Defense card links directly to its store section"
);
assert.match(gamePage, /<section class="release section" id="stores"/, "the game page provides the linked store section");

console.log("homepage store-link contract ok");
