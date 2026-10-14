const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

test('game pages open with the adopted brand hero above the courtyard', () => {
  for (const base of ['', 'en/', 'ja/']) {
    const html = fs.readFileSync(path.join(root, base, 'games/tiny-defense/index.html'), 'utf8');
    const hero = html.match(/<section class="brand-hero"[\s\S]*?<\/section>/)?.[0];
    assert.ok(hero, `${base}: missing brand hero`);
    assert.ok(html.indexOf('class="brand-hero"') < html.indexOf('class="world"'), `${base}: hero must precede the courtyard`);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${base}: exactly one h1`);
    assert.match(hero, /<h1 id="brand-title"><img [^>]*alt="Tiny Defense"/);
    for (const host of ['play.google.com', 'apps.apple.com', 'm.onestore.co.kr']) assert.ok(hero.includes(host), `${base}: ${host}`);
    assert.match(hero, /href="#top"/);
    assert.match(html, /\/brand-hero\.css\?v=brand-\d+/);
    for (const [, url] of hero.matchAll(/(?:src|srcset)="([^"]+)"/g))
      for (const part of url.split(',')) assert.ok(fs.existsSync(path.join(root, part.trim().split(' ')[0])), `${base}: missing ${part}`);
  }
});
