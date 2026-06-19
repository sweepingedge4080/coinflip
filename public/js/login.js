// ============================================================
//  LOGIN.JS - Login Page Logic
// ============================================================

// ============================================================
//  DOM ELEMENTS
// ============================================================

const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const signupUsername = document.getElementById('signupUsername');
const signupPassword = document.getElementById('signupPassword');
const signupConfirm = document.getElementById('signupConfirmPassword');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');
const rememberMe = document.getElementById('rememberMe');
const termsCheck = document.getElementById('termsCheck');

// ============================================================
//  TAB SWITCHING
// ============================================================

document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        // Update active tab
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');

        // Show correct form
        const target = this.dataset.tab;
        if (target === 'login') {
            loginForm.style.display = 'block';
            signupForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            signupForm.style.display = 'block';
        }

        // Clear errors
        loginError.style.display = 'none';
        signupError.style.display = 'none';
    });
});

// ============================================================
//  PASSWORD TOGGLE
// ============================================================

document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', function() {
        const input = this.closest('.password-wrapper').querySelector('input');
        if (input.type === 'password') {
            input.type = 'text';
            this.textContent = '🙈';
        } else {
            input.type = 'password';
            this.textContent = '👁️';
        }
    });
});

// ============================================================
//  LOGIN HANDLER
// ============================================================

loginBtn.addEventListener('click', async function() {
    const username = loginUsername.value.trim();
    const password = loginPassword.value;
    const remember = rememberMe.checked;

    // Validate
    if (!username || !password) {
        showError(loginError, 'Please enter your username and password');
        return;
    }

    if (username.length < 3) {
        showError(loginError, 'Username must be at least 3 characters');
        return;
    }

    if (password.length < 4) {
        showError(loginError, 'Password must be at least 4 characters');
        return;
    }

    // Hide previous error
    loginError.style.display = 'none';

    // Disable button
    this.disabled = true;
    this.textContent = '⏳ Logging in...';

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Store token
        if (remember) {
            localStorage.setItem('authToken', data.token);
        } else {
            sessionStorage.setItem('authToken', data.token);
        }

        // Store user data
        localStorage.setItem('userData', JSON.stringify(data.user));

        // ✅ Redirect to game
        window.location.href = '/game';

    } catch (error) {
        showError(loginError, error.message);
        this.disabled = false;
        this.textContent = '🔓 Login';
    }
});

// ============================================================
//  SIGNUP HANDLER
// ============================================================

signupBtn.addEventListener('click', async function() {
    const username = signupUsername.value.trim();
    const password = signupPassword.value;
    const confirm = signupConfirm.value;
    const terms = termsCheck.checked;

    // Validate
    if (!username || !password || !confirm) {
        showError(signupError, 'Please fill in all fields');
        return;
    }

    if (username.length < 3 || username.length > 20) {
        showError(signupError, 'Username must be 3-20 characters');
        return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showError(signupError, 'Username can only contain letters, numbers, and underscores');
        return;
    }

    if (password.length < 4) {
        showError(signupError, 'Password must be at least 4 characters');
        return;
    }

    if (password !== confirm) {
        showError(signupError, 'Passwords do not match');
        return;
    }

    if (!terms) {
        showError(signupError, 'You must agree to the Terms & Conditions');
        return;
    }

    // Hide previous error
    signupError.style.display = 'none';

    // Disable button
    this.disabled = true;
    this.textContent = '⏳ Creating account...';

    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Signup failed');
        }

        // Store token
        localStorage.setItem('authToken', data.token);

        // Store user data
        localStorage.setItem('userData', JSON.stringify(data.user));

        // ✅ Redirect to game
        window.location.href = '/game';

    } catch (error) {
        showError(signupError, error.message);
        this.disabled = false;
        this.textContent = '📝 Create Account';
    }
});

// ============================================================
//  ENTER KEY SUPPORT
// ============================================================

document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        const activeForm = loginForm.style.display !== 'none' ? loginForm : signupForm;
        const btn = activeForm.querySelector('.auth-submit');
        if (btn) btn.click();
    }
});

// ============================================================
//  HELPERS
// ============================================================

function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
    // Auto-hide after 5 seconds
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

// ============================================================
//  ✅ CHECK SESSION - FIXED (Prevents redirect loop)
// ============================================================

async function checkSession() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) return;

    // ✅ Prevent redirect loop - only redirect if not already on game page
    // If we're already on the login page, we shouldn't redirect to game
    // Only redirect if we have a valid token AND we're not on the game page
    // But we are on the login page, so we should redirect to game if token is valid

    try {
        const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            // ✅ Valid token, redirect to game (but only if we're on the login page)
            if (window.location.pathname === '/login' || window.location.pathname === '/') {
                console.log('✅ Valid session found, redirecting to game...');
                window.location.href = '/game';
            } else {
                console.log('✅ Valid session, already on game page');
            }
        } else {
            // Token invalid, clear it
            console.log('⚠️ Invalid session, clearing token');
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            localStorage.removeItem('userData');
        }
    } catch (e) {
        // Token invalid, clear it
        console.log('⚠️ Session check failed, clearing token');
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        localStorage.removeItem('userData');
    }
}

// ============================================================
//  INITIALIZE
// ============================================================

// Check session on load (will redirect to game if already logged in)
checkSession();

// ============================================================
//  LOG
// ============================================================

console.log('🔐 Login page loaded');
console.log('📝 Login or sign up to continue');
