Array.prototype.choose = function() {
  return this[Math.floor(Math.random() * this.length)];
}

function populateSynth(location_info, frequency, duration) {
  this.gen = new Sine(this.audiolet, frequency);
  this.modulator = new Saw(this.audiolet, 2*frequency);
  this.modulatorMulAdd = new MulAdd(this.audiolet, frequency * 0.5, frequency);
  this.gain = new Gain(this.audiolet);
  this.envelope = new PercussiveEnvelope(this.audiolet, 1, .01, duration * .85,
      function() {
          this.audiolet.scheduler.addRelative(0, this.remove.bind(this));
      }.bind(this)
  );

  this.volume = new Gain(this.audiolet, .1);


  this.modulator.connect(this.modulatorMulAdd);
  this.modulatorMulAdd.connect(this.gen);
  this.envelope.connect(this.gain, 0, 1);
  this.gen.connect(this.gain);

  this.gain.connect(this.volume);

  return this.volume;
}

var Synth = function(audiolet, frequency, duration) {
  AudioletGroup.apply(this, [audiolet, 0, 1]);
  this.out = populateSynth.call(this, window.location_info, frequency, duration);

  this.out.connect(this.outputs[0]);
};

extend(Synth, AudioletGroup);

var Bass = function(audiolet, frequency, duration) {
  AudioletGroup.apply(this, [audiolet, 0, 1]);
  this.gen = new Square(this.audiolet, frequency);
  this.gain = new Gain(this.audiolet);
  this.envelope = new PercussiveEnvelope(this.audiolet, 1, .01, duration * .85,
      function() {
          this.audiolet.scheduler.addRelative(0, this.remove.bind(this));
      }.bind(this)
  ); 
  this.envelope.connect(this.gain, 0, 1);
  this.gen.connect(this.gain);


  this.lpf = new LowPassFilter(this.audiolet, 400);
  this.gain.connect(this.lpf);

  this.volume = new Gain(this.audiolet, .5);
  this.lpf.connect(this.volume);
  this.volume.connect(this.outputs[0]);
}
extend(Bass, AudioletGroup);

var AudioletApp = function() {
  this.audiolet = new Audiolet();
  this.audiolet.scheduler.setTempo(90);

  var scale = new MajorScale();
  var play = this.play = function(time, semitones, duration, instrument) {
      var baseFreq = 65;
      var octave = 0;
      var frequency = scale.getFrequency(semitones + 16, baseFreq, octave);
      var instrument = instrument || Synth;

      this.audiolet.scheduler.addRelative(time, function() {
          var inst = new instrument(this.audiolet, frequency, duration);
          inst.connect(this.audiolet.output);
        }.bind(this)
      );
    }.bind(this);

  var playChord = this.playChord = function(time, scaleDegree, duration) {
    [0,2,4].forEach(function (deg, idx) {
      play(time + duration * idx * .00, deg + scaleDegree, duration);
    });
  }.bind(this);

  this.chordProgressionPattern = new PChordProgression([[0,1,2,3,4,5,6], [4, 6], [5], [4, 6], [0, 0, 0, 0, 5], [1, 3], [0, 0, 0, 0, 2]]);

  this.audiolet.scheduler.play([this.chordProgressionPattern], 4,
      function(scaleDegree) {
        playChord(0, scaleDegree, 1);
        play(0, scaleDegree - 16, .25, Bass);
        play(.5, scaleDegree - 16, .25, Bass);
        play(.750, scaleDegree - 16, .25, Bass);
        play(1, scaleDegree - 8, .25, Bass);

        play(1.5, scaleDegree - 16, .25, Bass);

        play(2 + 0.0, scaleDegree - 16 + 2, .3, Bass);
        play(2 + 0.66, scaleDegree - 16 + 3, .3, Bass);
        play(2 + 1.0, scaleDegree - 16 + 4, .3, Bass);
      }.bind(this)
  );


  // Create empty buffers for the bass drum, hi hat and snare drum
  this.bd = new AudioletBuffer(1, 0);
  this.hh = new AudioletBuffer(1, 0);
  this.sn = new AudioletBuffer(1, 0);
  // Load wav files using synchronous XHR
  this.bd.load('audio/bd_stereo.wav', false);
  this.hh.load('audio/hh_stereo.wav', false);
  this.sn.load('audio/sn_stereo.wav', false);

  var playDrum = this.playDrum = function (name, time) {
    console.log('playing ' + name);
    this.audiolet.scheduler.addRelative(time, function() {
      var bp = new BufferPlayer(this.audiolet, {b: this.bd, h: this.hh, s: this.sn}[name], 1, 0, 0);
      bp.connect(this.audiolet.output);
      this.audiolet.scheduler.addRelative(2, bp.remove.bind(bp));
    }.bind(this)
    );
  }.bind(this);

  var randomBeat = this.randomBeat = function (drum, time_interval, length, prob) { 
    var arr = _.range(length / time_interval).map(function () { return window.location_info.rng.random() < prob; });
    this.audiolet.scheduler.play([new PSequence(arr, Infinity)], time_interval, function (play) {
        if(play) playDrum(drum, 0);
      }.bind(this)
    );
  }.bind(this);

  randomBeat('s', .25, 8, .25);

  var repeatEvery = this.repeatEvery = function (duration, callback) {
    this.audiolet.scheduler.play([], new PSequence([duration], Infinity), callback);
  }.bind(this);

  repeatEvery(2, function() { playDrum('s', 1); });

  repeatEvery(4, function() { playDrum('b', 0); });
  randomBeat('b', .25, 8, .25);

  repeatEvery(.5, function() { playDrum('h', 0); });
};
