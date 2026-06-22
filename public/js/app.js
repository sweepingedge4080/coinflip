// ============================================================
//  APP.JS - Main Application Controller
//  CoinFlip Casino v2.0.0
// ============================================================

// ============================================================
//  GLOBAL STATE
// ============================================================

window.currentUser = null;
window.currentUserData = null;
window.token = null;
window.progressiveActive = false;
window.gameState = {
    isFlipping: false,
    currentBet: 1,
    selectedChoice: null,
    history: []
};

// ============================================================
//  DOM REFERENCES
// ============================================================

let DOM = {};

function initDOM() {
    DOM = {
        // Auth elements
        userInfo: document.getElementById('userInfo'),
        loginBtn: document.getElementById('loginBtn'),
        signupBtn: document.getElementById('signupBtn'),
        logoutBtn: document.getElementById('logoutBtn'),
        loginForm: document.getElementById('loginForm'),
        signupForm: document.getElementById('signupForm'),
        loginUsername: document.getElementById('loginUsername'),
        loginPassword: document.getElementById('loginPassword'),
        signupUsername: document.getElementById('signupUsername'),
        signupPassword: document.getElementById('signupPassword'),
        signupConfirmPassword: document.getElementById('signupConfirmPassword'),
        
        // Game elements
        balanceDisplay: document.getElementById('balanceDisplay'),
        betAmount: document.getElementById('betAmount'),
        headsBtn: document.getElementById('headsBtn'),
        tailsBtn: document.getElementById('tailsBtn'),
        flipBtn: document.getElementById('flipBtn'),
        resultDisplay: document.getElementById('resultDisplay'),
        
        // Progressive elements
        progressiveToggle: document.getElementById('progressiveToggle'),
        progressiveCashout: document.getElementById('progressiveCashout'),
        progressivePot: document.getElementById('progressivePot'),
        progressiveLevel: document.getElementById('progressiveLevel'),
        progressiveMultiplier: document.getElementById('progressiveMultiplier'),
        progressiveStatus: document.getElementById('progressiveStatus'),
        progressiveContainer: document.getElementById('progressiveContainer'),
        progressiveBetDisplay: document.getElementById('progressiveBetDisplay'),
        progressiveModeIndicator: document.getElementById('progressiveModeIndicator'),
        progressiveBustOverlay: document.getElementById('progressiveBustOverlay'),
        
        // Bet controls
        halfBet: document.getElementById('halfBet'),
        doubleBet: document.getElementById('doubleBet'),
        maxBet: document.getElementById('maxBet'),
        
        // Stats
        winsDisplay: document.getElementById('winsDisplay'),
        lossesDisplay: document.getElementById('lossesDisplay'),
        streakDisplay: document.getElementById('streakDisplay'),
        bestStreakDisplay: document.getElementById('bestStreakDisplay'),
        levelDisplay: document.getElementById('levelDisplay'),
        xpDisplay: document.getElementById('xpDisplay'),
        xpProgress: document.getElementById('xpProgress'),
        
        // Modals
        modalOverlay: document.getElementById('modalOverlay'),
        modalContent: document.getElementById('modalContent'),
        modalClose: document.getElementById('modalClose'),
        
        // Notifications
        notification: document.getElementById('notification'),
        
        // Console
        consoleLog: document.getElementById('consoleLog')
    };
    
    console.log('✅ DOM initialized');
    
    // Log any missing elements
    const missingElements = Object.entries(DOM)
        .filter(([key, value]) => value === null)
        .map(([key]) => key);
    
    if (missingElements.length > 0) {
        console.warn('⚠️ Some DOM elements not found:', missingElements.join(', '));
    }
}

// ============================================================
//  APP INITIALIZATION
// ============================================================

