const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector(".primary-nav");
const galleryTrack = document.querySelector("[data-gallery-track]");
const galleryPrev = document.querySelector("[data-gallery-prev]");
const galleryNext = document.querySelector("[data-gallery-next]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function setMenu(open) {
  if (!menuToggle || !primaryNav) return;

  menuToggle.setAttribute("aria-expanded", String(open));
  const openLabel = menuToggle.dataset.labelOpen || "Open menu";
  const closeLabel = menuToggle.dataset.labelClose || "Close menu";
  menuToggle.setAttribute("aria-label", open ? closeLabel : openLabel);
  primaryNav.classList.toggle("is-open", open);
  document.body.classList.toggle("menu-open", open);
}

if (menuToggle && primaryNav) {
  menuToggle.addEventListener("click", () => {
    setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  primaryNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      menuToggle.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 899) setMenu(false);
  });
}

function galleryStep() {
  const item = galleryTrack?.querySelector(".gallery-item");
  if (!item || !galleryTrack) return 0;

  const gap = Number.parseFloat(getComputedStyle(galleryTrack).columnGap) || 0;
  return item.getBoundingClientRect().width + gap;
}

function updateGalleryControls() {
  if (!galleryTrack || !galleryPrev || !galleryNext) return;

  const maxScroll = galleryTrack.scrollWidth - galleryTrack.clientWidth;
  galleryPrev.disabled = galleryTrack.scrollLeft <= 2;
  galleryNext.disabled = galleryTrack.scrollLeft >= maxScroll - 2;
}

function moveGallery(direction) {
  if (!galleryTrack) return;

  galleryTrack.scrollBy({
    left: galleryStep() * direction,
    behavior: reduceMotion.matches ? "auto" : "smooth",
  });
}

galleryPrev?.addEventListener("click", () => moveGallery(-1));
galleryNext?.addEventListener("click", () => moveGallery(1));
galleryTrack?.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

  event.preventDefault();
  moveGallery(event.key === "ArrowLeft" ? -1 : 1);
});
galleryTrack?.addEventListener("scroll", updateGalleryControls, { passive: true });
window.addEventListener("resize", updateGalleryControls);
updateGalleryControls();

const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && !reduceMotion.matches) {
  document.body.classList.add("reveal-ready");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
  );

  revealItems.forEach((item) => observer.observe(item));
}

const year = document.querySelector("[data-year]");
if (year) year.textContent = String(new Date().getFullYear());

const daynightSection = document.querySelector("[data-daynight]");

