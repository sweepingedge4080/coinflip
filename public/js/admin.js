// ============================================================
//  ADMIN.JS - Admin Panel Functions
// ============================================================

// ============================================================
//  LOAD ADMIN USERS
// ============================================================

async function loadAdminUsers() {
    if (!isAdmin) return;
    
    try {
        const users = await apiGetUsers();
        DOM.adminUserSelect.innerHTML = '<option value="">-- Select User --</option>';
        
        for (const user of users) {
            const option = document.createElement('option');
            option.value = user.username;
            option.textContent = `${user.username} - Balance: $${user.balance.toFixed(2)}`;
            DOM.adminUserSelect.appendChild(option);
        }
        
        log('✅ Admin users loaded');
    } catch (error) {
        logError('Failed to load admin users:', error);
        showNotification('❌ Failed to load users');
    }
}

// ============================================================
//  ADMIN FUNDS MANAGEMENT
// ============================================================

async function adminAddFunds() {
    if (!isAdmin) {
        showNotification('❌ Admin access required!');
        return;
    }
    
    const username = DOM.adminUserSelect.value;
    const amount = parseFloat(DOM.adminAmount.value);
    
    if (!username) {
        showNotification('Select a user first!');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        showNotification('Enter a valid amount!');
        return;
    }
    
    if (!confirm(`Add $${amount} to ${username}?`)) return;
    
    try {
        await apiAddFunds(username, amount);
        showNotification(`✅ Added $${amount.toFixed(2)} points to ${username}`);
        loadAdminUsers();
        
        // Refresh current user data if it's the logged-in user
        if (currentUser && currentUser.username === username) {
            const stats = await apiGetStats();
            currentUserData = stats;
            updateUI();
        }
        
        log(`Admin added $${amount} to ${username}`);
    } catch (error) {
        logError('Add funds error:', error);
        showNotification(`❌ Error: ${error.message}`);
    }
}

async function adminRemoveFunds() {
    if (!isAdmin) {
        showNotification('❌ Admin access required!');
        return;
    }
    
    const username = DOM.adminUserSelect.value;
    const amount = parseFloat(DOM.adminAmount.value);
    
    if (!username) {
        showNotification('Select a user first!');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        showNotification('Enter a valid amount!');
        return;
    }
    
    if (!confirm(`Remove $${amount} from ${username}?`)) return;
    
    try {
        await apiRemoveFunds(username, amount);
        showNotification(`✅ Removed $${amount.toFixed(2)} points from ${username}`);
        loadAdminUsers();
        
        // Refresh current user data if it's the logged-in user
        if (currentUser && currentUser.username === username) {
            const stats = await apiGetStats();
            currentUserData = stats;
            updateUI();
        }
        
        log(`Admin removed $${amount} from ${username}`);
    } catch (error) {
        logError('Remove funds error:', error);
        showNotification(`❌ Error: ${error.message}`);
    }
}

// ============================================================
//  ADMIN REQUEST MANAGEMENT
// ============================================================

async function loadAdminRequests() {
    if (!isAdmin) return;
    
    try {
        await Promise.all([
            loadDepositsPending(),
            loadWithdrawalsPending(),
            loadDepositsProcessed(),
            loadWithdrawalsProcessed()
        ]);
        log('✅ Admin requests loaded');
    } catch (error) {
        logError('Failed to load requests:', error);
    }
}

async function loadDepositsPending() {
    try {
        const deposits = await apiGetDepositsPending();
        const container = document.getElementById('depositsList');
        
        if (!container) return;
        
        if (deposits.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:40px;">✅ No pending deposits</div>';
            return;
        }
        
        let html = `<table class="admin-table"><thead><tr>
            <th>Date</th><th>User</th><th>Amount ($)</th><th>Crypto</th><th>TXID / Wallet</th><th>Actions</th>
        </tr></thead><tbody>`;
        
        for (const deposit of deposits) {
            html += `<tr>
                <td>${new Date(deposit.createdAt).toLocaleString()}</td>
                <td>${deposit.username || 'Unknown'}</td>
                <td style="color:#22c55e;">$${deposit.amount.toFixed(2)}</td>
                <td>${deposit.cryptoMethod || 'N/A'}</td>
                <td style="font-size:0.7rem;max-width:200px;word-break:break-all;">${deposit.transactionId || deposit.walletAddress || 'N/A'}</td>
                <td class="action-buttons">
                    <button class="approve-btn" onclick="approveDeposit('${deposit._id}')">✅ Approve</button>
                    <button class="reject-btn" onclick="rejectDeposit('${deposit._id}')">❌ Reject</button>
                </td>
            </tr>`;
        }
        
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (error) {
        logError('Load pending deposits error:', error);
        const container = document.getElementById('depositsList');
        if (container) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#ef4444;">❌ Failed to load deposits</div>';
        }
    }
}

