// ============================================================
//  GAME.JS - Core Game Logic
// ============================================================

// ----- STATE -----
let selectedChoice = null;
let isFlipping = false;

// ============================================================
//  BET FUNCTIONS
// ============================================================

function halfBet() {
    if (!currentUserData || progressiveActive) return;
    
    let currentBet = parseFloat(DOM.betInput.value);
    if (isNaN(currentBet)) currentBet = 100;
    
    let newBet = currentBet / 2;
    if (newBet < 0.01) newBet = 0.01;
    
    DOM.betInput.value = newBet.toFixed(2);
    showNotification(`Bet halved to ${newBet.toFixed(2)}`);
}

function doubleBet() {
    if (!currentUserData || progressiveActive) return;
    
    let currentBet = parseFloat(DOM.betInput.value);
    if (isNaN(currentBet)) currentBet = 100;
    
    let newBet = currentBet * 2;
    if (newBet > currentUserData.balance) newBet = currentUserData.balance;
    
    DOM.betInput.value = newBet.toFixed(2);
    showNotification(`Bet doubled to ${newBet.toFixed(2)}`);
}

function maxBet() {
    if (!currentUserData || progressiveActive) return;
    
    DOM.betInput.value = currentUserData.balance.toFixed(2);
    showNotification(`Max bet: ${currentUserData.balance.toFixed(2)}`);
}

// ============================================================
//  MAIN FLIP FUNCTION
// ============================================================

async function flipCoin() {
    // --- Pre-flight checks ---
    if (isFlipping) {
        showNotification('⏳ Please wait for the current flip to finish');
        return;
    }
    
    if (!authToken) {
        showNotification('Please login first!');
        return;
    }
    
    if (!selectedChoice) {
        showNotification('Select HEADS or TAILS first!');
        return;
    }
    
    // --- Determine bet amount ---
    let bet;
    let isProgressiveFlip = false;
    
    if (progressiveActive && progressiveLevel > 0) {
        bet = progressiveBet;
        isProgressiveFlip = true;
    } else if (progressiveActive && progressiveLevel === 0) {
        bet = progressiveBet;
        isProgressiveFlip = true;
    } else {
        bet = parseFloat(DOM.betInput.value);
        if (isNaN(bet) || bet <= 0) {
            showNotification('Enter valid bet amount!');
            return;
        }
        if (bet > currentUserData.balance) {
            showNotification('Insufficient balance!');
            return;
        }
    }
    
    // --- Start flip ---
    isFlipping = true;
    DOM.flipBtn.disabled = true;
    DOM.coin.classList.add('flipping');
    DOM.result.innerHTML = '🔄 Flipping...';
    DOM.result.className = 'result';
    
    try {
        // --- Call server ---
        const response = await apiFlip(
            bet,
            selectedChoice,
            progressiveActive ? progressiveLevel : 0,
            progressiveActive ? progressiveBet : bet
        );
        
        log('📊 Server response:', response);
        
        // --- Process server response ---
        const serverWin = response.isWin;
        const serverWinnings = response.winnings || 0;
        const serverNewBalance = response.newBalance;
        const serverStats = response.stats || {};
        
        // --- Update local data from server ---
        currentUserData.balance = serverNewBalance;
        currentUserData.wins = serverStats.wins || currentUserData.wins;
        currentUserData.losses = serverStats.losses || currentUserData.losses;
        currentUserData.currentStreak = serverStats.currentStreak || currentUserData.currentStreak;
        currentUserData.bestStreak = serverStats.bestStreak || currentUserData.bestStreak;
        currentUserData.totalWagered = serverStats.totalWagered || currentUserData.totalWagered;
        
        updateUI();
        
        // --- Show result with delay (for animation) ---
        setTimeout(() => {
            DOM.coin.classList.remove('flipping');
            DOM.coin.textContent = '🪙';
            DOM.coin.style.filter = serverWin ? 'none' : 'grayscale(0.5)';
            
            if (serverWin) {
                handleWinResponse(response, isProgressiveFlip, bet);
            } else {
                handleLossResponse(response, isProgressiveFlip, bet);
            }
            
            // --- Reset flip state ---
            isFlipping = false;
            DOM.flipBtn.disabled = false;
            
            if (!progressiveActive) {
                DOM.betInput.disabled = false;
            }
            
            DOM.coin.style.filter = 'none';
            
        }, 600);
        
    } catch (error) {
        logError('Flip API error:', error);
        showNotification('❌ Error processing flip: ' + error.message);
        
        isFlipping = false;
        DOM.flipBtn.disabled = false;
        if (!progressiveActive) DOM.betInput.disabled = false;
        DOM.coin.classList.remove('flipping');
        DOM.coin.style.filter = 'none';
        DOM.result.innerHTML = '⚠️ Error! Please try again.';
        DOM.result.className = 'result';
    }
}

// ============================================================
//  WIN / LOSS HANDLERS
// ============================================================

function handleWinResponse(response, isProgressiveFlip, bet) {
    const serverWinnings = response.winnings || 0;
    
    if (isProgressiveFlip || progressiveActive) {
        handleProgressiveWin(response);
    } else {
        // Normal win
        DOM.result.innerHTML = `🎉 WIN! Won $${serverWinnings.toFixed(2)}! 🎉`;
        DOM.result.className = 'result win';
        showWinCelebration(serverWinnings);
        showNotification(`🎉 Won $${serverWinnings.toFixed(2)}!`);
    }
}

