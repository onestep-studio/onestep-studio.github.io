const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

test('map panels preserve all ten localized game descriptions and defer media loading', () => {
  for (const base of ['', 'en/', 'ja/']) {
    const home = fs.readFileSync(path.join(root, base, 'games/tiny-defense/index.html'), 'utf8');
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
const vm = require('node:vm');

test('map interception preserves language navigation and new-tab links', () => {
  const handlers = {};
  const leaf = { addEventListener() {}, querySelectorAll: () => [] };
  const dialog = { ...leaf, querySelector: () => leaf };
  const document = {
    querySelector: selector => selector === '[data-map-dialog]' ? dialog : null,
    addEventListener: (type, fn) => { handlers[type] = fn; },
    body: { classList: { add() {} } }
  };
  vm.runInNewContext(fs.readFileSync(path.join(root,'map-panels.js'),'utf8'), {
    document, window: { addEventListener() {} }, URL,
    matchMedia: () => ({matches:true}),
    location: { origin:'https://example.test', pathname:'/games/tiny-defense/', href:'https://example.test/games/tiny-defense/', hash:'' }
  });
  function click(href, opts={}) {
    let prevented = false;
    const link = {
      href, dataset:opts.kind ? {mapOpen:opts.kind} : {},
      closest: selector => selector === '.language-switcher' && opts.language ? {} : null,
      hasAttribute: name => name === 'target' && !!opts.target
    };
    handlers.click({target:{closest:()=>link},preventDefault(){prevented=true;},ctrlKey:opts.ctrl});
    return prevented;
  }
  assert.equal(click('https://example.test/en/games/tiny-defense/',{language:true}),false);
  assert.equal(click('https://example.test/games/tiny-defense/',{language:true}),false);
  assert.equal(click('https://example.test/games/tiny-defense/#stores',{target:true}),false);
  assert.equal(click('https://example.test/games/tiny-defense/#stores',{ctrl:true}),false);
  assert.equal(click('https://example.test/games/tiny-defense/#stores'),true);
  assert.equal(click('https://example.test/games/tiny-defense/#features'),true);
  assert.equal(click('https://example.test/ja/games/tiny-defense/#stores'),false);
});
