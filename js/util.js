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

Array.prototype.choose = function() {
  return this[Math.floor(Math.random() * this.length)];
}

