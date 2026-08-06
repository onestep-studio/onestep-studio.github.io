const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const names = ["태고의 트롤", "개화의 폭군", "작열의 화신", "수확의 사신", "혹한의 군주"];
const assets = ["elder-troll", "bloom-tyrant", "blazing-avatar", "harvest-reaper", "frost-monarch"];

function pngSize(filename) {
  const bytes = fs.readFileSync(filename);
  assert.equal(bytes.subarray(1, 4).toString("ascii"), "PNG", `${filename} is a PNG`);
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

const page = path.join(root, "games", "tiny-defense", "index.html");
const html = fs.readFileSync(page, "utf8");
assert.match(html, /href="#nemesis"/, "the navigation links to the Nemesis section");
assert.equal((html.match(/data-nemesis-card/g) || []).length, 5, "the game page has five Nemesis cards");
assert.equal((html.match(/data-nemesis-dialog/g) || []).length, 1, "the game page has one centered detail dialog");
for (const name of names) assert.match(html, new RegExp(name), `${name} is present`);

for (const asset of assets) {
  const [width, height] = pngSize(path.join(root, "assets", "nemesis", `${asset}.png`));
  assert.deepEqual([width, height], [512, 512], `${asset} keeps the approved first frame`);
}

const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
assert.match(script, /function openNemesisDialog/, "the website opens a detail dialog");
assert.match(script, /function closeNemesisDialog/, "the website closes a detail dialog");
assert.match(script, /event\.key === "Escape"/, "Escape closes the detail dialog");
assert.match(script, /nemesisLastTrigger\.focus\(\)/, "closing restores card focus");

const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
assert.match(css, /@media \(max-width: 1023px\)[\s\S]*?\.nemesis-grid\s*\{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/, "tablet layout uses two Nemesis columns");
assert.match(css, /@media \(max-width: 620px\)[\s\S]*?\.nemesis-grid\s*\{\s*grid-template-columns: 1fr/, "mobile layout uses one Nemesis column");

console.log("nemesis gallery contract ok");
