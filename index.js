"use strict";
let ready = false;
let tempDuration = "4n";
let instruments = []
let currentInstrument = 0;
let pixelsPerBeat = 16
let theme = "wood"
let timeSig = {top:"4,", bottom:"4"}
let selectedNotes = [];
let allNotes = [];
let noteHeight = 10;
let fontSize = 12;
const lowPass = new Tone.AutoFilter("1000").toDestination();
const reverb = new Tone.Reverb(2).toDestination();
const synth = new Tone.PolySynth().connect(reverb).connect(lowPass);
function setup() {
    createCanvas(windowWidth-15, 840);
}
function draw() {
    clear();
    let xZoomLevel = document.getElementById("horizontalZoom").value;
    pixelsPerBeat = 16*(Math.pow(2,xZoomLevel-1));
    let yZoomLevel = document.getElementById("verticalZoom").value;
    noteHeight = 10*(Math.pow(2,yZoomLevel-1));
    let timeSigValue = document.getElementById("timeSig").value;
    let commaPos = timeSigValue.indexOf(",");
    let numBeforeComma = parseInt(timeSigValue.substring(0,commaPos));
    let numAfterComma = parseInt(timeSigValue.substring(commaPos+1));
    timeSig = {top:numBeforeComma, bottom:numAfterComma};
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
        line(0,height-(noteHeight*i),width,height-(noteHeight*i));
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
        strokeWeight(1)
    }
    if (instruments.length>0) {
        drawSequence(instruments[currentInstrument].notes);
    }
    stroke(255,0,0);
    let pixels = timeToPixels(Tone.Transport.seconds)
    line(pixels,0,pixels,height);
    noStroke();
    textSize(fontSize);
    text("Transport time: "+Tone.Transport.seconds, 30,10);
    text("Transport state: "+Tone.Transport.state, 30,20);
    stroke(0,0,255);
    let quantisedX = quantiseX(mouseX);
    line(quantisedX,0,quantisedX,height);
    noStroke();
    fill(40,40,40)
    for (let i = 0; i < allNotes.length; i++) {
        let offset = (noteHeight-fontSize)/2
        text(allNotes[i],5,height-(i*noteHeight)-offset);
    }
}
function quantiseX(x) {
    let noteLock = document.getElementById("gridLock").value;
    let pixelsPerNoteLock = pixelsPerBeat*(timeSig.bottom/4)*noteLock;
    return {quantisedX:Math.floor(x/pixelsPerNoteLock)*pixelsPerNoteLock, noteLock};
}
function mousePressed() {
    if (!ready) {
        Tone.start();
        ready = true;
    }
    let quantisedX = quantiseX(mouseX).quantisedX;
    let time = pixelsToTime(quantisedX);
    let pixelsAboveBottomOfCanvas = height - mouseY
    let noteNum = Math.floor(pixelsAboveBottomOfCanvas/noteHeight);
    let pitch = allNotes[noteNum];
    let note = findNoteAtLocation(time,pitch);

    let beats = (quantisedX/pixelsPerBeat)/2;
    if (!keyIsDown(SHIFT)) {
        selectedNotes = [];
    }
    if (note) {
        selectedNotes.push(note);
    }
    if (keyIsDown(CONTROL)) {
        if (note) {
            //delete the note
            instruments[currentInstrument].notes.splice(instruments[currentInstrument].notes.indexOf(note), 1);
        }
        else {
            //add a note
            synth.triggerAttackRelease(pitch, "8n");
            addNote(pitch, noteNum, beats);
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
    for (let note of sequence) {
        let noteLengthSeconds = Tone.Time(note.duration);
        let left = timeToBeats(note.noteStart);
        let length = timeToBeats(noteLengthSeconds);
        if (isTimeInNote(note.noteStart, noteLengthSeconds, Tone.Transport.seconds)) {
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
    }
}
function isTimeInNote(noteStart, noteDuration, timePoint) {
    return timePoint>=noteStart && timePoint<noteStart+noteDuration
}
function findNoteAtLocation(time,pitch) {
    let sequence = instruments[currentInstrument].notes;
    for (let i=0; i<sequence.length; i++) {
        let duration = Tone.Time(sequence[i].duration);
        if (isTimeInNote(sequence[i].noteStart, duration,time) && sequence[i].note===pitch) {
            return sequence[i];
        }
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
newInstrument()
function newInstrument() {
    instruments.push({notes:[],type:"pianoroll"});
    let button = document.createElement("button");
    let newSequenceNumber = instruments.length-1;
    button.textContent = "Select instrument "+newSequenceNumber;
    button.className = "button";
    button.onclick = function(){currentInstrument=newSequenceNumber;}
    document.getElementById("sequencery").appendChild(button);
    currentInstrument = newSequenceNumber;
}
function setDuration(target) {
    tempDuration = target;
}
function tempoChange(change) {
    Tone.Transport.bpm.value += change;
}
function addNote(pitch, noteNum, startBeat) {
    synth.triggerAttackRelease(pitch,"8n")
    instruments[currentInstrument].notes.push({note:pitch, duration:tempDuration, noteNum, noteStart:startBeat });
}
function playSequences() {
    if (Tone.Transport.state === "stopped") {
        Tone.Transport.stop();
        Tone.Transport.cancel();
        Tone.Transport.seconds = 0
        let longestSequence = 0;
        for (let sequence of instruments) {
            let sequenceLength = playSequence(sequence.notes);
            if (sequenceLength > longestSequence) {
                longestSequence = sequenceLength;
            }
        }
        Tone.Transport.start();
        Tone.Transport.schedule((time)=>{
            Tone.Transport.stop(time+0.1);
        }, longestSequence);
    }
    else if (Tone.Transport.state === "paused") {
        Tone.Transport.start()
    }
}
function playSequence(instrument) {
    let furthest = 0;
    for (let i=0; i<instrument.length; i++){
        Tone.Transport.schedule(function(time) {
            synth.triggerAttackRelease(instrument[i].note, instrument[i].duration,time)
        },instrument[i].noteStart);
        furthest = Math.max(furthest,instrument[i].noteStart+Tone.Time(instrument[i].duration));
    }
    return furthest;
}
function clearSequence() {
    instruments[currentInstrument].notes = [];
}
let notesList = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
let noteNum = 0;
for (let octave = 1; octave < 8; octave++) {
    for (let note of notesList) {
        allNotes.push(note+octave);
        noteNum++
    }
}
function saveSequences() {
    let a = document.createElement("a");
    let file = new Blob([JSON.stringify(instruments,null,2)], {type: "text/plain"});
    a.href = URL.createObjectURL(file);
    a.download = "sequences.json";
    a.click();
}
function loadFile() {
    let files = document.getElementById("loadFile").files;
    const reader = new FileReader();
    reader.onload = (e) => {
        let tempSequences = JSON.parse(atob(e.target.result.substring("data:application/json;base64,".length)));
        instruments = [];
        document.getElementById("sequencery").innerHTML = "";
        for (let sequence of tempSequences) {
            newInstrument();
        }
        instruments = tempSequences;
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