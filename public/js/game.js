// ============================================================
//  HANDLE FLIP RESULT (Modified for Progressive)
// ============================================================

function handleFlipResult(data) {
    console.log('🎯 Handling flip result:', data);
    
    // Update balance
    if (data.newBalance !== undefined) {
        updateBalance(data.newBalance);
    }
    
    // Update stats
    if (data.stats) {
        updateStats(data.stats);
    }
    
    // Handle XP and level up
    if (data.xpGain) {
        updateXP(data.xpGain, data.level, data.xp, data.leveledUp);
    }
    
    // Show result animation
    showResult(data.isWin, data.result);
    
    // Handle progressive mode
    if (data.isWin) {
        // Check if progressive mode is actually active (using the pot state)
        if (window.isProgressiveActive && window.isProgressiveActive()) {
            handleProgressiveWin(data);
        } else {
            console.log('ℹ️ Progressive mode not active, skipping progressive handling');
        }
    } else {
        // Loss - handle progressive bust if active
        if (window.isProgressiveActive && window.isProgressiveActive()) {
            handleProgressiveLoss(data);
        }
    }
    
    // Update game history
    addToHistory(data.isWin, data.result, data.winnings || 0);
}

// ============================================================
//  HANDLE PROGRESSIVE WIN (Modified)
// ============================================================

function handleProgressiveWin(data) {
    // Double-check progressive mode is active
    if (!window.isProgressiveActive || !window.isProgressiveActive()) {
        console.warn('⚠️ Cannot handle progressive win: mode not active');
        return;
    }
    
    // Calculate the current level from the streak in the response
    const streak = data.stats ? data.stats.currentStreak : 0;
    const level = streak;
    
    console.log(`🏆 Progressive win at Level ${level}`);
    
    // Advance the progressive pot
    if (window.advanceProgressiveLevel) {
        const success = window.advanceProgressiveLevel(level);
        if (success) {
            // Update UI
            if (window.logMessage) {
                window.logMessage(`Level ${level} reached! Pot: $${getCurrentPotValue()}`);
            }
            
            // Check if max level reached
            const maxLevel = window.getMaxProgressiveLevel ? window.getMaxProgressiveLevel() : 8;
            if (level >= maxLevel) {
                // Auto-cashout at max level
                console.log('🏆 MAX LEVEL REACHED! Auto-cashing out...');
                if (window.handleProgressiveCashout) {
                    window.handleProgressiveCashout();
                }
            }
        }
    }
}

// ============================================================
//  HANDLE PROGRESSIVE LOSS (Modified)
// ============================================================

function handleProgressiveLoss(data) {
    // Double-check progressive mode is active
    if (!window.isProgressiveActive || !window.isProgressiveActive()) {
        console.warn('⚠️ Cannot handle progressive loss: mode not active');
        return;
    }
    
    console.log('💀 Progressive loss detected');
    
    // Bust the progressive pot
    if (window.bustProgressiveRun) {
        window.bustProgressiveRun();
    }
}

// ============================================================
//  HELPER FUNCTIONS
// ============================================================

function getCurrentPotValue() {
    const state = window.getProgressivePotState ? window.getProgressivePotState() : null;
    return state ? state.potValue : 0;
}

// ============================================================
//  MODIFIED PROGRESSIVE CASHOUT HANDLER
// ============================================================

// This should already be handled by progressive.js, but keep this as a backup
function handleProgressiveCashoutClick() {
    console.log('💰 Manual cashout requested');
    
    // Check if progressive mode is active
    if (!window.isProgressiveActive || !window.isProgressiveActive()) {
        console.warn('⚠️ No active progressive pot to cash out');
        alert('No active progressive run to cash out.');
        return;
    }
    
    // Delegate to the progressive controller
    if (window.handleProgressiveCashout) {
        window.handleProgressiveCashout();
    } else {
        console.error('❌ Progressive cashout handler not found');
    }
}

// ============================================================
//  UPDATE BET INPUT FOR PROGRESSIVE MODE
// ============================================================

// Modify your existing bet input handlers to respect progressive mode
function setupBetInputs() {
    const betInput = document.getElementById('betAmount');
    const halfBtn = document.getElementById('halfBet');
    const doubleBtn = document.getElementById('doubleBet');
    const maxBtn = document.getElementById('maxBet');
    
    if (betInput) {
        betInput.addEventListener('change', function() {
            // If progressive mode is active, update the bet amount
            if (window.progressiveActive) {
                if (window.updateProgressiveBetFromInput) {
                    window.updateProgressiveBetFromInput();
                }
            }
        });
    }
    
    // Half bet
    if (halfBtn) {
        halfBtn.addEventListener('click', function() {
            if (window.progressiveActive) {
                console.warn('⚠️ Cannot change bet while progressive mode is active');
                return;
            }
            const current = parseFloat(betInput.value) || 1;
            const half = Math.max(0.01, current / 2);
            betInput.value = half.toFixed(2);
            if (window.updateProgressiveBetFromInput) {
                window.updateProgressiveBetFromInput();
            }
        });
    }
    
    // Double bet
    if (doubleBtn) {
        doubleBtn.addEventListener('click', function() {
            if (window.progressiveActive) {
                console.warn('⚠️ Cannot change bet while progressive mode is active');
                return;
            }
            const current = parseFloat(betInput.value) || 1;
            const doubled = current * 2;
            betInput.value = doubled.toFixed(2);
            if (window.updateProgressiveBetFromInput) {
                window.updateProgressiveBetFromInput();
            }
        });
    }
    
    // Max bet
    if (maxBtn) {
        maxBtn.addEventListener('click', function() {
            if (window.progressiveActive) {
                console.warn('⚠️ Cannot change bet while progressive mode is active');
                return;
            }
            if (window.currentUserData && window.currentUserData.balance) {
                betInput.value = window.currentUserData.balance.toFixed(2);
                if (window.updateProgressiveBetFromInput) {
                    window.updateProgressiveBetFromInput();
                }
            }
        });
    }
}
