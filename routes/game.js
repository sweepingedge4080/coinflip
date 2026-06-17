const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// 11% house edge: 44.5% win rate, 2.0x base payout
const WIN_CHANCE = 0.445;
const BASE_PAYOUT_MULTIPLIER = 2.0;

// Progressive multipliers for streaks
const PROGRESSIVE_MULTIPLIERS = [2, 3, 5, 8, 13, 21, 34, 55];

function getProgressiveMultiplier(streak) {
    if (streak <= 0) return BASE_PAYOUT_MULTIPLIER;
    if (streak > PROGRESSIVE_MULTIPLIERS.length) {
        return PROGRESSIVE_MULTIPLIERS[PROGRESSIVE_MULTIPLIERS.length - 1];
    }
    return PROGRESSIVE_MULTIPLIERS[streak - 1];
}

// ============================================================
//  FLIP COIN
// ============================================================
router.post('/flip', auth, async (req, res) => {
    try {
        const { betAmount, choice, progressiveStreak = 0, originalBet = betAmount } = req.body;
        
        console.log(`🪙 Flip request: ${req.username} - Bet: $${betAmount} - Choice: ${choice}`);
        
        if (!betAmount || betAmount <= 0) {
            return res.status(400).json({ error: 'Invalid bet amount' });
        }
        if (choice !== 'heads' && choice !== 'tails') {
            return res.status(400).json({ error: 'Invalid choice' });
        }
        
        // ✅ Get user from database
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const actualBetAmount = (progressiveStreak > 0 && originalBet) ? originalBet : betAmount;
        
        if (actualBetAmount > user.balance) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }
        
        // ✅ Deduct bet from user.balance
        user.balance -= actualBetAmount;
        user.totalWagered = (user.totalWagered || 0) + actualBetAmount;
        
        const isWin = Math.random() < WIN_CHANCE;
        const result = isWin ? choice : (choice === 'heads' ? 'tails' : 'heads');
        
        let xpGain = 2;
        let leveledUp = false;
        let winnings = 0;
        let payoutMultiplier = BASE_PAYOUT_MULTIPLIER;
        
        if (isWin) {
            if (progressiveStreak > 0) {
                payoutMultiplier = getProgressiveMultiplier(progressiveStreak);
            } else {
                payoutMultiplier = BASE_PAYOUT_MULTIPLIER;
            }
            
            winnings = actualBetAmount * payoutMultiplier;
            
            // ✅ ADD winnings to user.balance
            user.balance += winnings;
            user.wins = (user.wins || 0) + 1;
            user.currentStreak = (user.currentStreak || 0) + 1;
            if (user.currentStreak > (user.bestStreak || 0)) {
                user.bestStreak = user.currentStreak;
            }
            xpGain = Math.floor(10 + (actualBetAmount / 10));
            
            // ✅ Add XP
            user.xp = (user.xp || 0) + xpGain;
            
            // ✅ Check level up (100 XP per level)
            const newLevel = Math.floor((user.xp || 0) / 100) + 1;
            if (newLevel > (user.level || 1)) {
                user.level = newLevel;
                leveledUp = true;
            }
            
            // ✅ SAVE to database
            await user.save();
            
            console.log(`✅ WIN: ${req.username} won $${winnings.toFixed(2)} - New balance: $${user.balance.toFixed(2)}`);
            
            res.json({
                success: true,
                result: result,
                isWin: true,
                winnings: winnings,
                payoutMultiplier: payoutMultiplier,
                newBalance: user.balance,
                xpGain: xpGain,
                level: user.level,
                xp: user.xp,
                leveledUp: leveledUp,
                stats: {
                    wins: user.wins,
                    losses: user.losses,
                    currentStreak: user.currentStreak,
                    bestStreak: user.bestStreak,
                    totalWagered: user.totalWagered
                }
            });
        } else {
            // ❌ LOSS
            user.losses = (user.losses || 0) + 1;
            user.currentStreak = 0;
            xpGain = 2;
            user.xp = (user.xp || 0) + xpGain;
            
            // ✅ SAVE to database
            await user.save();
            
            console.log(`❌ LOSS: ${req.username} lost $${actualBetAmount.toFixed(2)} - New balance: $${user.balance.toFixed(2)}`);
            
            res.json({
                success: true,
                result: result,
                isWin: false,
                winnings: 0,
                newBalance: user.balance,
                xpGain: xpGain,
                level: user.level,
                xp: user.xp,
                leveledUp: false,
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
        console.error('❌ Flip error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// ============================================================
//  ADD PROGRESSIVE WINNINGS
// ============================================================
router.post('/add-progressive', auth, async (req, res) => {
    try {
        const { amount, streak } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // ✅ ADD to user balance
        user.balance += amount;
        
        // ✅ SAVE to database
        await user.save();
        
        console.log(`✅ Progressive cashout: ${user.username} cashed out $${amount.toFixed(2)} from ${streak || '?'} win streak - New balance: $${user.balance.toFixed(2)}`);
        
        res.json({
            success: true,
            newBalance: user.balance,
            message: `Added $${amount.toFixed(2)} from progressive cashout`
        });
    } catch (error) {
        console.error('❌ Add progressive error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// ============================================================
//  GET STATS
// ============================================================
router.get('/stats', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log(`📊 Stats requested: ${user.username} - Balance: $${user.balance.toFixed(2)}`);
        
        res.json({
            id: user._id,
            username: user.username,
            balance: user.balance,
            wins: user.wins,
            losses: user.losses,
            currentStreak: user.currentStreak,
            bestStreak: user.bestStreak,
            totalWagered: user.totalWagered,
            level: user.level || 1,
            xp: user.xp || 0,
            isAdmin: user.isAdmin
        });
    } catch (error) {
        console.error('❌ Stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