function initApp() {
    console.log('🔄 Initializing CoinFlip Casino v2.0.0');
    
    // Initialize DOM references
    initDOM();
    
    // Setup all listeners
    setupAuthListeners();
    setupLogoutListener();
    setupModalListeners();
    setupProgressiveListeners();
    setupBetInputValidation();
    setupGameListeners();
    setupEventListeners();
    setupKeyboardShortcuts();
    
    // Apply mobile detection
    applyMobileDetection();
    
    // Check for existing session
    const hasSession = checkSession();
    
    // If no session and not on login/landing page, redirect
    const currentPage = window.location.pathname;
    if (!hasSession && currentPage !== '/login.html' && currentPage !== '/landing.html' && currentPage !== '/') {
        console.log('🔒 No session found, redirecting to landing page');
        window.location.href = '/landing.html';
        return;
    }
    
    // Initialize progressive system
    initProgressiveSystem();
    
    // Render initial UI
    renderUI();
    
    // Log keyboard shortcuts
    logMessage('⌨️ Keyboard shortcuts enabled: 1=Heads, 2=Tails, Space=Flip, H=Half, D=Double, M=Max, P=Progressive, C=Cashout');
    logMessage('📈 Progressive Multipliers: 2x, 3x, 5x, 8x, 13x, 21x, 34x, 55x');
    logMessage('🏆 Max Level: 8 (55x)');
    logMessage('🚀 CoinFlip Casino is ready!');
    
    if (hasSession) {
        logMessage('👤 Session restored');
    }
}

// ============================================================
//  DOM READY CHECK
// ============================================================

function startApp() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
}

// ============================================================
//  RENDER UI
// ============================================================

function renderUI() {
    const user = window.currentUser;
    
    if (user) {
        updateUIForLoggedInUser(user);
    } else {
        resetUIForLoggedOutUser();
    }
    
    // Update game UI
    updateGameUI();
    
    console.log('✅ Initial UI rendered');
}

function updateGameUI() {
    const user = window.currentUser;
    const balanceDisplay = document.getElementById('balanceDisplay');
    
    if (user && user.balance !== undefined && balanceDisplay) {
        balanceDisplay.textContent = `$${user.balance.toFixed(2)}`;
    }
    
    // Update stats if available
    if (user) {
        updateStats(user);
    }
}

function updateStats(user) {
    const winsDisplay = document.getElementById('winsDisplay');
    const lossesDisplay = document.getElementById('lossesDisplay');
    const streakDisplay = document.getElementById('streakDisplay');
    const bestStreakDisplay = document.getElementById('bestStreakDisplay');
    const levelDisplay = document.getElementById('levelDisplay');
    const xpDisplay = document.getElementById('xpDisplay');
    const xpProgress = document.getElementById('xpProgress');
    
    if (winsDisplay) winsDisplay.textContent = user.wins || 0;
    if (lossesDisplay) lossesDisplay.textContent = user.losses || 0;
    if (streakDisplay) streakDisplay.textContent = user.currentStreak || 0;
    if (bestStreakDisplay) bestStreakDisplay.textContent = user.bestStreak || 0;
    if (levelDisplay) levelDisplay.textContent = user.level || 1;
    if (xpDisplay) {
        const currentXP = user.xp || 0;
        const nextLevelXP = (user.level || 1) * 100;
        xpDisplay.textContent = `${currentXP}/${nextLevelXP}`;
    }
    if (xpProgress) {
        const currentXP = user.xp || 0;
        const nextLevelXP = (user.level || 1) * 100;
        const percentage = Math.min((currentXP / nextLevelXP) * 100, 100);
        xpProgress.style.width = `${percentage}%`;
    }
}

// ============================================================
//  SESSION MANAGEMENT
// ============================================================

function checkSession() {
    console.log('📡 Checking saved session...');
    
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
        try {
            const user = JSON.parse(userData);
            window.currentUser = user;
            window.currentUserData = user;
            window.token = token;
            
            // Set auth header for API calls
            if (window.api && window.api.defaults) {
                window.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
            
            if (window.axios) {
                window.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
            
            console.log('✅ Session restored for:', user.username);
            
            // Update UI
            updateUIForLoggedInUser(user);
            
            // Verify token is still valid
            verifyToken(token);
            
            // Load user stats
            loadUserStats();
            
            return true;
        } catch (error) {
            console.error('❌ Error parsing user data:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userData');
            return false;
        }
    }
    
    console.log('ℹ️ No saved session found');
    return false;
}

// ============================================================
//  VERIFY TOKEN
// ============================================================

async function verifyToken(token) {
    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            console.warn('⚠️ Token verification failed, logging out');
            logoutUser();
            return false;
        }
        
        const user = await response.json();
        console.log('✅ Token verified for:', user.username);
        
        // Update user data if changed
        if (user.balance !== undefined) {
            window.currentUser.balance = user.balance;
            window.currentUserData.balance = user.balance;
            
            const balanceDisplay = document.getElementById('balanceDisplay');
            if (balanceDisplay) {
                balanceDisplay.textContent = `$${user.balance.toFixed(2)}`;
            }
            
            // Update stored user data
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            storedUser.balance = user.balance;
            localStorage.setItem('user', JSON.stringify(storedUser));
        }
        
        return true;
    } catch (error) {
        console.error('❌ Token verification error:', error);
        return false;
    }
}