async function loadWithdrawalsPending() {
    try {
        const withdrawals = await apiGetWithdrawalsPending();
        const container = document.getElementById('withdrawalsList');
        
        if (!container) return;
        
        if (withdrawals.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:40px;">✅ No pending withdrawals</div>';
            return;
        }
        
        let html = `<table class="admin-table"><thead><tr>
            <th>Date</th><th>User</th><th>Amount ($)</th><th>Crypto</th><th>Wallet Address</th><th>Actions</th>
        </tr></thead><tbody>`;
        
        for (const withdrawal of withdrawals) {
            html += `<tr>
                <td>${new Date(withdrawal.createdAt).toLocaleString()}</td>
                <td>${withdrawal.username || 'Unknown'}</td>
                <td style="color:#facc15;">$${withdrawal.amount.toFixed(2)}</td>
                <td>${withdrawal.cryptoMethod || 'N/A'}</td>
                <td style="font-size:0.7rem;max-width:200px;word-break:break-all;">${withdrawal.walletAddress || 'N/A'}</td>
                <td class="action-buttons">
                    <button class="approve-btn" onclick="approveWithdrawal('${withdrawal._id}')">✅ Approve</button>
                    <button class="reject-btn" onclick="rejectWithdrawal('${withdrawal._id}')">❌ Reject</button>
                </td>
            </tr>`;
        }
        
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (error) {
        logError('Load pending withdrawals error:', error);
        const container = document.getElementById('withdrawalsList');
        if (container) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#ef4444;">❌ Failed to load withdrawals</div>';
        }
    }
}

async function loadDepositsProcessed() {
    try {
        const deposits = await apiGetDepositsProcessed();
        const container = document.getElementById('depositsProcessedList');
        
        if (!container) return;
        
        if (deposits.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:40px;">📭 No processed deposits</div>';
            return;
        }
        
        let html = `<table class="admin-table"><thead><tr>
            <th>Date</th><th>User</th><th>Amount ($)</th><th>Status</th><th>Processed By</th>
        </tr></thead><tbody>`;
        
        for (const deposit of deposits) {
            const statusBadge = getStatusBadge(deposit.status);
            html += `<tr>
                <td>${new Date(deposit.processedAt || deposit.createdAt).toLocaleString()}</td>
                <td>${deposit.username || 'Unknown'}</td>
                <td style="color:#22c55e;">$${deposit.amount.toFixed(2)}</td>
                <td>${statusBadge}</td>
                <td>${deposit.processedBy || 'Admin'}</td>
            </tr>`;
        }
        
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (error) {
        logError('Load processed deposits error:', error);
        const container = document.getElementById('depositsProcessedList');
        if (container) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#ef4444;">❌ Failed to load processed deposits</div>';
        }
    }
}

async function loadWithdrawalsProcessed() {
    try {
        const withdrawals = await apiGetWithdrawalsProcessed();
        const container = document.getElementById('withdrawalsProcessedList');
        
        if (!container) return;
        
        if (withdrawals.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:40px;">📭 No processed withdrawals</div>';
            return;
        }
        
        let html = `<table class="admin-table"><thead><tr>
            <th>Date</th><th>User</th><th>Amount ($)</th><th>Status</th><th>Processed By</th>
        </tr></thead><tbody>`;
        
        for (const withdrawal of withdrawals) {
            const statusBadge = getStatusBadge(withdrawal.status);
            html += `<tr>
                <td>${new Date(withdrawal.processedAt || withdrawal.createdAt).toLocaleString()}</td>
                <td>${withdrawal.username || 'Unknown'}</td>
                <td style="color:#facc15;">$${withdrawal.amount.toFixed(2)}</td>
                <td>${statusBadge}</td>
                <td>${withdrawal.processedBy || 'Admin'}</td>
            </tr>`;
        }
        
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (error) {
        logError('Load processed withdrawals error:', error);
        const container = document.getElementById('withdrawalsProcessedList');
        if (container) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#ef4444;">❌ Failed to load processed withdrawals</div>';
        }
    }
}

// ============================================================
//  ADMIN REQUEST ACTIONS
// ============================================================

async function approveDeposit(requestId) {
    if (!confirm('Approve this deposit request?')) return;
    
    try {
        await apiApproveDeposit(requestId);
        showNotification('✅ Deposit approved successfully!');
        await loadAdminRequests();
        loadAdminUsers();
        log(`Deposit approved: ${requestId}`);
    } catch (error) {
        logError('Approve deposit error:', error);
        showNotification(`❌ Error: ${error.message}`);
    }
}

