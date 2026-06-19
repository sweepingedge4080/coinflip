// ============================================================
//  UI.JS - UI Updates & Helpers (RESTORED)
// ============================================================

// ----- DOM REFERENCE -----
const DOM = {};

function initDOM() {
    // Auth elements
    DOM.authForm = document.getElementById('authForm');
    DOM.userInfo = document.getElementById('userInfo');
    DOM.loginUsername = document.getElementById('loginUsername');
    DOM.loginPassword = document.getElementById('loginPassword');
    DOM.loginBtn = document.getElementById('loginBtn');
    DOM.signupBtn = document.getElementById('signupBtn');
    DOM.logoutBtn = document.getElementById('logoutBtn');
    DOM.currentUserDisplay = document.getElementById('currentUserDisplay');
    DOM.userIdDisplay = document.getElementById('userIdDisplay');
    DOM.userIdContainer = document.getElementById('userIdContainer');
    DOM.adminBadge = document.getElementById('adminBadge');

    // Banking elements
    DOM.balance = document.getElementById('balance');
    DOM.bestStreak = document.getElementById('bestStreak');
    DOM.totalWagered = document.getElementById('totalWagered');
    DOM.depositBtn = document.getElementById('depositBtn');
    DOM.withdrawBtn = document.getElementById('withdrawBtn');

    // Game elements
    DOM.coin = document.getElementById('coin');
    DOM.coinArea = document.getElementById('coinArea');
    DOM.result = document.getElementById('result');
    DOM.betInput = document.getElementById('betAmount');
    DOM.betLockedInfo = document.getElementById('betLockedInfo');
    DOM.lockedBetDisplay = document.getElementById('lockedBetDisplay');
    DOM.headsBtn = document.getElementById('headsBtn');
    DOM.tailsBtn = document.getElementById('tailsBtn');
    DOM.flipBtn = document.getElementById('flipBtn');
    DOM.halfBtn = document.getElementById('halfBtn');
    DOM.doubleBtn = document.getElementById('doubleBtn');
    DOM.maxBtn = document.getElementById('maxBtn');

    // Stats elements
    DOM.winsCount = document.getElementById('winsCount');
    DOM.lossesCount = document.getElementById('lossesCount');
    DOM.winRate = document.getElementById('winRate');
    DOM.currentStreak = document.getElementById('currentStreak');
    DOM.jackpotAmount = document.getElementById('jackpotAmount');

    // Progressive elements
    DOM.progressiveStatus = document.getElementById('progressiveStatus');
    DOM.currentLevelDisplay = document.getElementById('currentLevelDisplay');
    DOM.currentPotDisplay = document.getElementById('currentPotDisplay');
    DOM.checkpointsContainer = document.getElementById('checkpointsContainer');
    DOM.toggleProgressiveBtn = document.getElementById('toggleProgressiveBtn');
    DOM.cashoutProgressiveBtn = document.getElementById('cashoutProgressiveBtn');

    // Modal elements
    DOM.depositModal = document.getElementById('depositModal');
    DOM.withdrawModal = document.getElementById('withdrawModal');
    DOM.depositMethod = document.getElementById('depositMethod');
    DOM.depositAmount = document.getElementById('depositAmount');
    DOM.depositWallet = document.getElementById('depositWallet');
    DOM.depositNote = document.getElementById('depositNote');
    DOM.withdrawMethod = document.getElementById('withdrawMethod');
    DOM.withdrawAmount = document.getElementById('withdrawAmount');
    DOM.withdrawWallet = document.getElementById('withdrawWallet');
    DOM.withdrawNote = document.getElementById('withdrawNote');
    DOM.confirmDepositBtn = document.getElementById('confirmDepositBtn');
    DOM.cancelDepositBtn = document.getElementById('cancelDepositBtn');
    DOM.confirmWithdrawBtn = document.getElementById('confirmWithdrawBtn');
    DOM.cancelWithdrawBtn = document.getElementById('cancelWithdrawBtn');

    // Log missing elements (warnings only, not errors)
    const missingElements = [];
    for (const [key, value] of Object.entries(DOM)) {
        if (!value) {
            missingElements.push(key);
        }
    }
    
    if (missingElements.length > 0) {
        logWarning(`Some DOM elements not found: ${missingElements.join(', ')}`);
    } else {
        log('✅ DOM initialized successfully');
    }
}