// ============================================================
//  LOAD USER STATS
// ============================================================

async function loadUserStats() {
    if (!window.token) return;
    
    try {
        const response = await fetch('/api/game/stats', {
            headers: {
                'Authorization': `Bearer ${window.token}`
            }
        });
        
        if (!response.ok) {
            console.warn('⚠️ Failed to load user stats');
            return;
        }
        
        const data = await response.json();
        
        // Update user data
        if (window.currentUser) {
            Object.assign(window.currentUser, data);
            window.currentUserData = window.currentUser;
            
            // Update stored user data
            localStorage.setItem('user', JSON.stringify(window.currentUser));
            
            // Update UI
            updateStats(window.currentUser);
            updateGameUI();
        }
        
        console.log('✅ User stats loaded');
    } catch (error) {
        console.error('❌ Error loading user stats:', error);
    }
}

// ============================================================
//  PROGRESSIVE SYSTEM INITIALIZATION
// ============================================================

function initProgressiveSystem() {
    console.log('🎯 Initializing progressive system...');
    
    // Set up the progressive listeners if available
    if (window.setupProgressiveListeners) {
        window.setupProgressiveListeners();
    }
    
    // Display progressive multipliers
    const multipliers = [2, 3, 5, 8, 13, 21, 34, 55];
    console.log(`📈 Progressive Multipliers: ${multipliers.join('x, ')}x`);
    console.log(`🏆 Max Level: ${multipliers.length} (${multipliers[multipliers.length-1]}x)`);
}

// ============================================================
//  EVENT LISTENERS SETUP
// ============================================================

function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Window events
    window.addEventListener('beforeunload', function() {
        console.log('🔄 Page unloading...');
    });
    
    window.addEventListener('online', function() {
        console.log('🌐 Connection restored');
        showNotification('Connection restored', 'success');
    });
    
    window.addEventListener('offline', function() {
        console.log('🌐 Connection lost');
        showNotification('Connection lost!', 'error');
    });
    
    console.log('✅ Event listeners setup complete');
}

// ============================================================
//  KEYBOARD SHORTCUTS
// ============================================================

function setupKeyboardShortcuts() {
    console.log('⌨️ Setting up keyboard shortcuts...');
    
    document.addEventListener('keydown', function(e) {
        // Don't trigger if typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch(e.key.toLowerCase()) {
            case '1':
                if (DOM.headsBtn) DOM.headsBtn.click();
                e.preventDefault();
                break;
            case '2':
                if (DOM.tailsBtn) DOM.tailsBtn.click();
                e.preventDefault();
                break;
            case ' ':
                e.preventDefault();
                if (DOM.flipBtn) DOM.flipBtn.click();
                break;
            case 'h':
                if (DOM.halfBet) DOM.halfBet.click();
                break;
            case 'd':
                if (DOM.doubleBet) DOM.doubleBet.click();
                break;
            case 'm':
                if (DOM.maxBet) DOM.maxBet.click();
                break;
            case 'p':
                if (DOM.progressiveToggle) DOM.progressiveToggle.click();
                break;
            case 'c':
                if (DOM.progressiveCashout && !DOM.progressiveCashout.disabled) {
                    DOM.progressiveCashout.click();
                }
                break;
        }
    });
    
    console.log('✅ Keyboard shortcuts enabled');
}

// ============================================================
//  BET INPUT VALIDATION
// ============================================================

function setupBetInputValidation() {
    const betInput = DOM.betAmount;
    if (!betInput) return;
    
    betInput.addEventListener('blur', function() {
        let value = parseFloat(this.value);
        if (isNaN(value) || value < 0.01) {
            this.value = '0.01';
        }
        if (window.currentUser && value > window.currentUser.balance) {
            this.value = window.currentUser.balance.toFixed(2);
            showNotification('Bet cannot exceed balance', 'warning');
        }
    });
    
    betInput.addEventListener('input', function() {
        let value = parseFloat(this.value);
        if (!isNaN(value) && value > 0) {
            window.gameState.currentBet = value;
        }
    });
    
    console.log('✅ Bet input validation setup complete');
}

