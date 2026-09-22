const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root,'assets/world/story.json'),'utf8'));
const ids = ['prologue','supplies','ring','troll','spring','summer','autumn','winter','home'];

test('Chapter 1 has all nine ordered spreads and the same speakers in every site language', () => {
  for (const lang of ['ko','en','ja']) {
    assert.deepEqual(data[lang].pages.map(p=>p.id),ids);
    assert.deepEqual(data[lang].pages.map(p=>p.lines.map(l=>l.speaker)),data.ko.pages.map(p=>p.lines.map(l=>l.speaker)));
    for (const page of data[lang].pages) {
      assert.ok(page.title.trim());
      assert.ok(fs.statSync(path.join(root,`assets/world/${page.art}.webp`)).size>1000);
      for (const line of page.lines) assert.ok(line.text.trim());
    }
  }
  assert.equal(data.ko.pages[1].lines.length,5,'include the two latest supplies lines from the game');
  assert.equal(data.ko.pages.at(-1).lines[2].text,'오늘은 쉬어도 된단다.');
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
  for (const file of ['day','story','book-open','book-close','page-1','page-2','page-3']) {
    assert.ok(fs.statSync(path.join(root,`assets/world/audio/${file}.mp3`)).size>1000);
  }
  for (const lang of ['','en/','ja/']) {
    const html=fs.readFileSync(path.join(root,lang,'index.html'),'utf8');
    assert.doesNotMatch(html,/<audio[^>]*autoplay/);
    assert.match(html,/incompetech\.com/);
    assert.match(html,/creativecommons\.org\/licenses\/by\/4\.0/);
  }
});
