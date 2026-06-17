// ============================================================
//  server.js - Complete with Level Progression & All Endpoints
// ============================================================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ============================================================
//  DATABASE CONNECTION
// ============================================================

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/coinflip')
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB error:', err));

// ============================================================
//  USER SCHEMA
// ============================================================

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 100.00 },
    isAdmin: { type: Boolean, default: false },
    // Stats
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    totalWagered: { type: Number, default: 0 },
    // Level Progression
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// ============================================================
//  DEPOSIT REQUEST SCHEMA
// ============================================================

const DepositRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    type: { type: String, enum: ['deposit', 'withdraw'], required: true },
    amount: { type: Number, required: true },
    cryptoMethod: { type: String, required: true },
    walletAddress: { type: String, required: true },
    transactionId: { type: String },
    note: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const DepositRequest = mongoose.model('DepositRequest', DepositRequestSchema);

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
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        req.userId = decoded.userId;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// ============================================================
//  AUTH ROUTES (matching frontend expectations)
// ============================================================

// Signup - /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        const existing = await User.findOne({ username });
        if (existing) return res.status(400).json({ error: 'Username taken' });

        const hashed = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashed });
        await user.save();

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secretkey');
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
        res.status(500).json({ error: err.message });
    }
});

// Login - /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secretkey');
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
        res.status(500).json({ error: err.message });
    }
});

// Get current user - /api/auth/me
app.get('/api/auth/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });

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
//  GAME ROUTES
// ============================================================

// Get game stats - /api/game/stats
app.get('/api/game/stats', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });

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

// Flip - /api/game/flip
app.post('/api/game/flip', auth, async (req, res) => {
    try {
        const { betAmount, choice, progressiveStreak, originalBet } = req.body;

        if (!betAmount || betAmount <= 0) {
            return res.status(400).json({ error: 'Invalid bet amount' });
        }

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Level-based restrictions
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

        // Flip logic with 11% house edge (44.5% win chance)
        const winChance = 0.5 * (1 - 0.11); // ~44.5%
        const result = Math.random() < winChance ? 'heads' : 'tails';
        const win = choice === result;

        let winnings = 0;
        let xpGain = 2;
        let leveledUp = false;

        // Track progressive streak
        let effectiveStreak = progressiveStreak || 0;

        if (win) {
            // Use progressive multiplier if in progressive mode
            const PROGRESSIVE_MULTIPLIERS = [2, 3, 5, 8, 13, 21, 34, 55];
            let multiplier = 2;
            
            if (effectiveStreak > 0 && effectiveStreak <= PROGRESSIVE_MULTIPLIERS.length) {
                multiplier = PROGRESSIVE_MULTIPLIERS[effectiveStreak - 1];
            } else if (effectiveStreak > PROGRESSIVE_MULTIPLIERS.length) {
                multiplier = PROGRESSIVE_MULTIPLIERS[PROGRESSIVE_MULTIPLIERS.length - 1];
            }
            
            // Use originalBet for progressive mode, otherwise use betAmount
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

        // Add XP and check for level up
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
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
//  ADMIN ROUTES
// ============================================================

// Get all users - /api/admin/users
app.get('/api/admin/users', auth, async (req, res) => {
    try {
        const admin = await User.findById(req.userId);
        if (!admin || !admin.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const users = await User.find().select('-password').sort({ balance: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add funds - /api/admin/add-funds
app.post('/api/admin/add-funds', auth, async (req, res) => {
    try {
        const admin = await User.findById(req.userId);
        if (!admin || !admin.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { username, amount } = req.body;
        if (!username || !amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.balance += amount;
        await user.save();

        res.json({ success: true, newBalance: user.balance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove funds - /api/admin/remove-funds
app.post('/api/admin/remove-funds', auth, async (req, res) => {
    try {
        const admin = await User.findById(req.userId);
        if (!admin || !admin.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { username, amount } = req.body;
        if (!username || !amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        user.balance -= amount;
        await user.save();

        res.json({ success: true, newBalance: user.balance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
//  DEPOSIT / WITHDRAW ROUTES
// ============================================================

// Request deposit - /api/deposit/request-deposit
app.post('/api/deposit/request-deposit', auth, async (req, res) => {
    try {
        const { amount, amountPoints, cryptoMethod, walletAddress, transactionId, note } = req.body;
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const request = new DepositRequest({
            userId: user._id,
            username: user.username,
            type: 'deposit',
            amount: amountPoints || amount,
            cryptoMethod,
            walletAddress,
            transactionId: transactionId || walletAddress,
            note
        });

        await request.save();

        res.json({ success: true, message: 'Deposit request submitted', requestId: request._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Request withdraw - /api/deposit/request-withdraw
app.post('/api/deposit/request-withdraw', auth, async (req, res) => {
    try {
        const { amount, amountPoints, cryptoMethod, walletAddress, note } = req.body;
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.balance < (amountPoints || amount)) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        const request = new DepositRequest({
            userId: user._id,
            username: user.username,
            type: 'withdraw',
            amount: amountPoints || amount,
            cryptoMethod,
            walletAddress,
            note
        });

        await request.save();

        res.json({ success: true, message: 'Withdrawal request submitted', requestId: request._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get all deposit requests - /api/admin/deposit-requests
app.get('/api/admin/deposit-requests', auth, async (req, res) => {
    try {
        const admin = await User.findById(req.userId);
        if (!admin || !admin.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const requests = await DepositRequest.find().sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Approve deposit request - /api/admin/approve-deposit
app.post('/api/admin/approve-deposit', auth, async (req, res) => {
    try {
        const admin = await User.findById(req.userId);
        if (!admin || !admin.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { requestId } = req.body;
        const request = await DepositRequest.findById(requestId);
        if (!request) return res.status(404).json({ error: 'Request not found' });

        if (request.status !== 'pending') {
            return res.status(400).json({ error: 'Request already processed' });
        }

        const user = await User.findById(request.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (request.type === 'deposit') {
            user.balance += request.amount;
        }

        request.status = 'approved';
        await request.save();
        await user.save();

        res.json({ success: true, message: 'Request approved' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Reject deposit request - /api/admin/reject-deposit
app.post('/api/admin/reject-deposit', auth, async (req, res) => {
    try {
        const admin = await User.findById(req.userId);
        if (!admin || !admin.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const { requestId } = req.body;
        const request = await DepositRequest.findById(requestId);
        if (!request) return res.status(404).json({ error: 'Request not found' });

        if (request.status !== 'pending') {
            return res.status(400).json({ error: 'Request already processed' });
        }

        request.status = 'rejected';
        await request.save();

        res.json({ success: true, message: 'Request rejected' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
//  START SERVER
// ============================================================

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('📡 Endpoints available:');
    console.log('  POST /api/auth/signup - Register');
    console.log('  POST /api/auth/login - Login');
    console.log('  GET  /api/auth/me - Get user');
    console.log('  GET  /api/game/stats - Get stats');
    console.log('  POST /api/game/flip - Flip coin');
    console.log('  POST /api/deposit/request-deposit - Deposit');
    console.log('  POST /api/deposit/request-withdraw - Withdraw');
    console.log('  GET  /api/admin/users - Admin users');
    console.log('  POST /api/admin/add-funds - Add funds');
    console.log('  POST /api/admin/remove-funds - Remove funds');
});
