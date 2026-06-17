// ============================================================
//  server.js - Modular Version (Uses routes/ and models/)
// ============================================================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
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
app.use(express.json({ limit: '1mb' }));
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
//  IMPORT ROUTES
// ============================================================
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/game');
const depositRoutes = require('./routes/deposit');
const adminRoutes = require('./routes/admin');

// ============================================================
//  USE ROUTES
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/deposit', depositRoutes);
app.use('/api/admin', adminRoutes);

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
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ============================================================
//  ERROR HANDLING
// ============================================================
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({ error: 'Something went wrong' });
});

// ============================================================
//  START SERVER
// ============================================================
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    console.log('🔗 Routes loaded:');
    console.log('   /api/auth/* - Authentication');
    console.log('   /api/game/* - Game logic');
    console.log('   /api/deposit/* - Deposits/Withdrawals');
    console.log('   /api/admin/* - Admin panel');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, closing server...');
    mongoose.connection.close(() => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
    });
});
