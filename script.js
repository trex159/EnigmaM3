// Historical Enigma Machine Configuration
const ROTORS = {
    I: {
        wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ',
        notch: 'Q',  // Historically accurate notch position
        turnover: 'Q' // Added for double-stepping mechanism
    },
    II: {
        wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE',
        notch: 'E',
        turnover: 'E'
    },
    III: {
        wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO',
        notch: 'V',
        turnover: 'V'
    },
    IV: {
        wiring: 'ESOVPZJAYQUIRHXLNFTGKDCMWB',
        notch: 'J',
        turnover: 'J'
    },
    V: {
        wiring: 'VZBRGITYUPSDNHLXAWMJQOFECK',
        notch: 'Z',
        turnover: 'Z'
    },
    VI: {
        wiring: 'JPGVOUMFYQBENHZRDKASXLICTW',
        notch: 'ZM', // M3 and M4 had two notches
        turnover: 'ZM'
    },
    VII: {
        wiring: 'NZJHGRCXMYSWBOUFAIVLPEKQDT',
        notch: 'ZM',
        turnover: 'ZM'
    },
    VIII: {
        wiring: 'FKQHTLXOCBJSPDZRAMEWNIUYGV',
        notch: 'ZM',
        turnover: 'ZM'
    }
};

const REFLECTORS = {
    B: 'YRUHQSLDPXNGOKMIEBFZCWVJAT', // Historical UKW-B
    C: 'FVPJIAOYEDRZXWGCTKUQSBNMHL'  // Historical UKW-C
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

class EnigmaMachine {
    constructor() {
        this.reset();
    }

    reset() {
        this.rotors = [
            { type: 'I', ring: 0, position: 0 },
            { type: 'II', ring: 0, position: 0 },
            { type: 'III', ring: 0, position: 0 }
        ];
        this.reflector = 'B';
        this.plugboard = new Map();
    }

    setRotor(index, type, ring, position) {
        if (!ROTORS[type]) {
            throw new Error(`Invalid rotor type: ${type}`);
        }
        this.rotors[index] = {
            type,
            ring: ALPHABET.indexOf(ring.toUpperCase()),
            position: ALPHABET.indexOf(position.toUpperCase())
        };
    }

    setReflector(type) {
        if (!REFLECTORS[type]) {
            throw new Error(`Invalid reflector type: ${type}`);
        }
        this.reflector = type;
    }

    setPlugboard(pairs) {
        this.plugboard.clear();
        if (!pairs.trim()) return;

        const usedLetters = new Set();
        pairs.split(' ').forEach(pair => {
            if (pair.length !== 2) {
                throw new Error('Invalid plugboard pair length');
            }
            const [a, b] = pair.toUpperCase().split('');
            if (usedLetters.has(a) || usedLetters.has(b)) {
                throw new Error('Duplicate plugboard connections');
            }
            this.plugboard.set(a, b);
            this.plugboard.set(b, a);
            usedLetters.add(a);
            usedLetters.add(b);
        });
    }

    rotate() {
        // Implement double-stepping mechanism
        const willMiddleStep = 
            this.rotors[2].position === ALPHABET.indexOf(ROTORS[this.rotors[2].type].turnover) ||
            this.rotors[1].position === ALPHABET.indexOf(ROTORS[this.rotors[1].type].turnover);

        if (willMiddleStep) {
            this.rotors[1].position = (this.rotors[1].position + 1) % 26;
            if (this.rotors[1].position === ALPHABET.indexOf(ROTORS[this.rotors[1].type].turnover)) {
                this.rotors[0].position = (this.rotors[0].position + 1) % 26;
            }
        } else if (this.rotors[2].position === ALPHABET.indexOf(ROTORS[this.rotors[2].type].turnover)) {
            this.rotors[1].position = (this.rotors[1].position + 1) % 26;
        }

        // Right rotor always steps
        this.rotors[2].position = (this.rotors[2].position + 1) % 26;
    }

    encryptLetter(letter) {
        if (!ALPHABET.includes(letter)) return letter;

        // Rotate rotors before encryption
        this.rotate();

        // Apply plugboard
        let current = this.plugboard.get(letter) || letter;

        // Forward through rotors
        current = this.passRotors(current, false);

        // Through reflector
        current = REFLECTORS[this.reflector][ALPHABET.indexOf(current)];

        // Backward through rotors
        current = this.passRotors(current, true);

        // Apply plugboard again
        return this.plugboard.get(current) || current;
    }

    passRotors(letter, reverse) {
        let current = letter;
        const rotorOrder = reverse ? [0, 1, 2] : [2, 1, 0];

        for (const i of rotorOrder) {
            const rotor = this.rotors[i];
            const shift = (rotor.position - rotor.ring + 26) % 26;
            
            // Shift into rotor
            const letterIndex = (ALPHABET.indexOf(current) + shift + 26) % 26;
            
            if (!reverse) {
                // Forward through rotor
                current = ROTORS[rotor.type].wiring[letterIndex];
            } else {
                // Backward through rotor
                current = ALPHABET[ROTORS[rotor.type].wiring.indexOf(ALPHABET[letterIndex])];
            }
            
            // Shift out of rotor
            current = ALPHABET[(ALPHABET.indexOf(current) - shift + 26) % 26];
        }

        return current;
    }
}

// UI Integration
const enigma = new EnigmaMachine();

// DOM Elements
const rotorSelects = [
    document.getElementById('rotor1-type'),
    document.getElementById('rotor2-type'),
    document.getElementById('rotor3-type')
];
const rotorRings = [
    document.getElementById('rotor1-ring'),
    document.getElementById('rotor2-ring'),
    document.getElementById('rotor3-ring')
];
const rotorPositions = [
    document.getElementById('rotor1-start'),
    document.getElementById('rotor2-start'),
    document.getElementById('rotor3-start')
];
const reflectorSelect = document.getElementById('reflector-type');
const plugboardInput = document.getElementById('plugboard-pairs');
const inputText = document.getElementById('input-text');
const outputText = document.getElementById('output-text');
const processBtn = document.getElementById('process-btn');
const resetBtn = document.getElementById('reset-btn');
const copyBtn = document.getElementById('copy-btn');
const lamps = document.querySelectorAll('.lamp');
const tutorialToggle = document.getElementById('tutorial-toggle');
const tutorial = document.getElementById('tutorial');
const dailyKeySelect = document.getElementById('daily-key-select');

function validateSettings() {
    const messages = [];
    
    // Check for duplicate rotors
    const rotorTypes = rotorSelects.map(select => select.value);
    if (new Set(rotorTypes).size !== rotorTypes.length) {
        messages.push('Fehler: Jede Walze darf nur einmal verwendet werden.');
    }

    // Validate ring and position settings
    [...rotorRings, ...rotorPositions].forEach(input => {
        const value = input.value.toUpperCase();
        if (!/^[A-Z]$/.test(value)) {
            messages.push('Fehler: Ring- und Grundstellungen müssen einzelne Buchstaben (A-Z) sein.');
        }
    });

    // Validate plugboard
    const plugboardValue = plugboardInput.value.trim();
    if (plugboardValue) {
        const pairs = plugboardValue.split(' ');
        const usedLetters = new Set();
        
        for (const pair of pairs) {
            if (!/^[A-Z]{2}$/.test(pair)) {
                messages.push('Fehler: Steckerbrett-Paare müssen aus zwei Großbuchstaben bestehen.');
                break;
            }
            
            const [a, b] = pair.split('');
            if (usedLetters.has(a) || usedLetters.has(b)) {
                messages.push('Fehler: Jeder Buchstabe darf nur einmal im Steckerbrett verwendet werden.');
                break;
            }
            
            usedLetters.add(a);
            usedLetters.add(b);
        }

        if (pairs.length > 10) {
            messages.push('Fehler: Maximal 10 Steckerbrett-Paare sind erlaubt.');
        }
    }

    return messages;
}

function showValidationMessage(messages) {
    const validationElement = document.getElementById('validation-message');
    if (messages.length > 0) {
        validationElement.textContent = messages.join(' ');
        validationElement.classList.add('show');
        return false;
    } else {
        validationElement.classList.remove('show');
        return true;
    }
}

function updateEnigmaSettings() {
    try {
        // Update rotor settings
        rotorSelects.forEach((select, i) => {
            enigma.setRotor(
                i,
                select.value,
                rotorRings[i].value.toUpperCase(),
                rotorPositions[i].value.toUpperCase()
            );
        });

        // Update reflector
        enigma.setReflector(reflectorSelect.value);

        // Update plugboard
        enigma.setPlugboard(plugboardInput.value.toUpperCase());

        return true;
    } catch (error) {
        showValidationMessage([error.message]);
        return false;
    }
}

function processText() {
    const validationMessages = validateSettings();
    if (!showValidationMessage(validationMessages)) {
        return;
    }

    if (!updateEnigmaSettings()) {
        return;
    }

    const input = inputText.value.toUpperCase().replace(/[^A-Z]/g, '');
    let output = '';
    let formattedOutput = '';
    let count = 0;

    for (const char of input) {
        const encrypted = enigma.encryptLetter(char);
        output += encrypted;
        formattedOutput += encrypted;
        count++;

        // Historical format: groups of 5 letters
        if (count % 5 === 0 && count < input.length) {
            formattedOutput += ' ';
        }

        // Animate lamp
        const lamp = document.querySelector(`.lamp[data-letter="${encrypted}"]`);
        if (lamp) {
            lamp.classList.add('active');
            setTimeout(() => lamp.classList.remove('active'), 200);
        }
    }

    outputText.value = formattedOutput;
}

function resetSettings() {
    enigma.reset();
    const todaysSettings = getTodaysMaschinenschlussel();
    
    if (todaysSettings) {
        applySettings(todaysSettings);
    }
    
    inputText.value = '';
    outputText.value = '';
    
    updateEnigmaSettings();
}

function getTodaysMaschinenschlussel() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate());
    
    // Check for historical dates
    if (month === '06' && day >= '6' && day <= '8') {
        return MASCHINENSCHLUSSEL['1944-06'].keys[day];
    }
    
    if (month === '06' && day >= '22' && day <= '24') {
        return MASCHINENSCHLUSSEL['1941-06'].keys[day];
    }
    
    if (month === '02' && day <= '3') {
        return MASCHINENSCHLUSSEL['1942-02'].keys[day];
    }
    
    // Generate deterministic settings for other dates
    return generateDailySettings(year, month, day);
}

