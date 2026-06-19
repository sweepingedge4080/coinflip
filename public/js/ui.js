// ============================================================
//  UI.JS - UI Updates & Helpers
// ============================================================

// ----- DOM REFERENCE -----
const DOM = {};

function initDOM() {
    DOM.balance = document.getElementById('balance');
    DOM.bestStreak = document.getElementById('bestStreak');
    DOM.totalWagered = document.getElementById('totalWagered');
    DOM.coin = document.getElementById('coin');
    DOM.result = document.getElementById('result');
    DOM.betInput = document.getElementById('betAmount');
    DOM.headsBtn = document.getElementById('headsBtn');
    DOM.tailsBtn = document.getElementById('tailsBtn');
    DOM.flipBtn = document.getElementById('flipBtn');
    DOM.halfBtn = document.getElementById('halfBtn');
    DOM.doubleBtn = document.getElementById('doubleBtn');
    DOM.maxBtn = document.getElementById('maxBtn');
    DOM.winsCount = document.getElementById('winsCount');
    DOM.lossesCount = document.getElementById('lossesCount');
    DOM.winRate = document.getElementById('winRate');
    DOM.currentStreak = document.getElementById('currentStreak');
    DOM.betLockedInfo = document.getElementById('betLockedInfo');
    DOM.lockedBetDisplay = document.getElementById('lockedBetDisplay');
    DOM.coinArea = document.getElementById('coinArea');
    DOM.adminPanel = document.getElementById('adminPanel');
    DOM.adminUserSelect = document.getElementById('adminUserSelect');
    DOM.adminAmount = document.getElementById('adminAmount');
    DOM.adminAddBtn = document.getElementById('adminAddBtn');
    DOM.adminRemoveBtn = document.getElementById('adminRemoveBtn');
    DOM.adminBadge = document.getElementById('adminBadge');
    DOM.currentUserDisplay = document.getElementById('currentUserDisplay');
    DOM.userIdDisplay = document.getElementById('userIdDisplay');
    DOM.progressiveStatus = document.getElementById('progressiveStatus');
    DOM.currentLevelDisplay = document.getElementById('currentLevelDisplay');
    DOM.currentPotDisplay = document.getElementById('currentPotDisplay');
    DOM.checkpointsContainer = document.getElementById('checkpointsContainer');
    DOM.toggleProgressiveBtn = document.getElementById('toggleProgressiveBtn');
    DOM.cashoutProgressiveBtn = document.getElementById('cashoutProgressiveBtn');
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
    DOM.jackpotAmount = document.getElementById('jackpotAmount');
    DOM.authForm = document.getElementById('authForm');
    DOM.userInfo = document.getElementById('userInfo');
    DOM.loginUsername = document.getElementById('loginUsername');
    DOM.loginPassword = document.getElementById('loginPassword');
    DOM.loginBtn = document.getElementById('loginBtn');
    DOM.signupBtn = document.getElementById('signupBtn');
    DOM.logoutBtn = document.getElementById('logoutBtn');
    DOM.userIdContainer = document.getElementById('userIdContainer');
    DOM.confirmDepositBtn = document.getElementById('confirmDepositBtn');
    DOM.cancelDepositBtn = document.getElementById('cancelDepositBtn');
    DOM.confirmWithdrawBtn = document.getElementById('confirmWithdrawBtn');
    DOM.cancelWithdrawBtn = document.getElementById('cancelWithdrawBtn');
    
    // Log that DOM is initialized
    log('✅ DOM initialized');
}

// ============================================================
//  MAIN UI UPDATE
// ============================================================

function updateUI() {
    if (!currentUserData) return;
    
    DOM.balance.innerText = currentUserData.balance.toFixed(2);
    DOM.bestStreak.innerText = currentUserData.bestStreak || 0;
    DOM.totalWagered.innerText = (currentUserData.totalWagered || 0).toFixed(2);
    DOM.winsCount.innerText = currentUserData.wins || 0;
    DOM.lossesCount.innerText = currentUserData.losses || 0;
    
    const total = (currentUserData.wins || 0) + (currentUserData.losses || 0);
    const winRate = total > 0 ? Math.round(((currentUserData.wins || 0) / total) * 100) : 0;
    DOM.winRate.innerText = winRate + '%';
    DOM.currentStreak.innerText = currentUserData.currentStreak || 0;
    
    if (!progressiveActive || progressiveLevel === 0) {
        DOM.betInput.max = currentUserData.balance;
    }
    
    DOM.userIdDisplay.innerText = currentUserData.id || currentUserData._id;
}

