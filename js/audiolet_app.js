var HighSynth = function(audiolet) {
    AudioletGroup.call(this, audiolet, 0, 1);
    // Triangle base oscillator
    this.triangle = new Triangle(audiolet);

    // Note on trigger
    this.trigger = new TriggerControl(audiolet);

    // Gain envelope
    this.gainEnv = new PercussiveEnvelope(audiolet, 0, 0.1, 0.15);
    this.gainEnvMulAdd = new MulAdd(audiolet, 0.1);

    // Synth 1
    // this.gainEnv = new ADSREnvelope(audiolet, 1, 2.618, .872, .3, .1);

    // Synth 2
    // this.gainEnv = new ADSREnvelope(audiolet, 1, 1.2, .3, .2, .2)
    // this.lowPass = new LowPassFilter(audiolet, 440);
    // this.reverb = new Reverb(audiolet, 1, .8, .1);

    this.gain = new Gain(audiolet);

    // Feedback delay
    this.delay = new Delay(audiolet, 0.1, 0.1);
    this.feedbackLimiter = new Gain(audiolet, 0.5);

    // Stereo panner
    this.pan = new Pan(audiolet);
    this.panLFO = new Sine(audiolet, 1 / 8);

    this.triangle.connect(this.gain);

    // Connect trigger and envelope
    this.trigger.connect(this.gainEnv);

    // // Synth 1
    // this.gainEnv.connect(this.gain);
    // this.gain.connect(this.outputs[0]);

    // // Synth 2
    // this.gainEnv.connect(this.gain);
    // this.gain.connect(this.lowPass);
    // this.lowPass.connect(this.reverb);
    // this.reverb.connect(this.outputs[0]);

    this.gainEnv.connect(this.gainEnvMulAdd);
    this.gainEnvMulAdd.connect(this.gain, 0, 1);
    this.gain.connect(this.delay);

    // Connect delay
    this.delay.connect(this.feedbackLimiter);
    this.feedbackLimiter.connect(this.delay);
    this.gain.connect(this.pan);
    this.delay.connect(this.pan);

    // Connect panner
    this.panLFO.connect(this.pan, 0, 1);
    this.pan.connect(this.outputs[0]);
}
extend(HighSynth, AudioletGroup);

var BassSynth = function(audiolet) {
    AudioletGroup.call(this, audiolet, 0, 1);
    // Basic wave
    this.sine = new Sine(audiolet, 100);

    // Frequency Modulator
    this.fmEnv = new PercussiveEnvelope(audiolet, 10, 10, 2);
    this.fmEnvMulAdd = new MulAdd(audiolet, 90, 0);
    this.frequencyModulator = new Saw(audiolet);
    this.frequencyMulAdd = new MulAdd(audiolet, 90, 100);

    // Gain envelope
    this.gain = new Gain(audiolet);
    this.gainEnv = new ADSREnvelope(audiolet,
                                    1, // Gate
                                    1, // Attack
                                    0.2, // Decay
                                    0.9, // Sustain
                                    2); // Release
    this.gainEnvMulAdd = new MulAdd(audiolet, 0.2);

    this.upMixer = new UpMixer(audiolet, 2);

    // Connect main signal path
    this.sine.connect(this.gain);
    this.gain.connect(this.upMixer);
    this.upMixer.connect(this.outputs[0]);

    // Connect Frequency Modulator
    this.fmEnv.connect(this.fmEnvMulAdd);
    this.fmEnvMulAdd.connect(this.frequencyMulAdd, 0, 1);
    this.frequencyModulator.connect(this.frequencyMulAdd);
    this.frequencyMulAdd.connect(this.sine);

    // Connect Envelope
    this.gainEnv.connect(this.gainEnvMulAdd);
    this.gainEnvMulAdd.connect(this.gain, 0, 1);
}
extend(BassSynth, AudioletGroup);

