/* Render the real reader in Chrome, including the second-page resume control.
   node tools/verify-story-layout.cjs [--before] */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/qa/story-layout');
const before=process.argv.includes('--before');
const stories=JSON.parse(fs.readFileSync(path.join(root,'assets/world/story.json'),'utf8'));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
let server,chrome,socket;
async function main() {
  fs.mkdirSync(out,{recursive:true});
  server=http.createServer((req,res)=>{
    let url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(url.endsWith('/'))url+='index.html';
    const file=path.resolve(root,'.'+url);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const sitePort=server.address().port;
  const probe=http.createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));
  const debugPort=probe.address().port;await new Promise(resolve=>probe.close(resolve));
  chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',[
    '--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--hide-scrollbars',
    '--disable-background-networking','--remote-allow-origins=*','--remote-debugging-port='+debugPort,
    '--user-data-dir='+path.join(out,'chrome-profile'),'about:blank'
  ],{windowsHide:true,stdio:'ignore'});
  let targets;
  for(let i=0;i<80;i++){try{targets=await fetch('http://127.0.0.1:'+debugPort+'/json',{signal:AbortSignal.timeout(1000)}).then(r=>r.json());break;}catch{await sleep(100);}}
  assert.ok(targets,'Chrome must start');
  socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
  let id=0;const pending=new Map(),errors=[];
  socket.addEventListener('message',event=>{
    const msg=JSON.parse(event.data);const pair=pending.get(msg.id);
    if(pair){pending.delete(msg.id);msg.error?pair.reject(msg.error):pair.resolve(msg.result);}
    if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails);
  });
  const call=(method,params={})=>new Promise((resolve,reject)=>{
    const current=++id,timer=setTimeout(()=>{pending.delete(current);reject(new Error('Chrome timeout: '+method));},15000);
    pending.set(current,{resolve:value=>{clearTimeout(timer);resolve(value);},reject:error=>{clearTimeout(timer);reject(error);}});
    socket.send(JSON.stringify({id:current,method,params}));
  });
  const evaluate=async expression=>{
    const result=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
    if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result.value;
  };
  await call('Page.enable');await call('Runtime.enable');
  async function ready(expression) {
    for(let i=0;i<100;i++){if(await evaluate(expression))return;await sleep(50);}throw new Error('Not ready: '+expression);
  }
  const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const metrics=()=>evaluate(`(()=>{
    const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right};};
    const image=document.querySelector('[data-story-art]'),box=rect('[data-story-art]');
    const scale=Math.min(box.width/image.naturalWidth,box.height/image.naturalHeight);
    return {viewport:{width:innerWidth,height:innerHeight},toolbar:rect('.reader-toolbar'),pages:rect('.reader-pages'),
      image:{...box,paintWidth:image.naturalWidth*scale,paintHeight:image.naturalHeight*scale},
      heading:rect('.story-page-heading'),title:rect('[data-page-title]'),copy:rect('.story-copy'),
      footer:rect('.reader-footer'),settings:rect('.reader-settings'),resume:rect('[data-resume-story]'),
      resumeInSettings:document.querySelector('.reader-settings').contains(document.querySelector('[data-resume-story]')),
      page:document.querySelector('[data-page-progress]').textContent,overflow:document.documentElement.scrollWidth>innerWidth};
  })()`);
  async function screenshot(name){const png=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,name),Buffer.from(png.data,'base64'));}
  const cases=before?[{lang:'ko',width:1920,height:912}]:[
    ...['ko','en','ja'].flatMap(lang=>[{lang,width:1920,height:912},{lang,width:1440,height:900},{lang,width:390,height:844},{lang,width:320,height:568}]),
    {lang:'ko',width:844,height:390}
  ];
  let checks=0;const measured=[];
  for(const setup of cases){
    const {lang,width,height}=setup,prefix=lang==='ko'?'':lang+'/';
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<700});
    await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await call('Page.navigate',{url:`http://127.0.0.1:${sitePort}/${prefix}games/tiny-defense/`});
    await ready("Boolean(document.querySelector('[data-world-controls]') && !document.querySelector('[data-world-controls]').hidden)");
    await click('[data-open-story]');await ready("document.querySelector('[data-page-progress]').textContent.startsWith('01')");
    await evaluate("document.querySelector('[data-story-art]').decode()");
    await evaluate('document.fonts.ready');
    const first=await metrics();
    await click('[data-story-next]');await ready("document.querySelector('[data-page-progress]').textContent.startsWith('02')");
    await evaluate("document.querySelector('[data-story-art]').decode()");
    const second=await metrics();measured.push({lang,width,height,first,second});
    if(before){await screenshot('before-desktop.png');continue;}
    // Small screens may wrap footer controls; only that measured extra row can reduce text space.
    const footerGrowth=Math.max(0,second.settings.height-first.settings.height);
    assert.ok(second.pages.height>=first.pages.height-footerGrowth-2,'resume must not create a body-sized grid row');checks++;
    assert.ok(second.pages.y-second.toolbar.bottom<3,'body starts directly after toolbar');checks++;
    assert.equal(second.resumeInSettings,true,'resume belongs to compact footer settings');checks++;
    assert.equal(second.overflow,false);checks++;
    assert.equal(second.heading.y,first.heading.y,'heading stays at the same top position');checks++;
    assert.equal(second.title.y,first.title.y,'title keeps its position even without chapter metadata');checks++;
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.story-page-heading')).borderBottomWidth"),'2px','visible divider separates the fixed header');checks++;
    assert.ok(second.footer.bottom<=height && second.settings.bottom<=height+1,'navigation stays on screen');checks++;
    if(width>=1000){assert.ok(second.image.paintWidth>=width*.40,'illustration uses the large left pane');checks++;assert.ok(second.image.paintHeight>=height*.48);checks++;}
    if(width<700){assert.ok(second.image.paintHeight>=height*.22);checks++;}
    if(lang==='ko' && width===1920)await screenshot('after-desktop.png');
    if(lang==='ko' && width===390)await screenshot('after-mobile.png');
    assert.equal(await evaluate('document.fonts.check(\'400 20px "Story Sans"\', "기사 Pawn 騎士")'),true,'local reading font loads');checks++;
    assert.equal(await evaluate("document.querySelector('[data-page-kicker]').hidden"),true,'prologue does not repeat its title');checks++;
    assert.deepEqual(await evaluate("[...document.querySelectorAll('[data-story-lines] .dialogue-text')].map(p=>p.textContent)"),stories[lang].pages[1].lines.map(line=>line.text),'all dialogue is preserved');checks++;
    assert.equal(await evaluate("[...document.querySelectorAll('[data-story-lines] p[data-speaker]')].every(p=>{const name=p.querySelector('.speaker').getBoundingClientRect(),text=p.querySelector('.dialogue-text').getBoundingClientRect();return name.right<text.x && p.scrollWidth<=p.clientWidth;})"),true,'speaker and dialogue have separate, unclipped columns');checks++;
    assert.ok(await evaluate(`parseFloat(getComputedStyle(document.querySelector('.speaker')).fontSize)>=${width<700?18:20}`),'speaker names remain prominent');checks++;
    await click('.reader-settings summary');await ready("document.querySelector('.reader-settings').open");
    assert.ok(Math.abs((await metrics()).pages.height-second.pages.height)<2,'settings must not resize the illustration');checks++;
    assert.equal(await evaluate("(()=>{const r=document.querySelector('.reader-settings-panel').getBoundingClientRect();return r.x>=0 && r.right<=innerWidth && r.y>=0 && r.bottom<innerHeight;})()"),true,'settings stays within the viewport');checks++;
    if(lang==='ko' && width===390)await screenshot('after-settings-mobile.png');
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    assert.equal(await evaluate("!document.querySelector('.reader-settings').open && document.querySelector('#story-reader').open"),true,'Escape closes settings and preserves reading');checks++;
    await click('[data-contents]');const withContents=await metrics();
    assert.ok(Math.abs(withContents.pages.height-second.pages.height)<2,'contents popover must not resize the illustration');checks++;
    await click('[data-contents]');await click('[data-story-next]');await ready("document.querySelector('[data-page-progress]').textContent.startsWith('03')");
    await evaluate("document.querySelector('[data-story-art]').decode()");
    if(lang==='ko' && width===1920)await screenshot('after-dialogue-desktop.png');
    if(lang==='ko' && width===390)await screenshot('after-dialogue-mobile.png');
    await evaluate("document.querySelector('.story-copy').scrollTop=10000");
    assert.equal(await evaluate("(()=>{const p=document.querySelector('.story-copy');return p.scrollTop+p.clientHeight>=p.scrollHeight-2;})()"),true,'dialogue scrolls independently');checks++;
    assert.equal((await metrics()).heading.y,first.heading.y,'heading stays visible during dialogue scroll');checks++;
    await click('[data-story-prev]');await ready("document.querySelector('[data-page-progress]').textContent.startsWith('02')");
    assert.ok((await metrics()).pages.height>=first.pages.height-footerGrowth-2);checks++;
    if(width===1920 || width===390 || width===320) {
      for(let index=2;index<stories[lang].pages.length;index++) {
        await click('[data-story-next]');
        if(index===stories[lang].previewCount) {
          await ready("!document.querySelector('[data-story-gate]').hidden && document.querySelector('[data-story-next]').disabled");
          assert.match(await evaluate("document.querySelector('[data-story-gate] p').textContent"),/결말|ending|結末/,'short warning preserves spoiler consent');checks++;
          await click('[data-story-gate] button:not(.secondary)');
        }
        const current=stories[lang].pages[index];
        await ready(`!document.querySelector('[data-story-lines]').hidden && document.querySelector('[data-page-title]').textContent===${JSON.stringify(current.title)} && document.querySelector('[data-page-progress]').textContent.startsWith(${JSON.stringify(String(index+1).padStart(2,'0'))})`);
        const expected=[...(current.before||[]),...current.lines.map(line=>line.text),...(current.after||[])];
        assert.deepEqual(await evaluate("[...document.querySelectorAll('[data-story-lines]>p')].map(p=>p.querySelector('.dialogue-text')?.textContent||p.textContent)"),expected,'complete story survives the new text layout');checks++;
        const currentMetrics=await metrics();
        assert.equal(currentMetrics.heading.y,first.heading.y,'every scene shares the same heading position');checks++;
        assert.equal(currentMetrics.heading.height,first.heading.height,'header divider stays fixed for every title length');checks++;
        assert.equal(currentMetrics.title.y,first.title.y,'chapter metadata does not move scene titles');checks++;
        assert.ok(currentMetrics.title.bottom<=currentMetrics.heading.bottom-4,'long titles fit above the divider');checks++;
        assert.equal(await evaluate("[...document.querySelectorAll('[data-story-lines] p[data-speaker]')].every(p=>p.scrollWidth<=p.clientWidth && p.querySelector('.speaker').scrollWidth<=p.querySelector('.speaker').clientWidth)"),true,'large localized names are not clipped');checks++;
        if(index===7 && lang==='ko' && (width===1920 || width===390)) {
          await evaluate("document.querySelector('[data-story-art]').decode()");
          await screenshot(width===1920?'fixed-heading-desktop.png':'fixed-heading-mobile.png');
          await evaluate("document.querySelector('.story-copy').scrollTop=10000");
          assert.equal((await metrics()).title.y,first.title.y,'title remains fixed on the longest opening dialogue');checks++;
          await screenshot(width===1920?'fixed-heading-scrolled-desktop.png':'fixed-heading-scrolled-mobile.png');
        }
      }
    }
    await click('[data-close-story]');
  }
  assert.deepEqual(errors,[],'no browser exceptions');checks++;
  fs.writeFileSync(path.join(out,before?'before-metrics.json':'after-metrics.json'),JSON.stringify(measured,null,2)+'\n');
  console.log(`${before?'Reproduced reader shrink':'Story reader verified'}: ${checks} checks across ${cases.length} viewport/language combinations.`);
  console.log(JSON.stringify(measured.filter(m=>m.lang==='ko').map(m=>({width:m.width,height:m.height,body:m.second.pages.height,imageWidth:m.second.image.paintWidth,imageHeight:m.second.image.paintHeight,gap:m.second.pages.y-m.second.toolbar.bottom})),null,2));
  await call('Browser.close').catch(()=>{});
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{socket?.close();chrome?.kill();server?.close();});
