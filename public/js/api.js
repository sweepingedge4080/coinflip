// ============================================================
//  API.JS - All API Calls with Security & Validation
// ============================================================

// ----- STATE -----
let authToken = null;
let currentUser = null;
let currentUserData = null;
let isAdmin = false;

// ============================================================
//  CORE API CALL WITH VALIDATION
// ============================================================

async function apiCall(endpoint, method = 'GET', data = null) {
    // Validate endpoint
    if (!endpoint || typeof endpoint !== 'string') {
        throw new Error('Invalid API endpoint');
    }
    
    // Validate method
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (!validMethods.includes(method.toUpperCase())) {
        throw new Error(`Invalid HTTP method: ${method}`);
    }
    
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    
    if (authToken) {
        // Validate token format (basic check)
        if (typeof authToken !== 'string' || authToken.length < 10) {
            logWarning('Auth token appears invalid');
        }
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const options = {
        method: method.toUpperCase(),
        headers,
    };
    
    if (data) {
        try {
            // Validate data can be stringified
            JSON.stringify(data);
            options.body = JSON.stringify(data);
        } catch (e) {
            throw new Error('Invalid request data');
        }
    }
    
    // ✅ FIX: Build full URL correctly
    const baseUrl = API_BASE || '';
    // Ensure endpoint starts with /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    const fullUrl = baseUrl + '/api' + cleanEndpoint;
    
    log(`📡 API Call: ${method} ${fullUrl}`);
    
    try {
        const response = await fetch(fullUrl, options);
        
        // Parse response
        let result;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            result = await response.json();
        } else {
            // Handle non-JSON responses
            const text = await response.text();
            logWarning(`Non-JSON response: ${text.substring(0, 100)}`);
            throw new Error(`Unexpected response format`);
        }
        
        // Check response status
        if (!response.ok) {
            const errorMessage = result?.error || result?.message || `HTTP ${response.status}`;
            throw new Error(errorMessage);
        }
        
        // Validate response structure for non-GET requests
        if (method !== 'GET' && method !== 'DELETE') {
            if (!result || typeof result !== 'object') {
                throw new Error('Invalid response from server');
            }
        }
        
        return result;
        
    } catch (error) {
        // Check for network errors
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            logError('Network error - server may be down', error);
            throw new Error('Network error. Please check your connection.');
        }
        
        // Check for timeout
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
        }
        
        logError(`API call failed: ${endpoint}`, error);
        throw error;
    }
}

// ============================================================
//  AUTH ENDPOINTS
// ============================================================

async function apiLogin(username, password) {
    // Validate inputs
    if (!username || typeof username !== 'string') {
        throw new Error('Username is required');
    }
    if (!password || typeof password !== 'string') {
        throw new Error('Password is required');
    }
    if (username.length < 3 || username.length > 20) {
        throw new Error('Username must be 3-20 characters');
    }
    if (password.length < 4) {
        throw new Error('Password must be at least 4 characters');
    }
    
    log(`Logging in: ${username}`);
    return apiCall('/auth/login', 'POST', { username, password });
}

async function apiSignup(username, password) {
    // Validate inputs
    if (!username || typeof username !== 'string') {
        throw new Error('Username is required');
    }
    if (!password || typeof password !== 'string') {
        throw new Error('Password is required');
    }
    if (username.length < 3 || username.length > 20) {
        throw new Error('Username must be 3-20 characters');
    }
    if (password.length < 4) {
        throw new Error('Password must be at least 4 characters');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        throw new Error('Username can only contain letters, numbers, and underscores');
    }
    
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
    // Validate inputs
    if (!betAmount || typeof betAmount !== 'number' || betAmount <= 0) {
        throw new Error('Invalid bet amount');
    }
    if (betAmount > 10000) {
        throw new Error('Bet amount cannot exceed $10,000');
    }
    if (choice !== 'heads' && choice !== 'tails') {
        throw new Error('Invalid choice. Must be "heads" or "tails"');
    }
    if (typeof progressiveStreak !== 'number' || progressiveStreak < 0) {
        progressiveStreak = 0;
    }
    if (originalBet !== null && (typeof originalBet !== 'number' || originalBet <= 0)) {
        originalBet = betAmount;
    }
    
    // Ensure bet is properly formatted (2 decimals)
    const sanitizedBet = Math.round(betAmount * 100) / 100;
    const sanitizedOriginal = originalBet ? Math.round(originalBet * 100) / 100 : sanitizedBet;
    
    return apiCall('/game/flip', 'POST', {
        betAmount: sanitizedBet,
        choice: choice,
        progressiveStreak: Math.round(progressiveStreak),
        originalBet: sanitizedOriginal
    });
}

