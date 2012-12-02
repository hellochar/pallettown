Array.prototype.choose = function() {
  return this[Math.floor(Math.random() * this.length)];
}

var Synth = function(audiolet, frequency, duration) {
  AudioletGroup.apply(this, [audiolet, 0, 1]);
  this.gen = new ([Sine, Saw, Triangle, Square].choose())(this.audiolet, frequency);
  this.modulator = new ([Sine, Saw, Triangle, Square].choose())(this.audiolet, 2*frequency);
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
  this.volume.connect(this.outputs[0]);
};

extend(Synth, AudioletGroup);

var AudioletApp = function() {
  this.audiolet = new Audiolet();
// 
//   var melodyA = new PSequence([262, 294, 330, 349]);
//   var melodyB = new PSequence([349, 330, 349, 392]);
//   var melodyC = new PSequence([440, 392, 349, 330]);
// 
//   var frequencyPattern = new PChoose([melodyA, melodyB, melodyC],
//                                      Infinity);
// 
//   var durationPattern = new PChoose([new PSequence([4, 1, 1, 2]),
//                                      new PSequence([2, 2, 1, 3]),
//                                      new PSequence([1, 1, 1, 1])],
//                                     Infinity);
//   this.audiolet.scheduler.setTempo(180);
  // this.audiolet.scheduler.play([frequencyPattern], durationPattern,
  //     function(frequency) {
  //       var synth = new Synth(this.audiolet, frequency);
  //       synth.connect(this.audiolet.output);
  //     }.bind(this)
  // );

  var scale = new MajorScale();
  var play = function(time, semitones, duration) {
      var baseFreq = 65;
      var octave = 2;
      var frequency = scale.getFrequency(semitones, baseFreq, octave);

      this.audiolet.scheduler.addRelative(time, function() {
          var synth = new Synth(this.audiolet, frequency, duration);
          synth.connect(this.audiolet.output);
        }.bind(this)
      );
    }.bind(this);

  var chordProgressions = [[0,1,2,3,4,5,6], [4, 6], [5], [4, 6], [0, 0, 0, 0, 5], [1, 3], [0, 0, 0, 0, 2]].map(function (array) { return new PChoose(array, Infinity) });

  var playChord = function(time, scaleDegree, duration) {
    [0,2,4].forEach(function (deg, idx) {
      play(time + duration * idx * .00, deg + scaleDegree, duration);
    });
  }.bind(this);

  //play diatonic notes relative to C3
  // for(var i = 0; i < 9; i += 1) {
  //   playChord(i, i, 1);
  // }

  var chordProg = new Pattern();
  chordProg.currentChord = 0;
  chordProg.next = function() {
    this.currentChord = chordProgressions[this.currentChord].next();
    return this.currentChord;
  };
  chordProg.valueOf = function() {
    return this.currentChord;
  }

  playChord(0, 0, 4);
  this.audiolet.scheduler.play([chordProg], 4,
      function(scaleDegree) {
        playChord(4, scaleDegree, 1);
      }.bind(this)
  );
};
this.audioletApp = new AudioletApp();
