function playExample() {
    var HighSynth = function(audiolet) {
        AudioletGroup.call(this, audiolet, 0, 1);

        // Triangle base oscillator
        this.triangle = new Triangle(audiolet);

        // Note on trigger
        this.trigger = new TriggerControl(audiolet);

        // Gain envelope
        this.gainEnv = new PercussiveEnvelope(audiolet, 0, 0.1, 0.15);
        this.gainEnvMulAdd = new MulAdd(audiolet, 0.1);
        this.gain = new Gain(audiolet);

        // Feedback delay
        this.delay = new Delay(audiolet, 0.1, 0.1);
        this.feedbackLimiter = new Gain(audiolet, 0.5);

        // Stereo panner
        this.pan = new Pan(audiolet);
        this.panLFO = new Sine(audiolet, 1 / 8);


        // Connect oscillator
        this.triangle.connect(this.gain);

        // Connect trigger and envelope
        this.trigger.connect(this.gainEnv);
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

    var Kick = function(audiolet) {
        AudioletGroup.call(this, audiolet, 0, 1);
        // Main sine oscillator
        this.sine = new Sine(audiolet, 80);

        // Pitch Envelope - from 81 to 1 hz in 0.3 seconds
        this.pitchEnv = new PercussiveEnvelope(audiolet, 1, 0.001, 0.3);
        this.pitchEnvMulAdd = new MulAdd(audiolet, 80, 1);

        // Gain Envelope
        this.gainEnv = new PercussiveEnvelope(audiolet, 1, 0.001, 0.3,
            function() {
                // Remove the group ASAP when env is complete
                this.audiolet.scheduler.addRelative(0,
                                                    this.remove.bind(this));
            }.bind(this)
        );
        this.gainEnvMulAdd = new MulAdd(audiolet, 0.7);
        this.gain = new Gain(audiolet);
        this.upMixer = new UpMixer(audiolet, 2);


        // Connect oscillator
        this.sine.connect(this.gain);

        // Connect pitch envelope
        this.pitchEnv.connect(this.pitchEnvMulAdd);
        this.pitchEnvMulAdd.connect(this.sine);

        // Connect gain envelope
        this.gainEnv.connect(this.gainEnvMulAdd);
        this.gainEnvMulAdd.connect(this.gain, 0, 1);
        this.gain.connect(this.upMixer);
        this.upMixer.connect(this.outputs[0]);
    }
    extend(Kick, AudioletGroup);

    var Shaker = function(audiolet) {
        AudioletGroup.call(this, audiolet, 0, 1);
        // White noise source
        this.white = new WhiteNoise(audiolet);

        // Gain envelope
        this.gainEnv = new PercussiveEnvelope(audiolet, 1, 0.01, 0.05,
            function() {
                // Remove the group ASAP when env is complete
                this.audiolet.scheduler.addRelative(0,
                                                    this.remove.bind(this));
            }.bind(this)
        );
        this.gainEnvMulAdd = new MulAdd(audiolet, 0.15);
        this.gain = new Gain(audiolet);

        // Filter
        this.filter = new BandPassFilter(audiolet, 3000);

        this.upMixer = new UpMixer(audiolet, 2);

        // Connect the main signal path
        this.white.connect(this.filter);
        this.filter.connect(this.gain);

        // Connect the gain envelope
        this.gainEnv.connect(this.gainEnvMulAdd);
        this.gainEnvMulAdd.connect(this.gain, 0, 1);
        this.gain.connect(this.upMixer);
        this.upMixer.connect(this.outputs[0]);
    }
    extend(Shaker, AudioletGroup);

    var Demo = function() {
        this.audiolet = new Audiolet();

        // Set BPM
        this.audiolet.scheduler.setTempo(128);

        // Base frequency and scale to work from
        this.c2Frequency = 65.4064;
        this.scale = new MajorScale();

        this.playHighSynth();
        this.playMidSynth();
        this.playKick();
        this.playShaker();
        this.playBassSynth();
    }

    var randomGenerator = function(probabilities) {
        //normalize it
        var sum = 0.0;
        for (var i = 0; i < probabilities.length; i++) {
            sum += probabilities[i];
        }
        for (var i = 0; i < probabilities.length; i++) {
            probabilities[i] = probabilities[i]/sum;
        }
        var rando = Math.random();

        var tmp = 0.0;
        for (var i = 0; i < 8; i++) {
            tmp += probabilities[i]
            if (tmp > rando) {
                return i;
            }
        }
        return 0;
    }

    var randomDurationGenerator = function(probabilities, index) {
        //normalize probabilities
        var sum = 0.0;
        for (var i = 0; i < probabilities.length; i++) {
            sum += probabilities[i];
        }
        for (var i = 0; i < probabilities.length; i++) {
            probabilities[i] = probabilities[i]/sum;
        }

        var rando = Math.random();

        if (probabilities[index] < 1.0/(2.0*probabilities.length)) {
            return .5;
        }

        var tmp = probabilities[index]*1.8;
        var duration = .5;
        while (tmp < rando) {
            tmp += probabilities[index]*3.0;
            duration += .5;
        }
        return duration;

    }

    var fixMeter = function (totalBeats, notes, octaves, noteDurations) {
        var tmp = totalBeats;
        var stoppingIndex = 0;
        for (var i = 0; i < noteDurations.length; i++) {
            tmp -= noteDurations[i]
            if (tmp <= 0) {
                stoppingIndex = i+1;
                break;
            }
        }

        if (stoppingIndex >= 0) {
            notes = notes.splice(stoppingIndex);
            octaves = octaves.splice(stoppingIndex);
            noteDurations = noteDurations.splice(stoppingIndex);
        } else {
            notes = [];
            octaves = [];
            noteDurations = [];
        }

        var totalTime = 0.0;
        for (var i = 0; i < noteDurations.length; i++) {
            totalTime += noteDurations[i];
        }
        noteDurations[noteDurations.length - 1] = totalBeats - totalTime;
        
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

        console.log(notes);
        console.log(octaves);
        console.log(noteDurations);

        fixMeter(totalBeats, notes, octaves, noteDurations);


        var degreePattern = new PSequence(notes, Infinity);
        
        var octavePattern = new PSequence(octaves, Infinity);

        var durationPattern = new PSequence(noteDurations, Infinity);

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

    Demo.prototype.playMidSynth = function() {
        // Mid synth - actually just a HighSynth instance playing lower.
        // Scheduled as a mono synth
        this.midSynth = new HighSynth(this.audiolet);

        // Connect it to the output so we can hear it
        this.midSynth.connect(this.audiolet.output);

        // Falling arpeggio
        var arp = new PArithmetic(5, -1, 6);
        var degreePattern = new PSequence([arp], Infinity);

        // How long each event lasts
        var durationPattern = new PSequence([0.5], Infinity);

        // Schedule the patterns to play
        this.audiolet.scheduler.play([degreePattern],
                                     durationPattern,
            function(degree) {
                // Set the gate
                this.midSynth.trigger.trigger.setValue(1);
                // Calculate the frequency from the scale
                var frequency = this.scale.getFrequency(degree,
                                                        this.c2Frequency,
                                                        1);
                // Set the frequency
                this.midSynth.triangle.frequency.setValue(frequency);
            }.bind(this)
        );
    }

    Demo.prototype.playBassSynth = function() {
        // Bass synth - scheduled as a mono synth (i.e. one instance keeps
        // running and the gate and frequency are switched)
        this.bassSynth = new BassSynth(this.audiolet);

        // Connect it to the output so we can hear it
        this.bassSynth.connect(this.audiolet.output);

        // Bassline
        var degreePattern = new PSequence([0, 0, 1, 1, 2, 2, 3, 3],
                                          Infinity);

        // How long each event lasts - gate on for 14, off for 2
        var durationPattern = new PSequence([30, 2], Infinity);

        // Toggle the gate on and off
        var gatePattern = new PSequence([1, 0], Infinity);

        // Schedule the patterns to play
        var patterns = [degreePattern, gatePattern];
        this.audiolet.scheduler.play(patterns, durationPattern,
            function(degree, gate) {
                // Set the gates
                this.bassSynth.gainEnv.gate.setValue(gate);
                this.bassSynth.fmEnv.gate.setValue(gate);
                // Calculate the frequency from the scale
                var frequency = this.scale.getFrequency(degree,
                                                        this.c2Frequency,
                                                        1);
                // Set the frequency
                this.bassSynth.frequencyMulAdd.add.setValue(frequency);
                this.bassSynth.frequencyModulator.frequency.setValue(frequency * 4);
            }.bind(this)
        );
    }

    Demo.prototype.playKick = function() {
        // Kick - scheduled as a poly synth (i.e. a new instance is
        // launched for each note)

        // Four to the floor pattern
        // Schedule the patterns to play
        this.audiolet.scheduler.play([], 1,
            function() {
                var kick = new Kick(this.audiolet);
                kick.connect(this.audiolet.output);
            }.bind(this)
        );

    }

    Demo.prototype.playShaker = function() {
        // Shaker - four to the floor on the off-beat
        // Scheduled as a poly synth
        this.audiolet.scheduler.addRelative(0.5, function() {
            this.audiolet.scheduler.play([], 1,
                function() {
                    var shaker = new Shaker(this.audiolet);
                    shaker.connect(this.audiolet.output);
                }.bind(this)
            );
        }.bind(this));
    }

    // Run the demo
    window.demo = new Demo();
    //var processing = new Processing(document.getElementById('signal'), document.getElementById('processing').text);
    // document.getElementById('signal').parentElement.style.display = "block"
};
