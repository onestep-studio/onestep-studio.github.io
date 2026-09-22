const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const gamePages = [
  path.join(root, "games", "tiny-defense", "index.html"),
  path.join(root, "en", "games", "tiny-defense", "index.html"),
  path.join(root, "ja", "games", "tiny-defense", "index.html"),
];
const homePages = [
  path.join(root, "index.html"),
  path.join(root, "en", "index.html"),
  path.join(root, "ja", "index.html"),
];

const script = fs.readFileSync(path.join(root, "script.js"), "utf8");

for (const page of gamePages) {
  const html = fs.readFileSync(page, "utf8");
  const where = path.relative(root, page);

  assert.equal((html.match(/data-bgm(?![-\w])/g) || []).length, 1, `${where} has exactly one lobby player`);
  assert.equal((html.match(/\bdata-bgm-audio\b/g) || []).length, 1, `${where} has exactly one audio element`);

  const audio = (html.match(/<audio[^>]*data-bgm-audio[^>]*>/) || [])[0];
  assert.ok(audio, `${where} exposes the audio element`);

  /* Progressive enhancement: with the script dead, the native controls must still play and stop. */
  assert.match(audio, /\bcontrols\b/, `${where} ships native controls so the player works without JavaScript`);
  assert.match(audio, /\bloop\b/, `${where} loops the 91s lobby track`);
  assert.match(audio, /preload="none"/, `${where} does not download 1.4MB before the visitor asks for it`);
  assert.match(audio, /src="\/assets\/audio\/lobby-theme\.mp3"/, `${where} points at the shared lobby theme`);
  assert.match(audio, /aria-label="[^"]+"/, `${where} names the track for screen readers`);
  assert.doesNotMatch(audio, /\bautoplay\b/, `${where} never asks for autoplay, which browsers block for audible media`);

  /* Every visible string comes from the page, not from the shared script. */
  for (const attribute of ["data-bgm-title", "data-bgm-play-label", "data-bgm-pause-label", "data-bgm-volume-label"]) {
    assert.match(html, new RegExp(`${attribute}="[^"]+"`), `${where} localises ${attribute}`);
  }
  assert.match(html, /<div class="bgm-player" data-bgm role="group" aria-label="[^"]+"/, `${where} groups and labels the player`);
  assert.doesNotMatch(html, /<div class="bgm-player"[^>]*\bhidden\b/, `${where} does not hide the no-JS fallback`);
}

assert.equal(fs.existsSync(path.join(root, "assets", "audio", "lobby-theme.mp3")), true, "assets/audio/lobby-theme.mp3 exists on disk");

for (const page of homePages) {
  const html = fs.readFileSync(page, "utf8");
  const where = path.relative(root, page);
  assert.equal((html.match(/data-bgm/g) || []).length, 0, `${where} carries no lobby player`);
}

/* script.js is shared with the home pages, so the player code must no-op when the markup is absent. */
assert.match(script, /const bgmPlayer = document\.querySelector\("\[data-bgm\]"\)/, "the player is looked up by data attribute");
assert.match(script, /if \(bgmPlayer\) setupBgm\(bgmPlayer\)/, "setup only runs when the player exists");

/* A rejected play() is swallowed: autoplay blocking must not reach the console. */
assert.match(script, /started\.catch\(\(\) => render\(\)\)/, "a blocked play() quietly falls back to the stopped state");
assert.match(script, /const PLAY_KEY = "onestep\.bgm\.playing"/, "the on/off choice is remembered across visits");
assert.match(script, /gestures\.forEach\(\(type\) => document\.addEventListener\(type, resume, \{ passive: true \}\)\)/, "resume waits for a real user gesture");

const windowStub = {
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  addEventListener() {},
  removeEventListener() {},
  requestAnimationFrame() {},
  scrollTo() {},
  innerWidth: 1280,
  innerHeight: 900,
  scrollY: 0,
  localStorage: {
    getItem() {
      throw new Error("storage disabled");
    },
    setItem() {
      throw new Error("storage disabled");
    },
  },
};
const documentStub = {
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() {},
  createElement: () => {
    throw new Error("script.js built the player on a page without [data-bgm]");
  },
  body: { classList: { add() {}, remove() {}, toggle() {} } },
};

assert.doesNotThrow(() => {
  vm.runInNewContext(script, {
    window: windowStub,
    document: documentStub,
    getComputedStyle: () => ({ columnGap: "0px", top: "0px" }),
  });
}, "script.js runs cleanly on a page without the player markup");

console.log("lobby bgm player contract ok");