function handleLossResponse(response, isProgressiveFlip, bet) {
    if (isProgressiveFlip || progressiveActive) {
        handleProgressiveLoss(bet);
    } else {
        // Normal loss
        DOM.result.innerHTML = `💀 LOSS! Lost $${bet.toFixed(2)} 💀`;
        DOM.result.className = 'result lose';
        showLossCelebration(bet);
    }
}

// ============================================================
//  PROGRESSIVE WIN / LOSS HANDLERS
// ============================================================

function handleProgressiveWin(response) {
    progressiveLevel++;
    
    const multiplier = progressiveLevel <= PROGRESSIVE_MULTIPLIERS.length 
        ? PROGRESSIVE_MULTIPLIERS[progressiveLevel - 1] 
        : PROGRESSIVE_MULTIPLIERS[PROGRESSIVE_MULTIPLIERS.length - 1];
    const pot = progressiveBet * multiplier;
    progressivePot = pot;
    
    DOM.result.innerHTML = `🎉 LEVEL ${progressiveLevel} REACHED! 🎉<br>💰 Current Pot: $${pot.toFixed(2)} (${multiplier}x)`;
    DOM.result.className = 'result progressive-win';
    showNotification(`🔥 Level ${progressiveLevel}! Pot: $${pot.toFixed(2)}`, 2000);
    
    // Check if max level reached
    if (progressiveLevel >= PROGRESSIVE_MULTIPLIERS.length) {
        handleMaxLevelReached();
        return;
    }
    
    // Show level up overlay
    const nextMultiplier = progressiveLevel < PROGRESSIVE_MULTIPLIERS.length 
        ? PROGRESSIVE_MULTIPLIERS[progressiveLevel] 
        : PROGRESSIVE_MULTIPLIERS[PROGRESSIVE_MULTIPLIERS.length - 1];
    
    showLevelUpOverlay(progressiveLevel, pot, nextMultiplier);
    renderCheckpoints();
    DOM.lockedBetDisplay.textContent = progressiveBet.toFixed(2);
}

function handleProgressiveLoss(bet) {
    const lostAmount = progressiveBet * (progressiveLevel > 0 ? PROGRESSIVE_MULTIPLIERS[progressiveLevel - 1] : 1);
    const levelReached = progressiveLevel;
    
    DOM.result.innerHTML = `💀 BUSTED! Lost $${lostAmount.toFixed(2)} at Level ${levelReached}! 💀`;
    DOM.result.className = 'result lose';
    showLossCelebration(lostAmount);
    
    const savedBet = progressiveBet;
    showBigLossOverlay(levelReached, lostAmount);
    
    resetProgressiveRun();
    DOM.betInput.value = savedBet.toFixed(2);
    DOM.betInput.disabled = false;
    progressiveBet = savedBet;
}

function handleMaxLevelReached() {
    const finalPot = progressiveBet * PROGRESSIVE_MULTIPLIERS[PROGRESSIVE_MULTIPLIERS.length - 1];
    
    // Balance already updated from server
    updateUI();
    showNotification(`🏆 MAX LEVEL REACHED! Won $${finalPot.toFixed(2)}! 🏆`, 5000);
    showWinCelebration(finalPot);
    
    const savedBet = progressiveBet;
    resetProgressiveRun();
    DOM.betInput.value = savedBet.toFixed(2);
    DOM.betInput.disabled = false;
    
    DOM.result.innerHTML = `🏆 MAX LEVEL! Won $${finalPot.toFixed(2)}! 🏆`;
    DOM.result.className = 'result win';
    
    renderCheckpoints();
}

// ============================================================
//  GAME EVENT LISTENERS
// ============================================================

function setupGameListeners() {
    // Choice buttons
    DOM.headsBtn.onclick = function() {
        selectedChoice = 'heads';
        updateSelectedButton();
        showNotification('Selected: HEADS');
    };
    
    DOM.tailsBtn.onclick = function() {
        selectedChoice = 'tails';
        updateSelectedButton();
        showNotification('Selected: TAILS');
    };
    
    // Action buttons
    DOM.halfBtn.onclick = halfBet;
    DOM.doubleBtn.onclick = doubleBet;
    DOM.maxBtn.onclick = maxBet;
    
    // Flip button
    DOM.flipBtn.onclick = flipCoin;
    
    // Enter key on bet input
    DOM.betInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !progressiveActive) {
            flipCoin();
        }
    });
    
    log('✅ Game listeners setup complete');
}

// ============================================================
//  RESPONSIVE / MOBILE DETECTION
// ============================================================

function detectAndApplyMobileMode() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Windows Phone/i.test(navigator.userAgent) || window.innerWidth <= 768;
    
    if (isMobile) {
        document.body.classList.add('mobile-mode');
    } else {
        document.body.classList.remove('mobile-mode');
    }
}

// ============================================================
//  INITIALIZATION
// ============================================================

function initGame() {
    detectAndApplyMobileMode();
    window.addEventListener('resize', detectAndApplyMobileMode);
    
    // Set initial state
    setGameEnabled(false);
    renderCheckpoints();
    
    log('✅ Game initialized');
}

// ----- EXPOSE GLOBALLY -----
window.selectedChoice = selectedChoice;
window.isFlipping = isFlipping;
window.halfBet = halfBet;
window.doubleBet = doubleBet;
window.maxBet = maxBet;
window.flipCoin = flipCoin;
window.handleWinResponse = handleWinResponse;
window.handleLossResponse = handleLossResponse;
window.handleProgressiveWin = handleProgressiveWin;
window.handleProgressiveLoss = handleProgressiveLoss;
window.handleMaxLevelReached = handleMaxLevelReached;
window.setupGameListeners = setupGameListeners;
window.detectAndApplyMobileMode = detectAndApplyMobileMode;
window.initGame = initGame;
