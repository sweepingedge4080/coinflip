const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, minlength: 3, maxlength: 20 },
    password: { type: String, required: true },
    balance: { type: Number, default: 0, min: 0 },
    totalWagered: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    bestStreak: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    isAdmin: { type: Boolean, default: false },
    pendingDeposits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DepositRequest' }],
    pendingWithdrawals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WithdrawRequest' }],
    createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
