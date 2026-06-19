// ============================================================
//  GAME-PAGE.JS - ULTIMATE FORCE (Inline Styles)
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

        // ✅ ULTIMATE FORCE - Inline styles + remove all barriers
        ultimateForceEnable();

        // ✅ Update UI
        updateAllUI();

        // ✅ Start keep-alive
        startKeepAlive();

        // Show admin badge if admin
        const adminBadge = document.getElementById('adminBadge');
        if (adminBadge) {
            adminBadge.style.display = isAdmin ? 'inline-block' : 'none';
        }

        console.log(`✅ Welcome back, ${currentUserData.username || user.username}!`);
        console.log(`💰 Current balance: $${(currentUserData.balance || 0).toFixed(2)}`);
        console.log('🎮 Game enabled successfully');

        // ✅ Extra force after 1 second
        setTimeout(ultimateForceEnable, 1000);
        setTimeout(ultimateForceEnable, 3000);

    } catch (e) {
        console.error('❌ Error loading game:', e);
    }
});

// ============================================================
//  ✅ ULTIMATE FORCE ENABLE - INLINE STYLES
// ============================================================

function ultimateForceEnable() {
    console.log('🔓 ULTIMATE FORCE enabling all controls...');
    
    // All button IDs
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
        'toggleProgressiveBtn',
        'cashoutProgressiveBtn'
    ];
    
    allIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            // ✅ REMOVE ALL ATTRIBUTES that could block clicks
            el.disabled = false;
            el.removeAttribute('disabled');
            el.removeAttribute('aria-disabled');
            el.removeAttribute('inert');
            
            // ✅ FORCE INLINE STYLES (highest priority)
            el.style.setProperty('opacity', '1', 'important');
            el.style.setProperty('pointer-events', 'auto', 'important');
            el.style.setProperty('cursor', 'pointer', 'important');
            el.style.setProperty('display', 'block', 'important');
            el.style.setProperty('visibility', 'visible', 'important');
            el.style.setProperty('user-select', 'none', 'important');
            
            // ✅ Remove any class that might be disabling
            el.classList.remove('disabled', 'inactive', 'dimmed', 'locked');
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
        betInput.style.setProperty('display', 'block', 'important');
        betInput.style.setProperty('visibility', 'visible', 'important');
        betInput.classList.remove('disabled', 'inactive', 'dimmed', 'locked');
        
        if (currentUserData && currentUserData.balance > 0) {
            betInput.max = currentUserData.balance;
            if (parseFloat(betInput.value) <= 0) {
                betInput.value = '10';
            }
        }
    }
    
    // ✅ Fix parent containers that might have pointer-events: none
    const containers = document.querySelectorAll('.game-container, .bet-panel, .choice-buttons, .action-buttons, .banking-panel');
    containers.forEach(container => {
        container.style.setProperty('pointer-events', 'auto', 'important');
    });
    
    // Result text
    const result = document.getElementById('result');
    if (result) {
        result.innerHTML = '🪙 Select HEADS or TAILS to start';
        result.style.color = '#e2e8f0';
    }
    
    console.log('✅ ULTIMATE FORCE complete');
}

// ============================================================
//  ✅ UPDATE ALL UI
// ============================================================

function updateAllUI() {
    if (!currentUserData) {
        console.warn('⚠️ No user data');
        return;
    }
    
    const balanceEl = document.getElementById('balance');
    if (balanceEl) {
        balanceEl.innerText = currentUserData.balance.toFixed(2);
    }
    
    const winsEl = document.getElementById('winsCount');
    if (winsEl) {
        winsEl.innerText = currentUserData.wins || 0;
    }
    
    const lossesEl = document.getElementById('lossesCount');
    if (lossesEl) {
        lossesEl.innerText = currentUserData.losses || 0;
    }
    
    const streakEl = document.getElementById('currentStreak');
    if (streakEl) {
        streakEl.innerText = currentUserData.currentStreak || 0;
    }
    
    const totalWageredEl = document.getElementById('totalWagered');
    if (totalWageredEl) {
        totalWageredEl.innerText = (currentUserData.totalWagered || 0).toFixed(2);
    }
    
    const bestStreakEl = document.getElementById('bestStreak');
    if (bestStreakEl) {
        bestStreakEl.innerText = currentUserData.bestStreak || 0;
    }
    
    const total = (currentUserData.wins || 0) + (currentUserData.losses || 0);
    const winRate = total > 0 ? Math.round(((currentUserData.wins || 0) / total) * 100) : 0;
    const winRateEl = document.getElementById('winRate');
    if (winRateEl) {
        winRateEl.innerText = winRate + '%';
    }
}

// ============================================================
//  ✅ START KEEP-ALIVE INTERVAL
// ============================================================

let keepAliveInterval = null;

function startKeepAlive() {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
    }
    
    keepAliveInterval = setInterval(() => {
        // Check if any controls are disabled or have pointer-events: none
        const checkIds = ['headsBtn', 'tailsBtn', 'flipBtn', 'halfBtn', 'doubleBtn', 'maxBtn', 'depositBtn', 'withdrawBtn'];
        let needsEnable = false;
        
        checkIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const style = window.getComputedStyle(el);
                if (el.disabled === true || style.pointerEvents === 'none' || style.opacity === '0.5') {
                    needsEnable = true;
                }
            }
        });
        
        if (needsEnable) {
            console.log('🔓 Keep-alive: re-enabling controls');
            ultimateForceEnable();
        }
    }, 1000);
}

// ============================================================
//  LOGOUT
// ============================================================

const logoutBtn = document.getElementById('gameLogoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            if (keepAliveInterval) {
                clearInterval(keepAliveInterval);
                keepAliveInterval = null;
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

window.setGameEnabled = function(enabled) {
    console.log(`🔒 setGameEnabled called - FORCING ENABLED`);
    ultimateForceEnable();
    return true;
};

window.checkSession = function() {
    console.log('🔒 Session check overridden');
    return Promise.resolve(true);
};

window.showAuthUI = function() {
    console.log('🔒 showAuthUI suppressed');
};

window.hideAuthUI = function() {
    console.log('🔒 hideAuthUI suppressed');
};

if (window.initApp) {
    const originalInitApp = window.initApp;
    window.initApp = function() {
        console.log('🔒 App init overridden');
        ultimateForceEnable();
        startKeepAlive();
        return Promise.resolve();
    };
}

console.log('🎰 Game page loaded');
console.log(`💰 Balance: $${(currentUserData ? currentUserData.balance : 0).toFixed(2)}`);
