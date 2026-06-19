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
    
    const modal = document.getElementById('depositModal');
    if (modal) {
        modal.style.display = 'flex';
        updateDepositQR();
        log('Deposit modal opened');
    } else {
        logError('Deposit modal not found');
    }
}

function closeDepositModal() {
    const modal = document.getElementById('depositModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Reset form fields
    const method = document.getElementById('depositMethod');
    const amount = document.getElementById('depositAmount');
    const wallet = document.getElementById('depositWallet');
    const note = document.getElementById('depositNote');
    
    if (method) method.value = 'Bitcoin (BTC)';
    if (amount) amount.value = '100';
    if (wallet) wallet.value = '';
    if (note) note.value = '';
    
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
    
    const modal = document.getElementById('withdrawModal');
    if (modal) {
        modal.style.display = 'flex';
        log('Withdraw modal opened');
    } else {
        logError('Withdraw modal not found');
    }
}

function closeWithdrawModal() {
    const modal = document.getElementById('withdrawModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Reset form fields
    const method = document.getElementById('withdrawMethod');
    const amount = document.getElementById('withdrawAmount');
    const wallet = document.getElementById('withdrawWallet');
    const note = document.getElementById('withdrawNote');
    
    if (method) method.value = 'Bitcoin (BTC)';
    if (amount) amount.value = '100';
    if (wallet) wallet.value = '';
    if (note) note.value = '';
    
    log('Withdraw modal closed');
}

// ============================================================
//  QR CODE SWITCHER
// ============================================================

function updateDepositQR() {
    const methodSelect = document.getElementById('depositMethod');
    if (!methodSelect) return;
    
    const method = methodSelect.value;
    
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
    const amountInput = document.getElementById('depositAmount');
    const methodSelect = document.getElementById('depositMethod');
    const walletInput = document.getElementById('depositWallet');
    const noteInput = document.getElementById('depositNote');
    
    if (!amountInput || !methodSelect || !walletInput) {
        showNotification('❌ Form elements not found');
        return;
    }
    
    const amount = parseFloat(amountInput.value);
    const method = methodSelect.value;
    const wallet = walletInput.value.trim();
    const note = noteInput ? noteInput.value.trim() : '';
    
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
    const amountInput = document.getElementById('withdrawAmount');
    const methodSelect = document.getElementById('withdrawMethod');
    const walletInput = document.getElementById('withdrawWallet');
    const noteInput = document.getElementById('withdrawNote');
    
    if (!amountInput || !methodSelect || !walletInput) {
        showNotification('❌ Form elements not found');
        return;
    }
    
    const amount = parseFloat(amountInput.value);
    const method = methodSelect.value;
    const wallet = walletInput.value.trim();
    const note = noteInput ? noteInput.value.trim() : '';
    
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
    const depositBtn = document.getElementById('depositBtn');
    const confirmDepositBtn = document.getElementById('confirmDepositBtn');
    const cancelDepositBtn = document.getElementById('cancelDepositBtn');
    
    if (depositBtn) {
        depositBtn.onclick = openDepositModal;
    } else {
        logWarning('depositBtn not found');
    }
    
    if (confirmDepositBtn) {
        confirmDepositBtn.onclick = confirmDeposit;
    } else {
        logWarning('confirmDepositBtn not found');
    }
    
    if (cancelDepositBtn) {
        cancelDepositBtn.onclick = closeDepositModal;
    } else {
        logWarning('cancelDepositBtn not found');
    }
    
    // Withdraw buttons
    const withdrawBtn = document.getElementById('withdrawBtn');
    const confirmWithdrawBtn = document.getElementById('confirmWithdrawBtn');
    const cancelWithdrawBtn = document.getElementById('cancelWithdrawBtn');
    
    if (withdrawBtn) {
        withdrawBtn.onclick = openWithdrawModal;
    } else {
        logWarning('withdrawBtn not found');
    }
    
    if (confirmWithdrawBtn) {
        confirmWithdrawBtn.onclick = confirmWithdraw;
    } else {
        logWarning('confirmWithdrawBtn not found');
    }
    
    if (cancelWithdrawBtn) {
        cancelWithdrawBtn.onclick = closeWithdrawModal;
    } else {
        logWarning('cancelWithdrawBtn not found');
    }
    
    // QR switcher
    const depositMethod = document.getElementById('depositMethod');
    if (depositMethod) {
        depositMethod.onchange = updateDepositQR;
    } else {
        logWarning('depositMethod not found');
    }
    
    // Close modals on background click
    window.onclick = function(e) {
        const depositModal = document.getElementById('depositModal');
        const withdrawModal = document.getElementById('withdrawModal');
        
        if (e.target === depositModal) {
            closeDepositModal();
        }
        if (e.target === withdrawModal) {
            closeWithdrawModal();
        }
    };
    
    // Close modals on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const depositModal = document.getElementById('depositModal');
            const withdrawModal = document.getElementById('withdrawModal');
            
            if (depositModal && depositModal.style.display === 'flex') {
                closeDepositModal();
            }
            if (withdrawModal && withdrawModal.style.display === 'flex') {
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
