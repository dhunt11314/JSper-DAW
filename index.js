let tempDuration = "8n";
let sequences = []
let currentSequence = 0;
let position = 0
let scale = 32;
const lowPass = new Tone.AutoFilter("1000").toDestination();
const reverb = new Tone.Reverb(1.5).toDestination();
const synth = new Tone.PolySynth().connect(reverb).connect(lowPass);
function setup() {
    createCanvas(windowWidth-15, 720);
}
function draw() {
    clear();
    background(150);
    for (let i = 1; i<32; i++) {
        stroke(0);
        line(2*i*scale,0,2*i*scale,height)
    }
    stroke(100);
    for (let i = 0.5; i<32; i++) {
        line(2*i*scale,0,2*i*scale,height)
    }
    stroke(255,0,0);
    line(mouseX,0,mouseX,height);
    line(0,mouseY,width,mouseY)
    if (sequences.length > 0) {
        drawSequence(sequences[currentSequence].notes);
    }
}
function drawSequence(sequence) {
    let totalTime = 0;
    for (let note of sequence) {
        let left = totalTime*scale;
        let length = Tone.Time(note.duration)*scale;
        fill(160,130,160);
        stroke(100,60,100);
        rect(left,height-(note.noteNum*10)-10,length,10);
        totalTime += Tone.Time(note.duration);
    }
}
createNoteButtons();
function newSequence() {
    sequences.push({notes:[],type:"pianoroll"});
    let button = document.createElement("button");
    let newSequenceNumber = sequences.length-1;
    button.textContent = "Select sequence "+newSequenceNumber;
    button.onclick = function(){currentSequence=newSequenceNumber;}
    document.getElementById("sequencery").appendChild(button);
    currentSequence = newSequenceNumber;
}
function setDuration(target) {
    tempDuration = target;
}
function tempoChange(change) {
    Tone.Transport.bpm.value += change;
}
function addNote(frequency, noteNum) {
    synth.triggerAttackRelease(frequency,"8n")
    sequences[currentSequence].notes.push({isRest:false, note:[frequency], duration:tempDuration, noteNum});
}
function addRest() {
    sequences[currentSequence].notes.push({isRest:true, duration:tempDuration});
}
function playSequences() {
    for (let sequence of sequences) {
        playSequence(sequence.notes);
    }
}
function playSequence(sequence) {
    const now = Tone.now();
    let total = 0;
    for (let i=0; i<sequence.length; i++){
        if (sequence[i].isRest !== true) {
            synth.triggerAttackRelease(sequence[i].note, sequence[i].duration, now+total);
        }
        total += Tone.Time(sequence[i].duration);
    }
}
function clearSequence() {
    sequences[currentSequence].notes = [];
}
function deleteLastNote() {
    sequences[currentSequence].notes.pop();
}
function createNoteButtons() {
    let noteContainer = document.getElementById("notes");
    let notes = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B",];
    let noteNum = 0;
    for (let octave = 2; octave < 8; octave++) {
        for (let note of notes) {
            let button = document.createElement("button");
            button.textContent = note+octave;
            let fooNoteNum = noteNum
            button.onclick = function(){addNote(note+octave, fooNoteNum);}
            noteContainer.appendChild(button);
            noteNum++
        }
        let lineBreak = document.createElement("br");
        noteContainer.appendChild(lineBreak);
    }
}
function saveSequences() {
    console.log(JSON.stringify(sequences));
    let a = document.createElement("a");
    let file = new Blob([JSON.stringify(sequences)], {type: "text/plain"});
    a.href = URL.createObjectURL(file);
    a.download = "sequences.json";
    a.click();
}