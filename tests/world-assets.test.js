const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root,'assets/world/story.json'),'utf8'));
const ids = ['prologue','supplies','ring','troll','spring','summer','autumn','winter','home',
  'ch2.return','ch2.rift','ch2.heroes','ch2.castle','ch2.seal',
  'ch3.master','ch3.glory','ch3.breach','ch3.sword','ch3.watch'];

test('all three chapters retain scene order, dedicated art and translated dialogue', () => {
  for (const lang of ['ko','en','ja']) {
    assert.deepEqual(data[lang].pages.map(p=>p.id),ids);
    assert.deepEqual(data[lang].pages.map(p=>p.chapter),[...Array(9).fill(1),...Array(5).fill(2),...Array(5).fill(3)]);
    assert.deepEqual(data[lang].pages.slice(1,9).map(p=>p.art),ids.slice(1,9));
    assert.deepEqual(data[lang].pages.map(p=>p.lines.map(l=>l.speaker)),data.ko.pages.map(p=>p.lines.map(l=>l.speaker)));
    for (const page of data[lang].pages) {
      assert.ok(page.title.trim());
      assert.ok(fs.statSync(path.join(root,`assets/world/${page.art}.webp`)).size>1000);
      for (const line of page.lines) assert.ok(line.text.trim());
    }
  }
  assert.equal(data.ko.pages[1].lines.length,5,'include the two latest supplies lines from the game');
  assert.equal(data.ko.pages[8].lines[2].text,'오늘은 쉬어도 된단다.');
  assert.deepEqual(data.ko.pages[2].lines.map(l=>l.speaker),[1,2,1,2,2]);
  assert.equal(data.ko.pages.at(-1).lines[2].text,'그래. 네게 검 한 자루와 끝없는 밤만 물려줄 수는 없지. 내일도 함께 성문을 열자꾸나.');
});

test('all local homepage/story references exist, including the no-JavaScript reading route', () => {
  for (const lang of ['ko','en','ja']) {
    const base = lang==='ko' ? '' : lang+'/';
    for (const page of [`${base}index.html`,`${base}story/index.html`]) {
      const html=fs.readFileSync(path.join(root,page),'utf8');
      for (const [,url] of html.matchAll(/(?:src|href)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
        let target=path.join(root,url);
        if (url.endsWith('/')) target=path.join(target,'index.html');
        assert.ok(fs.existsSync(target),`${page}: missing ${url}`);
      }
    }
    const text=fs.readFileSync(path.join(root,`${base}story/index.html`),'utf8');
    for (const page of data[lang].pages) assert.ok(text.includes(page.title));
  }
});

test('every authored audio source exists and no homepage starts audible media automatically', () => {
  for (const file of ['night','story','book-open','book-close','page-1','page-2','page-3']) {
    assert.ok(fs.statSync(path.join(root,`assets/world/audio/${file}.mp3`)).size>1000);
  }
  for (const lang of ['','en/','ja/']) {
    const html=fs.readFileSync(path.join(root,lang,'index.html'),'utf8');
    assert.doesNotMatch(html,/<audio[^>]*autoplay/);
    assert.match(html,/incompetech\.com/);
    assert.match(html,/creativecommons\.org\/licenses\/by\/4\.0/);
  }
});

test('courtyard day uses the game lobby track and night uses the current battle track', () => {
  const script=fs.readFileSync(path.join(root,'world.js'),'utf8');
  assert.match(script,/day:'\/assets\/audio\/lobby-theme\.mp3'/);
  assert.match(script,/night:'\/assets\/world\/audio\/night\.mp3'/);
  for (const lang of ['','en/','ja/']) {
    const html=fs.readFileSync(path.join(root,lang,'index.html'),'utf8');
    assert.match(html,/Crossing the Chasm/);
    assert.match(html,/USUAN1700026/);
    assert.doesNotMatch(html,/courtyard-(?:day|night)\.webp/);
  }
});