// ============================================================
//  GAME LISTENERS SETUP
// ============================================================

function setupGameListeners() {
    console.log('🔧 Setting up game listeners...');
    
    // Heads button
    if (DOM.headsBtn) {
        DOM.headsBtn.addEventListener('click', function() {
            window.gameState.selectedChoice = 'heads';
            playGame('heads');
        });
    }
    
    // Tails button
    if (DOM.tailsBtn) {
        DOM.tailsBtn.addEventListener('click', function() {
            window.gameState.selectedChoice = 'tails';
            playGame('tails');
        });
    }
    
    // Flip button (random)
    if (DOM.flipBtn) {
        DOM.flipBtn.addEventListener('click', function() {
            const choice = Math.random() < 0.5 ? 'heads' : 'tails';
            window.gameState.selectedChoice = choice;
            playGame(choice);
        });
    }
    
    // Bet controls
    if (DOM.halfBet) {
        DOM.halfBet.addEventListener('click', function() {
            if (window.progressiveActive) {
                showNotification('Cannot change bet in progressive mode', 'warning');
                return;
            }
            const current = parseFloat(DOM.betAmount.value) || 1;
            const half = Math.max(0.01, current / 2);
            DOM.betAmount.value = half.toFixed(2);
            window.gameState.currentBet = half;
        });
    }
    
    if (DOM.doubleBet) {
        DOM.doubleBet.addEventListener('click', function() {
            if (window.progressiveActive) {
                showNotification('Cannot change bet in progressive mode', 'warning');
                return;
            }
            const current = parseFloat(DOM.betAmount.value) || 1;
            const doubled = current * 2;
            if (window.currentUser && doubled > window.currentUser.balance) {
                DOM.betAmount.value = window.currentUser.balance.toFixed(2);
                showNotification('Bet limited to balance', 'warning');
            } else {
                DOM.betAmount.value = doubled.toFixed(2);
            }
            window.gameState.currentBet = parseFloat(DOM.betAmount.value);
        });
    }
    
    if (DOM.maxBet) {
        DOM.maxBet.addEventListener('click', function() {
            if (window.progressiveActive) {
                showNotification('Cannot change bet in progressive mode', 'warning');
                return;
            }
            if (window.currentUser && window.currentUser.balance) {
                DOM.betAmount.value = window.currentUser.balance.toFixed(2);
                window.gameState.currentBet = window.currentUser.balance;
            }
        });
    }
    
    console.log('✅ Game listeners setup complete');
}

// ============================================================
//  GAME PLAY FUNCTION
// ============================================================

