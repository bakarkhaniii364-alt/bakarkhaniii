let audioCtx = null;
let isMuted = false;

function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `p-3 border-2 border-[var(--border)] shadow-[2px_2px_0px_var(--border)] font-bold text-xs lowercase select-none pointer-events-auto flex items-center gap-2 transform translate-y-4 opacity-0 transition-all duration-300 toast-animate-in ${
        type === 'success' ? 'bg-[var(--color-success)] text-[var(--text-on-success)]' :
        type === 'danger' ? 'bg-[var(--color-danger)] text-[var(--text-on-danger)]' :
        type === 'warning' ? 'bg-[var(--color-warning)] text-[var(--text-on-warning)]' :
        'bg-[var(--bg-window)] text-[var(--text-main)]'
    }`;
    toast.innerHTML = message;
    container.appendChild(toast);
    
    // Force reflow
    toast.offsetHeight;
    
    // Animate in
    toast.classList.remove('translate-y-4', 'opacity-0');
    
    setTimeout(() => {
        toast.classList.add('translate-y-[-10px]', 'opacity-0');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

function toggleAudio() {
    isMuted = !isMuted;
    const chk = document.getElementById('sound-checkbox');
    if (chk) chk.checked = !isMuted;
    playSynth('pop');
}

function toggleAudioSetting(enabled) {
    isMuted = !enabled;
    playSynth('pop');
}

function toggleDudhbhatSetting(enabled) {
    state.dudhbhatEnabled = enabled;
    playSynth('pop');
    render();
}

function playSynth(type) {
    if (isMuted) return;
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        const now = audioCtx.currentTime;

        if (type === 'pop') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.setValueAtTime(700, now + 0.12);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.setValueAtTime(0.01, now + 0.12);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(now + 0.12);
        } else if (type === 'slap') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.setValueAtTime(100, now + 0.15);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.setValueAtTime(0.01, now + 0.15);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(now + 0.15);
        } else if (type === 'fanfare') {
            [261.63, 329.63, 392.00, 523.25].forEach((freq, idx) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                gain.gain.setValueAtTime(0.12, now + idx * 0.08);
                gain.gain.setValueAtTime(0.01, now + idx * 0.08 + 0.3);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now + idx * 0.08);
                osc.stop(now + idx * 0.08 + 0.3);
            });
        } else if (type === 'womp') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.setValueAtTime(90, now + 0.4);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.setValueAtTime(0.01, now + 0.45);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(now + 0.45);
        } else if (type === 'tick') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.setValueAtTime(0.01, now + 0.05);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(now + 0.05);
        }
    } catch (err) {
        console.log("audio issue: ", err);
    }
}

const DEFAULT_NAMES = [
    'chonky panda', 'silly dino', 'lazy pizza', 'spicy taco', 'space monkey',
    'super onion', 'funky frog', 'cosmic penguin', 'magic potato', 'detective owl',
    'gassy garlic', 'wobbly jelly', 'drunk teapot', 'angry muffin', 'sleepy sloth'
];

const AVATAR_COLORS = [
    'bg-[var(--primary)] text-[var(--text-on-primary)]',
    'bg-[var(--secondary)] text-[var(--text-on-secondary)]',
    'bg-[var(--accent)] text-[var(--text-on-accent)]',
    'bg-[var(--color-success)] text-[var(--text-on-success)]',
    'bg-[var(--color-warning)] text-[var(--text-on-warning)]',
    'bg-[var(--color-danger)] text-[var(--text-on-danger)]',
    'bg-teal-600 text-white',
    'bg-purple-600 text-white',
    'bg-orange-600 text-white',
    'bg-emerald-600 text-white',
    'bg-indigo-600 text-white',
    'bg-slate-500 text-white'
];

