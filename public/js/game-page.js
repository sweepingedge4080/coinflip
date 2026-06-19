// ============================================================
//  GAME-PAGE.JS - Game Page Specific Logic (FIXED)
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

        // ✅ Set game data FIRST
        currentUser = user;
        currentUserData = user;
        authToken = token;
        isAdmin = user.isAdmin || false;

        // ✅ Enable the game NOW (before app.js runs)
        setGameEnabled(true);
        updateUI();
        renderCheckpoints();

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

window.checkSession = function() {
    console.log('🔒 Session check handled by game page (override)');
    return Promise.resolve(true);
};

// ============================================================
//  ✅ OVERRIDE showAuthUI and hideAuthUI
// ============================================================

window.showAuthUI = function() {
    console.log('🔒 showAuthUI suppressed on game page');
};

window.hideAuthUI = function() {
    console.log('🔒 hideAuthUI suppressed on game page');
};

// ============================================================
//  GAME LOG
// ============================================================

console.log('🎰 Game page loaded successfully');
console.log('🪙 CoinFlip Casino v2.0.0');

// ============================================================
//  ERROR HANDLING
// ============================================================

window.addEventListener('error', function(e) {
    console.error('⚠️ Unhandled error on game page:', e.message);
});
