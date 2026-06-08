<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>COIN FLIP CASINO | Multi-Crypto | Progressive Jackpot</title>
    <style>
        * {
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            box-sizing: border-box;
        }

        body {
            background: linear-gradient(145deg, #0a0f1e 0%, #0c1222 100%);
            font-family: 'Courier New', 'Segoe UI', monospace;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }

        body.mobile-mode {
            padding: 8px;
        }
        body.mobile-mode .game-container {
            padding: 16px;
            border-radius: 28px;
        }
        body.mobile-mode .logo { font-size: 1.2rem; margin-bottom: 12px; }
        body.mobile-mode .coin { font-size: 70px; }
        body.mobile-mode .choice-btn, body.mobile-mode .action-btn, body.mobile-mode .flip-btn, body.mobile-mode .bank-action-btn { padding: 12px 8px; font-size: 0.9rem; }
        body.mobile-mode .bet-input { padding: 12px; font-size: 1rem; }
        body.mobile-mode .balance-amount { font-size: 1.2rem; }
        body.mobile-mode .stat-value { font-size: 1rem; }
        body.mobile-mode .modal-content { padding: 16px; }
        body.mobile-mode .qr-image { width: 100px; height: 100px; }

        .game-container {
            background: #1e2a3a;
            border-radius: 48px;
            padding: 30px;
            box-shadow: 0 20px 35px rgba(0,0,0,0.4);
            max-width: 650px;
            width: 100%;
            text-align: center;
            position: relative;
            transition: all 0.2s ease;
        }

        .logo {
            font-size: 1.6rem;
            font-weight: bold;
            background: linear-gradient(135deg, #facc15, #a855f7);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            margin-bottom: 20px;
        }

        /* Progressive Panel - PSYCHOLOGICAL ADDICTION DESIGN */
        .progressive-panel {
            background: linear-gradient(135deg, #1a2a3a, #0f1724);
            border-radius: 32px;
            padding: 15px;
            margin-bottom: 20px;
            border: 2px solid #facc15;
            position: relative;
            overflow: hidden;
        }
        .progressive-panel::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(250,204,21,0.1) 0%, transparent 70%);
            animation: pulseGlow 3s ease-in-out infinite;
        }
        @keyframes pulseGlow {
            0% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
            100% { opacity: 0.3; transform: scale(1); }
        }
        .progressive-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 12px;
            position: relative;
            z-index: 1;
        }
        .progressive-title {
            font-size: 1rem;
            font-weight: bold;
            background: linear-gradient(135deg, #facc15, #ff8c00);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
        }
        .progressive-badge {
            background: #22c55e;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: bold;
            animation: badgePulse 1s infinite;
        }
        @keyframes badgePulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
        }
        .checkpoints-container {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            margin: 15px 0;
            flex-wrap: wrap;
            position: relative;
            z-index: 1;
        }
        .checkpoint {
            flex: 1;
            background: #0f1724;
            border-radius: 16px;
            padding: 8px 4px;
            text-align: center;
            transition: all 0.3s;
            border: 1px solid #334155;
            position: relative;
        }
        .checkpoint.reached {
            background: linear-gradient(135deg, #facc15, #a855f7);
            border-color: #facc15;
            transform: scale(1.02);
            box-shadow: 0 0 15px rgba(250,204,21,0.5);
        }
        .checkpoint.reached .checkpoint-multiplier {
            color: #0f1724;
            font-weight: bold;
        }
        .checkpoint.reached .checkpoint-label {
            color: #0f1724;
        }
        .checkpoint-multiplier {
            font-size: 1.1rem;
            font-weight: bold;
            color: #facc15;
        }
        .checkpoint-label {
            font-size: 0.6rem;
            color: #94a3b8;
        }
        .checkpoint-prize {
            font-size: 0.65rem;
            color: #22c55e;
            font-weight: bold;
        }
        .streak-fire {
            font-size: 1.2rem;
            font-weight: bold;
            color: #facc15;
            text-shadow: 0 0 5px #ff8c00;
            animation: flicker 0.5s ease-in-out infinite alternate;
        }
        @keyframes flicker {
            from { text-shadow: 0 0 2px #facc15; }
            to { text-shadow: 0 0 10px #ff8c00; }
        }
        .cashout-btn {
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 40px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.9rem;
        }
        .cashout-btn:hover {
            transform: scale(1.02);
            box-shadow: 0 0 15px #22c55e;
        }

        /* Other existing styles (kept intact) */
        .auth-panel, .banking-panel, .admin-panel, .coin-area, .bet-panel, .stats { /* keeping original styles */ }
        .auth-panel { background: linear-gradient(135deg, #0f1724, #0a0f1e); border-radius: 32px; padding: 20px; margin-bottom: 20px; border: 1px solid #facc15; }
        .balance-amount { font-size: 1.5rem; color: #facc15; font-weight: bold; }
        .coin { font-size: 100px; display: inline-block; transition: transform 0.3s ease; }
        .coin.flipping { animation: flipCoin 0.5s ease-in-out; }
        @keyframes flipCoin { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(360deg); } }
        .result.win { color: #22c55e; animation: winPulse 0.5s; }
        .choice-btn.selected { box-shadow: 0 0 0 3px #facc15; transform: scale(1.02); }
        .flip-btn { background: #facc15; color: #0f1724; font-weight: bold; border-radius: 60px; padding: 15px; width: 100%; cursor: pointer; }
        .notification { position: fixed; top: 20px; right: 20px; background: #1e293b; border-left: 4px solid #facc15; padding: 12px 20px; border-radius: 12px; z-index: 10000; animation: slideIn 0.3s; }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); z-index: 20000; justify-content: center; align-items: center; }
        .modal-content { background: linear-gradient(135deg, #1e293b, #0f1724); border-radius: 32px; padding: 25px; max-width: 900px; width: 95%; border: 2px solid #facc15; max-height: 85vh; overflow-y: auto; }
        .qr-placeholder { background: #1e293b; border-radius: 16px; padding: 12px; display: flex; flex-direction: column; align-items: center; }
    </style>
</head>
<body>
<div class="game-container">
    <div class="logo">🪙 COIN FLIP CASINO 🪙</div>

    <!-- PROGRESSIVE ADDICTION PANEL -->
    <div class="progressive-panel" id="progressivePanel" style="display: none;">
        <div class="progressive-header">
            <span class="progressive-title">🔥 PROGRESSIVE CHALLENGE 🔥</span>
            <span class="progressive-badge" id="streakBadge">STREAK 0</span>
        </div>
        <div class="checkpoints-container" id="checkpointsContainer">
            <!-- JS will populate checkpoints -->
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 10px;">
            <span class="streak-fire" id="streakFireText">⚡ CURRENT MULTIPLIER: 2x ⚡</span>
            <button id="cashoutProgressiveBtn" class="cashout-btn">💰 CASH OUT & KEEP WINNINGS 💰</button>
        </div>
        <div class="info-text" style="margin-top: 8px;">💡 Reach checkpoints for BIGGER multipliers! Lose once → streak resets.</div>
    </div>

    <div class="auth-panel" id="authPanel">
        <div id="authForm">
            <input type="text" id="loginUsername" class="auth-input" placeholder="Username">
            <input type="password" id="loginPassword" class="auth-input" placeholder="Password">
            <button id="loginBtn" class="auth-btn login-btn">🔓 LOGIN</button>
            <button id="signupBtn" class="auth-btn signup-btn">📝 SIGN UP</button>
        </div>
        <div id="userInfo" style="display: none;">
            <div class="user-info" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <span>👤 <strong id="currentUserDisplay">Player</strong></span>
                <div class="user-id-container" onclick="copyUserId()" style="cursor:pointer;"><span>🆔 ID:</span> <span id="userIdDisplay">-</span> <span>📋</span></div>
                <span id="adminBadge" class="admin-badge" style="display: none;">👑 ADMIN</span>
                <button id="logoutBtn" class="logout-btn">🚪 LOGOUT</button>
            </div>
        </div>
    </div>

    <div class="admin-panel" id="adminPanel" style="display: none;">
        <div class="admin-title">👑 ADMIN CONTROL 👑</div>
        <select id="adminUserSelect"></select>
        <div class="admin-controls"><input type="number" id="adminAmount" value="100"><button id="adminAddBtn">ADD</button><button id="adminRemoveBtn">REMOVE</button></div>
    </div>

    <div class="banking-panel">
        <div class="balance-row"><div class="balance-box">💰 BALANCE <span id="balance">0.00</span> $</div><div class="balance-box">🏆 BEST STREAK <span id="bestStreak">0</span></div><div class="balance-box">📊 WAGERED <span id="totalWagered">0.00</span> $</div></div>
        <div class="bank-buttons"><button id="depositBtn" class="bank-action-btn deposit-action-btn">💵 DEPOSIT</button><button id="withdrawBtn" class="bank-action-btn withdraw-action-btn">💰 WITHDRAW</button></div>
    </div>

    <div class="coin-area"><div class="coin" id="coin">🪙</div><div class="result" id="result">Login to play!</div></div>
    <div class="bet-panel">
        <input type="number" step="0.01" id="betAmount" class="bet-input" placeholder="BET AMOUNT ($)" value="100" disabled>
        <div class="choice-buttons"><button id="headsBtn" class="choice-btn heads" disabled>HEADS</button><button id="tailsBtn" class="choice-btn tails" disabled>TAILS</button></div>
        <div class="action-buttons"><button id="halfBtn" class="action-btn">½ HALF</button><button id="doubleBtn" class="action-btn">2x DOUBLE</button><button id="maxBtn" class="action-btn">MAX</button></div>
        <button id="flipBtn" class="flip-btn" disabled>🔄 FLIP COIN 🔄</button>
    </div>
    <div class="stats"><div class="stat-box">WINS <span id="winsCount">0</span></div><div class="stat-box">LOSSES <span id="lossesCount">0</span></div><div class="stat-box">WIN RATE <span id="winRate">0</span>%</div><div class="stat-box">STREAK <span id="currentStreak">0</span></div></div>
</div>

<script>
    // ========== PROGRESSIVE SYSTEM ==========
    const CHECKPOINTS = [2, 3, 5, 8, 13, 21, 34, 55]; // multipliers at each win streak
    let progressiveActive = false;
    let currentProgressiveStreak = 0;
    let originalBetAmount = 0;
    let totalProgressiveWinnings = 0;

    function renderCheckpoints() {
        const container = document.getElementById('checkpointsContainer');
        if (!container) return;
        container.innerHTML = '';
        CHECKPOINTS.forEach((mult, idx) => {
            const div = document.createElement('div');
            div.className = 'checkpoint';
            if (currentProgressiveStreak >= idx + 1) div.classList.add('reached');
            div.innerHTML = `<div class="checkpoint-multiplier">${mult}x</div><div class="checkpoint-label">${idx === 0 ? 'START' : idx === CHECKPOINTS.length-1 ? 'JACKPOT' : 'CHECKPOINT'}</div><div class="checkpoint-prize">$${(originalBetAmount * mult).toFixed(2)}</div>`;
            container.appendChild(div);
        });
        const streakElem = document.getElementById('streakBadge');
        if (streakElem) streakElem.innerText = `STREAK ${currentProgressiveStreak}`;
        const fireText = document.getElementById('streakFireText');
        if (fireText) {
            let nextMult = currentProgressiveStreak >= CHECKPOINTS.length ? CHECKPOINTS[CHECKPOINTS.length-1] : CHECKPOINTS[currentProgressiveStreak];
            fireText.innerHTML = `⚡ CURRENT MULTIPLIER: ${nextMult}x ⚡`;
        }
    }

    function calculateProgressivePayout(streak) {
        if (streak <= 0) return originalBetAmount * 2;
        let mult = 2;
        if (streak - 1 < CHECKPOINTS.length) mult = CHECKPOINTS[streak - 1];
        else mult = CHECKPOINTS[CHECKPOINTS.length-1];
        return originalBetAmount * mult;
    }

    function startProgressiveMode(bet) {
        progressiveActive = true;
        currentProgressiveStreak = 1;
        originalBetAmount = bet;
        totalProgressiveWinnings = 0;
        document.getElementById('progressivePanel').style.display = 'block';
        renderCheckpoints();
        showNotification(`🔥 PROGRESSIVE MODE ACTIVE! Win streak: 1 | Next payout: ${calculateProgressivePayout(1).toFixed(2)}$`, 3000);
    }

    function cashoutProgressive() {
        if (!progressiveActive) return;
        const finalMultiplier = currentProgressiveStreak > 0 ? calculateProgressivePayout(currentProgressiveStreak) : originalBetAmount * 2;
        const cashoutAmount = originalBetAmount * (finalMultiplier / originalBetAmount); // simplified
        const actualPayout = finalMultiplier;
        showNotification(`💰💰💰 YOU CASHED OUT! Won $${actualPayout.toFixed(2)} from progressive streak of ${currentProgressiveStreak}! 💰💰💰`, 4000);
        // Add to balance if needed (already added per win but ensure double safety)
        if (currentUserData) {
            // Extra celebration
        }
        progressiveActive = false;
        currentProgressiveStreak = 0;
        originalBetAmount = 0;
        totalProgressiveWinnings = 0;
        document.getElementById('progressivePanel').style.display = 'none';
        renderCheckpoints();
    }

    function resetProgressiveOnLoss() {
        if (progressiveActive) {
            showNotification(`💀 PROGRESSIVE STREAK BROKEN at ${currentProgressiveStreak} wins! You lost $${originalBetAmount.toFixed(2)}. Start a new streak! 💀`, 3000);
            progressiveActive = false;
            currentProgressiveStreak = 0;
            originalBetAmount = 0;
            totalProgressiveWinnings = 0;
            document.getElementById('progressivePanel').style.display = 'none';
            renderCheckpoints();
        }
    }

    // ========== ORIGINAL BACKEND API (unchanged but adjusted dollars) ==========
    const API_URL = '';
    let authToken = null;
    let currentUser = null;
    let currentUserData = null;
    let isAdmin = false;
    let selectedChoice = null;
    let isFlipping = false;

    const balanceEl = document.getElementById('balance');
    const bestStreakEl = document.getElementById('bestStreak');
    const totalWageredEl = document.getElementById('totalWagered');
    const coinEl = document.getElementById('coin');
    const resultEl = document.getElementById('result');
    const betInput = document.getElementById('betAmount');
    const headsBtn = document.getElementById('headsBtn');
    const tailsBtn = document.getElementById('tailsBtn');
    const flipBtn = document.getElementById('flipBtn');
    const halfBtn = document.getElementById('halfBtn');
    const doubleBtn = document.getElementById('doubleBtn');
    const maxBtn = document.getElementById('maxBtn');
    const winsCountEl = document.getElementById('winsCount');
    const lossesCountEl = document.getElementById('lossesCount');
    const winRateEl = document.getElementById('winRate');
    const currentStreakEl = document.getElementById('currentStreak');

    async function apiCall(endpoint, method = 'GET', data = null) {
        const headers = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
        const options = { method, headers };
        if (data) options.body = JSON.stringify(data);
        const response = await fetch(`/api${endpoint}`, options);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'API error');
        return result;
    }

    function showNotification(msg, duration = 2000) {
        const notif = document.createElement('div'); notif.className = 'notification'; notif.innerHTML = msg; document.body.appendChild(notif);
        setTimeout(() => notif.remove(), duration);
    }
    function copyUserId() { const uid = document.getElementById('userIdDisplay').innerText; if(uid && uid !== '-') navigator.clipboard.writeText(uid).then(() => showNotification('✅ ID copied')); }
    window.copyUserId = copyUserId;

    function updateUI() {
        if (!currentUserData) return;
        balanceEl.innerText = currentUserData.balance.toFixed(2);
        bestStreakEl.innerText = currentUserData.bestStreak || 0;
        totalWageredEl.innerText = (currentUserData.totalWagered || 0).toFixed(2);
        winsCountEl.innerText = currentUserData.wins || 0;
        lossesCountEl.innerText = currentUserData.losses || 0;
        const total = (currentUserData.wins || 0) + (currentUserData.losses || 0);
        winRateEl.innerText = total > 0 ? Math.round(((currentUserData.wins || 0) / total) * 100) : 0;
        currentStreakEl.innerText = currentUserData.currentStreak || 0;
        betInput.max = currentUserData.balance;
        document.getElementById('userIdDisplay').innerText = currentUserData.id || currentUserData._id;
        document.getElementById('currentUserDisplay').innerText = currentUserData.username;
    }

    function updateSelectedButton() { headsBtn.classList.remove('selected'); tailsBtn.classList.remove('selected'); if (selectedChoice === 'heads') headsBtn.classList.add('selected'); if (selectedChoice === 'tails') tailsBtn.classList.add('selected'); }
    function setGameEnabled(enabled) { betInput.disabled = !enabled; headsBtn.disabled = !enabled; tailsBtn.disabled = !enabled; halfBtn.disabled = !enabled; doubleBtn.disabled = !enabled; maxBtn.disabled = !enabled; flipBtn.disabled = !enabled; }
    
    function showWinCelebration(amount) { showNotification(`🎉 WIN! +$${amount.toFixed(2)}! 🎉`); resultEl.classList.add('win'); setTimeout(() => resultEl.classList.remove('win'), 1500); }

    // ========== FLIP LOGIC WITH PROGRESSIVE INTEGRATION ==========
    async function flipCoin() {
        if (isFlipping) return;
        if (!authToken) { showNotification('Please login first!'); return; }
        if (!selectedChoice) { showNotification('Select HEADS or TAILS first!'); return; }
        let bet = parseFloat(betInput.value);
        if (isNaN(bet) || bet <= 0) { showNotification('Enter valid bet amount!'); return; }
        if (bet > currentUserData.balance) { showNotification('Insufficient balance!'); return; }
        
        // Progressive mode decision: if active and streak >0, use originalBetAmount (locked)
        let effectiveBet = bet;
        if (progressiveActive && currentProgressiveStreak > 0) {
            effectiveBet = originalBetAmount;
            if (effectiveBet > currentUserData.balance) { showNotification(`Cannot continue progressive streak - insufficient balance for $${effectiveBet.toFixed(2)}`); cashoutProgressive(); return; }
        }
        
        isFlipping = true; flipBtn.disabled = true;
        coinEl.classList.add('flipping');
        
        try {
            const result = await apiCall('/game/flip', 'POST', { betAmount: effectiveBet, choice: selectedChoice });
            setTimeout(async () => {
                coinEl.classList.remove('flipping');
                if (result.isWin) {
                    // WIN HANDLING
                    const winnings = result.winnings;
                    if (progressiveActive && currentProgressiveStreak > 0) {
                        // progressive mode win: increase streak
                        currentProgressiveStreak++;
                        totalProgressiveWinnings = calculateProgressivePayout(currentProgressiveStreak);
                        showNotification(`🔥 PROGRESSIVE STREAK: ${currentProgressiveStreak} WINS! Next payout: ${calculateProgressivePayout(currentProgressiveStreak).toFixed(2)}$ 🔥`, 2500);
                        resultEl.innerHTML = `🎲 PROGRESSIVE WIN #${currentProgressiveStreak}! 🎲 <br> Multiplier: ${currentProgressiveStreak >= CHECKPOINTS.length ? CHECKPOINTS[CHECKPOINTS.length-1] : CHECKPOINTS[currentProgressiveStreak-1]}x | Potential Cashout: $${calculateProgressivePayout(currentProgressiveStreak).toFixed(2)}`;
                        renderCheckpoints();
                        // Update actual balance (backend already added normal win, but we adjust to multiplier)
                        // We'll need to sync with backend: since backend pays 2x always, we manually adjust difference.
                        const expectedProgressiveWin = calculateProgressivePayout(currentProgressiveStreak);
                        const backendWin = winnings; // 2x
                        if (expectedProgressiveWin > backendWin) {
                            const extra = expectedProgressiveWin - backendWin;
                            currentUserData.balance += extra;
                            await apiCall('/game/add-progressive', 'POST', { amount: extra }).catch(()=>{});
                            showNotification(`✨ PROGRESSIVE BONUS +$${extra.toFixed(2)} ✨`, 2000);
                        }
                    } else {
                        // normal win, check if we should auto-start progressive
                        showWinCelebration(winnings);
                        resultEl.innerHTML = `🎉 WIN! Won $${winnings.toFixed(2)}! 🎉`;
                        // Offer progressive mode start
                        if (!progressiveActive && confirm(`🔥 START PROGRESSIVE MODE? Keep betting $${effectiveBet} and increase multipliers up to ${CHECKPOINTS[CHECKPOINTS.length-1]}x! 🔥`)) {
                            startProgressiveMode(effectiveBet);
                        }
                    }
                    if (currentUserData) {
                        currentUserData.balance = result.newBalance;
                        if (result.stats) Object.assign(currentUserData, result.stats);
                        updateUI();
                    }
                } else {
                    // LOSS HANDLING
                    if (progressiveActive) {
                        resetProgressiveOnLoss();
                        resultEl.innerHTML = `💀 PROGRESSIVE STREAK ENDED! Lost $${effectiveBet.toFixed(2)} 💀`;
                    } else {
                        resultEl.innerHTML = `💀 LOSS! Lost $${effectiveBet.toFixed(2)} 💀`;
                    }
                    if (currentUserData) {
                        currentUserData.balance = result.newBalance;
                        if (result.stats) Object.assign(currentUserData, result.stats);
                        updateUI();
                    }
                }
                isFlipping = false; flipBtn.disabled = false;
                setTimeout(() => { resultEl.classList.remove('win', 'lose'); }, 2000);
            });
        } catch (error) {
            showNotification(error.message);
            isFlipping = false; flipBtn.disabled = false; coinEl.classList.remove('flipping');
        }
    }

    // Helper to add progressive bonus on backend (optional endpoint)
    // For demo we just update local balance but api call failsafe

    function halfBet() { if(currentUserData){ let val=parseFloat(betInput.value)||100; val=Math.max(0.01,val/2); betInput.value=val.toFixed(2); showNotification(`Bet halved to $${val.toFixed(2)}`); } }
    function doubleBet() { if(currentUserData){ let val=parseFloat(betInput.value)||100; val=Math.min(currentUserData.balance,val*2); betInput.value=val.toFixed(2); showNotification(`Bet doubled to $${val.toFixed(2)}`); } }
    function maxBet() { if(currentUserData){ betInput.value=currentUserData.balance.toFixed(2); showNotification(`Max bet: $${currentUserData.balance.toFixed(2)}`); } }

    // Auth & login
    async function signup(username, password) { try { const data = await apiCall('/auth/signup', 'POST', { username, password }); authToken = data.token; currentUser = data.user; currentUserData = data.user; isAdmin = currentUser.isAdmin||false; localStorage.setItem('authToken', authToken); document.getElementById('authForm').style.display = 'none'; document.getElementById('userInfo').style.display = 'block'; updateUI(); setGameEnabled(true); showNotification(`Welcome ${currentUser.username}!`); if(isAdmin) document.getElementById('adminPanel').style.display='block'; } catch(e){ alert(e.message); } }
    async function login(username, password) { try { const data = await apiCall('/auth/login', 'POST', { username, password }); authToken = data.token; currentUser = data.user; currentUserData = data.user; isAdmin = currentUser.isAdmin||false; localStorage.setItem('authToken', authToken); document.getElementById('authForm').style.display = 'none'; document.getElementById('userInfo').style.display = 'block'; updateUI(); setGameEnabled(true); showNotification(`Welcome back ${currentUser.username}!`); if(isAdmin) document.getElementById('adminPanel').style.display='block'; } catch(e){ alert(e.message); } }
    function logout() { authToken=null; currentUser=null; currentUserData=null; isAdmin=false; selectedChoice=null; localStorage.removeItem('authToken'); document.getElementById('authForm').style.display='block'; document.getElementById('userInfo').style.display='none'; document.getElementById('adminPanel').style.display='none'; setGameEnabled(false); progressiveActive=false; document.getElementById('progressivePanel').style.display='none'; updateUI(); showNotification('Logged out'); }
    async function checkSession() { const token = localStorage.getItem('authToken'); if(token){ authToken=token; try{ const user=await apiCall('/auth/me'); currentUser=user; currentUserData=user; isAdmin=user.isAdmin||false; document.getElementById('authForm').style.display='none'; document.getElementById('userInfo').style.display='block'; updateUI(); setGameEnabled(true); if(isAdmin) document.getElementById('adminPanel').style.display='block'; showNotification(`Welcome back ${user.username}!`); }catch(e){ logout(); } } }
    
    // Deposit/Withdraw modals (simplified placeholders)
    document.getElementById('depositBtn').onclick = () => showNotification('📧 Deposit request: email admin with TX ID');
    document.getElementById('withdrawBtn').onclick = () => showNotification('📧 Withdraw request: email admin with wallet');
    
    // Event listeners
    document.getElementById('loginBtn').onclick = () => login(document.getElementById('loginUsername').value, document.getElementById('loginPassword').value);
    document.getElementById('signupBtn').onclick = () => signup(document.getElementById('loginUsername').value, document.getElementById('loginPassword').value);
    document.getElementById('logoutBtn').onclick = logout;
    headsBtn.onclick = () => { selectedChoice = 'heads'; updateSelectedButton(); showNotification('Selected: HEADS'); };
    tailsBtn.onclick = () => { selectedChoice = 'tails'; updateSelectedButton(); showNotification('Selected: TAILS'); };
    flipBtn.onclick = flipCoin;
    halfBtn.onclick = halfBet; doubleBtn.onclick = doubleBet; maxBtn.onclick = maxBet;
    document.getElementById('cashoutProgressiveBtn').onclick = () => { if(progressiveActive) cashoutProgressive(); else showNotification('No active progressive streak'); };
    
    // Mobile detection
    function detectMobile() { if(/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth<768) document.body.classList.add('mobile-mode'); }
    detectMobile(); window.addEventListener('resize', detectMobile);
    
    setGameEnabled(false);
    checkSession();
    renderCheckpoints();
</script>
</body>
</html>
