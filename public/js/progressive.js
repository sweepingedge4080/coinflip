// ============================================================
//  PROGRESSIVE.JS - Progressive Mode Logic (Uses Isolated Pot)
// ============================================================

// ----- STATE -----
let progressiveActive = false;
let progressiveLevel = 0;
let progressiveBet = 0;
let progressivePot = 0;
let isInProgressiveRun = false;
let pendingLevelUp = false;

// ============================================================
//  PROGRESSIVE VALIDATION HELPERS
// ============================================================

function validateProgressiveBet(amount) {
    if (!amount && amount !== 0) {
        return { valid: false, message: 'Please enter a valid bet amount' };
    }
    if (isNaN(amount)) {
        return { valid: false, message: 'Please enter a valid number' };
    }
    if (amount <= 0) {
        return { valid: false, message: 'Bet amount must be greater than 0' };
    }
    if (amount < 1) {
        return { valid: false, message: 'Minimum bet for progressive mode is $1' };
    }
    if (amount > 10000) {
        return { valid: false, message: 'Bet amount cannot exceed $10,000' };
    }
    if (!Number.isFinite(amount)) {
        return { valid: false, message: 'Invalid bet amount' };
    }
    return { valid: true };
}

function sanitizeProgressiveBet(amount) {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || !isFinite(parsed)) return 0;
    return Math.round(parsed * 100) / 100;
}

// ============================================================
//  RENDER CHECKPOINTS
// ============================================================

function renderCheckpoints() {
    if (!DOM.checkpointsContainer) return;
    
    DOM.checkpointsContainer.innerHTML = '';
    const maxLevel = PROGRESSIVE_MULTIPLIERS.length;
    
    for (let i = 0; i < maxLevel; i++) {
        const div = document.createElement('div');
        div.className = 'checkpoint';
        
        if (i < progressiveLevel) {
            div.classList.add('reached');
        }
        if (i === progressiveLevel && progressiveActive && progressiveLevel < maxLevel) {
            div.classList.add('current');
        }
        
        const mult = PROGRESSIVE_MULTIPLIERS[i];
        const prize = progressiveBet * mult;
        
        div.innerHTML = `
            <div class="checkpoint-multiplier">${mult}x</div>
            <div class="checkpoint-label">${i === 0 ? 'START' : i === maxLevel-1 ? '🏆MAX' : 'Lv' + (i+1)}</div>
            <div class="checkpoint-prize">$${prize.toFixed(2)}</div>
        `;
        
        DOM.checkpointsContainer.appendChild(div);
    }
    
    updateProgressiveUI();
}

// ============================================================
//  UPDATE PROGRESSIVE UI
// ============================================================

function updateProgressiveUI() {
    const displayLevel = progressiveActive ? progressiveLevel : 0;
    if (DOM.currentLevelDisplay) {
        DOM.currentLevelDisplay.textContent = `Level ${displayLevel}`;
    }
    
    const currentMultiplier = progressiveActive && progressiveLevel < PROGRESSIVE_MULTIPLIERS.length 
        ? PROGRESSIVE_MULTIPLIERS[progressiveLevel] 
        : PROGRESSIVE_MULTIPLIERS[PROGRESSIVE_MULTIPLIERS.length - 1];
    
    if (DOM.currentPotDisplay) {
        DOM.currentPotDisplay.textContent = `💰 $${(progressiveBet * currentMultiplier).toFixed(2)}`;
    }
    
    if (DOM.progressiveStatus) {
        if (progressiveActive && progressiveLevel > 0) {
            DOM.progressiveStatus.className = 'progressive-status active';
            DOM.progressiveStatus.textContent = `🔥 LEVEL ${progressiveLevel}`;
        } else if (progressiveActive) {
            DOM.progressiveStatus.className = 'progressive-status active';
            DOM.progressiveStatus.textContent = '⏳ WAITING';
        } else {
            DOM.progressiveStatus.className = 'progressive-status inactive';
            DOM.progressiveStatus.textContent = '⏸ INACTIVE';
        }
    }
    
    if (DOM.cashoutProgressiveBtn) {
        DOM.cashoutProgressiveBtn.disabled = !(progressiveActive && progressiveLevel > 0);
    }
}

// ============================================================
//  RESET PROGRESSIVE RUN (Resets streak, but KEEPS mode active)
// ============================================================

function resetProgressiveRun() {
    progressiveLevel = 0;
    progressivePot = 0;
    isInProgressiveRun = false;
    pendingLevelUp = false;
    
    // ✅ Reset the isolated pot
    resetProgressivePot();
    
    if (DOM.betLockedInfo) {
        DOM.betLockedInfo.classList.remove('visible');
    }
    if (DOM.betInput) {
        DOM.betInput.disabled = false;
    }
    
    renderCheckpoints();
    log('Progressive run reset - mode still active');
}

