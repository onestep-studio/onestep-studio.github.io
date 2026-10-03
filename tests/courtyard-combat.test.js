const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Encounter } = require('../courtyard-combat.js');
const manifest = require('../assets/world/combat/manifest.json');
const root = path.resolve(__dirname,'..');
const advance = (model, seconds) => { for(let i=0;i<Math.ceil(seconds*60);i++) model.tick(1/60); };

test('each raid enters through the gate with exactly one hero and three monsters', () => {
  const model = new Encounter(manifest);
  advance(model,1); assert.equal(model.units.length,0);
  advance(model,1); assert.equal(model.units.length,4);
  assert.equal(model.units.filter(unit=>unit.def.hero).length,1);
  assert.ok(model.units.slice(1).every(unit=>unit.y<548));
  advance(model,3.8); assert.equal(model.phase,'fighting');
  assert.ok(model.units.every(unit=>unit.delay<=0));
});

test('damage and effects land exactly once at the game contact frame', () => {
  const model = new Encounter(manifest); model.start(); model.phase='fighting';
  const hero = model.hero, target = model.units[1];
  hero.x=850; hero.y=668; target.x=919; target.y=647;
  model.units.slice(1).forEach(unit=>{unit.delay=0;unit.cooldown=10;});
  model.attack(hero,target);
  advance(model,.15); assert.equal(target.hp,55); assert.equal(model.hits,0);
  model.tick(1/60); assert.equal(target.hp,19); assert.equal(model.hits,1);
  assert.deepEqual(model.effects.map(effect=>effect.type),['hit','number','slash']);
  advance(model,.1); assert.equal(target.hp,19); assert.equal(model.hits,1);
});

test('monsters retaliate, hero clears the raid, returns home and another wave follows a quiet interval', () => {
  const model = new Encounter(manifest);
  advance(model,6.8);
  assert.ok(model.hero.hp<manifest.actors.guardian.hp,'monster contact must hurt the hero');
  advance(model,5);
  assert.ok(model.phase==='waiting' || model.phase==='returning');
  assert.ok(model.hero.hp>0); assert.equal(model.wave,1);
  advance(model,9); assert.equal(model.wave,1);
  advance(model,8); assert.equal(model.wave,2); assert.equal(model.units.length,4);
  model.reset(); assert.equal(model.phase,'waiting'); assert.equal(model.units.length,0); assert.equal(model.hits,0);
});

test('all localized routes load the combat script and staging includes it', () => {
  for(const prefix of ['','en/','ja/']) {
    const html=fs.readFileSync(path.join(root,prefix+'games/tiny-defense/index.html'),'utf8');
    assert.equal((html.match(/src="\/courtyard-combat\.js\?v=combat-1"/g)||[]).length,1,'load one encounter renderer per page');
    assert.match(html,/href="\/world\.css\?v=world-\d+"/);
  }
  assert.match(fs.readFileSync(path.join(root,'tools/build-static.py'),'utf8'),/'courtyard-combat\.js'/);
  for(const actor of Object.values(manifest.actors)) {
    for(const state of Object.values(actor.states)) {
      const image=fs.readFileSync(path.join(root,'assets/world/combat',state.file));
      assert.equal(image.readUInt32BE(16),state.cell*state.frames);
      assert.equal(image.readUInt32BE(20),state.cell);
    }
  }
});