function generateDailySettings(year, month, day) {
    let seed = parseInt(`${year}${month}${day}`);
    
    function seededRandom() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    }
    
    const rotorTypes = ['I', 'II', 'III', 'IV', 'V'];
    const rotors = [];
    const used = new Set();
    
    // Select unique rotors
    while (rotors.length < 3) {
        const index = Math.floor(seededRandom() * rotorTypes.length);
        const rotor = rotorTypes[index];
        if (!used.has(rotor)) {
            rotors.push(rotor);
            used.add(rotor);
        }
    }
    
    const rings = Array(3).fill().map(() => 
        ALPHABET[Math.floor(seededRandom() * 26)]);
    
    const positions = Array(3).fill().map(() => 
        ALPHABET[Math.floor(seededRandom() * 26)]);
    
    // Generate plugboard pairs
    const plugboardPairs = [];
    const usedLetters = new Set();
    while (plugboardPairs.length < 10) {
        const a = ALPHABET[Math.floor(seededRandom() * 26)];
        const b = ALPHABET[Math.floor(seededRandom() * 26)];
        if (a !== b && !usedLetters.has(a) && !usedLetters.has(b)) {
            plugboardPairs.push(`${a}${b}`);
            usedLetters.add(a);
            usedLetters.add(b);
        }
    }
    
    return {
        rotors,
        rings,
        positions,
        reflector: 'B',
        plugboard: plugboardPairs.join(' ')
    };
}

