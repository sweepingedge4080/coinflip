// ============================================================
//  MODALS.JS - Deposit/Withdraw Modal Logic
// ============================================================

// ============================================================
//  DEPOSIT MODAL
// ============================================================

function openDepositModal() {
    if (!currentUser) {
        showNotification('Please login first!');
        return;
    }
    
    DOM.depositModal.style.display = 'flex';
    updateDepositQR();
    log('Deposit modal opened');
}

function closeDepositModal() {
    DOM.depositModal.style.display = 'none';
    // Reset form fields
    DOM.depositMethod.value = 'Bitcoin (BTC)';
    DOM.depositAmount.value = '100';
    DOM.depositWallet.value = '';
    DOM.depositNote.value = '';
    updateDepositQR();
    log('Deposit modal closed');
}

// ============================================================
//  WITHDRAW MODAL
// ============================================================

function openWithdrawModal() {
    if (!currentUser) {
        showNotification('Please login first!');
        return;
    }
    
    if (currentUserData.balance < 10) {
        showNotification('Minimum balance for withdrawal is 10 points!');
        return;
    }
    
    DOM.withdrawModal.style.display = 'flex';
    log('Withdraw modal opened');
}

function closeWithdrawModal() {
    DOM.withdrawModal.style.display = 'none';
    // Reset form fields
    DOM.withdrawMethod.value = 'Bitcoin (BTC)';
    DOM.withdrawAmount.value = '100';
    DOM.withdrawWallet.value = '';
    DOM.withdrawNote.value = '';
    log('Withdraw modal closed');
}

// ============================================================
//  QR CODE SWITCHER
// ============================================================

function updateDepositQR() {
    const method = DOM.depositMethod.value;
    
    // Hide all QR divs
    document.querySelectorAll('.qr-placeholder').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show the selected one
    const selectedId = QR_MAP[method];
    if (selectedId) {
        const selected = document.getElementById(selectedId);
        if (selected) {
            selected.style.display = 'flex';
        }
    }
}

// ============================================================
//  CONFIRM DEPOSIT
// ============================================================

async function confirmDeposit() {
    const amount = parseFloat(DOM.depositAmount.value);
    const method = DOM.depositMethod.value;
    const wallet = DOM.depositWallet.value.trim();
    const note = DOM.depositNote.value.trim();
    
    // Validation
    if (!amount || amount < 10) {
        showNotification('Minimum deposit is 10 points!');
        return;
    }
    
    if (!wallet) {
        showNotification('Please provide your wallet address / transaction ID!');
        return;
    }
    
    try {
        showNotification('📧 Sending deposit request...');
        
        await apiRequestDeposit({
            amount: amount,
            amountPoints: amount,
            cryptoMethod: method,
            walletAddress: wallet,
            transactionId: wallet,
            note: note
        });
        
        showNotification('✅ Deposit request sent! Admin will review and add funds.');
        closeDepositModal();
        log(`Deposit request: ${currentUser.username} - $${amount} - ${method}`);
        
    } catch (error) {
        logError('Deposit request failed', error);
        showNotification(`❌ Error: ${error.message}`);
    }
}

// ============================================================
//  CONFIRM WITHDRAW
// ============================================================

async function confirmWithdraw() {
    const amount = parseFloat(DOM.withdrawAmount.value);
    const method = DOM.withdrawMethod.value;
    const wallet = DOM.withdrawWallet.value.trim();
    const note = DOM.withdrawNote.value.trim();
    
    // Validation
    if (!amount || amount < 10) {
        showNotification('Minimum withdrawal is 10 points!');
        return;
    }
    
    if (amount > currentUserData.balance) {
        showNotification('Insufficient balance!');
        return;
    }
    
    if (!wallet) {
        showNotification('Please provide your wallet address!');
        return;
    }
    
    try {
        showNotification('📧 Sending withdrawal request...');
        
        await apiRequestWithdraw({
            amount: amount,
            amountPoints: amount,
            cryptoMethod: method,
            walletAddress: wallet,
            note: note
        });
        
        showNotification('✅ Withdrawal request sent! Admin will review and process.');
        closeWithdrawModal();
        log(`Withdraw request: ${currentUser.username} - $${amount} - ${method}`);
        
    } catch (error) {
        logError('Withdrawal request failed', error);
        showNotification(`❌ Error: ${error.message}`);
    }
}

// ============================================================
//  MODAL EVENT LISTENERS
// ============================================================

function setupModalListeners() {
    // Deposit buttons
    DOM.depositBtn.onclick = openDepositModal;
    DOM.confirmDepositBtn.onclick = confirmDeposit;
    DOM.cancelDepositBtn.onclick = closeDepositModal;
    
    // Withdraw buttons
    DOM.withdrawBtn.onclick = openWithdrawModal;
    DOM.confirmWithdrawBtn.onclick = confirmWithdraw;
    DOM.cancelWithdrawBtn.onclick = closeWithdrawModal;
    
    // QR switcher
    DOM.depositMethod.onchange = updateDepositQR;
    
    // Close modals on background click
    window.onclick = function(e) {
        if (e.target === DOM.depositModal) {
            closeDepositModal();
        }
        if (e.target === DOM.withdrawModal) {
            closeWithdrawModal();
        }
    };
    
    // Close modals on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (DOM.depositModal.style.display === 'flex') {
                closeDepositModal();
            }
            if (DOM.withdrawModal.style.display === 'flex') {
                closeWithdrawModal();
            }
        }
    });
    
    log('✅ Modal listeners setup complete');
}

// ----- EXPOSE GLOBALLY -----
window.openDepositModal = openDepositModal;
window.closeDepositModal = closeDepositModal;
window.openWithdrawModal = openWithdrawModal;
window.closeWithdrawModal = closeWithdrawModal;
window.updateDepositQR = updateDepositQR;
window.confirmDeposit = confirmDeposit;
window.confirmWithdraw = confirmWithdraw;
window.setupModalListeners = setupModalListeners;
