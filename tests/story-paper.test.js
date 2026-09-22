const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { hasArt, splitLines, geometry } = require('../book-turn.js');
const stories = require('../assets/world/story.json');

test('each illustration appears once, and text fills both leaves without dropping dialogue', () => {
  for (const [lang, story] of Object.entries(stories)) {
    const illustrated = story.pages.filter((_, i) => hasArt(story.pages, i));
    assert.equal(illustrated.length, 10);
    assert.equal(new Set(illustrated.map(p => p.art)).size, 10);
    for (const [i, page] of story.pages.entries()) {
      if (hasArt(story.pages, i)) continue;
      const split = splitLines(page.lines);
      assert.ok(split > 0 && split < page.lines.length, `${lang}/${page.id}: both leaves contain dialogue`);
      assert.deepEqual([...page.lines.slice(0, split), ...page.lines.slice(split)], page.lines);
    }
    const html = fs.readFileSync(`${lang === 'ko' ? '' : lang + '/'}story/index.html`, 'utf8');
    assert.equal((html.match(/<img /g) || []).length, 10);
    assert.equal((html.match(/class="text-only"/g) || []).length, 9);
  }
});

test('paper settles flat at both ends and bends smoothly during a turn', () => {
  assert.deepEqual(geometry(0), {angle:0, step:0});
  assert.equal(geometry(1).angle, 180);
  assert.ok(Math.abs(geometry(1).step) < 1e-10);
  assert.ok(geometry(.5).step > 0);
  for (let t=0; t<=1; t+=.01) {
    const value=geometry(t);
    assert.ok(Number.isFinite(value.angle) && value.step >= 0);
  }
});