const CUTE_WORD_PAIRS = [
    // --- Animals ---
    ["Cheetah", "Leopard"], ["Alligator", "Crocodile"], ["Butterfly", "Moth"], ["Bee", "Wasp"],
    ["Raven", "Crow"], ["Hamster", "Guinea Pig"], ["Donkey", "Mule"], ["Pigeon", "Seagull"],
    ["Otter", "Beaver"], ["Frog", "Toad"], ["Spider", "Scorpion"], ["Lion", "Tiger"],
    ["Eagle", "Falcon"], ["Squirrel", "Chipmunk"], ["Seal", "Sea Lion"], ["Goat", "Sheep"],
    ["Camel", "Llama"], ["Snail", "Slug"], ["Octopus", "Squid"], ["Deer", "Elk"],
    ["Duck", "Goose"], ["Crab", "Lobster"], ["Moose", "Reindeer"], ["Panther", "Cougar"],
    
    // --- Food & Drinks ---
    ["Lemonade", "Limeade"], ["Pancake", "Waffle"], ["Ketchup", "Mustard"], ["Milkshake", "Smoothie"],
    ["Muffin", "Cupcake"], ["Sushi", "Sashimi"], ["Taco", "Burrito"], ["Cookie", "Biscuit"],
    ["Hot Chocolate", "Mocha"], ["Cheese", "Butter"], ["Ramen", "Pho"], ["Bacon", "Sausage"],
    ["Onion", "Garlic"], ["Pepper", "Chili"], ["Strawberry", "Raspberry"], ["Peach", "Apricot"],
    ["Watermelon", "Cantaloupe"], ["Broccoli", "Cauliflower"], ["Spaghetti", "Macaroni"], ["Honey", "Syrup"],
    ["Whiskey", "Rum"], ["Wine", "Champagne"], ["Salt", "Pepper"], ["Mayonnaise", "Salad Dressing"],
    ["Espresso", "Americano"], ["Cider", "Apple Juice"], ["Bagel", "Donut"], ["Gelato", "Sherbet"],
    
    // --- Places & Nature ---
    ["Desert", "Savannah"], ["Jungle", "Rainforest"], ["Cave", "Tunnel"], ["River", "Canal"],
    ["Waterfall", "Geyser"], ["Island", "Peninsula"], ["Park", "Garden"], ["Skyline", "Horizon"],
    ["Glacier", "Iceberg"], ["Canyon", "Valley"], ["Ocean", "Sea"], ["Swamp", "Marsh"],
    ["Mountain", "Volcano"], ["Pond", "Puddle"], ["Beach", "Coast"], ["Cliff", "Slope"],
    
    // --- Household & Clothing ---
    ["Backpack", "Briefcase"], ["Blanket", "Duvet"], ["Mirror", "Window"], ["Candle", "Lantern"],
    ["Screwdriver", "Drill"], ["Perfume", "Cologne"], ["Bucket", "Basin"], ["Socks", "Slippers"],
    ["Helmet", "Cap"], ["Gloves", "Mittens"], ["Sneakers", "Boots"], ["Jeans", "Trousers"],
    ["Tie", "Bowtie"], ["Scarf", "Shawl"], ["Raincoat", "Umbrella"], ["Pillow", "Cushion"],
    ["Ladder", "Stairs"], ["Soap", "Shampoo"], ["Toothbrush", "Floss"], ["Curtain", "Blind"],
    ["Rug", "Carpet"], ["Sweater", "Cardigan"], ["Wallet", "Purse"], ["Suitcase", "Duffel Bag"],
    
    // --- Objects & Hobby ---
    ["Guitar", "Ukulele"], ["Microscope", "Telescope"], ["Hammer", "Mallet"], ["Violin", "Viola"],
    ["Soccer", "Rugby"], ["Tennis", "Badminton"], ["Chess", "Checkers"], ["Painting", "Sketch"],
    ["Keyboard", "Typewriter"], ["Trophy", "Medal"], ["Ticket", "Pass"], ["Diary", "Notebook"],
    ["Crayon", "Marker"], ["Brick", "Stone"], ["Plaster", "Concrete"], ["Feather", "Fur"],
    ["Leather", "Suede"], ["Clock", "Hourglass"], ["Map", "Compass"], ["Magnet", "Gravity"],
    ["Smoke", "Steam"], ["Dust", "Sand"], ["Battery", "Generator"], ["Flame", "Spark"],
    ["Diamond", "Emerald"], ["Laptop", "Desktop"], ["Airplane", "Helicopter"], ["Submarine", "Ship"],
    ["Train", "Tram"], ["Bicycle", "Skateboard"], ["Gold", "Platinum"], ["Spoon", "Fork"]
];

const state = {
    phase: 'HOME', // HOME, DRAFT_CARDS, DISCUSSION, ACCUSE, FINGER_STAMP, WINNER
    playerCount: 4,
    guptoCount: 1,
    players: [], // { id, name, avatarColorIdx, word, role, eliminated: false, votesPlaced: 0 }
    cards: [], // { id, role, word, draftedBy: null }
    roleDeck: [],
    civilianWord: '',
    guptoWord: '',
    currentPair: [],
    currentPlayerIndex: 0,
    boxOpened: false,
    votedOutPlayer: null,
    discussionLeader: null,
    winnerGroup: null, // CIVILIANS or GUPTOS
    theme: 'matcha', // Forced matcha theme
    tempColorIdx: undefined,
    dudhbhatEnabled: false,
    dudhbhatGuessSubmitted: false,
    dudhbhatGuessedCorrectly: false,
    dudhbhatGuessWord: '',
    
    // Temporary variables for modal setup/drafting
    tempPlayerCount: 4,
    tempGuptoCount: 1,
    draftName: '',
    selectedCardId: null,
    pendingExilePlayerId: null
};

const container = document.getElementById('game-container');

function getInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
}

function changeTheme(themeName) {
    playSynth('pop');
    state.theme = 'matcha';
    document.documentElement.setAttribute('data-theme', 'matcha');
    localStorage.setItem('app_theme', 'matcha');
}

function openModal(id) {
    playSynth('pop');
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('hidden');
        if (id === 'settings-modal') {
            const chkSound = document.getElementById('sound-checkbox');
            if (chkSound) chkSound.checked = !isMuted;
            const chkDudhbhat = document.getElementById('dudhbhat-checkbox');
            if (chkDudhbhat) chkDudhbhat.checked = state.dudhbhatEnabled;
        }
    }
}

function closeModal(id) {
    playSynth('pop');
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('hidden');
}

function addLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    state.log.push({ timestamp, message, type });
}

function modifyCounter(field, delta) {
    playSynth('tick');
    if (field === 'players') {
        state.playerCount = Math.max(3, Math.min(12, state.playerCount + delta));
        const maxGuptos = Math.max(1, state.playerCount - 2);
        if (state.guptoCount > maxGuptos) state.guptoCount = maxGuptos;
    } else {
        const maxGuptos = Math.max(1, state.playerCount - 2);
        state.guptoCount = Math.max(1, Math.min(maxGuptos, state.guptoCount + delta));
    }
    render();
}

function openSetupModal() {
    state.tempPlayerCount = state.playerCount;
    state.tempGuptoCount = state.guptoCount;
    updateSetupModalUI();
    openModal('setup-modal');
}

function adjustSetupPlayers(delta) {
    playSynth('tick');
    state.tempPlayerCount = Math.max(3, Math.min(12, state.tempPlayerCount + delta));
    // Apply Gupto limit rules
    if (state.tempPlayerCount <= 5) {
        state.tempGuptoCount = 1;
    } else {
        const maxGuptos = Math.min(3, state.tempPlayerCount - 2);
        if (state.tempGuptoCount > maxGuptos) {
            state.tempGuptoCount = maxGuptos;
        }
    }
    updateSetupModalUI();
}

