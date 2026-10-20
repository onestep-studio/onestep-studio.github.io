/* OneStep Studio website analytics. The public measurement ID is not a secret. */
(() => {
  "use strict";

  const measurementId = "G-JHM93VNNYP";
  const productionHosts = new Set([
    "onestep-games.com", "www.onestep-games.com", "onestep-studio.github.io",
  ]);
  if (!productionHosts.has(location.hostname) || !/^G-[A-Z0-9]+$/.test(measurementId)
      || window["ga-disable-" + measurementId] || window.oneStepAnalyticsLoaded) return;
  window.oneStepAnalyticsLoaded = true;

  const pagePath = location.pathname.replace(/index\.html$/, "");
  const gameMatch = pagePath.match(/\/games\/([^/]+)\//);
  const gameId = gameMatch ? gameMatch[1] : /\/story\//.test(pagePath) ? "tiny-defense" : "studio";
  const pageType = /\/play\//.test(pagePath) ? "demo"
    : /\/story\//.test(pagePath) ? "story"
    : gameMatch ? "game" : /^\/(?:en\/|ja\/)?$/.test(pagePath) ? "home" : "other";
  const siteLanguage = document.documentElement.lang.split("-")[0] || "ko";

  // Keep campaign attribution; discard arbitrary query values and fragments.
  function cleanUrl(value, campaigns = false) {
    try {
      const url = new URL(value, location.href);
      if (!/^https?:$/.test(url.protocol)) return "";
      const result = new URL(url.origin + url.pathname);
      if (campaigns) {
        for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_id", "utm_term", "utm_content"]) {
          if (url.searchParams.has(key)) result.searchParams.set(key, url.searchParams.get(key));
        }
      }
      return result.href;
    } catch { return ""; }
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    page_location: cleanUrl(location.href, true),
    page_referrer: document.referrer ? cleanUrl(document.referrer) : "",
    page_path: pagePath,
    page_type: pageType,
    game_id: gameId,
    site_language: siteLanguage,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  const tag = document.createElement("script");
  tag.async = true;
  tag.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
  document.head.appendChild(tag);

  function position(link) {
    if (link.dataset.analyticsPosition) return link.dataset.analyticsPosition;
    if (link.closest("[data-map-dialog]")) return "courtyard_popup";
    if (link.closest(".brand-hero")) return "hero";
    if (link.closest("#stores")) return "store_section";
    if (link.closest(".game-library")) return "game_list";
    if (link.closest("footer")) return "footer";
    if (link.closest("header")) return "header";
    return "content";
  }

  function recordClick(event) {
    if ((event.type === "click" && event.button !== 0)
        || (event.type === "auxclick" && event.button !== 1)) return;
    const link = event.target.closest?.("a[href]");
    if (!link) return;
    let url;
    try { url = new URL(link.href, location.href); } catch { return; }
    const stores = {
      "play.google.com": "google_play",
      "apps.apple.com": "app_store",
      "m.onestore.co.kr": "onestore",
      "onestore.co.kr": "onestore",
      "store.steampowered.com": "steam",
    };
    const store = stores[url.hostname];
    let eventName, targetGame = gameId;
    if (store) {
      eventName = "store_click";
    } else if (url.origin === location.origin && link.matches(".game-card")) {
      const match = url.pathname.match(/\/games\/([^/]+)\//);
      if (!match) return;
      eventName = "game_select";
      targetGame = match[1];
    } else return;

    window.gtag("event", eventName, {
      send_to: measurementId,
      game_id: targetGame,
      ...(store ? { store } : {}),
      link_position: position(link),
      link_url: cleanUrl(url.href),
      page_path: pagePath,
      page_type: pageType,
      site_language: siteLanguage,
      transport_type: "beacon",
    });
  }
  // Delegation also covers store links cloned into the courtyard popup.
  document.addEventListener("click", recordClick, true);
  document.addEventListener("auxclick", recordClick, true);
})();
