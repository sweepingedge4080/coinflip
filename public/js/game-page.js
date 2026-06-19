// ============================================================
//  GAME-PAGE.JS - Game Page Specific Logic (FIXED - Force Enable)
// ============================================================

// ============================================================
//  DOM READY - Check Session and Initialize Game
// ============================================================

document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is logged in
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');

    if (!token || !userData) {
        console.log('🔒 No session found, redirecting to login');
        window.location.href = '/login';
        return;
    }

    try {
        const user = JSON.parse(userData);
        
        // Display username
        const displayEl = document.getElementById('currentUserDisplay');
        if (displayEl) {
            displayEl.textContent = user.username || 'Player';
        }

        // ✅ Force set global variables
        window.authToken = token;
        window.currentUser = user;
        window.currentUserData = user;
        window.isAdmin = user.isAdmin || false;

        // ✅ CRITICAL: Fetch fresh user data from server
        try {
            console.log('🔄 Fetching fresh user data from server...');
            const freshUser = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const freshData = await freshUser.json();
            
            if (freshData && freshData.balance !== undefined) {
                console.log(`💰 Balance from server: $${freshData.balance.toFixed(2)}`);
                currentUserData = freshData;
                user.balance = freshData.balance;
                localStorage.setItem('userData', JSON.stringify(user));
                window.currentUserData = freshData;
            }
        } catch (fetchError) {
            console.warn('⚠️ Could not fetch fresh user data:', fetchError);
        }

        // ✅ Force enable the game
        enableGameFully();

        // ✅ Start force enable interval (keeps buttons enabled)
        startForceEnableInterval();

        // ✅ Force update UI
        if (typeof updateUI === 'function') {
            updateUI();
        } else {
            updateUIDirect();
        }
        
        if (typeof renderCheckpoints === 'function') {
            renderCheckpoints();
        }

        // Show admin badge if admin
        const adminBadge = document.getElementById('adminBadge');
        if (adminBadge) {
            adminBadge.style.display = isAdmin ? 'inline-block' : 'none';
        }

        console.log(`✅ Welcome back, ${currentUserData.username || user.username}!`);
        console.log(`💰 Current balance: $${(currentUserData.balance || 0).toFixed(2)}`);
        console.log('🎮 Game enabled successfully');

    } catch (e) {
        console.error('❌ Error loading game:', e);
        showNotification('❌ Error loading game. Please refresh.');
    }
});

// ============================================================
//  ✅ FORCE ENABLE GAME - Direct DOM Manipulation
// ============================================================

function enableGameFully() {
    console.log('🔓 Force enabling game...');
    
    // Get all game elements
    const elements = {
        betInput: document.getElementById('betAmount'),
        headsBtn: document.getElementById('headsBtn'),
        tailsBtn: document.getElementById('tailsBtn'),
        flipBtn: document.getElementById('flipBtn'),
        halfBtn: document.getElementById('halfBtn'),
        doubleBtn: document.getElementById('doubleBtn'),
        maxBtn: document.getElementById('maxBtn'),
        depositBtn: document.getElementById('depositBtn'),
        withdrawBtn: document.getElementById('withdrawBtn'),
        result: document.getElementById('result'),
        toggleProgressive: document.getElementById('toggleProgressiveBtn'),
        cashoutProgressive: document.getElementById('cashoutProgressiveBtn')
    };

    // ✅ Enable bet input
    if (elements.betInput) {
        elements.betInput.disabled = false;
        elements.betInput.removeAttribute('disabled');
        elements.betInput.style.opacity = '1';
        elements.betInput.style.cursor = 'text';
        elements.betInput.style.pointerEvents = 'auto';
        if (currentUserData && currentUserData.balance > 0) {
            elements.betInput.max = currentUserData.balance;
        } else {
            elements.betInput.max = 999999;
        }
        if (parseFloat(elements.betInput.value) <= 0) {
            elements.betInput.value = '10';
        }
    }
    
    // ✅ Enable ALL buttons - using multiple methods to ensure it works
    const buttonIds = ['headsBtn', 'tailsBtn', 'flipBtn', 'halfBtn', 'doubleBtn', 'maxBtn', 'depositBtn', 'withdrawBtn', 'toggleProgressive'];
    buttonIds.forEach(id => {
        const el = elements[id];
        if (el) {
            el.disabled = false;
            el.removeAttribute('disabled');
            el.style.opacity = '1';
            el.style.cursor = 'pointer';
            el.style.pointerEvents = 'auto';
        }
    });
    
    // ✅ Cashout button
    if (elements.cashoutProgressive) {
        if (progressiveActive && progressiveLevel > 0) {
            elements.cashoutProgressive.disabled = false;
            elements.cashoutProgressive.removeAttribute('disabled');
            elements.cashoutProgressive.style.opacity = '1';
        } else {
            elements.cashoutProgressive.disabled = true;
            elements.cashoutProgressive.style.opacity = '0.5';
        }
    }
    
    if (elements.result) {
        elements.result.innerHTML = '🪙 Select HEADS or TAILS to start';
        elements.result.style.color = '#e2e8f0';
    }

    // ✅ Override setGameEnabled to always enable
    window.setGameEnabled = function(enabled) {
        console.log(`🔒 setGameEnabled called - FORCING ENABLED`);
        enableGameFully();
    };

    // ✅ Also update balance display
    updateUIDirect();

    console.log('✅ Game fully enabled!');
}