function adjustSetupGuptos(delta) {
    if (state.tempPlayerCount <= 5) {
        return;
    }
    playSynth('tick');
    const maxGuptos = Math.min(3, state.tempPlayerCount - 2);
    state.tempGuptoCount = Math.max(1, Math.min(maxGuptos, state.tempGuptoCount + delta));
    updateSetupModalUI();
}

function updateSetupModalUI() {
    const pcSpan = document.getElementById('setup-player-count');
    const gcSpan = document.getElementById('setup-gupto-count');
    const guptoBox = document.getElementById('setup-gupto-box');
    const guptoLabel = document.getElementById('setup-gupto-label');
    const btnDec = document.getElementById('btn-gupto-dec');
    const btnInc = document.getElementById('btn-gupto-inc');
    
    if (pcSpan) pcSpan.textContent = state.tempPlayerCount;
    if (gcSpan) gcSpan.textContent = state.tempGuptoCount;
    
    if (state.tempPlayerCount <= 5) {
        if (guptoBox) {
            guptoBox.style.opacity = '0.4';
            guptoBox.style.pointerEvents = 'none';
        }
        if (guptoLabel) guptoLabel.textContent = 'gupto count (locked)';
        if (btnDec) btnDec.disabled = true;
        if (btnInc) btnInc.disabled = true;
    } else {
        if (guptoBox) {
            guptoBox.style.opacity = '1';
            guptoBox.style.pointerEvents = 'auto';
        }
        if (guptoLabel) guptoLabel.textContent = 'gupto count';
        if (btnDec) btnDec.disabled = false;
        if (btnInc) btnInc.disabled = false;
    }
}

function dealCardsFromSetup() {
    playSynth('pop');
    state.playerCount = state.tempPlayerCount;
    state.guptoCount = state.tempGuptoCount;
    
    closeModal('setup-modal');
    
    const pair = CUTE_WORD_PAIRS[Math.floor(Math.random() * CUTE_WORD_PAIRS.length)];
    state.currentPair = pair;
    
    const swapWords = Math.random() > 0.5;
    const civilianWord = (swapWords ? pair[0] : pair[1]).toLowerCase();
    const guptoWord = (swapWords ? pair[1] : pair[0]).toLowerCase();

    let roleDeck = [];
    for (let i = 0; i < state.guptoCount; i++) {
        roleDeck.push('Gupto');
    }
    
    const hasDudhbhat = state.dudhbhatEnabled && state.playerCount >= 5;
    if (hasDudhbhat) {
        roleDeck.push('Dudhbhat');
    }

    while (roleDeck.length < state.playerCount) {
        roleDeck.push('Civilian');
    }

    for (let i = roleDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [roleDeck[i], roleDeck[j] ] = [roleDeck[j], roleDeck[i]];
    }

    state.roleDeck = roleDeck;
    state.civilianWord = civilianWord;
    state.guptoWord = guptoWord;
    state.players = [];
    state.currentPlayerIndex = 0;
    
    state.cards = [];
    for (let i = 0; i < state.playerCount; i++) {
        const role = roleDeck[i];
        const word = role === 'Civilian' ? civilianWord : (role === 'Gupto' ? guptoWord : '');
        state.cards.push({
            id: i,
            role: role,
            word: word,
            draftedBy: null
        });
    }
    
    state.log = [];
    addLog(`[game] game started with ${state.playerCount} players. guptos: ${state.guptoCount}`, 'info');
    
    state.phase = 'DRAFT_CARDS';
    showToast(`dealt ${state.playerCount} cards successfully!`, 'success');
    render();
    
    startPlayerDraft();
}

function startPlayerDraft() {
    const idx = state.currentPlayerIndex;
    const placeholderName = DEFAULT_NAMES[idx % DEFAULT_NAMES.length] + ' ' + (Math.floor(Math.random() * 89) + 10);
    const input = document.getElementById('draft-name-input');
    
    state.tempColorIdx = idx % AVATAR_COLORS.length;
    
    if (input) {
        input.value = placeholderName;
        input.oninput = (e) => updateDraftAvatar(e.target.value);
    }
    
    const titleEl = document.getElementById('name-entry-title');
    if (titleEl) {
        titleEl.textContent = `player ${idx + 1} name`;
    }
    
    updateDraftAvatar(placeholderName);
    openModal('name-entry-modal');
}

function updateDraftAvatar(name) {
    const initials = getInitials(name);
    const avatar = document.getElementById('name-entry-avatar');
    if (avatar) {
        avatar.textContent = initials;
        avatar.className = `w-11 h-11 border-2 border-[var(--border)] flex items-center justify-center text-lg font-bold font-mono tracking-tighter shrink-0 uppercase ${AVATAR_COLORS[state.tempColorIdx % AVATAR_COLORS.length]}`;
    }
}

function cycleDraftColor() {
    playSynth('tick');
    state.tempColorIdx = (state.tempColorIdx + 1) % AVATAR_COLORS.length;
    const input = document.getElementById('draft-name-input');
    updateDraftAvatar(input ? input.value : '');
}

function submitDraftName() {
    const input = document.getElementById('draft-name-input');
    let name = input ? input.value.trim().toLowerCase() : '';
    if (!name) {
        const idx = state.currentPlayerIndex;
        name = DEFAULT_NAMES[idx % DEFAULT_NAMES.length] + ' ' + (Math.floor(Math.random() * 89) + 10);
    }
    
    state.draftName = name;
    closeModal('name-entry-modal');
    showToast(`hey ${name}, select a secret card!`, 'info');
    render();
}

