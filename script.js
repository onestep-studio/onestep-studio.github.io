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
  const scroller = section.querySelector(".daynight-scroll");
  const sticky = section.querySelector(".daynight-sticky");
  const tabs = Array.from(section.querySelectorAll("[data-daynight-tab]"));
  const panels = Array.from(section.querySelectorAll("[data-daynight-panel]"));
  if (!scroller || !sticky || tabs.length < 2 || panels.length !== tabs.length) return;

  const keys = tabs.map((tab) => tab.dataset.daynightTab);
  const panelFor = new Map(panels.map((panel) => [panel.dataset.daynightPanel, panel]));
  const trackFor = new Map(panels.map((panel) => [panel.dataset.daynightPanel, panel.querySelector(".daynight-track")]));
  const videos = Array.from(section.querySelectorAll(".daynight-video"));
  let active = keys[0];
  let stickyTop = 0;
  let ticking = false;

  if (reduceMotion.matches) {
    videos.forEach((video) => video.setAttribute("controls", ""));
    return;
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
  }

  function measure() {
    const previous = active;
    let longest = 0;

    panelFor.forEach((panel, key) => {
      panelFor.forEach((other, otherKey) => {
        other.hidden = otherKey !== key;
      });
      const track = trackFor.get(key);
      if (track) longest = Math.max(longest, track.scrollHeight - panel.clientHeight);
    });
    panelFor.forEach((panel, key) => {
      panel.hidden = key !== previous;
    });

    stickyTop = Number.parseFloat(getComputedStyle(sticky).top) || 0;
    const span = Math.max(longest, Math.round(window.innerHeight * 0.6));
    const height = Math.round(sticky.getBoundingClientRect().height + span * keys.length);
    section.style.setProperty("--daynight-scroll", height + "px");
  }

  function update() {
    const rect = scroller.getBoundingClientRect();
    const travel = rect.height - sticky.getBoundingClientRect().height;
    const progress = travel > 0 ? Math.min(1, Math.max(0, (stickyTop - rect.top) / travel)) : 0;
    const slot = Math.min(keys.length - 1, Math.floor(progress * keys.length));

    if (keys[slot] !== active) selectTab(keys[slot]);

    keys.forEach((key, index) => {
      const track = trackFor.get(key);
      const panel = panelFor.get(key);
      if (!track || !panel || panel.hidden) return;

      const overflow = Math.max(0, track.scrollHeight - panel.clientHeight);
      const local = Math.min(1, Math.max(0, progress * keys.length - index));
      track.style.transform = "translate3d(0, " + (-overflow * local).toFixed(2) + "px, 0)";
    });
  }

  function scrollToTab(key) {
    const index = keys.indexOf(key);
    if (index < 0) return;

    const rect = scroller.getBoundingClientRect();
    const travel = Math.max(0, rect.height - sticky.getBoundingClientRect().height);
    const top = rect.top + window.scrollY - stickyTop + (travel * index) / keys.length + 1;
    window.scrollTo({ top: Math.round(top), behavior: "smooth" });
  }

  function onScroll() {
    if (ticking) return;

    ticking = true;
    window.requestAnimationFrame(() => {
      ticking = false;
      update();
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      selectTab(keys[index]);
      scrollToTab(keys[index]);
    });

    tab.addEventListener("keydown", (event) => {
      let next = -1;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      if (next < 0) return;

      event.preventDefault();
      selectTab(keys[next], { focus: true });
      scrollToTab(keys[next]);
    });
  });

  if ("IntersectionObserver" in window) {
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            const started = video.play();
            if (started && typeof started.catch === "function") started.catch(() => {});
          } else if (!video.paused) {
            video.pause();
          }
        });
      },
      { threshold: 0.35 },
    );

    videos.forEach((video) => videoObserver.observe(video));
  }

  section.classList.add("is-scroll-driven");
  selectTab(keys[0]);
  measure();
  update();

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    measure();
    update();
  });
  window.addEventListener("load", () => {
    measure();
    update();
  });
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
