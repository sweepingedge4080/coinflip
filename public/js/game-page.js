// ============================================================
//  GAME-PAGE.JS - Game Page Specific Logic (FIXED - Forces Game Enabled)
// ============================================================

// ============================================================
//  DOM READY - Check Session and Initialize Game
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');

    if (!token || !userData) {
        // Not logged in, redirect to login
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

        // ✅ CRITICAL: Force enable the game with ALL game elements
        enableGameFully();

        // ✅ Force update UI
        if (typeof updateUI === 'function') {
            updateUI();
        }
        if (typeof renderCheckpoints === 'function') {
            renderCheckpoints();
        }

        // Show admin badge if admin (visual only - no panel)
        const adminBadge = document.getElementById('adminBadge');
        if (adminBadge) {
            adminBadge.style.display = isAdmin ? 'inline-block' : 'none';
        }

        console.log(`✅ Welcome back, ${user.username}!`);
        console.log('🎮 Game enabled successfully');

    } catch (e) {
        console.error('❌ Error parsing user data:', e);
        // Clear invalid data and redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        sessionStorage.removeItem('authToken');
        window.location.href = '/login';
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

    // ✅ Directly enable each element
    if (elements.betInput) {
        elements.betInput.disabled = false;
        elements.betInput.style.opacity = '1';
        elements.betInput.style.cursor = 'text';
    }
    
    if (elements.headsBtn) {
        elements.headsBtn.disabled = false;
        elements.headsBtn.style.opacity = '1';
        elements.headsBtn.style.cursor = 'pointer';
    }
    
    if (elements.tailsBtn) {
        elements.tailsBtn.disabled = false;
        elements.tailsBtn.style.opacity = '1';
        elements.tailsBtn.style.cursor = 'pointer';
    }
    
    if (elements.flipBtn) {
        elements.flipBtn.disabled = false;
        elements.flipBtn.style.opacity = '1';
        elements.flipBtn.style.cursor = 'pointer';
    }
    
    if (elements.halfBtn) {
        elements.halfBtn.disabled = false;
        elements.halfBtn.style.opacity = '1';
        elements.halfBtn.style.cursor = 'pointer';
    }
    
    if (elements.doubleBtn) {
        elements.doubleBtn.disabled = false;
        elements.doubleBtn.style.opacity = '1';
        elements.doubleBtn.style.cursor = 'pointer';
    }
    
    if (elements.maxBtn) {
        elements.maxBtn.disabled = false;
        elements.maxBtn.style.opacity = '1';
        elements.maxBtn.style.cursor = 'pointer';
    }
    
    if (elements.depositBtn) {
        elements.depositBtn.disabled = false;
        elements.depositBtn.style.opacity = '1';
        elements.depositBtn.style.cursor = 'pointer';
    }
    
    if (elements.withdrawBtn) {
        elements.withdrawBtn.disabled = false;
        elements.withdrawBtn.style.opacity = '1';
        elements.withdrawBtn.style.cursor = 'pointer';
    }
    
    if (elements.toggleProgressive) {
        elements.toggleProgressive.disabled = false;
        elements.toggleProgressive.style.opacity = '1';
        elements.toggleProgressive.style.cursor = 'pointer';
    }
    
    if (elements.cashoutProgressive) {
        elements.cashoutProgressive.disabled = true; // Only enabled when progressive active
        elements.cashoutProgressive.style.opacity = '0.5';
    }
    
    if (elements.result) {
        elements.result.innerHTML = 'Select HEADS or TAILS to start';
        elements.result.style.color = '#e2e8f0';
    }

    // ✅ Also override the setGameEnabled function to prevent disabling
    if (typeof window.setGameEnabled === 'function') {
        const originalSetGameEnabled = window.setGameEnabled;
        window.setGameEnabled = function(enabled) {
            console.log(`🔒 setGameEnabled called with ${enabled} - FORCING ENABLED`);
            // Always force enabled
            enableGameFully();
        };
    }

    console.log('✅ Game fully enabled!');
}

// ============================================================
//  LOGOUT
// ============================================================

const logoutBtn = document.getElementById('gameLogoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear all storage
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            sessionStorage.removeItem('authToken');

            // Redirect to home
            window.location.href = '/';
        }
    });
}

// ============================================================
//  ✅ COMPLETELY OVERRIDE checkSession to prevent redirect loop
// ============================================================

window.checkSession = function() {
    console.log('🔒 Session check overridden on game page - returning true');
    return Promise.resolve(true);
};

// ============================================================
//  ✅ OVERRIDE auth UI functions
// ============================================================

window.showAuthUI = function() {
    console.log('🔒 showAuthUI suppressed on game page');
};

window.hideAuthUI = function() {
    console.log('🔒 hideAuthUI suppressed on game page');
};

// ============================================================
//  ✅ OVERRIDE setGameEnabled to prevent disabling
// ============================================================

if (typeof window.setGameEnabled === 'function') {
    const originalSetGameEnabled = window.setGameEnabled;
    window.setGameEnabled = function(enabled) {
        console.log(`🔒 setGameEnabled called with ${enabled} - FORCING ENABLED`);
        // Always force enabled
        enableGameFully();
    };
}

// ============================================================
//  ✅ Also override app.js initialization if needed
// ============================================================

if (window.initApp) {
    const originalInitApp = window.initApp;
    window.initApp = function() {
        console.log('🔒 App init overridden on game page');
        // Force enable game
        enableGameFully();
        return Promise.resolve();
    };
}

// ============================================================
//  ✅ Fix for auth.js redirect in login page
// ============================================================

if (window.location.pathname === '/login') {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
        console.log('🔒 Login page: Token exists, but not redirecting to game until user clicks login');
    }
}

console.log('🎰 Game page loaded successfully - redirect loop prevented');
