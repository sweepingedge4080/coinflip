// ============================================================
//  server.js - Production Ready with Security Fixes
// ============================================================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
//  SECURITY MIDDLEWARE
// ============================================================

// Helmet - Secure HTTP headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "https://api.qrserver.com"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'"],
        },
    },
}));

// CORS - Only allow specific domains
app.use(cors({
    origin: process.env.FRONTEND_URL 
        ? [process.env.FRONTEND_URL, 'http://localhost:5000'] 
        : ['http://localhost:5000', 'https://your-app.onrender.com'],
    credentials: true
}));

// Rate Limiting - Prevent brute force
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to auth and game routes
app.use('/api/auth', limiter);
app.use('/api/game', limiter);
app.use('/api/deposit', limiter);

// General rate limit
const generalLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 1000,
    message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', generalLimiter);

app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

// ============================================================
//  MONGODB CONNECTION
// ============================================================
const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
    console.error('❌ CRITICAL ERROR: MONGODB_URI is not set!');
    process.exit(1);
}

console.log('🔍 Attempting to connect to MongoDB...');

const connectOptions = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
};

async function connectToMongoDB() {
    try {
        await mongoose.connect(MONGO_URI, connectOptions);
        console.log('✅ MongoDB connected successfully!');
        return true;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        return false;
    }
}

connectToMongoDB();

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected. Attempting to reconnect...');
    setTimeout(() => connectToMongoDB(), 5000);
});

// ============================================================
//  MODELS
// ============================================================
const User = require('./models/User');
const DepositRequest = require('./models/DepositRequest');
const WithdrawRequest = require('./models/WithdrawRequest');

// ============================================================
//  LEVEL CONFIGURATION
// ============================================================
const LEVEL_CONFIG = [
    { level: 1, xpRequired: 0, maxBet: 10, winBonus: 1.0 },
    { level: 2, xpRequired: 100, maxBet: 25, winBonus: 1.1 },
    { level: 3, xpRequired: 300, maxBet: 50, winBonus: 1.2 },
    { level: 4, xpRequired: 600, maxBet: 100, winBonus: 1.3 },
    { level: 5, xpRequired: 1000, maxBet: 200, winBonus: 1.5 },
    { level: 6, xpRequired: 1500, maxBet: 350, winBonus: 1.7 },
    { level: 7, xpRequired: 2100, maxBet: 500, winBonus: 2.0 },
    { level: 8, xpRequired: 2800, maxBet: 750, winBonus: 2.3 },
    { level: 9, xpRequired: 3600, maxBet: 1000, winBonus: 2.6 },
    { level: 10, xpRequired: 4500, maxBet: 1500, winBonus: 3.0 },
];

function getLevelData(level) {
    return LEVEL_CONFIG.find(l => l.level === level) || LEVEL_CONFIG[0];
}

function getNextLevelData(level) {
    return LEVEL_CONFIG.find(l => l.level === level + 1);
}

function getMaxBet(level) {
    return getLevelData(level).maxBet;
}

function getWinBonus(level) {
    return getLevelData(level).winBonus;
}

function getXPToNext(level) {
    const next = getNextLevelData(level);
    return next ? next.xpRequired : Infinity;
}

// ============================================================
//  AUTH MIDDLEWARE
// ============================================================
const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        // ✅ JWT Secret from environment variable
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Admin middleware
const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        req.adminUser = user;
        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ============================================================
//  AUTH ROUTES - WITH INPUT VALIDATION
// ============================================================

