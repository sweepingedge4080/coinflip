// ============================================================
//  GAME-PAGE.JS - ULTIMATE FORCE ENABLE
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

        // ✅ Fetch fresh user data
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

        // ✅ Update UI with balance
        const balanceEl = document.getElementById('balance');
        if (balanceEl && currentUserData) {
            balanceEl.innerText = currentUserData.balance.toFixed(2);
        }

        // ✅ Start the force enable interval (runs every 500ms)
        startForceEnable();

        // ✅ Also run it immediately
        forceEnableAll();

        // Show admin badge if admin
        const adminBadge = document.getElementById('adminBadge');
        if (adminBadge) {
            adminBadge.style.display = isAdmin ? 'inline-block' : 'none';
        }

        console.log(`✅ Welcome back, ${currentUserData.username || user.username}!`);
        console.log(`💰 Current balance: $${(currentUserData.balance || 0).toFixed(2)}`);
        console.log('🎮 Force enable started');

    } catch (e) {
        console.error('❌ Error loading game:', e);
    }
});

// ============================================================
//  ✅ FORCE ENABLE ALL CONTROLS - ULTIMATE VERSION
// ============================================================

function forceEnableAll() {
    // All button IDs that need to be enabled
    const allIds = [
        'betAmount',
        'headsBtn', 
        'tailsBtn',
        'flipBtn',
        'halfBtn',
        'doubleBtn',
        'maxBtn',
        'depositBtn',
        'withdrawBtn',
        'toggleProgressiveBtn'
    ];
    
    let enabledCount = 0;
    
    allIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            // Remove ALL disabling attributes
            el.disabled = false;
            el.removeAttribute('disabled');
            el.removeAttribute('aria-disabled');
            el.removeAttribute('inert');
            
            // Force styles
            el.style.setProperty('opacity', '1', 'important');
            el.style.setProperty('pointer-events', 'auto', 'important');
            el.style.setProperty('cursor', 'pointer', 'important');
            
            // Remove any disabling classes
            el.classList.remove('disabled', 'inactive', 'dimmed', 'locked', 'opacity-50', 'pointer-events-none');
            
            enabledCount++;
        }
    });
    
    // Special handling for bet input
    const betInput = document.getElementById('betAmount');
    if (betInput) {
        betInput.disabled = false;
        betInput.removeAttribute('disabled');
        betInput.style.setProperty('opacity', '1', 'important');
        betInput.style.setProperty('pointer-events', 'auto', 'important');
        betInput.style.setProperty('cursor', 'text', 'important');
        betInput.classList.remove('disabled', 'inactive', 'dimmed', 'locked');
        if (currentUserData && currentUserData.balance > 0) {
            betInput.max = currentUserData.balance;
            if (parseFloat(betInput.value) <= 0 || isNaN(parseFloat(betInput.value))) {
                betInput.value = '10';
            }
        }
    }
    
    // ✅ CRITICAL: Find and fix ALL parent containers that might have pointer-events: none
    // Check the entire game container and all its children
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        // Remove pointer-events: none from the game container
        gameContainer.style.setProperty('pointer-events', 'auto', 'important');
        
        // Find all elements with pointer-events: none inside the game container
        const blockedElements = gameContainer.querySelectorAll('*');
        blockedElements.forEach(el => {
            const computedStyle = window.getComputedStyle(el);
            if (computedStyle.pointerEvents === 'none') {
                console.log(`🔓 Found blocked element: ${el.tagName}.${el.className} - removing pointer-events: none`);
                el.style.setProperty('pointer-events', 'auto', 'important');
            }
        });
    }
    
    // Also check specific containers
    const containerSelectors = [
        '.game-container',
        '.bet-panel',
        '.choice-buttons',
        '.action-buttons',
        '.banking-panel',
        '.progressive-panel',
        '.coin-area',
        '.stats',
        '.game-header',
        '.auth-panel'
    ];
    
    containerSelectors.forEach(selector => {
        const containers = document.querySelectorAll(selector);
        containers.forEach(container => {
            container.style.setProperty('pointer-events', 'auto', 'important');
        });
    });
    
    // ✅ ALSO check for any overlay that might be blocking clicks
    const overlays = document.querySelectorAll('.overlay, .modal, .level-up-overlay, .big-loss-overlay');
    overlays.forEach(overlay => {
        if (overlay.style.display === 'none' || overlay.style.display === '') {
            overlay.style.setProperty('pointer-events', 'none', 'important');
        }
    });
    
    // Update result text
    const result = document.getElementById('result');
    if (result) {
        result.innerHTML = '🪙 Select HEADS or TAILS to start';
        result.style.color = '#e2e8f0';
    }
    
    if (enabledCount > 0) {
        console.log(`🔓 Force enabled ${enabledCount} controls`);
    }
}

// ============================================================
//  ✅ START FORCE ENABLE INTERVAL
// ============================================================

let forceEnableInterval = null;

function startForceEnable() {
    // Clear any existing interval
    if (forceEnableInterval) {
        clearInterval(forceEnableInterval);
        forceEnableInterval = null;
    }
    
    // Run every 500ms to keep buttons enabled
    forceEnableInterval = setInterval(function() {
        // Only run on game page
        if (window.location.pathname === '/game') {
            forceEnableAll();
        }
    }, 500);
    
    console.log('🔓 Force enable interval started (every 500ms)');
}

// ============================================================
//  LOGOUT
// ============================================================

const logoutBtn = document.getElementById('gameLogoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear the interval
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
//  ✅ OVERRIDE setGameEnabled to prevent disabling
// ============================================================

// Override the global setGameEnabled function
window.setGameEnabled = function(enabled) {
    console.log('🔒 setGameEnabled called - IGNORING and forcing enabled');
    forceEnableAll();
    return true;
};

// Also override app.js init
if (window.initApp) {
    const originalInitApp = window.initApp;
    window.initApp = function() {
        console.log('🔒 App init overridden - forcing enable');
        forceEnableAll();
        startForceEnable();
        return Promise.resolve();
    };
}

// Override checkSession
window.checkSession = function() {
    console.log('🔒 Session check overridden');
    return Promise.resolve(true);
};

console.log('🎰 Game page loaded - force enable active');
console.log(`💰 Balance: $${(currentUserData ? currentUserData.balance : 0).toFixed(2)}`);
