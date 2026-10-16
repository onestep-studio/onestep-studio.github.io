/* A small, self-contained preview. All locations change only on an explicit click. */
(() => {
  'use strict';
  const content = document.getElementById('eosa-content');
  if (!content) return;
  const copy = JSON.parse(content.textContent);
  const scene = document.querySelector('[data-scene-image]');
  const sceneName = document.querySelector('[data-scene-name]');
  const locations = [...document.querySelectorAll('[data-location]')];
  const spots = [...document.querySelectorAll('[data-spot]')];
  const title = document.querySelector('[data-note-title]');
  const body = document.querySelector('[data-note-body]');
  const art = document.querySelector('[data-note-image]');
  const count = document.querySelector('[data-note-count]');
  const hint = document.querySelector('[data-note-hint]');
  const reset = document.querySelector('[data-reset]');
  const visited = new Set();
  const total = copy.locations.reduce((n, place) => n + place.spots.length, 0);
  let current = 0;
  const positions = [ [[31,69],[67,80]], [[27,78],[72,50]], [[29,66],[66,80]] ];

  function openLocation(index) {
    const place = copy.locations[index];
    current = index;
    locations.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    scene.src = '/assets/amhaeng-eosa/' + place.image + '.webp';
    scene.alt = copy.sceneAlt[index];
    sceneName.textContent = place.name;
    title.textContent = place.name;
    body.textContent = place.ambient;
    art.hidden = true;
    spots.forEach((button, i) => {
      button.textContent = place.spots[i].name;
      button.style.setProperty('--x', positions[index][i][0] + '%');
      button.style.setProperty('--y', positions[index][i][1] + '%');
      button.setAttribute('aria-pressed', 'false');
      button.hidden = false;
    });
  }
  function openClue(index) {
    const clue = copy.locations[current].spots[index];
    visited.add(current + ':' + index);
    title.textContent = clue.name;
    body.textContent = clue.text;
    art.src = '/assets/amhaeng-eosa/' + clue.image + '.webp';
    art.hidden = false;
    count.textContent = copy.progress + ' ' + visited.size + ' / ' + total;
    spots.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    hint.hidden = true;
    reset.hidden = false;
  }
  locations.forEach((button, index) => button.addEventListener('click', () => openLocation(index)));
  spots.forEach((button, index) => button.addEventListener('click', () => openClue(index)));
  reset.addEventListener('click', () => {
    visited.clear();
    count.textContent = copy.progress + ' 0 / ' + total;
    hint.hidden = false;
    reset.hidden = true;
    openLocation(0);
    // Reset hides its trigger; put keyboard focus on a visible, meaningful control.
    locations[0].focus({ preventScroll: true });
  });
  openLocation(0);

  const music = document.querySelector('[data-music]');
  const sound = document.querySelector('[data-sound]');
  const soundLabel = sound.querySelector('span');
  const soundMessage = document.querySelector('[data-sound-message]');
  music.volume = 0.35;
  sound.hidden = false;
  let wantsMusic = false;
  let pending = false;
  function renderSound() {
    const playing = !music.paused;
    sound.setAttribute('aria-pressed', String(playing));
    // The label describes the action the button performs.
    soundLabel.textContent = playing ? copy.soundOff : copy.soundOn;
  }
  async function playMusic() {
    if (pending) return;
    pending = true;
    try {
      if (music.error) music.load();
      await music.play();
      soundMessage.textContent = '';
      if (!wantsMusic || document.hidden) music.pause();
    } catch {
      wantsMusic = false;
      soundMessage.textContent = copy.soundError;
    } finally {
      pending = false;
      renderSound();
    }
  }
  sound.addEventListener('click', () => {
    wantsMusic = !wantsMusic;
    if (wantsMusic) playMusic();
    else { music.pause(); renderSound(); }
  });
  music.addEventListener('play', renderSound);
  music.addEventListener('pause', renderSound);
  music.addEventListener('error', () => {
    if (wantsMusic) {
      wantsMusic = false;
      soundMessage.textContent = copy.soundError;
      renderSound();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) music.pause();
    else if (wantsMusic) playMusic();
  });
  window.addEventListener('pagehide', () => music.pause());
})();
