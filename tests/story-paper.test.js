const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { hasArt, splitLines, paperTransform } = require('../book-turn.js');
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

test('compositor transforms start and settle at the correct page edge', () => {
  assert.equal(paperTransform(0, 1), 'rotateY(0deg) skewY(0deg)');
  assert.match(paperTransform(1, 1), /^rotateY\(-180deg\)/);
  assert.match(paperTransform(1, -1), /^rotateY\(180deg\)/);
  assert.match(paperTransform(.5, 1), /skewY\(1.6deg\)/);
  assert.equal(paperTransform(-1,1),paperTransform(0,1));
  assert.equal(paperTransform(2,1),paperTransform(1,1));
});
