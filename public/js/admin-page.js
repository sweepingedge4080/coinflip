// ============================================================
//  ADMIN-PAGE.JS - Admin Dashboard Logic
// ============================================================

// ----- STATE -----
let adminAuthToken = null;
let adminUserData = null;

// ----- DOM READY -----
document.addEventListener('DOMContentLoaded', function() {
    const savedToken = sessionStorage.getItem('adminAuthToken');
    if (savedToken) {
        adminAuthToken = savedToken;
        verifyAndShowDashboard();
    }

    setupAdminLogin();
    setupAdminLogout();
    setupAdminTabs();
    setupRefreshButton();
    setupManualFunds();
});

// ============================================================
//  ADMIN LOGIN
// ============================================================

function setupAdminLogin() {
    const loginBtn = document.getElementById('adminLoginBtn');
    if (!loginBtn) return;

    loginBtn.addEventListener('click', async function() {
        const username = document.getElementById('adminUsername').value.trim();
        const password = document.getElementById('adminPassword').value;

        if (!username || !password) {
            document.getElementById('loginError').innerText = 'Please enter username and password';
            return;
        }

        document.getElementById('loginError').innerText = '';
        this.disabled = true;
        this.innerText = 'Logging in...';

        try {
            // First, login
            const loginResponse = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const loginData = await loginResponse.json();
            if (!loginResponse.ok) throw new Error(loginData.error || 'Login failed');

            const token = loginData.token;

            // Then, check if user is admin
            const meResponse = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const userData = await meResponse.json();
            if (!meResponse.ok) throw new Error('Failed to get user data');

            if (!userData.isAdmin) {
                throw new Error('User is not an administrator. Access denied.');
            }

            // Store admin session
            adminAuthToken = token;
            adminUserData = userData;
            sessionStorage.setItem('adminAuthToken', token);
            sessionStorage.setItem('adminUser', JSON.stringify(userData));

            // Show dashboard
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            document.getElementById('adminUserDisplay').innerText = userData.username.toUpperCase();

            // Load data
            loadDashboardData();
            loadUserSelect();

        } catch (error) {
            document.getElementById('loginError').innerText = error.message;
        } finally {
            this.disabled = false;
            this.innerText = '🔓 LOGIN TO DASHBOARD';
        }
    });

    // Enter key on password field triggers login
    const passwordInput = document.getElementById('adminPassword');
    if (passwordInput) {
        passwordInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('adminLoginBtn').click();
            }
        });
    }
}

// ============================================================
//  VERIFY SESSION
// ============================================================

async function verifyAndShowDashboard() {
    try {
        const meResponse = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${adminAuthToken}` }
        });

        if (!meResponse.ok) throw new Error('Session expired');

        const userData = await meResponse.json();
        if (!userData.isAdmin) throw new Error('Not admin');

        adminUserData = userData;
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('adminUserDisplay').innerText = userData.username.toUpperCase();

        loadDashboardData();
        loadUserSelect();

    } catch (error) {
        sessionStorage.removeItem('adminAuthToken');
        sessionStorage.removeItem('adminUser');
        adminAuthToken = null;
    }
}

// ============================================================
//  ADMIN LOGOUT
// ============================================================

function setupAdminLogout() {
    const logoutBtn = document.getElementById('logoutDashboardBtn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', function() {
        if (confirm('Logout from admin dashboard?')) {
            sessionStorage.removeItem('adminAuthToken');
            sessionStorage.removeItem('adminUser');
            adminAuthToken = null;
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('dashboard').style.display = 'none';
        }
    });
}

// ============================================================
//  API CALL
// ============================================================

async function adminApiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminAuthToken}`
        }
    };
    if (data) options.body = JSON.stringify(data);

    const response = await fetch(`/api${endpoint}`, options);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'API error');
    return result;
}

// ============================================================
//  LOAD DATA
// ============================================================

async function loadDashboardData() {
    try {
        await Promise.all([
            loadDeposits(),
            loadWithdrawals(),
            loadUsers(),
            loadHistory(),
            loadStats()
        ]);
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showNotification('❌ Failed to load dashboard data');
    }
}

async function loadUserSelect() {
    try {
        const users = await adminApiCall('/admin/users');
        const select = document.getElementById('manualUserSelect');
        if (!select) return;

        select.innerHTML = '<option value="">-- Select User --</option>';
        for (const user of users) {
            const option = document.createElement('option');
            option.value = user.username;
            option.textContent = `${user.username} - Balance: $${user.balance.toFixed(2)}`;
            select.appendChild(option);
        }
    } catch (error) {
        console.error('Failed to load users for select:', error);
    }
}

