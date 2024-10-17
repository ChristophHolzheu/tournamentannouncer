let timerInterval;
let remainingTime;
let isPaused = false;
let currentRound = 1;
let totalRounds = 1;
let isPlaying = true; // Gibt an, ob gerade ein Spiel läuft (nicht Pause)
let isFirstHalf = true; // Gibt an, ob die erste Halbzeit läuft
let feldanzahl = 1;

let game;
let field
let team1;
let team2;
let referee;

let voices = [];

function initialisation() {
    voices = speechSynthesis.getVoices();
    // Lade Stimmen und überwache Änderungen der Stimmenliste
    if (typeof speechSynthesis !== "undefined") {
        loadVoices(); // Initial laden

        // Stimmen asynchron laden, wenn sie verfügbar werden
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = loadVoices;
        }
    }

    addInitialRows(100);
    initstatusSelector();
    inithalfTimeSelector();
    updateArrowPosition(currentRound,isPlaying);
    generateFields();
}

function announcement() {
    isPlaying = Number(document.getElementById("statusSelector").value);
    feldanzahl = parseInt(document.getElementById('fieldSelector').value);
    currentRound = parseInt(document.getElementById("roundSelector").value);
    if(!isPaused && isPlaying) {
        let text ="";
        for(let i=1; i <=feldanzahl;i++) {
            readTableRow(currentRound + i - 1)
            if(i == 1) {
                text = text + `${game}, , ,`;
            }
            text = text + `${field}, , ${team1} gegen ${team2}, Schiedsrichter ${referee}, , ,` 
        }
        text = text + `Mannschaften und Schiedsrichter Achtung`;
        speakText(text, function() {
            playBeep(0.5);
            startTimer();
         });
    }
    else { 
        startTimer();
    }
}

