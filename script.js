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

const nemesisEntries = Object.freeze({
  elder: { name: "태고의 트롤", region: "본편 네메시스", epithet: "짐승과 고블린이 따르는 가장 오래된 거인", lore: "산맥이 생기기 전부터 잠들어 있던 원초의 트롤. 이끼 낀 돌갑옷과 룬이 새겨진 주먹으로 성벽과 전열을 함께 짓누른다.", traits: ["태고의 거체", "석갑", "움직이는 산"], image: "/assets/nemesis/elder-troll.png" },
  bloom: { name: "개화의 폭군", region: "봄 네메시스", epithet: "생명을 축복이 아닌 지배로 바꾸는 고목", lore: "끝없이 피어나는 봄의 생명력을 독점한 폭군. 찬란한 꽃 아래에는 침입자를 옥죄는 가시와 굶주린 뿌리가 꿈틀거린다.", traits: ["폭주하는 생명", "가시 갑주", "붉은 핵"], image: "/assets/nemesis/bloom-tyrant.png" },
  inferno: { name: "작열의 화신", region: "여름 네메시스", epithet: "한낮의 열기를 갑주에 가둔 살아 있는 화산", lore: "검은 암석 갑주 사이로 용암이 흐르는 여름의 화신. 전장에 내딛는 모든 걸음이 열기를 퍼뜨리고, 분노는 불길이 되어 솟구친다.", traits: ["용암 심장", "흑요석 갑주", "불타는 압박"], image: "/assets/nemesis/blazing-avatar.png" },
  reaper: { name: "수확의 사신", region: "가을 네메시스", epithet: "곡식과 생명을 구분하지 않는 마지막 수확자", lore: "황금 들판이 고개를 숙일 때 나타나는 침묵의 수확자. 초승달 낫과 외눈으로 가장 빛나는 생명을 골라 끝까지 뒤쫓는다.", traits: ["집요한 추적", "초승달 낫", "침묵의 수확"], image: "/assets/nemesis/harvest-reaper.png" },
  frost: { name: "혹한의 군주", region: "겨울 네메시스", epithet: "겨울 왕관 아래 모든 숨결을 굴복시키는 군주", lore: "얼음 왕관과 결정의 주먹을 지닌 북방의 지배자. 그가 선 전장은 숨조차 무거워지고, 푸른 냉기가 물러설 길을 지운다.", traits: ["빙결의 위엄", "결정 주먹", "북방의 왕관"], image: "/assets/nemesis/frost-monarch.png" },
});

const nemesisDialog = document.querySelector("[data-nemesis-dialog]");
const nemesisClose = document.querySelector("[data-nemesis-close]");
let nemesisLastTrigger = null;

function closeNemesisDialog() {
  if (!nemesisDialog || nemesisDialog.hidden) return;
  nemesisDialog.hidden = true;
  nemesisDialog.setAttribute("aria-hidden", "true");
  document.body.classList.remove("nemesis-dialog-open");
  if (nemesisLastTrigger) nemesisLastTrigger.focus();
}

function openNemesisDialog(card) {
  const entry = nemesisEntries[card.dataset.nemesisCard];
  if (!nemesisDialog || !entry) return;
  nemesisLastTrigger = card;
  const image = nemesisDialog.querySelector("[data-nemesis-image]");
  image.src = entry.image;
  image.alt = entry.name;
  nemesisDialog.querySelector("[data-nemesis-region]").textContent = entry.region;
  nemesisDialog.querySelector("[data-nemesis-name]").textContent = entry.name;
  nemesisDialog.querySelector("[data-nemesis-epithet]").textContent = entry.epithet;
  nemesisDialog.querySelector("[data-nemesis-lore]").textContent = entry.lore;
  nemesisDialog.querySelector("[data-nemesis-traits]").replaceChildren(...entry.traits.map((trait) => {
    const item = document.createElement("li");
    item.textContent = trait;
    return item;
  }));
  nemesisDialog.hidden = false;
  nemesisDialog.setAttribute("aria-hidden", "false");
  document.body.classList.add("nemesis-dialog-open");
  nemesisClose?.focus();
}

document.querySelectorAll("[data-nemesis-card]").forEach((card) => card.addEventListener("click", () => openNemesisDialog(card)));
nemesisClose?.addEventListener("click", closeNemesisDialog);
nemesisDialog?.addEventListener("click", (event) => { if (event.target === nemesisDialog) closeNemesisDialog(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeNemesisDialog(); });
