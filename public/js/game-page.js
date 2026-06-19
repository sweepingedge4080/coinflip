// ============================================================
//  GAME-PAGE.JS - Game Page Specific Logic (FIXED - No Redirect Loop)
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

        // ✅ Enable the game NOW
        if (typeof setGameEnabled === 'function') {
            setGameEnabled(true);
        }
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

// Override BEFORE app.js runs
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
//  ✅ Also override app.js initialization if needed
// ============================================================

// If app.js already loaded, prevent it from doing anything
if (window.initApp) {
    const originalInitApp = window.initApp;
    window.initApp = function() {
        console.log('🔒 App init overridden on game page');
        // Don't run the original app initialization
        return Promise.resolve();
    };
}

// ============================================================
//  ✅ Fix for auth.js redirect in login page
// ============================================================

// Also override the login page's session check to prevent redirect loop
if (window.location.pathname === '/login') {
    // If we're on the login page and have a token, don't auto-redirect
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
        console.log('🔒 Login page: Token exists, but not redirecting to game until user clicks login');
        // The login.js will handle the actual login flow
    }
}

console.log('🎰 Game page loaded successfully - redirect loop prevented');
