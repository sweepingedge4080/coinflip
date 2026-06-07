const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// 11% house edge: 44.5% win rate, 2.0x payout
const WIN_CHANCE = 0.445;
const PAYOUT_MULTIPLIER = 2.0;

router.post('/flip', auth, async (req, res) => {
    try {
        const { betAmount, choice } = req.body;
        
        if (!betAmount || betAmount <= 0) {
            return res.status(400).json({ error: 'Invalid bet amount' });
        }
        if (choice !== 'heads' && choice !== 'tails') {
            return res.status(400).json({ error: 'Invalid choice' });
        }
        
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (betAmount > user.balance) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        
        // Deduct bet
        user.balance -= betAmount;
        user.totalWagered = (user.totalWagered || 0) + betAmount;
        
        const isWin = Math.random() < WIN_CHANCE;
        const result = isWin ? choice : (choice === 'heads' ? 'tails' : 'heads');
        
        if (isWin) {
            const winnings = betAmount * PAYOUT_MULTIPLIER;
            user.balance += winnings;
            user.wins += 1;
            user.currentStreak += 1;
            if (user.currentStreak > user.bestStreak) {
                user.bestStreak = user.currentStreak;
            }
            await user.save();
            
            res.json({
                success: true,
                result: result,
                isWin: true,
                winnings: winnings,
                newBalance: user.balance,
                stats: {
                    wins: user.wins,
                    losses: user.losses,
                    currentStreak: user.currentStreak,
                    bestStreak: user.bestStreak,
                    totalWagered: user.totalWagered
                }
            });
        } else {
            user.losses += 1;
            user.currentStreak = 0;
            await user.save();
            
            res.json({
                success: true,
                result: result,
                isWin: false,
                winnings: 0,
                newBalance: user.balance,
                stats: {
                    wins: user.wins,
                    losses: user.losses,
                    currentStreak: user.currentStreak,
                    bestStreak: user.bestStreak,
                    totalWagered: user.totalWagered
                }
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/stats', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        res.json({
            balance: user.balance,
            wins: user.wins,
            losses: user.losses,
            currentStreak: user.currentStreak,
            bestStreak: user.bestStreak,
            totalWagered: user.totalWagered
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;