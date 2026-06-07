const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const DepositRequest = require('../models/DepositRequest');
const WithdrawRequest = require('../models/WithdrawRequest');
const router = express.Router();

async function isAdmin(userId) {
    const user = await User.findById(userId);
    return user && user.isAdmin === true;
}

// Get all pending deposit requests
router.get('/pending-deposits', auth, async (req, res) => {
    try {
        if (!await isAdmin(req.userId)) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const deposits = await DepositRequest.find({ status: 'pending' }).sort({ createdAt: -1 });
        res.json(deposits);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all pending withdrawal requests
router.get('/pending-withdrawals', auth, async (req, res) => {
    try {
        if (!await isAdmin(req.userId)) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const withdrawals = await WithdrawRequest.find({ status: 'pending' }).sort({ createdAt: -1 });
        res.json(withdrawals);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Approve deposit (add funds to user)
router.post('/approve-deposit', auth, async (req, res) => {
    try {
        if (!await isAdmin(req.userId)) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { requestId } = req.body;
        
        const deposit = await DepositRequest.findById(requestId);
        if (!deposit) {
            return res.status(404).json({ error: 'Deposit request not found' });
        }
        
        if (deposit.status !== 'pending') {
            return res.status(400).json({ error: 'Deposit already processed' });
        }
        
        const user = await User.findById(deposit.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Add points to user balance
        user.balance += deposit.amountPoints;
        await user.save();
        
        deposit.status = 'confirmed';
        deposit.processedAt = new Date();
        await deposit.save();
        
        res.json({ 
            success: true, 
            message: `Added ${deposit.amountPoints} points to ${user.username}`,
            newBalance: user.balance
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Reject deposit
router.post('/reject-deposit', auth, async (req, res) => {
    try {
        if (!await isAdmin(req.userId)) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { requestId, reason } = req.body;
        
        const deposit = await DepositRequest.findById(requestId);
        if (!deposit) {
            return res.status(404).json({ error: 'Deposit request not found' });
        }
        
        deposit.status = 'rejected';
        deposit.adminNotes = reason;
        deposit.processedAt = new Date();
        await deposit.save();
        
        res.json({ success: true, message: 'Deposit rejected' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Approve withdrawal (remove funds and process payout)
router.post('/approve-withdrawal', auth, async (req, res) => {
    try {
        if (!await isAdmin(req.userId)) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { requestId } = req.body;
        
        const withdrawal = await WithdrawRequest.findById(requestId);
        if (!withdrawal) {
            return res.status(404).json({ error: 'Withdrawal request not found' });
        }
        
        if (withdrawal.status !== 'pending') {
            return res.status(400).json({ error: 'Withdrawal already processed' });
        }
        
        const user = await User.findById(withdrawal.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Remove points from user balance
        user.balance -= withdrawal.amountPoints;
        await user.save();
        
        withdrawal.status = 'completed';
        withdrawal.processedAt = new Date();
        await withdrawal.save();
        
        res.json({ 
            success: true, 
            message: `Withdrawal of ${withdrawal.amountPoints} points approved. Send ${withdrawal.amount} ${withdrawal.cryptoMethod} to ${withdrawal.walletAddress}`,
            newBalance: user.balance
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all users (admin only)
router.get('/users', auth, async (req, res) => {
    try {
        if (!await isAdmin(req.userId)) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin add/remove funds
router.post('/add-funds', auth, async (req, res) => {
    try {
        if (!await isAdmin(req.userId)) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { username, amount } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        user.balance += amount;
        await user.save();
        
        res.json({ message: `Added ${amount} points to ${username}`, newBalance: user.balance });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/remove-funds', auth, async (req, res) => {
    try {
        if (!await isAdmin(req.userId)) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const { username, amount } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (amount > user.balance) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        
        user.balance -= amount;
        await user.save();
        
        res.json({ message: `Removed ${amount} points from ${username}`, newBalance: user.balance });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;