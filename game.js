console.log('Loading Yu-Gi-Oh Game Engine with Fixed Events...');

class YuGiOhGame {

    constructor() {
        console.log('Initializing Yu-Gi-Oh Game...');
        this.initializeGameState();
        this.setupEventListeners();

        const checkButton = document.querySelector('.check-section');
        if (checkButton) {
            checkButton.addEventListener('click', () => {
                this.toggleCheckButton(); // ← Call the function instead
            });
        }
        console.log('Game initialized successfully!');
        this.autoStartGame();
    }

    toggleCheckButton() {
        const checkButton = document.querySelector('.check-section');
        if (checkButton) {
            checkButton.classList.toggle('active');
            console.log('Check button toggled:', checkButton.classList.contains('active') ? 'ON' : 'OFF');
        }
    }


    initializeGameState() {
        // Value passing system
    this.activeValueCard = null; // Card that has value selected
    this.activeValue = null; // The value string (e.g., "a1000", "d-500")
       
        this.deck = [[], []];
        this.extraDeck = [[], []];
        // Store original decks for restart
        this.originalDeck = [[], []]; // Will store the initial shuffled decks 
        this.originalExtraDeck = [[], []];
        this.hand = [[], []];
        this.monsterField = [[], []];
        this.spellTrapField = [[], []];
        this.grave = [[], []];
        this.lp = [8000, 8000];
        this.lpHistory = [[8000], [8000]]; // Track LP changes for undo
        this.turn = 1; // 1 for player1, -1 for player2
        this.turnCounter = 1;
        this.blockAttack = false;
        this.mp = true;
        this.bp = false;
        this.ep = false;
        this.randomdCount = 0; 
        this.randomvalues = [5,8,4,7,9,55,1,44,65,4,7,98,14,78,65,98,14,6,8];
        this.diceValue = 0 ;

        // Battle system variables - Multiple attacks
        this.selectedAttacker = null;
        this.selectedTarget = null;
        this.attackedThisTurn = [];
        this.battling = false;
        this.positionSwitched = [];
        this.firstTurn = true;
        this.activeTransferPlayer = null; // Tracks active transfer target (1 for P1, 2 for P2, or null)
        // Stat Modifiers
        this.atkModValue = 100;
        this.atkModDir = 1; // 1 for +, -1 for -
        this.defModValue = 100;
        this.defModDir = 1;
        this.activeAtkMod = false;
        this.activeDefMod = false;
        

        console.log('Game state initialized');
    }

// Add this method to parse value strings
parseValue(valueStr) {
    if (!valueStr) return null;
    
    // Examples: "a1000", "d-500", "b200", "a*2", "d*0.5"

 // ✅ Check for luck values first (l+ or l-)
    const luckMatch = valueStr.match(/^l([+-])$/);
    if (luckMatch) {
        return {
            type: 'l', // luck type
            isLuck: true,
            isPositive: luckMatch[1] === '+',
            isMultiplier: false,
            value: 0 // Will be calculated when applied
        };
    }


    const match = valueStr.match(/^([adb])(\*?)(-?\d+\.?\d*)$/);
    if (!match) return null;
    
    return {
        type: match[1], // 'a' = attack, 'd' = defense, 'b' = both
        isMultiplier: match[2] === '*',
        value: parseFloat(match[3])
    };
}

// Calculate dice result using the same formula as rollDice()
calculateDiceResult() {
   /* const deck1Length = this.deck[0].length;
    const deck2Length = this.deck[1].length;
    const hand1Length = this.hand[0].length;
    const hand2Length = this.hand[1].length;

    const result = Math.abs((deck1Length + deck2Length - hand1Length - hand2Length) % 6) + 1;
   
    console.log(`[DICE CALC] (${deck1Length} + ${deck2Length} - ${hand1Length} - ${hand2Length}) % 6 + 1 = ${result}`);
    
    */
    return this.diceValue;
}


// Activate value selection on a card
activateValueSelection(card, playerIndex) {
    if (!card.value) {
        console.log(`${card.cn} has no value property`);
        return;
    }
    
    const parsed = this.parseValue(card.value);
    if (!parsed) {
        console.error(`Invalid value format: ${card.value}`);
        return;
    }
   
    
    console.log(`[VALUE] Activated value ${card.value} on ${card.cn}`);
    
    this.activeValueCard = {
        card: card,
        playerIndex: playerIndex,
        cardId: card.id
    };
   
    this.activeValue = parsed;
    
    // Update display to show active state
    this.displayAllCards();
}

// Deactivate value selection
deactivateValueSelection() {
    console.log('[VALUE] Deactivated value selection');
    this.activeValueCard = null;
    this.activeValue = null;
    this.displayAllCards();
}

// Pass value to target card
// ✅ UPDATED: Accept card ID instead of card object (mirrorable)
passValueToCard(targetCardId, targetPlayerIndex) {
    if (!this.activeValue) {
        console.log('[VALUE] No active value');
        return;
    }
    
    // Find the actual card in the monster field
    const cardIndex = this.monsterField[targetPlayerIndex].findIndex(c => c.id === targetCardId);
    if (cardIndex === -1) {
        console.log(`[VALUE] Card ID ${targetCardId} not found on field`);
        return;
    }
    
    const actualCard = this.monsterField[targetPlayerIndex][cardIndex];
    
    // Only monsters can receive ATK/DEF values
    if (this.getCardType(actualCard) !== 'monster') {
        console.log(`${actualCard.cn} is not a monster, cannot receive value`);
        return;
    }
    
    // Store originals if not already stored
    if (!actualCard.originalAk) actualCard.originalAk = actualCard.ak;
    if (!actualCard.originalDf) actualCard.originalDf = actualCard.df;
    
    // Apply the value
    const val = this.activeValue;
    
    if (val.type === 'a' || val.type === 'b') {
        // Attack modification
        if (val.isMultiplier) {
            actualCard.ak = Math.max(0, Math.round(actualCard.ak * val.value));
        } else {
            actualCard.ak = Math.max(0, actualCard.ak + val.value);
        }
        console.log(`${actualCard.cn} ATK modified to ${actualCard.ak}`);
    }
    
    if (val.type === 'd' || val.type === 'b') {
        // Defense modification
        if (val.isMultiplier) {
            actualCard.df = Math.max(0, Math.round(actualCard.df * val.value));
        } else {
            actualCard.df = Math.max(0, actualCard.df + val.value);
        }
        console.log(`${actualCard.cn} DEF modified to ${actualCard.df}`);
    }
    console.log(`passvalue is working`);
    
    // Play audio feedback
    this.playCardAudio(actualCard);
    
    // Deactivate value selection
    this.deactivateValueSelection();
    
    // Update display
    this.updateDisplay();
    this.displayAllCards();
}


    // Assign unique IDs to all cards in both decks
    assignCardIDs() {
        console.log('Assigning unique IDs to cards...');

        // Assign IDs to Player 1 deck
        for (let i = 0; i < this.deck[0].length; i++) {
            this.deck[0][i].id = `p0.${i + 1}`;
        }
        console.log(`Player 1: ${this.deck[0].length} cards assigned IDs (1p1 to ${this.deck[0].length}p1)`);

        // Assign IDs to Player 2 deck
        for (let i = 0; i < this.deck[1].length; i++) {
            this.deck[1][i].id = `p1.${i + 1}`;
        }
        console.log(`Player 2: ${this.deck[1].length} cards assigned IDs (1p2 to ${this.deck[1].length}p2)`);

        console.log('Card ID assignment complete!');
        console.log(this.deck[0].map(c => ({ name: c.cn, id: c.id })))

    }

    insertGamestats(pastearea) {
        const game = window.yugiohGame;

        // Create complete game state snapshot
        const gameStateSnapshot = {
            // version: '1.0',
            // timestamp: new Date().toISOString(),
            // roomName: new URLSearchParams(window.location.search).get('room'),

            // Game state
            deck: game.deck,
            extraDeck: game.extraDeck,
            hand: game.hand,
            monsterField: game.monsterField,
            spellTrapField: game.spellTrapField,
            grave: game.grave,

            // Life points and history
            lp: game.lp,

            // Turn info
            turn: game.turn,
            turnCounter: game.turnCounter,
            firstTurn: game.firstTurn,

        };
        const jsonString = JSON.stringify(gameStateSnapshot, null, 2);
        pastearea.value = jsonString;

    }

   
    applyPlayerPerspective() {
        const gamecontrolsection = document.querySelector('.game-controls-bar');
        const mainSection = document.querySelector('.main-section');
        if (!mainSection) {
            console.warn('Main section not found');
            return;
        }

        // Check if this is multiplayer and get local player index
        // Try multiple sources for the local player index
        let localIndex = this.localPlayerIndex; // Check instance property first

        if (localIndex === undefined || localIndex === null) {
            // Check if it's set in the multiplayer script
            const params = new URLSearchParams(window.location.search);
            const isMultiplayer = params.get('multiplayer');

            if (isMultiplayer) {
                // Wait for multiplayer to set it
                console.log('Multiplayer mode detected, waiting for localPlayerIndex...');
                // Try to get from session storage as fallback
                const isCreator = sessionStorage.getItem('mp_isCreator') === '1';
                localIndex = isCreator ? 0 : 1;
            }
        }

        console.log('Applying perspective for player index:', localIndex);

        // If player 2 (index 1), reverse the field view
        if (localIndex === 1) {
            // if (2 === 1) {
            gamecontrolsection.classList.add('player2-view');
            mainSection.classList.add('player2-view');
            console.log('✅ Applied Player 2 perspective - field reversed');
        } else {
            mainSection.classList.remove('player2-view');
            console.log('✅ Applied Player 1 perspective - normal field');
        }
    }


    // Wrapper functions for UI actions (these will be mirrored)
    setLPModDirection(playerIndex, direction) {
        const popup = document.querySelector('.lp-modification-popup');
        if (popup) {
            const minusBtn = popup.querySelector('#lp-minus');
            const plusBtn = popup.querySelector('#lp-plus');
            if (minusBtn && plusBtn) {
                if (direction === 'minus') {
                    minusBtn.classList.add('active');
                    plusBtn.classList.remove('active');
                } else {
                    plusBtn.classList.add('active');
                    minusBtn.classList.remove('active');
                }
            }
        }

    }

    setModDirection(stat, direction) {
        const popup = document.querySelector('.mod-value-popup');
        if (popup) {
            const minusBtn = popup.querySelector(`#${stat}-minus`);
            const plusBtn = popup.querySelector(`#${stat}-plus`);
            if (minusBtn && plusBtn) {
                if (direction === 'minus') {
                    minusBtn.classList.add('active');
                    minusBtn.style.background = '#e74c3c';
                    minusBtn.style.boxShadow = '0 0 15px rgba(231, 76, 60, 0.5)';
                    plusBtn.classList.remove('active');
                    plusBtn.style.background = '#34495e';
                    plusBtn.style.boxShadow = 'none';
                    if (stat === 'atk') this.atkModDir = -1;
                    else this.defModDir = -1;
                } else {
                    plusBtn.classList.add('active');
                    plusBtn.style.background = '#e74c3c';
                    plusBtn.style.boxShadow = '0 0 15px rgba(231, 76, 60, 0.5)';
                    minusBtn.classList.remove('active');
                    minusBtn.style.background = '#34495e';
                    minusBtn.style.boxShadow = 'none';
                    if (stat === 'atk') this.atkModDir = 1;
                    else this.defModDir = 1;
                }
            }
        }

    }

