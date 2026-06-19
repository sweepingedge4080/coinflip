// ============================================================
//  GAME-PAGE.JS - Game Page Specific Logic
//  (Handles logout, redirects, session checks)
// ============================================================

// ============================================================
//  CHECK SESSION ON LOAD
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');

    if (!token || !userData) {
        // Not logged in, redirect to login
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
            document.getElementById('adminPanel').style.display = 'block';
            document.getElementById('adminBadge').style.display = 'inline-block';
        }

        console.log(`✅ Welcome back, ${user.username}!`);

    } catch (e) {
        console.error('Error parsing user data:', e);
        window.location.href = '/login';
    }
});

// ============================================================
//  LOGOUT
// ============================================================

document.getElementById('gameLogoutBtn').addEventListener('click', function() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear all storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        sessionStorage.removeItem('authToken');

        // Redirect to home
        window.location.href = '/';
    }
});

// ============================================================
//  APP OVERRIDE - Prevent app.js from redirecting
// ============================================================

// Override the checkSession function in auth.js to prevent redirect
// This is a safe override since the game page handles its own session check
const originalCheckSession = window.checkSession;
window.checkSession = function() {
    // Do nothing - we already handle session in game-page.js
    console.log('🔒 Session check handled by game page');
    return Promise.resolve(true);
};

console.log('🎰 Game page loaded successfully');
