/* Curved paper interaction inspired by MengTo/sketchbook.
 * Original implementation for live, accessible HTML story pages; no dependencies.
 */
(function (root) {
  'use strict';
  function splitLines(lines) {
    if (lines.length < 2) return lines.length;
    const total = lines.reduce((sum, line) => sum + line.text.length + 24, 0);
    let length = 0, split = 1, distance = Infinity;
    for (let i = 1; i < lines.length; i++) {
      length += lines[i - 1].text.length + 24;
      // The title occupies the left page, leaving slightly less room for dialogue.
      const delta = Math.abs(length - total * .43);
      if (delta < distance) { split = i; distance = delta; }
    }
    return split;
  }
  function hasArt(pages, index) {
    return !pages.slice(0, index).some(page => page.art === pages[index].art);
  }
  function geometry(progress, count = 16) {
    const t = Math.max(0, Math.min(1, progress));
    const bend = 34 * Math.sin(Math.PI * t);
    return { angle: 180 * t + bend, step: 2 * bend / count };
  }
  function create(spread, before, after, direction) {
    const width = spread.clientWidth, half = width / 2;
    const height = Math.max(before.height, after.height), count = 16, slice = half / count;
    const layer = document.createElement('div');
    layer.className = 'paper-turn ' + (direction > 0 ? 'forward' : 'backward');
    layer.setAttribute('aria-hidden', 'true'); layer.inert = true;
    spread.style.minHeight = height + 'px';
    function surface(snapshot, offset, parent) {
      const clip = document.createElement('div'); clip.className = 'paper-face';
      const clone = snapshot.node.cloneNode(true);
      clone.classList.remove('is-turning'); clone.classList.add('book-snapshot');
      clone.removeAttribute('data-book-spread');
      clone.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
      Object.assign(clone.style, { width: width + 'px', height: height + 'px', minHeight: height + 'px', left: -offset + 'px' });
      clip.append(clone); parent.append(clip); return clip;
    }
    for (const left of [true, false]) {
      const bed = document.createElement('div'); bed.className = 'paper-bed';
      Object.assign(bed.style, { left: left ? '0' : '50%', width: '50%' });
      surface((left === (direction > 0)) ? before : after, left ? 0 : half, bed);
      layer.append(bed);
    }
    const curl = document.createElement('div'); curl.className = 'paper-curl'; layer.append(curl);
    const strips = []; let parent = curl;
    for (let i = 0; i < count; i++) {
      const strip = document.createElement('div'); strip.className = 'paper-strip'; strip.style.width = slice + 'px';
      const frontOffset = direction > 0 ? half + i * slice : half - (i + 1) * slice;
      const backOffset = direction > 0 ? half - (i + 1) * slice : half + i * slice;
      surface(before, frontOffset, strip).classList.add('paper-front');
      surface(after, backOffset, strip).classList.add('paper-back');
      parent.append(strip); strips.push(strip); parent = strip;
    }
    spread.classList.add('is-turning'); spread.append(layer);
    let progress = 0, frame = 0;
    function set(value) {
      progress = Math.max(0, Math.min(1, value));
      const { angle, step } = geometry(progress, count);
      curl.style.transform = `rotateY(${-direction * angle}deg)`;
      strips.forEach((strip, i) => {
        strip.style.transform = i ? `rotateY(${direction * step}deg)` : '';
        strip.style.setProperty('--paper-shadow', String(.26 * (1 - Math.abs(Math.cos((angle - i * step) * Math.PI / 180)))));
      });
    }
    function dispose() {
      cancelAnimationFrame(frame); layer.remove(); spread.classList.remove('is-turning'); spread.style.minHeight = '';
    }
    function settle(commit, done) {
      const start = performance.now(), from = progress, to = commit ? 1 : 0;
      const duration = 220 + Math.abs(to - from) * 420;
      function tick(now) {
        const t = Math.min(1, (now - start) / duration);
        set(from + (to - from) * (1 - Math.pow(1 - t, 3)));
        if (t < 1) frame = requestAnimationFrame(tick);
        else { dispose(); done(commit); }
      }
      frame = requestAnimationFrame(tick);
    }
    set(0);
    return { set, settle, dispose };
  }
  const api = { splitLines, hasArt, geometry, create };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StoryPaper = api;
})(typeof window === 'undefined' ? globalThis : window);
