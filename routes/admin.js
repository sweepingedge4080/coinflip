const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const DepositRequest = require('../models/DepositRequest');
const WithdrawRequest = require('../models/WithdrawRequest');
const router = express.Router();

// Middleware to check admin
const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// ========== GET ALL USERS ==========
router.get('/users', auth, isAdmin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== DEPOSIT ENDPOINTS ==========
router.get('/requests/deposits/pending', auth, isAdmin, async (req, res) => {
    try {
        const deposits = await DepositRequest.find({ status: 'pending' }).populate('userId', 'username');
        const formatted = deposits.map(d => ({
            _id: d._id,
            username: d.username || d.userId?.username || 'Unknown',
            amount: d.amountPoints || d.amount,
            cryptoMethod: d.cryptoMethod,
            transactionId: d.transactionId,
            walletAddress: d.walletAddress,
            createdAt: d.createdAt,
            status: d.status
        }));
        res.json(formatted);
    } catch (error) {
        console.error('Error loading deposits:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/requests/deposits/processed', auth, isAdmin, async (req, res) => {
    try {
        const deposits = await DepositRequest.find({ status: { $ne: 'pending' } })
            .populate('userId', 'username')
            .sort({ processedAt: -1 });
        const formatted = deposits.map(d => ({
            _id: d._id,
            username: d.username || d.userId?.username || 'Unknown',
            amount: d.amountPoints || d.amount,
            status: d.status,
            rejectionReason: d.adminNotes || '',
            processedAt: d.processedAt,
            createdAt: d.createdAt
        }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/requests/deposit/approve', auth, isAdmin, async (req, res) => {
    try {
        const { requestId } = req.body;
        const request = await DepositRequest.findById(requestId);
        if (!request) return res.status(404).json({ error: 'Request not found' });
        if (request.status !== 'pending') return res.status(400).json({ error: 'Already processed' });
        
        const user = await User.findById(request.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        // Add funds to user balance (using amountPoints)
        const amountToAdd = request.amountPoints || request.amount;
        user.balance += amountToAdd;
        await user.save();
        
        request.status = 'confirmed';
        request.processedAt = new Date();
        await request.save();
        
        res.json({ success: true, message: 'Deposit approved' });
    } catch (error) {
        console.error('Error approving deposit:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/requests/deposit/reject', auth, isAdmin, async (req, res) => {
    try {
        const { requestId, reason } = req.body;
        const request = await DepositRequest.findById(requestId);
        if (!request) return res.status(404).json({ error: 'Request not found' });
        if (request.status !== 'pending') return res.status(400).json({ error: 'Already processed' });
        
        request.status = 'rejected';
        request.adminNotes = reason || 'Rejected by admin';
        request.processedAt = new Date();
        await request.save();
        
        res.json({ success: true, message: 'Deposit rejected' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== WITHDRAWAL ENDPOINTS ==========
router.get('/requests/withdrawals/pending', auth, isAdmin, async (req, res) => {
    try {
        const withdrawals = await WithdrawRequest.find({ status: 'pending' }).populate('userId', 'username');
        const formatted = withdrawals.map(w => ({
            _id: w._id,
            username: w.username || w.userId?.username || 'Unknown',
            amount: w.amountPoints || w.amount,
            cryptoMethod: w.cryptoMethod,
            walletAddress: w.walletAddress,
            createdAt: w.createdAt,
            status: w.status
        }));
        res.json(formatted);
    } catch (error) {
        console.error('Error loading withdrawals:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/requests/withdrawals/processed', auth, isAdmin, async (req, res) => {
    try {
        const withdrawals = await WithdrawRequest.find({ status: { $ne: 'pending' } })
            .populate('userId', 'username')
            .sort({ processedAt: -1 });
        const formatted = withdrawals.map(w => ({
            _id: w._id,
            username: w.username || w.userId?.username || 'Unknown',
            amount: w.amountPoints || w.amount,
            status: w.status === 'completed' ? 'approved' : w.status,
            rejectionReason: w.adminNotes || '',
            processedAt: w.processedAt,
            createdAt: w.createdAt
        }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/requests/withdrawal/approve', auth, isAdmin, async (req, res) => {
    try {
        const { requestId } = req.body;
        const request = await WithdrawRequest.findById(requestId);
        if (!request) return res.status(404).json({ error: 'Request not found' });
        if (request.status !== 'pending') return res.status(400).json({ error: 'Already processed' });
        
        const user = await User.findById(request.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const amountToDeduct = request.amountPoints || request.amount;
        if (user.balance < amountToDeduct) {
            request.status = 'rejected';
            request.adminNotes = 'Insufficient balance';
            request.processedAt = new Date();
            await request.save();
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        
        // Deduct funds from user balance
        user.balance -= amountToDeduct;
        await user.save();
        
        request.status = 'completed';
        request.processedAt = new Date();
        await request.save();
        
        res.json({ success: true, message: 'Withdrawal approved' });
    } catch (error) {
        console.error('Error approving withdrawal:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/requests/withdrawal/reject', auth, isAdmin, async (req, res) => {
    try {
        const { requestId, reason } = req.body;
        const request = await WithdrawRequest.findById(requestId);
        if (!request) return res.status(404).json({ error: 'Request not found' });
        if (request.status !== 'pending') return res.status(400).json({ error: 'Already processed' });
        
        request.status = 'rejected';
        request.adminNotes = reason || 'Rejected by admin';
        request.processedAt = new Date();
        await request.save();
        
        res.json({ success: true, message: 'Withdrawal rejected' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== MANUAL FUND ADJUSTMENT (by USERNAME - matches frontend) ==========
router.post('/add-funds', auth, isAdmin, async (req, res) => {
    try {
        const { username, amount } = req.body;
        
        if (!username || !amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid username or amount' });
        }
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        user.balance += amount;
        await user.save();
        
        res.json({ 
            success: true, 
            message: `Added $${amount} to ${username}`,
            newBalance: user.balance 
        });
    } catch (error) {
        console.error('Add funds error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/remove-funds', auth, isAdmin, async (req, res) => {
    try {
        const { username, amount } = req.body;
        
        if (!username || !amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid username or amount' });
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
        
        res.json({ 
            success: true, 
            message: `Removed $${amount} from ${username}`,
            newBalance: user.balance 
        });
    } catch (error) {
        console.error('Remove funds error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ========== LEGACY MANUAL ADJUSTMENT (keep for backward compatibility) ==========
router.post('/manual-add', auth, isAdmin, async (req, res) => {
    try {
        const { userId, amount } = req.body;
        if (!userId || !amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid request' });
        }
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        user.balance += amount;
        await user.save();
        
        res.json({ success: true, newBalance: user.balance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/manual-remove', auth, isAdmin, async (req, res) => {
    try {
        const { userId, amount } = req.body;
        if (!userId || !amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid request' });
        }
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        if (user.balance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        
        user.balance -= amount;
        await user.save();
        
        res.json({ success: true, newBalance: user.balance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== GET SINGLE USER ==========
router.get('/user/:id', auth, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
