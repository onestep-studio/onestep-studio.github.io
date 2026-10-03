/* Game art and hit timing: Unit.StartAttack/TakeDamage, HeroAttackFX and CombatDeathEcho.
   This small scenery simulation has its own HP; it never changes the player's saved game. */
(() => {
  'use strict';
  const GATE = {x:900, y:548};
  const POST = {x:850, y:668};
  const HOME = {x:754, y:665};
  const SLOTS = [{x:913,y:650}, {x:927,y:710}, {x:796,y:724}];
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);

  class Encounter {
    constructor(manifest) { this.manifest=manifest; this.reset(); }
    reset() {
      this.time=0; this.phase='waiting'; this.wait=1.9; this.units=[];
      this.effects=[]; this.hits=0; this.wave=0;
    }
    actor(id, x, y, slot, delay=0) {
      const def=this.manifest.actors[id];
      return {id,def,x,y,slot,delay,hp:def.hp,state:'idle',clock:0,cooldown:0,
        facing:1,target:null,struck:false,hitAt:-10,deathAt:null,punch:0,flash:.07};
    }
    start() {
      this.phase='entering'; this.wave++;
      this.hero=this.actor('guardian',HOME.x,HOME.y,POST);
      this.units=[this.hero, ...['spear-goblin','torch-goblin','gnome'].map((id,i) =>
        this.actor(id,GATE.x+(i-1)*19,GATE.y-20-i*25,SLOTS[i],.5+i*.5))];
      this.effects=[];
    }
    setState(unit,state) { if(unit.state!==state) { unit.state=state; unit.clock=0; } }
    move(unit,to,dt) {
      const d=distance(unit,to);
      if(d<=2) { unit.x=to.x; unit.y=to.y; this.setState(unit,'idle'); return true; }
      const step=Math.min(d,unit.def.speed*dt);
      unit.x+=(to.x-unit.x)/d*step; unit.y+=(to.y-unit.y)/d*step;
      if(Math.abs(to.x-unit.x)>2) unit.facing=to.x<unit.x?-1:1;
      this.setState(unit,'run'); return false;
    }
    attack(unit,target) {
      unit.target=target; unit.struck=false; unit.clock=0; unit.state='attack';
      unit.facing=target.x<unit.x?-1:1;
      unit.cooldown=unit.def.interval;
    }
    fps(unit) {
      const frames=unit.def.states[unit.state].frames;
      return unit.state==='attack' && unit.def.hero ? Math.max(unit.def.fps,frames/unit.def.interval) : unit.def.fps;
    }
    strike(unit) {
      const target=unit.target;
      if(!target || target.hp<=0 || unit.hp<=0 || distance(unit,target)>102) return;
      const damage=unit.def.damage*(1-target.def.reduction);
      target.hp=Math.max(0,target.hp-damage); target.hitAt=this.time; this.hits++;
      const killed=target.hp===0;
      target.punch=killed ? .32 : .16; target.flash=killed ? .13 : .07;
      const dx=target.x-unit.x, dy=target.y-unit.y, length=Math.hypot(dx,dy)||1;
      target.hitDirection={x:dx/length,y:dy/length};
      this.effects.push({type:'hit',x:target.x-dx/length*7,y:target.y-38-dy/length*7,
        time:this.time,life:killed ? .16 : .10,killed});
      this.effects.push({type:'number',x:target.x,y:target.y-74,time:this.time,life:.65,
        amount:Math.round(damage),hero:target.def.hero,killed});
      if(unit.def.hero) this.effects.push({type:'slash',x:unit.x+unit.facing*63,
        y:unit.y-unit.def.size*(unit.def.anchor-.5),
        facing:unit.facing,time:this.time,life:8/24});
      if(killed) { target.deathAt=this.time; target.target=null; }
    }
    tick(dt) {
      // Fixed small steps in the browser preserve contact events after a long frame.
      this.time+=dt;
      this.effects=this.effects.filter(effect=>this.time-effect.time<effect.life);
      if(this.phase==='waiting') {
        this.wait-=dt; if(this.wait<=0) this.start(); return;
      }
      for(const unit of this.units) {
        if(unit.hp<=0) continue;
        unit.clock+=dt; unit.cooldown=Math.max(0,unit.cooldown-dt);
        if(unit.delay>0) { unit.delay-=dt; continue; }
        if(unit.state==='attack') {
          const fps=this.fps(unit), frames=unit.def.states.attack.frames;
          if(!unit.struck && unit.clock*fps>=Math.min(frames-1,unit.def.hitFrame)) {
            unit.struck=true; this.strike(unit);
          }
          if(unit.clock>=frames/fps) this.setState(unit,'idle');
          else continue;
        }
        if(this.phase==='returning') { this.move(unit,HOME,dt); continue; }
        if(this.phase==='entering') {
          // All three enter the gate before combat begins, rather than teleporting beside the hero.
          this.move(unit,unit.slot,dt);
          if(!unit.def.hero) unit.facing=this.hero.x<unit.x?-1:1;
          continue;
        }
        if(unit.def.hero) {
          const enemies=this.units.filter(other=>!other.def.hero && other.hp>0);
          const target=enemies.sort((a,b)=>distance(unit,a)-distance(unit,b))[0];
          if(target && unit.cooldown===0) this.attack(unit,target);
        } else if(this.hero.hp>0 && unit.cooldown===0) this.attack(unit,this.hero);
      }
      if(this.phase==='entering' && this.units.every(unit=>unit.delay<=0 && distance(unit,unit.slot)<=2)) {
        this.phase='fighting';
        // Stagger contact frames so three different attacks remain readable.
        this.units.forEach((unit,i)=>unit.cooldown=unit.def.hero ? .22 : i*.18);
      }
      if(this.phase==='fighting' && this.units.slice(1).every(unit=>unit.hp===0)) {
        this.phase='victory'; this.wait=1.6;
      }
      if(this.phase==='victory') {
        this.wait-=dt;
        if(this.wait<=0) { this.phase='returning'; this.setState(this.hero,'run'); }
      }
      if(this.phase==='returning' && distance(this.hero,HOME)<=2) {
        this.phase='waiting'; this.units=[]; this.wait=13;
      }
    }
  }
  if(typeof module!=='undefined' && module.exports) module.exports={Encounter};
  if(typeof document==='undefined') return;
  const world=document.querySelector('[data-world]');
  const layer=world?.querySelector('.courtyard-actors');
  if(!layer) return;
  const landscape=world.querySelector('.world-landscape');
  const canvas=document.createElement('canvas');
  canvas.className='courtyard-combat'; canvas.width=1536; canvas.height=1024;
  canvas.hidden=true; canvas.setAttribute('aria-hidden','true'); layer.append(canvas);
  const ctx=canvas.getContext('2d');
  if(!ctx) return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const base='/assets/world/combat/';
  const images=new Map();
  let encounter, loading, raf=0, last=0, visible=true, book=false, panel=false, leaving=false, accumulator=0;
  const usable=()=>world.dataset.time==='night' && !reduced.matches &&
    !world.classList.contains('motion-paused') && !world.classList.contains('resident-talking') &&
    !document.hidden && visible && !book && !panel && !leaving;
  function raidState(active) {
    // Removing an absent class still mutates its attribute in Chromium. The observers
    // for scenery and dialogue must receive a change only when the raid actually changes.
    if(world.classList.contains('night-encounter')!==active) world.classList.toggle('night-encounter',active);
  }
  function load() {
    if(loading) return loading;
    loading=fetch(base+'manifest.json?v=1').then(response=> {
      if(!response.ok) throw new Error('Combat art HTTP '+response.status);
      return response.json();
    }).then(async manifest=> {
      const sources=[...Object.values(manifest.actors).flatMap(actor=>Object.values(actor.states)), ...Object.values(manifest.effects)];
      await Promise.all(sources.map(source=>new Promise((resolve,reject)=> {
        const image=new Image(); image.onload=()=>{images.set(source.file,image);resolve();};
        image.onerror=reject; image.src=base+source.file+'?v='+manifest.version;
      })));
      encounter=new Encounter(manifest);
    }).catch(()=> { loading=null; raidState(false); });
    return loading;
  }
  function sprite(file,frames,frame,x,y,size,anchor,facing=1,alpha=1,sx=1,sy=1,tint=null) {
    const image=images.get(file); if(!image) return;
    const cell=image.width/frames;
    ctx.save(); ctx.translate(x,y); ctx.scale(facing*sx,sy); ctx.globalAlpha=alpha;
    ctx.drawImage(image,frame*cell,0,cell,image.height,-size/2,-size*anchor,size,size);
    // Canvas multiply must be masked to the current frame, never to the whole landscape.
    if(tint) {
      const buffer=tintFrame.getContext('2d');
      buffer.clearRect(0,0,192,192); buffer.globalCompositeOperation='source-over';
      buffer.drawImage(image,frame*cell,0,cell,image.height,0,0,192,192);
      buffer.globalCompositeOperation='multiply'; buffer.fillStyle=tint; buffer.fillRect(0,0,192,192);
      buffer.globalCompositeOperation='destination-in';
      buffer.drawImage(image,frame*cell,0,cell,image.height,0,0,192,192);
      ctx.drawImage(tintFrame,-size/2,-size*anchor,size,size);
    }
    ctx.restore();
  }
  const tintFrame=document.createElement('canvas'); tintFrame.width=tintFrame.height=192;
  function draw() {
    ctx.clearRect(0,0,1536,1024);
    const sizeScale=landscape.clientWidth<600 ? 1.3 : 1;
    raidState(encounter.units.length>0);
    canvas.dataset.phase=encounter.phase; canvas.dataset.wave=String(encounter.wave);
    for(const unit of [...encounter.units].sort((a,b)=>a.y-b.y)) {
      if(unit.delay>0) continue;
      const age=encounter.time-unit.hitAt, dead=unit.deathAt!==null;
      const death=dead?clamp((encounter.time-unit.deathAt)/.22,0,1):0;
      if(death===1) continue;
      const state=unit.def.states[unit.state], frames=state.frames;
      const frame=unit.state==='attack'?Math.min(frames-1,Math.floor(unit.clock*encounter.fps(unit))):Math.floor(unit.clock*unit.def.fps)%frames;
      const e=age<.12?unit.punch*(1-age/.12):0;
      const dx=dead?unit.hitDirection.x*9*(1-(1-death)**2):0;
      const dy=dead?unit.hitDirection.y*9*(1-(1-death)**2):0;
      // Original sheets have no ground shadow. Keep the ellipse at the fixed foot anchor.
      ctx.save(); ctx.globalAlpha=(1-death)*.3; ctx.fillStyle='#000';
      ctx.beginPath(); ctx.ellipse(unit.x,unit.y-1,(unit.def.hero?24:17)*sizeScale,6*sizeScale,0,0,Math.PI*2); ctx.fill(); ctx.restore();
      sprite(state.file,frames,frame,unit.x+dx,unit.y+dy,unit.def.size*sizeScale,unit.def.anchor,unit.facing,1-death*death,
        dead ? 1+.16*(1-death) : 1+e,dead ? 1-.28*death : 1-e*.65,
        dead ? '#ff4729' : age<unit.flash ? '#ff664d' : null);
      if(!dead && (encounter.phase==='fighting' || age<.7)) {
        const y=unit.y-unit.def.size*sizeScale*.62, width=(unit.def.hero?46:34)*sizeScale;
        ctx.fillStyle='#07121deb'; ctx.fillRect(unit.x-width/2-1,y-1,width+2,5);
        ctx.fillStyle=unit.def.hero?'#b8db91':'#df8471'; ctx.fillRect(unit.x-width/2,y,width*unit.hp/unit.def.hp,3);
      }
    }
    for(const fx of encounter.effects) {
      const age=encounter.time-fx.time, k=age/fx.life;
      if(fx.type==='slash') {
        const source=encounter.manifest.effects.slash, frame=Math.min(7,Math.floor(age*24));
        // 128px effect / 192px hero cell preserves HeroAttackFX's shared world scale.
        sprite(source.file,8,frame,fx.x,fx.y,127*sizeScale,.5,fx.facing,clamp((7-frame)/4,0,1));
      } else if(fx.type==='hit') {
        const pop=1-(1-k)**3, fade=clamp((k-.28)/.72,0,1);
        const size=(fx.killed?34:22)*(.8+(fx.killed?.28:.24)*pop)*sizeScale;
        sprite(encounter.manifest.effects.spark.file,1,0,fx.x,fx.y,size,.5,1,1-fade*fade);
      } else {
        ctx.save(); ctx.globalAlpha=1-k*k; ctx.font=(fx.killed?'bold 19px':'bold 16px')+' system-ui';
        ctx.textAlign='center'; ctx.lineWidth=3; ctx.strokeStyle='#07121d';
        ctx.fillStyle=fx.hero?'#ffc1ac':'#fff0cd';
        ctx.strokeText(String(fx.amount),fx.x,fx.y-26*k); ctx.fillText(String(fx.amount),fx.x,fx.y-26*k); ctx.restore();
      }
    }
  }
  function stop() { cancelAnimationFrame(raf); raf=0; last=0; }
  function frame(now) {
    raf=0;
    if(!usable()) { sync(); return; }
    if(last) accumulator+=Math.min(.1,(now-last)/1000);
    last=now;
    while(accumulator>=1/60) { encounter.tick(1/60); accumulator-=1/60; }
    draw(); raf=requestAnimationFrame(frame);
  }
  async function sync() {
    if(world.dataset.time!=='night' || reduced.matches) {
      stop(); encounter?.reset(); accumulator=0; canvas.hidden=true;
      raidState(false); return;
    }
    if(!usable()) {
      stop();
      if(world.classList.contains('resident-talking')) {
        canvas.hidden=true; raidState(false);
      }
      return;
    }
    await load();
    if(!encounter || !usable()) return;
    canvas.hidden=false; draw(); if(!raf) raf=requestAnimationFrame(frame);
  }
  new MutationObserver(sync).observe(world,{attributes:true,attributeFilter:['data-time','class']});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting; sync();}).observe(landscape);
  reduced.addEventListener('change',sync);
  document.addEventListener('visibilitychange',sync);
  document.addEventListener('courtyard:book',event=>{book=event.detail.open;sync();});
  document.addEventListener('courtyard:panel',()=>{panel=Boolean(document.querySelector('[data-map-dialog][open], [data-life-dialog][open]'));sync();});
  window.addEventListener('pagehide',()=>{leaving=true;stop();});
  window.addEventListener('pageshow',()=>{leaving=false;sync();});
  sync();
})();
