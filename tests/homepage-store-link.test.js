const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
const gamePage = fs.readFileSync(path.join(root, "games", "tiny-defense", "index.html"), "utf8");

assert.match(
  home,
  /<a class="game-card reveal" href="\/games\/tiny-defense\/"/,
  "the Tiny Defense card opens the game page from the studio homepage"
);
assert.match(gamePage, /<section class="release section" id="stores"/, "the game page provides the linked store section");

console.log("homepage store-link contract ok");

for (const base of ["", "en/", "ja/"]) {
 const html=fs.readFileSync(path.join(root,base,"index.html"),"utf8");
 assert.match(html,/class="studio-intro"/);
 assert.match(html,/id="studio"/);
 assert.doesNotMatch(html,/data-world|data-map-open|world\.js/);
 const game=fs.readFileSync(path.join(root,base,"games/tiny-defense/index.html"),"utf8");
 assert.match(game,/data-world/);
 assert.match(game,/id="story-reader"/);
}
