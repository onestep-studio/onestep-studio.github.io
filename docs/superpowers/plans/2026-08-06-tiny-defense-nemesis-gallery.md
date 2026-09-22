# Tiny Defense Website Nemesis Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved five-boss Nemesis equal gallery and centered accessible detail dialog to the Korean Tiny Defense game page.

**Architecture:** The existing game page gains one native section between features and screenshots, using the site's global stylesheet and script. Five optimized transparent PNGs are copied from the TinyDefense codex output into website assets; a dependency-free Node contract test protects content, asset paths, and modal behavior markers.

**Tech Stack:** Static HTML5, existing `styles.css`, vanilla JavaScript, Node.js assertions, PNG

## Global Constraints

- Embed the gallery in `games/tiny-defense/index.html`; do not iframe another page.
- Keep the existing site visual language and responsive breakpoints.
- Add Korean content only; do not alter English or Japanese game pages.
- Reuse the five 512×512 approved sprite crops from the TinyDefense repository.
- Do not expose exact damage, cooldown, or multiplier values.
- Support keyboard activation, `Escape`, backdrop dismissal, focus return, reduced motion, and body scroll lock.
- Keep all paths root-relative for GitHub Pages deployment.

---

### Task 1: Website Assets and Static Contract

**Files:**
- Create: `assets/nemesis/elder-troll.png`
- Create: `assets/nemesis/bloom-tyrant.png`
- Create: `assets/nemesis/blazing-avatar.png`
- Create: `assets/nemesis/harvest-reaper.png`
- Create: `assets/nemesis/frost-monarch.png`
- Create: `tests/nemesis-gallery.test.js`

**Interfaces:**
- Consumes: `C:/OneStep/tiny_defense/docs/nemesis-codex/assets/*.png`.
- Produces: five root-relative `/assets/nemesis/*.png` website assets and a dependency-free Node test.

- [ ] **Step 1: Write the failing asset test**

```js
const assetNames = ["elder-troll", "bloom-tyrant", "blazing-avatar", "harvest-reaper", "frost-monarch"];
for (const name of assetNames) {
  const png = fs.readFileSync(path.join(root, "assets", "nemesis", `${name}.png`));
  assert.equal(png.readUInt32BE(16), 512, `${name} width`);
  assert.equal(png.readUInt32BE(20), 512, `${name} height`);
}
```

- [ ] **Step 2: Run the test and verify missing assets fail**

Run: `node tests/nemesis-gallery.test.js`  
Expected: FAIL because `assets/nemesis/*.png` do not exist.

- [ ] **Step 3: Copy the verified crops from TinyDefense**

Copy the five stable filenames without modification. Compare SHA-256 between source and destination so the website cannot drift from the approved codex images.

- [ ] **Step 4: Run the asset test**

Run: `node tests/nemesis-gallery.test.js`  
Expected: asset assertions PASS; markup assertions added in Task 2 may still fail.

### Task 2: Native Gallery Markup and Styling

**Files:**
- Modify: `games/tiny-defense/index.html`
- Modify: `styles.css`
- Modify: `tests/nemesis-gallery.test.js`

**Interfaces:**
- Consumes: `/assets/nemesis/*.png` from Task 1.
- Produces: `#nemesis` navigation target, five `[data-nemesis-card]` buttons, and one `[data-nemesis-dialog]` detail surface.

- [ ] **Step 1: Add failing markup assertions**

```js
assert.equal((html.match(/data-nemesis-card/g) || []).length, 5);
assert.equal((html.match(/data-nemesis-dialog/g) || []).length, 1);
assert.match(html, /href="#nemesis"/);
for (const name of ["태고의 트롤", "개화의 폭군", "작열의 화신", "수확의 사신", "혹한의 군주"]) {
  assert.match(html, new RegExp(name));
}
```

- [ ] **Step 2: Run the test and verify markup fails**

Run: `node tests/nemesis-gallery.test.js`  
Expected: FAIL because the Korean game page has no Nemesis section.

- [ ] **Step 3: Add the navigation item and equal gallery section**