// ============================================================
//  FULL RESET PROGRESSIVE (Completely turns off mode)
// ============================================================

function fullResetProgressive() {
    progressiveActive = false;
    progressiveLevel = 0;
    progressiveBet = 0;
    progressivePot = 0;
    isInProgressiveRun = false;
    pendingLevelUp = false;
    
    // ✅ Reset the isolated pot
    resetProgressivePot();
    
    if (DOM.betLockedInfo) {
        DOM.betLockedInfo.classList.remove('visible');
    }
    if (DOM.betInput) {
        DOM.betInput.disabled = false;
    }
    if (DOM.toggleProgressiveBtn) {
        DOM.toggleProgressiveBtn.textContent = '▶ START PROGRESSIVE';
        DOM.toggleProgressiveBtn.classList.remove('active');
    }
    
    renderCheckpoints();
    log('Progressive mode fully disabled');
}

// ============================================================
//  START PROGRESSIVE RUN
// ============================================================

function startProgressiveRun() {
    console.log('🔄 startProgressiveRun called');
    
    if (!authToken) {
        showNotification('Please login first!');
        return;
    }
    
    if (!currentUserData) {
        showNotification('User data not loaded!');
        return;
    }
    
    const rawBet = DOM.betInput ? DOM.betInput.value : '0';
    const bet = sanitizeProgressiveBet(rawBet);
    
    console.log('💰 Bet amount:', bet);
    
    const betValidation = validateProgressiveBet(bet);
    if (!betValidation.valid) {
        showNotification(`❌ ${betValidation.message}`);
        return;
    }
    
    if (bet > currentUserData.balance) {
        showNotification(`❌ Insufficient balance! You have $${currentUserData.balance.toFixed(2)}`);
        return;
    }
    
    if (bet < 1) {
        showNotification('❌ Minimum bet for progressive mode is $1');
        return;
    }
    
    progressiveActive = true;
    progressiveLevel = 0;
    progressiveBet = bet;
    progressivePot = 0;
    isInProgressiveRun = true;
    pendingLevelUp = false;
    
    // ✅ START THE ISOLATED POT
    startProgressivePot(bet);
    
    if (DOM.betInput) {
        DOM.betInput.disabled = true;
    }
    if (DOM.lockedBetDisplay) {
        DOM.lockedBetDisplay.textContent = bet.toFixed(2);
    }
    if (DOM.betLockedInfo) {
        DOM.betLockedInfo.classList.add('visible');
    }
    if (DOM.toggleProgressiveBtn) {
        DOM.toggleProgressiveBtn.textContent = '🟢 ACTIVE';
        DOM.toggleProgressiveBtn.classList.add('active');
    }
    
    if (!selectedChoice) {
        selectedChoice = 'heads';
        updateSelectedButton();
    }
    
    renderCheckpoints();
    showNotification(`🔥 Progressive mode activated with $${bet.toFixed(2)}! Win to advance!`);
    if (DOM.result) {
        DOM.result.innerHTML = '🔥 Progressive mode activated! Win to advance to Level 1!';
        DOM.result.className = 'result progressive-win';
    }
    
    console.log('✅ Progressive mode activated:', bet);
    log(`Progressive mode activated: $${bet}`);
}

// ============================================================
//  CASHOUT PROGRESSIVE - Uses Isolated Pot
// ============================================================

function cashoutProgressive() {
    if (!progressiveActive || progressiveLevel === 0) {
        showNotification('No winnings to cash out!');
        return;
    }
    
    // ✅ CASH OUT THE ISOLATED POT
    const potResult = cashoutProgressivePot();
    
    if (!potResult) {
        showNotification('❌ Error cashing out');
        return;
    }
    
    const { potValue, isolatedBet, netProfit, level, multiplier } = potResult;
    
    // ✅ Call server to add winnings to balance
    apiAddProgressive(potValue, level)
        .then(response => {
            if (!response || typeof response !== 'object') {
                throw new Error('Invalid server response');
            }
            
            const newBalance = parseFloat(response.newBalance);
            if (isNaN(newBalance) || !isFinite(newBalance)) {
                throw new Error('Invalid balance response');
            }
            
            currentUserData.balance = newBalance;
            updateUI();
            
            // ✅ LOG THE CASHOUT
            if (typeof addLogEntry === 'function') {
                addLogEntry(selectedChoice || 'heads', 'win', isolatedBet, netProfit, currentUserData.balance);
            }
            
            showNotification(`💰💰💰 CASHED OUT! Won $${potValue.toFixed(2)} at ${multiplier}x multiplier! Net profit: $${netProfit.toFixed(2)} 💰💰💰`, 5000);
            showWinCelebration(potValue);
            log(`Progressive cashed out: $${potValue} at Level ${level} (net profit: $${netProfit})`);
        })
        .catch(error => {
            logError('Cashout failed', error);
            showNotification('❌ Error cashing out: ' + error.message);
        });
    
    // ✅ Reset the run but KEEP mode active
    const savedBet = progressiveBet;
    resetProgressiveRun();
    if (DOM.betInput) {
        DOM.betInput.value = savedBet.toFixed(2);
        DOM.betInput.disabled = true;
    }
    progressiveBet = savedBet;
    
    showNotification(`💰 Cashed out! Mode stays active.`, 3000);
}

