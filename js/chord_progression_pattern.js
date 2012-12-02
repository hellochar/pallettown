var PChordProgression = function (progressions, currentChord) {
  Pattern.call(this);
  this.currentChord = currentChord || 0;
  this.progressions = progressions.map(function (array) { return new PChoose(array, Infinity) });
}
extend(PChordProgression, Pattern);


PChordProgression.prototype.next = function() {
  var prev_chord = this.currentChord;
  this.currentChord = this.progressions[this.currentChord].next();
  return prev_chord;
};

