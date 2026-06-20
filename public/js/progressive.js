// ============================================================
//  PROGRESSIVE.JS - Progressive Mode Controller
//  This handles the UI and game logic integration
// ============================================================

// ----- STATE -----
let progressiveActive = false;
let progressiveBetAmount = 1;
let currentLevel = 0;

// ============================================================
//  PROGRESSIVE MODE FUNCTIONS
// ============================================================

function setupProgressiveListeners() {
    console.log('🔧 Setting up progressive listeners...');
    
    const toggleBtn = document.getElementById('progressiveToggle');
    const cashoutBtn = document.getElementById('progressiveCashout');
    const betInput = document.getElementById('betAmount');
    
    if (toggleBtn) {
        console.log('✅ Toggle button found');
        toggleBtn.addEventListener('click', toggleProgressiveMode);
    } else {
        console.warn('⚠️ Progressive toggle button not found');
    }
    
    if (cashoutBtn) {
        console.log('✅ Cashout button found');
        cashoutBtn.addEventListener('click', handleProgressiveCashout);
    } else {
        console.warn('⚠️ Progressive cashout button not found');
    }
    
    if (betInput) {
        betInput.addEventListener('change', updateProgressiveBetFromInput);
    }
    
    // Update UI every second to keep pot display fresh
    setInterval(() => {
        if (window.updateProgressiveUI) {
            window.updateProgressiveUI();
        }
    }, 1000);
}

function toggleProgressiveMode() {
    console.log(`🔄 Toggle button clicked. progressiveActive: ${progressiveActive}`);
    
    if (!progressiveActive) {
        // Starting progressive mode
        const betInput = document.getElementById('betAmount');
        const betAmount = betInput ? parseFloat(betInput.value) || 1 : 1;
        startProgressiveRun(betAmount);
    } else {
        // Stopping progressive mode
        stopProgressiveRun();
    }
}

function startProgressiveRun(betAmount) {
    console.log('🔄 startProgressiveRun called');
    
    if (!betAmount || betAmount <= 0) {
        console.warn('⚠️ Invalid bet amount:', betAmount);
        betAmount = 1;
    }
    
    console.log('💰 Bet amount:', betAmount);
    
    // Reset any existing pot first
    if (window.resetProgressivePot) {
        window.resetProgressivePot();
    }
    
    // Start the progressive pot
    if (window.startProgressivePot) {
        window.startProgressivePot(betAmount);
    }
    
    // Update UI state
    progressiveActive = true;
    progressiveBetAmount = betAmount;
    currentLevel = 0;
    
    // Sync the global flag
    window.progressiveActive = true;
    
    // Update UI
    updateProgressiveUI();
    updateProgressiveButtons();
    
    console.log('✅ Progressive mode activated:', betAmount);
    if (window.logMessage) {
        window.logMessage(`Progressive mode activated: $${betAmount}`);
    }
}

function stopProgressiveRun() {
    console.log('🔄 Stopping progressive run');
    
    // Reset the pot
    if (window.resetProgressivePot) {
        window.resetProgressivePot();
    }
    
    // Update state
    progressiveActive = false;
    progressiveBetAmount = 0;
    currentLevel = 0;
    window.progressiveActive = false;
    
    // Update UI
    updateProgressiveUI();
    updateProgressiveButtons();
    
    console.log('✅ Progressive mode fully disabled');
    if (window.logMessage) {
        window.logMessage('Progressive mode disabled');
    }
}

function handleProgressiveCashout() {
    console.log('💰 Cashout button clicked');
    
    if (!progressiveActive) {
        console.warn('⚠️ Cannot cashout: Progressive mode not active');
        return;
    }
    
    const result = window.cashoutProgressivePot ? window.cashoutProgressivePot() : null;
    
    if (!result) {
        console.warn('⚠️ Cashout failed - no result');
        return;
    }
    
    // Add winnings to balance via API
    const potValue = result.potValue;
    const level = result.level;
    const netProfit = result.netProfit;
    
    console.log(`💰 Cashing out $${potValue.toFixed(2)} from Level ${level} (profit: $${netProfit.toFixed(2)})`);
    
    // Send to server to add the winnings
    if (window.apiCall) {
        window.apiCall('/api/game/add-progressive', 'POST', {
            amount: potValue,
            streak: level
        }).then(response => {
            if (response.success) {
                console.log('✅ Progressive cashout successful');
                if (window.logMessage) {
                    window.logMessage(`Progressive cashed out: $${potValue} at Level ${level} (net profit: $${netProfit})`);
                }
                // Update balance display
                if (window.updateBalanceDisplay) {
                    window.updateBalanceDisplay(response.newBalance);
                }
                // Reset state (already done by cashoutProgressivePot)
                progressiveActive = false;
                window.progressiveActive = false;
                updateProgressiveUI();
                updateProgressiveButtons();
            } else {
                console.error('❌ Cashout failed:', response.error);
                alert('Cashout failed: ' + (response.error || 'Unknown error'));
            }
        }).catch(error => {
            console.error('❌ Cashout error:', error);
            alert('Cashout error: ' + error.message);
        });
    } else {
        console.warn('⚠️ API call not available, updating balance manually');
        if (window.updateBalance) {
            window.updateBalance(potValue);
        }
        progressiveActive = false;
        window.progressiveActive = false;
        updateProgressiveUI();
        updateProgressiveButtons();
    }
}

