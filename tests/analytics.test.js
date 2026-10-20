const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'analytics.js'), 'utf8');

function setup(route, host = 'onestep-games.com', lang = 'ko', disabled = false) {
  const url = new URL(route, 'https://' + host);
  const listeners = {}, scripts = [];
  const window = {};
  const measurementId = source.match(/const measurementId = "([^"]+)"/)[1];
  if (disabled) window['ga-disable-' + measurementId] = true;
  const document = {
    documentElement: { lang }, referrer: 'https://example.com/post?private=value#secret',
    head: { appendChild: tag => scripts.push(tag) }, createElement: () => ({}),
    addEventListener: (name, fn) => { listeners[name] = fn; },
  };
  const context = {window, document, location: url, URL, Set, Date};
  const run = () => vm.runInNewContext(source, context);
  run();
  function click(href, ancestors = [], type = 'click', button = 0, card = false) {
    const link = {href, dataset: {}, closest: selector => ancestors.includes(selector), matches: selector => card && selector === '.game-card'};
    listeners[type]?.({type, button, target:{closest: selector => selector === 'a[href]' ? link : null}});
  }
  const calls = () => (window.dataLayer || []).map(args => Array.from(args));
  return {window, scripts, click, calls, run};
}

for (const [prefix, lang] of [['', 'ko'], ['en/', 'en'], ['ja/', 'ja']]) {
  for (const [route, game, type] of [
    ['', 'studio', 'home'], ['games/tiny-defense/', 'tiny-defense', 'game'],
    ['games/amhaeng-eosa/', 'amhaeng-eosa', 'game'], ['story/', 'tiny-defense', 'story'],
  ]) {
    const env = setup('/' + prefix + route + '?email=private&utm_source=youtube#secret', undefined, lang);
    assert.equal(env.scripts.length, 1);
    const config = env.calls().find(call => call[0] === 'config')[2];
    assert.equal(config.game_id, game);
    assert.equal(config.page_type, type);
    assert.equal(config.site_language, lang);
    assert.equal(config.page_referrer, 'https://example.com/post');
    assert.equal(new URL(config.page_location).search, '?utm_source=youtube');
    env.run();
    assert.equal(env.scripts.length, 1, 'repeated includes do not double-count pageviews');
  }
}

const env = setup('/games/tiny-defense/');
for (const [href, store] of [
  ['https://play.google.com/store/apps/details?id=com.onestep.tinydefense', 'google_play'],
  ['https://apps.apple.com/app/id6785383234', 'app_store'],
  ['https://m.onestore.co.kr/v2/ko-kr/app/0001007324', 'onestore'],
]) {
  for (const [ancestor, position] of [['.brand-hero','hero'], ['[data-map-dialog]','courtyard_popup'], ['#stores','store_section']]) {
    env.click(href, [ancestor]);
    const call = env.calls().at(-1);
    assert.equal(call[1], 'store_click');
    assert.equal(call[2].game_id, 'tiny-defense');
    assert.equal(call[2].store, store);
    assert.equal(call[2].link_position, position);
  }
}
const before = env.calls().length;
env.click('https://play.google.com.evil.example/');
env.click('/games/tiny-defense/#stores');
env.click('https://apps.apple.com/app/id6785383234', [], 'click', 1);
env.click('https://apps.apple.com/app/id6785383234', [], 'auxclick', 2);
assert.equal(env.calls().length, before, 'non-store links, synthetic middle clicks and right clicks are ignored');
env.click('https://apps.apple.com/app/id6785383234', [], 'auxclick', 1);
assert.equal(env.calls().length, before + 1, 'middle-click records once without blocking navigation');

const home = setup('/ja/');
home.click('/ja/games/amhaeng-eosa/', ['.game-library'], 'click', 0, true);
assert.equal(home.calls().at(-1)[1], 'game_select');
assert.equal(home.calls().at(-1)[2].game_id, 'amhaeng-eosa');
assert.equal(home.calls().at(-1)[2].link_position, 'game_list');
assert.equal(setup('/games/tiny-defense/play/').calls().at(-1)[2].page_type, 'demo');
for (const host of ['localhost', '127.0.0.1', 'jone.tail27e46d.ts.net', 'onestep-games.com.evil.example']) {
  assert.equal(setup('/', host).scripts.length, 0, 'preview and unrelated hosts never load GA');
}
assert.equal(setup('/', undefined, 'ko', true).scripts.length, 0, 'explicit GA opt-out is respected');

const pages = ['index.html','404.html','games/tiny-defense/play/index.html'];
for (const prefix of ['', 'en/', 'ja/']) {
  for (const route of ['index.html', 'games/tiny-defense/index.html', 'games/amhaeng-eosa/index.html', 'story/index.html']) {
    if (!pages.includes(prefix + route)) pages.push(prefix + route);
  }
}
for (const file of pages) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert.equal((html.match(/src="\/analytics\.js\?v=1"/g) || []).length, 1, file + ' includes analytics once');
}
console.log('Analytics passed: 14 pages, 3 locales, game/store/position events, middle-click, URL filtering and preview exclusion.');
