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

const slugs = [
  "day-01-gather",
  "day-02-memory",
  "day-03-tool",
  "day-04-village",
  "day-05-relic",
  "night-01-deploy",
  "night-02-defense",
  "night-03-hero",
  "night-04-duel",
  "night-05-season",
];

const script = fs.readFileSync(path.join(root, "script.js"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");

/* The Nemesis archive is gone from every surface, not just from the page that showed it. */
for (const page of [...gamePages, ...homePages]) {
  const html = fs.readFileSync(page, "utf8");
  const where = path.relative(root, page);
  assert.equal((html.match(/nemesis/gi) || []).length, 0, `${where} has no Nemesis markup left`);
  assert.equal((html.match(/href="#nemesis"/g) || []).length, 0, `${where} has no dead #nemesis anchor`);
}

assert.equal((script.match(/nemesis/gi) || []).length, 0, "script.js has no Nemesis identifiers left");
assert.equal((css.match(/nemesis/gi) || []).length, 0, "styles.css has no Nemesis rules left");
assert.equal(fs.existsSync(path.join(root, "assets", "nemesis")), false, "the Nemesis artwork folder is deleted");
assert.equal(
  fs.existsSync(path.join(root, "tests", "nemesis-gallery.test.js")),
  false,
  "the Nemesis gallery contract test is deleted with its contract"
);

for (const page of gamePages) {
  const html = fs.readFileSync(page, "utf8");
  const where = path.relative(root, page);

  /* One day/night section replaces the old cycle + features + nemesis stack. */
  assert.equal(
    (html.match(/<section class="daynight section" id="features"[^>]*data-daynight>/g) || []).length,
    1,
    `${where} has exactly one day/night section on the #features anchor`
  );
  assert.equal((html.match(/class="cycle"/g) || []).length, 0, `${where} no longer carries the old cycle section`);
  assert.equal((html.match(/class="features section"/g) || []).length, 0, `${where} no longer carries the old features section`);

  /* WAI-ARIA tabs wiring. */
  assert.match(html, /<div class="daynight-tabs" role="tablist" aria-label="[^"]+">/, `${where} labels the tablist`);
  for (const key of ["day", "night"]) {
    assert.match(
      html,
      new RegExp(`role="tab" id="tab-${key}" aria-controls="panel-${key}" aria-selected="(true|false)" data-daynight-tab="${key}"`),
      `${where} wires the ${key} tab to its panel`
    );
    assert.match(
      html,
      new RegExp(`role="tabpanel" id="panel-${key}" aria-labelledby="tab-${key}" data-daynight-panel="${key}" tabindex="0"`),
      `${where} wires the ${key} panel back to its tab`
    );
  }
  assert.equal((html.match(/aria-selected="true"/g) || []).length, 1, `${where} starts with exactly one selected tab`);

  /* No-JS fallback: nothing is hidden until the script hides it. */
  assert.equal(
    (html.match(/<div class="daynight-panel"[^>]*hidden/g) || []).length,
    0,
    `${where} ships both panels visible so the section still reads without JavaScript`
  );
  assert.match(html, /<div class="daynight-scroll">/, `${where} wraps the sticky viewport in its own scroll spacer`);

  /* Ten items, each pointing at a file that is actually on disk. */
  assert.equal((html.match(/<li class="daynight-item">/g) || []).length, slugs.length, `${where} lists ten scenes`);
  for (const slug of slugs) {
    assert.match(html, new RegExp(`src="/assets/daynight/${slug}\\.mp4"`), `${where} plays ${slug}.mp4`);
    assert.match(html, new RegExp(`poster="/assets/daynight/${slug}\\.webp"`), `${where} posters ${slug}.webp`);
  }

  /* Autoplay only ever happens muted, and the clip loops in place like the GIF it replaces. */
  assert.equal(
    (html.match(/<video class="daynight-video" muted loop playsinline preload="none"/g) || []).length,
    slugs.length,
    `${where} keeps every clip muted, looping and lazy`
  );
  assert.equal((html.match(/<video[^>]*\bcontrols\b/g) || []).length, 0, `${where} leaves controls to the reduced-motion path`);
  assert.equal(
    (html.match(/<video class="daynight-video"[^>]*aria-label="[^"]+"/g) || []).length,
    slugs.length,
    `${where} describes every silent clip for screen readers`
  );

  /* Home pages never get the game-page section. */
  assert.equal((html.match(/data-daynight\b/g) || []).length > 0, true, `${where} marks the section for the shared script`);
}

for (const slug of slugs) {
  for (const ext of ["mp4", "webp"]) {
    const asset = path.join(root, "assets", "daynight", `${slug}.${ext}`);
    assert.equal(fs.existsSync(asset), true, `assets/daynight/${slug}.${ext} exists on disk`);
  }
}

for (const page of homePages) {
  const html = fs.readFileSync(page, "utf8");
  const where = path.relative(root, page);
  assert.equal((html.match(/data-daynight/g) || []).length, 0, `${where} does not carry the game-page day/night section`);
}

/* The scroll driver must not hijack the browser's own scrolling. */
assert.equal((script.match(/"wheel"/g) || []).length, 0, "no wheel interception");
assert.equal((script.match(/"touchmove"/g) || []).length, 0, "no touchmove interception");
assert.match(script, /window\.addEventListener\("scroll", onScroll, \{ passive: true \}\)/, "the scroll listener stays passive");
assert.match(script, /position: sticky|is-scroll-driven/, "progress is driven from a sticky section, not from preventDefault");
assert.match(css, /\.daynight\.is-scroll-driven \.daynight-sticky \{\s*position: sticky;/, "the sticky viewport is opt-in via the script-added class");
assert.match(css, /\.daynight\.is-scroll-driven \.daynight-scroll \{\s*height: var\(--daynight-scroll/, "section height comes from the measured scroll budget");

/* Scrolled-into-view clips call video.play(); a rejected promise there must not become an unhandled rejection. */
const videoObserverMatch = script.match(
  /const videoObserver = new IntersectionObserver\(\s*\(entries\) => \{[\s\S]*?\},\s*\{ threshold: 0\.35 \},\s*\);/
);
assert.ok(videoObserverMatch, "the video IntersectionObserver callback exists");
assert.match(
  videoObserverMatch[0],
  /const started = video\.play\(\);\s*if \(started && typeof started\.catch === "function"\) started\.catch\(\(\) => \{\}\);/,
  "the video observer swallows play() rejections instead of leaving them unhandled"
);

/* prefers-reduced-motion: no sticky pinning, no auto switch, and the visitor starts the clips. */
assert.match(
  script,
  /if \(reduceMotion\.matches\) \{\s*videos\.forEach\(\(video\) => video\.setAttribute\("controls", ""\)\);\s*return;\s*\}/,
  "reduced motion skips the scroll driver and hands the clips back to the visitor"
);
assert.match(
  css,
  /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.daynight\.is-scroll-driven \.daynight-sticky \{\s*position: static;/,
  "reduced motion unpins the sticky viewport even if the setting flips after load"
);
assert.match(
  css,
  /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.daynight-track \{\s*transform: none !important;/,
  "reduced motion drops the scroll-driven offset"
);

/* Escape still closes the menu; it no longer closes a dialog that does not exist. */
assert.equal(
  (script.match(/event\.key === "Escape"/g) || []).length,
  1,
  "only the menu keeps an Escape handler"
);

/* styles.css and script.js are shared with the home pages: the new code must no-op there. */
assert.match(script, /const daynightSection = document\.querySelector\("\[data-daynight\]"\)/, "the section is looked up by data attribute");
assert.match(script, /if \(daynightSection\) setupDayNight\(daynightSection\)/, "setup only runs when the section exists");

const stub = {
  matches: false,
  addEventListener() {},
  removeEventListener() {},
};
const windowStub = {
  matchMedia: () => stub,
  addEventListener() {},
  removeEventListener() {},
  requestAnimationFrame() {},
  scrollTo() {},
  innerWidth: 1280,
  innerHeight: 900,
  scrollY: 0,
  localStorage: { getItem: () => null, setItem() {} },
};
const documentStub = {
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() {},
  createElement: () => {
    throw new Error("script.js built UI on a page without the player markup");
  },
  body: { classList: { add() {}, remove() {}, toggle() {} } },
};

assert.doesNotThrow(() => {
  vm.runInNewContext(script, {
    window: windowStub,
    document: documentStub,
    getComputedStyle: () => ({ columnGap: "0px", top: "0px" }),
  });
}, "script.js runs cleanly on a page with neither the day/night section nor the player");

console.log("day & night tabs contract ok");