function clickDraftCard(cardId) {
    if (state.currentPlayerIndex >= state.playerCount) return;
    
    if (!state.draftName) {
        startPlayerDraft();
        return;
    }
    
    const card = state.cards[cardId];
    if (card.draftedBy !== null) {
        showToast("card is already taken!", "warning");
        return;
    }
    
    playSynth('slap');
    card.draftedBy = state.draftName;
    state.selectedCardId = cardId;
    
    state.players.push({
        id: state.currentPlayerIndex,
        name: state.draftName,
        avatarColorIdx: state.tempColorIdx,
        word: card.word,
        role: card.role,
        eliminated: false,
        votesPlaced: 0
    });
    
    const greeting = document.getElementById('reveal-player-greeting');
    const secretWordEl = document.getElementById('reveal-secret-word');
    const instructionsEl = document.getElementById('reveal-instructions');
    
    if (greeting) greeting.textContent = `hey, ${state.draftName}!`;
    if (secretWordEl) {
        if (card.role === 'Dudhbhat') {
            secretWordEl.innerHTML = `<i data-lucide="ghost" class="w-5 h-5 inline-block mr-1 text-[var(--accent)] align-text-bottom"></i> dudhbhat<br><span class="text-xs uppercase opacity-75 font-normal">[no word]</span>`;
            if (instructionsEl) instructionsEl.textContent = "you have no secret word. listen to clues, pretend to have a word, and blend in!";
        } else {
            secretWordEl.textContent = card.word;
            if (instructionsEl) instructionsEl.textContent = "memorize this word! don't let others see.";
        }
    }
    
    openModal('reveal-modal');
}

function confirmCardReveal() {
    closeModal('reveal-modal');
    addLog(`[player] player ${state.currentPlayerIndex + 1} (${state.draftName}) selected card #${state.selectedCardId + 1}`, 'info');
    showToast(`${state.draftName} card locked!`, 'success');
    
    state.draftName = '';
    state.selectedCardId = null;
    
    state.currentPlayerIndex++;
    if (state.currentPlayerIndex >= state.playerCount) {
        launchDiscussion();
    } else {
        render();
        startPlayerDraft();
    }
}

function openEndGameConfirm() {
    openModal('confirm-end-modal');
}

function confirmEndGame() {
    closeModal('confirm-end-modal');
    showToast("game ended.", "warning");
    resetGame();
}

function openExileConfirm(playerId) {
    state.pendingExilePlayerId = playerId;
    const player = state.players.find(p => p.id === playerId);
    const textEl = document.getElementById('confirm-exile-text');
    if (textEl && player) {
        textEl.innerHTML = `are you sure you want to exile <span class="font-bold underline text-[var(--primary)]">${player.name}</span>?`;
    }
    openModal('confirm-exile-modal');
}

function confirmExileAction() {
    closeModal('confirm-exile-modal');
    if (state.pendingExilePlayerId !== null) {
        lockElimination(state.pendingExilePlayerId);
        state.pendingExilePlayerId = null;
    }
}

function launchDiscussion() {
    const alive = state.players.filter(p => !p.eliminated);
    state.discussionLeader = alive[Math.floor(Math.random() * alive.length)];
    state.phase = 'DISCUSSION';
    addLog(`[speech] speech circle initialized. lead: ${state.discussionLeader.name}.`, 'action');
    render();
}

function toAccusationBoard() {
    playSynth('pop');
    state.players.forEach(p => p.votesPlaced = 0);
    state.phase = 'ACCUSE';
    addLog(`[voting] voting terminal opened. prepare point accusations.`, 'info');
    render();
}

function addsusTally(playerId) {
    playSynth('tick');
    const p = state.players.find(x => x.id === playerId);
    if (p) {
        p.votesPlaced = (p.votesPlaced || 0) + 1;
    }
    render();
}

function clearAccusations() {
    playSynth('pop');
    state.players.forEach(p => p.votesPlaced = 0);
    render();
}

function lockElimination(playerId) {
    playSynth('womp');
    const target = state.players.find(p => p.id === playerId);
    target.eliminated = true;
    state.votedOutPlayer = target;
    state.phase = 'FINGER_STAMP';
    addLog(`[exiled] ${target.name} exiled! role: ${target.role.toLowerCase()}${target.role !== 'Dudhbhat' ? ` (key: ${target.word})` : ''}.`, 'exile');
    render();
}

function submitDudhbhatGuess(guess) {
    playSynth('pop');
    state.dudhbhatGuessWord = guess.trim();
    state.dudhbhatGuessSubmitted = true;
    if (guess.trim().toLowerCase() === state.civilianWord.toLowerCase()) {
        state.dudhbhatGuessedCorrectly = true;
        addLog(`[dudhbhat-guess] dudhbhat guess correct: "${guess.trim()}".`, 'win');
    } else {
        state.dudhbhatGuessedCorrectly = false;
        addLog(`[dudhbhat-guess] dudhbhat guess incorrect: "${guess.trim()}".`, 'info');
    }
    render();
}

function triggerHQCheck() {
    const alive = state.players.filter(p => !p.eliminated);
    const guptoCount = alive.filter(p => p.role === 'Gupto').length;
    const civilianCount = alive.filter(p => p.role === 'Civilian').length;

    if (guptoCount === 0) {
        state.winnerGroup = 'CIVILIANS';
        state.phase = 'WINNER';
        addLog(`[winner] civilians win! guptos successfully detected and removed.`, 'win');
        setTimeout(() => playSynth('fanfare'), 200);
    } else if (guptoCount >= civilianCount) {
        state.winnerGroup = 'GUPTOS';
        state.phase = 'WINNER';
        addLog(`[winner] guptos win! guptos equal or outnumber civilians.`, 'win');
        setTimeout(() => playSynth('womp'), 200);
    } else {
        launchDiscussion();
    }
    render();
}

function resetGame() {
    playSynth('pop');
    state.phase = 'HOME';
    state.log = [];
    state.players = [];
    state.cards = [];
    state.currentPlayerIndex = 0;
    state.draftName = '';
    state.selectedCardId = null;
    state.pendingExilePlayerId = null;
    
    // Clear input
    const input = document.getElementById('draft-name-input');
    if (input) input.value = '';
    
    render();
}

