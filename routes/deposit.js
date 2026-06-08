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
        
        // Allow either amount or amountPoints
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
        
        // Initialize arrays if they don't exist
        if (!user.pendingDeposits) user.pendingDeposits = [];
        user.pendingDeposits.push(depositRequest._id);
        await user.save();
        
        res.json({
            success: true,
            message: 'Deposit request submitted. Admin will review and add funds.',
            requestId: depositRequest._id
        });
    } catch (error) {
        console.error('Deposit request error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Submit withdrawal request
router.post('/request-withdraw', auth, async (req, res) => {
    try {
        const { amount, amountPoints, cryptoMethod, walletAddress, note } = req.body;
        
        // Allow either amount or amountPoints
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
        
        // Initialize arrays if they don't exist
        if (!user.pendingWithdrawals) user.pendingWithdrawals = [];
        user.pendingWithdrawals.push(withdrawRequest._id);
        await user.save();
        
        res.json({
            success: true,
            message: 'Withdrawal request submitted. Admin will review and process.',
            requestId: withdrawRequest._id
        });
    } catch (error) {
        console.error('Withdrawal request error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
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
        console.error('Get requests error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all pending deposits (for admin)
router.get('/admin/pending-deposits', auth, async (req, res) => {
    try {
        // Check if user is admin
        const user = await User.findById(req.userId);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const deposits = await DepositRequest.find({ status: 'pending' })
            .populate('userId', 'username balance')
            .sort({ createdAt: -1 });
        res.json(deposits);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all pending withdrawals (for admin)
router.get('/admin/pending-withdrawals', auth, async (req, res) => {
    try {
        // Check if user is admin
        const user = await User.findById(req.userId);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const withdrawals = await WithdrawRequest.find({ status: 'pending' })
            .populate('userId', 'username balance')
            .sort({ createdAt: -1 });
        res.json(withdrawals);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Approve deposit (for admin)
router.post('/admin/approve-deposit', auth, async (req, res) => {
    try {
        const { requestId } = req.body;
        
        // Check if user is admin
        const admin = await User.findById(req.userId);
        if (!admin || !admin.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const deposit = await DepositRequest.findById(requestId);
        if (!deposit) {
            return res.status(404).json({ error: 'Deposit request not found' });
        }
        
        if (deposit.status !== 'pending') {
            return res.status(400).json({ error: 'Request already processed' });
        }
        
        const user = await User.findById(deposit.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Add funds to user balance
        const amountToAdd = deposit.amountPoints || deposit.amount;
        user.balance += amountToAdd;
        await user.save();
        
        // Update deposit status
        deposit.status = 'confirmed';
        deposit.processedAt = new Date();
        await deposit.save();
        
        // Remove from pending array if it exists
        if (user.pendingDeposits) {
            user.pendingDeposits = user.pendingDeposits.filter(id => id.toString() !== requestId);
            await user.save();
        }
        
        res.json({ 
            success: true, 
            message: `Deposit approved. Added ${amountToAdd} points to ${user.username}` 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Reject deposit (for admin)
router.post('/admin/reject-deposit', auth, async (req, res) => {
    try {
        const { requestId, reason } = req.body;
        
        // Check if user is admin
        const admin = await User.findById(req.userId);
        if (!admin || !admin.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const deposit = await DepositRequest.findById(requestId);
        if (!deposit) {
            return res.status(404).json({ error: 'Deposit request not found' });
        }
        
        if (deposit.status !== 'pending') {
            return res.status(400).json({ error: 'Request already processed' });
        }
        
        const user = await User.findById(deposit.userId);
        
        // Update deposit status
        deposit.status = 'rejected';
        deposit.adminNotes = reason || 'Rejected by admin';
        deposit.processedAt = new Date();
        await deposit.save();
        
        // Remove from pending array if it exists
        if (user && user.pendingDeposits) {
            user.pendingDeposits = user.pendingDeposits.filter(id => id.toString() !== requestId);
            await user.save();
        }
        
        res.json({ success: true, message: 'Deposit rejected' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Approve withdrawal (for admin)
router.post('/admin/approve-withdrawal', auth, async (req, res) => {
    try {
        const { requestId } = req.body;
        
        // Check if user is admin
        const admin = await User.findById(req.userId);
        if (!admin || !admin.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const withdrawal = await WithdrawRequest.findById(requestId);
        if (!withdrawal) {
            return res.status(404).json({ error: 'Withdrawal request not found' });
        }
        
        if (withdrawal.status !== 'pending') {
            return res.status(400).json({ error: 'Request already processed' });
        }
        
        const user = await User.findById(withdrawal.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const amountToDeduct = withdrawal.amountPoints || withdrawal.amount;
        if (user.balance < amountToDeduct) {
            withdrawal.status = 'rejected';
            withdrawal.adminNotes = 'Insufficient balance';
            withdrawal.processedAt = new Date();
            await withdrawal.save();
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        
        // Deduct funds from user balance
        user.balance -= amountToDeduct;
        await user.save();
        
        // Update withdrawal status
        withdrawal.status = 'completed';
        withdrawal.processedAt = new Date();
        await withdrawal.save();
        
        // Remove from pending array if it exists
        if (user.pendingWithdrawals) {
            user.pendingWithdrawals = user.pendingWithdrawals.filter(id => id.toString() !== requestId);
            await user.save();
        }
        
        res.json({ 
            success: true, 
            message: `Withdrawal approved. Deducted ${amountToDeduct} points from ${user.username}` 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Reject withdrawal (for admin)
router.post('/admin/reject-withdrawal', auth, async (req, res) => {
    try {
        const { requestId, reason } = req.body;
        
        // Check if user is admin
        const admin = await User.findById(req.userId);
        if (!admin || !admin.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const withdrawal = await WithdrawRequest.findById(requestId);
        if (!withdrawal) {
            return res.status(404).json({ error: 'Withdrawal request not found' });
        }
        
        if (withdrawal.status !== 'pending') {
            return res.status(400).json({ error: 'Request already processed' });
        }
        
        const user = await User.findById(withdrawal.userId);
        
        // Update withdrawal status
        withdrawal.status = 'rejected';
        withdrawal.adminNotes = reason || 'Rejected by admin';
        withdrawal.processedAt = new Date();
        await withdrawal.save();
        
        // Remove from pending array if it exists
        if (user && user.pendingWithdrawals) {
            user.pendingWithdrawals = user.pendingWithdrawals.filter(id => id.toString() !== requestId);
            await user.save();
        }
        
        res.json({ success: true, message: 'Withdrawal rejected' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