async function playGame(choice) {
    if (window.gameState.isFlipping) {
        console.log('⏳ Already flipping, please wait');
        return;
    }
    
    if (!window.currentUser) {
        showNotification('Please login first', 'error');
        window.location.href = '/login.html';
        return;
    }
    
    const betAmount = parseFloat(DOM.betAmount.value) || 1;
    
    if (betAmount > window.currentUser.balance) {
        showNotification('Insufficient balance!', 'error');
        return;
    }
    
    if (betAmount <= 0) {
        showNotification('Invalid bet amount!', 'error');
        return;
    }
    
    window.gameState.isFlipping = true;
    DOM.flipBtn.disabled = true;
    DOM.headsBtn.disabled = true;
    DOM.tailsBtn.disabled = true;
    
    try {
        // Check if progressive is active using the pot state
        const isProgressiveActive = window.isProgressiveActive ? window.isProgressiveActive() : false;
        
        const requestData = {
            betAmount: betAmount,
            choice: choice,
            progressiveStreak: isProgressiveActive ? (window.progressivePotState?.currentLevel || 0) : 0,
            originalBet: isProgressiveActive ? (window.progressivePotState?.isolatedBet || betAmount) : betAmount
        };
        
        console.log('📡 API Call: POST /api/game/flip');
        console.log('📤 Request data:', requestData);
        
        const response = await fetch('/api/game/flip', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.token}`
            },
            body: JSON.stringify(requestData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Game failed');
        }
        
        console.log('📊 Server response:', data);
        
        // Handle the result
        handleFlipResult(data, choice);
        
    } catch (error) {
        console.error('❌ Game error:', error);
        showNotification('Game error: ' + error.message, 'error');
    } finally {
        window.gameState.isFlipping = false;
        DOM.flipBtn.disabled = false;
        DOM.headsBtn.disabled = false;
        DOM.tailsBtn.disabled = false;
    }
}

// ============================================================
//  HANDLE FLIP RESULT
// ============================================================

function handleFlipResult(data, choice) {
    console.log('🎯 Handling flip result:', data);
    
    // Update balance
    if (data.newBalance !== undefined) {
        window.currentUser.balance = data.newBalance;
        window.currentUserData.balance = data.newBalance;
        
        // Update stored user data
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        storedUser.balance = data.newBalance;
        localStorage.setItem('user', JSON.stringify(storedUser));
        
        // Update UI
        const balanceDisplay = document.getElementById('balanceDisplay');
        if (balanceDisplay) {
            balanceDisplay.textContent = `$${data.newBalance.toFixed(2)}`;
        }
    }
    
    // Update stats
    if (data.stats) {
        updateStats(data.stats);
        // Update current user data
        Object.assign(window.currentUser, data.stats);
    }
    
    // Handle XP and level up
    if (data.xpGain) {
        logMessage(`✨ +${data.xpGain} XP`, 'success');
        if (data.leveledUp) {
            logMessage(`🎉 LEVEL UP! Now Level ${data.level}`, 'success');
            showNotification(`🎉 Level Up! You're now Level ${data.level}!`, 'success');
        }
        updateStats(window.currentUser);
    }
    
    // Show result animation
    showResult(data.isWin, data.result, data.winnings);
    
    // Handle progressive mode
    if (data.isWin) {
        // Check if progressive mode is active using the pot state
        if (window.isProgressiveActive && window.isProgressiveActive()) {
            handleProgressiveWin(data);
        }
    } else {
        // Loss - handle progressive bust if active
        if (window.isProgressiveActive && window.isProgressiveActive()) {
            handleProgressiveLoss(data);
        }
    }
    
    // Add to history
    addToHistory(data.isWin, data.result, data.winnings || 0, choice);
}

// ============================================================
//  PROGRESSIVE HANDLERS
// ============================================================

function handleProgressiveWin(data) {
    // Double-check progressive mode is active using the pot state
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
            const potValue = window.progressivePotState?.potValue || 0;
            logMessage(`Level ${level} reached! Pot: $${potValue.toFixed(2)}`);
            
            // Check if max level reached
            const maxLevel = 8;
            if (level >= maxLevel) {
                logMessage('🏆 MAX LEVEL REACHED! Auto-cashing out...', 'success');
                showNotification('🏆 MAX LEVEL! Auto-cashing out...', 'success');
                if (window.handleProgressiveCashout) {
                    setTimeout(() => {
                        window.handleProgressiveCashout();
                    }, 500);
                }
            }
        }
    }
}