    setModValue(stat, value) {
        const popup = document.querySelector('.mod-value-popup');
        if (popup) {
            const radio = popup.querySelector(`input[name="preset"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
                if (stat === 'atk') this.atkModValue = value;
                else this.defModValue = value;
            }
        }

    }

    setCardModDirection(stat, direction) {
        const popup = document.querySelector('.card-modification-popup');
        if (popup) {
            const minusBtn = popup.querySelector(`#${stat}-minus`);
            const plusBtn = popup.querySelector(`#${stat}-plus`);
            if (minusBtn && plusBtn) {
                if (direction === 'minus') {
                    minusBtn.classList.add('active');
                    plusBtn.classList.remove('active');
                } else {
                    plusBtn.classList.add('active');
                    minusBtn.classList.remove('active');
                }
            }
        }

    }

    setCardFilter(filterType) {
        const popup = document.querySelector('.card-selection-popup');
        if (popup) {
            popup.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            const filterBtn = popup.querySelector(`.filter-btn[data-type="${filterType}"]`);
            if (filterBtn) {
                filterBtn.classList.add('active');
                const selectableCards = popup.querySelectorAll('.selectable-card');
                selectableCards.forEach(cardEl => {
                    const cardType = cardEl.dataset.type;
                    if (filterType === 'all' || filterType === cardType) {
                        cardEl.classList.remove('hidden');
                    } else {
                        cardEl.classList.add('hidden');
                    }
                });
            }
        }

    }

    sortCardsAZ() {
        const popup = document.querySelector('.card-selection-popup');
        if (popup) {
            const container = popup.querySelector('.card-selection');
            if (container) {
                const cards = Array.from(container.querySelectorAll('.selectable-card'));
                cards.sort((a, b) => {
                    const nameA = a.querySelector('label').textContent.trim().toLowerCase();
                    const nameB = b.querySelector('label').textContent.trim().toLowerCase();
                    return nameA.localeCompare(nameB);
                });
                container.innerHTML = '';
                cards.forEach(card => container.appendChild(card));
            }
        }

    }


    async autoStartGame() {
        console.log('Auto-starting game...');

        // ✅ Try to load media but DON'T block game start
        if (typeof loadFromIndexedDB === 'function') {
            loadFromIndexedDB().then(mediaLoaded => {
                console.log(`📦 Media loaded: ${mediaLoaded.imageCount} images, ${mediaLoaded.audioCount} audio files`);
                // Refresh cards if media loaded
                if (mediaLoaded.imageCount > 0 || mediaLoaded.audioCount > 0) {
                    this.displayAllCards();
                }
            }).catch(err => {
                console.log('ℹ️ No media in IndexedDB yet (this is normal on first load)');
            });
        } else {
            console.log('ℹ️ IndexedDB functions not yet loaded');
        }

        if (typeof player1Deck !== 'undefined' && Array.isArray(player1Deck)) {
            this.deck[0] = [...player1Deck];
            console.log('Player 1 deck loaded:', this.deck[0].length, 'cards');
        } else {
            console.error('Player 1 deck not found!');
        }

        if (typeof player2Deck !== 'undefined' && Array.isArray(player2Deck)) {
            this.deck[1] = [...player2Deck];
            console.log('Player 2 deck loaded:', this.deck[1].length, 'cards');
        } else {
            console.error('Player 2 deck not found!');
        }

        
        this.assignCardIDs();

        this.hand[0] = [];
        this.hand[1] = [];
        this.monsterField[0] = [];
        this.monsterField[1] = [];
        this.spellTrapField[0] = [];
        this.spellTrapField[1] = [];
        this.grave[0] = [];
        this.grave[1] = [];
        this.extraDeck[0] = [];
        this.extraDeck[1] = [];

        // Apply player perspective CSS
        this.applyPlayerPerspective();


       for (let j = 0; j < 2; j++) {
    for (let i = this.deck[j].length - 1; i >= 0; i--) {
        if (this.deck[j][i].extra) {
            const card = this.deck[j][i];
            this.extraDeck[j].push(card);
            this.deck[j].splice(i, 1);
        }
    }
}

        // ✅ ADD THIS - Save original decks BEFORE any shuffling or drawing
        this.originalDeck[0] = this.deck[0].map(card => ({ ...card })); // Deep copy
        this.originalDeck[1] = this.deck[1].map(card => ({ ...card })); // Deep copy
        console.log('✅ Original decks saved for restart:', this.originalDeck[0].length, 'vs', this.originalDeck[1].length);

        this.originalExtraDeck[0] = this.extraDeck[0].map(card => ({ ...card })); // Deep copy
        this.originalExtraDeck[1] = this.extraDeck[1].map(card => ({ ...card })); // Deep copy
        console.log('✅ Original extra decks saved for restart:', this.originalExtraDeck[0].length, 'vs', this.originalExtraDeck[1].length);


        // Give both players starting hands (6 cards for P1, 5 for P2)
        for (let i = 0; i < 6; i++) {
            if (this.deck[0].length > 0) {
                const card = this.deck[0].pop();
                this.hand[0].push(card);
            }
        }
        for (let i = 0; i < 5; i++) {
            if (this.deck[1].length > 0) {
                const card = this.deck[1].pop();
                this.hand[1].push(card);
            }
        }

        console.log('Final hand sizes - P1:', this.hand[0].length, 'P2:', this.hand[1].length);

        this.updateDisplay();
        this.displayAllCards();
        this.setMainPhase();

        // Start silent auto-save every 30 seconds


        console.log('Game auto-started with card images!');


    }

    shuffleDeck(deckIndex) {
        const deck = this.deck[deckIndex];
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    getCardType(card) {
        if (card.atr === 'spell') return 'spell';
        if (card.atr === 'trap') return 'trap';
        return 'monster';
    }


// Quick transfer from deck/graveyard to field
quickTransferToField(sourceLocation, destinationLocation, popupId = 'default') {
    console.log(`[QUICK TRANSFER] From ${sourceLocation} to ${destinationLocation}`);
    this.showCardSelectionPopup(sourceLocation, destinationLocation, popupId);

}


    playTransferSound(sourceLocation) {
        let soundFile = '';

        // Map source to sound file
        switch (sourceLocation) {
            case 'hand1':
                soundFile = 'hand1.mp3';
                break;
            case 'hand2':
                soundFile = 'hand2.mp3';
                break;
            case 'monsterfield1':
            case 'spelltrapfield1':
                soundFile = 'field1.mp3';
                break;
            case 'monsterfield2':
            case 'spelltrapfield2':
                soundFile = 'field2.mp3';
                break;
            case 'graveyard1':
                soundFile = 'graveyard1.mp3';
                break;
            case 'graveyard2':
                soundFile = 'graveyard2.mp3';
                break;
            case 'deck1':
                soundFile = 'deck1.mp3';
                break;
            case 'deck2':
                soundFile = 'deck2.mp3';
                break;


        }

        // Use the independent sound effect function
        this.playSoundEffect(soundFile);
    }

    // Add around line 295, near playCardAudio()

    playSoundEffect(filename) {
        try {
            const audio = new Audio(`sfx/${filename}`);
            audio.volume = 0.5;
            audio.play().catch(e => {
                console.log(`Could not play sound effect ${filename}:`, e.message);
            });
            console.log(`Playing sound effect: ${filename}`);
        } catch (error) {
            console.log(`Sound effect file not found: ${filename}`);
        }
    }


    playCardAudio(card) {
        // Check audio settings
        const indexedDBEnabled = localStorage.getItem('audio_indexeddb') !== 'false';
        const ttsEnabled = localStorage.getItem('audio_tts') === 'true';

        // If both disabled, play nothing
        if (!indexedDBEnabled && !ttsEnabled) {
            console.log('[AUDIO] All audio disabled');
            return;
        }

        // ✅ NEW: Try IndexedDB first (if enabled)
        if (!indexedDBEnabled) {
            // IndexedDB disabled, skip to TTS
            if (ttsEnabled) {
                this.playCardAudioTTS(card);
            }
            return;
        }

        try {
            // PRIORITY 1: Check window.CARD_AUDIO_MAP (loaded from IndexedDB)
            if (window.CARD_AUDIO_MAP && window.CARD_AUDIO_MAP[`${card.cn}.mp3`]) {
                const audio = new Audio(window.CARD_AUDIO_MAP[`${card.cn}.mp3`]);
                audio.volume = 0.5;
                audio.play().catch(e => {
                    console.log(`Could not play audio for ${card.cn}:`, e.message);
                    if (ttsEnabled) this.playCardAudioTTS(card); // Fallback to TTS if enabled
                });
                console.log(`✅ Playing audio from IndexedDB: ${card.cn}.mp3`);
                return;
            }

            // PRIORITY 2: Check sessionStorage (legacy support for lobby.html)
           /* const audioMapStr = sessionStorage.getItem('mp_audioMap');
            if (audioMapStr) {
                try {
                    const audioMap = JSON.parse(audioMapStr);
                    if (audioMap[`${card.cn}.mp3`]) {
                        const audio = new Audio(audioMap[`${card.cn}.mp3`]);
                        audio.volume = 0.5;
                        audio.play().catch(e => {
                            console.log(`Could not play audio for ${card.cn}:`, e.message);
                            if (ttsEnabled) this.playCardAudioTTS(card);
                        });
                        console.log(`✅ Playing audio from sessionStorage: ${card.cn}.mp3`);
                        return;
                    }
                } catch (e) {
                    console.log('Could not parse sessionStorage audio map');
                }
            } */

            // PRIORITY 3: Try loading from path (if CARD_AUDIO_PATH is set)
            const audioBase = (window.CARD_AUDIO_PATH && window.CARD_AUDIO_PATH.endsWith('/'))
                ? window.CARD_AUDIO_PATH
                : (window.CARD_AUDIO_PATH ? window.CARD_AUDIO_PATH + '/' : 'cards audio/');

            const audio = new Audio(`${audioBase}${card.cn}.mp3`);
            audio.volume = 0.5;
            audio.play().catch(e => {
                console.log(`Could not play audio for ${card.cn}:`, e.message);
                if (ttsEnabled) this.playCardAudioTTS(card); // Fallback to TTS if enabled
            });
            console.log(`⚠️ Playing audio from path: ${audioBase}${card.cn}.mp3`);

        } catch (error) {
            console.log(`Audio file not found for ${card.cn}`);
            if (ttsEnabled) this.playCardAudioTTS(card); // Fallback to TTS
        }
    }

    // NEW: TTS fallback method
    playCardAudioTTS(card) {
        // Check if browser supports TTS
        if (!('speechSynthesis' in window)) {
            console.log('TTS not supported in this browser');
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // Create utterance with card name
        const utterance = new SpeechSynthesisUtterance(card.cn);

        // Configure voice settings
        utterance.rate = 1.0;     // Speed (0.1 to 10)
        utterance.pitch = 1.0;    // Pitch (0 to 2)
        utterance.volume = 0.5;   // Volume (0 to 1)
        utterance.lang = navigator.language ; // Use browser/system language

        // Optional: Select a specific voice
      /*   const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            // Try to find a good English voice
            const preferredVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
            utterance.voice = preferredVoice;
        } */ 

        // Speak the card name
        window.speechSynthesis.speak(utterance);

        console.log(`TTS: ${card.cn}`);
    }

    toggleMonsterPosition(card, playerIndex) {
        // 🔍 SEARCH for the card in monster field (like sendMonsterToGraveyard does)
        const cardIndex = this.monsterField[playerIndex].findIndex(c => c.id === card.id);

        if (cardIndex === -1) {
            console.error(`${card.cn} not found in player ${playerIndex + 1}'s monster field`);
            return false;
        }

        // 🎯 Get the ACTUAL card from the array (like sendMonsterToGraveyard does)
        const actualCard = this.monsterField[playerIndex][cardIndex];

        // ✅ Modify the ACTUAL card (not the parameter)
        const newPosition = actualCard.position === 'attack' ? 'defense' : 'attack';
        actualCard.position = newPosition;
        actualCard.faceUp = true;

        console.log(`${actualCard.cn} switched to ${newPosition} position`);
        this.playCardAudio(actualCard);
        this.displayAllCards();
        return true;
    }


    // Play monster with proper face-down support
    playMonster(card, playerIndex, position = 'attack', faceUp = true) {


        const cardIndex = this.hand[playerIndex].findIndex(c => c.id === card.id);

        if (cardIndex !== -1) {
            const playedCard = this.hand[playerIndex].splice(cardIndex, 1)[0];
            playedCard.position = position;
            playedCard.faceUp = faceUp;
            playedCard.justSummoned = true;
            playedCard.summonTurn = this.turnCounter;

            // Store original values for restoration
            if (!playedCard.originalAk) playedCard.originalAk = playedCard.ak;
            if (!playedCard.originalDf) playedCard.originalDf = playedCard.df;

            this.monsterField[playerIndex].push(playedCard);

            const positionText = position === 'attack' ? 'Attack Position' : 'Defense Position';
            const faceText = faceUp ? 'face-up' : 'face-down';
            console.log(`Player ${playerIndex + 1} played ${playedCard.cn} in ${positionText} ${faceText}`);

            // Play audio when played face-up
            if (faceUp) {
                this.playCardAudio(playedCard);
            }

            this.updateDisplay();
            this.displayAllCards();
            return true;
        }
        return false;
    }

    playSpellTrapFaceUp(card, playerIndex) {
        const cardIndex = this.hand[playerIndex].findIndex(c => c.id === card.id);

        if (cardIndex !== -1) {
            const playedCard = this.hand[playerIndex].splice(cardIndex, 1)[0];
            playedCard.faceUp = true;
            this.spellTrapField[playerIndex].push(playedCard);

            console.log(`Player ${playerIndex + 1} activated ${playedCard.cn} face-up`);
            this.playCardAudio(playedCard);

            this.updateDisplay();
            this.displayAllCards();
            return true;
        }
        return false;
    }

    playSpellTrapFaceDown(card, playerIndex) {
        const cardIndex = this.hand[playerIndex].findIndex(c => c.id === card.id);

        if (cardIndex !== -1) {
            const playedCard = this.hand[playerIndex].splice(cardIndex, 1)[0];
            playedCard.faceUp = false;
            this.spellTrapField[playerIndex].push(playedCard);

            console.log(`Player ${playerIndex + 1} set ${playedCard.cn} face-down`);
            this.updateDisplay();
            this.displayAllCards();
            return true;
        }
        return false;
    }

    sendSpellTrapToGraveyard(card, playerIndex) {
        // Determine owner from card ID
        const ownerIndex = card.id && card.id.includes('p1') ? 1 : 0;

        // Find card in BOTH fields
        let cardIndex = this.spellTrapField[playerIndex].findIndex(c => c.id === card.id);
        let fieldIndex = playerIndex;

        if (cardIndex === -1) {
            const opponentIndex = playerIndex === 0 ? 1 : 0;
            cardIndex = this.spellTrapField[opponentIndex].findIndex(c => c.id === card.id);
            fieldIndex = opponentIndex;
        }

        if (cardIndex !== -1) {
            const removedCard = this.spellTrapField[fieldIndex].splice(cardIndex, 1)[0];

            // Send to owner's graveyard
            this.grave[ownerIndex].push(removedCard);

            console.log(`${removedCard.cn} sent to Player ${ownerIndex + 1}'s graveyard (owner by ID)`);
            this.playCardAudio(removedCard);

            this.updateDisplay();
            this.displayAllCards();
            return true;
        }
        return false; 
    }


    //  Send monster to graveyard with stat restoration
    sendMonsterToGraveyard(card, playerIndex) {
        // Determine owner from card ID (e.g., "5p1" = player 1, "12p2" = player 2)
        const ownerIndex = card.id && card.id.includes('p1') ? 1 : 0;

        // Find card in BOTH fields (might be in opponent's field)
        let cardIndex = this.monsterField[playerIndex].findIndex(c => c.id === card.id);
        let fieldIndex = playerIndex;

        if (cardIndex === -1) {
            // Not found in expected field, check opponent's field
            const opponentIndex = playerIndex === 0 ? 1 : 0;
            cardIndex = this.monsterField[opponentIndex].findIndex(c => c.id === card.id);
            fieldIndex = opponentIndex;
        }

        if (cardIndex !== -1) {
            const removedCard = this.monsterField[fieldIndex].splice(cardIndex, 1)[0];

            // Restore original stats when leaving field
            if (removedCard.originalAk !== undefined) {
                removedCard.ak = removedCard.originalAk;
            }
            if (removedCard.originalDf !== undefined) {
                removedCard.df = removedCard.originalDf;
            }

            // Send to OWNER's graveyard (based on ID), not current field owner
            this.grave[ownerIndex].push(removedCard);

            console.log(`${removedCard.cn} sent to Player ${ownerIndex + 1}'s graveyard (owner by ID)`);
            this.playCardAudio(removedCard);

            this.updateDisplay();
            this.displayAllCards();
            return true;
        }
        return false;
    }

    flipCardFaceUp(card, playerIndex) {
        // 🔍 SEARCH for the card (like sendMonsterToGraveyard does)
        let cardIndex = this.monsterField[playerIndex].findIndex(c => c.id === card.id && !c.faceUp);
        let foundInMonsterField = cardIndex !== -1;

        if (cardIndex === -1) {
            // Not in monster field, check spell/trap field
            cardIndex = this.spellTrapField[playerIndex].findIndex(c => c.id === card.id && !c.faceUp);
        }

        if (cardIndex === -1) {
            console.log(`${card.cn} not found or already face-up`);
            return false;
        }

        // 🎯 Get the ACTUAL card from the array (like sendMonsterToGraveyard does)
        const actualCard = foundInMonsterField
            ? this.monsterField[playerIndex][cardIndex]
            : this.spellTrapField[playerIndex][cardIndex];

        // ✅ Modify the ACTUAL card (not the parameter)
        actualCard.faceUp = true;

        if (this.getCardType(actualCard) === 'monster') {
            actualCard.position = 'attack';
            console.log(`${actualCard.cn} flipped face-up in Attack Position!`);
        } else {
            console.log(`${actualCard.cn} flipped face-up!`);
        }

        this.playCardAudio(actualCard);
        this.displayAllCards();
        return true;
    }

    flipCardFaceUpV2(card, playerIndex) {
        // 🔍 SEARCH for the card (like sendMonsterToGraveyard does)
        let cardIndex = this.monsterField[playerIndex].findIndex(c => c.id === card.id && !c.faceUp);
        let foundInMonsterField = cardIndex !== -1;

        if (cardIndex === -1) {
            // Not in monster field, check spell/trap field
            cardIndex = this.spellTrapField[playerIndex].findIndex(c => c.id === card.id && !c.faceUp);
        }

        if (cardIndex === -1) {
            console.log(`${card.cn} not found or already face-up`);
            return false;
        }

        // 🎯 Get the ACTUAL card from the array (like sendMonsterToGraveyard does)
        const actualCard = foundInMonsterField
            ? this.monsterField[playerIndex][cardIndex]
            : this.spellTrapField[playerIndex][cardIndex];

        // ✅ Modify the ACTUAL card (not the parameter)
        actualCard.faceUp = true;

        if (this.getCardType(actualCard) === 'monster') {
            actualCard.position = 'attack';
            console.log(`${actualCard.cn} flipped face-up in Attack Position!`);
        } else {
            console.log(`${actualCard.cn} flipped face-up!`);
        }

        this.playCardAudio(actualCard);
        this.displayAllCards();
        return true;
    }

    // Battle System with audio
    selectAttacker(card, playerIndex) {
        if (!this.bp) return;
        if (this.turn !== (playerIndex === 0 ? 1 : -1)) return;
        if (card.position !== 'attack') return;

        if (this.firstTurn && this.turnCounter === 1) {
            this.updateBattleStatus("Cannot attack on the first turn!");
            return;
        }

        // Check if this is confirming an attack
        if (this.selectedAttacker && this.selectedTarget &&
            this.selectedAttacker.card.cn === card.cn &&
            this.selectedAttacker.playerIndex === playerIndex) {

            this.confirmAttack();
            return;
        }

        // Clear previous selections
        this.selectedAttacker = {
            card: card,
            playerIndex: playerIndex,
            cardId: card.cn + playerIndex
        };
        this.selectedTarget = null;

        console.log('Selected attacker:', card.cn);
        // this.updateBattleStatus(`${card.cn} selected! Choose target or click opponent LP for direct attack.`);
        this.playCardAudio(card);
        this.displayAllCards();
    }

    selectTarget(targetCard, targetPlayerIndex) {
        if (!this.selectedAttacker || !this.bp) return;

        // 🛑 If clicking attacker again → confirm attack
        if (this.selectedTarget &&
            this.selectedAttacker.card.cn === targetCard.cn &&
            this.selectedAttacker.playerIndex === targetPlayerIndex) {

            this.confirmAttack();
            return;
        }

        // Normal targeting (including own monsters)
        this.selectedTarget = {
            card: targetCard,
            playerIndex: targetPlayerIndex,
            cardId: targetCard.id
        };

        console.log('Selected target:', targetCard.cn, 'ID:', targetCard.id);

        if (targetCard.faceUp) this.playCardAudio(targetCard);

        this.displayAllCards();
    }

    // Add around line 410, near other card manipulation methods
    flipCardFaceUpById(cardId, playerIndex) {
        // Search for card in monster field
        let cardIndex = this.monsterField[playerIndex].findIndex(c => c.id === cardId);
        let foundInMonsterField = cardIndex !== -1;

        if (cardIndex === -1) {
            // Not in monster field, check spell/trap field
            cardIndex = this.spellTrapField[playerIndex].findIndex(c => c.id === cardId);
        }

        if (cardIndex === -1) {
            console.log(`Card ID ${cardId} not found or already face-up`);
            return false;
        }

        // Get the ACTUAL card from the array
        const actualCard = foundInMonsterField
            ? this.monsterField[playerIndex][cardIndex]
            : this.spellTrapField[playerIndex][cardIndex];

        // Modify the ACTUAL card
        actualCard.faceUp = true;

        if (this.getCardType(actualCard) === 'monster') {
            actualCard.position = 'defense';
            console.log(`${actualCard.cn} (ID: ${cardId}) flipped face-up in Defense Position!`);
        } else {
            console.log(`${actualCard.cn} (ID: ${cardId}) flipped face-up!`);
        }

        this.playCardAudio(actualCard);
        this.displayAllCards();
        return true;
    }


    confirmAttack() {
        if (!this.selectedAttacker || !this.selectedTarget) return;

        this.battling = true;

        // Flip facedown target monster face-up USING ID (mirrorable)
        if (!this.selectedTarget.card.faceUp) {
            this.flipCardFaceUpById(this.selectedTarget.card.id, this.selectedTarget.playerIndex);
        }

        const attacker = this.selectedAttacker.card;
        const target = this.selectedTarget.card;

        console.log(`${attacker.cn} attacks ${target.cn}!`);
        this.updateBattleStatus(`${attacker.cn} attacks ${target.cn}!`);

        this.calculateBattleDamage(attacker, this.selectedAttacker.playerIndex, target, this.selectedTarget.playerIndex);
       
    }


    
    calculateBattleDamage(attacker, attackerPlayer, defender, defenderPlayer) {
        const attackerATK = attacker.ak || 0;
        let battleResult;
        let damage = 0;

        if (defender.position === 'attack') {
            const defenderATK = defender.ak || 0;
            console.log(`Battle: ${attacker.cn} (${attackerATK}) vs ${defender.cn} (${defenderATK}) in Attack Position`);

            if (attackerATK > defenderATK) {
                damage = attackerATK - defenderATK;
                this.modifyLP(defenderPlayer, -damage);
                battleResult = `${attacker.cn} wins! ${damage} damage dealt. ${defender.cn} can be sent to graveyard manually.`;
                this.addDestroyedIndicatorByCard(defender, defenderPlayer);

            } else if (attackerATK < defenderATK) {
                damage = defenderATK - attackerATK;
                this.modifyLP(attackerPlayer, -damage);
                battleResult = `${defender.cn} wins! ${damage} damage dealt. ${attacker.cn} can be sent to graveyard manually.`;
                //this.sendMonsterToGraveyard(attacker, attackerPlayer);
                this.addDestroyedIndicatorByCard(attacker, attackerPlayer);
            } else {
                battleResult = "Equal ATK! Both monsters can be sent to graveyard manually.";
                //this.sendMonsterToGraveyard(defender, defenderPlayer);
                this.addDestroyedIndicatorByCard(defender, defenderPlayer);
                // this.sendMonsterToGraveyard(attacker, attackerPlayer); 
                this.addDestroyedIndicatorByCard(attacker, attackerPlayer);
            }
        } else {
            // FIXED: Defense position battle - attacker takes damage when ATK < DEF
            const defenderDEF = defender.df || 0;
            console.log(`Battle: ${attacker.cn} (${attackerATK}) vs ${defender.cn} (${defenderDEF}) in Defense Position`);

            if (attackerATK > defenderDEF) {
                battleResult = `${attacker.cn} wins! ${defender.cn} can be sent to graveyard manually. No damage to players.`;
                //this.sendMonsterToGraveyard(defender, defenderPlayer);
                this.addDestroyedIndicatorByCard(defender, defenderPlayer);
            } else if (attackerATK < defenderDEF) {
                // FIXED: Attacker owner takes damage equal to the difference
                damage = defenderDEF - attackerATK;
                this.modifyLP(attackerPlayer, -damage);
                battleResult = `${defender.cn} defends! ${damage} damage to ${attacker.cn}'s owner. ${defender.cn} stays on field.`;
            } else {
                battleResult = "Equal values! No destruction, no damage to either player.";
            }
        }

        console.log(battleResult);
       
        // Show damage popup if damage was dealt
        if (damage > 0) {
            this.showDamagePopup(damage);
        }

        setTimeout(() => {
            this.endBattle();
            //this.checkGameOver();
        }, 2000);
    }

    addDestroyedIndicatorByCard(card, player) {
        console.log('Adding indicator for:', card.cn, 'ID:', card.id, 'player:', player);

        // Check BOTH fields
        const fieldIds = ['player1MonsterField', 'player2MonsterField'];

        fieldIds.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field) return;

            // Look for cards directly (no wrapper anymore)
            const cardElements = field.querySelectorAll('.yugioh-card');

            cardElements.forEach(cardElement => {
                const cardId = cardElement?.dataset.cardId;  // ✅ Get ID from data attribute

                if (cardId === card.id) {  // ✅ Compare by ID instead of name
                    console.log('FOUND in', fieldId, '- Adding indicator for ID:', cardId);

                    // Check if indicator already exists
                    if (cardElement.querySelector('.destroyed-indicator')) {
                        return; // Already has indicator
                    }

                    const indicator = document.createElement('div');
                    indicator.classList.add('destroyed-indicator');
                    indicator.textContent = '💀';
                    cardElement.appendChild(indicator);
                    cardElement.style.opacity = '0.6';
                    cardElement.style.filter = 'grayscale(50%)';
                }
            });
        });
    }


    directAttack(targetPlayerIndex = null) {
        if (!this.selectedAttacker) return;

        // If target index is not given, attack opponent as usual
        if (targetPlayerIndex === null) {
            targetPlayerIndex = this.selectedAttacker.playerIndex === 0 ? 1 : 0;
        }

        this.battling = true;
        const attacker = this.selectedAttacker.card;
        const damage = attacker.ak || 0;

        console.log(`${attacker.cn} attacks Player ${targetPlayerIndex + 1} directly for ${damage}!`);
        this.updateBattleStatus(`${attacker.cn} attacks Player ${targetPlayerIndex + 1} directly for ${damage} damage!`);

        this.modifyLP(targetPlayerIndex, -damage);
        this.showDamagePopup(damage);

        setTimeout(() => {
            this.endBattle();
            //this.checkGameOver();
        }, 2000);
    }

// Apply value effect to LP
applyValueToLP(targetPlayerIndex) {
    if (!this.activeValue) {
        console.log('[VALUE LP] No active value');
        return;
    }
    
    const val = this.activeValue;
    let newLP = 0;
    let lpChange = 0;
    
    // ✅ Calculate actual value if it's a luck-based value
    let actualValue = val.value;
    if (val.isLuck) {
        const diceResult = this.calculateDiceResult();
        actualValue = val.isPositive ? diceResult * 100 : diceResult * -100;
        console.log(`[VALUE LP] Luck roll: ${diceResult} → ${actualValue}`);
        
        // ✅ Show dice result to user
      //  this.showDiceResult(diceResult);
    }
    
    // Calculate LP change based on value type
    if (val.isMultiplier) {
        const currentLP = this.lp[targetPlayerIndex];
        newLP = Math.max(0, Math.round(currentLP * actualValue));
        lpChange = newLP - currentLP;
        console.log(`[VALUE LP] Multiplying LP by ${actualValue}: ${currentLP} → ${newLP}`);
    } else {
        lpChange = actualValue;
        console.log(`[VALUE LP] Applying ${lpChange > 0 ? '+' : ''}${lpChange} LP`);
    }
    
    console.log(`[VALUE LP] Applying to Player ${targetPlayerIndex + 1}`);
    
    this.modifyLP(targetPlayerIndex, lpChange);
    
    if (lpChange !== 0) {
        this.showDamagePopup(-lpChange);
    }
    
    // this.deactivateValueSelection();
    
    console.log(`[VALUE LP] Player ${targetPlayerIndex + 1} LP now: ${this.lp[targetPlayerIndex]}`);
}