async function loadStats() {
    try {
        const [users, deposits, withdrawals] = await Promise.all([
            adminApiCall('/admin/users'),
            adminApiCall('/admin/requests/deposits/pending'),
            adminApiCall('/admin/requests/withdrawals/pending')
        ]);

        document.getElementById('totalUsers').innerText = users.length;
        document.getElementById('pendingDeposits').innerText = deposits.length;
        document.getElementById('pendingWithdrawals').innerText = withdrawals.length;

        let totalVolume = users.reduce((sum, user) => sum + (user.totalWagered || 0), 0);
        document.getElementById('totalVolume').innerText = totalVolume.toFixed(0);
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

async function loadDeposits() {
    try {
        const deposits = await adminApiCall('/admin/requests/deposits/pending');
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
                    <button class="approve-btn" data-id="${deposit._id}" data-type="deposit">✅ Approve</button>
                    <button class="reject-btn" data-id="${deposit._id}" data-type="deposit">❌ Reject</button>
                </td>
            </tr>`;
        }
        html += '</tbody></table>';
        container.innerHTML = html;

        // Attach event listeners to approve/reject buttons
        container.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', () => approveDeposit(btn.dataset.id));
        });
        container.querySelectorAll('.reject-btn').forEach(btn => {
            btn.addEventListener('click', () => rejectDeposit(btn.dataset.id));
        });

    } catch (error) {
        console.error('Failed to load deposits:', error);
        const container = document.getElementById('depositsList');
        if (container) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#ef4444;">❌ Failed to load deposits</div>';
        }
    }
}

async function loadWithdrawals() {
    try {
        const withdrawals = await adminApiCall('/admin/requests/withdrawals/pending');
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
                    <button class="approve-btn" data-id="${withdrawal._id}" data-type="withdrawal">✅ Approve</button>
                    <button class="reject-btn" data-id="${withdrawal._id}" data-type="withdrawal">❌ Reject</button>
                </td>
            </tr>`;
        }
        html += '</tbody></table>';
        container.innerHTML = html;

        container.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', () => approveWithdrawal(btn.dataset.id));
        });
        container.querySelectorAll('.reject-btn').forEach(btn => {
            btn.addEventListener('click', () => rejectWithdrawal(btn.dataset.id));
        });

    } catch (error) {
        console.error('Failed to load withdrawals:', error);
        const container = document.getElementById('withdrawalsList');
        if (container) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#ef4444;">❌ Failed to load withdrawals</div>';
        }
    }
}

async function loadUsers() {
    try {
        const users = await adminApiCall('/admin/users');
        const container = document.getElementById('usersList');
        if (!container) return;

        if (users.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:40px;">No users yet</div>';
            return;
        }

        let html = `<table class="admin-table"><thead><tr>
            <th>Username</th><th>Balance ($)</th><th>Wins/Losses</th><th>Win Rate</th><th>Total Wagered ($)</th><th>Joined</th>
        </tr></thead><tbody>`;

        for (const user of users) {
            const total = (user.wins || 0) + (user.losses || 0);
            const winRate = total > 0 ? ((user.wins / total) * 100).toFixed(1) : 0;
            html += `<tr>
                <td>${user.username} ${user.isAdmin ? '👑' : ''}</td>
                <td style="color:#facc15;">$${user.balance.toFixed(2)}</td>
                <td>${user.wins || 0}/${user.losses || 0}</td>
                <td>${winRate}%</td>
                <td>$${(user.totalWagered || 0).toFixed(2)}</td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            </tr>`;
        }
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (error) {
        console.error('Failed to load users:', error);
        const container = document.getElementById('usersList');
        if (container) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#ef4444;">❌ Failed to load users</div>';
        }
    }
}

async function loadHistory() {
    try {
        const [deposits, withdrawals] = await Promise.all([
            adminApiCall('/admin/requests/deposits/processed'),
            adminApiCall('/admin/requests/withdrawals/processed')
        ]);

        const container = document.getElementById('historyList');
        if (!container) return;

        const all = [
            ...deposits.map(d => ({ ...d, type: 'deposit' })),
            ...withdrawals.map(w => ({ ...w, type: 'withdraw' }))
        ].sort((a, b) => new Date(b.processedAt || b.createdAt) - new Date(a.processedAt || a.createdAt));

        if (all.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:40px;">📭 No processed requests yet</div>';
            return;
        }

        let html = `<table class="admin-table"><thead><tr>
            <th>Date</th><th>User</th><th>Type</th><th>Amount ($)</th><th>Status</th><th>Processed By</th>
        </tr></thead><tbody>`;

        for (const item of all) {
            const statusBadge = getStatusBadge(item.status);
            html += `<tr>
                <td>${new Date(item.processedAt || item.createdAt).toLocaleString()}</td>
                <td>${item.username || 'Unknown'}</td>
                <td>${item.type === 'deposit' ? '💵 Deposit' : '💰 Withdraw'}</td>
                <td style="color:${item.type === 'deposit' ? '#22c55e' : '#facc15'};">$${item.amount.toFixed(2)}</td>
                <td>${statusBadge}</td>
                <td>${item.processedBy || 'Admin'}</td>
            </tr>`;
        }
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (error) {
        console.error('Failed to load history:', error);
        const container = document.getElementById('historyList');
        if (container) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#ef4444;">❌ Failed to load history</div>';
        }
    }
}

