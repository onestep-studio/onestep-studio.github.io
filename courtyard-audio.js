/* Audio-clock crossfades. HTMLMediaElement.volume is not a reliable mixer on iOS. */
(function (root) {
  'use strict';
  const power = (from, to, p) => Math.sqrt(from * from * (1 - p) + to * to * p);
  class CourtyardMusic {
    constructor(sources, options = {}) {
      this.Audio = options.Audio || root.Audio;
      this.Context = options.Context || root.AudioContext || root.webkitAudioContext;
      this.raf = options.raf || root.requestAnimationFrame.bind(root);
      this.cancel = options.cancel || root.cancelAnimationFrame.bind(root);
      this.now = options.now || (() => performance.now() / 1000);
      this.sources = sources;
      this.tracks = {};
      this.epoch = 0;
      this.frame = 0;
    }
    init() {
      if (Object.keys(this.tracks).length) return;
      if (this.Context) this.context = new this.Context();
      for (const [key, src] of Object.entries(this.sources)) {
        const audio = new this.Audio();
        audio.preload = 'none'; audio.loop = true; audio.src = src;
        const track = {audio, level:0, ramp:null};
        if (this.context) {
          track.node = this.context.createGain(); track.node.gain.value = 0;
          track.source = this.context.createMediaElementSource(audio);
          track.source.connect(track.node); track.node.connect(this.context.destination);
          audio.volume = 1;
        } else audio.volume = 0;
        this.tracks[key] = track;
      }
    }
    clock() { return this.context ? this.context.currentTime : this.now(); }
    level(track, time = this.clock()) {
      if (!track.ramp) return track.level;
      const {from,to,start,duration} = track.ramp;
      return power(from,to,Math.max(0,Math.min(1,(time-start)/duration)));
    }
    hold(track, time) {
      const value = this.level(track,time);
      if (track.node) {
        track.node.gain.cancelScheduledValues(time);
        track.node.gain.setValueAtTime(value,time);
      } else track.audio.volume = value;
      track.level = value; track.ramp = null;
      return value;
    }
    async select(key, volume, duration = 3) {
      this.init();
      const epoch = ++this.epoch;
      this.selected = key;
      this.cancel(this.frame);
      const time = this.clock();
      Object.values(this.tracks).forEach(track => this.hold(track,time));
      const incoming = this.tracks[key];
      // Invoke both from the gesture; wait for playback before fading the old track.
      try {
        await Promise.all([
          this.context?.state !== 'running' ? this.context?.resume() : undefined,
          incoming.audio.paused ? incoming.audio.play() : undefined
        ]);
      } catch (error) {
        if (epoch === this.epoch) throw error;
        return;
      }
      if (epoch !== this.epoch) {
        if (this.selected !== key && this.level(incoming) === 0) incoming.audio.pause();
        return;
      }
      const start = this.clock();
      for (const [name, track] of Object.entries(this.tracks)) {
        const from = this.hold(track,start), to = name === key ? volume : 0;
        track.ramp = {from,to,start,duration};
        if (track.node) {
          // Equal-power overlap keeps the midpoint from sounding like a mute gap.
          for (let step=1;step<=90;step++) {
            track.node.gain.linearRampToValueAtTime(power(from,to,step/90),start+duration*step/90);
          }
        }
      }
      const finish = () => {
        if (epoch !== this.epoch) return;
        const now = this.clock();
        for (const [name,track] of Object.entries(this.tracks)) {
          if (!track.node) track.audio.volume = this.level(track,now);
          if (now >= start+duration) {
            this.hold(track,now);
            if (name !== key) track.audio.pause();
          }
        }
        if (now < start+duration) this.frame = this.raf(finish);
      };
      this.frame = this.raf(finish);
    }
    stop() {
      ++this.epoch; this.selected = null; this.cancel(this.frame);
      const now = this.clock();
      for (const track of Object.values(this.tracks)) {
        if (track.node) {
          track.node.gain.cancelScheduledValues(now);
          track.node.gain.setValueAtTime(0,now);
        } else track.audio.volume = 0;
        track.level = 0; track.ramp = null; track.audio.pause();
      }
    }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {CourtyardMusic,power};
  else root.CourtyardMusic = CourtyardMusic;
})(typeof window === 'undefined' ? globalThis : window);