function render() {
    // Sync document theme
    document.documentElement.setAttribute('data-theme', 'matcha');

    container.innerHTML = '';
    
    const getPlayerAvatarHTML = (p) => {
        const initials = getInitials(p.name);
        const colorClass = AVATAR_COLORS[p.avatarColorIdx % AVATAR_COLORS.length];
        return `<div class="w-11 h-11 ${colorClass} border-2 border-[var(--border)] flex items-center justify-center text-base font-bold font-mono tracking-tighter shrink-0">${initials}</div>`;
    };

    let phaseTitle = '';
    let phaseContent = '';

    if (state.phase === 'HOME') {
        const gameHeader = document.getElementById('game-header');
        if (gameHeader) {
            gameHeader.classList.add('hidden');
        }
        
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center min-h-[60vh] w-full text-center gap-6 py-8 select-none max-w-sm mx-auto">
                <h1 class="text-8xl font-black text-[var(--primary)] tracking-wider lowercase leading-none">gupto</h1>
                <p class="text-xs text-[var(--text-muted)] font-bold tracking-widest lowercase">the retro secret agent larp game</p>
                
                <div class="flex flex-col gap-3 w-full mt-6">
                    <button onclick="openSetupModal()" class="w-full h-14 text-base font-bold squish-btn bg-[var(--primary)] text-[var(--text-on-primary)] flex items-center justify-center gap-2">
                        <i data-lucide="play" class="w-5 h-5"></i>
                        <span>start game</span>
                    </button>
                    
                    <div class="flex gap-3 w-full">
                        <button onclick="openModal('rules-modal')" class="flex-1 h-14 text-base font-bold squish-btn bg-[var(--bg-window)] text-[var(--text-main)] flex items-center justify-center gap-2">
                            <i data-lucide="book-open" class="w-4 h-4"></i>
                            <span>rules</span>
                        </button>
                        <button onclick="openModal('settings-modal')" class="flex-1 h-14 text-base font-bold squish-btn bg-[var(--bg-window)] text-[var(--text-main)] flex items-center justify-center gap-2">
                            <i data-lucide="settings" class="w-4 h-4"></i>
                            <span>settings</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        if (window.lucide) {
            window.lucide.createIcons();
        }
        return;
    } else if (state.phase === 'DRAFT_CARDS') {
        phaseTitle = 'drafting_room.sys';
        
        const cardsGrid = state.cards.map((card, i) => {
            if (card.draftedBy !== null) {
                return `
                    <div class="card-drafted border-2 border-[var(--border)] p-4 flex flex-col justify-center items-center h-28 relative select-none">
                        <span class="text-[length:var(--font-size-caption)] font-bold uppercase tracking-wider text-[var(--text-disabled)] mb-1">taken</span>
                        <span class="text-sm font-black font-mono capitalize text-center truncate max-w-full leading-tight" title="${card.draftedBy}">${card.draftedBy}</span>
                    </div>
                `;
            } else {
                return `
                    <div onclick="clickDraftCard(${i})" class="card-face-down border-2 border-[var(--border)] p-4 flex flex-col justify-center items-center h-28 relative shadow-[4px_4px_0px_var(--border)]">
                        <i data-lucide="help-circle" class="w-8 h-8 text-[var(--text-muted)]"></i>
                        <span class="text-[length:var(--font-size-micro)] font-bold uppercase tracking-widest mt-2 text-[var(--text-muted)]">card ${i+1}</span>
                    </div>
                `;
            }
        }).join('');
        
        const nextPlayerNum = state.currentPlayerIndex + 1;
        const currentActiveName = state.draftName || `player ${nextPlayerNum}`;
        
        phaseContent = `
            <div class="flex flex-col flex-grow justify-between">
                <div class="text-center pt-2 select-none">
                    <span class="text-[length:var(--font-size-caption)] font-bold bg-[var(--bg-window)] text-[var(--primary)] border-2 border-[var(--border)] px-3 py-1 shadow-[1.5px_1.5px_0px_0px_var(--border)] uppercase">draft phase</span>
                    <h2 class="text-xl font-bold text-[var(--primary)] mt-3.5 leading-[1.2]">claim your fate</h2>
                    <p class="text-[length:var(--font-size-caption)] text-[var(--text-muted)] mt-1.5 font-normal">
                        active: <span class="font-bold underline text-[var(--text-main)]">${currentActiveName}</span>
                        ${!state.draftName ? `(name entry pending)` : `(select one face-down card below)`}
                    </p>
                </div>

                <div class="my-6 flex-grow flex items-center justify-center">
                    <div class="grid grid-cols-2 xs:grid-cols-3 gap-3 w-full max-h-[46vh] overflow-y-auto p-1 scrollable-container">
                        ${cardsGrid}
                    </div>
                </div>

                <div class="space-y-3 select-none">
                    <div class="flex justify-between items-center text-[length:var(--font-size-caption)] text-[var(--text-muted)] font-bold uppercase px-1">
                        <span>draft status</span>
                        <span>${state.currentPlayerIndex} / ${state.playerCount} drafted</span>
                    </div>
                    <div class="h-3 bg-[var(--border)] p-0.5 border-2 border-[var(--border)]">
                        <div class="h-full bg-[var(--accent)] transition-all duration-300" style="width: ${(state.currentPlayerIndex / state.playerCount) * 100}%"></div>
                    </div>
                </div>
            </div>
        `;
    } else if (state.phase === 'DISCUSSION') {
        phaseTitle = 'discussion_board.sys';
        const alive = state.players.filter(p => !p.eliminated);
        const cardsHtml = alive.map(p => `
            <div class="game-card p-3 flex items-center justify-between border-2 border-[var(--border)] shadow-[2.5px_2.5px_0px_0px_var(--border)] bg-[var(--bg-window)]">
                <div class="flex items-center gap-2.5">
                    ${getPlayerAvatarHTML(p)}
                    <span class="font-bold text-sm text-[var(--text-main)]">${p.name}</span>
                </div>
                <span class="text-[length:var(--font-size-caption)] uppercase font-bold text-[var(--color-success)] bg-[var(--bg-main)] border-2 border-[var(--border)] px-2 py-0.5">[speaking]</span>
            </div>
        `).join('');

        phaseContent = `
            <div class="flex flex-col flex-grow justify-between">
                <div class="text-center pt-2 select-none">
                    <span class="text-[length:var(--font-size-caption)] font-bold bg-[var(--secondary)] text-[var(--text-on-secondary)] border-2 border-[var(--border)] px-4 py-0.5 shadow-[1.5px_1.5px_0px_0px_var(--border)] uppercase">stage 1: describe words!</span>
                    <h2 class="text-xl font-bold text-[var(--text-main)] mt-3.5 leading-[1.2]">discussion_board.sys</h2>
                    <p class="text-sm text-[var(--text-muted)] mt-1.5 font-normal">go around and give exactly one word or clue to describe your secret card!</p>
                </div>

                <div class="game-card p-4 my-4 border-2 border-[var(--border)] bg-[var(--accent)] shadow-[3px_3px_0px_0px_var(--border)] text-center text-[var(--text-on-accent)] select-none">
                    <span class="text-[length:var(--font-size-caption)] text-[var(--text-on-accent)]/85 font-bold uppercase tracking-widest block mb-1">speaker starting point:</span>
                    <div class="flex items-center justify-center gap-3">
                        ${getPlayerAvatarHTML(state.discussionLeader)}
                        <span class="text-xl font-bold leading-[1.2]">${state.discussionLeader.name}</span>
                    </div>
                    <span class="text-[length:var(--font-size-caption)] text-[var(--text-on-accent)]/85 font-bold block mt-1">clockwise around the room!</span>
                </div>

                <div class="flex-grow overflow-y-auto max-h-[22vh] md:max-h-[160px] space-y-2 pr-1 mb-4 scrollable-container">
                    <div class="text-[length:var(--font-size-caption)] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5 select-none">active discussion circle</div>
                    ${cardsHtml}
                </div>

                <div>
                    <button onclick="toAccusationBoard()" class="w-full h-11 text-base font-bold squish-btn bg-[var(--primary)] text-[var(--text-on-primary)] flex items-center justify-center gap-1.5 select-none">
                        <i data-lucide="check-square" class="w-4 h-4"></i>
                        <span>cast accuse votes</span>
                    </button>
                </div>
            </div>
        `;
    } else if (state.phase === 'ACCUSE') {
        phaseTitle = 'voting_terminal.sys';
        const alive = state.players.filter(p => !p.eliminated);
        const candidatesHtml = alive.map(p => `
            <div class="game-card p-3 border-2 border-[var(--border)] shadow-[2.5px_2.5px_0px_0px_var(--border)] flex items-center justify-between gap-2 bg-[var(--bg-window)] select-none">
                <div class="flex items-center gap-2">
                    <button onclick="addsusTally(${p.id})" class="w-11 h-11 bg-[var(--bg-window)] hover:bg-[var(--accent)] border-2 border-[var(--border)] flex items-center justify-center shadow-[1px_1px_0px_var(--border)] active:translate-y-0.5 active:shadow-none text-[var(--text-main)] shrink-0" title="point accusation">
                        <i data-lucide="crosshair" class="w-5 h-5"></i>
                    </button>
                    <div class="ml-2 flex items-center gap-2">
                        ${getPlayerAvatarHTML(p)}
                        <div>
                            <span class="font-bold text-sm text-[var(--text-main)] block">${p.name}</span>
                            <span class="text-[length:var(--font-size-caption)] text-[var(--primary)] font-bold block lowercase">pointed fingers: ${p.votesPlaced || 0}</span>
                        </div>
                    </div>
                </div>

                <button onclick="openExileConfirm(${p.id})" class="h-11 px-3 text-sm font-bold squish-btn bg-[var(--color-danger)] text-[var(--text-on-danger)] flex items-center justify-center">
                    exile!
                </button>
            </div>
        `).join('');

        phaseContent = `
            <div class="flex flex-col flex-grow justify-between">
                <div class="text-center pt-2">
                    <span class="text-[12px] font-bold bg-[var(--primary)] text-[var(--text-on-primary)] border-2 border-[var(--border)] px-4 py-0.5 shadow-[1.5px_1.5px_0px_0px_var(--border)] uppercase">stage 2: vote out!</span>
                    <h2 class="text-[20px] font-bold text-[var(--text-main)] mt-3.5 leading-[1.2]">voting_terminal.sys</h2>
                    <p class="text-[14px] text-[var(--text-muted)] mt-1.5 px-3 leading-[1.5]">point physically with your fingers! record accusations using crosshair button, then hit "exile!" on the suspect.</p>
                </div>

                <div class="flex-grow overflow-y-auto max-h-[38vh] md:max-h-[260px] space-y-3 my-4 pr-1 scrollable-container">
                    ${candidatesHtml}
                </div>

                <div class="flex gap-4">
                    <button onclick="clearAccusations()" class="flex-1 h-8 text-[15px] font-bold squish-btn bg-[var(--bg-window)] text-[var(--text-main)] flex items-center justify-center">
                        [reset]
                    </button>
                    <button onclick="launchDiscussion()" class="flex-1 h-8 text-[15px] font-bold squish-btn bg-[var(--secondary)] text-[var(--text-on-secondary)] flex items-center justify-center">
                        [back]
                    </button>
                </div>
            </div>
        `;
    } else if (state.phase === 'FINGER_STAMP') {
        phaseTitle = 'exile_results.sys';
        const ep = state.votedOutPlayer;
        const isGupto = ep.role === 'Gupto';
        const isDudhbhat = ep.role === 'Dudhbhat';

        let actionArea = '';
        if (isDudhbhat && !state.dudhbhatGuessSubmitted) {
            actionArea = `
                <div class="game-card p-4 border-2 border-[var(--border)] shadow-[2.5px_2.5px_0px_0px_var(--border)] bg-[var(--bg-window)] text-center flex flex-col gap-3 mt-4 select-none">
                    <span class="text-[12px] text-[var(--primary)] font-bold uppercase flex items-center justify-center gap-1.5"><i data-lucide="ghost" class="w-4 h-4"></i> dudhbhat guess circle</span>
                    <p class="text-[12px] text-[var(--text-muted)] font-normal leading-[1.4] normal-case">you were the dudhbhat! type your guess for the civilian word. a correct guess wins you a secondary victory.</p>
                    <input type="text" id="dudhbhat-guess-input" class="w-full bg-[var(--bg-window)] border-2 border-[var(--border)] px-3 py-1.5 text-[13px] text-[var(--text-main)] font-bold outline-none text-center font-mono lowercase" placeholder="type word here...">
                    <button onclick="submitDudhbhatGuess(document.getElementById('dudhbhat-guess-input').value)" class="w-full h-8 text-[13px] font-bold squish-btn bg-[var(--primary)] text-[var(--text-on-primary)] flex items-center justify-center cursor-pointer">submit guess</button>
                </div>
            `;
        } else if (isDudhbhat && state.dudhbhatGuessSubmitted) {
            actionArea = `
                <div class="game-card p-4 border-2 border-[var(--border)] shadow-[2.5px_2.5px_0px_0px_var(--border)] bg-[var(--bg-window)] text-center flex flex-col gap-2 mt-4 select-none">
                    <span class="text-[12px] ${state.dudhbhatGuessedCorrectly ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'} font-bold uppercase flex items-center justify-center gap-1.5">
                        ${state.dudhbhatGuessedCorrectly ? '<i data-lucide="check-circle" class="w-4 h-4"></i> guess correct!' : '<i data-lucide="x-circle" class="w-4 h-4"></i> guess incorrect'}
                    </span>
                    <p class="text-[13px] font-normal leading-[1.4] normal-case">
                        your guess: <strong class="underline font-bold">${state.dudhbhatGuessWord}</strong><br>
                        civilian word was: <strong class="underline font-bold">${state.civilianWord}</strong>
                    </p>
                    <button onclick="triggerHQCheck()" class="w-full h-8 text-[14px] font-bold squish-btn bg-[var(--color-success)] text-[var(--text-on-success)] flex items-center justify-center gap-1.5 mt-2 cursor-pointer">
                        <i data-lucide="arrow-right-circle" class="w-4 h-4"></i>
                        <span>check win / play on</span>
                    </button>
                </div>
            `;
        } else {
            actionArea = `
                <div class="mt-4">
                    <button onclick="triggerHQCheck()" class="w-full h-8 text-[15px] font-bold squish-btn bg-[var(--color-success)] text-[var(--text-on-success)] flex items-center justify-center gap-1.5 cursor-pointer">
                        <i data-lucide="arrow-right-circle" class="w-4 h-4"></i>
                        <span>check win / play on</span>
                    </button>
                </div>
            `;
        }

        phaseContent = `
            <div class="flex flex-col flex-grow justify-between">
                <div class="text-center pt-2">
                    <h2 class="text-[20px] font-bold text-[var(--text-main)] leading-[1.2]">exile_results.sys</h2>
                    <p class="text-[14px] text-[var(--text-muted)] mt-1.5">${ep.name} has been kicked out of the circle!</p>
                </div>

                <div class="my-auto py-4 text-center flex flex-col justify-center items-center">
                    <div class="mb-3">
                        <i data-lucide="skull" class="w-10 h-10 text-[var(--primary)]"></i>
                    </div>
                    
                    <div class="game-card p-4 border-2 border-[var(--border)] shadow-[4px_4px_0px_0px_var(--border)] ${isGupto ? 'bg-[var(--primary)] text-[var(--text-on-primary)]' : isDudhbhat ? 'bg-[var(--accent)] text-[var(--text-on-accent)]' : 'bg-[var(--secondary)] text-[var(--text-on-secondary)]' }">
                        <span class="text-[12px] opacity-75 font-bold uppercase tracking-wider block">their identity role was:</span>
                        <h3 class="text-[20px] font-bold uppercase my-1.5 leading-[1.2]">${ep.role.toLowerCase()}</h3>
                        <p class="text-[14px] font-normal">${isDudhbhat ? 'they had no secret word!' : `their word was: <span class="underline select-all mt-0.5 font-mono">${ep.word}</span>`}</p>
                    </div>
                </div>

                ${actionArea}
            </div>
        `;
    } else if (state.phase === 'WINNER') {
        phaseTitle = 'winner_score.sys';
        const isCivs = state.winnerGroup === 'CIVILIANS';
        const listPlayersHtml = state.players.map(p => {
            const deadBadge = p.eliminated ? '[exiled]' : '[survived]';
            const roleColor = p.role === 'Gupto' ? 'text-[var(--primary)]' : (p.role === 'Dudhbhat' ? 'text-[var(--primary-hover)]' : 'text-[var(--secondary)]');
            return `
                <div class="game-card p-3 border-2 border-[var(--border)] shadow-[2px_2px_0px_0px_var(--border)] flex justify-between items-center bg-[var(--bg-window)]">
                    <div class="flex items-center gap-2.5">
                        ${getPlayerAvatarHTML(p)}
                        <div>
                            <span class="font-bold text-[14px] text-[var(--text-main)] block">${p.name}</span>
                            <span class="text-[12px] ${roleColor} font-bold block uppercase tracking-wide leading-none mt-0.5">${p.role.toLowerCase()}</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-[14px] font-bold text-[var(--text-main)] font-mono leading-none">${p.role === 'Dudhbhat' ? '[no word]' : p.word}</p>
                        <span class="text-[12px] font-bold tracking-wider block mt-1.5 uppercase opacity-75">${deadBadge}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Generate Dudhbhat result card if exists
        const dhPlayer = state.players.find(p => p.role === 'Dudhbhat');
        let dudhbhatResultHTML = '';
        if (dhPlayer) {
            let outcomeText = '';
            let outcomeColor = '';
            if (!dhPlayer.eliminated) {
                outcomeText = 'survived the circle! (victory!)';
                outcomeColor = 'text-[var(--color-success)]';
            } else if (state.dudhbhatGuessedCorrectly) {
                outcomeText = 'exiled but guessed the civilian word correctly! (victory!)';
                outcomeColor = 'text-[var(--color-success)]';
            } else {
                outcomeText = 'exiled and failed to guess word. (defeat)';
                outcomeColor = 'text-[var(--color-danger)]';
            }
            dudhbhatResultHTML = `
                <div class="game-card p-3.5 border-2 border-[var(--border)] bg-[var(--bg-window)] shadow-[2.5px_2.5px_0px_0px_var(--border)] text-center my-3 select-none">
                    <span class="text-[11px] font-bold uppercase tracking-wider block text-[var(--text-main)]/60"><i data-lucide="ghost" class="w-3.5 h-3.5 inline-block mr-1 align-text-bottom"></i> dudhbhat outcome</span>
                    <span class="text-[14px] font-bold block text-[var(--text-main)]">${dhPlayer.name}</span>
                    <span class="text-[12px] font-bold block ${outcomeColor} mt-1 leading-tight normal-case">${outcomeText}</span>
                </div>
            `;
        }

        phaseContent = `
            <div class="flex flex-col flex-grow justify-between">
                <div class="text-center pt-2">
                    <span class="text-[12px] font-bold bg-[var(--accent)] text-[var(--text-on-accent)] border-2 border-[var(--border)] px-5 py-1 shadow-[2px_2px_0px_0px_var(--border)] uppercase">game over!</span>
                    <h2 class="text-[20px] font-bold text-[var(--text-main)] mt-3.5 leading-[1.2] uppercase">
                        ${isCivs ? 'civilians win!' : 'guptos win!'}
                    </h2>
                    <p class="text-[14px] text-[var(--text-muted)] mt-1.5 leading-[1.5]">
                        ${isCivs ? 'the civilian regulars detected and exiled the guptos!' : 'guptos blended in perfectly and claimed the base!'}
                    </p>
                </div>

                <div class="flex justify-center my-2">
                    <i data-lucide="trophy" class="w-10 h-10 text-[var(--accent)]"></i>
                </div>

                ${dudhbhatResultHTML}

                <div class="flex-grow overflow-y-auto max-h-[25vh] md:max-h-[180px] space-y-2.5 my-3 pr-1 scrollable-container">
                    <div class="text-[12px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">final dossier review</div>
                    ${listPlayersHtml}
                </div>

                <div>
                    <button onclick="resetGame()" class="w-full h-8 text-[15px] font-bold squish-btn bg-[var(--accent)] text-[var(--text-on-accent)] flex items-center justify-center gap-1.5">
                        <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                        <span>play new round!</span>
                    </button>
                </div>
            </div>
        `;
    }

    // Sync game-header visibility and state
    const gameHeader = document.getElementById('game-header');
    if (gameHeader) {
        if (state.phase === 'HOME') {
            gameHeader.classList.add('hidden');
        } else {
            gameHeader.classList.remove('hidden');
            const badge = document.getElementById('header-phase-badge');
            if (badge) {
                badge.textContent = state.phase.toLowerCase().replace('_', ' ');
            }
        }
    }

    const windowMarkup = `
        <div class="w-full bg-[var(--bg-window)] border-2 border-[var(--border)] shadow-[4px_4px_0px_0px_var(--border)] flex flex-col h-full flex-grow">
            <!-- Window Header -->
            <div class="flex justify-between items-center p-2 border-b-2 border-[var(--border)] bg-[var(--bg-header)] text-[var(--text-on-header)] shrink-0">
                <div class="flex items-center gap-2 flex-1">
                    <div class="flex flex-col gap-[3px] w-5 shrink-0">
                        <div class="h-[2px] w-full bg-[var(--text-on-header)] opacity-60"></div>
                        <div class="h-[2px] w-full bg-[var(--text-on-header)] opacity-60"></div>
                        <div class="h-[2px] w-full bg-[var(--text-on-header)] opacity-60"></div>
                    </div>
                    <span class="text-[15px] font-bold lowercase leading-[1.0] font-mono">${phaseTitle}</span>
                    <div class="flex-1 h-px bg-[var(--text-on-header)] opacity-20 ml-2"></div>
                </div>
                ${state.phase !== 'HOME' ? `
                    <button onclick="openEndGameConfirm()" class="w-5 h-5 border-2 border-[var(--border)] bg-[var(--bg-window)] flex items-center justify-center font-bold text-[10px] active:translate-y-0.5 shadow-[1px_1px_0px_var(--border)] text-[var(--text-main)] shrink-0">✕</button>
                ` : ''}
            </div>
            
            <!-- Window Body -->
            <div class="p-5 flex-grow flex flex-col justify-between overflow-y-auto bg-[var(--bg-window)]">
                ${phaseContent}
            </div>
        </div>
    `;

    container.innerHTML = windowMarkup;
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => {
        render();
        if (window.lucide) window.lucide.createIcons();
    });
} else {
    render();
    if (window.lucide) window.lucide.createIcons();
}