// ============================================================
//  ADVANCE PROGRESSIVE LEVEL (when player wins)
// ============================================================

function advanceProgressiveLevel() {
    if (!progressiveActive) {
        console.warn('⚠️ Cannot advance: progressive mode not active');
        return false;
    }
    
    const newLevel = progressiveLevel + 1;
    const maxLevel = PROGRESSIVE_MULTIPLIERS.length;
    
    if (newLevel > maxLevel) {
        console.warn('⚠️ Already at max level');
        return false;
    }
    
    // ✅ Advance the isolated pot
    const potState = advanceProgressivePot(newLevel);
    
    if (!potState) {
        console.warn('⚠️ Failed to advance progressive pot');
        return false;
    }
    
    progressiveLevel = newLevel;
    progressivePot = potState.potValue;
    
    renderCheckpoints();
    updateProgressiveUI();
    
    console.log(`⬆️ Advanced to Level ${newLevel}, Pot: $${progressivePot.toFixed(2)}`);
    return true;
}

// ============================================================
//  BUST PROGRESSIVE (when player loses)
// ============================================================

function bustProgressive() {
    if (!progressiveActive) {
        console.warn('⚠️ Cannot bust: progressive mode not active');
        return false;
    }
    
    // ✅ Bust the isolated pot
    const bustResult = bustProgressivePot();
    
    if (!bustResult) {
        console.warn('⚠️ Failed to bust progressive pot');
        return false;
    }
    
    const { lostAmount, isolatedBet, level } = bustResult;
    
    // ✅ LOG THE BUST
    if (typeof addLogEntry === 'function') {
        addLogEntry(selectedChoice || 'heads', 'lose', isolatedBet, -lostAmount, currentUserData.balance);
    }
    
    console.log(`💀 Progressive bust: Lost $${lostAmount} at Level ${level}`);
    
    return true;
}

// ============================================================
//  LEVEL UP OVERLAY
// ============================================================