function startTimer() {
    const spieldauer = document.getElementById("spieldauer").value;
    const pausendauer = document.getElementById("pausendauer").value;
    const halbzeitAktiv = document.getElementById("halbzeit").checked;
    

    if (isPaused) {
        isPaused = false; // Keine Neue Zeitberechnung
    } 
    else {
        if(isPlaying) { //Zeitberechnung Spiel
            if (halbzeitAktiv) {
                remainingTime = Math.floor(spieldauer * 60 * 5); // 1. Halbzeit
            } else {
                remainingTime = Math.floor(spieldauer * 60 * 10); // Vollzeit
            }
        }
        else {  // Zeitberechnung Pause
            remainingTime = Math.floor(pausendauer * 60 * 10); // Pausenzeit
        }

        isFirstHalf = Number(document.getElementById("halfTimeSelector").value);
    }
        
    clearInterval(timerInterval);
    updateCurrentStatusDisplay(); // Zeigt den aktuellen Status an
    updateCurrentRoundDisplay(); // Zeigt den aktuellen Durchgang an
    updateCurrentHalfTimeDisplay(); // Zeigt die akutelle Halbzeit an
    updateArrowPosition(currentRound,isPlaying);

    timerInterval = setInterval(function() {
        if (remainingTime > 0) {
            remainingTime--;
            updateDisplay(remainingTime);
            if (remainingTime === 600) {
                if (isPlaying) {
                    if(isFirstHalf && halbzeitAktiv) {
                        speakText("Letzte Spiel Minute");
                    }
                    else {
                        if ((currentRound + 1) <= totalRounds) {
                            speakText("Letzte Spiel Minute, , ,", function() {
                                let text ="Nächste Spielpaarungen, ,";
                                for(let i=1; i <=feldanzahl;i++) {
                                    readTableRow(currentRound + i - 1 + feldanzahl)
                                    if(i == 1) {
                                        text = text + `${game}, , ,`;
                                    }
                                    text = text + `${field}, , ${team1} gegen ${team2}, Schiedsrichter ${referee}, , ,` 
                                }
                                speakText(text);
                            });
                        }
                        else {
                            speakText("Letzte Spiel Minute");
                        }
                    }
                }
                else {
                    speakText("Spielbeginn in Einer Minute, Bitte zur Begrüßung")
                }
            }
            if ((remainingTime === 30 || remainingTime === 20 || remainingTime === 10) && isPlaying) {
                playBeep(0.2);
            }
            if (!isPlaying && ((pausendauer *60*10) - remainingTime === 600)) {
                let text ="Nächste Spielpaarungen, ,";
                for(let i=1; i <=feldanzahl;i++) {
                    readTableRow(currentRound + i - 1 + feldanzahl)
                    if(i == 1) {
                        text = text + `${game}, , ,`;
                    }
                    text = text + `${field}, , ${team1} gegen ${team2}, Schiedsrichter ${referee}, , ,` 
                }
                speakText(text);
            }
            if(remainingTime === 30 && !isPlaying) {
                speakText("Mannschaften und Schiedsrichter Achtung");
            }
        } 
        else {
            if (isPlaying) {
                if (isFirstHalf && halbzeitAktiv) {
                    // Wechsel zur 2. Halbzeit
                    remainingTime = Math.floor(spieldauer * 60 * 5); // 2. Halbzeit
                    isFirstHalf = false;
                    playBeep(0.5);
                    speakText("Zweite Halb Zeit, Zeit läuft weiter");
                } else {
                    // Wechsel zu Pause
                    remainingTime = Math.floor(pausendauer * 60 * 10);
                    isPlaying = false;
                    playBeep(0.5);
                    speakText("Spiel Ende");
                    if ((currentRound + 1) > totalRounds) {
                        stopTimer();
                    }
                }
            } else {
                // Wechsle zum nächsten Durchgang oder beende den Timer
                for (let i = 1; i <=feldanzahl; i++) {
                    currentRound++;
                }
                if (currentRound > totalRounds) {
                    playBeep(0.5);
                    speakText("Spiel Ende");
                    stopTimer();
                } else {
                    // Nächster Durchgang
                    if (halbzeitAktiv) {
                        // Wenn Halbzeit aktiv ist, starte mit 1. Halbzeit
                        remainingTime = Math.floor(spieldauer * 60 * 5);
                        isFirstHalf = true; // Starte nach der Pause immer mit 1. Halbzeit                     
                    } else {
                        // Wenn keine Halbzeit, starte mit Vollzeit
                        remainingTime = Math.floor(spieldauer * 60 * 10);
                    }
                    playBeep(0.5);
                    speakText("Spiel Beginn");
                    isPlaying = true;
                }
            }
            updateCurrentStatusDisplay();
            updateCurrentRoundDisplay(); // Zeige aktuellen Durchgang an
            updateCurrentHalfTimeDisplay();
            updateArrowPosition(currentRound,isPlaying);
        }
    }, 100);
}

function stopTimer() {
    clearInterval(timerInterval);
    remainingTime = 0;
    updateDisplay(remainingTime);
    currentRound = parseInt(document.getElementById("roundSelector").value);
    isPaused = false;
}

function pauseTimer() {
    isPaused = true;
    clearInterval(timerInterval);  // Timer anhalten
}

// Aktualisieren der Anzeige des Timers
function updateDisplay(seconds) {
    const minutes = Math.floor(seconds / 600);
    const secs = Math.floor((seconds % 600) / 10);
    const pointsec = seconds % 10;
    document.getElementById("timerDisplay").innerHTML = 
        (minutes < 10 ? "0" : "") + minutes + ":" + (secs < 10 ? "0" : "") + secs + "." + pointsec;
}

// Funktion zur Sprachausgabe
function loadVoices() {
    voices = speechSynthesis.getVoices();
    //console.log(voices); // Überprüfe im Debug, ob die Stimmen jetzt geladen sind
}

