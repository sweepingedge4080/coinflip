// ============================================================
//  APP.JS - Main Application Entry Point (FIXED - No Auto-Disable)
// ============================================================

// ============================================================
//  APPLICATION STATE
// ============================================================

const AppState = {
    initialized: false,
    ready: false,
    version: '2.0.0'
};

// ============================================================
//  MAIN INITIALIZATION
// ============================================================

async function initApp() {
    if (AppState.initialized) {
        log('⚠️ App already initialized');
        return;
    }
    
    AppState.initialized = true;
    log('🔄 Initializing CoinFlip Casino v' + AppState.version);
    
    try {
        // ----- STEP 1: Initialize DOM -----
        initDOM();
        log('✅ DOM initialized');
        
        // ----- STEP 2: Setup Event Listeners -----
        setupAuthListeners();
        setupModalListeners();
        setupProgressiveListeners();
        setupGameListeners();
        log('✅ Event listeners setup complete');
        
        // ----- STEP 3: Apply mobile detection -----
        detectAndApplyMobileMode();
        window.addEventListener('resize', detectAndApplyMobileMode);
        log('✅ Mobile detection applied');
        
        // ----- STEP 4: Check for existing session -----
        const sessionRestored = await checkSession();
        
        // ----- STEP 5: Render initial UI -----
        renderCheckpoints();
        log('✅ Initial UI rendered');
        
        // ----- STEP 6: Log startup info -----
        log(`📈 Progressive Multipliers: ${PROGRESSIVE_MULTIPLIERS.join('x, ')}x`);
        log(`🏆 Max Level: ${PROGRESSIVE_MULTIPLIERS.length} (${PROGRESSIVE_MULTIPLIERS[PROGRESSIVE_MULTIPLIERS.length-1]}x)`);
        
        // ----- STEP 7: Mark as ready -----
        AppState.ready = true;
        
        log('🚀 CoinFlip Casino is ready!');
        log(`👤 ${sessionRestored ? 'Session restored' : 'Not logged in'}`);
        
        // ✅ FIXED: Don't call setGameEnabled here - let game-page.js handle it
        // The game page will enable controls after session validation
        
        // Optional: Show welcome notification if logged in
        if (sessionRestored && currentUser) {
            setTimeout(() => {
                showNotification(`👋 Welcome back, ${currentUser.username}!`, 2000);
            }, 500);
        }
        
        // ----- STEP 8: Add keyboard shortcuts -----
        setupKeyboardShortcuts();
        
    } catch (error) {
        logError('App initialization failed', error);
        showNotification('❌ Failed to initialize app. Please refresh the page.');
        AppState.initialized = false;
    }
}

// ============================================================
//  KEYBOARD SHORTCUTS
// ============================================================

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch (e.key) {
            case '1':
                if (DOM.headsBtn) DOM.headsBtn.click();
                break;
            case '2':
                if (DOM.tailsBtn) DOM.tailsBtn.click();
                break;
            case ' ':
                e.preventDefault();
                if (DOM.flipBtn && !DOM.flipBtn.disabled) {
                    DOM.flipBtn.click();
                }
                break;
            case 'h':
            case 'H':
                if (DOM.halfBtn) DOM.halfBtn.click();
                break;
            case 'd':
            case 'D':
                if (DOM.doubleBtn) DOM.doubleBtn.click();
                break;
            case 'm':
            case 'M':
                if (DOM.maxBtn) DOM.maxBtn.click();
                break;
            case 'p':
            case 'P':
                if (DOM.toggleProgressiveBtn && !DOM.toggleProgressiveBtn.disabled) {
                    DOM.toggleProgressiveBtn.click();
                }
                break;
            case 'c':
            case 'C':
                if (DOM.cashoutProgressiveBtn && !DOM.cashoutProgressiveBtn.disabled) {
                    DOM.cashoutProgressiveBtn.click();
                }
                break;
        }
    });
    
    log('⌨️ Keyboard shortcuts enabled: 1=Heads, 2=Tails, Space=Flip, H=Half, D=Double, M=Max, P=Progressive, C=Cashout');
}

// ============================================================
//  APP HELPERS
// ============================================================

function getAppStatus() {
    return {
        initialized: AppState.initialized,
        ready: AppState.ready,
        version: AppState.version,
        loggedIn: !!authToken,
        username: currentUser ? currentUser.username : null,
        isAdmin: isAdmin,
        balance: currentUserData ? currentUserData.balance : 0
    };
}

function showAppInfo() {
    const status = getAppStatus();
    console.log('========================================');
    console.log('🪙 COIN FLIP CASINO v' + status.version);
    console.log('========================================');
    console.log(`   Status:     ${status.ready ? '✅ Ready' : '⏳ Loading'}`);
    console.log(`   Logged In:  ${status.loggedIn ? '✅ Yes' : '❌ No'}`);
    if (status.loggedIn) {
        console.log(`   Username:   ${status.username}`);
        console.log(`   Balance:    $${status.balance.toFixed(2)}`);
        console.log(`   Admin:      ${status.isAdmin ? '✅ Yes' : '❌ No'}`);
    }
    console.log('========================================');
}

// ============================================================
//  DOM READY CHECK
// ============================================================

function domReady() {
    return new Promise((resolve) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve);
        } else {
            resolve();
        }
    });
}

// ============================================================
//  START APPLICATION
// ============================================================

async function startApp() {
    await domReady();
    await initApp();
    
    window.__app = {
        state: AppState,
        status: getAppStatus,
        info: showAppInfo,
        reload: () => location.reload(),
        forceRefresh: async () => {
            await refreshUserData();
            renderCheckpoints();
            showNotification('🔄 App refreshed');
        }
    };
    
    console.log('💡 Type __app.info() for app info, __app.status() for status, __app.forceRefresh() to refresh');
}

// ============================================================
//  START
// ============================================================

startApp();

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // Already loaded, but startApp handles this via domReady()
}

// ============================================================
//  EXPOSE GLOBALLY
// ============================================================

window.AppState = AppState;
window.initApp = initApp;
window.startApp = startApp;
window.getAppStatus = getAppStatus;
window.showAppInfo = showAppInfo;
window.setupKeyboardShortcuts = setupKeyboardShortcuts;
window.__app = null;
