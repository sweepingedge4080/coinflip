const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const DepositRequest = require('../models/DepositRequest');
const WithdrawRequest = require('../models/WithdrawRequest');
const router = express.Router();

// Submit deposit request
router.post('/request-deposit', auth, async (req, res) => {
    try {
        const { amount, amountPoints, cryptoMethod, walletAddress, transactionId, note } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        if (!cryptoMethod || !walletAddress || !transactionId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const depositRequest = new DepositRequest({
            userId: user._id,
            username: user.username,
            amount: amount,
            amountPoints: amountPoints,
            cryptoMethod: cryptoMethod,
            walletAddress: walletAddress,
            transactionId: transactionId,
            note: note
        });
        
        await depositRequest.save();
        
        user.pendingDeposits.push(depositRequest._id);
        await user.save();
        
        res.json({
            success: true,
            message: 'Deposit request submitted. Admin will review and add funds.',
            requestId: depositRequest._id
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Submit withdrawal request
router.post('/request-withdraw', auth, async (req, res) => {
    try {
        const { amount, amountPoints, cryptoMethod, walletAddress, note } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        if (!cryptoMethod || !walletAddress) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (amountPoints > user.balance) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        
        const withdrawRequest = new WithdrawRequest({
            userId: user._id,
            username: user.username,
            amount: amount,
            amountPoints: amountPoints,
            cryptoMethod: cryptoMethod,
            walletAddress: walletAddress,
            note: note
        });
        
        await withdrawRequest.save();
        
        user.pendingWithdrawals.push(withdrawRequest._id);
        await user.save();
        
        res.json({
            success: true,
            message: 'Withdrawal request submitted. Admin will review and process.',
            requestId: withdrawRequest._id
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user's pending requests
router.get('/my-requests', auth, async (req, res) => {
    try {
        const deposits = await DepositRequest.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(20);
        const withdrawals = await WithdrawRequest.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(20);
        
        res.json({
            deposits: deposits,
            withdrawals: withdrawals
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;