async function rejectDeposit(requestId) {
    const reason = prompt('Reason for rejection (optional):');
    if (reason === null) return;
    
    try {
        await apiRejectDeposit(requestId, reason);
        showNotification('❌ Deposit rejected');
        await loadAdminRequests();
        loadAdminUsers();
        log(`Deposit rejected: ${requestId}`);
    } catch (error) {
        logError('Reject deposit error:', error);
        showNotification(`❌ Error: ${error.message}`);
    }
}

async function approveWithdrawal(requestId) {
    if (!confirm('Approve this withdrawal request?')) return;
    
    try {
        await apiApproveWithdrawal(requestId);
        showNotification('✅ Withdrawal approved successfully!');
        await loadAdminRequests();
        loadAdminUsers();
        log(`Withdrawal approved: ${requestId}`);
    } catch (error) {
        logError('Approve withdrawal error:', error);
        showNotification(`❌ Error: ${error.message}`);
    }
}

async function rejectWithdrawal(requestId) {
    const reason = prompt('Reason for rejection (optional):');
    if (reason === null) return;
    
    try {
        await apiRejectWithdrawal(requestId, reason);
        showNotification('❌ Withdrawal rejected');
        await loadAdminRequests();
        loadAdminUsers();
        log(`Withdrawal rejected: ${requestId}`);
    } catch (error) {
        logError('Reject withdrawal error:', error);
        showNotification(`❌ Error: ${error.message}`);
    }
}

// ============================================================
//  ADMIN UI HELPERS
// ============================================================

function getStatusBadge(status) {
    const statusMap = {
        'pending': 'status-pending',
        'confirmed': 'status-confirmed',
        'completed': 'status-completed',
        'approved': 'status-approved',
        'rejected': 'status-rejected'
    };
    
    const displayNames = {
        'pending': '⏳ Pending',
        'confirmed': '✅ Confirmed',
        'completed': '✅ Completed',
        'approved': '✅ Approved',
        'rejected': '❌ Rejected'
    };
    
    const statusClass = statusMap[status] || 'status-unknown';
    const displayName = displayNames[status] || status || 'Unknown';
    
    return `<span class="status-badge ${statusClass}">${displayName}</span>`;
}

// ============================================================
//  ADMIN EVENT LISTENERS
// ============================================================

function setupAdminListeners() {
    DOM.adminAddBtn.onclick = adminAddFunds;
    DOM.adminRemoveBtn.onclick = adminRemoveFunds;
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshDashboardBtn');
    if (refreshBtn) {
        refreshBtn.onclick = function() {
            this.textContent = '🔄 Refreshing...';
            loadAdminRequests().then(() => {
                this.textContent = '🔄 Refresh';
                showNotification('✅ Dashboard refreshed');
            });
        };
    }
    
    // Tab switching
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.onclick = function() {
            document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const tab = this.dataset.tab;
            document.getElementById('depositsTab').style.display = tab === 'deposits' ? 'block' : 'none';
            document.getElementById('withdrawalsTab').style.display = tab === 'withdrawals' ? 'block' : 'none';
            document.getElementById('usersTab').style.display = tab === 'users' ? 'block' : 'none';
            document.getElementById('historyTab').style.display = tab === 'history' ? 'block' : 'none';
        };
    });
    
    log('✅ Admin listeners setup complete');
}

// ============================================================
//  ADMIN DASHBOARD INIT
// ============================================================

function initAdminDashboard() {
    if (!isAdmin) {
        log('Not an admin user');
        return;
    }
    
    DOM.adminPanel.style.display = 'block';
    DOM.adminBadge.style.display = 'inline-block';
    
    loadAdminUsers();
    loadAdminRequests();
    
    log('✅ Admin dashboard initialized');
}

// ----- EXPOSE GLOBALLY -----
window.loadAdminUsers = loadAdminUsers;
window.adminAddFunds = adminAddFunds;
window.adminRemoveFunds = adminRemoveFunds;
window.loadAdminRequests = loadAdminRequests;
window.loadDepositsPending = loadDepositsPending;
window.loadWithdrawalsPending = loadWithdrawalsPending;
window.loadDepositsProcessed = loadDepositsProcessed;
window.loadWithdrawalsProcessed = loadWithdrawalsProcessed;
window.approveDeposit = approveDeposit;
window.rejectDeposit = rejectDeposit;
window.approveWithdrawal = approveWithdrawal;
window.rejectWithdrawal = rejectWithdrawal;
window.getStatusBadge = getStatusBadge;
window.setupAdminListeners = setupAdminListeners;
window.initAdminDashboard = initAdminDashboard;
