// ============================================================
//  AUTH.JS - Authentication Logic with Validation
// ============================================================

// ============================================================
//  VALIDATION HELPERS
// ============================================================

function validateUsername(username) {
    if (!username) return { valid: false, message: 'Username is required' };
    if (username.length < 3) return { valid: false, message: 'Username must be at least 3 characters' };
    if (username.length > 20) return { valid: false, message: 'Username must be less than 20 characters' };
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
    }
    return { valid: true };
}

function validatePassword(password) {
    if (!password) return { valid: false, message: 'Password is required' };
    if (password.length < 4) return { valid: false, message: 'Password must be at least 4 characters' };
    if (password.length > 100) return { valid: false, message: 'Password must be less than 100 characters' };
    return { valid: true };
}

function sanitizeInput(input) {
    if (!input) return '';
    // Remove any HTML tags
    return String(input).replace(/<[^>]*>/g, '').trim();
}

// ============================================================
//  SIGNUP
// ============================================================

async function signup(username, password) {
    try {
        // Validate username
        const usernameValidation = validateUsername(username);
        if (!usernameValidation.valid) {
            showNotification(`❌ ${usernameValidation.message}`);
            return false;
        }
        
        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            showNotification(`❌ ${passwordValidation.message}`);
            return false;
        }
        
        // Sanitize username
        const sanitizedUsername = sanitizeInput(username);
        
        showNotification('📝 Creating account...');
        
        const data = await apiSignup(sanitizedUsername, password);
        
        if (!data || !data.token) {
            throw new Error('Invalid response from server');
        }
        
        setAuthToken(data.token);
        setUserData(data.user);
        authToken = data.token;
        currentUser = data.user;
        currentUserData = data.user;
        isAdmin = currentUser.isAdmin || false;
        
        showAuthUI();
        setGameEnabled(true);
        updateUI();
        
        // Clear input fields
        DOM.loginUsername.value = '';
        DOM.loginPassword.value = '';
        
        showNotification(`✅ Welcome ${currentUser.username}!`);
        log(`User signed up: ${sanitizedUsername}`);
        return true;
        
    } catch (error) {
        logError('Signup failed', error);
        showNotification(`❌ Signup failed: ${error.message || 'Unknown error'}`);
        return false;
    }
}

// ============================================================
//  LOGIN
// ============================================================

async function login(username, password) {
    try {
        // Validate inputs
        if (!username || !password) {
            showNotification('❌ Please enter username and password');
            return false;
        }
        
        // Validate username
        const usernameValidation = validateUsername(username);
        if (!usernameValidation.valid) {
            showNotification(`❌ ${usernameValidation.message}`);
            return false;
        }
        
        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            showNotification(`❌ ${passwordValidation.message}`);
            return false;
        }
        
        // Sanitize username
        const sanitizedUsername = sanitizeInput(username);
        
        showNotification('🔑 Logging in...');
        
        const data = await apiLogin(sanitizedUsername, password);
        
        if (!data || !data.token) {
            throw new Error('Invalid response from server');
        }
        
        setAuthToken(data.token);
        setUserData(data.user);
        authToken = data.token;
        currentUser = data.user;
        currentUserData = data.user;
        isAdmin = currentUser.isAdmin || false;
        
        showAuthUI();
        setGameEnabled(true);
        updateUI();
        
        // Clear input fields
        DOM.loginUsername.value = '';
        DOM.loginPassword.value = '';
        
        showNotification(`✅ Welcome back ${currentUser.username}!`);
        log(`User logged in: ${sanitizedUsername}`);
        return true;
        
    } catch (error) {
        logError('Login failed', error);
        showNotification(`❌ Login failed: ${error.message || 'Invalid credentials'}`);
        return false;
    }
}

// ============================================================
//  LOGOUT
// ============================================================

function logout() {
    try {
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
        
        if (DOM.loginUsername) DOM.loginUsername.value = '';
        if (DOM.loginPassword) DOM.loginPassword.value = '';
        
        showNotification(`👋 Logged out, ${username}`);
        log(`User logged out: ${username}`);
    } catch (error) {
        logError('Logout failed', error);
        showNotification('❌ Error logging out');
    }
}

// ============================================================
//  CHECK SESSION
// ============================================================