// ============================================================
//  MAIN UI UPDATE
// ============================================================

function updateUI() {
    if (!currentUserData) return;
    
    if (DOM.balance) DOM.balance.innerText = currentUserData.balance.toFixed(2);
    if (DOM.bestStreak) DOM.bestStreak.innerText = currentUserData.bestStreak || 0;
    if (DOM.totalWagered) DOM.totalWagered.innerText = (currentUserData.totalWagered || 0).toFixed(2);
    if (DOM.winsCount) DOM.winsCount.innerText = currentUserData.wins || 0;
    if (DOM.lossesCount) DOM.lossesCount.innerText = currentUserData.losses || 0;
    
    const total = (currentUserData.wins || 0) + (currentUserData.losses || 0);
    const winRate = total > 0 ? Math.round(((currentUserData.wins || 0) / total) * 100) : 0;
    if (DOM.winRate) DOM.winRate.innerText = winRate + '%';
    if (DOM.currentStreak) DOM.currentStreak.innerText = currentUserData.currentStreak || 0;
    
    if (!progressiveActive || progressiveLevel === 0) {
        if (DOM.betInput) DOM.betInput.max = currentUserData.balance;
    }
    
    if (DOM.userIdDisplay) DOM.userIdDisplay.innerText = currentUserData.id || currentUserData._id;
}

// ============================================================
//  NOTIFICATION SYSTEM
// ============================================================

function showNotification(msg, duration = 3000) {
    const existing = document.querySelectorAll('.notification');
    existing.forEach(el => el.remove());
    
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.innerHTML = msg;
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transition = 'opacity 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, duration);
}

// ============================================================
//  SELECTED BUTTON UI
// ============================================================

function updateSelectedButton() {
    if (DOM.headsBtn) DOM.headsBtn.classList.remove('selected');
    if (DOM.tailsBtn) DOM.tailsBtn.classList.remove('selected');
    
    if (selectedChoice === 'heads' && DOM.headsBtn) {
        DOM.headsBtn.classList.add('selected');
    }
    if (selectedChoice === 'tails' && DOM.tailsBtn) {
        DOM.tailsBtn.classList.add('selected');
    }
}

// ============================================================
//  GAME ENABLED STATE
// ============================================================

function setGameEnabled(enabled) {
    const disabled = !enabled || progressiveActive;
    
    if (DOM.betInput) DOM.betInput.disabled = disabled;
    if (DOM.headsBtn) DOM.headsBtn.disabled = disabled;
    if (DOM.tailsBtn) DOM.tailsBtn.disabled = disabled;
    if (DOM.halfBtn) DOM.halfBtn.disabled = disabled;
    if (DOM.doubleBtn) DOM.doubleBtn.disabled = disabled;
    if (DOM.maxBtn) DOM.maxBtn.disabled = disabled;
    if (DOM.flipBtn) DOM.flipBtn.disabled = disabled;
    if (DOM.depositBtn) DOM.depositBtn.disabled = !enabled;
    if (DOM.withdrawBtn) DOM.withdrawBtn.disabled = !enabled;
    
    if (DOM.result) {
        DOM.result.innerHTML = enabled 
            ? 'Select HEADS or TAILS to start' 
            : 'Login to start playing!';
    }
}

// ============================================================
//  AUTH UI
// ============================================================

function showAuthUI() {
    if (!currentUser) return;
    
    if (DOM.authForm) DOM.authForm.style.display = 'none';
    if (DOM.userInfo) DOM.userInfo.style.display = 'block';
    if (DOM.currentUserDisplay) DOM.currentUserDisplay.innerText = currentUser.username;
    if (DOM.userIdDisplay) DOM.userIdDisplay.innerText = currentUser.id;
    
    if (DOM.adminBadge) {
        DOM.adminBadge.style.display = isAdmin ? 'inline-block' : 'none';
    }
}

