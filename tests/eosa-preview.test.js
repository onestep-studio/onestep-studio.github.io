const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

class Element {
  constructor() { this.hidden = false; this.attrs = {}; this.events = {}; this.textContent = ''; this.style = {setProperty() {}}; }
  setAttribute(key, value) { this.attrs[key] = value; }
  addEventListener(key, fn) { this.events[key] = fn; }
  click() { return this.events.click(); }
  focus() { this.focused = true; }
}
function setup(copy) {
  const nodes = new Map();
  for (const name of ['scene-image','scene-name','note-title','note-body','note-image','note-count','note-hint','reset','music','sound','sound-message']) nodes.set(`[data-${name}]`, new Element());
  const locations = copy.locations.map(() => new Element());
  const spots = [new Element(), new Element()];
  nodes.get('[data-sound]').querySelector = () => new Element();
  const music = nodes.get('[data-music]');
  music.paused = true;
  music.play = async () => { music.paused = false; music.events.play(); };
  music.pause = () => { music.paused = true; music.events.pause(); };
  const doc = {hidden:false,events:{},getElementById:() => ({textContent:JSON.stringify(copy)}),querySelector:s=>nodes.get(s),querySelectorAll:s=>s==='[data-location]'?locations:spots,addEventListener(type,fn){this.events[type]=fn;}};
  const win = {addEventListener(){}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'games/amhaeng-eosa/eosa.js'),'utf8'), {document:doc,window:win});
  return {nodes,locations,spots,music,doc};
}

(async () => {
 const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
 const sitemapUrls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(x=>x[1]);
 assert.equal(new Set(sitemapUrls).size,sitemapUrls.length,'page regeneration must not duplicate sitemap routes');
 for (const prefix of ['', 'en/', 'ja/']) assert.ok(sitemapUrls.includes('https://onestep-studio.github.io/'+prefix+'games/amhaeng-eosa/'));
 for (const prefix of ['', 'en/', 'ja/']) {
  const source = fs.readFileSync(path.join(root,prefix,'games/amhaeng-eosa/index.html'),'utf8');
  const copy = JSON.parse(source.match(/id="eosa-content">(.*?)<\/script>/s)[1]);
  const {nodes,locations,spots,music,doc} = setup(copy);
  assert.equal(music.paused,true,'visiting a page does not start music');
  for (let i=0;i<3;i++) {
   locations[i].click();
   assert.equal(nodes.get('[data-scene-name]').textContent,copy.locations[i].name);
   for (let j=0;j<2;j++) {
    spots[j].click();
    assert.equal(nodes.get('[data-note-title]').textContent,copy.locations[i].spots[j].name);
    assert.equal(nodes.get('[data-note-image]').hidden,false);
   }
  }
  spots[1].click();
  assert.equal(nodes.get('[data-note-count]').textContent,copy.progress+' 6 / 6','repeat visits do not inflate the count');
  nodes.get('[data-reset]').click();
  assert.equal(nodes.get('[data-note-count]').textContent,copy.progress+' 0 / 6');
  assert.equal(locations[0].focused,true,'reset returns focus to a visible control');
  assert.equal(nodes.get('[data-note-image]').hidden,true,'reset hides the previous evidence');
  nodes.get('[data-sound]').click();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(music.paused,false);
  doc.hidden=true;doc.events.visibilitychange();
  assert.equal(music.paused,true,'backgrounding silences the preview');
  doc.hidden=false;doc.events.visibilitychange();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(music.paused,false,'returning resumes music only after the visitor opted in');
  nodes.get('[data-sound]').click();
  assert.equal(music.paused,true);
  const home=fs.readFileSync(path.join(root,prefix,'index.html'),'utf8');
  assert.match(home,new RegExp('href="/'+prefix+'games/amhaeng-eosa/"'));
  const schema=JSON.parse(home.match(/type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(schema['@graph'].find(x=>x['@type']==='ItemList').numberOfItems,2);
  const stores=source.match(/<ul class="eosa-store-list".*?<\/ul>/s)[0];
  assert.doesNotMatch(stores,/<a\b/,'unreleased stores have no false purchase links');
  for (const clue of copy.locations.flatMap(x=>x.spots)) assert.ok(fs.existsSync(path.join(root,'assets/amhaeng-eosa',clue.image+'.webp')));
 }
 console.log('Eosa preview: three locales, six clues, reset, music opt-in and background behavior passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
