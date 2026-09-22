const {test} = require('node:test');
const assert = require('node:assert/strict');
const {CourtyardMusic} = require('../courtyard-audio');
function fixture() {
  let time=0, next=0;
  const frames=new Map();
  class Audio {
    constructor() { this.paused=true; this.volume=1; }
    play() { this.paused=false; return this.wait || Promise.resolve(); }
    pause() { this.paused=true; }
  }
  class Context {
    constructor() { this.state='running'; this.destination={}; }
    get currentTime() { return time; }
    createMediaElementSource() { return {connect(){}}; }
    createGain() { return {connect(){},gain:{value:0,events:[],cancelScheduledValues(t){this.events=this.events.filter(e=>e.time<t);},setValueAtTime(value,time){this.events.push({value,time});},linearRampToValueAtTime(value,time){this.events.push({value,time});}}}; }
  }
  const mixer=new CourtyardMusic({day:'day',night:'night',story:'story'},{Audio,Context,raf:fn=>{frames.set(++next,fn);return next;},cancel:id=>frames.delete(id)});
  const tick=t=>{time=t;const run=[...frames.values()];frames.clear();run.forEach(fn=>fn());};
  return {mixer,tick};
}
test('ready tracks overlap for three seconds at equal power and old track stops only at silence',async()=>{
  const {mixer,tick}=fixture();
  await mixer.select('day',.28);tick(3);
  await mixer.select('night',.28);
  assert.equal(mixer.tracks.day.audio.paused,false);
  assert.equal(mixer.tracks.night.audio.paused,false);
  tick(4.5);
  const day=mixer.level(mixer.tracks.day),night=mixer.level(mixer.tracks.night);
  assert.ok(day>0&&day<.28&&night>0&&night<.28);
  assert.ok(Math.abs(day*day+night*night-.28*.28)<1e-9);
  assert.equal(mixer.tracks.night.node.gain.events.at(-1).time,6);
  tick(6);
  assert.equal(mixer.tracks.day.audio.paused,true);
  assert.equal(mixer.level(mixer.tracks.night),.28);
});
test('buffering preserves outgoing music; its fade begins only after incoming playback is ready',async()=>{
  const {mixer,tick}=fixture();await mixer.select('day',.28);tick(3);
  let ready; mixer.tracks.night.audio.wait=new Promise(resolve=>ready=resolve);
  const pending=mixer.select('night',.28);tick(10);
  assert.equal(mixer.level(mixer.tracks.day),.28);
  assert.equal(mixer.level(mixer.tracks.night),0);
  ready();await pending;
  assert.equal(mixer.tracks.day.ramp.start,10);
  tick(13);assert.equal(mixer.tracks.day.audio.paused,true);
});
test('rapid reversal continues from current levels; stop invalidates in-flight playback',async()=>{
  const {mixer,tick}=fixture();await mixer.select('day',.28);tick(3);
  await mixer.select('night',.28);tick(4);
  const before=mixer.level(mixer.tracks.day);
  await mixer.select('day',.28);
  assert.equal(mixer.level(mixer.tracks.day),before);
  tick(7);assert.equal(mixer.tracks.night.audio.paused,true);
  let ready;mixer.tracks.story.audio.wait=new Promise(resolve=>ready=resolve);
  const pending=mixer.select('story',.2);mixer.stop();ready();await pending;
  tick(20);
  for (const track of Object.values(mixer.tracks)) {
    assert.equal(track.audio.paused,true);assert.equal(mixer.level(track),0);
  }
});
