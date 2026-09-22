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
  function paperTransform(progress, direction) {
    const t = Math.max(0, Math.min(1, progress));
    return `rotateY(${-direction * 180 * t}deg) skewY(${direction * 1.6 * Math.sin(Math.PI * t)}deg)`;
  }
  function create(spread, before, after, direction) {
    const width = spread.clientWidth, half = width / 2;
    const height = Math.max(before.height, after.height);
    const layer = document.createElement('div');
    layer.className = 'paper-turn ' + (direction > 0 ? 'forward' : 'backward');
    layer.setAttribute('aria-hidden', 'true'); layer.inert = true;
    spread.style.minHeight = height + 'px';
    // Four half-pages total. Never clone a full spread into each curve segment.
    function surface(snapshot, left, parent) {
      const clip = document.createElement('div'); clip.className = 'paper-face';
      clip.classList.toggle('text-leaf', !left && snapshot.node.classList.contains('text-spread'));
      const original = snapshot.node.children[left ? 0 : 1];
      const clone = original.cloneNode(true);
      clone.classList.add('leaf-content');
      clone.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
      Object.assign(clone.style, { width: half + 'px', height: height + 'px', minHeight: height + 'px' });
      clip.append(clone); parent.append(clip); return clip;
    }
    for (const left of [true, false]) {
      const bed = document.createElement('div'); bed.className = 'paper-bed';
      Object.assign(bed.style, { left: left ? '0' : '50%', width: '50%' });
      surface(left === (direction > 0) ? before : after, left, bed);
      layer.append(bed);
    }
    const curl = document.createElement('div'); curl.className = 'paper-curl'; layer.append(curl);
    surface(before, direction < 0, curl).classList.add('paper-front');
    surface(after, direction > 0, curl).classList.add('paper-back');
    spread.classList.add('is-turning'); spread.append(layer);
    let progress = 0, frame = 0, animation = null, disposed = false;
    const transform = t => paperTransform(t, direction);
    function paint() { frame = 0; curl.style.transform = transform(progress); }
    function set(value) {
      progress = Math.max(0, Math.min(1, value));
      // Pointer events may run faster than the display; paint at most once per frame.
      if (!frame) frame = requestAnimationFrame(paint);
    }
    function dispose() {
      disposed = true; cancelAnimationFrame(frame); animation?.cancel();
      layer.remove(); spread.classList.remove('is-turning'); spread.style.minHeight = '';
    }
    function settle(commit, done) {
      cancelAnimationFrame(frame); frame = 0;
      const from = progress, to = commit ? 1 : 0;
      const duration = 180 + Math.abs(to - from) * 300;
      const finish = () => { if (!disposed) { dispose(); done(commit); } };
      // Transform-only keyframes can run on the compositor even while JS is busy.
      if (typeof Animation !== 'undefined' && curl.animate) {
        const frames = Array.from({length:25}, (_, i) => ({transform:transform(from+(to-from)*i/24)}));
        animation = curl.animate(frames, {duration, easing:'cubic-bezier(.22,.65,.3,1)', fill:'forwards'});
        animation.onfinish = finish;
      } else {
        // A fallback for older engines. Start timing after the first painted frame.
        let start;
        function tick(now) {
          if (start === undefined) start = now;
          const t = Math.min(1, (now-start)/duration);
          progress = from+(to-from)*(1-Math.pow(1-t,3)); paint();
          if (t < 1) frame=requestAnimationFrame(tick); else finish();
        }
        frame=requestAnimationFrame(tick);
      }
    }
    paint();
    return { set, settle, dispose };
  }
  const api = { splitLines, hasArt, paperTransform, create };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.StoryPaper = api;
})(typeof window === 'undefined' ? globalThis : window);
