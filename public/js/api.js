// ============================================================
//  API.JS - All API Calls
// ============================================================

// ----- STATE -----
let authToken = null;
let currentUser = null;
let currentUserData = null;
let isAdmin = false;

// ============================================================
//  CORE API CALL
// ============================================================

async function apiCall(endpoint, method = 'GET', data = null) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const options = {
        method,
        headers,
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE}/api${endpoint}`, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'API request failed');
        }
        
        return result;
    } catch (error) {
        logError(`API call failed: ${endpoint}`, error);
        throw error;
    }
}

// ============================================================
//  AUTH ENDPOINTS
// ============================================================

async function apiLogin(username, password) {
    log(`Logging in: ${username}`);
    return apiCall('/auth/login', 'POST', { username, password });
}

async function apiSignup(username, password) {
    log(`Signing up: ${username}`);
    return apiCall('/auth/signup', 'POST', { username, password });
}

async function apiGetUser() {
    return apiCall('/auth/me');
}

// ============================================================
//  GAME ENDPOINTS
// ============================================================

async function apiFlip(betAmount, choice, progressiveStreak = 0, originalBet = null) {
    return apiCall('/game/flip', 'POST', {
        betAmount,
        choice,
        progressiveStreak,
        originalBet: originalBet || betAmount
    });
}

async function apiGetStats() {
    return apiCall('/game/stats');
}

async function apiAddProgressive(amount, streak) {
    return apiCall('/game/add-progressive', 'POST', { amount, streak });
}

// ============================================================
//  DEPOSIT ENDPOINTS
// ============================================================

async function apiRequestDeposit(data) {
    return apiCall('/deposit/request-deposit', 'POST', data);
}

async function apiRequestWithdraw(data) {
    return apiCall('/deposit/request-withdraw', 'POST', data);
}

// ============================================================
//  ADMIN ENDPOINTS
// ============================================================

async function apiGetUsers() {
    return apiCall('/admin/users');
}

async function apiAddFunds(username, amount) {
    return apiCall('/admin/add-funds', 'POST', { username, amount });
}

async function apiRemoveFunds(username, amount) {
    return apiCall('/admin/remove-funds', 'POST', { username, amount });
}

async function apiGetDepositsPending() {
    return apiCall('/admin/requests/deposits/pending');
}

async function apiGetDepositsProcessed() {
    return apiCall('/admin/requests/deposits/processed');
}

async function apiGetWithdrawalsPending() {
    return apiCall('/admin/requests/withdrawals/pending');
}

async function apiGetWithdrawalsProcessed() {
    return apiCall('/admin/requests/withdrawals/processed');
}

async function apiApproveDeposit(requestId) {
    return apiCall('/admin/requests/deposit/approve', 'POST', { requestId });
}

async function apiRejectDeposit(requestId, reason = null) {
    return apiCall('/admin/requests/deposit/reject', 'POST', { requestId, reason });
}

async function apiApproveWithdrawal(requestId) {
    return apiCall('/admin/requests/withdrawal/approve', 'POST', { requestId });
}

async function apiRejectWithdrawal(requestId, reason = null) {
    return apiCall('/admin/requests/withdrawal/reject', 'POST', { requestId, reason });
}

// ============================================================
//  TOKEN MANAGEMENT
// ============================================================

function setAuthToken(token) {
    authToken = token;
    if (token) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    }
}

function getAuthToken() {
    return authToken || localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
}

function clearAuthToken() {
    authToken = null;
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
}

function setUserData(user) {
    currentUser = user;
    currentUserData = user;
    if (user) {
        isAdmin = user.isAdmin || false;
        localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(user));
    } else {
        isAdmin = false;
        localStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
    }
}

function getUserData() {
    if (currentUserData) return currentUserData;
    const stored = localStorage.getItem(STORAGE_KEYS.ADMIN_USER);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            return null;
        }
    }
    return null;
}

// ----- EXPOSE GLOBALLY -----
window.apiCall = apiCall;
window.apiLogin = apiLogin;
window.apiSignup = apiSignup;
window.apiGetUser = apiGetUser;
window.apiFlip = apiFlip;
window.apiGetStats = apiGetStats;
window.apiAddProgressive = apiAddProgressive;
window.apiRequestDeposit = apiRequestDeposit;
window.apiRequestWithdraw = apiRequestWithdraw;
window.apiGetUsers = apiGetUsers;
window.apiAddFunds = apiAddFunds;
window.apiRemoveFunds = apiRemoveFunds;
window.apiGetDepositsPending = apiGetDepositsPending;
window.apiGetDepositsProcessed = apiGetDepositsProcessed;
window.apiGetWithdrawalsPending = apiGetWithdrawalsPending;
window.apiGetWithdrawalsProcessed = apiGetWithdrawalsProcessed;
window.apiApproveDeposit = apiApproveDeposit;
window.apiRejectDeposit = apiRejectDeposit;
window.apiApproveWithdrawal = apiApproveWithdrawal;
window.apiRejectWithdrawal = apiRejectWithdrawal;
window.setAuthToken = setAuthToken;
window.getAuthToken = getAuthToken;
window.clearAuthToken = clearAuthToken;
window.setUserData = setUserData;
window.getUserData = getUserData;
window.authToken = authToken;
window.currentUser = currentUser;
window.currentUserData = currentUserData;
window.isAdmin = isAdmin;