    // LP modification with history tracking
    modifyLP(playerIndex, amount) {
        const oldLP = this.lp[playerIndex];
        this.lp[playerIndex] += amount;

        this.lpHistory[playerIndex].push(this.lp[playerIndex]);
        if (this.lpHistory[playerIndex].length > 10) {
            this.lpHistory[playerIndex].shift();
        }

        console.log(`Player ${playerIndex + 1} LP: ${oldLP} → ${this.lp[playerIndex]}`);
        this.updateDisplay();
    }

    // a second version for the lp mod popup 
    modifyLPV2(playerIndex, amount) {
        const oldLP = this.lp[playerIndex];
        this.lp[playerIndex] += amount;

        this.lpHistory[playerIndex].push(this.lp[playerIndex]);
        if (this.lpHistory[playerIndex].length > 10) {
            this.lpHistory[playerIndex].shift();
        }

        console.log(`Player ${playerIndex + 1} LP: ${oldLP} → ${this.lp[playerIndex]}`);
        this.updateDisplay();
    }

    undoLastLPChange(playerIndex) {
        if (this.lpHistory[playerIndex].length > 1) {
            this.lpHistory[playerIndex].pop();
            const previousLP = this.lpHistory[playerIndex][this.lpHistory[playerIndex].length - 1];
            this.lp[playerIndex] = previousLP;
            this.updateDisplay();
            console.log(`Player ${playerIndex + 1} LP restored to: ${previousLP}`);
        }
    }

    showDamagePopup(damage) {
        const popup = document.createElement('div');
        
        popup.textContent = `${-damage}`;
        popup.classList.add('damage-popup')
            
        document.body.appendChild(popup);

        setTimeout(() => {
            document.body.removeChild(popup);
        }, 1000);
    }

    endBattle() {
        this.selectedAttacker = null;
        this.selectedTarget = null;
        this.battling = false;
        this.hideBattleStatus();
        this.updateDisplay();
        this.displayAllCards();
        console.log("Battle ended");
    }

    updateBattleStatus(message) {
        const statusPanel = document.getElementById('battleStatus');
        const messageDiv = document.getElementById('battleMessage');

        if (statusPanel && messageDiv) {
            messageDiv.textContent = message;
            statusPanel.style.display = 'block';

            setTimeout(() => {
                if (statusPanel.style.display === 'block') {
                    statusPanel.style.display = 'none';
                }
            }, 3000);
        }
    }

    hideBattleStatus() {
        const statusPanel = document.getElementById('battleStatus');
        if (statusPanel) {
            statusPanel.style.display = 'none';
        }
    }

    displayAllCards() {
        console.log('Displaying all cards...');
        this.displayPlayer1Hand();
        this.displayPlayer2Hand();
        this.displayPlayer1MonsterField();
        this.displayPlayer2MonsterField();
        this.displayPlayer1SpellTrapField();
        this.displayPlayer2SpellTrapField();
        console.log('All cards displayed');
    }

    displayPlayer1Hand() {
        const container = document.getElementById('player1HandBottom');
        if (!container) {
            console.error('Player 1 hand container not found!');
            return;
        }

        container.innerHTML = '';

        // Check if this is multiplayer and if we should hide this hand
        let localIndex = this.localPlayerIndex;

        if (localIndex === undefined || localIndex === null) {
            const params = new URLSearchParams(window.location.search);
            const isMultiplayer = params.get('multiplayer');
            if (isMultiplayer) {
                const isCreator = sessionStorage.getItem('mp_isCreator') === '1';
                localIndex = isCreator ? 0 : 1;
            }
        }

        const shouldHide = (localIndex !== undefined && localIndex !== null && localIndex !== 0);

        for (let i = 0; i < this.hand[0].length; i++) {
            if (!this.hand[0][i]) continue;

            // Always create real card
            const cardElement = this.createYuGiOhCard(this.hand[0][i], i, 1, 'hand');

            if (shouldHide) {
                // Opponent's hand - add face-down class to hide content
                cardElement.classList.add('opponent-facedown');
            }

            container.appendChild(cardElement);
        }
    }

    displayPlayer2Hand() {
        const container = document.getElementById('player2HandTop');
        if (!container) {
            console.error('Player 2 hand container not found!');
            return;
        }

        container.innerHTML = '';

        // Check if this is multiplayer and if we should hide this hand
        let localIndex = this.localPlayerIndex;

        if (localIndex === undefined || localIndex === null) {
            const params = new URLSearchParams(window.location.search);
            const isMultiplayer = params.get('multiplayer');
            if (isMultiplayer) {
                const isCreator = sessionStorage.getItem('mp_isCreator') === '1';
                localIndex = isCreator ? 0 : 1;
            }
        }

        const shouldHide = (localIndex !== undefined && localIndex !== null && localIndex !== 1);

        for (let i = 0; i < this.hand[1].length; i++) {
            if (!this.hand[1][i]) continue;

            // Always create real card
            const cardElement = this.createYuGiOhCard(this.hand[1][i], i, 2, 'hand');

            if (shouldHide) {
                // Opponent's hand - add face-down class to hide content
                cardElement.classList.add('opponent-facedown');
            }

            container.appendChild(cardElement);
        }
    }


    displayPlayer1MonsterField() {
        const container = document.getElementById('player1MonsterField');
        if (!container) return;
        container.innerHTML = '';

        for (let i = 0; i < this.monsterField[0].length; i++) {
            if (this.monsterField[0][i]) {
                const fieldCardContainer = this.createFieldCardWithStats(this.monsterField[0][i], i, 1);
                container.appendChild(fieldCardContainer);
            }
        }
    }

    displayPlayer2MonsterField() {
        const container = document.getElementById('player2MonsterField');
        if (!container) return;
        container.innerHTML = '';

        for (let i = 0; i < this.monsterField[1].length; i++) {
            if (this.monsterField[1][i]) {
                const fieldCardContainer = this.createFieldCardWithStats(this.monsterField[1][i], i, 2);
                container.appendChild(fieldCardContainer);

            }
        }
    }

    displayPlayer1SpellTrapField() {
        const container = document.getElementById('player1SpellTrapField');
        if (!container) return;
        container.innerHTML = '';

        for (let i = 0; i < this.spellTrapField[0].length; i++) {
            if (this.spellTrapField[0][i]) {
                const cardElement = this.createYuGiOhCard(this.spellTrapField[0][i], i, 1, 'spelltrapfield');
                container.appendChild(cardElement);
            }
        }
    }

    displayPlayer2SpellTrapField() {
        const container = document.getElementById('player2SpellTrapField');
        if (!container) return;
        container.innerHTML = '';

        for (let i = 0; i < this.spellTrapField[1].length; i++) {
            if (this.spellTrapField[1][i]) {
                const cardElement = this.createYuGiOhCard(this.spellTrapField[1][i], i, 2, 'spelltrapfield');
                container.appendChild(cardElement);
            }
        }
    }

    createFieldCardWithStats(card, index, player) {
        // Create the card directly (no wrapper container)
        const cardElement = this.createYuGiOhCard(card, index, player, 'field');
        cardElement.style.position = 'relative'; // Make sure positioning works



        // Add defense position indicator
        if (card.position === 'defense') {
            const defenseIndicator = document.createElement('div');
            defenseIndicator.classList.add('defense-indicator')
            defenseIndicator.textContent = 'D';
            cardElement.appendChild(defenseIndicator);
        }

        

        return cardElement;
    }

    // Create card with real images
    createYuGiOhCard(card, index, player, location) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `yugioh-card ${this.getCardType(card)}`;

        // ✅ Store card ID as data attribute
        if (card.id) {
            cardDiv.dataset.cardId = card.id;
           // console.log('✅ Stored cardId on element:', card.id);
        } else {
            console.error('❌ Card has NO ID!', card.cn);
        }

        if (player === 2) {
            cardDiv.classList.add('player2');
        }


        // Brown color for face-down cards
        if ((location === 'field' || location === 'spelltrapfield') && !card.faceUp) {
            cardDiv.classList.add('face-down');

            // Add peek-active class if peek mode is on AND it's my card
            if (this.peekMode) {
                let localIndex = this.localPlayerIndex;
                if (localIndex === undefined || localIndex === null) {
                    const params = new URLSearchParams(window.location.search);
                    const isMultiplayer = params.get('multiplayer');
                    if (isMultiplayer) {
                        const isCreator = sessionStorage.getItem('mp_isCreator') === '1';
                        localIndex = isCreator ? 0 : 1;
                    }
                }
                const cardOwnerIndex = player === 1 ? 0 : 1;
                const isMyCard = (localIndex === cardOwnerIndex);

                if (isMyCard) {
                    cardDiv.classList.add('peek-active');
                }
            }
        }

        // Add highlighting - use ID instead of name
        if (this.selectedAttacker &&
            this.selectedAttacker.card.id === card.id &&
            this.selectedAttacker.playerIndex === (player === 1 ? 0 : 1)) {
            cardDiv.classList.add('selected-attacker');
        }

        if (this.selectedTarget &&
            this.selectedTarget.card.id === card.id &&
            this.selectedTarget.playerIndex === (player === 1 ? 0 : 1)) {
            cardDiv.classList.add('selected-target');
        }

        // Card sections
        const nameSection = document.createElement('div');

        if (card.clr == 1) { nameSection.className = 'fusion' }
        else if (card.clr ==2 ) {nameSection.className = 'ritual' }
        else { nameSection.className = 'card-name'; };

        const cnClass = document.createElement('span');
        cnClass.className = 'cn-class';
        cnClass.textContent = card.faceUp === false && (location === 'field' || location === 'spelltrapfield')
            ? 'FACE-DOWN' : card.cn;

        const atrClass = document.createElement('span');
        atrClass.className = 'atr-class';
        atrClass.textContent = card.faceUp === false && (location === 'field' || location === 'spelltrapfield')
            ? '' : card.atr.toUpperCase().substring(0, 4);

        nameSection.appendChild(cnClass);
        //nameSection.appendChild(atrClass);

        // ✅ ADD VALUE DIV if card has value property
if (card.value && card.faceUp !== false) {
    const valueDiv = document.createElement('div');
    valueDiv.className = 'card-value-div';
    
    // Check if this card is currently active
    const isActive = this.activeValueCard && 
                     this.activeValueCard.cardId === card.id &&
                     this.activeValueCard.playerIndex === (player === 1 ? 0 : 1);
    
    if (isActive) {
        valueDiv.classList.add('value-active');
    }
    
    // Click handler for value div
    valueDiv.addEventListener('click', (e) => {
        e.stopPropagation(); // Don't trigger card click
        
        if (this.activeValueCard && this.activeValueCard.cardId === card.id) {
            // Clicking same card - deactivate
            this.deactivateValueSelection();
        } else {
            // Activate this card's value
            this.activateValueSelection(card, player === 1 ? 0 : 1);
        }
    });
    
    nameSection.appendChild(valueDiv);
}

const trSection = document.createElement('div');
        trSection.className = 'tr-class';
        if (card.faceUp === false && (location === 'field' || location === 'spelltrapfield')) {
            trSection.textContent = '';
        } else if (this.getCardType(card) === 'monster') {
            trSection.textContent = '★'.repeat(Math.min(card.tr || 1, 12));
        } else if (this.getCardType(card) === 'spell') {
            trSection.textContent = '';
        } else {
            trSection.textContent = '';
        }

        // Image section with real card images or emojis

           const imageSection = document.createElement('div');
        imageSection.className = 'card-image';

        if (card.faceUp === false && (location === 'field' || location === 'spelltrapfield') && !this.peekMode) {
            //imageSection.textContent = 'FACE-DOWN';
            imageSection.style.backgroundColor = '#8B4513';
        } else {
            // Check if image path exists
            const hasImagePath = (window.CARD_IMAGE_PATH && window.CARD_IMAGE_PATH !== '') ||
                (window.CARD_IMAGE_MAP && Object.keys(window.CARD_IMAGE_MAP).length > 0);

            // PRIORITY 1: Check window.CARD_IMAGE_MAP (loaded from IndexedDB)
            if (window.CARD_IMAGE_MAP && window.CARD_IMAGE_MAP[`${card.cn}.jpg`]) {
                const img = document.createElement('img');
                img.src = window.CARD_IMAGE_MAP[`${card.cn}.jpg`];
                img.alt = card.cn;
                img.classList.add('card-imageStyle') ;
    

                img.onerror = function () {
                    // Image failed - fallback to emoji if available
                    if (card.emoji) {
                        imageSection.innerHTML = '';
                        imageSection.textContent = card.emoji;
                        imageSection.style.fontSize = '100px';
                       // cardDiv.classList.add('alter-emoji');
                    } else {
                        imageSection.textContent = this.getCardType(card);
                        imageSection.style.backgroundColor = '#4a4a4a';
                    }
                }.bind(this);

                imageSection.appendChild(img);
                imageSection.style.backgroundColor = 'transparent';
               // console.log(`✅ Using image from IndexedDB: ${card.cn}.jpg`);

                // PRIORITY 2: Check sessionStorage (legacy support)
            } else {
                const imageMapStr = sessionStorage.getItem('mp_imageMap');
                let imageMap = {};
                if (imageMapStr) {
                    try {
                        imageMap = JSON.parse(imageMapStr);
                    } catch (e) { }
                }

                if (imageMap[`${card.cn}.jpg`]) {
                    const img = document.createElement('img');
                    img.src = imageMap[`${card.cn}.jpg`];
                    img.alt = card.cn;
          img.classList.add('card-imageStyle') ;

                    img.onerror = function () {
                        if (card.emoji) {
                            imageSection.innerHTML = '';
                            imageSection.textContent = card.emoji;
                            imageSection.style.fontSize = '48px';
                            cardDiv.classList.add('alter-emoji');
                        } else {
                            imageSection.textContent = this.getCardType(card);
                            imageSection.style.backgroundColor = '#4a4a4a';
                        }
                    }.bind(this);

                    imageSection.appendChild(img);
                    imageSection.style.backgroundColor = 'transparent';
                    console.log(`✅ Using image from sessionStorage: ${card.cn}.jpg`);

                    // PRIORITY 3: No image path and has emoji - use emoji
                } else if (!window.CARD_IMAGE_PATH && card.emoji) {
                    imageSection.textContent = card.emoji;
                    imageSection.style.fontSize = '2vw';
                    cardDiv.classList.add('alter-emoji');
                    imageSection.style.backgroundColor = 'transparent';

                    // PRIORITY 4: Try loading from path
                } else {
                    const img = document.createElement('img');
                    const imgBase = (window.CARD_IMAGE_PATH && window.CARD_IMAGE_PATH.endsWith('/'))
                        ? window.CARD_IMAGE_PATH
                        : (window.CARD_IMAGE_PATH ? window.CARD_IMAGE_PATH + '/' : 'images/');
                    img.src = `${imgBase}${card.cn}.jpg`;
                    img.alt = card.cn;
                    img.classList.add('card-imageStyle') ;

                    img.onerror = function () {
                        if (card.emoji) {
                            imageSection.innerHTML = '';
                            imageSection.textContent = card.emoji;
                            imageSection.style.fontSize = '48px';
                            cardDiv.classList.add('alter-emoji');
                        } else {
                            imageSection.textContent = this.getCardType(card);
                            imageSection.style.backgroundColor = '#4a4a4a';
                        }
                    }.bind(this);

                    imageSection.appendChild(img);
                    imageSection.style.backgroundColor = 'transparent';
                    console.log(`⚠️ Using image from path: ${imgBase}${card.cn}.jpg`);
                }
            }
        }

        const tpSection = document.createElement('div');
        tpSection.className = 'tp-class';
        tpSection.textContent = card.faceUp === false && (location === 'field' || location === 'spelltrapfield')
            ? '' : (card.tp || 'Normal');

        const akdfSection = document.createElement('div');
        akdfSection.className = 'ak-df-class';
        if (card.faceUp === false && (location === 'field' || location === 'spelltrapfield') && !this.peekMode) {
            akdfSection.textContent = '';
        } else if (this.getCardType(card) === 'monster') {
            akdfSection.textContent = `${card.ak || 0}/${card.df || 0}`;
        } else if (this.getCardType(card) === 'trap') {
            akdfSection.textContent = 'trap';
        }
        else {akdfSection.textContent = 'spell';} 

        cardDiv.appendChild(nameSection);
        cardDiv.appendChild(trSection);
        cardDiv.appendChild(imageSection);
        //cardDiv.appendChild(tpSection);
        cardDiv.appendChild(akdfSection);

        //tooltip
        if (card.faceUp) {
            cardDiv.title = `${card.cn} - ${card.desc || 'No description'}`;
        } else {
            cardDiv.title = "";
        }


        // FIXED: Enhanced click handlers with proper double-click handling
        this.setupCardEventListeners(cardDiv, card, player, location);