async function checkSession() {
    try {
        const savedToken = getAuthToken();
        
        if (!savedToken) {
            log('No saved session found');
            return false;
        }
        
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
    try {
        // Validate inputs
        if (!username || !password) {
            showNotification('❌ Please enter admin credentials');
            return false;
        }
        
        // Validate username
        const usernameValidation = validateUsername(username);
        if (!usernameValidation.valid) {
            showNotification(`❌ ${usernameValidation.message}`);
            return false;
        }
        
        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            showNotification(`❌ ${passwordValidation.message}`);
            return false;
        }
        
        const sanitizedUsername = sanitizeInput(username);
        
        showNotification('🔑 Admin login...');
        
        const data = await apiLogin(sanitizedUsername, password);
        
        if (!data || !data.token) {
            throw new Error('Invalid response from server');
        }
        
        if (!data.user || !data.user.isAdmin) {
            throw new Error('Not an admin user');
        }
        
        // Store admin token separately (for admin.html)
        sessionStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, data.token);
        sessionStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(data.user));
        
        showNotification('✅ Admin login successful!');
        log(`Admin logged in: ${sanitizedUsername}`);
        return true;
        
    } catch (error) {
        logError('Admin login failed', error);
        showNotification(`❌ Admin login failed: ${error.message}`);
        return false;
    }
}

function adminLogout() {
    try {
        sessionStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
        showNotification('👋 Admin logged out');
        log('Admin logged out');
    } catch (error) {
        logError('Admin logout failed', error);
    }
}

function getAdminToken() {
    try {
        return sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
    } catch (error) {
        return null;
    }
}

function getAdminUser() {
    try {
        const stored = sessionStorage.getItem(STORAGE_KEYS.ADMIN_USER);
        if (stored) {
            return JSON.parse(stored);
        }
        return null;
    } catch (error) {
        return null;
    }
}

// ============================================================
//  AUTH UI HELPERS
// ============================================================

function showAuthUI() {
    try {
        if (!currentUser) return;
        
        if (DOM.authForm) DOM.authForm.style.display = 'none';
        if (DOM.userInfo) DOM.userInfo.style.display = 'block';
        if (DOM.currentUserDisplay) DOM.currentUserDisplay.innerText = currentUser.username;
        if (DOM.userIdDisplay) DOM.userIdDisplay.innerText = currentUser.id;
        
        // Show admin badge if user is admin (just visual, no panel)
        if (DOM.adminBadge) {
            DOM.adminBadge.style.display = isAdmin ? 'inline-block' : 'none';
        }
    } catch (error) {
        logError('showAuthUI failed', error);
    }
}

function hideAuthUI() {
    try {
        if (DOM.authForm) DOM.authForm.style.display = 'block';
        if (DOM.userInfo) DOM.userInfo.style.display = 'none';
        if (DOM.adminBadge) DOM.adminBadge.style.display = 'none';
        if (DOM.balance) DOM.balance.innerText = '0.00';
    } catch (error) {
        logError('hideAuthUI failed', error);
    }
}

// ============================================================
//  AUTH EVENT LISTENERS
// ============================================================

function setupAuthListeners() {
    try {
        if (DOM.loginBtn) {
            DOM.loginBtn.onclick = function() {
                const username = DOM.loginUsername ? DOM.loginUsername.value.trim() : '';
                const password = DOM.loginPassword ? DOM.loginPassword.value : '';
                login(username, password);
            };
        } else {
            logWarning('loginBtn not found');
        }
        
        if (DOM.signupBtn) {
            DOM.signupBtn.onclick = function() {
                const username = DOM.loginUsername ? DOM.loginUsername.value.trim() : '';
                const password = DOM.loginPassword ? DOM.loginPassword.value : '';
                signup(username, password);
            };
        } else {
            logWarning('signupBtn not found');
        }
        
        if (DOM.logoutBtn) {
            DOM.logoutBtn.onclick = function() {
                if (confirm('Are you sure you want to logout?')) {
                    logout();
                }
            };
        } else {
            logWarning('logoutBtn not found');
        }
        
        // Enter key on password field triggers login
        if (DOM.loginPassword) {
            DOM.loginPassword.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    if (DOM.loginBtn) DOM.loginBtn.click();
                }
            });
        }
        
        // Enter key on username field moves to password
        if (DOM.loginUsername) {
            DOM.loginUsername.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    if (DOM.loginPassword) DOM.loginPassword.focus();
                }
            });
        }
        
        // Auto-trim username input (remove accidental spaces)
        if (DOM.loginUsername) {
            DOM.loginUsername.addEventListener('blur', function() {
                this.value = this.value.trim();
            });
        }
        
        log('✅ Auth listeners setup complete');
    } catch (error) {
        logError('setupAuthListeners failed', error);
    }
}

// ============================================================
//  PASSWORD VISIBILITY TOGGLE (Optional)
// ============================================================

function togglePasswordVisibility(inputId) {
    try {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        if (input.type === 'password') {
            input.type = 'text';
            showNotification('👁️ Password visible');
        } else {
            input.type = 'password';
            showNotification('🔒 Password hidden');
        }
    } catch (error) {
        logError('togglePasswordVisibility failed', error);
    }
}

// ============================================================
//  EXPOSE GLOBALLY
// ============================================================

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
window.validateUsername = validateUsername;
window.validatePassword = validatePassword;
window.sanitizeInput = sanitizeInput;
