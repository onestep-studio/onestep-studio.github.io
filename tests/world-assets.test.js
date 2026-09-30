const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root,'assets/world/story.json'),'utf8'));
const ids = ['prologue','morning','v2.smallhands','v2.light','v2.ring','v2.springstone',
  'v2.springmemory','v2.summerstone','v2.firsthero','v2.autumnstone','v2.sword',
  'v2.winterstone','v2.mars','v2.rift','v2.echo','v2.after','v2.face','v2.rewind','v2.path','v2.together'];

test('revised memories retain all five books, dialogue, speakers and art transitions', () => {
  for (const lang of ['ko','en','ja']) {
    const story=data[lang];
    assert.deepEqual([...new Set(story.pages.filter(p=>p.kind!=='interlude').map(p=>p.sourceId))],ids);
    assert.equal(story.pages.length,39);
    assert.equal(story.previewCount,9);
    assert.equal(story.pages.reduce((n,p)=>n+p.lines.length,0),132);
    assert.equal(Object.keys(story.books).length,5);
    assert.equal(new Set(story.pages.map(p=>p.art)).size,33);
    assert.equal(new Set(story.pages.map(p=>p.id)).size,39);
    assert.deepEqual(story.pages.map(p=>p.lines.map(l=>l.speaker)),data.ko.pages.map(p=>p.lines.map(l=>l.speaker)));
    for (const page of story.pages) {
      assert.ok(page.title.trim());
      assert.ok(fs.statSync(path.join(root,`assets/world/${page.art}.webp`)).size>1000);
      assert.ok(!page.before && !page.after,'legacy cinematic prose must not reveal the new twist');
      for (const line of page.lines) {
        assert.ok(line.text.trim());
        if(line.speaker) assert.ok(story.speakers[line.speaker]);
      }
    }
    const scene=id=>story.pages.filter(p=>p.sourceId===id);
    assert.ok(!story.pages.some(p=>p.id==='interlude.duel'||p.id==='rewind.prologue.talk2'));
    assert.deepEqual(story.pages.filter(p=>['rewind.prologue.3','rewind.prologue.4'].includes(p.id)).map(p=>p.art),['revised_last_sword_break','revised_last_sword_break']);
    assert.equal(story.pages.find(p=>p.id==='interlude.gather').art,'interlude_gather_forest');
    assert.equal(story.pages.find(p=>p.id==='interlude.gather').visual,'illustration');
    assert.equal(scene('morning')[0].lines.length,9);
    assert.deepEqual(scene('v2.light').map(p=>[p.lineStart,p.lines.length,p.art]),[
      [0,5,'revised_spirit_meeting'],[5,4,'revised_small_light']
    ]);
    assert.equal(scene('v2.springmemory')[0].lines.length,6);
    assert.equal(scene('v2.autumnstone')[0].lines.length,8);
    assert.deepEqual(scene('v2.ring').map(p=>p.lineStart),[0,1]);
    assert.deepEqual(scene('v2.firsthero').map(p=>p.lineStart),[0,3,5,9]);
    assert.deepEqual(scene('v2.rewind').map(p=>p.lineStart),[0,4,6,7]);
    assert.deepEqual(scene('v2.after').map(p=>p.art),['revised_last_defeat','revised_guardian_return']);
    assert.deepEqual(story.pages.filter(p=>p.id==='rewind.prologue.talk1'||p.id==='rewind.prologue.talk2').map(p=>p.lines.map(l=>l.speaker)),[[9,6,9,6]]);
  }
  assert.equal(data.ko.speakers[1],'폰');
  assert.equal(data.ko.speakers[5],'수호정령');
  assert.equal(data.ko.speakers[6],'기사');
  assert.equal(data.ko.speakers[7],'미래의 폰');
});

