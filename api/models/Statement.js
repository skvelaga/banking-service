const mongoose = require('mongoose');

const statementSchema = new mongoose.Schema({
  statementId: {
    type: String,
    required: true,
    unique: true
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  accountNumber: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  openingBalance: {
    type: Number,
    required: true
  },
  closingBalance: {
    type: Number,
    required: true
  },
  totalCredits: {
    type: Number,
    default: 0
  },
  totalDebits: {
    type: Number,
    default: 0
  },
  transactionCount: {
    type: Number,
    default: 0
  },
  transactions: [{
    transactionId: String,
    date: Date,
    description: String,
    type: String,
    amount: Number,
    balance: Number
  }],
  currency: {
    type: String,
    default: 'USD'
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
statementSchema.index({ accountId: 1, startDate: -1 });
statementSchema.index({ statementId: 1 });

module.exports = mongoose.model('Statement', statementSchema);