        return cardDiv;

    }

    // FIXED: Event listener setup with proper double-click handling
    setupCardEventListeners(cardDiv, card, player, location) {
        const playerIndex = player === 1 ? 0 : 1;
        let clickTimeout;

        // FIXED: Single click handler with delay to allow double-clicks
        cardDiv.addEventListener('click', (e) => {
            if (clickTimeout) {
                clearTimeout(clickTimeout);
                clickTimeout = null;
                return; // Double-click will handle this
            }

            clickTimeout = setTimeout(() => {
                clickTimeout = null;
                const checkButton = document.querySelector('.check-section');
                const checkActive = checkButton && checkButton.classList.contains('active');

                if (checkActive) {
                    this.showCardModificationPopup(card, playerIndex);
                } else {
                    if (location === 'hand') {
                        this.handleHandCardClick(card, playerIndex);
                    } else if (location === 'field') {
                        this.handleFieldCardClick(card, playerIndex);
                    } else if (location === 'spelltrapfield') {
                        this.handleSpellTrapFieldClick(card, playerIndex);
                    }
                }
            }, 250); // 250ms delay to detect double-clicks
        });


        // FIXED: Double click handler - modify stats if modifier active, else graveyard
        cardDiv.addEventListener('dblclick', (e) => {
            e.preventDefault();
            if (clickTimeout) {
                clearTimeout(clickTimeout);
                clickTimeout = null;
            }

            console.log(`Double-click detected on ${card.cn} in ${location}`);

            // Check if ATK or DEF modifier is active
            if ((this.activeAtkMod || this.activeDefMod) && location === 'field' && this.getCardType(card) === 'monster') {
                // ✅ Call the mirrorable method instead
                this.modifyCardStatsByDoubleClick(card.id, playerIndex);
                return; // Don't send to graveyard
            }
            else if(this.activeValue !==null ) {return;}

            // Normal double-click behavior (send to graveyard)
            // const audio = new Audio('sfx/graveyard.mp3');

            if (location === 'hand') {
                this.handleHandCardDoubleClick(card, playerIndex);
            } else if (location === 'field') {
                if (this.getCardType(card) === 'monster') {
                    this.sendMonsterToGraveyard(card, playerIndex);
                    this.playSoundEffect('graveyard.mp3');
                }
            } else if (location === 'spelltrapfield') {
                this.sendSpellTrapToGraveyard(card, playerIndex);
                this.playSoundEffect('graveyard.mp3');
            }
        });


    }

    handleHandCardClick(card, playerIndex) {
        console.log(`Single-click on ${card.cn} in hand`);
        if (this.getCardType(card) === 'monster') {
            if (this.playMonster(card, playerIndex, 'attack', true)) {
                console.log(`${card.cn} played in Attack Position!`);
            }
        } else {
            if (this.playSpellTrapFaceUp(card, playerIndex)) {
                console.log(`${card.cn} activated face-up!`);
            }
        }
    }

    // FIXED: Double-click from hand = face-down
    handleHandCardDoubleClick(card, playerIndex) {
        console.log(`Double-click on ${card.cn} in hand`);
        if (this.getCardType(card) === 'monster') {
            // FIXED: Double-click monster = face-down defense
            if (this.playMonster(card, playerIndex, 'defense', false)) {
                console.log(`${card.cn} set face-down in Defense Position!`);
            }
        } else {
            // Double-click spell/trap = face-down
            if (this.playSpellTrapFaceDown(card, playerIndex)) {
                console.log(`${card.cn} set face-down!`);
            }
        }
    }


    // New mirrorable method for double-click stat modification
    modifyCardStatsByDoubleClick(cardId, playerIndex) {
        const cardIndex = this.monsterField[playerIndex].findIndex(c => c.id === cardId);
        if (cardIndex === -1) return;

        const targetCard = this.monsterField[playerIndex][cardIndex];

        // Store originals if first mod
        if (targetCard.originalAk === undefined) targetCard.originalAk = targetCard.ak;
        if (targetCard.originalDf === undefined) targetCard.originalDf = targetCard.df;

        // Apply 500 point modification
        if (this.activeAtkMod) {
            targetCard.ak = Math.max(0, targetCard.ak + (500 * this.atkModDir));
            console.log(`${targetCard.cn} ATK modified by ${this.atkModDir > 0 ? '+' : ''}500 to ${targetCard.ak}`);
        }

        if (this.activeDefMod) {
            targetCard.df = Math.max(0, targetCard.df + (500 * this.defModDir));
            console.log(`${targetCard.cn} DEF modified by ${this.atkModDir > 0 ? '+' : ''}500 to ${targetCard.df}`);
        }

        this.playCardAudio(targetCard);
        this.updateDisplay();
        this.displayAllCards();
    }

    handleFieldCardClick(card, playerIndex) {
         console.log(`🎯 [FIELD CLICK] Card: ${card.cn}, Player: ${playerIndex}`);
    console.log(`🎯 [FIELD CLICK] Active value exists? ${this.activeValue !== null}`);
    console.log(`🎯 [FIELD CLICK] Active value:`, this.activeValue);
    console.log(`🎯 [FIELD CLICK] Suppressed? ${this.__suppressEmit}`); // ✅ ADD THIS

        const currentPlayerIndex = this.turn === 1 ? 0 : 1;

   // In handleFieldCardClick(), in the value passing section:
if (this.activeValue && this.getCardType(card) === 'monster') {
    console.log(`💥 [VALUE PASS] Attempting to pass value to ${card.cn}`);
    
    let targetCard = null;
    let foundPlayerIndex = -1;
    
    for (let pIdx = 0; pIdx < 2; pIdx++) {
        const cardIndex = this.monsterField[pIdx].findIndex(c => c.id === card.id);
        if (cardIndex !== -1) {
            targetCard = this.monsterField[pIdx][cardIndex];
            foundPlayerIndex = pIdx;
            console.log(`💥 [VALUE PASS] Found card in player ${pIdx + 1} field at index ${cardIndex}`);
            break;
        }
    }
    
    if (targetCard) {
        console.log(`💥 [VALUE PASS] Target card before: ATK=${targetCard.ak}, DEF=${targetCard.df}`);
        
        if (!targetCard.originalAk) targetCard.originalAk = targetCard.ak;
        if (!targetCard.originalDf) targetCard.originalDf = targetCard.df;
        
        const val = this.activeValue;
        
        // ✅ Calculate actual value if it's a luck-based value
        let actualValue = val.value;
        if (val.isLuck) {
            const diceResult = this.calculateDiceResult();
            actualValue = val.isPositive ? diceResult * 100 : diceResult * -100;
            console.log(`💥 [VALUE PASS] Luck roll: ${diceResult} → ${actualValue}`);
            
            // ✅ Show dice result to user
           // this.showDiceResult(diceResult);
        }
        
        // ✅ Apply ATK modification
        if (val.type === 'a' || val.type === 'b' || val.type === 'l') {
            if (val.isMultiplier) {
                targetCard.ak = Math.max(0, Math.round(targetCard.ak * actualValue));
            } else {
                targetCard.ak = Math.max(0, targetCard.ak + actualValue);
            }
            console.log(`💥 [VALUE PASS] ATK modified to ${targetCard.ak}`);
        }
        
        // ✅ Apply DEF modification
        if (val.type === 'd' || val.type === 'b' || val.type === 'l') {
            if (val.isMultiplier) {
                targetCard.df = Math.max(0, Math.round(targetCard.df * actualValue));
            } else {
                targetCard.df = Math.max(0, targetCard.df + actualValue);
            }
            console.log(`💥 [VALUE PASS] DEF modified to ${targetCard.df}`);
        }
        
        console.log(`💥 [VALUE PASS] Target card after: ATK=${targetCard.ak}, DEF=${targetCard.df}`);
        
        this.playCardAudio(targetCard);
        this.playSoundEffect('equip.mp3');
        // this.deactivateValueSelection(); lol
        this.updateDisplay();
        this.displayAllCards();
    } else {
        console.log(`💥 [VALUE PASS] Card ${card.cn} not found in any monster field!`);
    }
    
    return;
}
    

        // Transfer to hand if direction button active
        if (this.activeTransferPlayer !== null) {
            const targetPlayerIndex = this.activeTransferPlayer - 1; // 0 for P1, 1 for P2
            const isMonsterField = this.monsterField[0].some(c => c.id === card.id) || this.monsterField[1].some(c => c.cn === card.cn);
            const isSpellTrapField = this.spellTrapField[0].some(c => c.id === card.id) || this.spellTrapField[1].some(c => c.cn === card.cn);

            if (isMonsterField || isSpellTrapField) {
                let sourceField, sourcePlayerIndex;
                // Find source field and index
                for (let pIdx = 0; pIdx < 2; pIdx++) {
                    const monsterIdx = this.monsterField[pIdx].findIndex(c => c.id === card.id);
                    if (monsterIdx !== -1) {
                        sourceField = this.monsterField[pIdx];
                        sourcePlayerIndex = pIdx;
                        break;
                    }
                    const stIdx = this.spellTrapField[pIdx].findIndex(c => c.id === card.id);
                    if (stIdx !== -1) {
                        sourceField = this.spellTrapField[pIdx];
                        sourcePlayerIndex = pIdx;
                        break;
                    }
                }

                if (sourceField) {
                    const cardIndex = sourceField.findIndex(c => c.id === card.id);
                    const transferredCard = sourceField.splice(cardIndex, 1)[0];

                    // Restore original stats for monsters
                    if (this.getCardType(transferredCard) === 'monster') {
                        if (transferredCard.originalAk !== undefined) transferredCard.ak = transferredCard.originalAk;
                        if (transferredCard.originalDf !== undefined) transferredCard.df = transferredCard.originalDf;
                    }

                    // Add to target hand (preserve face-up/position)
                    this.hand[targetPlayerIndex].push(transferredCard);

                    console.log(`${card.cn} transferred from field (P${sourcePlayerIndex + 1}) to hand of P${this.activeTransferPlayer}`);
                    this.playCardAudio(transferredCard); // Audio feedback
                    this.activeTransferPlayer = null; // Clear after transfer
                    document.querySelectorAll('.transfer-btn').forEach(btn => btn.classList.remove('active')); // Deactivate buttons

                    this.updateDisplay();
                    this.displayAllCards();
                    return; // Exit early, skip other field actions
                }
            }
            return; // Not on field, ignore
        }

        // Stat Modifiers if active
        if ((this.activeAtkMod || this.activeDefMod) && this.getCardType(card) === 'monster') {
            // Find card in either player's monster field
            let foundField = null;
            let foundPlayerIndex = null;
            let foundIndex = -1;

            for (let pIdx = 0; pIdx < 2; pIdx++) {
                const idx = this.monsterField[pIdx].findIndex(c => c.id === card.id);
                if (idx !== -1) {
                    foundField = this.monsterField[pIdx];
                    foundPlayerIndex = pIdx;
                    foundIndex = idx;
                    break;
                }
            }

            if (foundField && foundIndex !== -1) {
                const targetCard = foundField[foundIndex];

                // Store originals if first mod
                if (targetCard.originalAk === undefined) targetCard.originalAk = targetCard.ak;
                if (targetCard.originalDf === undefined) targetCard.originalDf = targetCard.df;

                // Apply mod
                if (this.activeAtkMod) {
                    targetCard.ak = Math.max(0, targetCard.ak + (this.atkModValue * this.atkModDir));
                    this.playCardAudio(targetCard);  // Add here: Audio on every ATK mod press
                    console.log(`${targetCard.cn} ATK modified by ${this.atkModDir > 0 ? '+' : ''}${this.atkModValue} to ${targetCard.ak}`);
                }

                if (this.activeDefMod) {
                    targetCard.df = Math.max(0, targetCard.df + (this.defModValue * this.defModDir));
                    this.playCardAudio(targetCard);  // Add here: Audio on every ATK mod press     
                    console.log(`${targetCard.cn} DEF modified by ${this.defModDir > 0 ? '+' : ''}${this.defModValue} to ${targetCard.df}`);
                }

                this.updateDisplay();
                this.displayAllCards(); // Refreshes stats visually
                return; // Prevent other field actions
            }
        }



        if (this.bp && this.getCardType(card) === 'monster') {
            if (playerIndex === currentPlayerIndex) {
                // Your monster
                if (this.selectedAttacker) {
                    // ✅ If you have an attacker selected, allow targeting your own monster
                    this.selectTarget(card, playerIndex);
                } else if (card.position === 'attack') {
                    // No attacker selected yet - select this as attacker
                    this.selectAttacker(card, playerIndex);
                }
            } else {
                // Opponent's monster - select as target
                if (this.selectedAttacker) {
                    this.selectTarget(card, playerIndex);
                }
            }
        }

        else if (1==1) {
            // Your card
            if (!card.faceUp) {
                // FIXED: Face-down card flipped face-up (monsters go to ATTACK position)
                this.flipCardFaceUp(card, playerIndex);
            } else if (this.getCardType(card) === 'monster') {
                // Position toggle works anytime
                this.toggleMonsterPosition(card, playerIndex);
            }
        } else {
            this.displayCardInViewer(card);
        }
    }

    handleSpellTrapFieldClick(card, playerIndex) {
        const currentPlayerIndex = this.turn === 1 ? 0 : 1;

        // Transfer to hand if direction button active (same as handleFieldCardClick)
        if (this.activeTransferPlayer !== null) {
            const targetPlayerIndex = this.activeTransferPlayer - 1; // 0 for P1, 1 for P2
            const isMonsterField = this.monsterField[0].some(c => c.cn === card.cn) || this.monsterField[1].some(c => c.cn === card.cn);
            const isSpellTrapField = this.spellTrapField[0].some(c => c.cn === card.cn) || this.spellTrapField[1].some(c => c.cn === card.cn);

            if (isMonsterField || isSpellTrapField) {
                let sourceField, sourcePlayerIndex;
                // Find source field and index
                for (let pIdx = 0; pIdx < 2; pIdx++) {
                    const monsterIdx = this.monsterField[pIdx].findIndex(c => c.id === card.id);
                    if (monsterIdx !== -1) {
                        sourceField = this.monsterField[pIdx];
                        sourcePlayerIndex = pIdx;
                        break;
                    }
                    const stIdx = this.spellTrapField[pIdx].findIndex(c => c.id === card.id);
                    if (stIdx !== -1) {
                        sourceField = this.spellTrapField[pIdx];
                        sourcePlayerIndex = pIdx;
                        break;
                    }
                }

                if (sourceField) {
                    const cardIndex = sourceField.findIndex(c => c.id === card.id);
                    const transferredCard = sourceField.splice(cardIndex, 1)[0];

                    // Restore original stats for monsters (skipped for spells/traps)
                    if (this.getCardType(transferredCard) === 'monster') {
                        if (transferredCard.originalAk !== undefined) transferredCard.ak = transferredCard.originalAk;
                        if (transferredCard.originalDf !== undefined) transferredCard.df = transferredCard.originalDf;
                    }

                    // Add to target hand (preserve face-up/position)
                    this.hand[targetPlayerIndex].push(transferredCard);

                    console.log(`${card.cn} transferred from field (P${sourcePlayerIndex + 1}) to hand of P${this.activeTransferPlayer}`);
                    this.playCardAudio(transferredCard); // Audio feedback
                    this.activeTransferPlayer = null; // Clear after transfer
                    document.querySelectorAll('.transfer-btn').forEach(btn => btn.classList.remove('active')); // Deactivate buttons

                    this.updateDisplay();
                    this.displayAllCards();
                    return; // Exit early, skip other field actions
                }
            }
            return; // Not on field, ignore
        }

        // Existing spell/trap logic (flips and viewer)
        if (1 === 1) {
            if (!card.faceUp) {
                this.flipCardFaceUpV2(card, playerIndex);
            } else {
                console.log(`${card.cn} is already face-up`);
                this.playCardAudio(card);
                this.displayCardInViewer(card);
            }
        }
    }

    // Rest of the methods remain the same...
    drawCard(playerIndex) {
        if (this.deck[playerIndex].length > 0) {
            const drawnCard = this.deck[playerIndex].pop();
            this.hand[playerIndex].push(drawnCard);
            this.displayAllCards();
            this.updateDisplay();
            console.log(`Player ${playerIndex + 1} drew: ${drawnCard.cn}`);
            return drawnCard;
        }
        return null;
    }

    togglePeekMode() {
        this.peekMode = !this.peekMode;

        const btn = document.getElementById('peek-btn');
        if (btn) {
            btn.classList.toggle('active', this.peekMode);

            // Automatically turn off after 1 second
            if (this.peekMode) {
                setTimeout(() => {
                    this.peekMode = false;
                    btn.classList.remove('active');
                    console.log('Peek mode: OFF (auto)');
                    this.displayAllCards(); // Refresh display
                }, 3000);
            }
        }

        console.log('Peek mode:', this.peekMode ? 'ON' : 'OFF');
        this.displayAllCards(); // Refresh display
    }



    setMainPhase() {
        console.log('Main Phase activated');
        this.mp = true;
        this.bp = false;
        this.ep = false;
        this.selectedAttacker = null;
        this.selectedTarget = null;
        this.hideBattleStatus();
        this.updatePhaseDisplay('MP');
        this.deactivateValueSelection();
        this.updateGameInfo();
        this.displayAllCards();

    }

    setBattlePhase() {
        console.log('Battle Phase activated');
        this.mp = false;
        this.bp = true;
        this.ep = false;
        this.selectedAttacker = null;
        this.selectedTarget = null;

        // Deactivate all modifiers and transfer buttons
        this.activeAtkMod = false;
        this.activeDefMod = false;
        this.activeTransferPlayer = null;

        // Update button visuals
        const atkBtn = document.getElementById('atk-mod-btn');
        const defBtn = document.getElementById('def-mod-btn');
        const transferP1Btn = document.getElementById('transfer-p1-btn');
        const transferP2Btn = document.getElementById('transfer-p2-btn');

        if (atkBtn) atkBtn.classList.remove('active');
        if (defBtn) defBtn.classList.remove('active');
        if (transferP1Btn) transferP1Btn.classList.remove('active');
        if (transferP2Btn) transferP2Btn.classList.remove('active');

        console.log('Deactivated all modifiers and transfer buttons for Battle Phase');


        this.updatePhaseDisplay('BP');
        this.updateGameInfo();

        const currentPlayerIndex = this.turn === 1 ? 0 : 1;
        const attackingMonsters = this.monsterField[currentPlayerIndex].filter(m => m.position === 'attack');

        if (this.firstTurn && this.turnCounter === 1) {
            this.updateBattleStatus("Cannot attack on the first turn!");
        } else if (attackingMonsters.length === 0) {
            this.updateBattleStatus("No monsters in Attack Position!");
        } else if(this.turnCounter ===2)  {
            this.updateBattleStatus("Battle Phase! Multiple attacks allowed. Select attacker, then target, then confirm.");
        }

        this.deactivateValueSelection();
        this.displayAllCards();
    }

    setEndPhase() {
        console.log('END PHASE ACTIVATED');
        this.mp = false;
        this.bp = false;
        this.ep = true;
        this.selectedAttacker = null;
        this.selectedTarget = null;
        this.hideBattleStatus();
        const epButton = document.getElementById('ep-button');
        const bpButton = document.getElementById('bp-button');
        const mpButton = document.getElementById('mp-button');

        // Toggle player2 class for pink color
        if (epButton) epButton.classList.toggle('player2');
        if (bpButton) bpButton.classList.toggle('player2');
        if (mpButton) mpButton.classList.toggle('player2');

        this.positionSwitched = [];

        // Reset justSummoned flag
        for (let playerField of this.monsterField) {
            if (Array.isArray(playerField)) {
                for (let monster of playerField) {
                    if (monster && monster.justSummoned !== undefined) {
                        monster.justSummoned = false;
                    }
                }
            }
        }

        this.turn = this.turn * (-1);
        this.turnCounter = this.turnCounter + 1;

        if (this.turnCounter > 1) {
            this.firstTurn = false;
        }

        // Draw card for new turn
        if (this.turn === 1) {
            this.drawCard(0);
        } else {
            this.drawCard(1);
        }

        this.updatePhaseDisplay('EP');
        setTimeout(() => {
            this.setMainPhase();
        }, 1000);

        this.deactivateValueSelection();

        this.updateDisplay();
        this.updateGameInfo();
        console.log('End Phase completed');

       
    }



    updatePhaseDisplay(phase) {
        document.querySelectorAll('.phase-indicator').forEach(btn => {
            btn.classList.remove('active');
        });

        const activeButton = document.getElementById(`${phase.toLowerCase()}-button`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    updateGameInfo() {
        const elements = {
            turnCounter: document.getElementById('turnCounter'),
            currentPlayer: document.getElementById('currentPlayer'),
            currentPhase: document.getElementById('currentPhase')
        };

        if (elements.turnCounter) elements.turnCounter.textContent = this.turnCounter;
        if (elements.currentPlayer) elements.currentPlayer.textContent = this.turn === 1 ? 'Player 1' : 'Player 2';
        if (elements.currentPhase) elements.currentPhase.textContent = this.mp ? 'Main' : this.bp ? 'Battle' : 'End';
    }

    updateDisplay() {
        const elements = {
            player1DeckCount: document.getElementById('player1DeckCount'),
            player2DeckCount: document.getElementById('player2DeckCount'),
            player1Graveyard: document.getElementById('player1-graveyard'),
            player2Graveyard: document.getElementById('player2-graveyard'),
            player1LP: document.getElementById('player1LP'),
            player2LP: document.getElementById('player2LP')
        };

        if (elements.player1DeckCount) elements.player1DeckCount.textContent = this.deck[0].length;
        if (elements.player2DeckCount) elements.player2DeckCount.textContent = this.deck[1].length;
        if (elements.player1Graveyard) elements.player1Graveyard.textContent = this.grave[0].length;
        if (elements.player2Graveyard) elements.player2Graveyard.textContent = this.grave[1].length;
        if (elements.player1LP) elements.player1LP.textContent = this.lp[0];
        if (elements.player2LP) elements.player2LP.textContent = this.lp[1];

        this.updateTransferButtonCounts();

        this.updateGameInfo();
    }

    updateTransferButtonCounts() {
        const p1Btn = document.getElementById('transfer-p1-btn');
        const p2Btn = document.getElementById('transfer-p2-btn');

        if (p1Btn) {
            const handCount = this.hand[0].length;
            const graveCount = this.grave[0].length;
            p1Btn.textContent = `✋${handCount}/${graveCount}`;
        }

        if (p2Btn) {
            const handCount = this.hand[1].length;
            const graveCount = this.grave[1].length;
            p2Btn.textContent = `✋${handCount}/${graveCount}`;
        }
    }


    displayCardInViewer(card) {
        const cardImg = document.getElementById('card-display');
        const placeholder = document.querySelector('.no-card-placeholder');
        const effectText = document.getElementById('cardEffect');

        if (card && cardImg && placeholder && effectText) {
            const imgBase = (window.CARD_IMAGE_PATH && window.CARD_IMAGE_PATH.endsWith('/')) ? window.CARD_IMAGE_PATH : (window.CARD_IMAGE_PATH ? window.CARD_IMAGE_PATH + '/' : 'images/');
            const imagePath = `${imgBase}${card.cn}.jpg`;
            cardImg.src = imagePath;
            cardImg.alt = card.cn;
            cardImg.classList.add('visible');
            placeholder.classList.add('hidden');

            let description = card.desc || 'No description available';
            effectText.textContent = description;

            cardImg.onerror = function () {
                cardImg.classList.remove('visible');
                placeholder.classList.remove('hidden');
                placeholder.textContent = `Image: ${card.cn}`;
            };
        }
    }

    showModValuePopup(stat) {
        console.log(`Showing value popup for ${stat.toUpperCase()}`);

        const isAtk = stat === 'atk';
        const currentValue = isAtk ? this.atkModValue : this.defModValue;
        const currentDir = (isAtk ? this.atkModDir : this.defModDir) > 0 ? '+' : '-';

        const popup = document.createElement('div');
        popup.className = 'mod-value-popup';
        // Inline for overlay structure (unbreakable)
        popup.style.position = 'fixed';
        popup.style.top = '0';
        popup.style.left = '0';
        popup.style.width = '100%';
        popup.style.height = '100%';
        popup.style.background = 'rgba(0, 0, 0, 0.8)';
        popup.style.display = 'flex';
        popup.style.justifyContent = 'center';
        popup.style.alignItems = 'center';
        popup.style.zIndex = '9998'; // Above all cards/popups
        popup.style.pointerEvents = 'auto';
        popup.style.fontFamily = 'Arial, sans-serif';
        document.body.style.overflow = 'hidden'; // No scroll

        let html = `
    <div class="popup-content" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; max-width: 400px; width: 90%; color: white; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5); text-align: center; position: relative; border: 2px solid rgba(255, 255, 255, 0.2); box-sizing: border-box; margin: 20px;">
      <div class="popup-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 2px solid rgba(255, 255, 255, 0.3); padding-bottom: 15px;">
        <h3 style="margin: 0; font-size: 24px; font-weight: bold; flex: 1; text-align: center;">Set ${stat.toUpperCase()} Modifier Value</h3>
        
      </div>
      <div class="direction-toggle" style="display: flex; gap: 10px; margin-bottom: 20px; justify-content: center;">
        <button id="${stat}-minus" class="dir-btn ${currentDir === '-' ? 'active' : ''}" style="background: #34495e; color: white; border: none; padding: 15px 25px; border-radius: 10px; font-size: 24px; font-weight: bold; cursor: pointer; transition: all 0.2s; min-width: 80px; line-height: 1; box-sizing: border-box; appearance: none; -webkit-appearance: none;">−</button>
        <button id="${stat}-plus" class="dir-btn ${currentDir === '+' ? 'active' : ''}" style="background: #34495e; color: white; border: none; padding: 15px 25px; border-radius: 10px; font-size: 24px; font-weight: bold; cursor: pointer; transition: all 0.2s; min-width: 80px; line-height: 1; box-sizing: border-box; appearance: none; -webkit-appearance: none;">+</button>
      </div>
      <div class="preset-radios" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
        <label style="display: flex; align-items: center; gap: 10px; font-size: 16px; cursor: pointer; background: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 5px; transition: background 0.2s; border: 1px solid rgba(255, 255, 255, 0.2); box-sizing: border-box; color: white;"><input type="radio" name="preset" value="100" ${currentValue === 100 ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: #27ae60; flex-shrink: 0; cursor: pointer; appearance: radio; -webkit-appearance: radio; border: none; background: none;"> 100</label>
        <label style="display: flex; align-items: center; gap: 10px; font-size: 16px; cursor: pointer; background: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 5px; transition: background 0.2s; border: 1px solid rgba(255, 255, 255, 0.2); box-sizing: border-box; color: white;"><input type="radio" name="preset" value="500" ${currentValue === 500 ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: #27ae60; flex-shrink: 0; cursor: pointer; appearance: radio; -webkit-appearance: radio; border: none; background: none;"> 500</label>
        <label style="display: flex; align-items: center; gap: 10px; font-size: 16px; cursor: pointer; background: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 5px; transition: background 0.2s; border: 1px solid rgba(255, 255, 255, 0.2); box-sizing: border-box; color: white;"><input type="radio" name="preset" value="1000" ${currentValue === 1000 ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: #27ae60; flex-shrink: 0; cursor: pointer; appearance: radio; -webkit-appearance: radio; border: none; background: none;"> 1000</label>
      </div>
      <div class="popup-buttons" style="display: flex; gap: 10px; justify-content: center;">
        <button class="cancel-btn" onclick="document.body.style.overflow = ''; this.closest('.mod-value-popup').remove();" style="padding: 15px 25px; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.2s; flex: 1; max-width: 120px; box-sizing: border-box; appearance: none; -webkit-appearance: none; background: #95a5a6; color: white;">Cancel</button>
        <button class="ok-btn2" id="confirm-mod-value-btn" style="padding: 15px 25px; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: all 0.2s; flex: 1; max-width: 120px; box-sizing: border-box; appearance: none; -webkit-appearance: none; background: #27ae60; color: white;">OK</button>
      </div>
    </div>
  `;

        popup.innerHTML = html;
        document.body.appendChild(popup);

        // ✅ OK button event listener - pass the values as arguments
        const okBtn2 = popup.querySelector('#confirm-mod-value-btn');
        okBtn2.addEventListener('click', () => {
            const selectedPreset = popup.querySelector('input[name="preset"]:checked')?.value || '100';
            const isPlus = popup.querySelector(`#${stat}-plus`).classList.contains('active');
            const value = parseInt(selectedPreset);
            const dir = isPlus ? 1 : -1;

            this.confirmModValue(stat, value, dir);
            document.body.style.overflow = '';
        });

        // Inline hover/active for direction buttons
        const minusBtn = popup.querySelector(`#${stat}-minus`);
        const plusBtn = popup.querySelector(`#${stat}-plus`);

        // Set initial active state for direction buttons
        this.setModDirection(stat, currentDir === '-' ? 'minus' : 'plus');

        minusBtn.addEventListener('click', () => {
            minusBtn.classList.add('active');
            minusBtn.style.background = '#e74c3c';
            minusBtn.style.boxShadow = '0 0 15px rgba(231, 76, 60, 0.5)';
            plusBtn.classList.remove('active');
            plusBtn.style.background = '#34495e';
            plusBtn.style.boxShadow = 'none';
            if (stat === 'atk') this.atkModDir = -1;
            else this.defModDir = -1;


        });
        plusBtn.addEventListener('click', () => {
            plusBtn.classList.add('active');
            plusBtn.style.background = '#e74c3c';
            plusBtn.style.boxShadow = '0 0 15px rgba(231, 76, 60, 0.5)';
            minusBtn.classList.remove('active');
            minusBtn.style.background = '#34495e';
            minusBtn.style.boxShadow = 'none';
            if (stat === 'atk') this.atkModDir = 1;
            else this.defModDir = 1;


        });


        // Instrument radio buttons for sync
        const radioButtons = popup.querySelectorAll('input[name="preset"]');
        radioButtons.forEach(radio => {
            radio.addEventListener('click', () => {
                const value = parseInt(radio.value);
                radio.checked = true;
                if (stat === 'atk') this.atkModValue = value;
                else this.defModValue = value;


            });
        });


        console.log(`${stat.toUpperCase()} value popup shown with inline styles`);
    }



    confirmModValue(stat, value, dir) {
        // ✅ If called without parameters, read from popup (local call)
        if (value === undefined || dir === undefined) {
            const popup = document.querySelector('.mod-value-popup');
            if (!popup) return;

            const selectedPreset = popup.querySelector('input[name="preset"]:checked')?.value || '100';
            const isPlus = popup.querySelector(`#${stat}-plus`).classList.contains('active');

            value = parseInt(selectedPreset);
            dir = isPlus ? 1 : -1;
        }

        // Apply the values
        if (stat === 'atk') {
            this.atkModValue = value;
            this.atkModDir = dir;
            const btn = document.getElementById('atk-mod-btn');
            if (btn) btn.textContent = `${dir > 0 ? '+' : ''}${value} ATK`;
        } else {
            this.defModValue = value;
            this.defModDir = dir;
            const btn = document.getElementById('def-mod-btn');
            if (btn) btn.textContent = `${dir > 0 ? '+' : ''}${value} DEF`;
        }

        // Remove popup if it exists
        const popup = document.querySelector('.mod-value-popup');
        if (popup) {
            popup.remove();
        }
        document.body.style.overflow = '';

        console.log(`${stat.toUpperCase()} mod updated to ${dir > 0 ? '+' : ''}${value}`);
    }


    // Helper method to set dropdown values (for mirroring)
    setDropdownValue(dropdownId, value) {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.value = value;
            console.log(`Dropdown ${dropdownId} set to:`, value);
        }
    }


    // LP Modification Popup
    showLPModificationPopup(playerIndex) {
        if (!this.mp) {
            console.log("Can only modify LP in Main Phase");
            return;
        }

        const popup = document.createElement('div');
        popup.className = 'lp-modification-popup';
        popup.innerHTML = `
        <div class="popup-content">
            <div class="popup-header">
                <h3>Modify Player ${playerIndex + 1} LP</h3>
                </div>
            <div class="lp-controls">
                <div class="plus-minus-buttons">
                    <button id="lp-minus" class="active">−</button>
                    <button id="lp-plus">+</button>
                </div>
                <div class="lp-buttons">
                    <button class="lp-mod-btn" data-amount="1000">1000</button>
                    <button class="lp-mod-btn" data-amount="500">500</button>
                    <button class="lp-mod-btn" data-amount="100">100</button>
                    <button class="lp-mod-btn" data-amount="50">50</button>
                    <button class="lp-mod-btn" data-amount="1">1</button>
                </div>
                <div class="lp-display">Current LP: <span id="current-lp-display">${this.lp[playerIndex]}</span></div>
                <button id="undo-lp-btn">Undo Recent LP Damage</button>
            </div>
        </div> 
    `;

      popup.classList.add('popupText')  ;

        document.body.appendChild(popup);

        // ✅ Add event listeners AFTER appending
        const minusBtn = popup.querySelector('#lp-minus');
        const plusBtn = popup.querySelector('#lp-plus');

        const undoBtn = popup.querySelector('#undo-lp-btn');
        const lpModButtons = popup.querySelectorAll('.lp-mod-btn');

        minusBtn.addEventListener('click', () => {
            minusBtn.classList.add('active');
            plusBtn.classList.remove('active');


        });

        plusBtn.addEventListener('click', () => {
            plusBtn.classList.add('active');
            minusBtn.classList.remove('active');


        });



        // ✅ LP modification buttons
        lpModButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const baseAmount = parseInt(btn.dataset.amount);
                const popup = document.querySelector('.lp-modification-popup');
                const isPlus = popup.querySelector('#lp-plus').classList.contains('active');
                const finalAmount = isPlus ? baseAmount : -baseAmount; // ← Calculate here

                this.modifyLPV2(playerIndex, finalAmount); // ← Call modifyLP directly with final amount

                const display = popup.querySelector('#current-lp-display');
                if (display) {
                    display.textContent = this.lp[playerIndex];
                }
            });
        });

        // ✅ Undo button
        undoBtn.addEventListener('click', () => {
            this.undoLastLPChange(playerIndex);
            //popup.remove();
        });
    }

    modifyLPFromPopup(playerIndex, amount) {
        const popup = document.querySelector('.lp-modification-popup');
        const isPlus = popup.querySelector('#lp-plus').classList.contains('active');
        const finalAmount = isPlus ? amount : -amount;

        this.modifyLP(playerIndex, finalAmount);

        const display = popup.querySelector('#current-lp-display');
        display.textContent = this.lp[playerIndex];
    }

    // Enhanced Bring Cards with face-up/face-down choice
    showBringCardsPopup() {
        const popup = document.createElement('div');
        popup.className = 'bring-cards-popup';
        popup.innerHTML = `
        <div class="popup-content">
            <div class="popup-header">
                <h3>Bring Cards</h3>
                
            </div>
            <div class="bring-controls">
                <div class="location-selectors">
                    <div>
                        <label>From:</label>
                        <select id="source-location">
                            <option value="hand1">✋Hand 1</option>
                            <option value="graveyard1">💀Graveyard 1</option>
                            <option value="monsterfield1">🐉Monster Field 1</option>
                            <option value="spelltrapfield1">🧙Spell/Trap Field 1</option>
                            <option value="deck1">🟫Deck 1</option>
                            <option value="extradeck1">⭐Extra Deck 1</option>
                            <option value="hand2">✋✋✋Hand 2</option>
                            <option value="graveyard2">💀💀💀Graveyard 2</option>
                            <option value="monsterfield2">🐉🐉🐉Monster Field 2</option>
                            <option value="spelltrapfield2">🧙🧙🧙Spell/Trap Field 2</option>
                            <option value="deck2">🟫🟫🟫Deck 2</option>
                            <option value="extradeck2">⭐⭐⭐Extra Deck 2</option>
                        </select>
                    </div>
                    <div>
                        <label>To:</label>
                        <select id="destination-location">
                            <option value="hand1">✋Hand 1</option>
                            <option value="graveyard1">💀Graveyard 1</option>
                            <option value="monsterfield1">🐉Monster Field 1</option>
                            <option value="spelltrapfield1">🧙Spell/Trap Field 1</option>
                            <option value="deck1">🟫Deck 1</option>
                            <option value="extradeck1">⭐Extra Deck 1</option>
                            <option value="hand2">✋✋✋Hand 2</option>
                            <option value="graveyard2">💀💀💀Graveyard 2</option>
                            <option value="monsterfield2">🐉🐉🐉Monster Field 2</option>
                            <option value="spelltrapfield2">🧙🧙🧙Spell/Trap Field 2</option>
                            <option value="deck2">🟫🟫🟫Deck 2</option>
                            <option value="extradeck2">⭐⭐⭐Extra Deck 2</option>
                        </select>
                    </div>
                </div>
                <button id="select-cards-btn">Select Cards</button>
            </div>
        </div>
    `;

        popup.classList.add('popupText')  ; 
    

        document.body.appendChild(popup);

        // ✅ Add event listeners AFTER appending to DOM

        const selectBtn = popup.querySelector('#select-cards-btn');


        selectBtn.addEventListener('click', () => {
            const sourceLocation = popup.querySelector('#source-location').value;

            // ✅ ADD THIS - Play sound based on source
            this.playTransferSound(sourceLocation);

            this.showCardSelectionPopup();
        });


    }

    showCardSelectionPopup(sourceLocation, destinationLocation, popupId = 'default') {
    console.log('showCardSelectionPopup called');

    // ✅ If called without parameters, try to get from popup
    if (!sourceLocation || !destinationLocation) {
        const bringPopup = document.querySelector('.bring-cards-popup');
        if (!bringPopup) {
            console.error('Bring cards popup not found');
            return;
        }
        sourceLocation = bringPopup.querySelector('#source-location').value;
        destinationLocation = bringPopup.querySelector('#destination-location').value;
    }

    console.log('Source:', sourceLocation, 'Destination:', destinationLocation);

    const sourceCards = this.getCardsFromLocation(sourceLocation);
    if (sourceCards.length === 0) {
      //  alert('No cards in selected source location!');
        return;
    }

    const popup = document.createElement('div');
    popup.className = 'card-selection-popup';
    popup.id = `card-selection-popup-${popupId}`; // ✅ Unique ID

    // Store these values on the popup for later use
    popup.dataset.sourceLocation = sourceLocation;
    popup.dataset.destinationLocation = destinationLocation;

    let html = `
        <div class="popup-content">
            <div class="popup-header">
                <h3>Select Cards: ${sourceLocation} → ${destinationLocation}</h3>
                <button class="close-popup" onclick="document.getElementById('card-selection-popup-${popupId}').remove()">×</button>
            </div>
            <div class="filter-buttons">
                <button class="filter-btn active" data-type="all">All</button>
                <button class="filter-btn" data-type="monster">Monster</button>
                <button class="filter-btn" data-type="spell">Spell</button>
                <button class="filter-btn" data-type="trap">Trap</button>
                
            </div>
            <div class="card-selection">`;

    sourceCards.forEach((card, index) => {
        const type = this.getCardType ? this.getCardType(card) : 'unknown';

        let labelContent = card.cn;
        if (type === 'monster') {
            labelContent += `<br><small>ATK ${card.ak || 0} / DEF ${card.df || 0}</small>`;
        } else {
            labelContent += `<br><small>${card.atr ? card.atr.toUpperCase() : 'Unknown'}</small>`;
        }

       let imageUrl;
if (window.CARD_IMAGE_MAP && window.CARD_IMAGE_MAP[`${card.cn}.jpg`]) {
    imageUrl = window.CARD_IMAGE_MAP[`${card.cn}.jpg`];
} else {
    // ✅ Use the EXACT same logic as createYuGiOhCard
    const imgBase = (window.CARD_IMAGE_PATH && window.CARD_IMAGE_PATH.endsWith('/'))
        ? window.CARD_IMAGE_PATH
        : (window.CARD_IMAGE_PATH ? window.CARD_IMAGE_PATH + '/' : 'images/');
    imageUrl = `${imgBase}${card.cn}.jpg`;
    console.log(`${imageUrl}`) ;
}
        html += `
      <div class="selectable-card" data-type="${type}" data-index="${index}">
        <input type="checkbox" id="card-${popupId}-${index}" 
               style="
                 appearance: none;
                 width: 60px;
                 height: 80px;
                 background-image: url('${imageUrl}');
                 background-size: cover;
                 background-position: center;
                 border: 2px solid #ccc;
                 border-radius: 4px;
                 cursor: pointer;
                 margin-right: 10px;
                 vertical-align: top;
               ">
        <label for="card-${popupId}-${index}" style="display: block; cursor: pointer; font-size: 14px; font-weight: bold; line-height: 1.2;">
          ${labelContent}
        </label>
      </div>
    `;
    });

    html += `
            </div>
            <div class="selection-buttons">
                 <button id="confirm-transfer-btn-${popupId}">OK</button>
                 <button id="cancel-transfer-btn-${popupId}">Cancel</button>
            </div>
        </div>
    `;
    popup.innerHTML = html;
    popup.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 2100;';
    document.body.appendChild(popup);
    console.log('Popup appended with ID:', popupId);

    // ✅ Use unique IDs for event listeners
    const confirmBtn = popup.querySelector(`#confirm-transfer-btn-${popupId}`);
    const cancelBtn = popup.querySelector(`#cancel-transfer-btn-${popupId}`);

    confirmBtn.addEventListener('click', () => {
        const src = popup.dataset.sourceLocation;
        const dest = popup.dataset.destinationLocation;

        this.confirmCardTransfer(src, dest, popupId); // ✅ Pass popupId
    });

    cancelBtn.addEventListener('click', () => {
        popup.remove();
    });

    // Attach filters after append
    const filterButtons = popup.querySelectorAll('.filter-btn');
    const selectableCards = popup.querySelectorAll('.selectable-card');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filterType = btn.dataset.type;
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            selectableCards.forEach(cardEl => {
                const cardType = cardEl.dataset.type;
                if (filterType === 'all' || filterType === cardType) {
                    cardEl.classList.remove('hidden');
                } else {
                    cardEl.classList.add('hidden');
                }
            });
         // ✅ AUTO-SORT A-Z after filtering
        const container = popup.querySelector('.card-selection');
        if (container) {
            const visibleCards = Array.from(container.querySelectorAll('.selectable-card:not(.hidden)'));
            const hiddenCards = Array.from(container.querySelectorAll('.selectable-card.hidden'));
            
            // Sort visible cards A-Z
            visibleCards.sort((a, b) => {
                const nameA = a.querySelector('label').textContent.trim().toLowerCase();
                const nameB = b.querySelector('label').textContent.trim().toLowerCase();
                return nameA.localeCompare(nameB);
            });
            
            // Clear and re-append: sorted visible cards first, then hidden cards
            container.innerHTML = '';
            visibleCards.forEach(card => container.appendChild(card));
            hiddenCards.forEach(card => container.appendChild(card));
        }


        });
    });

    
}


    getCardsFromLocation(location) {
        switch (location) {
            case 'hand1': return this.hand[0];
            case 'hand2': return this.hand[1];
            case 'graveyard1': return this.grave[0];
            case 'graveyard2': return this.grave[1];
            case 'monsterfield1': return this.monsterField[0];
            case 'monsterfield2': return this.monsterField[1];
            case 'spelltrapfield1': return this.spellTrapField[0];
            case 'spelltrapfield2': return this.spellTrapField[1];
            case 'deck1': return this.deck[0];
            case 'deck2': return this.deck[1];
            case 'extradeck1': return this.extraDeck[0];
            case 'extradeck2': return this.extraDeck[1];
            default: return [];
        }
    }

    confirmCardTransfer(sourceLocation, destinationLocation, popupId = 'default') {
    const popup = document.getElementById(`card-selection-popup-${popupId}`);
    if (!popup) {
        console.error('Popup not found:', popupId);
        return;
    }
    
    const selectedIndices = [];
    const checkboxes = popup.querySelectorAll('input[type="checkbox"]:checked');

    checkboxes.forEach(cb => {
        // ✅ Extract index from ID like "card-grave1-5"
        const parts = cb.id.split('-');
        const index = parseInt(parts[parts.length - 1]);
        selectedIndices.push(index);
    });

    if (selectedIndices.length === 0) {
        alert('Please select at least one card!');
        return;
    }

    // If destination is field, ask for face-up/face-down choice
    if (destinationLocation.includes('field')) {
        this.showFieldPlacementChoice(selectedIndices, sourceLocation, destinationLocation);
        popup.remove();
    } else {
        this.executeCardTransfer(selectedIndices, sourceLocation, destinationLocation, true, 'attack');
        popup.remove();
    }
}

    // Show face-up/face-down choice popup for field placement
    showFieldPlacementChoice(selectedIndices, sourceLocation, destinationLocation) {
        const choicePopup = document.createElement('div');
        choicePopup.className = 'field-choice-popup';
        choicePopup.innerHTML = `
        <div class="popup-content" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; max-width: 400px; color: white;">
            <div class="popup-header" style="text-align: center; margin-bottom: 25px;">
                <h3>Field Placement</h3>
            </div>
            <div class="choice-buttons" style="display: flex; flex-direction: column; gap: 15px;">
                <button id="face-up-btn" style="background: #27ae60; color: white; border: none; padding: 15px; border-radius: 8px; font-size: 16px; cursor: pointer;">
                    Face-Up (Attack Position)
                </button>
                <button id="face-down-btn" style="background: #e67e22; color: white; border: none; padding: 15px; border-radius: 8px; font-size: 16px; cursor: pointer;">
                    Face-Down (Defense Position)
                </button>
                <button id="cancel-choice-btn" style="background: #95a5a6; color: white; border: none; padding: 10px; border-radius: 8px; font-size: 14px; cursor: pointer;">
                    Cancel
                </button>
            </div>
        </div>
    `;

        choicePopup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2200;
    `;

        document.body.appendChild(choicePopup);



        // ✅ Add event listeners
        const faceUpBtn = choicePopup.querySelector('#face-up-btn');
        const faceDownBtn = choicePopup.querySelector('#face-down-btn');
        const cancelBtn = choicePopup.querySelector('#cancel-choice-btn');

        faceUpBtn.addEventListener('click', () => {
            this.executeCardTransfer(selectedIndices, sourceLocation, destinationLocation, true, 'attack');
            choicePopup.remove();
        });

        faceDownBtn.addEventListener('click', () => {
            this.executeCardTransfer(selectedIndices, sourceLocation, destinationLocation, false, 'defense');
            choicePopup.remove();
        });

        cancelBtn.addEventListener('click', () => {
            choicePopup.remove();
        });
    }

    // Execute card transfer with specified face-up/face-down state
    executeCardTransfer(selectedIndices, sourceLocation, destinationLocation, faceUp, position) {
               // Close all popups
               this.deactivateValueSelection();
        document.querySelectorAll('.card-selection-popup, .bring-cards-popup, .field-choice-popup').forEach(popup => popup.remove());

        const sourceCards = this.getCardsFromLocation(sourceLocation);
        const destinationCards = this.getCardsFromLocation(destinationLocation);

        // Sort indices in descending order
        selectedIndices.sort((a, b) => b - a);

        selectedIndices.forEach(index => {
            const card = sourceCards.splice(index, 1)[0];

            // Restore original stats when leaving field
            if ((sourceLocation.includes('monsterfield') || sourceLocation.includes('spelltrapfield')) &&
                this.getCardType(card) === 'monster') {
                if (card.originalAk !== undefined) {
                    card.ak = card.originalAk;
                }
                if (card.originalDf !== undefined) {
                    card.df = card.originalDf;
                }
                console.log(`${card.cn} stats restored when leaving field`);
            }

            // Set up card for new location
            if (destinationLocation.includes('field')) {
                card.position = position;
                card.faceUp = faceUp;

                // Store original values if not already stored
                if (this.getCardType(card) === 'monster') {
                    if (!card.originalAk) card.originalAk = card.ak;
                    if (!card.originalDf) card.originalDf = card.df;
                }

                // Play audio when brought to field face-up
                if (faceUp) {
                    this.playCardAudio(card);
                }
            }

            destinationCards.push(card);
        });

        // If destination is deck, reshuffle
       /* if (destinationLocation === 'deck1') {
            this.deterministicShuffleDeck(0);
            console.log('did the shuffling for deck 1');
        } else if (destinationLocation === 'deck2') {
            this.deterministicShuffleDeck(1);
            console.log('did the shuffling for deck 2');
        }

        // If source is deck, reshuffle
        if (sourceLocation === 'deck1') {
            this.deterministicShuffleDeck(0);
            console.log('did the shuffling for deck 1');
        } else if (sourceLocation === 'deck2') {
            this.deterministicShuffleDeck(1);
            console.log('did the shuffling for deck 2');
        } */

        this.updateDisplay();
        this.displayAllCards();

        console.log(`Transferred ${selectedIndices.length} cards from ${sourceLocation} to ${destinationLocation}`);
    }

    // Add these methods to YuGiOhGame class

    // Draw card for specific player
    drawCardForPlayer(playerIndex) {
        if (this.deck[playerIndex].length > 0) {
            const drawnCard = this.deck[playerIndex].pop();
            this.hand[playerIndex].push(drawnCard);
            this.displayAllCards();
            this.updateDisplay();
            console.log(`Player ${playerIndex + 1} drew: ${drawnCard.cn}`);
            this.playSoundEffect('drawcard.mp3');
            return drawnCard;

        } 
    }

    // Return latest graveyard card to hand
    returnLatestGraveyardCardToHand(playerIndex) {
        if (this.grave[playerIndex].length > 0) {
            // Get the last card (latest card sent to graveyard)
            const card = this.grave[playerIndex].pop();
            this.hand[playerIndex].push(card);

            console.log(`Player ${playerIndex + 1} returned ${card.cn} from graveyard to hand`);
            this.playCardAudio(card);

            this.displayAllCards();
            this.updateDisplay();
            return card;
        } 
    }

    closeModificationPopup() {
        const popup = document.querySelector('.card-modification-popup');
        if (popup) popup.remove();
    }

    // Card Modification Popup (unchanged)
    showCardModificationPopup(card, playerIndex) {
        console.log('Showing card description for:', card.cn);

        // ✅ Determine header color based on card.id
        const headerColor = card.id && card.id.includes('p2') ? '#8B0000' : '#00008B'; // Dark red for p2, Dark blue for p1

        // ✅ Build stats display - only show if defined
        let statsDisplay = '';
        if (card.ak !== undefined && card.df !== undefined) {
            statsDisplay = `<h4 style="margin: 10px 0 0 0; color: #fff; font-size: 16px;">${card.ak} | ${card.df}</h4>`;
        }

        const popup = document.createElement('div');
        popup.className = 'card-modification-popup';
        popup.innerHTML = `
        <div class="popup-content">
          
       
        <div class="popup-header" style="background: ${headerColor}; 
        padding: 15px;
         border-radius: 8px 8px 0 0; 
         margin: -20px -20px 15px -20px;">
             
        <h3 style="margin: 0; color: #fff; font-size: 20px;">${card.cn}</h3>
                <h4 style="margin: 5px 0 0 0; color: #ddd; font-size: 14px;"></h4>
                ${statsDisplay}
                <div id="close-modification-popup" class="close-popup">✖</div>
            </div>
            
            <div class="card-description">
    <textarea readonly style="width: 100%; 
    min-height: 150px; 
    background: #2a2a2a; 
    color: white; 
    border: 1px solid #555;
    border-radius: 5px; 
    padding: 10px;
    font-size: 14px; 
    resize: vertical;">
    ${card.originalAk || ''} / ${card.originalDf || ''}
    ${card.tp || '--'}, ${card.atr || '--'}
    ${card.desc || 'No description available.'}
    </textarea>
</div>
        </div>
    `;

        popup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    `;

        document.body.appendChild(popup);
        document.getElementById("close-modification-popup").onclick = () => {
            this.closeModificationPopup();
            // this.toggleCheckButton();
        };
    }


    //close all popups funtion
    closeAllPopups() {
        console.log('Closing all popups...');

        const checkButton = document.querySelector('.check-section');
        checkButton.classList.remove('active');

        this.deactivateValueSelection();

        // List of all popup classes to remove
        const popupSelectors = [
            '.lp-modification-popup',
            '.bring-cards-popup',
            '.card-selection-popup',
            '.field-choice-popup',
            '.card-modification-popup',
            '.mod-value-popup',

        ];

        // Remove all popups
        popupSelectors.forEach(selector => {
            const popups = document.querySelectorAll(selector);
            popups.forEach(popup => {
                popup.remove();
                console.log(`Removed: ${selector}`);
            });
        });

        // Remove dice result display (by ID, not class)
        const diceDisplay = document.getElementById('dice-result-display');
        if (diceDisplay) {
            diceDisplay.remove();
            console.log('Removed dice display');
        }

        // Reset body overflow (in case popup locked scrolling)
        document.body.style.overflow = '';



        console.log('All popups closed');
    }

    // Transfer button functions
    setTransferDirection(player) {
        // player: 1, 2, or null
        this.activeTransferPlayer = player;

        const p1Btn = document.getElementById('transfer-p1-btn');
        const p2Btn = document.getElementById('transfer-p2-btn');

        if (p1Btn) p1Btn.classList.toggle('active', player === 1);
        if (p2Btn) p2Btn.classList.toggle('active', player === 2);

        console.log('Transfer direction set to:', player || 'none');
    }

    // ATK modifier function
    toggleAtkModifier() {
        this.activeAtkMod = !this.activeAtkMod;

        const btn = document.getElementById('atk-mod-btn');
        if (btn) btn.classList.toggle('active', this.activeAtkMod);

        console.log('ATK modifier:', this.activeAtkMod ? 'ON' : 'OFF');
    }

    // Simple Dice Roll - Deterministic calculation
    rollDice() {
        console.log('Rolling dice...');

        // Calculate: (deck1 + deck2 - hand1 - hand2) mod 6 + 1
        const deck1Length = this.deck[0].length;
        const deck2Length = this.deck[1].length;
        const hand1Length = this.hand[0].length;
        const hand2Length = this.hand[1].length;
        const mover = this.randomdCount % this.randomvalues.length;
        const arrayValue = this.randomvalues[mover]

        const result = Math.abs((arrayValue+deck1Length + deck2Length - hand1Length - hand2Length) % 6) + 1;
        this.randomdCount++;
        this.diceValue = result;
        
        console.log(`[DICE] Calculation: (${deck1Length} + ${deck2Length} - ${hand1Length} - ${hand2Length}) % 6 + 1 = ${result}`);

        // Show result in simple overlay
        this.showDiceResult(result);
    }

    showDiceResult(result) {
        // Remove existing dice display if any
        const existing = document.getElementById('dice-result-display');
        if (existing) {
            existing.remove();
        }

        // Create simple display
        const display = document.createElement('div');
        display.id = 'dice-result-display';
        display.textContent = result;
        display.classList.add('diceResult');

        document.body.appendChild(display);
        console.log('[DICE] Result displayed:', result);
    }

    // DEF modifier function
    toggleDefModifier() {
        this.activeDefMod = !this.activeDefMod;

        const btn = document.getElementById('def-mod-btn');
        if (btn) btn.classList.toggle('active', this.activeDefMod);

        console.log('DEF modifier:', this.activeDefMod ? 'ON' : 'OFF');
    }


    restartGame() {
        console.log('[RESTART] Opening restart popup...');

        const indexedDBEnabled = localStorage.getItem('audio_indexeddb') === null
            ? true  // Default to ON if never set
            : localStorage.getItem('audio_indexeddb') === 'true';

        const ttsEnabled = localStorage.getItem('audio_tts') === 'true'; // Defaults to OFF 

        // Create popup
        const popup = document.createElement('div');
        popup.className = 'restart-popup';
        popup.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 99999;
    `;

        popup.innerHTML = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; max-width: 500px; width: 90%; color: white; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
            <h2 style="margin: 0 0 20px 0; text-align: center;">Restart Game</h2>
            
            <!-- Audio Settings -->
            <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; font-size: 16px; text-align: center;">Audio Settings</h3>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="toggle-indexeddb-btn" class="audio-toggle-btn" style="
                        flex: 1;
                        padding: 12px;
                        background: ${indexedDBEnabled ? '#27ae60' : '#95a5a6'};
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.2s;
                    ">
                        ${indexedDBEnabled ? '🔊' : '🔇'} IndexedDB<br>
                        <span style="font-size: 12px;">${indexedDBEnabled ? 'ON' : 'OFF'}</span>
                    </button>
                    
                    <button id="toggle-tts-btn" class="audio-toggle-btn" style="
                        flex: 1;
                        padding: 12px;
                        background: ${ttsEnabled ? '#27ae60' : '#95a5a6'};
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.2s;
                    ">
                        ${ttsEnabled ? '🔊' : '🔇'} TTS<br>
                        <span style="font-size: 12px;">${ttsEnabled ? 'ON' : 'OFF'}</span>
                    </button>

                    <button id="get-gameStats" class="audio-toggle-btn" style="
                        flex: 1;
                        padding: 12px;
                        background: ${ttsEnabled ? '#27ae60' : '#95a5a6'};
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.2s;
                    ">
                        Stats<br>
                        <span style="font-size: 12px;">Get games stats</span>
                    </button>
                </div>
            </div>
            
            <p style="margin-bottom: 15px; font-size: 14px; text-align: center;">Paste saved game state (or leave empty for normal restart)</p>
            
            <textarea id="paste-area" placeholder="Paste game state JSON here..." style="
                width: 100%;
                height: 150px;
                background: #2a2a2a;
                color: white;
                border: 1px solid #555;
                border-radius: 5px;
                padding: 10px;
                font-size: 12px;
                font-family: monospace;
                resize: vertical;
                box-sizing: border-box;
                margin-bottom: 15px;
            "></textarea>
            
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="paste-btn" class="restartBtn"
                   
                ">Paste</button>
                
                <button id="ok-restart-btn" class="restartBtn"
                    
                ">OK</button>
                
                <button id="cancel-restart-btn" class="restartBtn"
                    
                ">Cancel</button>
            </div>
        </div>
    `;

        document.body.appendChild(popup);

        const pasteArea = popup.querySelector('#paste-area');
        const pasteBtn = popup.querySelector('#paste-btn');
        const okBtn = popup.querySelector('#ok-restart-btn');
        const cancelBtn = popup.querySelector('#cancel-restart-btn');
        const indexedDBBtn = popup.querySelector('#toggle-indexeddb-btn');
        const ttsBtn = popup.querySelector('#toggle-tts-btn');
        const getStats = popup.querySelector('#get-gameStats');



        // Toggle IndexedDB Audio
        indexedDBBtn.addEventListener('click', () => {
            const currentState = localStorage.getItem('audio_indexeddb') !== 'false';
            const newState = !currentState;
            localStorage.setItem('audio_indexeddb', newState.toString());

            // Update button appearance
            indexedDBBtn.style.background = newState ? '#27ae60' : '#95a5a6';
            indexedDBBtn.innerHTML = `
            ${newState ? '🔊' : '🔇'} IndexedDB<br>
            <span style="font-size: 12px;">${newState ? 'ON' : 'OFF'}</span>
        `;

            console.log('[AUDIO] IndexedDB audio:', newState ? 'ENABLED' : 'DISABLED');
            setTimeout(() => { popup.remove(); }, 500);
        });

        // Toggle TTS
        ttsBtn.addEventListener('click', () => {
            const currentState = localStorage.getItem('audio_tts') === 'true';
            const newState = !currentState;
            localStorage.setItem('audio_tts', newState.toString());

            // Update button appearance
            ttsBtn.style.background = newState ? '#27ae60' : '#95a5a6';
            ttsBtn.innerHTML = `
            ${newState ? '🔊' : '🔇'} TTS<br>
            <span style="font-size: 12px;">${newState ? 'ON' : 'OFF'}</span>
        `;

            console.log('[AUDIO] TTS:', newState ? 'ENABLED' : 'DISABLED');
            setTimeout(() => { popup.remove(); }, 500);
        });

        getStats.addEventListener('click', () => {
            this.insertGamestats(pasteArea);

        });

        // Paste button - reads from clipboard
        pasteBtn.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                pasteArea.value = text;
                console.log('[RESTART] Pasted from clipboard');
            } catch (err) {
                alert('Failed to paste from clipboard. Please paste manually (Ctrl+V).');
                console.error('[RESTART] Paste failed:', err);
            }
        });

        // OK button - restart or restore
        okBtn.addEventListener('click', () => {
            const pastedText = pasteArea.value.trim();

            if (pastedText === '') {
                // Empty - normal restart
                console.log('[RESTART] Normal restart (no saved state)');
                popup.remove();
                this.executeNormalRestart();
            } else {
                // Has JSON - try to restore
                console.log('[RESTART] Attempting to restore from pasted state');
                try {
                    const savedState = JSON.parse(pastedText);
                    popup.remove();
                    this.executeRestoreRestart(savedState);
                } catch (err) {
                    alert('Invalid JSON! Please check the pasted data.');
                    console.error('[RESTART] JSON parse error:', err);
                }
            }
        });

        // Cancel button
        cancelBtn.addEventListener('click', () => {
            popup.remove();
            console.log('[RESTART] Cancelled');
        });
    }

    // Normal restart (original behavior)
    executeNormalRestart() {
        console.log('[RESTART] Executing normal restart...');

        // 1. Reset Life Points
        this.lp = [8000, 8000];
        this.lpHistory = [[8000], [8000]];

        // 2. Restore original decks
        this.deck[0] = this.originalDeck[0].map(card => ({
            ...card,
            ak: card.originalAk || card.ak,
            df: card.originalDf || card.df,
            position: undefined,
            faceUp: undefined,
            justSummoned: undefined,
            destroyed: undefined
        }));

        this.extraDeck[0] = this.originalExtraDeck[0].map(card => ({ ...card }));
        this.extraDeck[1] = this.originalExtraDeck[1].map(card => ({ ...card }));
        console.log('[RESTART] Extra decks restored:', this.extraDeck[0].length, 'vs', this.extraDeck[1].length);

        this.deck[1] = this.originalDeck[1].map(card => ({
            ...card,
            ak: card.originalAk || card.ak,
            df: card.originalDf || card.df,
            position: undefined,
            faceUp: undefined,
            justSummoned: undefined,
            destroyed: undefined
        }));

        // 3. Clear all zones
        this.hand = [[], []];
        this.monsterField = [[], []];
        this.spellTrapField = [[], []];
        this.grave = [[], []];

        // 4. Reset turn state
        this.turn = 1;
        this.turnCounter = 1;
        this.firstTurn = true;

        // 5. Shuffle decks
        this.deterministicShuffleDeck(0);
        this.deterministicShuffleDeck(1);

        // 6. Draw starting hands - 6 for P1, 5 for P2
        for (let i = 0; i < 6; i++) {
            if (this.deck[0].length > 0) {
                this.hand[0].push(this.deck[0].pop());
            }
        }

        for (let i = 0; i < 5; i++) {
            if (this.deck[1].length > 0) {
                this.hand[1].push(this.deck[1].pop());
            }
        }

        // 7. Set to Main Phase (Player 1)
        this.setMainPhase();

        // 8. Remove player2 class from phase buttons (reset to Player 1)
        const epButton = document.getElementById('ep-button');
        const bpButton = document.getElementById('bp-button');
        const mpButton = document.getElementById('mp-button');

        if (epButton) epButton.classList.remove('player2');
        if (bpButton) bpButton.classList.remove('player2');
        if (mpButton) mpButton.classList.remove('player2');

        // 9. Update display
        this.updateDisplay();
        this.displayAllCards();

        console.log('[RESTART] ✅ Normal restart complete!');
    }

    // Restore restart (from saved state)
    executeRestoreRestart(savedState) {
        console.log('[RESTART] Executing restore from saved state...');

        try {
            // Restore saved fields
            this.deck = savedState.deck || [[], []];
            this.extraDeck = savedState.extraDeck || [[], []];
            this.hand = savedState.hand || [[], []];
            this.monsterField = savedState.monsterField || [[], []];
            this.spellTrapField = savedState.spellTrapField || [[], []];
            this.grave = savedState.grave || [[], []];
            this.lp = savedState.lp || [8000, 8000];
            this.turn = savedState.turn || 1;
            this.turnCounter = savedState.turnCounter || 1;
            this.firstTurn = savedState.firstTurn !== undefined ? savedState.firstTurn : true;

            // Rebuild LP history from current LP
            this.lpHistory = [[this.lp[0]], [this.lp[1]]];

            // Set phase button colors based on whose turn it is
            const epButton = document.getElementById('ep-button');
            const bpButton = document.getElementById('bp-button');
            const mpButton = document.getElementById('mp-button');

            const isPlayer2Turn = this.turn === -1;

            if (epButton) {
                if (isPlayer2Turn) {
                    epButton.classList.add('player2');
                } else {
                    epButton.classList.remove('player2');
                }
            }

            if (bpButton) {
                if (isPlayer2Turn) {
                    bpButton.classList.add('player2');
                } else {
                    bpButton.classList.remove('player2');
                }
            }

            if (mpButton) {
                if (isPlayer2Turn) {
                    mpButton.classList.add('player2');
                } else {
                    mpButton.classList.remove('player2');
                }
            }

            // Set to Main Phase
            this.setMainPhase();

            // Update display
            this.updateDisplay();
            this.displayAllCards();

            console.log('[RESTART] ✅ Restored successfully!');
            console.log('[RESTART] Turn:', this.turnCounter, '| Player:', isPlayer2Turn ? '2' : '1');
            alert('Game restored successfully!');

        } catch (error) {
            console.error('[RESTART] ❌ Restore failed:', error);
            alert('Failed to restore game state. Starting normal restart instead.');
            this.executeNormalRestart();
        }
    }

    // Deterministic shuffle using YOUR formula
    deterministicShuffleDeck(deckIndex) {
        const deck = this.deck[deckIndex];

        // YOUR FORMULA: deck1 - deck2 length + hand1 - hand2 length + grave1 - grave2 length
        const seed = Math.abs(
            this.deck[0].length - this.deck[1].length +
            this.hand[0].length - this.hand[1].length +
            this.grave[0].length - this.grave[1].length
        );

        console.log(`[SHUFFLE] Deck ${deckIndex + 1} using seed: ${seed}`);

        // Seeded Fisher-Yates shuffle
        let currentSeed = seed;

        for (let i = deck.length - 1; i > 0; i--) {
            currentSeed = (currentSeed * 9301 + 49297) % 233280;
            const j = Math.floor((currentSeed / 233280) * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        console.log(`[SHUFFLE] Deck ${deckIndex + 1} shuffled: ${deck.length} cards`);
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');


        const peekBtn = document.getElementById('peek-btn');
        if (peekBtn) {
            peekBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.togglePeekMode();
            });
        }


// ✅ Player 1 Deck Section - Single click for deck→field, Triple click for grave→field
const player1DeckSection = document.getElementById('player1DeckCount');
if (player1DeckSection) {
    let clickCount = 0;
    let clickTimer = null;

    player1DeckSection.addEventListener('click', (e) => {
        
        e.preventDefault();
        clickCount++;
        console.log(`[DECK CLICK] Player 1 deck click count: ${clickCount}`);

        // Clear existing timer
        if (clickTimer) {
            clearTimeout(clickTimer);
        }

        // Set timer to detect triple click
        clickTimer = setTimeout(() => {
        if (clickCount === 1) {
            this.playSoundEffect('deck1.mp3');
    console.log('[DECK CLICK] Opening 3 popups');
    this.quickTransferToField('graveyard1', 'monsterfield1', 'grave1');
    this.quickTransferToField('deck1', 'monsterfield1', 'deck1');
    this.quickTransferToField('extradeck1', 'monsterfield1', 'extra1');



} else if (clickCount === 3) {
                // Double click - still draw card (existing behavior)
             //  console.log('[DECK CLICK] Player 2 graveyard → monster field');
              //  this.quickTransferToField('graveyard2', 'monsterfield2');
            } else if (clickCount >= 3) {
                // Triple click - graveyard to field
                
            }

            clickCount = 0; // Reset
        }, 800); // 400ms window for triple click
    });
}

// ✅ Player 2 Deck Section - Single click for deck→field, Triple click for grave→field
const player2DeckSection = document.getElementById('player2DeckCount');
if (player2DeckSection) {
    let clickCount = 0;
    let clickTimer = null;
    

    player2DeckSection.addEventListener('click', (e) => {
      
        e.preventDefault();
        clickCount++;
        console.log(`[DECK CLICK] Player 2 deck click count: ${clickCount}`);

        // Clear existing timer
        if (clickTimer) {
            clearTimeout(clickTimer);
        }

        // Set timer to detect triple click
        clickTimer = setTimeout(() => {
            if (clickCount === 1) {
                 this.playSoundEffect('deck2.mp3');
             console.log('[DECK CLICK] Opening 3 popups');
    this.quickTransferToField('graveyard2', 'monsterfield2', 'grave2');
    this.quickTransferToField('deck2', 'monsterfield2', 'deck2');
    this.quickTransferToField('extradeck2', 'monsterfield2', 'extra2');
            } else if (clickCount === 3) {
                // Double click - still draw card (existing behavior)
             //  console.log('[DECK CLICK] Player 2 graveyard → monster field');
              //  this.quickTransferToField('graveyard2', 'monsterfield2');
            } else if (clickCount >= 3) {
                // Triple click - graveyard to field
                
            }

            clickCount = 0; // Reset
        }, 800); // 400ms window for triple click
    });
}



        const player1LP = document.getElementById('player1LP');
        const player2LP = document.getElementById('player2LP');

        if (player1LP) {
            player1LP.addEventListener('click', () => {
             if (this.activeValue) {
                this.applyValueToLP(0); // Player 1 = index 0
                return; // Exit early, don't do battle phase stuff
            }

                if (this.bp && this.selectedAttacker) {
                    this.directAttack(0); // attack Player 1 LP
                } else if (this.mp) {
                    this.showLPModificationPopup(0);
                }
            });
        }

        if (player2LP) {
            player2LP.addEventListener('click', () => {
               if (this.activeValue) {
                this.applyValueToLP(1); // Player 2 = index 1
                return; // Exit early 
               }

                if (this.bp && this.selectedAttacker) {
                    this.directAttack(1); // attack Player 2 LP
                } else if (this.mp) {
                    this.showLPModificationPopup(1);
                }
            });
        }

      

        // ✅ Player 2 Deck Section - Double-click to draw
        const player2DeckSectionv2 = document.getElementById('player2DeckCount');
        if (player2DeckSectionv2) {
            player2DeckSectionv2.addEventListener('dblclick', (e) => {
                e.preventDefault();
                console.log('[DRAW] Player 2 deck double-clicked');
                this.drawCardForPlayer(1); // Player 2 = index 1
            });

        }

        // ✅ Player 1 Deck Section - Double-click to draw
        const player1DeckSectionv2 = document.getElementById('player1DeckCount');
        if (player1DeckSectionv2) {
            player1DeckSectionv2.addEventListener('dblclick', (e) => {
                e.preventDefault();
                console.log('[DRAW] Player 1 deck double-clicked');
                this.drawCardForPlayer(0); // Player 1 = index 0
            });


        } 


        const bringCardsButton = document.getElementById('bringcardsbutton');
        if (bringCardsButton) {
            bringCardsButton.addEventListener('click', () => {
                if (window.yugiohGame) {
                    window.yugiohGame.showBringCardsPopup();
                } else {
                    console.error('Game not ready yet!');
                    alert('Game is still loading, please wait...');
                }
            });
        }

        const mpButton = document.getElementById('mp-button');
        const bpButton = document.getElementById('bp-button');
        const epButton = document.getElementById('ep-button');


        if (mpButton) {
            mpButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.setMainPhase();
               

            });
        }

        if (bpButton) {
            bpButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.setBattlePhase();
            });
        }

        if (epButton) {
            epButton.addEventListener('click', (e) => {
                e.preventDefault();

                this.setEndPhase();
            });

        }

        // ✅ Universal close popups button - with TRIPLE-click for restart
        const closePopupsBtn = document.getElementById('close-popups-btn');
        if (closePopupsBtn) {
            let clickCount = 0;
            let clickTimer = null;

            closePopupsBtn.addEventListener('click', (e) => {
                e.preventDefault();

                clickCount++;
                console.log(`[CLICK] Count: ${clickCount}`);

                // Clear existing timer
                if (clickTimer) {
                    clearTimeout(clickTimer);
                }

                if (clickCount === 1) {
                    // First click - close popups
                    this.closeAllPopups();
                } else if (clickCount === 2) {
                    // Second click - just wait for potential third
                    console.log('[CLICK] Waiting for third click...');
                } else if (clickCount === 3) {
                    // Third click - RESTART!
                    console.log('[RESTART] Triple-click detected - restarting game');
                    this.restartGame();
                    clickCount = 0;
                    return;
                }

                // Reset counter after 500ms
                clickTimer = setTimeout(() => {
                    clickCount = 0;
                }, 500);
            });
        }

        // ✅ Transfer buttons - existing single-click + new double-click
        const transferP1Btn = document.getElementById('transfer-p1-btn');
        if (transferP1Btn) {
            // Existing single-click toggle
            transferP1Btn.addEventListener('click', (e) => {
                e.preventDefault();
                const newState = this.activeTransferPlayer === 1 ? null : 1;
                this.setTransferDirection(newState);
            });

            // ✅ NEW: Double-click to return graveyard card
            transferP1Btn.addEventListener('dblclick', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent single-click from firing
                this.playSoundEffect('fromgrave.mp3');
                console.log('[GRAVEYARD] Player 1 arrow double-clicked');
                this.returnLatestGraveyardCardToHand(0); // Player 1 = index 0
            });

            // Update tooltip
            transferP1Btn.title = 'Click: Transfer mode | Double-click: Return card from graveyard';
        }

        const transferP2Btn = document.getElementById('transfer-p2-btn');
        if (transferP2Btn) {
            // Existing single-click toggle
            transferP2Btn.addEventListener('click', (e) => {
                e.preventDefault();
                const newState = this.activeTransferPlayer === 2 ? null : 2;
                this.setTransferDirection(newState);
            });

            // ✅ NEW: Double-click to return graveyard card
            transferP2Btn.addEventListener('dblclick', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent single-click from firing
                this.playSoundEffect('fromgrave.mp3');
                console.log('[GRAVEYARD] Player 2 arrow double-clicked');
                this.returnLatestGraveyardCardToHand(1); // Player 2 = index 1
            });

            // Update tooltip
            transferP2Btn.title = 'Click: Transfer mode | Double-click: Return card from graveyard';
        }

        // ATK/DEF modifiers - just call the function
        const atkModBtn = document.getElementById('atk-mod-btn');
        if (atkModBtn) {
            // Initialize text
            atkModBtn.textContent = `+${this.atkModValue} ATK`;

            // Single click toggles
            atkModBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAtkModifier();
            });

            // Double click for value popup
            atkModBtn.addEventListener('dblclick', (e) => {
                e.preventDefault();
                this.showModValuePopup('atk');
            });
        }

        const defModBtn = document.getElementById('def-mod-btn');
        if (defModBtn) {
            // Initialize text
            defModBtn.textContent = `+${this.defModValue} DEF`;

            // Single click toggles
            defModBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleDefModifier();
            });

            // Double click for value popup
            defModBtn.addEventListener('dblclick', (e) => {
                e.preventDefault();
                this.showModValuePopup('def');
            });
        }


        console.log('Event listeners setup complete');
    }

    debugGameState() {
        console.log('=== FIXED GAME STATE DEBUG ===');
        console.log('Turn:', this.turnCounter, '- Current Player:', this.turn === 1 ? 'Player 1' : 'Player 2');
        console.log('Phase:', this.mp ? 'Main' : this.bp ? 'Battle' : 'End');
        console.log('Selected Attacker:', this.selectedAttacker ? this.selectedAttacker.card.cn : 'None');
        console.log('Selected Target:', this.selectedTarget ? this.selectedTarget.card.cn : 'None');
        console.log('Player 1 Hand:', this.hand[0].map(c => c.cn));
        console.log('Player 2 Hand:', this.hand[1].map(c => c.cn));
        console.log('Player 1 Monsters:', this.monsterField[0].map(c => `${c.cn} (${c.ak}/${c.df}) - ${c.position}`));
        console.log('Player 2 Monsters:', this.monsterField[1].map(c => `${c.cn} (${c.ak}/${c.df}) - ${c.position}`));
        console.log('===================================');
    };

};