Add `네메시스` to the Korean primary navigation. Insert the gallery between the feature list and existing screenshot gallery. Use real `button` cards in the canonical five-boss order with root-relative image paths, display names, regions, summary tags, and per-boss data keys.

- [ ] **Step 4: Add one centered detail dialog**

Add a backdrop and dialog after the gallery section. Include reusable target elements for region, name, epithet, lore, traits, and image. Keep the six common combat records in static markup and include the 25/50/75/100-night response hint.

- [ ] **Step 5: Add responsive component styles**

Prefix new classes with `.nemesis-`. Match existing cream, brown, and accent-gold variables; use five equal desktop columns, two tablet columns, one mobile column, visible `:focus-visible`, a scrollable dialog, and reduced-motion overrides.

- [ ] **Step 6: Run static contracts**

Run: `node tests/nemesis-gallery.test.js`  
Expected: asset and markup assertions PASS; script assertions added in Task 3 may still fail.

### Task 3: Detail Interaction and Accessibility

**Files:**
- Modify: `script.js`
- Modify: `tests/nemesis-gallery.test.js`

**Interfaces:**
- Consumes: card `data-nemesis-card` keys and the single detail dialog targets from Task 2.
- Produces: `openNemesisDialog(card)` and `closeNemesisDialog()` behavior initialized only when the Korean gallery exists.

- [ ] **Step 1: Add failing interaction marker assertions**

```js
assert.match(script, /function openNemesisDialog/);
assert.match(script, /function closeNemesisDialog/);
assert.match(script, /event\.key === "Escape"/);
assert.match(script, /nemesisLastTrigger\.focus\(\)/);
assert.match(script, /document\.body\.classList\.add\("nemesis-dialog-open"\)/);
```

- [ ] **Step 2: Run the test and verify interaction markers fail**

Run: `node tests/nemesis-gallery.test.js`  
Expected: FAIL because the modal controller does not exist.

- [ ] **Step 3: Implement the immutable five-boss content map**

Add a frozen object keyed by the card values. Each entry contains `name`, `region`, `epithet`, `lore`, `traits`, and `image`. Use exactly the approved Korean strings and `/assets/nemesis/*.png` paths.

- [ ] **Step 4: Implement open and close flows**

On card click, save the trigger, populate all dialog targets, remove `hidden`, add the body lock class, and focus the close button. Close on close-button click, backdrop-only click, and `Escape`; restore `hidden`, body scrolling, and trigger focus.

- [ ] **Step 5: Run all static tests**

Run: `node tests/result-sfx.test.js`  
Expected: PASS with `result-sfx tier mapping ok`.  
Run: `node tests/nemesis-gallery.test.js`  
Expected: PASS with `nemesis gallery contract ok`.

- [ ] **Step 6: Commit the website implementation**

```text
git add games/tiny-defense/index.html styles.css script.js assets/nemesis tests/nemesis-gallery.test.js
git commit -m "feat: add Tiny Defense Nemesis gallery"
```

### Task 4: Browser Verification and Publication

**Files:**
- Verify only: `games/tiny-defense/index.html`

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: verified desktop/mobile behavior and the published GitHub Pages source commit.

- [ ] **Step 1: Serve the website locally**

Run a local static server from `C:/OneStep/onestep-games.github.io` and open `/games/tiny-defense/`.

- [ ] **Step 2: Verify desktop and mobile layouts**

At 1440×1000 confirm five equal cards, no overlap with existing sections, correct navigation anchor, and correct images. At 390×844 confirm single-column cards, scrollable detail content, and no horizontal overflow.

- [ ] **Step 3: Verify all interactions**

Open each boss, compare image/name/lore, close via button, backdrop, and `Escape`, verify focus return, and confirm the existing screenshot carousel and mobile menu still work.

- [ ] **Step 4: Re-run tests and inspect the final diff**

Run: `node tests/result-sfx.test.js` and `node tests/nemesis-gallery.test.js`.  
Expected: both PASS. Run `git diff --check` and confirm only planned files changed.

- [ ] **Step 5: Push the verified website commit**

Run: `git push origin main`  
Expected: the current `main` commit updates `origin/main`, allowing the existing GitHub Pages workflow to publish the change.
