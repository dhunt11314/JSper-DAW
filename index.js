"use strict";
let tempDuration = "4n";
let sequences = []
let currentSequence = 0;
let pixelsPerBeat = 16
let theme = "wood"
let timeSig = {top:"4,", bottom:"4"}
let selectedNotes = [];
let allNotes = [];
const noteHeight = 10;
const lowPass = new Tone.AutoFilter("1000").toDestination();
const reverb = new Tone.Reverb(1.5).toDestination();
const synth = new Tone.PolySynth().connect(reverb).connect(lowPass);
function setup() {
    createCanvas(windowWidth*2, 840);
}
function draw() {
    clear();
    let timeSigValue = document.getElementById("timeSig").value;
    timeSig = {top:parseInt(timeSigValue.substring(0,timeSigValue.indexOf(","))), bottom:parseInt(timeSigValue.substring(timeSigValue.indexOf(",")+1,timeSigValue.length))};
    if (theme === "wood") {
        background(150,121,95);
    }
    else if (theme === "dark") {
        background(170, 165, 159);
    }
    if (theme === "wood") {
        stroke(130, 101, 75);
    }
    else if (theme === "dark") {
        stroke(150, 145, 139);
    }
    for (let i = 1; i<height/noteHeight; i++) {
        line(0,noteHeight*i,width,noteHeight*i);
    }
    let pixelsPerBar = pixelsPerBeat * timeSig.top;
    for (let i = 0; i<width/pixelsPerBar; i++) {
        if (theme === "wood") {
            stroke(31, 32, 31);
        }
        else if (theme === "dark") {
            stroke(51, 52, 59);
        }
        line(i*pixelsPerBar, 0, i*pixelsPerBar, height);
        if (theme === "wood") {
            stroke(195,191,184);
        }
        else if (theme === "dark") {
            stroke(72, 84, 124);
        }
        for (let j = 1; j < timeSig.top; j++) {
            line(i*pixelsPerBar+j*pixelsPerBeat, 0, i*pixelsPerBar+j*pixelsPerBeat, height);
        }
    }
    if (sequences.length>0) {
        drawSequence(sequences[currentSequence].notes);
    }
    stroke(255,0,0);
    let pixels = timeToPixels(Tone.Transport.seconds)
    line(pixels,0,pixels,height);
    noStroke();
    text("Transport time: "+Tone.Transport.seconds, 5,10);
    text("Transport state: "+Tone.Transport.state, 5,20);
    stroke(0,0,255);
    line(mouseX,0,mouseX,height);
}
function mousePressed() {
    if (!keyIsDown(SHIFT)) {
        selectedNotes = [];
    }
    let time = pixelsToTime(mouseX);
    let note = findNoteAtTime(time);
    if (note) {
        let noteTop = height-(note.noteNum*noteHeight)-noteHeight;
        let noteBottom = noteTop+noteHeight;
        if (mouseY>=noteTop && mouseY <= noteBottom) {
            selectedNotes.push(note);
        }
    }
}
function keyPressed() {
    if (key === "ArrowUp") {
        for (let note of selectedNotes) {
            note.noteNum++;
            note.note = allNotes[note.noteNum];
            synth.triggerAttackRelease(note.note,"8n");
        }
    }
    if (key === "ArrowDown") {
        for (let note of selectedNotes) {
            note.noteNum--;
            note.note = allNotes[note.noteNum];
            synth.triggerAttackRelease(note.note,"8n");
        }
    }
}
function drawSequence(sequence) {
    let totalTime = 0;
    for (let note of sequence) {
        let noteLengthSeconds = Tone.Time(note.duration);
        let left = timeToBeats(totalTime);
        let length = timeToBeats(noteLengthSeconds);
        if (isTimeInNote(totalTime, noteLengthSeconds, Tone.Transport.seconds)) {
            fill(160,170,200);
            stroke(255,255,255);
        }
        else {
            fill(31, 32, 31);
            stroke(71, 72, 71);
        }
        if (selectedNotes.includes(note)) {
            fill(20,25,170);
            stroke(10,13,85);
        }
        rect(left*pixelsPerBeat,height-(note.noteNum*noteHeight)-noteHeight,length*pixelsPerBeat,noteHeight);
        totalTime += noteLengthSeconds;
    }
}
function isTimeInNote(noteStart, noteDuration, timePoint) {
    return timePoint>=noteStart && timePoint<noteStart+noteDuration
}
function findNoteAtTime(time) {
    console.log("searching at time "+time);
    let total = 0;
    let sequence = sequences[currentSequence].notes;
    for (let i=0; i<sequence.length; i++) {
        console.log("loop");
        let startTime = total
        let duration = Tone.Time(sequence[i].duration);
        if (isTimeInNote(startTime, duration,time)) {
            console.log("found note");
            return sequence[i];
        }
        total += Tone.Time(sequence[i].duration);
    }
}
function pixelsToTime(x) {
    let beats = x/pixelsPerBeat;
    let beatTime = Tone.Time(timeSig.bottom+"n");
    return beats * beatTime;
}
function timeToBeats(time) {
    let beatTime = Tone.Time(timeSig.bottom+"n");
    return time/beatTime;
}
function timeToPixels(time) {
    let beats = timeToBeats(time);
    return pixelsPerBeat * beats;
}
createNoteButtons();
newSequence()
function newSequence() {
    sequences.push({notes:[],type:"pianoroll"});
    let button = document.createElement("button");
    let newSequenceNumber = sequences.length-1;
    button.textContent = "Select sequence "+newSequenceNumber;
    button.className = "button";
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
    //tone accepts an array when playing the note
    sequences[currentSequence].notes.push({isRest:false, note:frequency, duration:tempDuration, noteNum});
}
function addRest() {
    sequences[currentSequence].notes.push({isRest:true, duration:tempDuration});
}
function playSequences() {
    if (Tone.Transport.state === "stopped") {
        Tone.Transport.stop();
        Tone.Transport.cancel();
        Tone.Transport.seconds = 0
        let longestSequence = 0;
        for (let sequence of sequences) {
            let sequenceLength = playSequence(sequence.notes);
            if (sequenceLength > longestSequence) {
                longestSequence = sequenceLength;
            }
        }
        console.log(longestSequence);
        Tone.Transport.start();
        console.log(longestSequence);
        Tone.Transport.schedule((time)=>{
            console.log("Stopping");
            Tone.Transport.stop();
        }, longestSequence);
    }
    else if (Tone.Transport.state === "paused") {
        Tone.Transport.start()
    }
}
function playSequence(sequence) {
    let total = 0;
    for (let i=0; i<sequence.length; i++){
        if (sequence[i].isRest !== true) {
            Tone.Transport.schedule(function(time) {
                synth.triggerAttackRelease(sequence[i].note, sequence[i].duration)
            },total);
        }
        total += Tone.Time(sequence[i].duration);
    }
    return total;
}
function clearSequence() {
    sequences[currentSequence].notes = [];
}
function deleteLastNote() {
    sequences[currentSequence].notes.pop();
}
function createNoteButtons() {
    let noteContainer = document.getElementById("notes");
    let notes = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    let noteNum = 0;
    for (let octave = 1; octave < 8; octave++) {
        for (let note of notes) {
            let button = document.createElement("button");
            button.textContent = note+octave;
            allNotes.push(note+octave);
            button.className = "button";
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
    let a = document.createElement("a");
    let file = new Blob([JSON.stringify(sequences,null,2)], {type: "text/plain"});
    a.href = URL.createObjectURL(file);
    a.download = "sequences.json";
    a.click();
}
function loadFile() {
    let files = document.getElementById("loadFile").files;
    console.log(files[0]);
    const reader = new FileReader();
    reader.onload = (e) => {
        let tempSequences = JSON.parse(atob(e.target.result.substring("data:application/json;base64,".length)));
        sequences = [];
        document.getElementById("sequencery").innerHTML = "";
        for (let sequence of tempSequences) {
            newSequence();
        }
        sequences = tempSequences;
    }
    reader.readAsDataURL(files[0]);
}
function changeStyle() {
    let styleSheet = document.getElementById("theme");
    if (theme === "wood") {
        styleSheet.setAttribute("href", "darkStyle.css")
        theme = "dark";
    }
    else if (theme === "dark") {
        styleSheet.setAttribute("href", "woodStyle.css")
        theme = "wood";
    }
}
function stopSequences() {
    Tone.Transport.stop();
}
function pauseSequences() {
    if (Tone.Transport.state === "paused") {
        Tone.Transport.start()
    }
    else if (Tone.Transport.state === "started") {
        Tone.Transport.pause();
    }
}