function initSimulator() {
    console.log('Simulator script initializing...');

    const simulatorButton = document.getElementById('simulator-button');

    // Button click - calls the mirrorable method
    simulatorButton.addEventListener('click', () => {
        console.log('[DICE] Button clicked');
        if (window.yugiohGame) {
            window.yugiohGame.rollDice();
        } else {
            console.error('[DICE] Game instance not found!');
        }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    initSimulator();
});


// =====================================================
// Media Loader UI and Handlers
// =====================================================

function createMediaLoaderUI() {
    // Check if already exists
    if (document.getElementById('media-loader')) {
        return;
    }

    const loaderHTML = `
        <div id="media-loader" style="position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.95); padding: 10px; border-radius: 10px; z-index: 10000; color: white; border: 2px solid #4a9eff; font-family: Arial, sans-serif;">
            <div style="margin-bottom: 15px;">
    <button id="toggle-loader" style="background: transparent; border: none; font-size: 28px; cursor: pointer; padding: 0; line-height: 1;">📁</button>
</div>
            
            <div id="loader-content">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">
                        🖼️ Images Folder:
                    </label>
                    <input type="file" id="imgFolder" webkitdirectory directory multiple 
                           style="width: 100%; padding: 8px; background: #2a2a2a; border: 1px solid #555; border-radius: 5px; color: white; cursor: pointer; font-size: 12px;">
                    <div id="img-status" style="margin-top: 5px; font-size: 12px; color: #888;">No images loaded</div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold; font-size: 14px;">
                        🔊 Audio Folder:
                    </label>
                    <input type="file" id="audioFolder" webkitdirectory directory multiple 
                           style="width: 100%; padding: 8px; background: #2a2a2a; border: 1px solid #555; border-radius: 5px; color: white; cursor: pointer; font-size: 12px;">
                    <div id="audio-status" style="margin-top: 5px; font-size: 12px; color: #888;">No audio loaded</div>
                </div>
                
                <button id="clear-media" style="width: 100%; padding: 10px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 14px;">
                    🗑️ Clear All Media
                </button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', loaderHTML);

    console.log('✅ Media loader UI created');
    setupMediaHandlers();
}

function setupMediaHandlers() {
    const imgInput = document.getElementById('imgFolder');
    const audioInput = document.getElementById('audioFolder');
    const clearBtn = document.getElementById('clear-media');
    const toggleBtn = document.getElementById('toggle-loader');
    const loaderContent = document.getElementById('loader-content');
    const loader = document.getElementById('media-loader');

    // Image folder handler
    imgInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
        if (files.length === 0) {
            alert('No image files found in folder!');
            return;
        }

        const statusDiv = document.getElementById('img-status');
        statusDiv.textContent = `Loading ${files.length} images...`;
        statusDiv.style.color = '#f39c12';

        try {
            const count = await storeFilesInDB(files, 'images');
            await loadFromIndexedDB();

            statusDiv.textContent = `✅ ${count} images loaded`;
            statusDiv.style.color = '#27ae60';

            console.log('✅ Images stored and loaded');

            // Refresh display if game is running
            if (window.yugiohGame) {
                window.yugiohGame.displayAllCards();
            }
        } catch (err) {
            console.error('❌ Failed to load images:', err);
            statusDiv.textContent = `❌ Failed: ${err.message}`;
            statusDiv.style.color = '#e74c3c';
            alert('Failed to load images: ' + err.message);
        }
    });

    // Audio folder handler
    audioInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('audio/'));
        if (files.length === 0) {
            alert('No audio files found in folder!');
            return;
        }

        const statusDiv = document.getElementById('audio-status');
        statusDiv.textContent = `Loading ${files.length} audio files...`;
        statusDiv.style.color = '#f39c12';

        try {
            const count = await storeFilesInDB(files, 'audio');
            await loadFromIndexedDB();

            statusDiv.textContent = `✅ ${count} audio files loaded`;
            statusDiv.style.color = '#27ae60';

            console.log('✅ Audio stored and loaded');
        } catch (err) {
            console.error('❌ Failed to load audio:', err);
            statusDiv.textContent = `❌ Failed: ${err.message}`;
            statusDiv.style.color = '#e74c3c';
            alert('Failed to load audio: ' + err.message);
        }
    });

    // Clear media button
    clearBtn.addEventListener('click', async () => {
        if (confirm('Clear all stored images and audio?')) {
            try {
                await clearMediaStorage();
                window.CARD_AUDIO_MAP = {};
                window.CARD_IMAGE_MAP = {};

                document.getElementById('img-status').textContent = 'No images loaded';
                document.getElementById('img-status').style.color = '#888';
                document.getElementById('audio-status').textContent = 'No audio loaded';
                document.getElementById('audio-status').style.color = '#888';

                // Reset file inputs
                imgInput.value = '';
                audioInput.value = '';

                console.log('✅ Media cleared');

                // Refresh display
                if (window.yugiohGame) {
                    window.yugiohGame.displayAllCards();
                }
            } catch (err) {
                console.error('Failed to clear media:', err);
                alert('Failed to clear media: ' + err.message);
            }
        }
    });

    // ✅ NEW: Simple toggle with 📁 emoji
    let isExpanded = true; // Start expanded
    toggleBtn.addEventListener('click', () => {
        isExpanded = !isExpanded;

        if (isExpanded) {
            // Show content
            loaderContent.style.display = 'block';
            loader.style.width = '250px';
            console.log('📁 Media loader expanded');
        } else {
            // Hide content
            loaderContent.style.display = 'none';
            loader.style.width = 'auto';
            console.log('📁 Media loader collapsed');
        }
    });
}

// Check if media exists on page load and update status
async function checkExistingMedia() {
    try {
        const result = await loadFromIndexedDB();

        const imgStatus = document.getElementById('img-status');
        const audioStatus = document.getElementById('audio-status');

        if (imgStatus && result.imageCount > 0) {
            imgStatus.textContent = `✅ ${result.imageCount} images loaded`;
            imgStatus.style.color = '#27ae60';
        }

        if (audioStatus && result.audioCount > 0) {
            audioStatus.textContent = `✅ ${result.audioCount} audio files loaded`;
            audioStatus.style.color = '#27ae60';
        }

        console.log(`📦 Found existing media: ${result.imageCount} images, ${result.audioCount} audio`);
    } catch (err) {
        console.log('No existing media found');
    }
}

// Initialize media loader when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        createMediaLoaderUI();
        checkExistingMedia();
    });
} else {
    createMediaLoaderUI();
    checkExistingMedia();
}

console.log('✅ Media loader module initialized');


/// Complete Multiplayer Mirroring - Replace your game-multiplayer.js with this
console.log('Loading multiplayer client with mirroring...');


(function () {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    const password = params.get('password') || '';
    const isMultiplayer = params.get('multiplayer');

    console.log('=== MULTIPLAYER DIAGNOSTICS ===');
    console.log('Room:', room);
    console.log('isMultiplayer:', isMultiplayer);
    console.log('sessionStorage keys:', Object.keys(sessionStorage));
    console.log('mp_localPlayerIndex in storage:', sessionStorage.getItem('mp_localPlayerIndex'));
    console.log('mp_isCreator in storage:', sessionStorage.getItem('mp_isCreator'));
    console.log('mp_deck in storage:', sessionStorage.getItem('mp_deck'));
    console.log('===============================');

    if (!isMultiplayer || !room) {
        console.log('Not multiplayer mode');
        return;
    }

    const socket = io();
    window.multiplayerSocket = socket;
    let localPlayerIndex = sessionStorage.getItem('mp_localPlayerIndex')
        ? parseInt(sessionStorage.getItem('mp_localPlayerIndex'))
        : null;
    let isReconnecting = false;

    function showReconnectOverlay(message) {
        let overlay = document.getElementById('reconnect-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'reconnect-overlay';
           overlay.classList.add('reconectOverlay');
            overlay.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 64px; margin-bottom: 20px; animation: spin 2s linear infinite;">⏳</div>
                    <h2 id="reconnect-message" style="margin: 0; font-size: 28px; font-weight: bold;">Reconnecting...</h2>
                    <p style="margin-top: 10px; color: #888; font-size: 16px;">Please wait...</p>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            document.body.appendChild(overlay);
        }

        const messageEl = document.getElementById('reconnect-message');
        if (messageEl) {
            messageEl.textContent = message;
        }

        overlay.style.display = 'flex';
    }

    function hideReconnectOverlay() {
        const overlay = document.getElementById('reconnect-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    console.log('[MP] Initializing multiplayer...');
    console.log('[MP] Room:', room);
    console.log('[MP] Saved playerIndex:', localPlayerIndex);

    let localDeck = [];
    const imgPath = sessionStorage.getItem('mp_imgPath') || 'images/';
    const audioPath = sessionStorage.getItem('mp_audioPath') || 'cards audio/';
    const isCreator = sessionStorage.getItem('mp_isCreator') === '1';

    console.log('[MP] Initializing multiplayer...');
    console.log('[MP] Room:', room);
    console.log('[MP] Is creator:', isCreator);
    console.log('[MP] Saved playerIndex:', localPlayerIndex); // ✅ Debug

    // ✅ NEW: Check if this is a reconnection attempt
    const isReconnectAttempt = localPlayerIndex !== null;

    if (isReconnectAttempt) {
        console.log('[MP] 🔄 Detected reconnection attempt (playerIndex exists)');
        console.log('[MP] Waiting for socket to connect...');
        // Don't create/join room yet - wait for 'connect' event to reconnect
        isReconnecting = true;
    } else {
        console.log('[MP] 👤 New player joining for first time');
        // First time - proceed with create/join
        if (isCreator) {
            socket.emit('createRoom', { roomName: room, password }, (res) => {
                if (!res || !res.success) {
                    alert('Failed to create room: ' + (res?.error || 'Unknown error'));
                    return;
                }
                localPlayerIndex = res.playerIndex;
                sessionStorage.setItem('mp_localPlayerIndex', localPlayerIndex);
                console.log('[MP] Created room, player index:', localPlayerIndex);
                onRoomJoined();
            });
        } else {
            socket.emit('joinRoom', { roomName: room, password }, (res) => {
                if (!res || !res.success) {
                    alert('Failed to join room: ' + (res?.error || 'Unknown error'));
                    return;
                }
                localPlayerIndex = res.playerIndex;
                sessionStorage.setItem('mp_localPlayerIndex', localPlayerIndex);
                console.log('[MP] Joined room, player index:', localPlayerIndex);
                onRoomJoined();
            });
        }
    }

    function onRoomJoined() {
        console.log('[MP] In room as player', localPlayerIndex);

        try {
            localDeck = JSON.parse(sessionStorage.getItem('mp_deck') || '[]');
        } catch (e) {
            localDeck = [];
        }



        console.log('[MP] Sending deck, cards:', localDeck.length);

        socket.emit('setDeck', {
            roomName: room,
            deck: localDeck,

            imagePath: imgPath,
            audioPath: audioPath
        });
    }

    // ✅ Handle initial connection
    socket.on('connect', () => {
        console.log('[MP] Socket connected:', socket.id);

        // ✅ If reconnecting, try to rejoin
        if (isReconnecting && localPlayerIndex !== null) {
            console.log('[MP] 🔄 Attempting to reconnect as player', localPlayerIndex);
            showReconnectOverlay('Reconnecting...');

            socket.emit('reconnectToRoom', {
                roomName: room,
                password: password,
                playerIndex: localPlayerIndex

            }, (response) => {
                if (response && response.success) {
                    console.log('[MP] ✅ Successfully reconnected as player', response.playerIndex);

                    // ✅ FIX: Initialize game FIRST if it doesn't exist
                    if (!window.yugiohGame) {
                        console.log('[MP] Creating game instance for reconnection...');
                        window.yugiohGame = new YuGiOhGame();
                        // Set the local player index
                        window.yugiohGame.localPlayerIndex = response.playerIndex;
                    }

                    // THEN request game state sync
                    socket.emit('requestGameStateSync', { roomName: room });
                    showReconnectOverlay('Syncing game state...');
                } else {
                    console.error('[MP] ❌ Failed to reconnect:', response?.error);

                    // If room doesn't exist, clear saved data and go to lobby
                    if (response?.error === 'Room not found') {
                        sessionStorage.removeItem('mp_localPlayerIndex');
                        alert('Room no longer exists. Returning to lobby...');
                        window.location.href = '/lobby.html';
                    } else {
                        showReconnectOverlay('Failed to reconnect. Returning to lobby...');
                        setTimeout(() => {
                            sessionStorage.removeItem('mp_localPlayerIndex');
                            window.location.href = '/lobby.html';
                        }, 3000);
                    }
                }
            });
        }
    });

    // ✅ Server asks you to provide your game state
    socket.on('provideGameState', (data) => {
        console.log('[SYNC] Server asked me to provide game state');

        if (!window.yugiohGame) {
            console.log('[SYNC] Game not initialized yet');
            return;
        }

        const game = window.yugiohGame;
        const gameState = {
            deck: game.deck,
            extraDeck: game.extraDeck,
            hand: game.hand,

            monsterField: game.monsterField,
            spellTrapField: game.spellTrapField,
            grave: game.grave,
            lp: game.lp,
            lpHistory: game.lpHistory,
            turn: game.turn,
            turnCounter: game.turnCounter,
            mp: game.mp,
            bp: game.bp,
            ep: game.ep,
            firstTurn: game.firstTurn,
            originalDeck: game.originalDeck,
            selectedAttacker: game.selectedAttacker,
            selectedTarget: game.selectedTarget,
            activeAtkMod: game.activeAtkMod,
            activeDefMod: game.activeDefMod,
            atkModValue: game.atkModValue,
            atkModDir: game.atkModDir,
            defModValue: game.defModValue,
            defModDir: game.defModDir,
            activeTransferPlayer: game.activeTransferPlayer,
            phaseButtonsPlayer2: document.getElementById('mp-button')?.classList.contains('player2') || false,
            activeValue: game.activeValue, 
            activeValueCard: game.activeValueCard,
            randomdCount: game.randomdCount,
            diceValue : game.diceValue ,
        };

        console.log('[SYNC] Sending my game state to reconnecting player');
        socket.emit('sendGameState', {
            roomName: room,
            gameState: gameState,
            targetSocketId: data.requesterId
        });
    });

    // ✅ Receive game state from other player
    socket.on('receiveGameState', (data) => {
        console.log('[SYNC] Received game state from other player');

        if (!window.yugiohGame || !data.gameState) {
            console.log('[SYNC] Cannot apply - game not ready or no state');
            return;
        }

        const game = window.yugiohGame;
        const state = data.gameState;

        try {
            // ✅ Restore all game state
            game.deck = state.deck;
            game.extraDeck = state.extraDeck;
            game.hand = state.hand;
            game.monsterField = state.monsterField;
            game.spellTrapField = state.spellTrapField;
            game.grave = state.grave;
            game.lp = state.lp;
            game.lpHistory = state.lpHistory;
            game.turn = state.turn;
            game.turnCounter = state.turnCounter;
            game.mp = state.mp;
            game.bp = state.bp;
            game.ep = state.ep;
            game.firstTurn = state.firstTurn;
            game.originalDeck = state.originalDeck;
            game.selectedAttacker = state.selectedAttacker;
            game.selectedTarget = state.selectedTarget;
            game.activeAtkMod = state.activeAtkMod;
            game.activeDefMod = state.activeDefMod;
            game.atkModValue = state.atkModValue;
            game.atkModDir = state.atkModDir;
            game.defModValue = state.defModValue;
            game.defModDir = state.defModDir;
            game.activeTransferPlayer = state.activeTransferPlayer;
            game.activeValue = state.activeValue || null; 
            game.activeValueCard = state.activeValueCard || null; 
            game.randomdCount= state.randomdCount;
            game.diceValue = state.diceValue;

            // ✅ Refresh display
            game.updateDisplay();
            game.displayAllCards();

            // ✅ Set correct phase
            if (game.mp) game.setMainPhase();
            else if (game.bp) game.setBattlePhase();
            else if (game.ep) game.setEndPhase();

            // ✅ ADD: Restore phase button colors
            const epButton = document.getElementById('ep-button');
            const bpButton = document.getElementById('bp-button');
            const mpButton = document.getElementById('mp-button');

            const shouldBePlayer2Color = state.phaseButtonsPlayer2 || false;

            if (epButton) {
                if (shouldBePlayer2Color) {
                    epButton.classList.add('player2');
                } else {
                    epButton.classList.remove('player2');
                }
            }

            if (bpButton) {
                if (shouldBePlayer2Color) {
                    bpButton.classList.add('player2');
                } else {
                    bpButton.classList.remove('player2');
                }
            }

            if (mpButton) {
                if (shouldBePlayer2Color) {
                    mpButton.classList.add('player2');
                } else {
                    mpButton.classList.remove('player2');
                }
            }

            console.log('[SYNC] ✅ Phase button colors restored:', shouldBePlayer2Color ? 'Pink (Player 2)' : 'Blue (Player 1)');

            console.log('✅ Game state fully restored from other player');
            hideReconnectOverlay();

            // Remove manual sync overlay if it exists
            const manualSyncOverlay = document.getElementById('manual-sync-overlay');
            if (manualSyncOverlay) {
                manualSyncOverlay.remove();
            }

            // Show success message
            const successMsg = document.createElement('div');
            successMsg.classList.add('successMsg');
            successMsg.textContent = '✅ Game synced successfully!';
            document.body.appendChild(successMsg);

            setTimeout(() => {
                successMsg.remove();
            }, 3000);

            // Re-setup mirroring
            setTimeout(() => {
                if (window.yugiohGame) {
                    setupMirroring();
                }
            }, 500);

        } catch (err) {
            console.error('[SYNC] Failed to restore game state:', err);
            alert('Failed to sync game state. Returning to lobby...');
            setTimeout(() => {
                window.location.href = '/lobby.html';
            }, 2000);
        }
    });



    socket.on('deckStatusUpdate', (data) => {
        console.log('[MP] Deck status:', data);
    });

    socket.on('gameStart', ({ gameState, imageAudioPaths, decks }) => {
        console.log('[MP] ✅ Game starting!');
        console.log('[MP] Decks received:', decks[0]?.length, 'vs', decks[1]?.length);

        const myDeck = decks[localPlayerIndex] || [];
        const remoteDeck = decks[localPlayerIndex === 0 ? 1 : 0] || [];


        // Set global decks
        if (localPlayerIndex === 0) {
            window.player1Deck = myDeck;
            window.player2Deck = remoteDeck;

        } else {
            window.player1Deck = remoteDeck;
            window.player2Deck = myDeck;

        }

        // Set paths
        try {
            const imageMap = JSON.parse(sessionStorage.getItem('mp_imageMap') || '{}');
            const audioMap = JSON.parse(sessionStorage.getItem('mp_audioMap') || '{}');
            if (Object.keys(imageMap).length > 0) window.CARD_IMAGE_MAP = imageMap;
            if (Object.keys(audioMap).length > 0) window.CARD_AUDIO_MAP = audioMap;
        } catch (e) {
            console.log('[MP] No folder maps');
        }

        const serverPaths = imageAudioPaths?.[`player${localPlayerIndex + 1}`] || {};
        window.CARD_IMAGE_PATH = serverPaths.imagePath || imgPath;
        window.CARD_AUDIO_PATH = serverPaths.audioPath || audioPath;

        // Initialize game
        console.log('[MP] Creating game instance...');
        window.yugiohGame = new YuGiOhGame();
        window.yugiohGame.autoStartGame();

        // CRITICAL: Setup mirroring immediately after game starts
        setupMirroring();
    });

    function setupMirroring() {
        const game = window.yugiohGame;
        if (!game) {
            console.error('[MIRROR] Game not found!');
            return;
        }

        game.__suppressEmit = false;
        console.log('[MIRROR] Setting up action mirroring...');

        // All methods to mirror
        const methodsToMirror = [
            'playMonster',
            'playSpellTrapFaceUp',
            'playSpellTrapFaceDown',
            'directAttack',
            'sendMonsterToGraveyard',
            'sendSpellTrapToGraveyard',
            'modifyLPFromPopup',
            'undoLastLPChange',
            'setMainPhase',
            'setBattlePhase',
            'setEndPhase',
            'modifyCardStat',
            'executeCardTransfer',
            'showLPModificationPopup',
            'showBringCardsPopup',
            'confirmCardTransfer',
           // 'showFieldPlacementChoice',
            'showCardModificationPopup',
            'setTransferDirection',      // ← Transfer buttons
            'toggleAtkModifier',         // ← ATK button
            'toggleDefModifier',         // ← DEF button  
            'closeAllPopups',
            'rollDice',
            'setCardFilter',
            'sortCardsAZ',
            'setDropdownValue',
            'showModValuePopup',
            'confirmModValue',
            'handleFieldCardClick',
            'handleSpellTrapFieldClick',
            'drawCardForPlayer',
            'returnLatestGraveyardCardToHand',
            'modifyLPV2',
            'toggleCheckButton',
            'flipCardFaceUpV2',
            'playSoundEffect',
            'modifyCardStatsByDoubleClick',
            'closeModificationPopup',
            'activateValueSelection',
            'deactivateValueSelection',
            'applyValueToLP',




        ];

        let wrappedCount = 0;

        methodsToMirror.forEach(methodName => {
            if (typeof game[methodName] !== 'function') {
                console.warn(`[MIRROR] Method ${methodName} not found`);
                return;
            }

            const originalMethod = game[methodName].bind(game);

            game[methodName] = function (...args) {
                // Execute original
                const result = originalMethod(...args);

                // Emit to other player (if not suppressed)
                if (!game.__suppressEmit) {
                    console.log(`[MIRROR] 📤 Sending ${methodName}`, args);
                    socket.emit('action', {
                        method: methodName,
                        args: args
                    });
                }

                return result;
            };

            wrappedCount++;
        });

        console.log(`[MIRROR] ✅ Wrapped ${wrappedCount} methods`);

        // Listen for incoming actions
        socket.on('action', (msg) => {
            if (!msg || !msg.method) return;

            console.log(`[MIRROR] 📥 Received ${msg.method}`, msg.args);

            game.__suppressEmit = true;

            try {
                const method = game[msg.method];
                if (typeof method === 'function') {
                    method.apply(game, msg.args || []);
                    console.log(`[MIRROR] ✅ Applied ${msg.method}`);
                } else {
                    console.error(`[MIRROR] Method not found: ${msg.method}`);
                }
            } catch (error) {
                console.error(`[MIRROR] Error:`, error);
            } finally {
                game.__suppressEmit = false;
            }
        });

        console.log('[MIRROR] 🔥 Mirroring ACTIVE');

        // Setup button syncing
        setTimeout(() => {
            if (window.syncButtonStates) {
                window.syncButtonStates();
            }
        }, 500);
    }

    // Connection handlers
    socket.on('playerJoined', ({ playerIndex }) => {
        console.log(`[MP] Player ${playerIndex} joined`);
    });

    socket.on('playerDisconnected', (data) => {
        console.log('[MP] Player disconnected:', data);
        // Show a non-blocking overlay with countdown and option to return to lobby
        let overlay = document.getElementById('mp-disconnect-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'mp-disconnect-overlay';
            overlay.style.cssText = 'position:fixed;top:10%;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.9);color:#fff;padding:20px;border-radius:8px;z-index:10000;text-align:center;';
            overlay.innerHTML = `
                <div id="mp-disconnect-msg">Opponent disconnected. Waiting for reconnection... <span id="mp-disconnect-timer">60</span>s</div>
                <div style="margin-top:10px;">
                  <button id="mp-return-lobby-btn" style="padding:8px 12px;border-radius:6px;border:none;cursor:pointer;background:#e74c3c;color:white;font-weight:bold;">Return to Lobby</button>
                </div>
            `;
            document.body.appendChild(overlay);
            const btn = overlay.querySelector('#mp-return-lobby-btn');
            btn.addEventListener('click', () => {
                if (window._mpDisconnectInterval) {
                    clearInterval(window._mpDisconnectInterval);
                    window._mpDisconnectInterval = null;
                }
                overlay.remove();
                window.location.href = '/lobby.html';
            });
        }
        // start countdown (60s) unless already started
        if (!window._mpDisconnectInterval) {
            let remaining = 60;
            const timerSpan = document.getElementById('mp-disconnect-timer');
            if (timerSpan) timerSpan.textContent = remaining;
            window._mpDisconnectInterval = setInterval(() => {
                remaining -= 1;
                const ts = document.getElementById('mp-disconnect-timer');
                if (ts) ts.textContent = remaining;
                if (remaining <= 0) {
                    clearInterval(window._mpDisconnectInterval);
                    window._mpDisconnectInterval = null;
                }
            }, 1000);
        }
    });

    // Final timeout from server – opponent failed to reconnect
    socket.on('playerTimeout', (data) => {
        console.log('[MP] Player reconnection timed out:', data);
        const overlay = document.getElementById('mp-disconnect-overlay');
        if (overlay) {
            const msg = overlay.querySelector('#mp-disconnect-msg');
            if (msg) msg.textContent = 'Opponent failed to reconnect. Returning to lobby...';
        }
        setTimeout(() => {
            if (window._mpDisconnectInterval) {
                clearInterval(window._mpDisconnectInterval);
                window._mpDisconnectInterval = null;
            }
            if (overlay) overlay.remove();
            window.location.href = '/lobby.html';
        }, 2000);
    });

    socket.on('playerReconnected', (data) => {
        console.log('[MP] Player reconnected:', data);
        const overlay = document.getElementById('mp-disconnect-overlay');
        if (overlay) {
            if (window._mpDisconnectInterval) {
                clearInterval(window._mpDisconnectInterval);
                window._mpDisconnectInterval = null;
            }
            overlay.remove();
        }

        // ✅ Show non-blocking notification instead of alert
        showReconnectNotification('Opponent reconnected!');
    });


    function showReconnectNotification(message) {
        const notification = document.createElement('div');
        notification.classList.add('reconectNotif');
        notification.textContent = message;

        // Add animation
        const style = document.createElement('style');
      
        if (!document.getElementById('reconnect-notification-style')) {
            style.id = 'reconnect-notification-style';
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.transition = 'opacity 0.3s, transform 0.3s';
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Final timeout from server – opponent failed to reconnect
    socket.on('playerTimeout', (data) => {
        console.log('[MP] Player reconnection timed out:', data);
        const overlay = document.getElementById('mp-disconnect-overlay');
        if (overlay) {
            const msg = overlay.querySelector('#mp-disconnect-msg');
            if (msg) msg.textContent = 'Opponent failed to reconnect. Returning to lobby...';
        }
        setTimeout(() => {
            if (window._mpDisconnectInterval) {
                clearInterval(window._mpDisconnectInterval);
                window._mpDisconnectInterval = null;
            }
            if (overlay) overlay.remove();
            window.location.href = '/lobby.html';
        }, 2000);
    });

    console.log('[MP] Multiplayer client loaded');
})();

