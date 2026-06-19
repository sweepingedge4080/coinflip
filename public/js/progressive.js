// ============================================================
//  PROGRESSIVE.JS - Progressive Mode Logic (KEEPS MODE ON)
// ============================================================

// ----- STATE -----
let progressiveActive = false;
let progressiveLevel = 0;
let progressiveBet = 0;
let progressivePot = 0;
let isInProgressiveRun = false;
let pendingLevelUp = false;

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
    // ✅ ONLY reset the streak, NOT the mode
    progressiveLevel = 0;
    progressivePot = 0;
    isInProgressiveRun = false;
    pendingLevelUp = false;
    
    if (DOM.betLockedInfo) {
        DOM.betLockedInfo.classList.remove('visible');
    }
    if (DOM.betInput) {
        DOM.betInput.disabled = false;
    }
    
    // ✅ Keep progressiveActive true, don't change the toggle button
    // DOM.toggleProgressiveBtn.textContent = '▶ START PROGRESSIVE'; // DON'T change this
    // DOM.toggleProgressiveBtn.classList.remove('active'); // DON'T change this
    
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
    
    log(`Progressive mode activated: $${bet}`);
}

// ============================================================
//  CASHOUT PROGRESSIVE
// ============================================================

function cashoutProgressive() {
    if (!progressiveActive || progressiveLevel === 0) {
        showNotification('No winnings to cash out!');
        return;
    }
    
    const multiplier = progressiveLevel <= PROGRESSIVE_MULTIPLIERS.length 
        ? PROGRESSIVE_MULTIPLIERS[progressiveLevel - 1] 
        : PROGRESSIVE_MULTIPLIERS[PROGRESSIVE_MULTIPLIERS.length - 1];
    const winnings = progressiveBet * multiplier;
    
    if (!isFinite(winnings) || winnings <= 0) {
        showNotification('❌ Invalid winnings amount');
        return;
    }
    
    apiAddProgressive(winnings, progressiveLevel)
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
            showNotification(`💰💰💰 CASHED OUT! Won $${winnings.toFixed(2)} at ${multiplier}x multiplier! 💰💰💰`, 5000);
            showWinCelebration(winnings);
            log(`Progressive cashed out: $${winnings} at Level ${progressiveLevel}`);
        })
        .catch(error => {
            logError('Cashout failed', error);
            showNotification('❌ Error cashing out: ' + error.message);
        });
    
    // ✅ Reset streak but KEEP mode active
    const savedBet = progressiveBet;
    resetProgressiveRun();
    if (DOM.betInput) {
        DOM.betInput.value = savedBet.toFixed(2);
        DOM.betInput.disabled = true; // Bet stays locked since mode is still active
    }
    progressiveBet = savedBet;
    
    showNotification(`💰 Cashed out! Mode stays active.`, 3000);
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
                DOM.betInput.disabled = true; // Bet stays locked
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
    if (DOM.toggleProgressiveBtn) {
        DOM.toggleProgressiveBtn.onclick = function() {
            if (progressiveActive) {
                // ✅ Turn off mode completely
                if (confirm('Turn off progressive mode? Your current streak will be lost.')) {
                    fullResetProgressive();
                    if (DOM.betInput) DOM.betInput.disabled = false;
                    showNotification('Progressive mode disabled');
                }
            } else {
                startProgressiveRun();
            }
        };
    }
    
    if (DOM.cashoutProgressiveBtn) {
        DOM.cashoutProgressiveBtn.onclick = cashoutProgressive;
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
window.showLevelUpOverlay = showLevelUpOverlay;
window.showBigLossOverlay = showBigLossOverlay;
window.setupProgressiveListeners = setupProgressiveListeners;
