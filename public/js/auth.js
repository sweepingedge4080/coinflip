// ============================================================
//  AUTH.JS - Authentication System
// ============================================================

// ============================================================
//  LOGOUT FUNCTION
// ============================================================

function logoutUser() {
    console.log('🚪 Logging out user...');
    
    // Clear all session data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userData');
    
    // Clear sessionStorage as well (for redundancy)
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('userData');
    
    // Clear global state
    window.currentUser = null;
    window.currentUserData = null;
    window.token = null;
    window.progressiveActive = false;
    
    // Clear auth headers from API client if it exists
    if (window.api && window.api.defaults) {
        delete window.api.defaults.headers.common['Authorization'];
    }
    
    // Clear axios headers if using axios directly
    if (window.axios) {
        delete window.axios.defaults.headers.common['Authorization'];
    }
    
    // Reset UI to logged out state
    resetUIForLoggedOutUser();
    
    console.log('✅ User logged out successfully');
    
    // Redirect to landing page after a small delay
    setTimeout(() => {
        window.location.href = '/landing.html';
    }, 300);
}

// ============================================================
//  RESET UI FOR LOGGED OUT USER
// ============================================================

function resetUIForLoggedOutUser() {
    const userInfo = document.getElementById('userInfo');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const balanceDisplay = document.getElementById('balanceDisplay');
    
    if (userInfo) {
        userInfo.textContent = '';
        userInfo.style.display = 'none';
    }
    
    if (loginBtn) {
        loginBtn.style.display = 'inline-block';
    }
    
    if (signupBtn) {
        signupBtn.style.display = 'inline-block';
    }
    
    if (logoutBtn) {
        logoutBtn.style.display = 'none';
    }
    
    if (balanceDisplay) {
        balanceDisplay.textContent = '$0.00';
    }
}

// ============================================================
//  SETUP LOGOUT LISTENER
// ============================================================

function setupLogoutListener() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        // Remove any existing listeners to prevent duplicates
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        
        newLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔘 Logout button clicked');
            logoutUser();
        });
        console.log('✅ Logout button listener attached');
    } else {
        console.warn('⚠️ Logout button not found in DOM');
    }
}

// ============================================================
//  LOGIN FUNCTION
// ============================================================

async function loginUser(username, password) {
    try {
        console.log('🔐 Attempting login for:', username);
        
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // Set global state
        window.currentUser = data.user;
        window.currentUserData = data.user;
        window.token = data.token;
        
        // Set auth header for API calls
        if (window.api && window.api.defaults) {
            window.api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        }
        
        // Set axios header if available
        if (window.axios) {
            window.axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        }
        
        console.log('✅ Login successful for:', data.user.username);
        
        // Update UI
        updateUIForLoggedInUser(data.user);
        
        // Show success message
        showNotification('Login successful! Welcome back, ' + data.user.username, 'success');
        
        // Redirect to game page
        setTimeout(() => {
            window.location.href = '/game.html';
        }, 500);
        
        return data;
    } catch (error) {
        console.error('❌ Login error:', error);
        showNotification('Login failed: ' + error.message, 'error');
        throw error;
    }
}

// ============================================================
//  SIGNUP FUNCTION
// ============================================================

async function signupUser(username, password) {
    try {
        console.log('📝 Attempting signup for:', username);
        
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Signup failed');
        }
        
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // Set global state
        window.currentUser = data.user;
        window.currentUserData = data.user;
        window.token = data.token;
        
        // Set auth header for API calls
        if (window.api && window.api.defaults) {
            window.api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        }
        
        if (window.axios) {
            window.axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        }
        
        console.log('✅ Signup successful for:', data.user.username);
        
        // Update UI
        updateUIForLoggedInUser(data.user);
        
        // Show success message
        showNotification('Account created successfully! Welcome, ' + data.user.username, 'success');
        
        // Redirect to game page
        setTimeout(() => {
            window.location.href = '/game.html';
        }, 500);
        
        return data;
    } catch (error) {
        console.error('❌ Signup error:', error);
        showNotification('Signup failed: ' + error.message, 'error');
        throw error;
    }
}

// ============================================================
//  UPDATE UI FOR LOGGED IN USER
// ============================================================

function updateUIForLoggedInUser(user) {
    const userInfo = document.getElementById('userInfo');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const balanceDisplay = document.getElementById('balanceDisplay');
    
    if (userInfo) {
        userInfo.textContent = `👤 ${user.username}`;
        userInfo.style.display = 'block';
    }
    
    if (loginBtn) {
        loginBtn.style.display = 'none';
    }
    
    if (signupBtn) {
        signupBtn.style.display = 'none';
    }
    
    if (logoutBtn) {
        logoutBtn.style.display = 'inline-block';
        // Reattach logout listener
        setupLogoutListener();
    }
    
    if (balanceDisplay && user.balance !== undefined) {
        balanceDisplay.textContent = `$${user.balance.toFixed(2)}`;
    }
}