test('all local homepage/story references exist, including the no-JavaScript reading route', () => {
  for (const lang of ['ko','en','ja']) {
    const base = lang==='ko' ? '' : lang+'/';
    for (const page of [`${base}index.html`,`${base}games/tiny-defense/index.html`,`${base}story/index.html`]) {
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
    const html=fs.readFileSync(path.join(root,lang,'games/tiny-defense/index.html'),'utf8');
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
    const html=fs.readFileSync(path.join(root,lang,'games/tiny-defense/index.html'),'utf8');
    assert.match(html,/Crossing the Chasm/);
    assert.match(html,/USUAN1700026/);
    assert.doesNotMatch(html,/courtyard-(?:day|night)\.webp/);
  }
});

test('legacy narration and read permissions cannot leak the revised reveal', () => {
  const narration = require('../assets/world/story-narration.json');
  const runtime=fs.readFileSync(path.join(root,'world.js'),'utf8');
  for (const lang of ['ko','en','ja']) assert.deepEqual(narration[lang],{});
  assert.match(runtime,/tiny-defense-storybook-rewind-v2/);
  assert.doesNotMatch(runtime,/tiny-defense-storybook-v1/);
  assert.match(runtime,/story\.speakers\[String\(line\.speaker\)\]/);
  for (const page of data.ko.pages.slice(0,data.ko.previewCount)) {
    assert.doesNotMatch(page.lines.map(l=>l.text).join(' '),/미래의 폰|대회귀|기억을 봉인/);
  }
});

test('Korean story contains no accidentally pasted Japanese prose', () => {
  const narration = require('../assets/world/story-narration.json');
  assert.doesNotMatch(JSON.stringify(data.ko), /[\u3040-\u30ff]/);
  assert.doesNotMatch(JSON.stringify(narration.ko), /[\u3040-\u30ff]/);
  assert.doesNotMatch(fs.readFileSync(path.join(root,'story/index.html'),'utf8'), /[\u3040-\u30ff]/);
});


test('speaker prefixes are separated throughout all localized story pages', () => {
  for (const [lang,story] of Object.entries(data)) {
    for (const page of story.pages) for (const line of page.lines) {
      for (const row of line.text.split('\n')) for (const name of Object.values(story.speakers)) {
        assert.ok(!row.trimStart().startsWith(name+':') && !row.trimStart().startsWith(name+'：'), `${lang}/${page.id}: inline speaker`);
      }
    }
    const warning=story.pages.find(p=>p.id==='rewind.prologue.2');
    assert.deepEqual(warning.lines.map(l=>l.speaker),[8,6]);
    assert.equal(story.pages.find(p=>p.id==='rewind.prologue.3').lines[0].speaker,6);
  }
  assert.match(data.en.pages.find(p=>p.id==='v2.autumnstone').lines[0].text,/knights: Mars/);
});


test('gameplay interludes preserve ordering, translations and original dialogue', () => {
  const interludes=require('../assets/world/story-interludes.json');
  for (const story of Object.values(data)) {
    assert.equal(story.pages.filter(p=>p.kind==='interlude').length,2);
    assert.equal(story.pages.filter(p=>p.kind!=='interlude').reduce((n,p)=>n+p.lines.length,0),128);
    for (const entry of interludes) {
      const index=story.pages.findIndex(p=>p.id===entry.id);
      assert.equal(story.pages[index+1].id,entry.before);
      assert.equal(story.pages[index].visual,entry.visual);
      assert.ok(story.pages[index].lines.every(l=>l.speaker===0));
    }
    assert.equal(story.pages[story.previewCount-1].id,'v2.smallhands');
  }
  for(const name of ['anvil','hammer','ring']) assert.equal(fs.readFileSync(path.join(root,`assets/world/interlude-${name}.webp`)).toString('ascii',8,12),'WEBP');
});

test('story revisions keep fetched text, illustrations and spoiler consent in the same edition', () => {
  const runtime=fs.readFileSync(path.join(root,'world.js'),'utf8');
  assert.match(runtime,/world\.dataset\.storyRevision/);
  assert.match(runtime,/saved\.revision === story\.revision/);
  assert.doesNotMatch(runtime,/v=rewind-[1-4][`']/);
  for (const [lang,story] of Object.entries(data)) {
    assert.match(story.revision,/^rewind-[a-f0-9]{12}$/);
    assert.equal(story.revision,data.ko.revision);
    const prefix=lang==='ko'?'':lang+'/';
    const game=fs.readFileSync(path.join(root,`${prefix}games/tiny-defense/index.html`),'utf8');
    assert.ok(game.includes(`data-story-revision="${story.revision}"`));
    const text=fs.readFileSync(path.join(root,`${prefix}story/index.html`),'utf8');
    for (const page of story.pages) assert.ok(text.includes(`/assets/world/${page.art}.webp?v=${story.revision}`));
  }
  assert.equal(data.ko.pages.find(p=>p.id==='rewind.prologue.4').lines[0].text,'시야가 서서히 흐려졌다.');
  assert.equal(data.ko.pages.find(p=>p.id==='rewind.prologue.5').lines[0].text,'흐릿한 청록빛이 어둠 속에서 번졌다.');
});
