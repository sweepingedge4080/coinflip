const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const depositRoutes = require('./routes/deposit');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rate limiting - PER USER: 3600 requests per hour
const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 3600,                  // 3600 requests per hour per user
    message: { error: 'Too many requests, please try again later.' },
    keyGenerator: (req) => {
        // Use user ID if logged in, otherwise use IP address
        return req.userId || req.ip;
    },
    skip: (req) => {
        // Optional: Skip rate limiting for admin users (remove if you don't want this)
        return req.user && req.user.isAdmin === true;
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: false, // Count all requests (both success and error)
    skipFailedRequests: false      // Don't skip failed requests
});

// Apply rate limiting to all API routes
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/deposit', depositRoutes);
app.use('/api/admin', adminRoutes);

// Serve HTML files - IMPORTANT: These must be AFTER API routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Rate limit: 3600 requests per hour per user`);
});