// ============================================================
//  APPROVE / REJECT
// ============================================================

async function approveDeposit(requestId) {
    if (!confirm('Approve this deposit request?')) return;
    try {
        await adminApiCall('/admin/requests/deposit/approve', 'POST', { requestId });
        showNotification('✅ Deposit approved successfully!');
        loadDashboardData();
        loadUserSelect();
    } catch (error) {
        showNotification('❌ Error: ' + error.message);
    }
}

async function rejectDeposit(requestId) {
    const reason = prompt('Reason for rejection (optional):');
    if (reason === null) return;
    try {
        await adminApiCall('/admin/requests/deposit/reject', 'POST', { requestId, reason });
        showNotification('❌ Deposit rejected');
        loadDashboardData();
        loadUserSelect();
    } catch (error) {
        showNotification('❌ Error: ' + error.message);
    }
}

async function approveWithdrawal(requestId) {
    if (!confirm('Approve this withdrawal request?')) return;
    try {
        await adminApiCall('/admin/requests/withdrawal/approve', 'POST', { requestId });
        showNotification('✅ Withdrawal approved successfully!');
        loadDashboardData();
        loadUserSelect();
    } catch (error) {
        showNotification('❌ Error: ' + error.message);
    }
}

async function rejectWithdrawal(requestId) {
    const reason = prompt('Reason for rejection (optional):');
    if (reason === null) return;
    try {
        await adminApiCall('/admin/requests/withdrawal/reject', 'POST', { requestId, reason });
        showNotification('❌ Withdrawal rejected');
        loadDashboardData();
        loadUserSelect();
    } catch (error) {
        showNotification('❌ Error: ' + error.message);
    }
}

// ============================================================
//  MANUAL FUNDS
// ============================================================

function setupManualFunds() {
    const addBtn = document.getElementById('manualAddBtn');
    const removeBtn = document.getElementById('manualRemoveBtn');
    const userSelect = document.getElementById('manualUserSelect');
    const amountInput = document.getElementById('manualAmount');

    if (addBtn) {
        addBtn.addEventListener('click', async function() {
            const username = userSelect.value;
            const amount = parseFloat(amountInput.value);

            if (!username) { showNotification('Select a user first!'); return; }
            if (!amount || amount <= 0) { showNotification('Enter a valid amount!'); return; }
            if (!confirm(`Add $${amount} to ${username}?`)) return;

            try {
                await adminApiCall('/admin/add-funds', 'POST', { username, amount });
                showNotification(`✅ Added $${amount.toFixed(2)} points to ${username}`);
                loadDashboardData();
                loadUserSelect();
                amountInput.value = '';
            } catch (error) {
                showNotification('❌ Error: ' + error.message);
            }
        });
    }

    if (removeBtn) {
        removeBtn.addEventListener('click', async function() {
            const username = userSelect.value;
            const amount = parseFloat(amountInput.value);

            if (!username) { showNotification('Select a user first!'); return; }
            if (!amount || amount <= 0) { showNotification('Enter a valid amount!'); return; }
            if (!confirm(`Remove $${amount} from ${username}?`)) return;

            try {
                await adminApiCall('/admin/remove-funds', 'POST', { username, amount });
                showNotification(`✅ Removed $${amount.toFixed(2)} points from ${username}`);
                loadDashboardData();
                loadUserSelect();
                amountInput.value = '';
            } catch (error) {
                showNotification('❌ Error: ' + error.message);
            }
        });
    }
}

// ============================================================
//  TABS
// ============================================================

function setupAdminTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const tab = this.dataset.tab;
            document.getElementById('depositsTab').style.display = tab === 'deposits' ? 'block' : 'none';
            document.getElementById('withdrawalsTab').style.display = tab === 'withdrawals' ? 'block' : 'none';
            document.getElementById('usersTab').style.display = tab === 'users' ? 'block' : 'none';
            document.getElementById('historyTab').style.display = tab === 'history' ? 'block' : 'none';
        });
    });
}

// ============================================================
//  REFRESH
// ============================================================

function setupRefreshButton() {
    const refreshBtn = document.getElementById('refreshDashboardBtn');
    if (!refreshBtn) return;

    refreshBtn.addEventListener('click', function() {
        this.textContent = '🔄 Refreshing...';
        loadDashboardData().then(() => {
            this.textContent = '🔄 Refresh';
            showNotification('✅ Dashboard refreshed');
        });
    });
}

// ============================================================
//  NOTIFICATIONS
// ============================================================

function showNotification(msg) {
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.innerHTML = msg;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

// ============================================================
//  STATUS BADGE
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
