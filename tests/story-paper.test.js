const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { hasArt, splitLines, paperTransform } = require('../book-turn.js');
const stories = require('../assets/world/story.json');

test('revisited illustrations remain visible in the revised text edition', () => {
  for (const [lang, story] of Object.entries(stories)) {
    const html = fs.readFileSync(`${lang === 'ko' ? '' : lang + '/'}story/index.html`, 'utf8');
    assert.equal((html.match(/<img /g) || []).length, story.pages.length);
    assert.equal((html.match(/class="text-only"/g) || []).length, 0);
    for (const page of story.pages) {
      for (const line of page.lines) {
        const escaped=line.text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');
        assert.ok(html.replace(/\r\n/g, '\n').includes(escaped), `${lang}/${page.id}: missing dialogue`);
      }
    }
  }
});

test('recurring art becomes text-only even when separated by another illustration', () => {
  const pages = [{art:'seal'}, {art:'castle'}, {art:'seal'}];
  assert.deepEqual(pages.map((_,i)=>hasArt(pages,i)),[true,true,false]);
  const lines = [{speaker:1,text:'첫 문단'}, {speaker:2,text:'다음 문단'}, {speaker:1,text:'마지막 문단'}];
  const split=splitLines(lines);
  assert.ok(split>0 && split<lines.length);
  assert.deepEqual([...lines.slice(0,split),...lines.slice(split)],lines);
});

test('compositor transforms start and settle at the correct page edge', () => {
  assert.equal(paperTransform(0, 1), 'rotateY(0deg) skewY(0deg)');
  assert.match(paperTransform(1, 1), /^rotateY\(-180deg\)/);
  assert.match(paperTransform(1, -1), /^rotateY\(180deg\)/);
  assert.match(paperTransform(.5, 1), /skewY\(1.6deg\)/);
  assert.equal(paperTransform(-1,1),paperTransform(0,1));
  assert.equal(paperTransform(2,1),paperTransform(1,1));
});
