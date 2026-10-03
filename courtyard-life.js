/* Quiet encounters in the existing courtyard; the story reader owns spoiler permission. */
(() => {
  'use strict';
  const world = document.querySelector('[data-world]');
  const life = world?.querySelector('[data-courtyard-life]');
  if (!life) return;
  const familiar = world.querySelector('[data-familiar]');
  const lifeDialog = world.querySelector('[data-life-dialog]');
  const notifyPanel = () => document.dispatchEvent(new CustomEvent('courtyard:panel'));
  lifeDialog?.querySelector('[data-life-close]').addEventListener('click', () => lifeDialog.close());
  lifeDialog?.addEventListener('close', () => { notifyPanel(); familiar.focus({preventScroll:true}); });
  const home = familiar.parentElement;
  const bookSlot = document.querySelector('[data-reader-familiar]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const spiritResponse = life.querySelector('[data-spirit-response]');
  const residentResponse = life.querySelector('[data-resident-response]');
  const residentName = life.querySelector('[data-resident-name]');
  const choices = [...life.querySelectorAll('[data-resident]')];
  const walkers = [...world.querySelectorAll('[data-character]')];
  const seasonResponse = life.querySelector('[data-season-response]');
  const storyLink = life.querySelector('[data-season-story]');
  const reset = life.querySelector('[data-season-reset]');
  const seasons = [...life.querySelectorAll('[data-season-choice]')];
  const bookResponse = document.createElement('span');
  bookResponse.className = 'familiar-caption';
  bookResponse.setAttribute('role', 'status');
  bookSlot.append(bookResponse);
  let greeting = 0, spiritTimer, residentTimer, selectedResident = null;

  function motionState() {
    const still = reduced.matches || world.classList.contains('motion-paused') || document.hidden;
    familiar.classList.toggle('familiar-still', still);
    world.classList.toggle('life-still', still);
  }
  function dock(open) {
    if (open && lifeDialog?.open) lifeDialog.close();
    (open ? bookSlot : home).append(familiar);
    bookSlot.hidden = !open;
    familiar.classList.toggle('familiar-at-book', open);
    motionState();
  }
  function greetSpirit() {
    if (lifeDialog && !document.querySelector('#story-reader[open]') && !lifeDialog.open) {
      lifeDialog.showModal(); notifyPanel();
    }
    clearTimeout(spiritTimer);
    const reply = spiritResponse.getAttribute(`data-reply-${greeting++ % 3}`);
    spiritResponse.textContent = reply;
    bookResponse.textContent = reply;
    familiar.classList.remove('is-greeting');
    // Restart a single user-triggered gesture, never a continuous flight around the page.
    void familiar.offsetWidth;
    familiar.classList.add('is-greeting');
    spiritTimer = setTimeout(() => familiar.classList.remove('is-greeting'), 2400);
  }
  document.querySelectorAll('[data-spirit-greet]').forEach(button => button.addEventListener('click', greetSpirit));

  function dialogue(choice) { return choice.dataset[world.dataset.time === 'night' ? 'night' : 'day']; }
  function syncDialogue() {
    for (const walker of walkers) {
      const choice = choices.find(button => button.dataset.resident === walker.dataset.character);
      const bubble = walker.querySelector('.courtyard-bubble');
      if (choice && bubble) bubble.textContent = dialogue(choice);
    }
    if (selectedResident) residentResponse.textContent = dialogue(selectedResident);
  }
  function endEncounter() {
    world.classList.remove('resident-talking');
    walkers.forEach(walker => walker.classList.remove('is-greeted'));
  }
  function greetResident(choice) {
    clearTimeout(residentTimer);
    endEncounter();
    selectedResident = choice;
    choices.forEach(button => button.setAttribute('aria-pressed', String(button === choice)));
    residentName.hidden = false;
    residentName.textContent = choice.dataset.name;
    syncDialogue();
    const actor = walkers.find(walker => walker.dataset.character === choice.dataset.resident);
    if (actor) {
      world.classList.add('resident-talking');
      actor.classList.add('is-greeted');
      residentTimer = setTimeout(endEncounter, 4800);
    }
  }
  choices.forEach(button => button.addEventListener('click', () => greetResident(button)));
  // Scenery taps have the same actions as the permanently accessible resident menu.
  home.addEventListener('click', event => {
    const actor = event.target.closest('[data-character]');
    if (!actor || Number(getComputedStyle(actor).opacity) < .25) return;
    const choice = choices.find(button => button.dataset.resident === actor.dataset.character);
    if (choice) greetResident(choice);
  });

  function selectSeason(button) {
    world.dataset.season = button?.dataset.seasonChoice || '';
    seasons.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
    seasonResponse.textContent = button ? button.dataset.hint : seasonResponse.dataset.default;
    storyLink.hidden = reset.hidden = !button;
    if (button) {
      const base = document.documentElement.lang === 'ko' ? '' : '/' + document.documentElement.lang;
      storyLink.href = `${base}/story/#chapter-${button.dataset.chapter}`;
      storyLink.dataset.storyScene = button.dataset.scene;
      storyLink.textContent = button.dataset.read;
    } else delete storyLink.dataset.storyScene;
  }
  seasons.forEach(button => button.addEventListener('click', () => selectSeason(button)));
  reset.addEventListener('click', () => {
    const previous = seasons.find(button => button.getAttribute('aria-pressed') === 'true');
    selectSeason(null);
    // The reset control becomes hidden; keep keyboard focus on the visible waystone.
    previous?.focus({preventScroll:true});
  });
  document.addEventListener('courtyard:book', event => dock(event.detail.open));
  new MutationObserver(() => { motionState(); syncDialogue(); }).observe(world, {
    attributes:true, attributeFilter:['data-time', 'class']
  });
  reduced.addEventListener('change', motionState);
  document.addEventListener('visibilitychange', motionState);
  window.addEventListener('pagehide', () => {
    clearTimeout(spiritTimer); clearTimeout(residentTimer);
    familiar.classList.remove('is-greeting'); endEncounter();
  });
  dock(Boolean(document.querySelector('#story-reader[open]')));
  syncDialogue();
  selectSeason(null);
  familiar.hidden = life.hidden = false;
})();
