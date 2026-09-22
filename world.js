(() => {
  'use strict';
  const world = document.querySelector('[data-world]');
  if (!world) return;
  const lang = ['ko', 'en', 'ja'].includes(document.documentElement.lang) ? document.documentElement.lang : 'ko';
  const copy = {
    ko: { on:'소리 켜기', off:'소리 끄기', pause:'움직임 멈추기', move:'움직임 재생', old:'노인', prologue:'프롤로그', scene:'장면', fullTitle:'그다음 이야기도 펼칠까요?', spoiler:'이제부터 챕터 1–3의 결말까지 이어집니다. 게임에서 직접 만나고 싶다면 여기서 책을 덮어 두세요.', full:'전체 이야기 읽기', back:'도입부로 돌아가기', close:'성 안으로', next:'다음 장', loading:'책을 펼치고 있어요…', error:'이야기를 불러오지 못했어요. 다시 시도해 주세요.', retry:'다시 불러오기', audioError:'소리를 재생하지 못했어요. 소리 켜기를 다시 눌러 주세요.', game:'게임에서 여정 이어가기', continue:'이어서 읽기', saved:'읽던 곳을 기억해 둘게요.' },
    en: { on:'Sound on', off:'Sound off', pause:'Pause motion', move:'Resume motion', old:'Old man', prologue:'Prologue', scene:'Scene', fullTitle:'Turn to the rest of the story?', spoiler:'The following pages include the endings of Chapters 1–3. Close the book here if you would rather discover it in the game.', full:'Read the full story', back:'Back to the opening', close:'Courtyard', next:'Next page', loading:'Opening the book…', error:'The story could not be loaded. Please try again.', retry:'Try again', audioError:'Audio could not start. Select Sound on to try again.', game:'Continue the journey in the game', continue:'Continue reading', saved:'Your place in the book is saved.' },
    ja: { on:'音をオン', off:'音をオフ', pause:'動きを止める', move:'動きを再開', old:'老人', prologue:'プロローグ', scene:'場面', fullTitle:'物語の続きを開きますか？', spoiler:'この先はチャプター1〜3の結末まで描かれています。ゲームで出会いたい方は、ここで本を閉じてください。', full:'物語をすべて読む', back:'冒頭に戻る', close:'城の中へ', next:'次のページ', loading:'本を開いています…', error:'物語を読み込めませんでした。もう一度お試しください。', retry:'再読み込み', audioError:'音を再生できませんでした。音をオンにして、もう一度お試しください。', game:'ゲームで旅を続ける', continue:'続きから読む', saved:'読んだ場所を覚えておきます。' }
  }[lang];
  const $ = (selector) => document.querySelector(selector);
  const dialog = $('#story-reader');
  const page = $('[data-book-page]');
  const spread = $('[data-book-spread]');
  const next = $('[data-story-next]');
  const prev = $('[data-story-prev]');
  const contents = $('#story-contents');
  const gate = $('[data-story-gate]');
  const lines = $('[data-story-lines]');
  const title = $('[data-page-title]');
  const progress = $('[data-page-progress]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const storageKey = 'tiny-defense-storybook-v1';
  let story, loading, index = 0, allowed = false, pending = 2, showingGate = false, turning = false;
  let lastTrigger, paused = reduce.matches, enabled = false, volume = .35, fadeFrame = 0, audioEpoch = 0;
  let openEpoch = 0, activeTurn = null, drag = null;
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
    cancelAnimationFrame(fadeFrame);
    if (music) Object.values(music).forEach(audio => { audio.pause(); audio.volume = 0; });
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
    if (!enabled || document.hidden) { stopAudio(); return; }
    if (!music) {
      music = Object.fromEntries(Object.entries({ day:'/assets/audio/lobby-theme.mp3', night:'/assets/world/audio/night.mp3', story:'/assets/world/audio/story.mp3' }).map(([key,src]) => {
        const audio = new Audio(); audio.preload = 'none'; audio.loop = true; audio.volume = 0; audio.src = src;
        return [key,audio];
      }));
    }
    const selected = dialog.open ? 'story' : world.dataset.time;
    // Start on the user action. Crossfades never create additional players.
    const selectedAudio = music[selected];
    if (selectedAudio.paused) selectedAudio.play().catch(() => audioError(epoch));
    cancelAnimationFrame(fadeFrame);
    const from = Object.fromEntries(Object.entries(music).map(([key,a]) => [key,a.volume]));
    const start = performance.now();
    function fade(now) {
      if (epoch !== audioEpoch) return;
      const p = Math.min(1,(now-start)/900);
      const eased = p*p*(3-2*p);
      Object.entries(music).forEach(([key,audio]) => {
        const target = key === selected ? volume * (dialog.open ? .65 : .8) : 0;
        audio.volume = Math.max(0,Math.min(1,from[key]+(target-from[key])*eased));
        if (p === 1 && key !== selected) audio.pause();
      });
      if (p < 1) fadeFrame = requestAnimationFrame(fade);
    }
    fadeFrame = requestAnimationFrame(fade);
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
  function fitActors() {
    const width=landscape.clientWidth, height=landscape.clientHeight;
    const scale=Math.max(width/1536,height/1024);
    const [px,py]=getComputedStyle($('.courtyard-day')).objectPosition.split(' ').map(parseFloat);
    Object.assign(actors.style,{
      width:`${1536*scale}px`,height:`${1024*scale}px`,
      left:`${(width-1536*scale)*px/100}px`,top:`${(height-1024*scale)*py/100}px`
    });
    actors.hidden=false;
  }
  fitActors();
  new ResizeObserver(fitActors).observe(landscape);

  function remember() {
    saved = {page:index, full:allowed};
    try { localStorage.setItem(storageKey,JSON.stringify(saved)); } catch { /* Reading remains available. */ }
    $('[data-resume-story]').hidden = index === 0;
  }
  function contentsState(open) {
    contents.hidden = !open;
    $('[data-contents]').setAttribute('aria-expanded',String(open));
  }
  function renderContents() {
    contents.replaceChildren();
    story.pages.forEach((p,i) => {
      const button = document.createElement('button'); button.type = 'button';
      button.textContent = `${String(p.chapter).padStart(2,'0')}.${String(p.scene).padStart(2,'0')}  ${i < 2 || allowed ? p.title : copy.scene+' '+p.scene}`;
      if (i === index && !showingGate) button.setAttribute('aria-current','page');
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
  function render(save = true) {
    const data = story.pages[index];
    showingGate = false;
    gate.hidden = true; gate.replaceChildren(); lines.hidden = false; lines.replaceChildren();
    title.textContent = data.title;
    const chapter = String(data.chapter).padStart(2,'0');
    $('.reader-kicker').textContent = `TINY DEFENSE / CHAPTER ${chapter}`;
    $('.art-chapter b').textContent = chapter;
    $('[data-page-kicker]').textContent = index === 0 ? copy.prologue : `CHAPTER ${chapter} / ${copy.scene} ${String(data.scene).padStart(2,'0')}`;
    const illustrated = paper.hasArt(story.pages, index);
    spread.classList.toggle('text-spread', !illustrated);
    $('.book-illustration').hidden = !illustrated;
    $('[data-left-page]').hidden = illustrated;
    const leftLines = $('[data-left-lines]'); leftLines.replaceChildren();
    $('[data-left-title]').textContent = data.title;
    $('[data-left-kicker]').textContent = $('[data-page-kicker]').textContent;
    title.hidden = !illustrated;
    $('[data-page-kicker]').hidden = !illustrated;
    $('[data-folio-left]').textContent = String(index * 2 + 1).padStart(2, '0');
    $('[data-folio-right]').textContent = String(index * 2 + 2).padStart(2, '0');
    const split = illustrated ? 0 : paper.splitLines(data.lines);
    const art = $('[data-story-art]');
    if (illustrated) art.src = `/assets/world/${data.art}.webp?v=story-3`;
    else art.removeAttribute('src');
    // The narration supplies the illustration's context; avoid repeating it in alt text.
    art.alt = '';
    data.lines.forEach((line, lineIndex) => {
      const p = document.createElement('p');
      if (line.speaker) {
        const speaker=document.createElement('span'); speaker.className='speaker';
        speaker.textContent=line.speaker===1 ? story.boy : copy.old;
        p.append(speaker);
      } else p.className='narration';
      p.append(document.createTextNode(line.text)); (lineIndex < split ? leftLines : lines).append(p);
    });
    prev.disabled = index === 0;
    next.disabled = false;
    next.querySelector('span').textContent = index === story.pages.length-1 ? copy.close : copy.next;
    progress.textContent = `${String(index+1).padStart(2,'0')} / ${String(story.pages.length).padStart(2,'0')}`;
    if (index === story.pages.length-1) {
      gate.hidden=false;
      const a=document.createElement('a'); a.href=`${lang==='ko'?'':'/'+lang}/games/tiny-defense/#stores`; a.textContent=copy.game; gate.append(a);
    }
    renderContents(); if (save) remember();
    // Cache only the next illustration, never unreached dialogue or audio requests.
    if (index+1 < story.pages.length && (allowed || index < 1) && paper.hasArt(story.pages, index+1)) {
      const image = new Image(); image.src=`/assets/world/${story.pages[index+1].art}.webp?v=story-3`;
    }
  }
  function spoilerGate(target) {
    pending = target; showingGate=true;
    title.hidden=false; $('[data-page-kicker]').hidden=false;
    title.textContent=copy.fullTitle;
    $('[data-page-kicker]').textContent='CHAPTER 01–03';
    lines.hidden=true; gate.hidden=false; gate.replaceChildren();
    const p=document.createElement('p'); p.textContent=copy.spoiler; gate.append(p);
    gate.append(makeButton(copy.full, () => { allowed=true; navigate(pending); }));
    gate.append(makeButton(copy.back, () => navigate(1),true));
    prev.disabled=false; next.disabled=true; progress.textContent=`03 / ${String(story.pages.length).padStart(2,'0')}`;
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
    if (!story || turning) return;
    if (target >= story.pages.length) { closeBook(); return; }
    target=Math.max(0,target);
    if (target >= 2 && !allowed) { spoilerGate(target); return; }
    if (target === index && !showingGate) return;
    // Narrow screens keep a readable continuous page, with a short fade.
    if (reduce.matches || matchMedia('(max-width:699px)').matches) {
      index=target; render(); effect(`page-${1+(target%3)}`);
      if (!reduce.matches) spread.animate([{opacity:.35},{opacity:1}], {duration:220});
      page.focus({preventScroll:true}); dialog.scrollTop=0; return;
    }
    if (showingGate) render(false);
    beginTurn(target); settleTurn(target, true);
  }
  async function loadStory() {
    if (story) return story;
    if (!loading) loading=fetch('/assets/world/story.json?v=story-3').then(r => {
      if (!r.ok) throw new Error('Story HTTP '+r.status);
      return r.json();
    }).then(data => {
      if (!data[lang]?.pages?.length) throw new Error('Invalid story');
      story=data[lang]; return story;
    }).finally(() => { loading=null; });
    return loading;
  }
  async function openBook(trigger, resume = false) {
    if (turning) return;
    const epoch = ++openEpoch;
    lastTrigger=trigger;
    contentsState(false);
    if (!dialog.open) dialog.showModal();
    syncMusic(); effect('book-open');
    title.hidden=false; title.textContent=copy.loading;
    lines.replaceChildren(); $('[data-left-lines]').replaceChildren();
    $('[data-left-page]').hidden=true; gate.hidden=true;
    prev.disabled=true; next.disabled=true;
    try {
      await loadStory();
      if (!dialog.open || epoch !== openEpoch) return;
      allowed=Boolean(resume && saved?.full);
      index=resume && saved ? Math.min(saved.page,allowed ? story.pages.length-1 : 1) : 0;
      render(); dialog.scrollTop=0; $('[data-close-story]').focus();
    } catch {
      if (!dialog.open || epoch !== openEpoch) return;
      title.textContent=copy.error; gate.hidden=false; gate.replaceChildren(makeButton(copy.retry,() => openBook(lastTrigger,resume)));
      progress.textContent='';
    }
  }
  function closeBook() { dialog.close(); }
  dialog.addEventListener('close', () => {
    ++openEpoch;
    activeTurn?.dispose(); activeTurn = null; drag = null; turning = false;
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
  $('[data-contents]').addEventListener('click', () => { if(story) contentsState(contents.hidden); });
  prev.addEventListener('click', () => navigate(showingGate ? 1:index-1));
  next.addEventListener('click', () => navigate(index+1));
  dialog.addEventListener('keydown',event => {
    if (event.target.matches('input,select,textarea') || !contents.hidden || showingGate) return;
    if(event.key==='ArrowRight') { event.preventDefault(); navigate(index+1); }
    if(event.key==='ArrowLeft') { event.preventDefault(); navigate(index-1); }
  });
  spread.addEventListener('pointerdown', event => {
    if (!story || turning || showingGate || !contents.hidden || event.button !== 0 || event.target.closest('button,a,input')) return;
    const rect = spread.getBoundingClientRect(), x = event.clientX - rect.left;
    // Start at the outside edge, leaving dialogue selectable and vertical scrolling native.
    if (x > rect.width * .22 && x < rect.width * .78) return;
    const direction = x > rect.width / 2 ? 1 : -1;
    const target = index + direction;
    if (target < 0 || target >= story.pages.length) return;
    drag = { id:event.pointerId, x:event.clientX, y:event.clientY, direction, target, width:rect.width / 2, started:false, progress:0, lastX:event.clientX, time:performance.now(), velocity:0 };
  });
  spread.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX-drag.x, dy = event.clientY-drag.y;
    if (!drag.started) {
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { drag=null; return; }
      if (-drag.direction * dx < 10) return;
      if (drag.target >= 2 && !allowed) { drag=null; spoilerGate(2); return; }
      drag.started=true; spread.setPointerCapture(event.pointerId);
      if (!reduce.matches && !matchMedia('(max-width:699px)').matches) beginTurn(drag.target);
    }
    const now = performance.now();
    drag.velocity = -drag.direction * (event.clientX-drag.lastX) / Math.max(1,now-drag.time);
    drag.lastX=event.clientX; drag.time=now;
    drag.progress=Math.max(0,Math.min(1,-drag.direction*dx/(drag.width*1.7)));
    activeTurn?.set(drag.progress);
  });
  function releasePage(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const current=drag; drag=null;
    const commit = event.type !== 'pointercancel' && (current.progress > .25 || (current.progress > .04 && current.velocity > .45 && performance.now()-current.time < 100));
    if (spread.hasPointerCapture(event.pointerId)) spread.releasePointerCapture(event.pointerId);
    if (activeTurn) settleTurn(current.target,commit);
    else if (current.started && commit) navigate(current.target);
  }
  spread.addEventListener('pointerup',releasePage);
  spread.addEventListener('pointercancel',releasePage);
  window.addEventListener('resize', () => {
    if (!activeTurn) return;
    activeTurn.dispose(); activeTurn=null; drag=null; turning=false; render(false);
  });
})();