// ============================================================
//  NOTIFICATION SYSTEM
// ============================================================

function showNotification(msg, duration = 3000) {
    // Remove existing notifications
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
    DOM.headsBtn.classList.remove('selected');
    DOM.tailsBtn.classList.remove('selected');
    if (selectedChoice === 'heads') DOM.headsBtn.classList.add('selected');
    if (selectedChoice === 'tails') DOM.tailsBtn.classList.add('selected');
}

// ============================================================
//  GAME ENABLED STATE
// ============================================================

function setGameEnabled(enabled) {
    const disabled = !enabled || progressiveActive;
    
    DOM.betInput.disabled = disabled;
    DOM.headsBtn.disabled = disabled;
    DOM.tailsBtn.disabled = disabled;
    DOM.halfBtn.disabled = disabled;
    DOM.doubleBtn.disabled = disabled;
    DOM.maxBtn.disabled = disabled;
    DOM.flipBtn.disabled = disabled;
    DOM.depositBtn.disabled = !enabled;
    DOM.withdrawBtn.disabled = !enabled;
    
    DOM.result.innerHTML = enabled 
        ? 'Select HEADS or TAILS to start' 
        : 'Login to start playing!';
}

// ============================================================
//  AUTH UI
// ============================================================

function showAuthUI() {
    DOM.authForm.style.display = 'none';
    DOM.userInfo.style.display = 'block';
    DOM.currentUserDisplay.innerText = currentUser.username;
    DOM.userIdDisplay.innerText = currentUser.id;
    
    if (isAdmin) {
        DOM.adminBadge.style.display = 'inline-block';
        DOM.adminPanel.style.display = 'block';
        loadAdminUsers();
    }
}

function hideAuthUI() {
    DOM.authForm.style.display = 'block';
    DOM.userInfo.style.display = 'none';
    DOM.adminPanel.style.display = 'none';
    DOM.adminBadge.style.display = 'none';
    DOM.balance.innerText = '0.00';
}

// ============================================================
//  CELEBRATION EFFECTS
// ============================================================

function showWinCelebration(amount) {
    // Flash effect
    const flash = document.createElement('div');
    flash.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:radial-gradient(circle,rgba(250,204,21,0.3) 0%,rgba(168,85,247,0.1) 100%);animation:flashAnim 0.5s ease-out;pointer-events:none;z-index:99998;';
    const style = document.createElement('style');
    style.textContent = '@keyframes flashAnim{0%{opacity:1}100%{opacity:0}}';
    document.head.appendChild(style);
    document.body.appendChild(flash);
    setTimeout(() => { flash.remove(); style.remove(); }, 500);
    
    // Glow effect on coin area
    DOM.coinArea.classList.add('win-glow');
    setTimeout(() => DOM.coinArea.classList.remove('win-glow'), 800);
    
    showNotification(`🎉 WIN! Won ${amount.toFixed(2)}! 🎉`);
}

function showLossCelebration(amount) {
    DOM.coinArea.classList.add('lose-glow');
    setTimeout(() => DOM.coinArea.classList.remove('lose-glow'), 800);
    showNotification(`💀 LOSS! Lost ${amount.toFixed(2)}! 💀`);
}

// ============================================================
//  CLIPBOARD HELPERS
// ============================================================

function copyToClipboard(elementId) {
    const text = document.getElementById(elementId).innerText;
    if (!text) return;
    
    navigator.clipboard.writeText(text)
        .then(() => showNotification(`📋 Copied: ${text.substring(0, 20)}...`))
        .catch(() => {
            // Fallback
            const el = document.getElementById(elementId);
            const range = document.createRange();
            range.selectNode(el);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            document.execCommand('copy');
            showNotification(`📋 Copied: ${text.substring(0, 20)}...`);
        });
}

function copyUserId() {
    const userId = DOM.userIdDisplay.innerText;
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

// ----- EXPOSE GLOBALLY -----
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
