// ============================================================
//  AUTH.JS - Authentication Logic (No Admin References)
// ============================================================

// ============================================================
//  SIGNUP
// ============================================================

async function signup(username, password) {
    if (!username || username.length < 3) {
        showNotification('❌ Username must be at least 3 characters');
        return false;
    }
    
    if (!password || password.length < 4) {
        showNotification('❌ Password must be at least 4 characters');
        return false;
    }
    
    try {
        showNotification('📝 Creating account...');
        
        const data = await apiSignup(username, password);
        
        setAuthToken(data.token);
        setUserData(data.user);
        authToken = data.token;
        currentUser = data.user;
        currentUserData = data.user;
        isAdmin = currentUser.isAdmin || false;
        
        showAuthUI();
        setGameEnabled(true);
        updateUI();
        
        showNotification(`✅ Welcome ${currentUser.username}!`);
        log(`User signed up: ${username}`);
        return true;
        
    } catch (error) {
        logError('Signup failed', error);
        showNotification(`❌ Signup failed: ${error.message}`);
        return false;
    }
}

// ============================================================
//  LOGIN
// ============================================================

async function login(username, password) {
    if (!username || !password) {
        showNotification('❌ Please enter username and password');
        return false;
    }
    
    try {
        showNotification('🔑 Logging in...');
        
        const data = await apiLogin(username, password);
        
        setAuthToken(data.token);
        setUserData(data.user);
        authToken = data.token;
        currentUser = data.user;
        currentUserData = data.user;
        isAdmin = currentUser.isAdmin || false;
        
        showAuthUI();
        setGameEnabled(true);
        updateUI();
        
        showNotification(`✅ Welcome back ${currentUser.username}!`);
        log(`User logged in: ${username}`);
        return true;
        
    } catch (error) {
        logError('Login failed', error);
        showNotification(`❌ Login failed: ${error.message}`);
        return false;
    }
}

// ============================================================
//  LOGOUT
// ============================================================

function logout() {
    const username = currentUser ? currentUser.username : 'User';
    
    clearAuthToken();
    setUserData(null);
    authToken = null;
    currentUser = null;
    currentUserData = null;
    isAdmin = false;
    selectedChoice = null;
    
    resetProgressiveRun();
    hideAuthUI();
    setGameEnabled(false);
    updateSelectedButton();
    
    DOM.loginUsername.value = '';
    DOM.loginPassword.value = '';
    
    showNotification(`👋 Logged out, ${username}`);
    log(`User logged out: ${username}`);
}

// ============================================================
//  CHECK SESSION
// ============================================================

async function checkSession() {
    const savedToken = getAuthToken();
    
    if (!savedToken) {
        log('No saved session found');
        return false;
    }
    
    try {
        log('Checking saved session...');
        authToken = savedToken;
        
        const user = await apiGetUser();
        
        if (!user) {
            throw new Error('No user data returned');
        }
        
        setUserData(user);
        currentUser = user;
        currentUserData = user;
        isAdmin = user.isAdmin || false;
        
        showAuthUI();
        setGameEnabled(true);
        updateUI();
        
        showNotification(`✅ Welcome back ${currentUser.username}!`);
        log(`Session restored for: ${currentUser.username}`);
        return true;
        
    } catch (error) {
        logWarning('Session expired or invalid', error);
        clearAuthToken();
        setUserData(null);
        authToken = null;
        currentUser = null;
        currentUserData = null;
        isAdmin = false;
        hideAuthUI();
        setGameEnabled(false);
        return false;
    }
}

// ============================================================
//  ADMIN LOGIN (For admin.html - Separate Page)
// ============================================================

async function adminLogin(username, password) {
    if (!username || !password) {
        showNotification('❌ Please enter admin credentials');
        return false;
    }
    
    try {
        showNotification('🔑 Admin login...');
        
        const data = await apiLogin(username, password);
        
        if (!data.user || !data.user.isAdmin) {
            throw new Error('Not an admin user');
        }
        
        // Store admin token separately (for admin.html)
        sessionStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, data.token);
        sessionStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(data.user));
        
        showNotification('✅ Admin login successful!');
        log(`Admin logged in: ${username}`);
        return true;
        
    } catch (error) {
        logError('Admin login failed', error);
        showNotification(`❌ Admin login failed: ${error.message}`);
        return false;
    }
}

function adminLogout() {
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
    showNotification('👋 Admin logged out');
    log('Admin logged out');
}

function getAdminToken() {
    return sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
}

function getAdminUser() {
    const stored = sessionStorage.getItem(STORAGE_KEYS.ADMIN_USER);
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
//  AUTH UI HELPERS
// ============================================================

function showAuthUI() {
    DOM.authForm.style.display = 'none';
    DOM.userInfo.style.display = 'block';
    DOM.currentUserDisplay.innerText = currentUser.username;
    DOM.userIdDisplay.innerText = currentUser.id;
    
    // ✅ Show admin badge if user is admin (just visual, no panel)
    if (isAdmin) {
        DOM.adminBadge.style.display = 'inline-block';
    } else {
        DOM.adminBadge.style.display = 'none';
    }
}

function hideAuthUI() {
    DOM.authForm.style.display = 'block';
    DOM.userInfo.style.display = 'none';
    DOM.adminBadge.style.display = 'none';
    DOM.balance.innerText = '0.00';
}

// ============================================================
//  AUTH EVENT LISTENERS
// ============================================================

function setupAuthListeners() {
    DOM.loginBtn.onclick = function() {
        const username = DOM.loginUsername.value.trim();
        const password = DOM.loginPassword.value;
        login(username, password);
    };
    
    DOM.signupBtn.onclick = function() {
        const username = DOM.loginUsername.value.trim();
        const password = DOM.loginPassword.value;
        signup(username, password);
    };
    
    DOM.logoutBtn.onclick = function() {
        if (confirm('Are you sure you want to logout?')) {
            logout();
        }
    };
    
    // Enter key on password field triggers login
    DOM.loginPassword.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            DOM.loginBtn.click();
        }
    });
    
    // Enter key on username field moves to password
    DOM.loginUsername.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            DOM.loginPassword.focus();
        }
    });
    
    log('✅ Auth listeners setup complete');
}

// ============================================================
//  PASSWORD VISIBILITY TOGGLE (Optional)
// ============================================================

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        showNotification('👁️ Password visible');
    } else {
        input.type = 'password';
        showNotification('🔒 Password hidden');
    }
}

// ----- EXPOSE GLOBALLY -----
window.signup = signup;
window.login = login;
window.logout = logout;
window.checkSession = checkSession;
window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.getAdminToken = getAdminToken;
window.getAdminUser = getAdminUser;
window.setupAuthListeners = setupAuthListeners;
window.togglePasswordVisibility = togglePasswordVisibility;
window.showAuthUI = showAuthUI;
window.hideAuthUI = hideAuthUI;