function speakText(text, callback) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE'; // Sprache auf Deutsch setzen
    utterance.volume = (document.getElementById("speakvolume").value)/100; // Maximale Lautstärke
    utterance.rate = 0.9; // Normale Geschwindigkeit (1 statt 10)
    utterance.pitch = 1; // Normale Tonhöhe

    const voicenumber = document.getElementById("selectedvoice").value;
    let selectedVoice; // Variable, die die gewählte Stimme speichert

    switch(parseInt(voicenumber)) {
        case 1: 
            selectedVoice = voices.find(voice => voice.name === 'Microsoft Michael - German (Austria)');
            break;
        case 2: 
            selectedVoice = voices.find(voice => voice.name === 'Microsoft Katja Online (Natural) - German (Germany)');
            break;
        case 3: 
            selectedVoice = voices.find(voice => voice.name === 'Microsoft Ingrid Online (Natural) - German (Austria)');
            break;
        case 4: 
            selectedVoice = voices.find(voice => voice.name === 'Microsoft Jonas Online (Natural) - German (Austria)');
            break;
        case 5: 
            selectedVoice = voices.find(voice => voice.name === 'Microsoft SeraphinaMultilingual Online (Natural) - German (Germany)');
            break;
        case 6: 
            selectedVoice = voices.find(voice => voice.name === 'Microsoft FlorianMultilingual Online (Natural) - German (Germany)');
            break;
        case 7: 
            selectedVoice = voices.find(voice => voice.name === 'Microsoft Amala Online (Natural) - German (Germany)');
            break;
        case 8: 
            selectedVoice = voices.find(voice => voice.name === 'Microsoft Conrad Online (Natural) - German (Germany)');
            break;
        case 9: 
            selectedVoice = voices.find(voice => voice.name === 'Microsoft Katja Online (Natural) - German (Germany)');
            break;
        case 10: 
            selectedVoice = voices.find(voice => voice.name === 'Microsoft Killian Online (Natural) - German (Germany)');
            break;
        default:
            console.warn("Stimme nicht gefunden");
            break;
    }

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }


    // Wenn ein Callback übergeben wird, setze den onend Event-Handler
    if (callback) {
        utterance.onend = function() {
            callback(); // Callback nach dem Ende der Sprachausgabe ausführen
        };
    }
    window.speechSynthesis.speak(utterance);
}


function playBeep(duration) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';  // Wellenform des Beeps (sine klingt wie ein "Beep")
    oscillator.frequency.setValueAtTime(500, audioContext.currentTime); // Frequenz des Beeps (1000 Hz ist ein typischer Beep-Ton)
    gainNode.gain.setValueAtTime((document.getElementById("beepvolume").value)/10, audioContext.currentTime); // Lautstärke

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration); // Spielt den Beep für 0.1 Sekunden ab
}

function generateFields() {
    feldanzahl = parseInt(document.getElementById('fieldSelector').value);
    const fieldCount = document.getElementById('fieldSelector').value;
    const gameTableBody = document.getElementById('gameTable').getElementsByTagName('tbody')[0];
    
    // Lösche den aktuellen Inhalt des Tabellenkörpers
    gameTableBody.innerHTML = '';

    // Erzeuge die entsprechenden Zeilen für Durchgänge
    
    for (let i = 0; i < totalRounds; i++) {
        const row = gameTableBody.insertRow();
        
        const cellGame = row.insertCell(0);
        const cellField = row.insertCell(1);
        const cellTeam1 = row.insertCell(2);
        const cellTeam2 = row.insertCell(3);
        const cellReferee = row.insertCell(4);
        
        // Setze die Standardwerte
        const roundNumber = Math.ceil((i+1) / fieldCount); // Berechne den Durchgang
        cellGame.innerHTML = `<input type="text" name="game" value="Durchgang ${roundNumber}">`;
        
        // Berechne das aktuelle Feld basierend auf dem Durchgang
        const fieldIndex = i % fieldCount+1;
        cellField.innerHTML = `<input type="text" name="field" value="Feld ${fieldIndex}">`;
        cellTeam1.innerHTML = `<input type="text" name="team1" value="Team ${String.fromCharCode(65 + i * 2)}">`;
        cellTeam2.innerHTML = `<input type="text" name="team2" value="Team ${String.fromCharCode(66 + i * 2)}">`;
        cellReferee.innerHTML = `<input type="text" name="referee" value="Schiedsrichter ${i+1}">`;
        
    }
    initRoundSelector()
}