function advanceProgressiveLevel(level) {
    // Check if progressive mode is actually active (using the pot state)
    if (!window.isProgressiveActive || !window.isProgressiveActive()) {
        console.warn('⚠️ Cannot advance: progressive mode not active');
        return false;
    }
    
    const result = window.advanceProgressivePot ? window.advanceProgressivePot(level) : null;
    
    if (result) {
        currentLevel = level;
        updateProgressiveUI();
        updateProgressiveButtons();
        console.log(`⬆️ Advanced to Level ${level}, Pot: $${result.potValue.toFixed(2)}`);
        return true;
    } else {
        console.warn('⚠️ Failed to advance progressive pot');
        return false;
    }
}

function bustProgressiveRun() {
    console.log('💀 Busting progressive run');
    
    const result = window.bustProgressivePot ? window.bustProgressivePot() : null;
    
    if (result) {
        console.log(`💀 Progressive bust: Lost $${result.lostAmount.toFixed(2)} at Level ${result.level}`);
        if (window.logMessage) {
            window.logMessage(`💀 Progressive bust: Lost $${result.lostAmount.toFixed(2)} at Level ${result.level}`);
        }
        
        // Update state
        progressiveActive = false;
        window.progressiveActive = false;
        currentLevel = 0;
        updateProgressiveUI();
        updateProgressiveButtons();
        
        // Show bust animation/overlay
        showBustOverlay(result.level, result.lostAmount);
    } else {
        console.warn('⚠️ No active progressive pot to bust');
    }
}

function showBustOverlay(level, amount) {
    const overlay = document.getElementById('progressiveBustOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
        document.getElementById('bustLevel').textContent = level;
        document.getElementById('bustAmount').textContent = `$${amount.toFixed(2)}`;
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 2000);
    }
}

function updateProgressiveUI() {
    if (window.updateProgressiveUI) {
        window.updateProgressiveUI();
    }
    
    // Update the main game UI elements
    const modeIndicator = document.getElementById('progressiveModeIndicator');
    if (modeIndicator) {
        modeIndicator.textContent = progressiveActive ? 'Active' : 'Inactive';
        modeIndicator.style.color = progressiveActive ? '#00ff00' : '#ff4444';
    }
    
    const betDisplay = document.getElementById('progressiveBetDisplay');
    if (betDisplay) {
        betDisplay.textContent = `$${progressiveBetAmount.toFixed(2)}`;
    }
}

function updateProgressiveButtons() {
    const toggleBtn = document.getElementById('progressiveToggle');
    const cashoutBtn = document.getElementById('progressiveCashout');
    const betInput = document.getElementById('betAmount');
    
    if (toggleBtn) {
        toggleBtn.textContent = progressiveActive ? '🔄 Stop Progressive' : '🚀 Start Progressive';
        toggleBtn.style.backgroundColor = progressiveActive ? '#ff4444' : '#00cc00';
    }
    
    if (cashoutBtn) {
        cashoutBtn.disabled = !progressiveActive || currentLevel === 0;
        cashoutBtn.style.opacity = (progressiveActive && currentLevel > 0) ? '1' : '0.5';
    }
    
    if (betInput) {
        betInput.disabled = progressiveActive;
    }
}

function updateProgressiveBetFromInput() {
    const betInput = document.getElementById('betAmount');
    if (betInput) {
        const value = parseFloat(betInput.value);
        if (!isNaN(value) && value > 0) {
            progressiveBetAmount = value;
        }
    }
}

// ============================================================
//  EXPOSE GLOBALLY
// ============================================================

window.progressiveActive = progressiveActive;
window.setupProgressiveListeners = setupProgressiveListeners;
window.toggleProgressiveMode = toggleProgressiveMode;
window.startProgressiveRun = startProgressiveRun;
window.stopProgressiveRun = stopProgressiveRun;
window.handleProgressiveCashout = handleProgressiveCashout;
window.advanceProgressiveLevel = advanceProgressiveLevel;
window.bustProgressiveRun = bustProgressiveRun;
window.updateProgressiveUI = updateProgressiveUI;
window.updateProgressiveButtons = updateProgressiveButtons;

console.log('🎯 Progressive controller loaded');