function handleProgressiveLoss(data) {
    // Double-check progressive mode is active using the pot state
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
//  UI HELPERS
// ============================================================

function showResult(isWin, result, winnings) {
    const display = DOM.resultDisplay;
    if (!display) return;
    
    display.style.display = 'block';
    
    if (isWin) {
        display.className = 'result-display win';
        display.innerHTML = `🎉 WIN! ${result.toUpperCase()}! +$${winnings.toFixed(2)}`;
        logMessage(`🎉 Win! ${result.toUpperCase()}! +$${winnings.toFixed(2)}`, 'success');
    } else {
        display.className = 'result-display loss';
        display.innerHTML = `💀 LOSS! ${result.toUpperCase()}!`;
        logMessage(`💀 Loss! ${result.toUpperCase()}!`, 'error');
    }
    
    setTimeout(() => {
        display.className = 'result-display';
        display.style.display = 'none';
    }, 2000);
}

function addToHistory(isWin, result, winnings, choice) {
    const entry = {
        time: new Date().toLocaleTimeString(),
        choice: choice,
        result: result,
        isWin: isWin,
        winnings: winnings
    };
    
    window.gameState.history.unshift(entry);
    
    // Keep only last 50 entries
    if (window.gameState.history.length > 50) {
        window.gameState.history.pop();
    }
    
    // Update history display if exists
    const historyContainer = document.getElementById('historyContainer');
    if (historyContainer) {
        const entryElement = document.createElement('div');
        entryElement.className = `history-entry ${isWin ? 'win' : 'loss'}`;
        entryElement.textContent = `${entry.time} - ${entry.choice} → ${entry.result} ${isWin ? '✅' : '❌'} ${isWin ? '+$' + winnings.toFixed(2) : ''}`;
        historyContainer.prepend(entryElement);
        
        // Keep only last 20 entries
        while (historyContainer.children.length > 20) {
            historyContainer.removeChild(historyContainer.lastChild);
        }
    }
}

// ============================================================
//  MOBILE DETECTION
// ============================================================

function applyMobileDetection() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        document.body.classList.add('mobile');
        console.log('📱 Mobile mode activated');
    } else {
        document.body.classList.remove('mobile');
        console.log('💻 Desktop mode activated');
    }
    
    // Handle resize
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const isMobileNow = window.innerWidth <= 768;
            if (isMobileNow !== isMobile) {
                document.body.classList.toggle('mobile', isMobileNow);
                console.log(`📱 ${isMobileNow ? 'Mobile' : 'Desktop'} mode activated`);
            }
        }, 250);
    });
    
    console.log('✅ Mobile detection applied');
}

// ============================================================
//  LOG MESSAGE
// ============================================================

function logMessage(msg, type = 'info') {
    const consoleEl = DOM.consoleLog;
    if (!consoleEl) {
        console.log(`[${type.toUpperCase()}] ${msg}`);
        return;
    }
    
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString();
    entry.textContent = `[${time}] ${msg}`;
    consoleEl.appendChild(entry);
    consoleEl.scrollTop = consoleEl.scrollHeight;
    
    // Keep only last 50 entries
    while (consoleEl.children.length > 50) {
        consoleEl.removeChild(consoleEl.firstChild);
    }
}

// ============================================================
//  NOTIFICATION SYSTEM
// ============================================================

function showNotification(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    let notification = DOM.notification;
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 9999;
            max-width: 400px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            transform: translateX(120%);
        `;
        document.body.appendChild(notification);
        DOM.notification = notification;
    }
    
    const colors = {
        success: { bg: '#00cc88', text: '#fff' },
        error: { bg: '#ff4444', text: '#fff' },
        warning: { bg: '#ffaa00', text: '#1a1a2e' },
        info: { bg: '#4a90d9', text: '#fff' }
    };
    
    const color = colors[type] || colors.info;
    notification.style.backgroundColor = color.bg;
    notification.style.color = color.text;
    notification.textContent = message;
    notification.style.transform = 'translateX(0)';
    
    clearTimeout(notification._timeout);
    notification._timeout = setTimeout(() => {
        notification.style.transform = 'translateX(120%)';
    }, 3000);
}

// ============================================================
//  EXPOSE GLOBALLY
// ============================================================

window.app = {
    init: initApp,
    start: startApp,
    info: function() {
        console.log('📊 App Info:');
        console.log('  Version: v2.0.0');
        console.log('  User:', window.currentUser?.username || 'Not logged in');
        console.log('  Balance:', window.currentUser?.balance || 0);
        console.log('  Progressive Active:', window.progressiveActive);
        console.log('  Game State:', window.gameState);
        return 'App info logged to console';
    },
    status: function() {
        console.log('📊 App Status:');
        console.log('  ✅ DOM Initialized:', !!DOM.userInfo);
        console.log('  ✅ Session:', !!window.token);
        console.log('  ✅ User:', window.currentUser?.username || 'None');
        console.log('  ✅ Balance:', window.currentUser?.balance || 0);
        console.log('  ✅ Progressive:', window.isProgressiveActive ? window.isProgressiveActive() : false);
        return 'App status logged to console';
    },
    forceRefresh: function() {
        console.log('🔄 Force refreshing app...');
        loadUserStats();
        return 'App refreshed';
    }
};

// ============================================================
//  START THE APP
// ============================================================

// Auto-start when DOM is ready
startApp();

console.log('💡 Type __app.info() for app info, __app.status() for status, __app.forceRefresh() to refresh');