function applySettings(settings) {
    if (!settings) {
        showValidationMessage(['Fehler: Keine gültigen Einstellungen gefunden.']);
        return false;
    }

    try {
        // Validate rotor types
        settings.rotors.forEach(rotor => {
            if (!ROTORS[rotor]) {
                throw new Error(`Ungültiger Walzentyp: ${rotor}`);
            }
        });

        // Validate ring and position settings
        [...settings.rings, ...settings.positions].forEach(value => {
            if (!/^[A-Z]$/.test(value)) {
                throw new Error('Ungültige Ring- oder Grundstellung');
            }
        });

        // Apply rotor types
        rotorSelects.forEach((select, i) => {
            select.value = settings.rotors[i];
        });
        
        // Apply ring settings
        rotorRings.forEach((ring, i) => {
            ring.value = settings.rings[i];
        });
        
        // Apply position settings
        rotorPositions.forEach((pos, i) => {
            pos.value = settings.positions[i];
        });
        
        // Apply reflector setting
        reflectorSelect.value = settings.reflector;
        
        // Apply plugboard settings
        plugboardInput.value = settings.plugboard;
        
        // Update machine settings
        if (updateEnigmaSettings()) {
            // Clear any existing output
            outputText.value = '';
            // Re-process any existing input
            if (inputText.value) {
                processText();
            }
            return true;
        }
    } catch (error) {
        showValidationMessage([`Fehler beim Anwenden der Einstellungen: ${error.message}`]);
        return false;
    }
    return false;
}