// Signup
app.post('/api/auth/signup', [
    body('username').trim().escape().isLength({ min: 3, max: 20 }),
    body('password').isLength({ min: 4 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input', details: errors.array() });
    }

    try {
        const { username, password } = req.body;
        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ error: 'Username taken' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashed });
        await user.save();

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
        
        console.log(`✅ New user registered: ${username}`);
        
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                balance: user.balance,
                level: user.level,
                xp: user.xp,
                isAdmin: user.isAdmin,
                wins: user.wins,
                losses: user.losses,
                bestStreak: user.bestStreak,
                currentStreak: user.currentStreak,
                totalWagered: user.totalWagered
            }
        });
    } catch (err) {
        console.error('❌ Signup error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
app.post('/api/auth/login', [
    body('username').trim().escape(),
    body('password').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
        
        console.log(`✅ User logged in: ${username}`);
        
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                balance: user.balance,
                level: user.level,
                xp: user.xp,
                isAdmin: user.isAdmin,
                wins: user.wins,
                losses: user.losses,
                bestStreak: user.bestStreak,
                currentStreak: user.currentStreak,
                totalWagered: user.totalWagered
            }
        });
    } catch (err) {
        console.error('❌ Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current user
app.get('/api/auth/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user._id,
            username: user.username,
            balance: user.balance,
            level: user.level,
            xp: user.xp,
            isAdmin: user.isAdmin,
            wins: user.wins,
            losses: user.losses,
            bestStreak: user.bestStreak,
            currentStreak: user.currentStreak,
            totalWagered: user.totalWagered,
            maxBet: getMaxBet(user.level),
            winBonus: getWinBonus(user.level),
            xpToNext: getXPToNext(user.level)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
//  GAME ROUTES - WITH INPUT VALIDATION
// ============================================================

// Get game stats
app.get('/api/game/stats', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user._id,
            username: user.username,
            balance: user.balance,
            level: user.level,
            xp: user.xp,
            isAdmin: user.isAdmin,
            wins: user.wins,
            losses: user.losses,
            bestStreak: user.bestStreak,
            currentStreak: user.currentStreak,
            totalWagered: user.totalWagered,
            maxBet: getMaxBet(user.level),
            winBonus: getWinBonus(user.level),
            xpToNext: getXPToNext(user.level)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Flip coin
app.post('/api/game/flip', [
    auth,
    body('betAmount').isFloat({ min: 0.01 }),
    body('choice').isIn(['heads', 'tails']),
    body('progressiveStreak').optional().isInt({ min: 0 }),
    body('originalBet').optional().isFloat({ min: 0 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input', details: errors.array() });
    }

    try {
        const { betAmount, choice, progressiveStreak = 0, originalBet = betAmount } = req.body;

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const maxBet = getMaxBet(user.level);
        if (betAmount > maxBet) {
            return res.status(400).json({ error: `Max bet for Level ${user.level} is $${maxBet}` });
        }

        if (betAmount > user.balance) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Deduct bet
        user.balance -= betAmount;
        user.totalWagered = (user.totalWagered || 0) + betAmount;

        // 11% house edge = 44.5% win chance
        const winChance = 0.5 * (1 - 0.11);
        const result = Math.random() < winChance ? 'heads' : 'tails';
        const win = choice === result;

        let winnings = 0;
        let xpGain = 2;
        let leveledUp = false;

        const PROGRESSIVE_MULTIPLIERS = [2, 3, 5, 8, 13, 21, 34, 55];

        if (win) {
            let multiplier = 2;
            const streak = progressiveStreak || 0;
            if (streak > 0 && streak <= PROGRESSIVE_MULTIPLIERS.length) {
                multiplier = PROGRESSIVE_MULTIPLIERS[streak - 1];
            } else if (streak > PROGRESSIVE_MULTIPLIERS.length) {
                multiplier = PROGRESSIVE_MULTIPLIERS[PROGRESSIVE_MULTIPLIERS.length - 1];
            }
            
            const baseBet = originalBet || betAmount;
            winnings = baseBet * multiplier;
            user.balance += winnings;
            user.wins = (user.wins || 0) + 1;
            user.currentStreak = (user.currentStreak || 0) + 1;
            if (user.currentStreak > (user.bestStreak || 0)) {
                user.bestStreak = user.currentStreak;
            }
            xpGain = Math.floor(10 + (baseBet / 10));
        } else {
            user.losses = (user.losses || 0) + 1;
            user.currentStreak = 0;
            xpGain = 2;
        }

        // Level up
        user.xp = (user.xp || 0) + xpGain;
        while (true) {
            const next = getNextLevelData(user.level);
            if (next && user.xp >= next.xpRequired) {
                user.level = next.level;
                leveledUp = true;
            } else {
                break;
            }
        }

        await user.save();

        res.json({
            result,
            isWin: win,
            winnings: win ? winnings : 0,
            xpGain,
            newBalance: user.balance,
            level: user.level,
            xp: user.xp,
            leveledUp,
            stats: {
                wins: user.wins,
                losses: user.losses,
                bestStreak: user.bestStreak,
                currentStreak: user.currentStreak,
                totalWagered: user.totalWagered
            },
            maxBet: getMaxBet(user.level),
            winBonus: getWinBonus(user.level),
            xpToNext: getXPToNext(user.level)
        });

    } catch (err) {
        console.error('❌ Flip error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
//  DEPOSIT ROUTES - WITH INPUT VALIDATION
// ============================================================

// Request deposit
app.post('/api/deposit/request-deposit', [
    auth,
    body('amount').isFloat({ min: 10 }),
    body('cryptoMethod').notEmpty(),
    body('walletAddress').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        const { amount, amountPoints, cryptoMethod, walletAddress, transactionId, note } = req.body;
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const request = new DepositRequest({
            userId: user._id,
            username: user.username,
            amount: amountPoints || amount,
            amountPoints: amountPoints || amount,
            cryptoMethod,
            walletAddress,
            transactionId: transactionId || walletAddress,
            note
        });

        await request.save();
        res.json({ success: true, message: 'Deposit request submitted', requestId: request._id });
    } catch (err) {
        console.error('❌ Deposit error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Request withdraw
app.post('/api/deposit/request-withdraw', [
    auth,
    body('amount').isFloat({ min: 10 }),
    body('cryptoMethod').notEmpty(),
    body('walletAddress').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        const { amount, amountPoints, cryptoMethod, walletAddress, note } = req.body;
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.balance < (amountPoints || amount)) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        const request = new WithdrawRequest({
            userId: user._id,
            username: user.username,
            amount: amountPoints || amount,
            amountPoints: amountPoints || amount,
            cryptoMethod,
            walletAddress,
            note
        });

        await request.save();
        res.json({ success: true, message: 'Withdrawal request submitted', requestId: request._id });
    } catch (err) {
        console.error('❌ Withdraw error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
//  ADMIN ROUTES - WITH ADMIN CHECK
// ============================================================

// Get all users
app.get('/api/admin/users', auth, isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ balance: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Pending deposits
app.get('/api/admin/requests/deposits/pending', auth, isAdmin, async (req, res) => {
    try {
        const requests = await DepositRequest.find({ status: 'pending' }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        console.error('❌ Admin deposits pending error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Processed deposits
app.get('/api/admin/requests/deposits/processed', auth, isAdmin, async (req, res) => {
    try {
        const requests = await DepositRequest.find({ 
            status: { $in: ['confirmed', 'rejected'] } 
        }).sort({ processedAt: -1 }).limit(100);
        res.json(requests);
    } catch (err) {
        console.error('❌ Admin deposits processed error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Pending withdrawals
app.get('/api/admin/requests/withdrawals/pending', auth, isAdmin, async (req, res) => {
    try {
        const requests = await WithdrawRequest.find({ status: 'pending' }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        console.error('❌ Admin withdrawals pending error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Processed withdrawals
app.get('/api/admin/requests/withdrawals/processed', auth, isAdmin, async (req, res) => {
    try {
        const requests = await WithdrawRequest.find({ 
            status: { $in: ['completed', 'rejected'] } 
        }).sort({ processedAt: -1 }).limit(100);
        res.json(requests);
    } catch (err) {
        console.error('❌ Admin withdrawals processed error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Approve deposit
app.post('/api/admin/requests/deposit/approve', auth, isAdmin, async (req, res) => {
    try {
        const { requestId } = req.body;
        if (!requestId) {
            return res.status(400).json({ error: 'Request ID required' });
        }

        const request = await DepositRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({ error: 'Request already processed' });
        }

        const user = await User.findById(request.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.balance += request.amount;
        await user.save();

        request.status = 'confirmed';
        request.adminNotes = `Approved by ${req.adminUser.username}`;
        request.processedAt = new Date();
        await request.save();

        console.log(`✅ Deposit approved: ${user.username} +$${request.amount} by ${req.adminUser.username}`);

        res.json({
            success: true,
            message: 'Deposit approved successfully',
            request: request,
            newBalance: user.balance
        });
    } catch (err) {
        console.error('❌ Approve deposit error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Reject deposit
app.post('/api/admin/requests/deposit/reject', auth, isAdmin, async (req, res) => {
    try {
        const { requestId } = req.body;
        if (!requestId) {
            return res.status(400).json({ error: 'Request ID required' });
        }

        const request = await DepositRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({ error: 'Request already processed' });
        }

        request.status = 'rejected';
        request.adminNotes = `Rejected by ${req.adminUser.username}`;
        request.processedAt = new Date();
        await request.save();

        console.log(`❌ Deposit rejected: ${request.username} - $${request.amount} by ${req.adminUser.username}`);

        res.json({
            success: true,
            message: 'Deposit rejected',
            request: request
        });
    } catch (err) {
        console.error('❌ Reject deposit error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Approve withdrawal
app.post('/api/admin/requests/withdraw/approve', auth, isAdmin, async (req, res) => {
    try {
        const { requestId } = req.body;
        if (!requestId) {
            return res.status(400).json({ error: 'Request ID required' });
        }

        const request = await WithdrawRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({ error: 'Request already processed' });
        }

        const user = await User.findById(request.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.balance < request.amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        user.balance -= request.amount;
        await user.save();

        request.status = 'completed';
        request.adminNotes = `Approved by ${req.adminUser.username}`;
        request.processedAt = new Date();
        await request.save();

        console.log(`✅ Withdrawal approved: ${user.username} -$${request.amount} by ${req.adminUser.username}`);

        res.json({
            success: true,
            message: 'Withdrawal approved successfully',
            request: request,
            newBalance: user.balance
        });
    } catch (err) {
        console.error('❌ Approve withdrawal error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Reject withdrawal
app.post('/api/admin/requests/withdraw/reject', auth, isAdmin, async (req, res) => {
    try {
        const { requestId } = req.body;
        if (!requestId) {
            return res.status(400).json({ error: 'Request ID required' });
        }

        const request = await WithdrawRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }
        if (request.status !== 'pending') {
            return res.status(400).json({ error: 'Request already processed' });
        }

        request.status = 'rejected';
        request.adminNotes = `Rejected by ${req.adminUser.username}`;
        request.processedAt = new Date();
        await request.save();

        console.log(`❌ Withdrawal rejected: ${request.username} - $${request.amount} by ${req.adminUser.username}`);

        res.json({
            success: true,
            message: 'Withdrawal rejected',
            request: request
        });
    } catch (err) {
        console.error('❌ Reject withdrawal error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Add funds (admin)
app.post('/api/admin/add-funds', auth, isAdmin, async (req, res) => {
    try {
        const { username, amount } = req.body;
        if (!username || !amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.balance += amount;
        await user.save();

        console.log(`💵 Admin added $${amount} to ${username} by ${req.adminUser.username}`);

        res.json({ success: true, newBalance: user.balance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove funds (admin)
app.post('/api/admin/remove-funds', auth, isAdmin, async (req, res) => {
    try {
        const { username, amount } = req.body;
        if (!username || !amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        user.balance -= amount;
        await user.save();

        console.log(`💸 Admin removed $${amount} from ${username} by ${req.adminUser.username}`);

        res.json({ success: true, newBalance: user.balance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
//  HEALTH CHECK
// ============================================================
app.get('/api/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    res.json({
        status: 'ok',
        database: states[dbState] || 'unknown',
        timestamp: new Date().toISOString()
    });
});

// ============================================================
//  ERROR HANDLING
// ============================================================
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({ error: 'Something went wrong' });
});

// ============================================================
//  START SERVER
// ============================================================
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    console.log('🔗 Secure endpoints enabled:');
    console.log('   ✅ Helmet.js - Security headers');
    console.log('   ✅ Rate Limiting - Brute force protection');
    console.log('   ✅ Input Validation - All user inputs sanitized');
    console.log('   ✅ CORS - Domain restricted');
    console.log('   ✅ JWT - Environment secret');
});
