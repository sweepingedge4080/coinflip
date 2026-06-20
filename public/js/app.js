// ============================================================
//  APP INITIALIZATION (Modified)
// ============================================================

function initApp() {
    console.log('🔄 Initializing CoinFlip Casino...');
    
    // Initialize DOM references
    initDOM();
    
    // Setup all listeners
    setupAuthListeners();
    setupModalListeners();
    setupProgressiveListeners(); // Make sure this is called
    setupBetInputValidation();
    setupGameListeners();
    setupEventListeners();
    
    // Apply mobile detection
    applyMobileDetection();
    
    // Check for existing session
    checkSession();
    
    // Initialize progressive system
    initProgressiveSystem();
    
    // Render initial UI
    renderUI();
    
    console.log('🚀 CoinFlip Casino is ready!');
    console.log('💡 Type __app.info() for app info, __app.status() for status, __app.forceRefresh() to refresh');
}

function initProgressiveSystem() {
    console.log('🎯 Initializing progressive system...');
    
    // Set up the progressive listeners
    if (window.setupProgressiveListeners) {
        window.setupProgressiveListeners();
    }
    
    // Display progressive multipliers
    const multipliers = [2, 3, 5, 8, 13, 21, 34, 55];
    console.log(`📈 Progressive Multipliers: ${multipliers.join('x, ')}x`);
    console.log(`🏆 Max Level: ${multipliers.length} (${multipliers[multipliers.length-1]}x)`);
}

// ============================================================
//  GLOBAL KEYBOARD SHORTCUTS (Modified)
// ============================================================

function setupKeyboardShortcuts() {
    console.log('⌨️ Keyboard shortcuts enabled: 1=Heads, 2=Tails, Space=Flip, H=Half, D=Double, M=Max, P=Progressive, C=Cashout');
    
    document.addEventListener('keydown', function(e) {
        // Don't trigger if typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch(e.key.toLowerCase()) {
            case '1':
                // Bet Heads
                if (document.getElementById('headsBtn')) {
                    document.getElementById('headsBtn').click();
                }
                break;
            case '2':
                // Bet Tails
                if (document.getElementById('tailsBtn')) {
                    document.getElementById('tailsBtn').click();
                }
                break;
            case ' ':
                // Flip
                e.preventDefault();
                if (document.getElementById('flipBtn')) {
                    document.getElementById('flipBtn').click();
                }
                break;
            case 'h':
                // Half bet
                if (document.getElementById('halfBet')) {
                    document.getElementById('halfBet').click();
                }
                break;
            case 'd':
                // Double bet
                if (document.getElementById('doubleBet')) {
                    document.getElementById('doubleBet').click();
                }
                break;
            case 'm':
                // Max bet
                if (document.getElementById('maxBet')) {
                    document.getElementById('maxBet').click();
                }
                break;
            case 'p':
                // Toggle progressive
                if (document.getElementById('progressiveToggle')) {
                    document.getElementById('progressiveToggle').click();
                }
                break;
            case 'c':
                // Cashout progressive
                if (document.getElementById('progressiveCashout')) {
                    document.getElementById('progressiveCashout').click();
                }
                break;
        }
    });
}
