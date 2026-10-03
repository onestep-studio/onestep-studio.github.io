(() => {
  'use strict';
  const world = document.querySelector('[data-world]');
  if (!world) return;
  const lang = ['ko', 'en', 'ja'].includes(document.documentElement.lang) ? document.documentElement.lang : 'ko';
  const copy = {
    ko: { on:'소리 켜기', off:'소리 끄기', pause:'움직임 멈추기', move:'움직임 재생', old:'노인', prologue:'프롤로그', scene:'장면', fullTitle:'이야기 계속 읽기', spoiler:'이후 이야기에는 결말이 포함됩니다.', full:'계속 읽기', back:'돌아가기', close:'닫기', next:'다음', loading:'책을 펼치고 있어요…', error:'이야기를 불러오지 못했어요. 다시 시도해 주세요.', retry:'다시 불러오기', audioError:'소리를 재생하지 못했어요. 소리 켜기를 다시 눌러 주세요.', game:'게임으로 이어가기', continue:'이어서 읽기', saved:'읽던 곳을 기억해 둘게요.' },
    en: { on:'Sound on', off:'Sound off', pause:'Pause motion', move:'Resume motion', old:'Old man', prologue:'Prologue', scene:'Scene', fullTitle:'Read on', spoiler:'The following pages reveal the ending.', full:'Continue reading', back:'Go back', close:'Close', next:'Next', loading:'Opening the book…', error:'The story could not be loaded. Please try again.', retry:'Try again', audioError:'Audio could not start. Select Sound on to try again.', game:'Continue in the game', continue:'Continue reading', saved:'Your place in the book is saved.' },
    ja: { on:'音をオン', off:'音をオフ', pause:'動きを止める', move:'動きを再開', old:'老人', prologue:'プロローグ', scene:'場面', fullTitle:'物語の続きを読む', spoiler:'この先の物語には結末が含まれます。', full:'続きを読む', back:'戻る', close:'閉じる', next:'次へ', loading:'本を開いています…', error:'物語を読み込めませんでした。もう一度お試しください。', retry:'再読み込み', audioError:'音を再生できませんでした。音をオンにして、もう一度お試しください。', game:'ゲームで続ける', continue:'続きから読む', saved:'読んだ場所を覚えておきます。' }
  }[lang];
  const $ = (selector) => document.querySelector(selector);
  const dialog = $('#story-reader');
  const page = $('[data-book-page]');
  const spread = $('[data-book-spread]');
  const next = $('[data-story-next]');
  const prev = $('[data-story-prev]');
  const contents = $('#story-contents');
  const readerSettings = $('.reader-settings');
  const gate = $('[data-story-gate]');
  const lines = $('[data-story-lines]');
  const storyCopy = document.createElement('div'); storyCopy.className = 'story-copy'; storyCopy.id = 'story-copy';
  storyCopy.append(...page.childNodes); page.append(storyCopy);
  function textState() { storyCopy.hidden = false; }
  const title = $('[data-page-title]');
  title.id = 'story-scene-title';
  storyCopy.tabIndex = 0; storyCopy.setAttribute('role','region'); storyCopy.setAttribute('aria-labelledby',title.id);
  const progress = $('[data-page-progress]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const storageKey = 'tiny-defense-storybook-rewind-v2';
  let story, loading, index = 0, allowed = false, pending = 2, showingGate = false, turning = false;
  let lastTrigger, paused = reduce.matches, enabled = false, volume = .35, audioEpoch = 0;
  let openEpoch = 0, activeTurn = null, entrance = null, opening = false;
  const paper = window.StoryPaper;
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(storageKey)); } catch { /* Private browsing/storage disabled. */ }
  if (saved && (!Number.isInteger(saved.page) || saved.page < 0)) saved = null;
  let music = null;
  const effects = new Map();
  const activeEffects = new Set();
  const notice = $('[data-world-notice]');
  function soundLabels() {
    document.querySelectorAll('[data-sound]').forEach(button => {
      button.setAttribute('aria-pressed', String(enabled));
      button.querySelector('span').textContent = enabled ? copy.off : copy.on;
      button.setAttribute('aria-label', enabled ? copy.off : copy.on);
    });
  }
  function stopAudio() {
    music?.stop();
    activeEffects.forEach(audio => audio.pause());
    activeEffects.clear();
  }
  function audioError(epoch) {
    if (epoch !== audioEpoch || !enabled || document.hidden) return;
    enabled = false;
    stopAudio();
    soundLabels();
    notice.textContent = copy.audioError;
    if (dialog.open) progress.textContent = copy.audioError;
  }
  function syncMusic() {
    const epoch = ++audioEpoch;
    if (!enabled || document.hidden || document.querySelector('[data-map-dialog][open]')) { stopAudio(); return; }
    if (!music) music = new window.CourtyardMusic({ day:'/assets/audio/lobby-theme.mp3', night:'/assets/world/audio/night.mp3', story:'/assets/world/audio/story.mp3' });
    const selected = dialog.open ? 'story' : world.dataset.time;
    music.select(selected,volume * (dialog.open ? .65 : .8),3).catch(() => audioError(epoch));
  }

  function effect(name) {
    if (!enabled || document.hidden || volume === 0) return;
    if (!effects.has(name)) { const audio = new Audio(`/assets/world/audio/${name}.mp3`); audio.preload='none'; effects.set(name,audio); }
    const audio = effects.get(name);
    audio.currentTime = 0;
    audio.volume = volume*.8;
    activeEffects.add(audio);
    audio.onended = () => activeEffects.delete(audio);
    audio.play().catch(() => activeEffects.delete(audio));
  }
  document.querySelectorAll('[data-sound]').forEach(button => button.addEventListener('click', () => {
    enabled = !enabled; notice.textContent = ''; soundLabels(); syncMusic();
  }));
  $('[data-volume]').addEventListener('input', event => { volume = Number(event.target.value)/100; syncMusic(); });
  document.addEventListener('visibilitychange', syncMusic);
  document.addEventListener('courtyard:panel', syncMusic);
  window.addEventListener('pagehide', () => { ++audioEpoch; stopAudio(); });
  window.addEventListener('pageshow', () => { if (enabled) syncMusic(); });
  document.querySelectorAll('[data-time-choice]').forEach(button => button.addEventListener('click', () => {
    world.dataset.time = button.dataset.timeChoice;
    document.querySelectorAll('[data-time-choice]').forEach(b => b.setAttribute('aria-pressed',String(b===button)));
    syncMusic();
  }));
  function motionState() {
    world.classList.toggle('motion-paused', paused);
    const button = $('[data-motion]');
    button.hidden = reduce.matches;
    button.setAttribute('aria-pressed',String(paused));
    button.setAttribute('aria-label',paused ? copy.move : copy.pause);
    button.textContent = paused ? '▷' : 'Ⅱ';
  }
  $('[data-motion]').addEventListener('click', () => { paused = !paused; motionState(); });
  reduce.addEventListener('change', () => { paused = reduce.matches; motionState(); });
  motionState();
  soundLabels();
  $('[data-world-controls]').hidden = false;
  // Match the image's cover crop so the actual game sprites stay beside the gate
  // at every aspect ratio, including the narrower mobile crop.
  const landscape = $('.world-landscape');
  const actors = $('.courtyard-actors');
  // Contours are baked into the background; transparent links follow its cover crop.
  const sceneryTargets = [
    ['forest', [170,501,310,704]],
    ['gate', [741,257,1082,580]],
    ['fire', [547,610,831,831]],
    ['guard', [607,183,720,384]],
    ['book', [1109,691,1389,909]],
    ['gallery', [1238,318,1313,421]]
  ].map(([name, box]) => {
    const link = $(`.marker-${name}`);
    if (!link) return null;
    const highlight = document.createElement('span');
    highlight.classList.add('scenery-selection');
    highlight.setAttribute('aria-hidden','true');
    link.prepend(highlight);
    link.classList.add('scenery-target');
    return {link,box};
  }).filter(Boolean);
  function fitActors() {
    const width=landscape.clientWidth, height=landscape.clientHeight;
    const scale=Math.max(width/1536,height/1024);
    const [px,py]=getComputedStyle($('.courtyard-day')).objectPosition.split(' ').map(parseFloat);
    Object.assign(actors.style,{
      width:`${1536*scale}px`,height:`${1024*scale}px`,
      left:`${(width-1536*scale)*px/100}px`,top:`${(height-1024*scale)*py/100}px`
    });
    sceneryTargets.forEach(({link,box:[x,y,right,bottom]}) => {
      Object.assign(link.style, {
        left:`${(width-1536*scale)*px/100+x*scale}px`,
        top:`${(height-1024*scale)*py/100+y*scale}px`,
        width:`${(right-x)*scale}px`,height:`${(bottom-y)*scale}px`
      });
    });
    actors.hidden=false;
  }
  fitActors();
  new ResizeObserver(fitActors).observe(landscape);

  function remember() {
    saved = {page:index, id:story.pages[index].id, full:allowed, revision:story.revision};
    try { localStorage.setItem(storageKey,JSON.stringify(saved)); } catch { /* Reading remains available. */ }
    $('[data-resume-story]').hidden = index === 0;
  }
  function contentsState(open) {
    if (open) readerSettings.open = false;
    contents.hidden = !open;
    $('[data-contents]').setAttribute('aria-expanded',String(open));
  }
  function renderContents() {
    contents.replaceChildren();
    let chapter = null;
    story.pages.forEach((p,i) => {
      if (p.part > 1) return;
      if (p.chapter !== chapter) {
        chapter = p.chapter;
        const heading = document.createElement('h3');
        heading.textContent = story.books[String(chapter)];
        contents.append(heading);
      }
      const button = document.createElement('button'); button.type = 'button';
      button.textContent = p.kind === 'interlude' || i < story.previewCount || allowed ? p.title : `${copy.scene} ${p.scene}`;
      if (p.sourceId === story.pages[index].sourceId && !showingGate) button.setAttribute('aria-current','page');
      button.addEventListener('click', () => { contentsState(false); navigate(i); });
      contents.append(button);
    });
  }
  function makeButton(text, callback, secondary = false) {
    const button = document.createElement('button'); button.type='button'; button.textContent=text;
    if (secondary) button.className='secondary';
    button.addEventListener('click', callback);
    return button;
  }
  const vignette = document.createElement('div');
  vignette.className = 'story-vignette'; vignette.hidden = true; vignette.setAttribute('aria-hidden','true');
  $('[data-book-left]').append(vignette);
  function renderVignette(data) {
    vignette.replaceChildren(); vignette.hidden = data.kind !== 'interlude' || data.visual !== 'forge';
    if (vignette.hidden) return;
    const frame=document.createElement('div'); frame.className='vignette-frame vignette-'+data.visual;
    const sprite=(name,src) => {
      const element=document.createElement(src ? 'img' : 'span'); element.className='vignette-'+name;
      if(src) { element.src=src; element.alt=''; }
      frame.append(element);
    };
    if(data.visual==='forge') {
      sprite('anvil','/assets/world/interlude-anvil.webp');
      sprite('hammer','/assets/world/interlude-hammer.webp');
      sprite('ring','/assets/world/interlude-ring.webp');
    }
    vignette.append(frame);
  }
  function render(save = true) {
    const data = story.pages[index];
    readerSettings.open = false;
    showingGate = false;
    gate.hidden = true; gate.replaceChildren(); lines.hidden = false; lines.replaceChildren();
    title.textContent = data.title;
    const chapter = String(data.chapter).padStart(2,'0');
    $('.reader-kicker').textContent = `TINY DEFENSE / CHAPTER ${chapter}`;
    $('.art-chapter b').textContent = chapter;
    const chapterLabel = data.sourceId === 'prologue' ? '' : story.books[String(data.chapter)];
    $('[data-page-kicker]').textContent = chapterLabel === data.title ? '' : chapterLabel;
    const illustrated = Boolean(story.pages[index].art);
    spread.classList.toggle('text-spread', !illustrated);
    textState(illustrated); storyCopy.scrollTop = 0; page.scrollTop = 0;
    renderVignette(data);
    $('.book-illustration').hidden = !illustrated || !vignette.hidden;
    $('[data-left-page]').hidden = illustrated;
    const leftLines = $('[data-left-lines]'); leftLines.replaceChildren();
    $('[data-left-title]').textContent = data.title;
    $('[data-left-kicker]').textContent = $('[data-page-kicker]').textContent;
    title.hidden = !illustrated;
    $('[data-page-kicker]').hidden = !illustrated || !$('[data-page-kicker]').textContent;
    $('[data-folio-left]').textContent = String(index * 2 + 1).padStart(2, '0');
    $('[data-folio-right]').textContent = String(index * 2 + 2).padStart(2, '0');
    const readingLines = [...(data.before || []).map(text => ({speaker:0,text})), ...data.lines, ...(data.after || []).map(text => ({speaker:0,text}))];
    const split = illustrated ? 0 : paper.splitLines(readingLines);
    const art = $('[data-story-art]');
    if (illustrated) art.src = `/assets/world/${data.art}.webp?v=${story.revision}`;
    else art.removeAttribute('src');
    // The narration supplies the illustration's context; avoid repeating it in alt text.
    art.alt = '';
    readingLines.forEach((line, lineIndex) => {
      const p = document.createElement('p');
      if (line.speaker) {
        p.dataset.speaker = String(line.speaker);
        const speaker=document.createElement('span'); speaker.className='speaker';
        speaker.textContent=story.speakers[String(line.speaker)];
        p.append(speaker);
        const dialogue=document.createElement('span'); dialogue.className='dialogue-text';
        dialogue.textContent=line.text; p.append(dialogue);
      } else p.className='narration';
      if (!line.speaker) p.append(document.createTextNode(line.text));
      (lineIndex < split ? leftLines : lines).append(p);
    });
    prev.disabled = index === 0;
    next.disabled = false;
    next.querySelector('span').textContent = index === story.pages.length-1 ? copy.close : copy.next;
    progress.textContent = `${String(index+1).padStart(2,'0')} / ${String(story.pages.length).padStart(2,'0')}`;
    if (index === story.pages.length-1) {
      gate.hidden=false;
      const a=document.createElement('a'); a.href=`${lang==='ko'?'':'/'+lang}/games/tiny-defense/#stores`; a.textContent=copy.game; gate.append(a);
    }
    if (save) { renderContents(); remember(); }
    // Cache only the next illustration, never unreached dialogue or audio requests.
    if (index+1 < story.pages.length && (allowed || index+1 < story.previewCount) && Boolean(story.pages[index+1].art)) {
      const image = new Image(); image.src=`/assets/world/${story.pages[index+1].art}.webp?v=${story.revision}`;
    }
  }
  function spoilerGate(target) {
    readerSettings.open=false;
    pending = target; showingGate=true;
    $('[data-reader-pages]').scrollTop=0; storyCopy.scrollTop=0; page.scrollTop=0;
    textState(true, true);
    title.hidden=false; $('[data-page-kicker]').hidden=true;
    title.textContent=copy.fullTitle;
    $('[data-page-kicker]').textContent='';
    lines.hidden=true; gate.hidden=false; gate.replaceChildren();
    const p=document.createElement('p'); p.textContent=copy.spoiler; gate.append(p);
    gate.append(makeButton(copy.full, () => { allowed=true; navigate(pending); }));
    gate.append(makeButton(copy.back, () => navigate(story.previewCount-1),true));
    prev.disabled=false; next.disabled=true; progress.textContent=`${String(target+1).padStart(2,'0')} / ${String(story.pages.length).padStart(2,'0')}`;
    page.focus({preventScroll:true});
  }
  function snapshot() {
    return { node:spread.cloneNode(true), height:spread.clientHeight };
  }
  function beginTurn(target) {
    const from = index, before = snapshot();
    index = target; render(false);
    const after = snapshot();
    index = from; render(false);
    turning = true; prev.disabled = true; next.disabled = true;
    activeTurn = paper.create(spread, before, after, target > from ? 1 : -1);
    return target;
  }
  function settleTurn(target, commit) {
    if (!activeTurn) return;
    if (commit) effect(`page-${1+(target%3)}`);
    activeTurn.settle(commit, accepted => {
      activeTurn = null; turning = false;
      if (accepted) index = target;
      render(); page.focus({preventScroll:true});
    });
  }
  function navigate(target) {
    if (!story || turning || opening) return;
    if (target >= story.pages.length) { closeBook(); return; }
    target=Math.max(0,target);
    if (target >= story.previewCount && !allowed) { spoilerGate(target); return; }
    if (target === index && !showingGate) return;
    // Narrow screens keep a readable continuous page, with a short fade.
    if (reduce.matches || matchMedia('(max-width:699px)').matches || !spread.classList.contains('text-spread') || Boolean(story.pages[target].art)) {
      index=target; render(); effect(`page-${1+(target%3)}`);
      if (!reduce.matches) spread.animate([{opacity:.35},{opacity:1}], {duration:220});
      page.focus({preventScroll:true}); dialog.scrollTop=0; $('[data-reader-pages]').scrollTop=0; return;
    }
    if (showingGate) render(false);
    beginTurn(target); settleTurn(target, true);
  }
  async function loadStory() {
    if (story) return story;
    if (!loading) loading=fetch(`/assets/world/story.json?v=${world.dataset.storyRevision}`).then(r => {
      if (!r.ok) throw new Error('Story HTTP '+r.status);
      return r.json();
    }).then(data => {
      if (!data[lang]?.pages?.length) throw new Error('Invalid story');
      story=data[lang]; return story;
    }).finally(() => { loading=null; });
    return loading;
  }
  function enterFromMap() { return Promise.resolve(); }
  async function openBook(trigger, resume = false) {
    if (turning || opening) return;
    const epoch = ++openEpoch;
    const source=(trigger.querySelector('.marker-point') || trigger).getBoundingClientRect();
    const origin={x:source.left+source.width/2,y:source.top+source.height/2,width:Math.max(55,source.width*.65)};
    opening=!reduce.matches && typeof Animation !== 'undefined';
    dialog.classList.toggle('book-arriving',opening);
    lastTrigger=trigger;
    contentsState(false);
    if (!dialog.open) dialog.showModal();
    document.dispatchEvent(new CustomEvent('courtyard:book', {detail:{open:true}}));
    syncMusic(); effect('book-open');
    textState(false, true);
    title.hidden=false; title.textContent=copy.loading;
    lines.replaceChildren(); $('[data-left-lines]').replaceChildren();
    $('[data-left-page]').hidden=true; gate.hidden=true;
    prev.disabled=true; next.disabled=true;
    try {
      await loadStory();
      if (!dialog.open || epoch !== openEpoch) return;
      allowed=Boolean(resume && saved?.full && saved.revision === story.revision);

      const restored=resume && saved ? story.pages.findIndex(p=>p.id===saved.id) : 0;
      index=Math.max(0,Math.min(restored,allowed ? story.pages.length-1 : story.previewCount-1));
      const destination=story.pages.findIndex(p=>p.id===trigger.dataset.storyScene);
      if (destination >= 0 && (allowed || destination < story.previewCount)) index=destination;
      render();
      if (destination >= story.previewCount && !allowed) spoilerGate(destination);
      dialog.scrollTop=0; $('[data-reader-pages]').scrollTop=0;
      if (opening) await enterFromMap(origin);
      if (!dialog.open || epoch !== openEpoch) return;
      opening=false; dialog.classList.remove('book-arriving','arrival-ready'); page.focus({preventScroll:true});
    } catch {
      if (!dialog.open || epoch !== openEpoch) return;
      entrance?.cancel(); opening=false; dialog.classList.remove('book-arriving','arrival-ready');
      title.textContent=copy.error; gate.hidden=false; gate.replaceChildren(makeButton(copy.retry,() => openBook(lastTrigger,resume)));
      progress.textContent='';
    }
  }
  function closeBook() { dialog.close(); }
  dialog.addEventListener('close', () => {
    readerSettings.open=false;
    document.dispatchEvent(new CustomEvent('courtyard:book', {detail:{open:false}}));
    ++openEpoch;
    entrance?.cancel(); opening=false; dialog.classList.remove('book-arriving','arrival-ready');
    activeTurn?.dispose(); activeTurn = null; turning = false;
    effect('book-close'); syncMusic(); contentsState(false);
    lastTrigger?.focus({preventScroll:true});
  });
  document.querySelectorAll('[data-open-story]').forEach(link => link.addEventListener('click',event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); openBook(link);
  }));
  $('[data-resume-story]').hidden = !saved || saved.page === 0;
  $('[data-resume-story]').addEventListener('click',event => openBook(event.currentTarget,true));
  $('[data-close-story]').addEventListener('click',closeBook);
  function openLinkedStory() {
    if (location.hash === '#storybook' && !dialog.open) openBook($('[data-open-story]'));
  }
  window.addEventListener('hashchange',openLinkedStory);
  openLinkedStory();
  $('[data-contents]').addEventListener('click', () => { if(story) contentsState(contents.hidden); });
  readerSettings.addEventListener('toggle', () => { if(readerSettings.open) contentsState(false); });
  document.addEventListener('pointerdown', event => { if(!readerSettings.contains(event.target)) readerSettings.open=false; });
  prev.addEventListener('click', () => navigate(showingGate ? story.previewCount-1:index-1));
  next.addEventListener('click', () => navigate(index+1));
  dialog.addEventListener('keydown',event => {
    if (event.key==='Escape' && readerSettings.open) {
      event.preventDefault(); readerSettings.open=false; readerSettings.querySelector('summary').focus(); return;
    }
    if (event.target.matches('input,select,textarea') || readerSettings.open || !contents.hidden || showingGate) return;
    if(event.key==='ArrowRight') { event.preventDefault(); navigate(index+1); }
    if(event.key==='ArrowLeft') { event.preventDefault(); navigate(index-1); }
  });
  window.addEventListener('resize', () => {
    entrance?.cancel();
    if (!activeTurn) return;
    activeTurn.dispose(); activeTurn=null; turning=false; render(false);
  });
})();