async function apiGetStats() {
    return apiCall('/game/stats');
}

async function apiAddProgressive(amount, streak) {
    // Validate inputs
    if (!amount || typeof amount !== 'number' || amount <= 0) {
        throw new Error('Invalid progressive amount');
    }
    if (amount > 100000) {
        throw new Error('Amount cannot exceed $100,000');
    }
    if (typeof streak !== 'number' || streak < 0) {
        streak = 0;
    }
    
    const sanitizedAmount = Math.round(amount * 100) / 100;
    return apiCall('/game/add-progressive', 'POST', { 
        amount: sanitizedAmount, 
        streak: Math.round(streak) 
    });
}

// ============================================================
//  DEPOSIT ENDPOINTS
// ============================================================

async function apiRequestDeposit(data) {
    // Validate data
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid deposit data');
    }
    
    const { amount, amountPoints, cryptoMethod, walletAddress, transactionId, note } = data;
    
    if (!amount || typeof amount !== 'number' || amount < 10) {
        throw new Error('Deposit must be at least 10 points');
    }
    if (amount > 100000) {
        throw new Error('Deposit cannot exceed 100,000 points');
    }
    if (!cryptoMethod || typeof cryptoMethod !== 'string') {
        throw new Error('Crypto method is required');
    }
    if (!walletAddress || typeof walletAddress !== 'string' || walletAddress.length < 5) {
        throw new Error('Valid wallet address is required');
    }
    
    const sanitized = {
        amount: Math.round(amount * 100) / 100,
        amountPoints: Math.round((amountPoints || amount) * 100) / 100,
        cryptoMethod: cryptoMethod.substring(0, 50),
        walletAddress: walletAddress.substring(0, 200),
        transactionId: transactionId ? transactionId.substring(0, 200) : walletAddress.substring(0, 200),
        note: note ? note.substring(0, 500) : ''
    };
    
    return apiCall('/deposit/request-deposit', 'POST', sanitized);
}

async function apiRequestWithdraw(data) {
    // Validate data
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid withdrawal data');
    }
    
    const { amount, amountPoints, cryptoMethod, walletAddress, note } = data;
    
    if (!amount || typeof amount !== 'number' || amount < 10) {
        throw new Error('Withdrawal must be at least 10 points');
    }
    if (amount > 100000) {
        throw new Error('Withdrawal cannot exceed 100,000 points');
    }
    if (!cryptoMethod || typeof cryptoMethod !== 'string') {
        throw new Error('Crypto method is required');
    }
    if (!walletAddress || typeof walletAddress !== 'string' || walletAddress.length < 5) {
        throw new Error('Valid wallet address is required');
    }
    
    const sanitized = {
        amount: Math.round(amount * 100) / 100,
        amountPoints: Math.round((amountPoints || amount) * 100) / 100,
        cryptoMethod: cryptoMethod.substring(0, 50),
        walletAddress: walletAddress.substring(0, 200),
        note: note ? note.substring(0, 500) : ''
    };
    
    return apiCall('/deposit/request-withdraw', 'POST', sanitized);
}

// ============================================================
//  ADMIN ENDPOINTS
// ============================================================

async function apiGetUsers() {
    return apiCall('/admin/users');
}