function setupDayNight(section) {
  const tabs = Array.from(section.querySelectorAll("[data-daynight-tab]"));
  const panels = Array.from(section.querySelectorAll("[data-daynight-panel]"));
  if (tabs.length < 2 || panels.length !== tabs.length) return;

  const keys = tabs.map((tab) => tab.dataset.daynightTab);
  const panelFor = new Map(panels.map((panel) => [panel.dataset.daynightPanel, panel]));
  const trackFor = new Map(panels.map((panel) => [panel.dataset.daynightPanel, panel.querySelector(".daynight-track")]));
  const slidesFor = new Map();
  const itemsFor = new Map();
  trackFor.forEach((track, key) => {
    slidesFor.set(key, track ? Array.from(track.children) : []);
    itemsFor.set(key, track ? Array.from(track.querySelectorAll(".daynight-item")) : []);
  });

  const jumps = Array.from(section.querySelectorAll("[data-daynight-jump]"));
  const controls = section.querySelector("[data-daynight-controls]");
  const status = section.querySelector("[data-daynight-status]");
  const prevButton = section.querySelector("[data-daynight-prev]");
  const nextButton = section.querySelector("[data-daynight-next]");
  const crossButton = section.querySelector("[data-daynight-cross]");
  const crossFaces = Array.from(section.querySelectorAll("[data-daynight-cross-to]"));
  const videos = Array.from(section.querySelectorAll(".daynight-video"));
  let active = keys[0];
  let sectionVisible = true;
  let crossing = false;
  let handovers = 0;
  let ticking = false;

  function pad(value) {
    return value < 10 ? "0" + value : String(value);
  }

  /* Which slide sits closest to the middle of the track's own viewport. */
  function nearest(track, list) {
    if (!track || !list.length) return 0;

    const center = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestGap = Infinity;
    list.forEach((node, index) => {
      const gap = Math.abs(node.offsetLeft + node.offsetWidth / 2 - center);
      if (gap < bestGap) {
        bestGap = gap;
        best = index;
      }
    });
    return best;
  }

  /* `jump` has to land in one go. Passing behavior "auto" would not do it: that
     means "whatever CSS says", and CSS says smooth, so the track would still be
     gliding into place while the code below decides what it is parked on. */
  function scrollToSlide(key, index, jump) {
    const track = trackFor.get(key);
    const slides = slidesFor.get(key);
    if (!track || !slides.length) return;

    const slide = slides[Math.min(slides.length - 1, Math.max(0, index))];
    const left = Math.max(0, Math.round(slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2));
    if (!jump && !reduceMotion.matches) {
      track.scrollTo({ left, behavior: "smooth" });
      return;
    }

    const inline = track.style.scrollBehavior;
    track.style.scrollBehavior = "auto";
    track.scrollLeft = left;
    track.style.scrollBehavior = inline;
  }

  function scrollToItem(key, itemIndex, jump) {
    const slides = slidesFor.get(key);
    const items = itemsFor.get(key);
    if (!items.length) return;

    const item = items[Math.min(items.length - 1, Math.max(0, itemIndex))];
    scrollToSlide(key, slides.indexOf(item), jump);
  }

  /* Exactly one clip runs: the scene the active track is snapped to. A slide
     that merely peeks in from the side does not count, which is why this reads
     the snapped index instead of an intersection ratio. */
  function syncPlayback() {
    const track = trackFor.get(active);
    const items = itemsFor.get(active);
    const snapped = track && items.length ? items[nearest(track, items)] : null;
    const wanted = sectionVisible && !reduceMotion.matches && snapped ? snapped.querySelector(".daynight-video") : null;

    videos.forEach((video) => {
      if (video === wanted) {
        if (!video.paused) return;
        const started = video.play();
        if (started && typeof started.catch === "function") started.catch(() => {});
      } else if (!video.paused) {
        video.pause();
      }
    });
  }

  /* The tab a sentinel slide hands over to, but only once the track has come to
     rest on it. Reading the settled scroll position is what makes this reliable:
     an IntersectionObserver reports the frame its threshold is crossed, which is
     still mid-scroll, and then never reports the resting position at all. */
  function edgeSentinel() {
    const track = trackFor.get(active);
    const slides = slidesFor.get(active);
    if (!track || !slides.length) return null;

    const maxScroll = track.scrollWidth - track.clientWidth;
    if (maxScroll <= 0) return null;

    const slide = slides[nearest(track, slides)];
    const toKey = slide && slide.dataset ? slide.dataset.daynightJump : null;
    if (!toKey || !panelFor.has(toKey)) return null;

    const forward = keys.indexOf(toKey) > keys.indexOf(active);
    const parked = forward ? track.scrollLeft >= maxScroll - 4 : track.scrollLeft <= 4;
    return parked ? toKey : null;
  }

  function updateControls() {
    const track = trackFor.get(active);
    const items = itemsFor.get(active);
    if (!track) return;

    /* The depth guard is insurance only: after a handover the incoming track is
       parked on a scene, never on a sentinel, so this never nests twice. */
    if (!crossing && handovers < 2) {
      const handover = edgeSentinel();
      if (handover) {
        handovers += 1;
        try {
          jumpTo(handover, active);
        } finally {
          handovers -= 1;
        }
        return;
      }
    }

    if (status && items.length) {
      status.textContent = pad(nearest(track, items) + 1) + " / " + pad(items.length);
    }

    const maxScroll = track.scrollWidth - track.clientWidth;
    if (prevButton) prevButton.disabled = track.scrollLeft <= 2;
    if (nextButton) nextButton.disabled = track.scrollLeft >= maxScroll - 2;
    syncPlayback();
  }

  function onTrackScroll() {
    if (ticking) return;

    ticking = true;
    window.requestAnimationFrame(() => {
      ticking = false;
      updateControls();
    });
  }

  function moveTrack(direction) {
    const track = trackFor.get(active);
    const slides = slidesFor.get(active);
    if (!track || !slides.length) return;

    scrollToSlide(active, nearest(track, slides) + direction);
  }

  /* Where the bar button hands over to: the next panel, or the previous one
     once the last panel is showing. */
  function crossTarget() {
    const index = keys.indexOf(active);
    return keys[index < keys.length - 1 ? index + 1 : index - 1];
  }

  /* One button, two faces: swapping the label rather than swapping buttons is
     what lets it keep focus through a handover it triggered itself. */
  function updateCross() {
    const toKey = crossTarget();
    crossFaces.forEach((face) => {
      face.hidden = face.dataset.daynightCrossTo !== toKey;
    });
  }

  function selectTab(key, options) {
    if (!panelFor.has(key)) return;

    active = key;
    tabs.forEach((tab) => {
      const on = tab.dataset.daynightTab === key;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && options && options.focus) tab.focus();
    });
    panelFor.forEach((panel, panelKey) => {
      panel.hidden = panelKey !== key;
    });
    updateCross();
    updateControls();
  }

  /* Showing a panel and placing its track is one step: in between, the incoming
     track still sits wherever it was left, which for the night track is on its
     own sentinel. `crossing` keeps that half-finished state from handing over
     again and bouncing back where it came from. */
  function showPanel(key, itemIndex, options) {
    const incoming = panelFor.get(key);
    const held = document.activeElement;
    /* Hiding the outgoing panel drops whatever it held on <body>, so a visitor
       who swiped or arrowed across would lose the caret. Carry it over. */
    const focusLeaves = !!(held && incoming && !incoming.contains(held) && panels.some((panel) => panel.contains(held)));

    crossing = true;
    selectTab(key, options);
    scrollToItem(key, itemIndex, true);
    crossing = false;

    if (focusLeaves && !(options && options.focus)) {
      const track = trackFor.get(key);
      if (track) track.focus({ preventScroll: true });
    }
    updateControls();
  }

  /* Clicking a tab always lands on the first scene of that panel. */
  function openTab(key, options) {
    showPanel(key, 0, options);
  }

  /* A sentinel slide carried us across; enter the new track from the matching edge. */
  function jumpTo(toKey, fromKey) {
    if (crossing || !panelFor.has(toKey) || toKey === fromKey) return;

    const forward = keys.indexOf(toKey) > keys.indexOf(fromKey);
    showPanel(toKey, forward ? 0 : itemsFor.get(toKey).length - 1);
  }

  /* Swiping onto the sentinel is what crosses the boundary. The sentinel holds
     no control of its own: anything focusable in there can only be reached by
     scrolling the track onto the sentinel, and that scroll is the handover, so
     the panel would be gone before the control could be pressed (WCAG 3.2.1).
     The reachable way across is the button in the bar. */
  jumps.forEach((jump) => {
    jump.hidden = false;
  });

  /* Arrow keys only reach this handler when focus is inside the track; the
     tablist lives outside it and keeps its own left/right handling. */
  trackFor.forEach((track, key) => {
    if (!track) return;

    track.addEventListener("scroll", onTrackScroll, { passive: true });
    track.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (key !== active) return;

      event.preventDefault();
      moveTrack(event.key === "ArrowLeft" ? -1 : 1);
    });
  });

  prevButton?.addEventListener("click", () => moveTrack(-1));
  nextButton?.addEventListener("click", () => moveTrack(1));
  crossButton?.addEventListener("click", () => jumpTo(crossTarget(), active));

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => openTab(keys[index]));

    tab.addEventListener("keydown", (event) => {
      let next = -1;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      if (next < 0) return;

      event.preventDefault();
      openTab(keys[next], { focus: true });
    });
  });

  /* Which scene plays is decided by the snap position; this only says whether
     the section is on screen at all, so nothing runs while the visitor is
     somewhere else on the page. */
  if (reduceMotion.matches) {
    videos.forEach((video) => video.setAttribute("controls", ""));
  } else if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          sectionVisible = entry.isIntersecting;
        });
        syncPlayback();
      },
      { threshold: 0 },
    );

    sectionObserver.observe(section);
  }

  section.classList.add("is-swipe");
  if (controls) controls.hidden = false;
  showPanel(keys[0], 0);

  window.addEventListener("resize", updateControls);
}

