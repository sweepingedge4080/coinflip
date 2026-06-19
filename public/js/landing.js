// ============================================================
//  LANDING.JS - Landing Page Logic
// ============================================================

// ----- DOM READY -----
document.addEventListener('DOMContentLoaded', function() {
    initLandingPage();
});

function initLandingPage() {
    initNavbar();
    initParticles();
    initStatsCounter();
    initCoinFlip();
    initButtons();
    initScrollReveal();
}

// ============================================================
//  NAVBAR
// ============================================================

function initNavbar() {
    const navbar = document.getElementById('navbar');
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.querySelector('.nav-links');

    // Scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            navLinks.classList.toggle('open');
        });
    }

    // Close menu on link click
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function() {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('open');
        });
    });
}

// ============================================================
//  PARTICLES
// ============================================================

function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const particleCount = 50;
    const colors = ['rgba(250, 204, 21, 0.3)', 'rgba(168, 85, 247, 0.2)', 'rgba(34, 197, 94, 0.2)'];

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.width = (2 + Math.random() * 4) + 'px';
        particle.style.height = particle.style.width;
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.animationDuration = (5 + Math.random() * 10) + 's';
        particle.style.animationDelay = (Math.random() * 5) + 's';
        container.appendChild(particle);
    }
}

// ============================================================
//  STATS COUNTER
// ============================================================

function initStatsCounter() {
    const stats = document.querySelectorAll('.stat-number');

    stats.forEach(stat => {
        const target = parseFloat(stat.dataset.count);
        const isFloat = target % 1 !== 0;
        const duration = 2000;
        const startTime = Date.now();

        function updateCounter() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = progress * target;

            if (isFloat) {
                stat.textContent = current.toFixed(1);
            } else {
                stat.textContent = Math.floor(current).toLocaleString();
            }

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                if (isFloat) {
                    stat.textContent = target.toFixed(1);
                } else {
                    stat.textContent = target.toLocaleString();
                }
            }
        }

        // Start counter when element is in view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        observer.observe(stat);
    });
}

// ============================================================
//  HERO COIN FLIP
// ============================================================

function initCoinFlip() {
    const coin = document.querySelector('.coin-3d');
    if (!coin) return;

    // Add continuous flip animation with random pauses
    setInterval(() => {
        coin.style.animation = 'none';
        void coin.offsetWidth;
        coin.style.animation = 'floatCoin 3s ease-in-out infinite';
    }, 5000);
}

// ============================================================
//  BUTTONS - Navigation to Loading Page
// ============================================================

function initButtons() {
    const playButtons = [
        document.getElementById('playNowBtn'),
        document.getElementById('heroPlayBtn'),
        document.getElementById('ctaPlayBtn')
    ];

    playButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                navigateToLoading();
            });
        }
    });

    // Also handle any anchor links in nav
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    });
}

// ============================================================
//  NAVIGATE TO LOADING PAGE
// ============================================================

function navigateToLoading() {
    // Add a smooth fade-out effect before navigating
    document.body.style.transition = 'opacity 0.5s ease';
    document.body.style.opacity = '0';

    setTimeout(() => {
        window.location.href = '/loading';
    }, 500);
}

// ============================================================
//  SCROLL REVEAL (Simple)
// ============================================================

function initScrollReveal() {
    const elements = document.querySelectorAll('.feature-card, .step, .section-header');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Trigger initial reveal for elements already in view
    setTimeout(() => {
        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }
        });
    }, 100);
}
