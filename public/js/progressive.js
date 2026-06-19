// ============================================================
//  PROGRESSIVE.JS - Progressive Mode Logic
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
    DOM.currentLevelDisplay.textContent = `Level ${displayLevel}`;
    
    const currentMultiplier = progressiveActive && progressiveLevel < PROGRESSIVE_MULTIPLIERS.length 
        ? PROGRESSIVE_MULTIPLIERS[progressiveLevel] 
        : PROGRESSIVE_MULTIPLIERS[PROGRESSIVE_MULTIPLIERS.length - 1];
    
    DOM.currentPotDisplay.textContent = `💰 $${(progressiveBet * currentMultiplier).toFixed(2)}`;
    
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
    
    DOM.cashoutProgressiveBtn.disabled = !(progressiveActive && progressiveLevel > 0);
}

// ============================================================
//  RESET PROGRESSIVE RUN
// ============================================================

function resetProgressiveRun() {
    progressiveActive = false;
    progressiveLevel = 0;
    progressivePot = 0;
    isInProgressiveRun = false;
    pendingLevelUp = false;
    
    DOM.betLockedInfo.classList.remove('visible');
    DOM.betInput.disabled = false;
    DOM.toggleProgressiveBtn.textContent = '▶ START PROGRESSIVE';
    DOM.toggleProgressiveBtn.classList.remove('active');
    
    renderCheckpoints();
    log('Progressive run reset');
}

// ============================================================
//  START PROGRESSIVE RUN
// ============================================================

function startProgressiveRun() {
    if (!authToken) {
        showNotification('Please login first!');
        return;
    }
    
    const bet = parseFloat(DOM.betInput.value);
    
    if (isNaN(bet) || bet <= 0) {
        showNotification('Enter a valid bet amount!');
        return;
    }
    
    if (bet > currentUserData.balance) {
        showNotification('Insufficient balance!');
        return;
    }
    
    progressiveActive = true;
    progressiveLevel = 0;
    progressiveBet = bet;
    progressivePot = 0;
    isInProgressiveRun = true;
    pendingLevelUp = false;
    
    DOM.betInput.disabled = true;
    DOM.lockedBetDisplay.textContent = bet.toFixed(2);
    DOM.betLockedInfo.classList.add('visible');
    DOM.toggleProgressiveBtn.textContent = '⏳ IN RUN';
    DOM.toggleProgressiveBtn.classList.add('active');
    
    if (!selectedChoice) {
        selectedChoice = 'heads';
        updateSelectedButton();
    }
    
    renderCheckpoints();
    showNotification(`🔥 Progressive run started with $${bet.toFixed(2)}! Win to advance!`);
    DOM.result.innerHTML = '🔥 Progressive run started! Win to advance to Level 1!';
    DOM.result.className = 'result progressive-win';
    
    log(`Progressive run started: $${bet}`);
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
    
    // Call the server to add progressive winnings
    apiAddProgressive(winnings, progressiveLevel)
        .then(response => {
            // Use server response for balance
            currentUserData.balance = response.newBalance;
            updateUI();
            showNotification(`💰💰💰 CASHED OUT! Won $${winnings.toFixed(2)} at ${multiplier}x multiplier! 💰💰💰`, 5000);
            showWinCelebration(winnings);
        })
        .catch(error => {
            logError('Cashout failed', error);
            showNotification('❌ Error cashing out: ' + error.message);
        });
    
    const savedBet = progressiveBet;
    resetProgressiveRun();
    DOM.betInput.value = savedBet.toFixed(2);
    DOM.betInput.disabled = false;
    progressiveBet = savedBet;
    
    showNotification(`💰 Cashed out! Starting new run available.`, 3000);
    log(`Progressive cashed out: $${winnings} at Level ${progressiveLevel}`);
}

// ============================================================
//  LEVEL UP OVERLAY
// ============================================================

function showLevelUpOverlay(level, pot, nextMultiplier) {
    // Remove any existing overlays
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
    
    document.getElementById('overlayCashoutBtn').onclick = function() {
        document.getElementById('levelUpOverlay').remove();
        cashoutProgressive();
    };
    
    document.getElementById('overlayContinueBtn').onclick = function() {
        document.getElementById('levelUpOverlay').remove();
        pendingLevelUp = false;
        DOM.result.innerHTML = `🔥 Continuing to Level ${progressiveLevel + 1}! Good luck!`;
        DOM.result.className = 'result progressive-win';
        renderCheckpoints();
        showNotification(`🔥 Moving to Level ${progressiveLevel + 1}!`, 2000);
        log(`Continuing to Level ${progressiveLevel + 1}`);
    };
    
    log(`Level ${level} reached! Pot: $${pot}`);
}

// ============================================================
//  BIG LOSS OVERLAY
// ============================================================

function showBigLossOverlay(level, lostAmount) {
    // Remove any existing overlays
    document.querySelectorAll('.level-up-overlay, .big-loss-overlay').forEach(el => el.remove());
    
    const overlay = document.createElement('div');
    overlay.className = 'big-loss-overlay';
    overlay.innerHTML = `
        <div class="card">
            <span class="emoji">💀</span>
            <h2>BUSTED!</h2>
            <div class="lost-amount">Lost $${lostAmount.toFixed(2)}</div>
            <div class="lost-details">You reached Level ${level} before losing it all.</div>
            <button id="lossOverlayOkBtn">😔 TRY AGAIN</button>
        </div>
    `;
    document.body.appendChild(overlay);
    
    document.getElementById('lossOverlayOkBtn').onclick = function() {
        document.querySelectorAll('.big-loss-overlay').forEach(el => el.remove());
        
        const savedBet = progressiveBet;
        resetProgressiveRun();
        
        DOM.betInput.value = savedBet.toFixed(2);
        DOM.betInput.disabled = false;
        DOM.result.innerHTML = '💀 Busted! Try again with the same bet.';
        DOM.result.className = 'result lose';
        
        progressiveBet = savedBet;
        log(`Big loss overlay dismissed: Level ${level}`);
    };
}

// ============================================================
//  PROGRESSIVE EVENT LISTENERS
// ============================================================

function setupProgressiveListeners() {
    DOM.toggleProgressiveBtn.onclick = function() {
        if (progressiveActive) {
            if (progressiveLevel > 0) {
                if (confirm('End progressive run? You will lose your current winnings!')) {
                    resetProgressiveRun();
                    DOM.betInput.disabled = false;
                    showNotification('Progressive run ended');
                }
            } else {
                resetProgressiveRun();
                DOM.betInput.disabled = false;
                showNotification('Progressive mode disabled');
            }
        } else {
            startProgressiveRun();
        }
    };
    
    DOM.cashoutProgressiveBtn.onclick = cashoutProgressive;
    
    log('✅ Progressive listeners setup complete');
}

// ----- EXPOSE GLOBALLY -----
window.progressiveActive = progressiveActive;
window.progressiveLevel = progressiveLevel;
window.progressiveBet = progressiveBet;
window.progressivePot = progressivePot;
window.isInProgressiveRun = isInProgressiveRun;
window.pendingLevelUp = pendingLevelUp;
window.renderCheckpoints = renderCheckpoints;
window.updateProgressiveUI = updateProgressiveUI;
window.resetProgressiveRun = resetProgressiveRun;
window.startProgressiveRun = startProgressiveRun;
window.cashoutProgressive = cashoutProgressive;
window.showLevelUpOverlay = showLevelUpOverlay;
window.showBigLossOverlay = showBigLossOverlay;
window.setupProgressiveListeners = setupProgressiveListeners;
