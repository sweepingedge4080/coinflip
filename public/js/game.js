// ============================================================
//  GAME.JS - Core Game Logic (Fully Secured)
// ============================================================

// ----- STATE -----
let selectedChoice = null;
let isFlipping = false;

// ============================================================
//  BET VALIDATION HELPERS
// ============================================================

function validateBetAmount(amount) {
    if (!amount && amount !== 0) {
        return { valid: false, message: 'Please enter a valid number' };
    }
    if (isNaN(amount)) {
        return { valid: false, message: 'Please enter a valid number' };
    }
    if (amount <= 0) {
        return { valid: false, message: 'Bet amount must be greater than 0' };
    }
    if (amount > 10000) {
        return { valid: false, message: 'Bet amount cannot exceed $10,000' };
    }
    if (!Number.isFinite(amount)) {
        return { valid: false, message: 'Invalid bet amount' };
    }
    return { valid: true };
}

function sanitizeBetAmount(amount) {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || !isFinite(parsed)) return 0;
    // Round to 2 decimal places max
    return Math.round(parsed * 100) / 100;
}

function sanitizeChoice(choice) {
    if (choice === 'heads' || choice === 'tails') return choice;
    return 'heads'; // Default fallback
}

// ============================================================
//  BET FUNCTIONS
// ============================================================

function halfBet() {
    if (!currentUserData || progressiveActive) return;
    
    let currentBet = parseFloat(DOM.betInput.value);
    if (isNaN(currentBet) || currentBet <= 0) currentBet = 100;
    
    let newBet = currentBet / 2;
    if (newBet < 0.01) newBet = 0.01;
    
    // Round to 2 decimal places
    newBet = Math.round(newBet * 100) / 100;
    
    DOM.betInput.value = newBet.toFixed(2);
    showNotification(`Bet halved to ${newBet.toFixed(2)}`);
}

function doubleBet() {
    if (!currentUserData || progressiveActive) return;
    
    let currentBet = parseFloat(DOM.betInput.value);
    if (isNaN(currentBet) || currentBet <= 0) currentBet = 100;
    
    let newBet = currentBet * 2;
    if (newBet > currentUserData.balance) newBet = currentUserData.balance;
    
    // Round to 2 decimal places
    newBet = Math.round(newBet * 100) / 100;
    
    DOM.betInput.value = newBet.toFixed(2);
    showNotification(`Bet doubled to ${newBet.toFixed(2)}`);
}

function maxBet() {
    if (!currentUserData || progressiveActive) return;
    
    const maxAmount = Math.min(currentUserData.balance, 10000);
    // Round down to 2 decimal places
    const roundedMax = Math.floor(maxAmount * 100) / 100;
    DOM.betInput.value = roundedMax.toFixed(2);
    showNotification(`Max bet: ${roundedMax.toFixed(2)}`);
}

// ============================================================
//  BET INPUT VALIDATION (Real-time)
// ============================================================

function setupBetInputValidation() {
    if (!DOM.betInput) return;
    
    DOM.betInput.addEventListener('input', function() {
        const rawValue = this.value;
        const sanitized = sanitizeBetAmount(rawValue);
        
        // If input is empty or invalid, don't update
        if (isNaN(sanitized) || sanitized <= 0) return;
        
        // Check against balance
        if (currentUserData && sanitized > currentUserData.balance) {
            this.style.borderColor = '#ef4444';
        } else {
            this.style.borderColor = '';
        }
    });
    
    DOM.betInput.addEventListener('blur', function() {
        const rawValue = this.value;
        if (!rawValue) {
            this.value = '1.00';
            return;
        }
        
        const sanitized = sanitizeBetAmount(rawValue);
        if (sanitized <= 0) {
            this.value = '1.00';
        } else {
            this.value = sanitized.toFixed(2);
        }
        
        this.style.borderColor = '';
    });
    
    log('✅ Bet input validation setup complete');
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
        bet = sanitizeBetAmount(DOM.betInput.value);
        
        // ✅ Validate bet amount
        const betValidation = validateBetAmount(bet);
        if (!betValidation.valid) {
            showNotification(`❌ ${betValidation.message}`);
            return;
        }
        
        if (bet > currentUserData.balance) {
            showNotification('❌ Insufficient balance!');
            return;
        }
        
        // ✅ Ensure bet doesn't exceed max allowed
        const maxAllowed = Math.min(currentUserData.balance, 10000);
        if (bet > maxAllowed) {
            showNotification(`❌ Max bet is $${maxAllowed.toFixed(2)}`);
            return;
        }
    }
    
    // ✅ Sanitize choice
    const safeChoice = sanitizeChoice(selectedChoice);
    
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
            safeChoice,
            progressiveActive ? progressiveLevel : 0,
            progressiveActive ? progressiveBet : bet
        );
        
        log('📊 Server response:', response);
        
        // --- Validate server response ---
        if (!response || typeof response !== 'object') {
            throw new Error('Invalid response from server');
        }
        
        // --- Process server response ---
        const serverWin = response.isWin === true;
        const serverWinnings = parseFloat(response.winnings) || 0;
        const serverNewBalance = parseFloat(response.newBalance) || currentUserData.balance;
        const serverStats = response.stats || {};
        
        // --- Update local data from server ---
        currentUserData.balance = serverNewBalance;
        currentUserData.wins = parseInt(serverStats.wins) || currentUserData.wins;
        currentUserData.losses = parseInt(serverStats.losses) || currentUserData.losses;
        currentUserData.currentStreak = parseInt(serverStats.currentStreak) || currentUserData.currentStreak;
        currentUserData.bestStreak = parseInt(serverStats.bestStreak) || currentUserData.bestStreak;
        currentUserData.totalWagered = parseFloat(serverStats.totalWagered) || currentUserData.totalWagered;
        
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
    const serverWinnings = parseFloat(response.winnings) || 0;
    
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
    if (DOM.headsBtn) {
        DOM.headsBtn.onclick = function() {
            selectedChoice = 'heads';
            updateSelectedButton();
            showNotification('Selected: HEADS');
        };
    }
    
    if (DOM.tailsBtn) {
        DOM.tailsBtn.onclick = function() {
            selectedChoice = 'tails';
            updateSelectedButton();
            showNotification('Selected: TAILS');
        };
    }
    
    // Action buttons
    if (DOM.halfBtn) DOM.halfBtn.onclick = halfBet;
    if (DOM.doubleBtn) DOM.doubleBtn.onclick = doubleBet;
    if (DOM.maxBtn) DOM.maxBtn.onclick = maxBet;
    
    // Flip button
    if (DOM.flipBtn) DOM.flipBtn.onclick = flipCoin;
    
    // Bet input validation
    setupBetInputValidation();
    
    // Enter key on bet input
    if (DOM.betInput) {
        DOM.betInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !progressiveActive) {
                flipCoin();
            }
        });
    }
    
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
    
    // Setup bet input validation
    setupBetInputValidation();
    
    log('✅ Game initialized');
}

// ============================================================
//  EXPOSE GLOBALLY
// ============================================================

window.selectedChoice = selectedChoice;
window.isFlipping = isFlipping;
window.validateBetAmount = validateBetAmount;
window.sanitizeBetAmount = sanitizeBetAmount;
window.sanitizeChoice = sanitizeChoice;
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
window.setupBetInputValidation = setupBetInputValidation;
window.detectAndApplyMobileMode = detectAndApplyMobileMode;
window.initGame = initGame;
