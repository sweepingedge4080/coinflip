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
        // ✅ FIXED: Use the correct API endpoint
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
        // ✅ FIXED: Use the correct API endpoint
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
//  CHECK SESSION (Auto-redirect if already logged in)
// ============================================================

async function checkSession() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) return;

    try {
        // ✅ FIXED: Use the correct API endpoint
        const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            // Already logged in, redirect to game
            window.location.href = '/game';
        }
    } catch (e) {
        // Token invalid, continue
        console.log('Session check failed, continuing to login page');
    }
}

checkSession();

// ============================================================
//  LOG
// ============================================================

console.log('🔐 Login page loaded');
console.log('📝 Login or sign up to continue');