// ============================================================
//  CHECK SESSION
// ============================================================

function checkSession() {
    console.log('🔍 Checking saved session...');
    
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
        try {
            const user = JSON.parse(userData);
            window.currentUser = user;
            window.currentUserData = user;
            window.token = token;
            
            // Set auth header for API calls
            if (window.api && window.api.defaults) {
                window.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
            
            if (window.axios) {
                window.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
            
            console.log('✅ Session restored for:', user.username);
            
            // Update UI
            updateUIForLoggedInUser(user);
            
            // Verify token is still valid
            verifyToken(token);
            
            return true;
        } catch (error) {
            console.error('❌ Error parsing user data:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userData');
            return false;
        }
    }
    
    console.log('ℹ️ No saved session found');
    return false;
}

// ============================================================
//  VERIFY TOKEN
// ============================================================

async function verifyToken(token) {
    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            // Token is invalid, logout
            console.warn('⚠️ Token verification failed, logging out');
            logoutUser();
            return false;
        }
        
        const user = await response.json();
        console.log('✅ Token verified for:', user.username);
        
        // Update user data if changed
        if (user.balance !== undefined) {
            const balanceDisplay = document.getElementById('balanceDisplay');
            if (balanceDisplay) {
                balanceDisplay.textContent = `$${user.balance.toFixed(2)}`;
            }
            // Update stored user data
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            storedUser.balance = user.balance;
            localStorage.setItem('user', JSON.stringify(storedUser));
        }
        
        return true;
    } catch (error) {
        console.error('❌ Token verification error:', error);
        logoutUser();
        return false;
    }
}

// ============================================================
//  SETUP AUTH LISTENERS (Login/Signup forms)
// ============================================================

function setupAuthListeners() {
    console.log('🔧 Setting up auth listeners...');
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('loginUsername')?.value;
            const password = document.getElementById('loginPassword')?.value;
            if (username && password) {
                loginUser(username, password);
            } else {
                showNotification('Please enter username and password', 'error');
            }
        });
        console.log('✅ Login form listener attached');
    }
    
    // Signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('signupUsername')?.value;
            const password = document.getElementById('signupPassword')?.value;
            const confirmPassword = document.getElementById('signupConfirmPassword')?.value;
            
            if (!username || username.length < 3) {
                showNotification('Username must be at least 3 characters', 'error');
                return;
            }
            if (!password || password.length < 4) {
                showNotification('Password must be at least 4 characters', 'error');
                return;
            }
            if (password !== confirmPassword) {
                showNotification('Passwords do not match', 'error');
                return;
            }
            
            signupUser(username, password);
        });
        console.log('✅ Signup form listener attached');
    }
    
    // Setup logout listener
    setupLogoutListener();
}

// ============================================================
//  NOTIFICATION SYSTEM
// ============================================================

function showNotification(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    // Check if notification element exists
    let notification = document.getElementById('notification');
    if (!notification) {
        // Create notification element if it doesn't exist
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 9999;
            max-width: 400px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
            transform: translateX(120%);
        `;
        document.body.appendChild(notification);
    }
    
    // Set colors based on type
    const colors = {
        success: { bg: '#00cc88', text: '#fff' },
        error: { bg: '#ff4444', text: '#fff' },
        warning: { bg: '#ffaa00', text: '#1a1a2e' },
        info: { bg: '#4a90d9', text: '#fff' }
    };
    
    const color = colors[type] || colors.info;
    notification.style.backgroundColor = color.bg;
    notification.style.color = color.text;
    notification.textContent = message;
    notification.style.transform = 'translateX(0)';
    
    // Auto-hide after 3 seconds
    clearTimeout(notification._timeout);
    notification._timeout = setTimeout(() => {
        notification.style.transform = 'translateX(120%)';
    }, 3000);
}

// ============================================================
//  EXPOSE GLOBALLY
// ============================================================

window.logoutUser = logoutUser;
window.loginUser = loginUser;
window.signupUser = signupUser;
window.checkSession = checkSession;
window.verifyToken = verifyToken;
window.setupAuthListeners = setupAuthListeners;
window.setupLogoutListener = setupLogoutListener;
window.updateUIForLoggedInUser = updateUIForLoggedInUser;
window.resetUIForLoggedOutUser = resetUIForLoggedOutUser;
window.showNotification = showNotification;

console.log('🔐 Auth system loaded');
