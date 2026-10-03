/* Real Chrome verification and a reproducible motion preview. No npm dependencies.
   node tools/verify-courtyard-combat.cjs [--capture] */
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'), output=path.join(root,'output/qa/night-combat');
const capture=process.argv.includes('--capture');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.mp3':'audio/mpeg','.mp4':'video/mp4','.svg':'image/svg+xml'};
let chrome, server, socket;
async function main() {
  fs.mkdirSync(output,{recursive:true});
  server=http.createServer((req,res)=>{
    let relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(relative.endsWith('/')) relative+='index.html';
    const file=path.resolve(root,'.'+relative);
    if(!file.startsWith(root+path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const probe=http.createServer(); await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));
  const debugPort=probe.address().port; await new Promise(resolve=>probe.close(resolve));
  chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',[
    '--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',
    '--disable-background-networking','--hide-scrollbars','--remote-allow-origins=*',
    '--remote-debugging-port='+debugPort,'--user-data-dir='+path.join(output,'chrome-profile'),'about:blank'
  ],{windowsHide:true,stdio:'ignore'});
  let targets;
  for(let i=0;i<80;i++) {try {targets=await fetch('http://127.0.0.1:'+debugPort+'/json').then(r=>r.json());break;}catch {await sleep(100);}}
  assert.ok(targets,'Chrome must start');
  const target=targets.find(target=>target.type==='page');
  socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
  let serial=0; const pending=new Map(), errors=[];
  socket.addEventListener('message',event=>{
    const message=JSON.parse(event.data);
    if(message.id) {const pair=pending.get(message.id); pending.delete(message.id);message.error?pair.reject(message.error):pair.resolve(message.result);}
    if(message.method==='Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text+' '+JSON.stringify(message.params.exceptionDetails.exception));
  });
  const call=(method,params={})=>new Promise((resolve,reject)=>{
    const id=++serial;
    const timer=setTimeout(()=>{pending.delete(id);reject(new Error('Chrome timeout: '+method));},15000);
    pending.set(id,{resolve:result=>{clearTimeout(timer);resolve(result);},reject:error=>{clearTimeout(timer);reject(error);}});
    socket.send(JSON.stringify({id,method,params}));
  });
  const evaluate=async expression=>{
    const result=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
    if(result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  await call('Page.enable'); await call('Runtime.enable');
  await call('Page.addScriptToEvaluateOnNewDocument',{source:`
    (()=>{let clock=1000,id=0;const frames=new Map();
      window.requestAnimationFrame=fn=>{frames.set(++id,fn);return id;};
      window.cancelAnimationFrame=id=>frames.delete(id);
      window.__stepCombat=ms=>{clock+=ms;const current=[...frames.values()];frames.clear();current.forEach(fn=>fn(clock));};
    })();`});
  async function load(prefix='',width=1440,height=1080,reduced=false) {
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]});
    await call('Page.navigate',{url:`http://127.0.0.1:${port}/${prefix}games/tiny-defense/`});
    for(let i=0;i<80;i++) {if(await evaluate("Boolean(document.querySelector('[data-world-controls]') && !document.querySelector('[data-world-controls]').hidden)")) break;await sleep(50);}
  }
  const snapshot=()=>evaluate(`(()=>{const canvas=document.querySelector('.courtyard-combat'),world=document.querySelector('[data-world]');return {hidden:canvas.hidden,phase:canvas.dataset.phase,wave:canvas.dataset.wave,raid:world.classList.contains('night-encounter'),time:world.dataset.time};})()`);
  const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  async function night() {
    await click('[data-time-choice="night"]');
    for(let i=0;i<100;i++) {if(!(await snapshot()).hidden) return;await sleep(50);}
    throw new Error('Combat art did not load');
  }
  const advance=seconds=>evaluate(`for(let i=0;i<${Math.ceil(seconds*60)};i++) window.__stepCombat(1000/60)`);
  async function screenshot(name, landscape=false) {
    let clip;
    if(landscape) clip=await evaluate(`(()=>{const r=document.querySelector('.world-landscape').getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1};})()`);
    const result=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,...(clip?{clip}: {})});
    fs.writeFileSync(path.join(output,name),Buffer.from(result.data,'base64'));
  }
  let checks=0;
  for(const prefix of ['','en/','ja/']) {
    console.log('Checking '+(prefix||'ko/')+' courtyard...');
    await load(prefix);
    assert.equal(await evaluate("document.querySelectorAll('.courtyard-combat').length"),1);checks++;
    assert.equal((await snapshot()).hidden,true);checks++;
    await night(); await advance(6);
    assert.equal((await snapshot()).phase,'fighting');checks++;
    const before=await snapshot(); await click('[data-motion]'); await advance(10);
    assert.deepEqual(await snapshot(),before);checks++;
    await click('[data-motion]'); await advance(6);
    assert.equal((await snapshot()).phase,'waiting');checks++;
    await click('[data-time-choice="day"]'); await sleep(30);
    assert.equal((await snapshot()).hidden,true); assert.equal((await snapshot()).raid,false);checks+=2;
    await night(); await advance(6);
    await click('[data-resident="guardian"]'); await sleep(30);
    assert.equal((await snapshot()).hidden,true);checks++;
    // Dismiss the conversation by a real pagehide/pageshow round trip, then reset the night.
    await evaluate("window.dispatchEvent(new Event('pagehide'));window.dispatchEvent(new Event('pageshow'))");
    await click('[data-time-choice="day"]'); await click('[data-time-choice="night"]'); await sleep(30); await advance(6);
    await click('[data-open-story]'); await sleep(250);
    const inBook=await snapshot(); await advance(5); assert.deepEqual(await snapshot(),inBook);checks++;
    await click('[data-close-story]'); await sleep(30);
  }
  await load('',390,844); await night(); await advance(6);
  assert.equal((await snapshot()).phase,'fighting');checks++;
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);checks++;
  await sleep(1900); await screenshot('night-mobile.png');
  await load('',390,844,true); await click('[data-time-choice="night"]'); await sleep(100);
  assert.equal((await snapshot()).hidden,true); assert.equal((await snapshot()).raid,false);checks+=2;
  await load(); await night(); await sleep(1900); await advance(6);
  await screenshot('night-desktop.png'); await screenshot('night-scene.png',true);
  if(capture) {
    await click('[data-time-choice="day"]'); await sleep(50); await night(); await sleep(50);
    const frameDir=path.join(output,'frames');fs.mkdirSync(frameDir,{recursive:true});
    // The requestAnimationFrame clock controls the actual production renderer.
    // Capture one entire encounter, including entry, contact and return.
    for(let i=0;i<120;i++) {await advance(.1);await screenshot('frames/'+String(i).padStart(4,'0')+'.png',true);}
  }
  assert.deepEqual(errors,[],'no browser exceptions');checks++;
  console.log(`Chrome night combat: ${checks} checks passed across KO/EN/JA, desktop/mobile, pause, day reset, resident conversations, reader and reduced motion.`);
  console.log('Preview screenshots: '+output);
  await call('Browser.close').catch(()=>{});
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{
  socket?.close();chrome?.kill();server?.close();
});
