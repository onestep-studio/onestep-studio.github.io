const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

test('map panels preserve all ten localized game descriptions and defer media loading', () => {
  for (const base of ['', 'en/', 'ja/']) {
    const home = fs.readFileSync(path.join(root, base, 'index.html'), 'utf8');
    const source = fs.readFileSync(path.join(root, base, 'games/tiny-defense/index.html'), 'utf8');
    const original = [...source.matchAll(/<li class="daynight-item">([\s\S]*?)<\/li>/g)];
    const guides = [...home.matchAll(/<template data-map-template="(?:day|night)"[\s\S]*?<\/template>/g)].map(m => m[0]).join('');
    assert.equal(original.length, 10);
    assert.equal((guides.match(/data-guide-scene/g) || []).length, 10);
    for (const [,row] of original) {
      assert.ok(guides.includes(row.match(/<h3>.*?<\/h3>/)[0]));
      assert.ok(guides.includes(row.match(/<p>.*?<\/p>/)[0]));
    }
    assert.doesNotMatch(guides, /<video[^>]*\ssrc=/);
    for (const [,url] of guides.matchAll(/(?:poster|data-src)="([^"]+)"/g)) {
      assert.ok(fs.existsSync(path.join(root,url)), `${base}: missing ${url}`);
    }
    for (const kind of ['day','night','stores','game']) assert.match(home,new RegExp(`data-map-open="${kind}"`));
    assert.equal((home.match(/data-resume-story/g) || []).length, 1);
    assert.doesNotMatch(home, /data-map-open="[^"]+" data-map-open=/);
    const store=home.match(/<template data-map-template="stores"[\s\S]*?<\/template>/)[0];
    for (const host of ['play.google.com','apps.apple.com','m.onestore.co.kr']) assert.ok(store.includes(host));
    assert.match(home, /<iframe[^>]+data-src="\/games\/tiny-defense\/play\//);
  }
});
