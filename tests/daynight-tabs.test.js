const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const gamePages = [
  { file: path.join(root, "games", "tiny-defense", "index.html"), toNight: "밤으로", toDay: "낮으로" },
  { file: path.join(root, "en", "games", "tiny-defense", "index.html"), toNight: "To night", toDay: "To day" },
  { file: path.join(root, "ja", "games", "tiny-defense", "index.html"), toNight: "夜へ", toDay: "昼へ" },
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
for (const page of [...gamePages.map((entry) => entry.file), ...homePages]) {
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

for (const { file, toNight, toDay } of gamePages) {
  const html = fs.readFileSync(file, "utf8");
  const where = path.relative(root, file);

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

  /* The page-scroll driver is gone: no spacer, no sticky viewport. */
  assert.equal((html.match(/daynight-scroll/g) || []).length, 0, `${where} dropped the scroll spacer`);
  assert.equal((html.match(/daynight-sticky/g) || []).length, 0, `${where} dropped the sticky viewport`);
  assert.match(html, /<div class="daynight-stage">/, `${where} lays the section out as a plain stage`);
  assert.match(html, /<div class="daynight-frame">/, `${where} keeps the stage inside the shared content frame`);

  /* Each track is its own focusable, labelled horizontal scroller. */
  for (const key of ["day", "night"]) {
    assert.match(
      html,
      new RegExp(`<ol class="daynight-track" data-daynight-track="${key}" tabindex="0" aria-label="[^"]+">`),
      `${where} makes the ${key} track focusable and labelled so arrow keys have somewhere to land`
    );
  }

  /* Prev/next + position readout ship hidden; only the script has any use for them. */
  assert.match(
    html,
    /<div class="daynight-controls" role="group" aria-label="[^"]+" data-daynight-controls hidden>/,
    `${where} ships the track controls hidden until the script wires them up`
  );
  assert.match(html, /<p class="daynight-status" aria-live="polite" data-daynight-status>/, `${where} announces the current scene politely`);
  assert.match(html, /data-daynight-prev aria-label="[^"]+"/, `${where} labels the previous-scene button`);
  assert.match(html, /data-daynight-next aria-label="[^"]+"/, `${where} labels the next-scene button`);

  /* Sentinel slides: one at the end of day, one at the head of night, both hidden without JS. */
  assert.equal((html.match(/<li class="daynight-jump"/g) || []).length, 2, `${where} carries exactly two sentinel slides`);
  assert.equal(
    (html.match(/<li class="daynight-jump" data-daynight-jump="(day|night)" aria-hidden="true" hidden>/g) || []).length,
    2,
    `${where} keeps both sentinels hidden until the script can act on them, and out of the accessibility tree once it has`
  );
  assert.match(
    html,
    /<\/li>\s*<li class="daynight-jump" data-daynight-jump="night" aria-hidden="true" hidden>[\s\S]*?<\/li>\s*<\/ol>/,
    `${where} parks the "to night" sentinel as the last slide of the day track`
  );
  assert.match(
    html,
    /data-daynight-track="night"[^>]*>\s*<li class="daynight-jump" data-daynight-jump="day" aria-hidden="true" hidden>/,
    `${where} parks the "to day" sentinel as the first slide of the night track`
  );
  assert.match(
    html,
    new RegExp(`<p class="daynight-jump-label">${toNight} &rarr;</p>`),
    `${where} labels the forward sentinel "${toNight}" instead of parking an unreadable empty frame there`
  );
  assert.match(
    html,
    new RegExp(`<p class="daynight-jump-label">&larr; ${toDay}</p>`),
    `${where} labels the backward sentinel "${toDay}" instead of parking an unreadable empty frame there`
  );

  /* Nothing focusable may live inside a sentinel. The only way to reach it is to
     scroll the track onto it, and that scroll is the handover itself, so the panel
     is hidden before the control can be pressed and focus falls to <body>
     (WCAG 3.2.1 On Focus). */
  const sentinels = html.match(/<li class="daynight-jump"[\s\S]*?<\/li>/g) || [];
  assert.equal(sentinels.length, 2, `${where} sentinel slides read as two closed blocks`);
  for (const sentinel of sentinels) {
    assert.equal(
      /<button|<a\s|<input|<select|<textarea|tabindex=/.test(sentinel),
      false,
      `${where} keeps the sentinel free of focusable content: focus could only arrive there by triggering the very handover that hides it`
    );
  }

  /* The crossing a visitor can actually reach is a button in the bar, which is on
     screen at every resting position and at every width. */
  assert.match(
    html,
    /<button class="daynight-cross" type="button" data-daynight-cross>/,
    `${where} puts a real handover button beside the prev/next controls`
  );
  assert.match(
    html,
    new RegExp(`<span class="daynight-cross-face" data-daynight-cross-to="night">${toNight} <span aria-hidden="true">&rarr;</span></span>`),
    `${where} spells the forward handover "${toNight}"`
  );
  assert.match(
    html,
    new RegExp(`<span class="daynight-cross-face" data-daynight-cross-to="day" hidden><span aria-hidden="true">&larr;</span> ${toDay}</span>`),
    `${where} spells the backward handover "${toDay}" and ships it behind the forward face`
  );
  const controlsGroup = html.match(/<div class="daynight-controls"[\s\S]*?<\/button>\s*<\/div>/);
  assert.ok(controlsGroup, `${where} closes the controls group`);
  assert.match(
    controlsGroup[0],
    /data-daynight-cross/,
    `${where} keeps the handover button inside the controls group, so it disappears with the rest when the script never runs`
  );

  /* No-JS fallback: nothing is hidden until the script hides it. */
  assert.equal(
    (html.match(/<div class="daynight-panel"[^>]*hidden/g) || []).length,
    0,
    `${where} ships both panels visible so the section still reads without JavaScript`
  );

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

/* The retired scroll driver must not creep back in. */
assert.equal((script.match(/--daynight-scroll/g) || []).length, 0, "the measured scroll budget is gone from script.js");
assert.equal((css.match(/--daynight-scroll/g) || []).length, 0, "the measured scroll budget is gone from styles.css");
assert.equal((css.match(/is-scroll-driven/g) || []).length, 0, "styles.css no longer has a scroll-driven mode");
assert.equal((css.match(/daynight-sticky/g) || []).length, 0, "styles.css no longer pins a sticky day/night viewport");
assert.equal((script.match(/window\.addEventListener\("scroll"/g) || []).length, 0, "nothing listens to page scroll any more");

/* Movement is native overflow scrolling: no interception anywhere. */
assert.equal((script.match(/"wheel"/g) || []).length, 0, "no wheel interception");
assert.equal((script.match(/"touchmove"/g) || []).length, 0, "no touchmove interception");
assert.match(
  script,
  /track\.addEventListener\("scroll", onTrackScroll, \{ passive: true \}\)/,
  "the track scroll listener stays passive"
);

/* The horizontal carousel contract lives in CSS, so it survives with JS switched off. */
const trackRule = css.match(/\.daynight-track \{[\s\S]*?\n\}/);
assert.ok(trackRule, "styles.css defines the day/night track");
assert.match(trackRule[0], /\n {2}display: flex;/, "the track lays its slides out in a row");
assert.match(trackRule[0], /\n {2}overflow-x: auto;/, "the track scrolls horizontally on its own");
assert.match(trackRule[0], /\n {2}scroll-snap-type: x mandatory;/, "the track snaps one scene at a time");
assert.match(trackRule[0], /\n {2}scroll-behavior: smooth;/, "the track animates programmatic moves");
/* Read every rule that targets the track, not just the first block: leaving the
   declaration in place and relaxing it in a later media query used to slip past. */
const trackOverscroll = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .filter((rule) => rule[1].split(",").some((part) => /\.daynight-track(?![\w-])/.test(part)))
  .flatMap((rule) =>
    [...rule[2].matchAll(/overscroll-behavior(?:-x|-inline)?\s*:\s*([^;]+);/g)].map((decl) => ({
      selector: rule[1].trim().replace(/\s+/g, " "),
      value: decl[1].trim(),
    }))
  );
assert.ok(trackOverscroll.length > 0, "the track has to declare an overscroll behaviour at all");
assert.deepEqual(
  trackOverscroll.filter((decl) => decl.value !== "contain"),
  [],
  "swiping past either end must not hand the gesture to the browser's back navigation, and no later rule may relax that"
);
assert.match(
  css,
  /\.daynight-item,\s*\n\.daynight-jump \{[\s\S]*?scroll-snap-align: center;/,
  "scenes and sentinels are both snap targets"
);
assert.match(css, /\.daynight-jump\[hidden\] \{\s*display: none;/, "a sentinel the script never reached stays out of the flow");
assert.match(
  css,
  /\.daynight-cross-face\[hidden\] \{\s*display: none;/,
  "the face the visitor is not on stays out of the handover button, so its accessible name is the direction it will actually take"
);
assert.equal((css.match(/daynight-jump-button/g) || []).length, 0, "the sentinel button styling went with the button");
assert.match(
  css,
  /\.daynight:not\(\.is-swipe\) \.daynight-panel \+ \.daynight-panel \{\s*margin-top: 72px;/,
  "the stacked-panel margin is the no-JS fallback only: a display:none sibling is still a sibling, so unscoped it pushed the night panel down 72px"
);
assert.equal(
  (css.match(/\.daynight-panel \+ \.daynight-panel/g) || []).length,
  1,
  "and nothing else stacks the panels"
);
assert.match(css, /\.daynight-controls\[hidden\] \{\s*display: none;/, "controls the script never reached stay out of the flow");
assert.match(css, /\.daynight\.is-swipe \.daynight-tabs \{\s*display: flex;/, "the tablist only appears once the script can switch panels");

/* prefers-reduced-motion drops the animation, not the carousel. */
const reducedMotion = css.match(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n\}/);
assert.ok(reducedMotion, "styles.css has a reduced-motion block");
assert.match(
  reducedMotion[0],
  /\.daynight-track \{\s*scroll-behavior: auto;\s*\}/,
  "reduced motion turns off smooth scrolling"
);
assert.equal(
  (reducedMotion[0].match(/scroll-snap-type|overscroll-behavior|display: none/g) || []).length,
  0,
  "reduced motion keeps snapping, swiping and every control in place"
);
assert.match(
  script,
  /if \(reduceMotion\.matches\) \{\s*videos\.forEach\(\(video\) => video\.setAttribute\("controls", ""\)\);/,
  "reduced motion hands the clips back to the visitor instead of autoplaying them"
);

/* Exactly one clip runs, chosen by the snap position rather than by an
   intersection ratio: at either end of the track a neighbouring slide is more
   than 60% visible, so a ratio test plays two scenes at once. */
const playbackMatch = script.match(/function syncPlayback\(\) \{[\s\S]*?\n  \}/);
assert.ok(playbackMatch, "playback is decided in one place");
assert.match(
  playbackMatch[0],
  /const snapped = track && items\.length \? items\[nearest\(track, items\)\] : null;/,
  "the playing scene is the snapped one"
);
assert.match(
  playbackMatch[0],
  /const wanted = sectionVisible && !reduceMotion\.matches && snapped \?/,
  "nothing plays while the section is off screen or motion is reduced"
);
assert.match(
  playbackMatch[0],
  /\} else if \(!video\.paused\) \{\s*video\.pause\(\);/,
  "every other clip, including the hidden panel's, is paused"
);
assert.match(
  playbackMatch[0],
  /const started = video\.play\(\);\s*if \(started && typeof started\.catch === "function"\) started\.catch\(\(\) => \{\}\);/,
  "a rejected play() promise is swallowed instead of left unhandled"
);
assert.match(
  script,
  /sectionObserver\.observe\(section\)/,
  "an observer still decides whether the section is on screen at all"
);

/* The sentinel is what crosses the tab boundary — no overscroll delta maths. */
const sentinelMatch = script.match(/function edgeSentinel\(\) \{[\s\S]*?\n  \}/);
assert.ok(sentinelMatch, "the handover decision lives in one readable place");
assert.match(
  sentinelMatch[0],
  /const slide = slides\[nearest\(track, slides\)\];/,
  "the handover reads the slide the track settled on"
);
assert.match(
  sentinelMatch[0],
  /const parked = forward \? track\.scrollLeft >= maxScroll - 4 : track\.scrollLeft <= 4;/,
  "the tab only flips once the track is actually parked at that end"
);
assert.match(
  script,
  /if \(!crossing && handovers < 2\) \{/,
  "a half-finished panel switch cannot hand over again and bounce back"
);
const dayNightSource = script.slice(
  script.indexOf("function setupDayNight"),
  script.indexOf("if (daynightSection) setupDayNight")
);
assert.ok(dayNightSource.length > 500, "the day/night setup function was located");
assert.equal(
  (dayNightSource.match(/behavior: "auto"/g) || []).length,
  0,
  'a reset must not ask for behavior "auto": that means "whatever CSS says", and CSS says smooth, so the track would still be gliding when the handover check reads its position'
);
assert.match(
  script,
  /track\.style\.scrollBehavior = "auto";\s*track\.scrollLeft = left;/,
  "an instant reset bypasses CSS smooth scrolling so the landing position is readable straight away"
);
assert.match(script, /jump\.hidden = false;/, "the script is what reveals the sentinel slides");
assert.match(script, /if \(controls\) controls\.hidden = false;/, "the script is what reveals the track controls");
assert.match(
  script,
  /crossButton\?\.addEventListener\("click", \(\) => jumpTo\(crossTarget\(\), active\)\);/,
  "the bar button is what a keyboard or screen-reader visitor presses to cross"
);
assert.match(
  script,
  /function updateCross\(\) \{\s*const toKey = crossTarget\(\);\s*crossFaces\.forEach\(\(face\) => \{\s*face\.hidden = face\.dataset\.daynightCrossTo !== toKey;/,
  "one button swaps its label instead of two buttons swapping places, so pressing it never hides the element holding focus"
);
assert.equal(
  (script.match(/daynight-jump-button|jump\.querySelector\("button"\)/g) || []).length,
  0,
  "and nothing wires a control inside a sentinel any more"
);
assert.match(
  script,
  /const focusLeaves = !!\(held && incoming && !incoming\.contains\(held\) && panels\.some\(\(panel\) => panel\.contains\(held\)\)\);/,
  "a handover notices when it is about to hide the element that holds focus"
);
assert.match(
  script,
  /if \(track\) track\.focus\(\{ preventScroll: true \}\);/,
  "and carries that focus onto the incoming track rather than dropping it on <body>"
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

console.log("day & night swipe carousel contract ok");
