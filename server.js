// ============================================================
//  server.js - Fixed: Admin Endpoints + $0 Starting Balance
// ============================================================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
//  MIDDLEWARE
// ============================================================
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// ============================================================
//  MONGODB CONNECTION
// ============================================================
const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error('❌ CRITICAL ERROR: MONGODB_URI is not set in environment variables!');
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
//  USER SCHEMA - NEW PLAYERS START WITH $0
// ============================================================
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 },  // ✅ CHANGED: $0 starting balance
    isAdmin: { type: Boolean, default: false },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    totalWagered: { type: Number, default: 0 },
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
    processedBy: { type: String },
    processedAt: { type: Date },
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
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        req.userId = decoded.userId;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
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
//  AUTH ROUTES
// ============================================================

// Signup - /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
    try {
        console.log('📝 Signup attempt:', req.body.username);
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        if (password.length < 4) {
            return res.status(400).json({ error: 'Password must be at least 4 characters' });
        }

        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ error: 'Username taken' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashed }); // ✅ Balance defaults to 0
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
        console.error('❌ Signup error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Login - /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('🔑 Login attempt:', req.body.username);
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

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
        console.error('❌ Login error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get current user - /api/auth/me
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
//  GAME ROUTES
// ============================================================

// Get game stats - /api/game/stats
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

// Flip coin - /api/game/flip
app.post('/api/game/flip', auth, async (req, res) => {
    try {
        const { betAmount, choice, progressiveStreak, originalBet } = req.body;

        if (!betAmount || betAmount <= 0) {
            return res.status(400).json({ error: 'Invalid bet amount' });
        }

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
//  DEPOSIT / WITHDRAW ROUTES
// ============================================================

// Request deposit - /api/deposit/request-deposit
app.post('/api/deposit/request-deposit', auth, async (req, res) => {
    try {
        const { amount, amountPoints, cryptoMethod, walletAddress, transactionId, note } = req.body;
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

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
        console.error('❌ Deposit error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Request withdraw - /api/deposit/request-withdraw
app.post('/api/deposit/request-withdraw', auth, async (req, res) => {
    try {
        const { amount, amountPoints, cryptoMethod, walletAddress, note } = req.body;
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

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
        console.error('❌ Withdraw error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
//  ADMIN ROUTES - FIXED & EXPANDED
// ============================================================

// Get all users - /api/admin/users
app.get('/api/admin/users', auth, isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ balance: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ NEW: Get pending deposit requests - /api/admin/requests/deposits/pending
app.get('/api/admin/requests/deposits/pending', auth, isAdmin, async (req, res) => {
    try {
        const requests = await DepositRequest.find({ 
            type: 'deposit', 
            status: 'pending' 
        }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        console.error('❌ Admin deposits pending error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ NEW: Get processed deposit requests - /api/admin/requests/deposits/processed
app.get('/api/admin/requests/deposits/processed', auth, isAdmin, async (req, res) => {
    try {
        const requests = await DepositRequest.find({ 
            type: 'deposit', 
            status: { $in: ['approved', 'rejected'] } 
        }).sort({ processedAt: -1 }).limit(100);
        res.json(requests);
    } catch (err) {
        console.error('❌ Admin deposits processed error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ NEW: Get pending withdrawal requests - /api/admin/requests/withdrawals/pending
app.get('/api/admin/requests/withdrawals/pending', auth, isAdmin, async (req, res) => {
    try {
        const requests = await DepositRequest.find({ 
            type: 'withdraw', 
            status: 'pending' 
        }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        console.error('❌ Admin withdrawals pending error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ NEW: Get processed withdrawal requests - /api/admin/requests/withdrawals/processed
app.get('/api/admin/requests/withdrawals/processed', auth, isAdmin, async (req, res) => {
    try {
        const requests = await DepositRequest.find({ 
            type: 'withdraw', 
            status: { $in: ['approved', 'rejected'] } 
        }).sort({ processedAt: -1 }).limit(100);
        res.json(requests);
    } catch (err) {
        console.error('❌ Admin withdrawals processed error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ NEW: Process (approve/reject) a deposit/withdraw request - /api/admin/process-request
app.post('/api/admin/process-request', auth, isAdmin, async (req, res) => {
    try {
        const { requestId, action, adminNote } = req.body;
        
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action. Must be "approve" or "reject"' });
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

        // Get admin user info
        const admin = await User.findById(req.userId);

        if (action === 'approve') {
            if (request.type === 'deposit') {
                user.balance += request.amount;
                await user.save();
                console.log(`✅ Deposit approved: ${user.username} +$${request.amount} by ${admin.username}`);
            } else {
                // Withdraw - deduct from balance
                if (user.balance < request.amount) {
                    return res.status(400).json({ error: 'Insufficient balance' });
                }
                user.balance -= request.amount;
                await user.save();
                console.log(`✅ Withdraw approved: ${user.username} -$${request.amount} by ${admin.username}`);
            }
        } else {
            console.log(`❌ Request rejected: ${request.type} - ${user.username} - $${request.amount} by ${admin.username}`);
        }

        request.status = action === 'approve' ? 'approved' : 'rejected';
        request.processedBy = admin.username;
        request.processedAt = new Date();
        if (adminNote) request.note = adminNote;
        await request.save();

        res.json({
            success: true,
            message: `Request ${action}d successfully`,
            newBalance: user.balance,
            request: request
        });
    } catch (err) {
        console.error('❌ Process request error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Add funds - /api/admin/add-funds
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

        res.json({ success: true, newBalance: user.balance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove funds - /api/admin/remove-funds
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
//  START SERVER
// ============================================================
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    console.log('🔗 Endpoints:');
    console.log('   POST /api/auth/signup - Register');
    console.log('   POST /api/auth/login - Login');
    console.log('   GET  /api/auth/me - Get user');
    console.log('   GET  /api/game/stats - Get stats');
    console.log('   POST /api/game/flip - Flip coin');
    console.log('   POST /api/deposit/request-deposit - Deposit');
    console.log('   POST /api/deposit/request-withdraw - Withdraw');
    console.log('   GET  /api/admin/users - Admin users');
    console.log('   GET  /api/admin/requests/deposits/pending - Admin pending deposits');
    console.log('   GET  /api/admin/requests/deposits/processed - Admin processed deposits');
    console.log('   GET  /api/admin/requests/withdrawals/pending - Admin pending withdrawals');
    console.log('   GET  /api/admin/requests/withdrawals/processed - Admin processed withdrawals');
    console.log('   POST /api/admin/process-request - Admin process request');
    console.log('   POST /api/admin/add-funds - Add funds');
    console.log('   POST /api/admin/remove-funds - Remove funds');
});
