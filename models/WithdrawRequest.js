const mongoose = require('mongoose');

const WithdrawRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    amount: { type: Number, required: true },
    amountPoints: { type: Number, required: true },
    cryptoMethod: { type: String, required: true },
    walletAddress: { type: String, required: true },
    note: { type: String },
    status: { 
        type: String, 
        enum: ['pending', 'completed', 'rejected'], 
        default: 'pending' 
    },
    adminNotes: { type: String },
    createdAt: { type: Date, default: Date.now },
    processedAt: { type: Date }
});

module.exports = mongoose.model('WithdrawRequest', WithdrawRequestSchema);