function hideAuthUI() {
    if (DOM.authForm) DOM.authForm.style.display = 'block';
    if (DOM.userInfo) DOM.userInfo.style.display = 'none';
    if (DOM.adminBadge) DOM.adminBadge.style.display = 'none';
    if (DOM.balance) DOM.balance.innerText = '0.00';
}

// ============================================================
//  CELEBRATION EFFECTS
// ============================================================

function showWinCelebration(amount) {
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:radial-gradient(circle,rgba(250,204,21,0.3) 0%,rgba(168,85,247,0.1) 100%);animation:flashAnim 0.5s ease-out;pointer-events:none;z-index:99998;';
    const style = document.createElement('style');
    style.textContent = '@keyframes flashAnim{0%{opacity:1}100%{opacity:0}}';
    document.head.appendChild(style);
    document.body.appendChild(flash);
    setTimeout(() => { flash.remove(); style.remove(); }, 500);
    
    if (DOM.coinArea) {
        DOM.coinArea.classList.add('win-glow');
        setTimeout(() => DOM.coinArea.classList.remove('win-glow'), 800);
    }
    
    showNotification(`🎉 WIN! Won ${amount.toFixed(2)}! 🎉`);
}

function showLossCelebration(amount) {
    if (DOM.coinArea) {
        DOM.coinArea.classList.add('lose-glow');
        setTimeout(() => DOM.coinArea.classList.remove('lose-glow'), 800);
    }
    showNotification(`💀 LOSS! Lost ${amount.toFixed(2)}! 💀`);
}

// ============================================================
//  CLIPBOARD HELPERS
// ============================================================

function copyToClipboard(elementId) {
    const text = document.getElementById(elementId)?.innerText;
    if (!text) return;
    
    navigator.clipboard.writeText(text)
        .then(() => showNotification(`📋 Copied: ${text.substring(0, 20)}...`))
        .catch(() => {
            const el = document.getElementById(elementId);
            if (el) {
                const range = document.createRange();
                range.selectNode(el);
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);
                document.execCommand('copy');
                showNotification(`📋 Copied: ${text.substring(0, 20)}...`);
            }
        });
}

function copyUserId() {
    const userId = DOM.userIdDisplay?.innerText;
    if (userId && userId !== '-') {
        navigator.clipboard.writeText(userId)
            .then(() => showNotification(`📋 User ID copied: ${userId}`))
            .catch(() => showNotification(`📋 User ID: ${userId}`));
    }
}

// ============================================================
//  LOADING STATES
// ============================================================

function showLoading(element) {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    if (element) {
        element.innerHTML = '⏳ Loading...';
        element.style.opacity = '0.6';
    }
}

function hideLoading(element) {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    if (element) {
        element.style.opacity = '1';
    }
}

// ============================================================
//  ERROR DISPLAY
// ============================================================

function showError(element, message) {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    if (element) {
        element.innerHTML = `❌ ${message}`;
        element.style.color = '#ef4444';
        setTimeout(() => {
            element.style.color = '';
        }, 3000);
    }
}

// ============================================================
//  REFRESH UI DATA
// ============================================================

async function refreshUserData() {
    if (!authToken) return false;
    
    try {
        const user = await apiGetUser();
        if (user) {
            currentUserData = user;
            updateUI();
            log('User data refreshed');
            return true;
        }
        return false;
    } catch (error) {
        logError('Failed to refresh user data', error);
        return false;
    }
}

// ============================================================
//  EXPOSE GLOBALLY
// ============================================================

window.DOM = DOM;
window.initDOM = initDOM;
window.updateUI = updateUI;
window.showNotification = showNotification;
window.updateSelectedButton = updateSelectedButton;
window.setGameEnabled = setGameEnabled;
window.showAuthUI = showAuthUI;
window.hideAuthUI = hideAuthUI;
window.showWinCelebration = showWinCelebration;
window.showLossCelebration = showLossCelebration;
window.copyToClipboard = copyToClipboard;
window.copyUserId = copyUserId;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showError = showError;
window.refreshUserData = refreshUserData;