function showLevelUpOverlay(level, pot, nextMultiplier) {
    if (!level || level <= 0) return;
    if (!pot || pot <= 0) return;
    if (!nextMultiplier || nextMultiplier <= 0) return;
    
    document.querySelectorAll('.level-up-overlay, .big-loss-overlay').forEach(el => el.remove());
    
    const overlay = document.createElement('div');
    overlay.className = 'level-up-overlay';
    overlay.id = 'levelUpOverlay';
    overlay.innerHTML = `
        <div class="card">
            <span class="emoji">🎉</span>
            <h2>LEVEL UP!</h2>
            <div class="level-number">Level ${level}</div>
            <div class="prize-amount">💰 $${pot.toFixed(2)}</div>
            <div class="next-multiplier">Next win pays ${nextMultiplier}x! Risk it or take the money?</div>
            <div class="button-group">
                <button class="cashout-btn-overlay" id="overlayCashoutBtn">💰 CASH OUT $${pot.toFixed(2)}</button>
                <button class="continue-btn-overlay" id="overlayContinueBtn">🔥 CONTINUE (${nextMultiplier}x)</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    const cashoutBtn = document.getElementById('overlayCashoutBtn');
    const continueBtn = document.getElementById('overlayContinueBtn');
    
    if (cashoutBtn) {
        cashoutBtn.onclick = function() {
            const overlayEl = document.getElementById('levelUpOverlay');
            if (overlayEl) overlayEl.remove();
            cashoutProgressive();
        };
    }
    
    if (continueBtn) {
        continueBtn.onclick = function() {
            const overlayEl = document.getElementById('levelUpOverlay');
            if (overlayEl) overlayEl.remove();
            pendingLevelUp = false;
            
            // ✅ Advance the progressive level (pot grows, bet already deducted)
            advanceProgressiveLevel();
            
            if (DOM.result) {
                DOM.result.innerHTML = `🔥 Continuing to Level ${progressiveLevel + 1}! Good luck!`;
                DOM.result.className = 'result progressive-win';
            }
            renderCheckpoints();
            showNotification(`🔥 Moving to Level ${progressiveLevel + 1}!`, 2000);
            log(`Continuing to Level ${progressiveLevel + 1}`);
        };
    }
    
    log(`Level ${level} reached! Pot: $${pot}`);
}

// ============================================================
//  BIG LOSS OVERLAY
// ============================================================

function showBigLossOverlay(level, lostAmount) {
    if (!level || level < 0) level = 0;
    if (!lostAmount || lostAmount <= 0) lostAmount = 0;
    
    document.querySelectorAll('.level-up-overlay, .big-loss-overlay').forEach(el => el.remove());
    
    const overlay = document.createElement('div');
    overlay.className = 'big-loss-overlay';
    overlay.innerHTML = `
        <div class="card">
            <span class="emoji">💀</span>
            <h2>BUSTED!</h2>
            <div class="lost-amount">Lost $${lostAmount.toFixed(2)}</div>
            <div class="lost-details">You reached Level ${level} before losing it all.</div>
            <button id="lossOverlayOkBtn">😔 CONTINUE</button>
        </div>
    `;
    document.body.appendChild(overlay);
    
    const tryAgainBtn = document.getElementById('lossOverlayOkBtn');
    if (tryAgainBtn) {
        tryAgainBtn.onclick = function() {
            document.querySelectorAll('.big-loss-overlay').forEach(el => el.remove());
            
            const savedBet = progressiveBet;
            
            // ✅ Reset streak but KEEP mode active
            resetProgressiveRun();
            
            if (DOM.betInput) {
                DOM.betInput.value = savedBet.toFixed(2);
                DOM.betInput.disabled = true;
            }
            if (DOM.result) {
                DOM.result.innerHTML = '💀 Busted! Try again with the same bet. Mode stays active.';
                DOM.result.className = 'result lose';
            }
            
            progressiveBet = savedBet;
            log(`Big loss overlay dismissed: Level ${level} - mode still active`);
        };
    }
}

// ============================================================
//  PROGRESSIVE EVENT LISTENERS
// ============================================================

function setupProgressiveListeners() {
    console.log('🔧 Setting up progressive listeners...');
    
    const toggleBtn = document.getElementById('toggleProgressiveBtn');
    if (toggleBtn) {
        console.log('✅ Toggle button found');
        toggleBtn.onclick = function() {
            console.log('🔄 Toggle button clicked. progressiveActive:', progressiveActive);
            
            if (progressiveActive) {
                if (confirm('Turn off progressive mode? Your current streak will be lost.')) {
                    fullResetProgressive();
                    if (DOM.betInput) DOM.betInput.disabled = false;
                    showNotification('Progressive mode disabled');
                }
            } else {
                startProgressiveRun();
            }
        };
    } else {
        console.warn('⚠️ Toggle button NOT found');
    }
    
    const cashoutBtn = document.getElementById('cashoutProgressiveBtn');
    if (cashoutBtn) {
        cashoutBtn.onclick = cashoutProgressive;
        console.log('✅ Cashout button found');
    } else {
        console.warn('⚠️ Cashout button NOT found');
    }
    
    log('✅ Progressive listeners setup complete');
}

// ============================================================
//  EXPOSE GLOBALLY
// ============================================================

window.progressiveActive = progressiveActive;
window.progressiveLevel = progressiveLevel;
window.progressiveBet = progressiveBet;
window.progressivePot = progressivePot;
window.isInProgressiveRun = isInProgressiveRun;
window.pendingLevelUp = pendingLevelUp;
window.validateProgressiveBet = validateProgressiveBet;
window.sanitizeProgressiveBet = sanitizeProgressiveBet;
window.renderCheckpoints = renderCheckpoints;
window.updateProgressiveUI = updateProgressiveUI;
window.resetProgressiveRun = resetProgressiveRun;
window.fullResetProgressive = fullResetProgressive;
window.startProgressiveRun = startProgressiveRun;
window.cashoutProgressive = cashoutProgressive;
window.advanceProgressiveLevel = advanceProgressiveLevel;
window.bustProgressive = bustProgressive;
window.showLevelUpOverlay = showLevelUpOverlay;
window.showBigLossOverlay = showBigLossOverlay;
window.setupProgressiveListeners = setupProgressiveListeners;
