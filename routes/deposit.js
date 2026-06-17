const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const DepositRequest = require('../models/DepositRequest');
const WithdrawRequest = require('../models/WithdrawRequest');
const router = express.Router();

// ============================================================
//  REQUEST DEPOSIT
// ============================================================
router.post('/request-deposit', auth, async (req, res) => {
    try {
        const { amount, amountPoints, cryptoMethod, walletAddress, transactionId, note } = req.body;
        
        const finalAmount = amount || amountPoints;
        const finalAmountPoints = amountPoints || amount;
        
        if (!finalAmount || finalAmount <= 0) {
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
            amount: finalAmount,
            amountPoints: finalAmountPoints,
            cryptoMethod: cryptoMethod,
            walletAddress: walletAddress,
            transactionId: transactionId,
            note: note || '',
            status: 'pending'
        });
        
        await depositRequest.save();
        
        if (!user.pendingDeposits) user.pendingDeposits = [];
        user.pendingDeposits.push(depositRequest._id);
        await user.save();
        
        res.json({
            success: true,
            message: 'Deposit request submitted. Admin will review and add funds.',
            requestId: depositRequest._id
        });
    } catch (error) {
        console.error('❌ Deposit request error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// ============================================================
//  REQUEST WITHDRAWAL
// ============================================================
router.post('/request-withdraw', auth, async (req, res) => {
    try {
        const { amount, amountPoints, cryptoMethod, walletAddress, note } = req.body;
        
        const finalAmount = amount || amountPoints;
        const finalAmountPoints = amountPoints || amount;
        
        if (!finalAmount || finalAmount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        if (!cryptoMethod || !walletAddress) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (finalAmountPoints > user.balance) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        
        const withdrawRequest = new WithdrawRequest({
            userId: user._id,
            username: user.username,
            amount: finalAmount,
            amountPoints: finalAmountPoints,
            cryptoMethod: cryptoMethod,
            walletAddress: walletAddress,
            note: note || '',
            status: 'pending'
        });
        
        await withdrawRequest.save();
        
        if (!user.pendingWithdrawals) user.pendingWithdrawals = [];
        user.pendingWithdrawals.push(withdrawRequest._id);
        await user.save();
        
        res.json({
            success: true,
            message: 'Withdrawal request submitted. Admin will review and process.',
            requestId: withdrawRequest._id
        });
    } catch (error) {
        console.error('❌ Withdrawal request error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// ============================================================
//  GET USER'S REQUESTS
// ============================================================
router.get('/my-requests', auth, async (req, res) => {
    try {
        const deposits = await DepositRequest.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(20);
        const withdrawals = await WithdrawRequest.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(20);
        
        res.json({
            deposits: deposits,
            withdrawals: withdrawals
        });
    } catch (error) {
        console.error('❌ Get requests error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
