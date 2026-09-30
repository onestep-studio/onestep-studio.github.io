/* Usage: node tools/verify-courtyard-life.cjs [path-to-installed-jsdom] */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { JSDOM } = require(process.argv[2] ? path.resolve(process.argv[2]) : 'jsdom');
const root = path.resolve(__dirname, '..');
const stories = JSON.parse(fs.readFileSync(path.join(root, 'assets/world/story.json'), 'utf8'));
const words = JSON.parse(fs.readFileSync(path.join(root, 'assets/world/courtyard-life.json'), 'utf8'));
let checks = 0;
const check = (actual, expected, message) => { assert.deepEqual(actual, expected, message); checks++; };
async function flush() { await new Promise(resolve => setTimeout(resolve, 0)); }

function setup(lang, reduced = false) {
  const prefix = lang === 'ko' ? '' : lang + '/';
  const html = fs.readFileSync(path.join(root, prefix, 'games/tiny-defense/index.html'), 'utf8');
  const dom = new JSDOM(html, {url:`https://example.com/${prefix}games/tiny-defense/`, runScripts:'outside-only', pretendToBeVisual:true});
  const w = dom.window;
  w.matchMedia = query => ({matches:query.includes('prefers-reduced-motion') && reduced, addEventListener() {}});
  w.ResizeObserver = class { observe() {} };
  w.fetch = async () => ({ok:true, json:async () => stories});
  w.HTMLDialogElement.prototype.showModal = function() { this.setAttribute('open', ''); };
  w.HTMLDialogElement.prototype.close = function() { this.removeAttribute('open'); this.dispatchEvent(new w.Event('close')); };
  w.Element.prototype.animate = () => ({cancel() {}, finished:Promise.resolve()});
  const computed = w.getComputedStyle.bind(w);
  w.getComputedStyle = el => { const result=computed(el); return new Proxy(result, {get:(style,key)=>key==='objectPosition'?'50% 60%':Reflect.get(style,key)}); };
  for (const file of ['book-turn.js', 'world.js', 'courtyard-life.js']) w.eval(fs.readFileSync(path.join(root,file),'utf8'));
  return dom;
}

(async () => {
  for (const lang of ['ko', 'en', 'ja']) {
    const dom=setup(lang), w=dom.window, d=w.document, copy=words[lang];
    try {
      const world=d.querySelector('[data-world]');
      const familiar=d.querySelector('[data-familiar]');
      check(d.querySelector('[data-courtyard-life]').hidden, false, lang+' encounters appear after initialization');
      check(familiar.hidden, false, lang+' familiar appears');
      check(d.querySelector('[data-reader-familiar]').hidden, true, lang+' familiar starts in courtyard');
      for (let i=0;i<4;i++) {
        d.querySelector('.life-greeting').click();
        check(d.querySelector('[data-spirit-response]').textContent, copy.spiritReply[i%3], lang+' greet rotation');
      }
      for (const button of d.querySelectorAll('[data-resident]')) {
        button.click();
        check(d.querySelector('[data-resident-name]').textContent, copy.names[button.dataset.resident], lang+' localized speaker');
        check(d.querySelector('[data-resident-response]').textContent, button.dataset.day, lang+' daytime dialogue');
        check(d.querySelectorAll('.is-greeted').length, 1, lang+' one greeted resident');
        check(d.querySelector('.is-greeted').dataset.character, button.dataset.resident, lang+' correct resident');
      }
      d.querySelector('[data-time-choice="night"]').click();
      await flush();
      check(d.querySelector('[data-resident-response]').textContent, copy.night['dark-knight'], lang+' nighttime response changes');
      check(d.querySelector('[data-character="dark-knight"] .courtyard-bubble').textContent, copy.night['dark-knight'], lang+' map speech changes with time');
      const visiblePawn=d.querySelector('[data-character="pawn"]');
      visiblePawn.style.opacity='1';
      visiblePawn.click();
      check(d.querySelector('[data-resident-name]').textContent, copy.names.pawn, lang+' direct scenery tap');
      check(d.querySelector('[data-resident-response]').textContent, copy.night.pawn, lang+' scenery tap uses nighttime dialogue');
      for (const button of d.querySelectorAll('[data-season-choice]')) {
        button.click();
        check(world.dataset.season, button.dataset.seasonChoice, lang+' selected season');
        check(d.querySelectorAll('[data-season-choice][aria-pressed="true"]').length, 1, lang+' one active waystone');
        check(d.querySelector('[data-season-response]').textContent, copy.season[button.dataset.seasonChoice].hint, lang+' seasonal response');
        const link=d.querySelector('[data-season-story]');
        check(link.dataset.storyScene, button.dataset.scene, lang+' exact story scene target');
        check(link.getAttribute('href'), (lang==='ko'?'':'/'+lang)+'/story/#chapter-'+button.dataset.chapter, lang+' localized text fallback');
        link.click();
        await flush();
        check(d.querySelector('#story-reader').open, true, lang+' reader opens');
        check(d.querySelector('[data-story-gate]').hidden, false, lang+' seasonal deep link still needs spoiler consent');
        check(d.querySelector('[data-reader-familiar]').contains(familiar), true, lang+' familiar joins the reader');
        familiar.click();
        check(d.querySelector('.familiar-caption').textContent.length>0, true, lang+' greeting announced inside modal');
        // Consent must open the requested memory, rather than the first locked page.
        d.querySelector('[data-story-gate] button').click();
        await flush();
        const target=stories[lang].pages.find(p=>p.id===button.dataset.scene);
        check(d.querySelector('[data-page-title]').textContent, target.title, lang+' correct seasonal memory');
        check(d.querySelector('[data-story-lines]').textContent.includes(target.lines[0].text), true, lang+' original story retained');
        d.querySelector('[data-close-story]').click();
        check(world.querySelector('.world-landscape').contains(familiar), true, lang+' familiar returns after close');
        check(d.activeElement, link, lang+' reader restores link focus');
      }
      d.querySelector('[data-season-reset]').click();
      check(world.dataset.season, '', lang+' reset atmosphere');
      check(d.querySelector('[data-season-story]').hidden, true, lang+' reset hides seasonal link');
      check(d.activeElement.dataset.seasonChoice, 'winter', lang+' reset keeps focus visible');
      d.querySelector('[data-motion]').click();
      await flush();
      check(familiar.classList.contains('familiar-still'), true, lang+' motion pause applies to familiar');
      d.querySelector('[data-open-story]').click();
      await flush();
      check(familiar.classList.contains('familiar-still'), true, lang+' pause survives docking outside world');
      w.dispatchEvent(new w.Event('pagehide'));
      check(world.classList.contains('resident-talking'), false, lang+' leaving stops resident encounter');
      check(familiar.classList.contains('is-greeting'), false, lang+' leaving stops familiar gesture');
    } finally { w.close(); }
    const quiet=setup(lang, true);
    try {
      quiet.window.document.querySelector('.life-greeting').click();
      await flush();
      check(quiet.window.document.querySelector('[data-familiar]').classList.contains('familiar-still'), true, lang+' reduced motion');
      check(quiet.window.document.querySelector('[data-spirit-response]').textContent, copy.spiritReply[0], lang+' reduced motion retains interaction');
    } finally { quiet.window.close(); }
  }
  console.log(`Courtyard interactions: ${checks} assertions passed across KO/EN/JA, including seasonal spoiler gates and reduced motion.`);
})().catch(error=>{ console.error(error); process.exitCode=1; });