function playStuff() {
    var Demo = function() {
        this.audiolet = new Audiolet();

        // Set BPM
        this.audiolet.scheduler.setTempo(128);

        // Base frequency and scale to work from
        this.c2Frequency = 65.4064;
        this.scale = new MajorScale();

        this.playHighSynth();
    }

    Demo.prototype.playHighSynth = function() {
        // High synth - scheduled as a mono synth (i.e. one instance keeps
        // running and the gate and frequency are switched)
        this.highSynth = new HighSynth(this.audiolet);

        // Connect it to the output so we can hear it
        this.highSynth.connect(this.audiolet.output);

        var numNotes = 16;
        var totalBeats = numNotes/2.0;
        var noteProbabilities = [1,.5,1,.75,1,.15,.15];
        var origProbs = noteProbabilities.slice(0);

        var octaves = [];
        for (var i = 0; i < numNotes; i++) {
            octaves[i] = 3;
        }

        var notes = [];
        for (var i = 0; i < numNotes; i++) {
            notes[i] = randomGenerator(noteProbabilities);
            if (i != 0 && notes[i-1] == 0 && notes[i] == 6)
                octaves[i] = 2;
            else if (i != 0 && notes[i-1] == 6 && notes[i] == 0)
                octaves[i] = 4;

            noteProbabilities = origProbs.slice(0);
            for (var j = 0; j < 7; j++) {
                var tmp1 = notes[i] - j;
                var tmp2 = j - notes[i];
                if (tmp1 < 0) {
                    tmp1 = tmp1 + 7;
                } else if (tmp2 < 0) {
                    tmp2 = tmp2 + 7;
                } else if (tmp1 == 0) {
                    noteProbabilities[(notes[i]+j)%7] /= 2.0;
                    continue;
                }
                var noteDist = Math.min(tmp1, tmp2);
                noteProbabilities[(notes[i]+j)%7] *= 1.5/noteDist;
            }
        }

        //laplace sampling sorta
        var noteDurProbabilities = noteProbabilities.slice(0);
        for (var i = 0; i < 7; i++) {
            noteDurProbabilities[i] += 0.07;
        }

        var origDurProbabilities = noteDurProbabilities.slice(0);

        // How long each event lasts
        var noteDurations = [];
        for (var i = 0; i < numNotes; i++) {
            noteDurations[i] = randomDurationGenerator(noteDurProbabilities, notes[i]);
            //noteDurProbabilities = origDurProbabilities.slice(0);
        }
        fixMeter(totalBeats, notes, octaves, noteDurations);

        var octaves2 = [];
        for (var i = 0; i < numNotes; i++) {
            octaves2[i] = 3;
        }

        var notes2 = [];
        for (var i = 0; i < numNotes; i++) {
            notes2[i] = randomGenerator(noteProbabilities);
            if (i != 0 && notes2[i-1] == 0 && notes2[i] == 6)
                octaves2[i] = 2;
            else if (i != 0 && notes2[i-1] == 6 && notes2[i] == 0)
                octaves2[i] = 4;

            noteProbabilities = origProbs.slice(0);
            for (var j = 0; j < 7; j++) {
                var tmp1 = notes2[i] - j;
                var tmp2 = j - notes2[i];
                if (tmp1 < 0) {
                    tmp1 = tmp1 + 7;
                } else if (tmp2 < 0) {
                    tmp2 = tmp2 + 7;
                } else if (tmp1 == 0) {
                    noteProbabilities[(notes2[i]+j)%7] /= 2.0;
                    continue;
                }
                var noteDist = Math.min(tmp1, tmp2);
                noteProbabilities[(notes2[i]+j)%7] *= 1.5/noteDist;
            }
        }

        //laplace sampling sorta
        var noteDurProbabilities2 = noteProbabilities.slice(0);
        for (var i = 0; i < 7; i++) {
            noteDurProbabilities2[i] += 0.07;
        }

        var origDurProbabilities2 = noteDurProbabilities2.slice(0);

        // How long each event lasts
        var noteDurations2 = [];
        for (var i = 0; i < numNotes; i++) {
            noteDurations2[i] = randomDurationGenerator(noteDurProbabilities2, notes2[i]);
            //noteDurProbabilities = origDurProbabilities.slice(0);
        }
        fixMeter(totalBeats, notes2, octaves2, noteDurations2);











        var degreePattern = new PSequence(notes.concat(notes, notes2, notes2), Infinity);
        var octavePattern = new PSequence(octaves.concat(octaves, octaves2, octaves2), Infinity);

        var durationPattern = new PSequence(noteDurations.concat(noteDurations, noteDurations2, noteDurations2), Infinity);

        console.log(degreePattern);
        console.log(octavePattern);
        console.log(durationPattern);


        // Schedule the patterns to play
        this.audiolet.scheduler.play([degreePattern, octavePattern],
                                     durationPattern,
            function(degree, octave) {
                // Set the gate
                this.highSynth.trigger.trigger.setValue(1);
                // Calculate the frequency from the scale
                var frequency = this.scale.getFrequency(degree,
                                                        this.c2Frequency,
                                                        octave);
                // Set the frequency
                this.highSynth.triangle.frequency.setValue(frequency);
            }.bind(this)
        );
    }

    // Run the demo
    window.demo = new Demo();
};

playStuff();


















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
      this.audiolet.scheduler.addRelative(5, bp.remove.bind(bp));
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