// ============================================================
//  ✅ START FORCE ENABLE INTERVAL
// ============================================================

let forceEnableInterval = null;

function startForceEnableInterval() {
    // Clear any existing interval
    if (forceEnableInterval) {
        clearInterval(forceEnableInterval);
    }
    
    // Run every 500ms to keep buttons enabled
    forceEnableInterval = setInterval(() => {
        // Only run if we're on the game page
        if (window.location.pathname === '/game') {
            // Re-enable all buttons
            const buttonIds = ['headsBtn', 'tailsBtn', 'flipBtn', 'halfBtn', 'doubleBtn', 'maxBtn', 'depositBtn', 'withdrawBtn', 'toggleProgressive'];
            buttonIds.forEach(id => {
                const el = document.getElementById(id);
                if (el && el.disabled === true) {
                    el.disabled = false;
                    el.removeAttribute('disabled');
                    el.style.opacity = '1';
                    el.style.cursor = 'pointer';
                    el.style.pointerEvents = 'auto';
                }
            });
            
            // Re-enable bet input
            const betInput = document.getElementById('betAmount');
            if (betInput && betInput.disabled === true) {
                betInput.disabled = false;
                betInput.removeAttribute('disabled');
                betInput.style.opacity = '1';
                betInput.style.cursor = 'text';
                betInput.style.pointerEvents = 'auto';
            }
        }
    }, 500);
}

// ============================================================
//  ✅ UPDATE UI DIRECTLY
// ============================================================

function updateUIDirect() {
    const balanceEl = document.getElementById('balance');
    if (balanceEl && currentUserData) {
        balanceEl.innerText = currentUserData.balance.toFixed(2);
    }
    
    const winsEl = document.getElementById('winsCount');
    if (winsEl && currentUserData) {
        winsEl.innerText = currentUserData.wins || 0;
    }
    
    const lossesEl = document.getElementById('lossesCount');
    if (lossesEl && currentUserData) {
        lossesEl.innerText = currentUserData.losses || 0;
    }
    
    const streakEl = document.getElementById('currentStreak');
    if (streakEl && currentUserData) {
        streakEl.innerText = currentUserData.currentStreak || 0;
    }
    
    const totalWageredEl = document.getElementById('totalWagered');
    if (totalWageredEl && currentUserData) {
        totalWageredEl.innerText = (currentUserData.totalWagered || 0).toFixed(2);
    }
    
    const bestStreakEl = document.getElementById('bestStreak');
    if (bestStreakEl && currentUserData) {
        bestStreakEl.innerText = currentUserData.bestStreak || 0;
    }
    
    // Calculate win rate
    const total = (currentUserData.wins || 0) + (currentUserData.losses || 0);
    const winRate = total > 0 ? Math.round(((currentUserData.wins || 0) / total) * 100) : 0;
    const winRateEl = document.getElementById('winRate');
    if (winRateEl) {
        winRateEl.innerText = winRate + '%';
    }
}

// ============================================================
//  LOGOUT
// ============================================================

const logoutBtn = document.getElementById('gameLogoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            if (forceEnableInterval) {
                clearInterval(forceEnableInterval);
                forceEnableInterval = null;
            }
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            sessionStorage.removeItem('authToken');
            window.location.href = '/';
        }
    });
}

// ============================================================
//  ✅ OVERRIDE FUNCTIONS
// ============================================================

window.checkSession = function() {
    console.log('🔒 Session check overridden on game page');
    return Promise.resolve(true);
};

window.showAuthUI = function() {
    console.log('🔒 showAuthUI suppressed on game page');
};

window.hideAuthUI = function() {
    console.log('🔒 hideAuthUI suppressed on game page');
};

if (window.initApp) {
    const originalInitApp = window.initApp;
    window.initApp = function() {
        console.log('🔒 App init overridden on game page');
        enableGameFully();
        startForceEnableInterval();
        return Promise.resolve();
    };
}

console.log('🎰 Game page loaded successfully');
console.log(`💰 Balance: $${(currentUserData ? currentUserData.balance : 0).toFixed(2)}`);