async function apiAddFunds(username, amount) {
    // Validate inputs
    if (!username || typeof username !== 'string' || username.length < 3) {
        throw new Error('Valid username is required');
    }
    if (!amount || typeof amount !== 'number' || amount <= 0) {
        throw new Error('Invalid amount');
    }
    if (amount > 100000) {
        throw new Error('Cannot add more than $100,000 at once');
    }
    
    const sanitizedAmount = Math.round(amount * 100) / 100;
    return apiCall('/admin/add-funds', 'POST', { 
        username: username.substring(0, 20), 
        amount: sanitizedAmount 
    });
}

async function apiRemoveFunds(username, amount) {
    // Validate inputs
    if (!username || typeof username !== 'string' || username.length < 3) {
        throw new Error('Valid username is required');
    }
    if (!amount || typeof amount !== 'number' || amount <= 0) {
        throw new Error('Invalid amount');
    }
    if (amount > 100000) {
        throw new Error('Cannot remove more than $100,000 at once');
    }
    
    const sanitizedAmount = Math.round(amount * 100) / 100;
    return apiCall('/admin/remove-funds', 'POST', { 
        username: username.substring(0, 20), 
        amount: sanitizedAmount 
    });
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
    // Validate input
    if (!requestId || typeof requestId !== 'string' || requestId.length < 10) {
        throw new Error('Valid request ID is required');
    }
    return apiCall('/admin/requests/deposit/approve', 'POST', { requestId });
}

async function apiRejectDeposit(requestId, reason = null) {
    // Validate input
    if (!requestId || typeof requestId !== 'string' || requestId.length < 10) {
        throw new Error('Valid request ID is required');
    }
    const sanitizedReason = reason ? reason.substring(0, 500) : null;
    return apiCall('/admin/requests/deposit/reject', 'POST', { 
        requestId, 
        reason: sanitizedReason 
    });
}

async function apiApproveWithdrawal(requestId) {
    // Validate input
    if (!requestId || typeof requestId !== 'string' || requestId.length < 10) {
        throw new Error('Valid request ID is required');
    }
    return apiCall('/admin/requests/withdrawal/approve', 'POST', { requestId });
}

async function apiRejectWithdrawal(requestId, reason = null) {
    // Validate input
    if (!requestId || typeof requestId !== 'string' || requestId.length < 10) {
        throw new Error('Valid request ID is required');
    }
    const sanitizedReason = reason ? reason.substring(0, 500) : null;
    return apiCall('/admin/requests/withdrawal/reject', 'POST', { 
        requestId, 
        reason: sanitizedReason 
    });
}

// ============================================================
//  TOKEN MANAGEMENT
// ============================================================

function setAuthToken(token) {
    if (token && typeof token !== 'string') {
        logWarning('Invalid token type provided');
        return;
    }
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
    if (user && typeof user !== 'object') {
        logWarning('Invalid user data type');
        return;
    }
    currentUser = user;
    currentUserData = user;
    if (user) {
        isAdmin = user.isAdmin || false;
        try {
            localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(user));
        } catch (e) {
            logWarning('Failed to save user data to localStorage');
        }
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

// ============================================================
//  RESPONSE VALIDATION HELPERS
// ============================================================

function validateUserResponse(data) {
    if (!data || typeof data !== 'object') return false;
    if (!data.id && !data._id) return false;
    if (!data.username) return false;
    if (typeof data.balance !== 'number') return false;
    return true;
}

function validateFlipResponse(data) {
    if (!data || typeof data !== 'object') return false;
    if (typeof data.isWin !== 'boolean') return false;
    if (typeof data.newBalance !== 'number') return false;
    if (typeof data.result !== 'string') return false;
    return true;
}

function validateStatsResponse(data) {
    if (!data || typeof data !== 'object') return false;
    if (typeof data.balance !== 'number') return false;
    if (typeof data.wins !== 'number') return false;
    if (typeof data.losses !== 'number') return false;
    return true;
}

// ============================================================
//  EXPOSE GLOBALLY
// ============================================================

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
window.validateUserResponse = validateUserResponse;
window.validateFlipResponse = validateFlipResponse;
window.validateStatsResponse = validateStatsResponse;
window.authToken = authToken;
window.currentUser = currentUser;
window.currentUserData = currentUserData;
window.isAdmin = isAdmin;
