// ============================================================
//  LOADING.JS - Loading Page Logic
// ============================================================

// ----- CONFIGURATION -----
const LOADING_DURATION = 4000; // 4 seconds total
const TIPS = [
    '💡 Did you know? Progressive mode can multiply your winnings up to 55x!',
    '🔥 Win streaks increase your multiplier. Cash out or risk it all!',
    '💰 Withdraw your winnings instantly to your crypto wallet.',
    '🎯 11% house edge means fair play for everyone.',
    '🏆 Level up by winning flips. Higher levels = bigger bets!',
    '🔒 Provably fair gaming – every flip is verifiable.',
    '⚡ Support for 20+ cryptocurrencies including BTC, ETH, USDT, and SOL.',
    '🎰 The longer your win streak, the higher your payout!',
    '📈 XP earned from every flip. Level up and unlock exclusive bonuses.',
    '💎 Join thousands of players already winning in our casino.'
];

// ----- DOM ELEMENTS -----
const loadingBar = document.getElementById('loadingBar');
const loadingText = document.getElementById('loadingText');
const progressPercentage = document.getElementById('progressPercentage');
const tipsContainer = document.getElementById('loadingTips');

// ============================================================
//  MAIN INIT
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    startLoading();
});

function startLoading() {
    let progress = 0;
    const startTime = Date.now();
    let tipIndex = Math.floor(Math.random() * TIPS.length);

    // Show first tip
    updateTip(tipIndex);

    // Update progress every 50ms
    const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        progress = Math.min((elapsed / LOADING_DURATION) * 100, 100);

        // Update UI
        loadingBar.style.width = progress + '%';
        progressPercentage.textContent = Math.floor(progress) + '%';

        // Update loading text based on progress
        updateLoadingText(progress);

        // Change tip every 1.5 seconds
        if (Math.floor(elapsed / 1500) > 0) {
            const newTipIndex = Math.floor(elapsed / 1500) % TIPS.length;
            if (newTipIndex !== tipIndex) {
                tipIndex = newTipIndex;
                updateTip(tipIndex);
            }
        }

        // Complete
        if (progress >= 100) {
            clearInterval(interval);
            completeLoading();
        }
    }, 30);
}

// ============================================================
//  UPDATE FUNCTIONS
// ============================================================

function updateLoadingText(progress) {
    const messages = [
        { threshold: 0, text: '🔄 Initializing game engine...' },
        { threshold: 10, text: '⚡ Loading assets...' },
        { threshold: 25, text: '🔗 Connecting to blockchain...' },
        { threshold: 40, text: '🪙 Flipping the coin...' },
        { threshold: 55, text: '📊 Preparing your account...' },
        { threshold: 70, text: '🔥 Warming up progressive mode...' },
        { threshold: 85, text: '🚀 Almost ready...' },
        { threshold: 95, text: '🎰 Getting your table ready...' }
    ];

    let currentMessage = messages[0].text;
    for (let i = messages.length - 1; i >= 0; i--) {
        if (progress >= messages[i].threshold) {
            currentMessage = messages[i].text;
            break;
        }
    }

    loadingText.innerHTML = currentMessage;
}

function updateTip(index) {
    const tip = TIPS[index % TIPS.length];
    tipsContainer.innerHTML = `<p class="tip">${tip}</p>`;
    // Fade in effect
    const tipEl = tipsContainer.querySelector('.tip');
    if (tipEl) {
        tipEl.style.opacity = '0';
        setTimeout(() => {
            tipEl.style.transition = 'opacity 0.5s ease';
            tipEl.style.opacity = '1';
        }, 50);
    }
}

// ============================================================
//  COMPLETE LOADING - REDIRECT TO LOGIN
// ============================================================

function completeLoading() {
    loadingText.innerHTML = '✅ <span class="highlight">Ready!</span> Redirecting...';
    progressPercentage.textContent = '100%';

    // Small delay for user to see completion
    setTimeout(() => {
        // Fade out and redirect
        document.body.style.transition = 'opacity 0.6s ease';
        document.body.style.opacity = '0';

        setTimeout(() => {
            // ✅ FIXED: Redirect to /login (not /auth)
            window.location.href = '/login';
        }, 600);
    }, 600);
}

// ============================================================
//  HANDLE PAGE VISIBILITY (Prevent issues on tab switch)
// ============================================================

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('⏸️ Loading page paused (tab hidden)');
    } else {
        console.log('▶️ Loading page resumed');
    }
});

// ============================================================
//  PREVENT ACCIDENTAL NAVIGATION
// ============================================================

window.addEventListener('beforeunload', function(e) {
    console.log('⏳ Navigating away from loading page');
});

// Log startup
console.log('🔄 Loading page initialized');
console.log(`📝 ${TIPS.length} tips available`);
console.log(`⏱️ Loading duration: ${LOADING_DURATION/1000}s`);
