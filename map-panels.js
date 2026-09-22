/* One map, one open destination. Media exists only while its panel is open. */
(() => {
  'use strict';
  const dialog = document.querySelector('[data-map-dialog]');
  if (!dialog) return;
  const content = dialog.querySelector('[data-map-content]');
  const heading = dialog.querySelector('#map-panel-title');
  const close = dialog.querySelector('[data-map-close]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let trigger, scene = 0, entrance;
  const notify = () => document.dispatchEvent(new CustomEvent('courtyard:panel'));
  function clearMedia() {
    content.querySelectorAll('video').forEach(video => { video.pause(); video.removeAttribute('src'); video.load(); });
    content.querySelectorAll('iframe').forEach(frame => { frame.src='about:blank'; frame.remove(); });
  }
  function showScene(index) {
    const scenes = [...content.querySelectorAll('[data-guide-scene]')];
    if (!scenes.length) return;
    scene = Math.max(0, Math.min(scenes.length-1, index));
    scenes.forEach((article,i) => {
      article.hidden = i !== scene;
      const video=article.querySelector('video');
      if (i !== scene) video.pause();
      else {
        if (!video.getAttribute('src')) video.src=video.dataset.src;
        if (!reduced.matches && !document.hidden) video.play().catch(()=>{});
      }
    });
    content.querySelectorAll('[data-guide-jump]').forEach((button,i) => button.setAttribute('aria-pressed',String(i===scene)));
    content.querySelector('[data-guide-prev]').disabled=scene===0;
    content.querySelector('[data-guide-next]').disabled=scene===scenes.length-1;
    content.querySelector('[data-guide-progress]').textContent=`${scene+1} / ${scenes.length}`;
  }
  function fill(kind) {
    const template=document.querySelector(`template[data-map-template="${kind}"]`);
    if (!template) return false;
    clearMedia(); content.replaceChildren(template.content.cloneNode(true));
    dialog.dataset.panel=kind; heading.textContent=template.dataset.title;
    const frame=content.querySelector('iframe');
    if (frame) frame.src=frame.dataset.src;
    content.scrollTop=0; showScene(0); return true;
  }
  function open(kind, element) {
    if (!document.querySelector(`template[data-map-template="${kind}"]`)) return;
    const origin=element?.getBoundingClientRect();
    document.querySelector('#story-reader[open]')?.close();
    trigger=element?.closest('dialog') ? document.querySelector('.marker-gate') : (element || trigger);
    if (!fill(kind)) return;
    if (!dialog.open) dialog.showModal();
    notify(); close.focus({preventScroll:true});
    entrance?.cancel();
    if (!reduced.matches && origin && dialog.animate) {
      const rect=dialog.getBoundingClientRect();
      const x=Math.max(-innerWidth*.3,Math.min(innerWidth*.3,origin.left+origin.width/2-rect.left-rect.width/2));
      const y=Math.max(-innerHeight*.3,Math.min(innerHeight*.3,origin.top+origin.height/2-rect.top-rect.height/2));
      entrance=dialog.animate([{transform:`translate(${x}px,${y}px) scale(.65)`,opacity:0},{transform:'translate(0,0) scale(1)',opacity:1}],{duration:340,easing:'cubic-bezier(.2,.7,.2,1)'});
    }
  }
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{
    entrance?.cancel(); clearMedia(); content.replaceChildren(); notify();
    trigger?.focus({preventScroll:true});
  });
  document.addEventListener('click',event=>{
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link=event.target.closest('a');
    if (!link) return;
    let kind=link.dataset.mapOpen;
    const url=new URL(link.href,location.href);
    if (!kind && url.origin===location.origin) {
      if (/\/games\/tiny-defense\/play\/$/.test(url.pathname)) kind='game';
      else if (/\/games\/tiny-defense\/$/.test(url.pathname)) kind=url.hash==='#stores'?'stores':'day';
    }
    if (kind) { event.preventDefault(); open(kind,link); }
  });
  content.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if (!button) return;
    if (button.dataset.mapSwitch) { fill(button.dataset.mapSwitch); content.querySelector(`[data-map-switch="${dialog.dataset.panel}"]`).focus(); }
    else if (button.hasAttribute('data-guide-jump')) showScene(Number(button.dataset.guideJump));
    else if (button.hasAttribute('data-guide-prev')) showScene(scene-1);
    else if (button.hasAttribute('data-guide-next')) showScene(scene+1);
  });
  dialog.addEventListener('click',event=>{
    if (event.target!==dialog) return;
    const r=dialog.getBoundingClientRect();
    if (event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom) dialog.close();
  });
  window.addEventListener('message',event=>{
    const frame=content.querySelector('iframe');
    if (event.origin!==location.origin || event.source!==frame?.contentWindow) return;
    if (event.data?.type==='tiny-defense:close') dialog.close();
  });
  document.addEventListener('visibilitychange',()=>{
    content.querySelectorAll('video').forEach(video=>{ if(document.hidden) video.pause(); });
  });
  document.body.classList.add('world-ready');
})();
