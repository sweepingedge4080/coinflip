const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

// ============================================================
//  SIGNUP
// ============================================================
router.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }
        if (!password || password.length < 4) {
            return res.status(400).json({ error: 'Password must be at least 4 characters' });
        }
        
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
        }
        
        const user = new User({ username, password });
        await user.save();
        
        const token = jwt.sign(
            { userId: user._id, username: user.username, isAdmin: user.isAdmin },
            process.env.JWT_SECRET || 'secretkey',
            { expiresIn: '7d' }
        );
        
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
    } catch (error) {
        console.error('❌ Signup error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================================
//  LOGIN
// ============================================================
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }
        
        const isValid = await user.comparePassword(password);
        if (!isValid) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }
        
        const token = jwt.sign(
            { userId: user._id, username: user.username, isAdmin: user.isAdmin },
            process.env.JWT_SECRET || 'secretkey',
            { expiresIn: '7d' }
        );
        
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
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================================
//  GET CURRENT USER
// ============================================================
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('❌ Get user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