if (daynightSection) setupDayNight(daynightSection);

const bgmPlayer = document.querySelector("[data-bgm]");

function setupBgm(root) {
  const audio = root.querySelector("[data-bgm-audio]");
  if (!audio) return;

  const PLAY_KEY = "onestep.bgm.playing";
  const VOLUME_KEY = "onestep.bgm.volume";
  const playLabel = root.dataset.bgmPlayLabel || "Play background music";
  const pauseLabel = root.dataset.bgmPauseLabel || "Pause background music";
  const trackName = root.dataset.bgmTitle || "Background music";
  const volumeLabel = root.dataset.bgmVolumeLabel || "Volume";

  function readStored(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function writeStored(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      /* private browsing rejects writes; the player still works for this visit */
    }
  }

  audio.removeAttribute("controls");

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "bgm-toggle";
  toggle.setAttribute("aria-pressed", "false");
  toggle.setAttribute("aria-label", playLabel);

  const icon = document.createElement("span");
  icon.className = "bgm-icon";
  icon.setAttribute("aria-hidden", "true");
  toggle.append(icon);

  const name = document.createElement("span");
  name.className = "bgm-name";
  name.textContent = trackName;

  const progress = document.createElement("progress");
  progress.className = "bgm-progress";
  progress.max = 1;
  progress.value = 0;
  progress.setAttribute("aria-hidden", "true");

  const meta = document.createElement("div");
  meta.className = "bgm-meta";
  meta.append(name, progress);

  const volume = document.createElement("input");
  volume.type = "range";
  volume.className = "bgm-volume";
  volume.min = "0";
  volume.max = "1";
  volume.step = "0.05";
  volume.setAttribute("aria-label", volumeLabel);

  root.append(toggle, meta, volume);
  root.classList.add("is-enhanced");

  const storedVolume = Number.parseFloat(readStored(VOLUME_KEY));
  audio.volume = Number.isFinite(storedVolume) ? Math.min(1, Math.max(0, storedVolume)) : 0.5;
  volume.value = String(audio.volume);

  function render() {
    const playing = !audio.paused && !audio.ended;
    toggle.setAttribute("aria-pressed", String(playing));
    toggle.setAttribute("aria-label", playing ? pauseLabel : playLabel);
    root.classList.toggle("is-playing", playing);
  }

  function requestPlay() {
    const started = audio.play();
    if (started && typeof started.catch === "function") started.catch(() => render());
  }

  toggle.addEventListener("click", () => {
    if (audio.paused) requestPlay();
    else audio.pause();
  });

  volume.addEventListener("input", () => {
    audio.volume = Number(volume.value);
    writeStored(VOLUME_KEY, volume.value);
  });

  audio.addEventListener("play", () => {
    writeStored(PLAY_KEY, "1");
    render();
  });

  audio.addEventListener("pause", () => {
    writeStored(PLAY_KEY, "0");
    render();
  });

  audio.addEventListener("timeupdate", () => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    progress.value = audio.currentTime / audio.duration;
  });

  window.addEventListener("pagehide", () => {
    writeStored(PLAY_KEY, audio.paused ? "0" : "1");
  });

  render();

  if (readStored(PLAY_KEY) === "1") {
    const gestures = ["pointerdown", "keydown", "touchstart"];
    const resume = () => {
      gestures.forEach((type) => document.removeEventListener(type, resume));
      requestPlay();
    };

    gestures.forEach((type) => document.addEventListener(type, resume, { passive: true }));
  }
}

if (bgmPlayer) setupBgm(bgmPlayer);