document.querySelectorAll('#gameTable input').forEach(input => {
    input.addEventListener('input', checkForNewRow);
});

function addInitialRows(count) {
    for (let i = 2; i <= count; i++) {
        totalRounds++;
        const tableBody = document.querySelector('#gameTable tbody');
        const newRow = document.createElement('tr');

        newRow.innerHTML = `
            <td><input type="text" name="game" value="Durchgang ${i}"></td>
            <td><input type="text" name="field"></td>
            <td><input type="text" name="team1"></td>
            <td><input type="text" name="team2"></td>
            <td><input type="text" name="referee"></td>
        `;

        tableBody.appendChild(newRow);

        // Füge Event-Listener für die neuen Inputs hinzu
        newRow.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', checkForNewRow);
        });
    }
}


function checkForNewRow() {
    const rows = document.querySelectorAll('#gameTable tbody tr');
    const lastRowInputs = rows[rows.length - 1].querySelectorAll('input');
    
    // Prüfe, ob die letzte Zeile komplett ausgefüllt ist
    const isLastRowFilled = Array.from(lastRowInputs).every(input => input.value.trim() !== '');
    
    if (isLastRowFilled) {
        addNewRow();
    }
}

function addNewRow() {
    totalRounds++;
    initRoundSelector();
    const tableBody = document.querySelector('#gameTable tbody');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td><input type="text" name="game"></td>
        <td><input type="text" name="field"></td>
        <td><input type="text" name="team1"></td>
        <td><input type="text" name="team2"></td>
        <td><input type="text" name="referee"></td>
    `;
    
    tableBody.appendChild(newRow);
    
    // Füge Event-Listener für die neuen Inputs hinzu
    newRow.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', checkForNewRow);
    });
}

function readTableRow(round) {
    const table = document.getElementById("gameTable");
    const rows = table.querySelectorAll("tbody tr"); // Greift auf alle Zeilen im <tbody> zu

    if (round - 1 < rows.length) { // Überprüfen, ob es die Zeile gibt
        const row = rows[round - 1]; // Hole die entsprechende Zeile (round-1 wegen null-basiertem Index)
        const cells = row.querySelectorAll("td input"); // Greift auf alle <input> in der Zeile zu

        game = cells[0].value; // Wert aus der ersten Spalte (Spiel)
        field = cells[1].value; // Wert aus der zweiten Spalte (Feld)
        team1 = cells[2].value; // Wert aus der dritten Spalte (Team 1)
        team2 = cells[3].value; // Wert aus der vierten Spalte (Team 2)
        referee = cells[4].value; // Wert aus der fünften Spalte (Schiedsrichter)

    } else {
        console.warn("Kein weiterer Durchgang vorhanden.");
    }
}

// Funktion zum Initialisieren des Dropdown-Menüs basierend auf den Runden
function initRoundSelector() {
    const roundSelector = document.getElementById("roundSelector");
    roundSelector.innerHTML = ''; // Leert das Dropdown vor der Initialisierung

    for (let i = 1; i <= totalRounds; i=i+feldanzahl) {
        const option = document.createElement("option");
        option.value = i;
        //option.text = `Durchgang ${i}`;
        option.text = document.getElementById("gameTable").querySelectorAll("tbody tr")[i-1].querySelectorAll("td input")[0].value;
        roundSelector.appendChild(option);
    }
    roundSelector.value = currentRound;
}

// Diese Funktion wird aufgerufen, wenn der Benutzer manuell einen Durchgang auswählt
function manualRoundSelection() {
    //Liest aktuellen Wert ein für Auswahl und übergibt an currentRound
    currentRound = parseInt(document.getElementById("roundSelector").value);
    // Aktualisiere die Anzeige basierend auf der manuellen Auswahl
    updateCurrentRoundDisplay();
}

// Diese Funktion aktualisiert den aktuellen Durchgang (entweder automatisch oder manuell)
function updateCurrentRoundDisplay() {
    document.getElementById("roundSelector").value = currentRound;
}

// Funktion zum Initialisieren des Dropdown-Menüs des Status
function initstatusSelector() {
    const statusSelector = document.getElementById("statusSelector");
    statusSelector.innerHTML = ''; // Leert das Dropdown vor der Initialisierung

    const isPlayingOption = document.createElement("option");
    isPlayingOption.text = "Spiel";
    isPlayingOption.value = 1;

    const isBreakOption = document.createElement("option");
    isBreakOption.text = "Pause";
    isBreakOption.value = 0;

    statusSelector.appendChild(isPlayingOption);
    statusSelector.appendChild(isBreakOption);

    statusSelector.value = Number(isPlaying);
}

function manualstatusSelection() {
    isPlaying = Number(document.getElementById("statusSelector").value);
}

function updateCurrentStatusDisplay() {
    document.getElementById("statusSelector").value = Number(isPlaying);
}

// Funktion zum Initialisieren des Dropdown-Menüs der Halbzeit
function inithalfTimeSelector() {
    const halfTimeSelector = document.getElementById("halfTimeSelector");
    halfTimeSelector.innerHTML = ''; // Leert das Dropdown vor der Initialisierung

    if(document.getElementById("halbzeit").checked) {
    const isFirstHalfOption = document.createElement("option");
    isFirstHalfOption.text = "1. Halbzeit";
    isFirstHalfOption.value = 1;

    const isSecondHalfOption = document.createElement("option");
    isSecondHalfOption.text = "2. Halbzeit";
    isSecondHalfOption.value = 0;

    halfTimeSelector.appendChild(isFirstHalfOption);
    halfTimeSelector.appendChild(isSecondHalfOption);
    
    halfTimeSelector.value = Number(isFirstHalf);
    }
}

function manualhalfTimeSelection() {
    isFirstHalf = Number(document.getElementById("halfTimeSelector").value);
}

function updateCurrentHalfTimeDisplay() {
    document.getElementById("halfTimeSelector").value = Number(isFirstHalf);
}

function updateArrowPosition(forRound, forPlaying) {
    const arrowIcon = document.getElementById("arrowIcon");
    
    // Pfeil anzeigen, falls er versteckt ist
    arrowIcon.style.display = "inline";


    // Verschiebe den Pfeil auf die Position der aktiven Zeile
    if(forPlaying){
        const refRow = document.getElementById("gameTable").querySelectorAll("thead tr")[0];
        const targetRow = document.getElementById("gameTable").querySelectorAll("tbody tr")[forRound-1];

        const refRowOffset = refRow.getBoundingClientRect().top;
        const targetRowOffset = targetRow.getBoundingClientRect().top;

        arrowIcon.style.top = (targetRowOffset - refRowOffset) + 33 + "px";
        arrowIcon.style.color = "green";
    }
    else {
        const refRow = document.getElementById("gameTable").querySelectorAll("thead tr")[0];
        const targetRow = document.getElementById("gameTable").querySelectorAll("tbody tr")[forRound-1+feldanzahl-1];
        const pauseRow = document.getElementById("gameTable").querySelectorAll("tbody tr")[forRound+feldanzahl-1];
        
        const refRowOffset = refRow.getBoundingClientRect().top;
        const targetRowOffset = targetRow.getBoundingClientRect().top;
        const pauseRowOffset = pauseRow.getBoundingClientRect().top;
        
        arrowIcon.style.top = ((targetRowOffset + pauseRowOffset)/2 - refRowOffset) + 33 + "px";
        arrowIcon.style.color = "red";
    }

}
