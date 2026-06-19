// ============================================================
//  GAME-PAGE.JS - Game Page Specific Logic
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

        // Show admin panel if admin
        if (user.isAdmin) {
            const adminPanel = document.getElementById('adminPanel');
            const adminBadge = document.getElementById('adminBadge');
            if (adminPanel) adminPanel.style.display = 'block';
            if (adminBadge) adminBadge.style.display = 'inline-block';
            console.log('👑 Admin mode enabled');
        }

        // ✅ Initialize the game after session is confirmed
        // This ensures all game functions are properly loaded
        if (typeof initGame === 'function') {
            initGame();
        } else {
            console.warn('⚠️ initGame function not found, game may not load properly');
        }

        console.log(`✅ Welcome back, ${user.username}!`);

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
//  ✅ PREVENT REDIRECT LOOP - Override checkSession
// ============================================================

// Override the checkSession function in auth.js to prevent redirect
// This is a safe override since the game page handles its own session check
if (typeof window.checkSession === 'function') {
    const originalCheckSession = window.checkSession;
    window.checkSession = function() {
        // Do nothing - we already handle session in game-page.js
        console.log('🔒 Session check handled by game page (override)');
        return Promise.resolve(true);
    };
} else {
    window.checkSession = function() {
        console.log('🔒 Session check handled by game page');
        return Promise.resolve(true);
    };
}

// ============================================================
//  ✅ PREVENT REDIRECT LOOP - Override showAuthUI and hideAuthUI
// ============================================================

// Override auth UI functions to prevent any redirect attempts
if (typeof window.showAuthUI === 'function') {
    const originalShowAuthUI = window.showAuthUI;
    window.showAuthUI = function() {
        // Don't do anything - we're already on the game page
        console.log('🔒 showAuthUI suppressed on game page');
    };
}

if (typeof window.hideAuthUI === 'function') {
    const originalHideAuthUI = window.hideAuthUI;
    window.hideAuthUI = function() {
        // Don't do anything - we're already on the game page
        console.log('🔒 hideAuthUI suppressed on game page');
    };
}

// ============================================================
//  GAME LOG (Remove win chance log)
// ============================================================

console.log('🎰 Game page loaded successfully');
console.log('🪙 CoinFlip Casino v2.0.0');

// ============================================================
//  ERROR HANDLING - Catch any unhandled errors
// ============================================================

window.addEventListener('error', function(e) {
    console.error('⚠️ Unhandled error on game page:', e.message);
    // Don't redirect - just log the error
});
