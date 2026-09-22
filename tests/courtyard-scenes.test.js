const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const cast = require('../assets/world/cast/manifest.json');
const dialogue = require('../assets/world/cast/dialogue.json');

test('courtyard vignettes limit the cast to one resident or a pair of heroes', () => {
  for (const lang of ['ko', 'en', 'ja']) {
    const html = fs.readFileSync(path.join(root, `${lang === 'ko' ? '' : lang + '/'}games/tiny-defense/index.html`), 'utf8');
    const scenes = new Map();
    const ids = [];
    for (const [, id, scene] of html.matchAll(/data-character="([^"]+)" data-scene="(\d+)"/g)) {
      ids.push(id);
      scenes.set(scene, [...(scenes.get(scene) || []), id]);
    }
    assert.deepEqual(ids.slice().sort(), cast.map(actor => actor.id).sort());
    assert.equal(scenes.size, 6);
    for (const members of scenes.values()) {
      assert.ok(members.length <= 2);
      if (members.some(id => ['pawn', 'boy', 'girl'].includes(id))) assert.equal(members.length, 1);
    }
    for (const actor of cast) {
      assert.ok(html.includes(dialogue[lang][actor.id].replaceAll("'", '&#x27;')));
      assert.ok(fs.existsSync(path.join(root, `assets/world/cast/${actor.id}-idle.webp`)));
    }
  }
  assert.doesNotMatch(JSON.stringify(dialogue.ko), /[\u3040-\u30ff]/);
});