// Initialize daily key selector
Object.entries(MASCHINENSCHLUSSEL).forEach(([period, data]) => {
    Object.entries(data.keys).forEach(([day, settings]) => {
        const option = document.createElement('option');
        option.value = `${period}-${day}`;
        option.textContent = `${data.name} - Tag ${day}`;
        dailyKeySelect.appendChild(option);
    });
});

// Event Listeners
processBtn.addEventListener('click', processText);
resetBtn.addEventListener('click', resetSettings);
copyBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(outputText.value);
        const message = document.createElement('div');
        message.className = 'success-message';
        message.textContent = 'In die Zwischenablage kopiert!';
        copyBtn.parentNode.appendChild(message);
        setTimeout(() => message.remove(), 2000);
    } catch (err) {
        console.error('Failed to copy text:', err);
    }
});

tutorialToggle.addEventListener('click', () => {
    tutorial.classList.toggle('active');
    tutorialToggle.textContent = tutorial.classList.contains('active') ? 'Anleitung ausblenden' : 'Anleitung';
});

document.getElementById('apply-daily-key').addEventListener('click', () => {
    const selectedValue = dailyKeySelect.value;
    if (!selectedValue) {
        showValidationMessage(['Bitte wählen Sie einen Tagesschlüssel aus.']);
        return;
    }

    const [period, day] = selectedValue.split('-');
    const settings = MASCHINENSCHLUSSEL[period]?.keys[day];
    
    if (settings) {
        if (applySettings(settings)) {
            // Show success message
            const message = document.createElement('div');
            message.className = 'success-message';
            message.textContent = 'Tagesschlüssel erfolgreich angewendet!';
            document.getElementById('apply-daily-key').parentNode.appendChild(message);
            setTimeout(() => message.remove(), 2000);
        }
    } else {
        showValidationMessage(['Fehler: Ungültiger Tagesschlüssel.']);
    }
});

// Real-time encryption
inputText.addEventListener('input', processText);

// Force uppercase input
[...rotorRings, ...rotorPositions, plugboardInput].forEach(input => {
    input.addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
        if (input === plugboardInput) {
            e.target.value = e.target.value.replace(/[^A-Z\s]/g, '');
        }
    });
});

// Initialize
resetSettings();