const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const cardSchema = new mongoose.Schema({
  cardNumber: {
    type: String,
    required: true,
    unique: true
  },
  cardNumberLast4: {
    type: String,
    required: true
  },
  cardHolderName: {
    type: String,
    required: true
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  cardType: {
    type: String,
    required: true,
    enum: ['debit', 'credit']
  },
  expiryDate: {
    type: Date,
    required: true
  },
  cvvHash: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'blocked', 'expired'],
    default: 'active'
  },
  dailyLimit: {
    type: Number,
    default: 5000
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash CVV before saving
cardSchema.pre('save', async function(next) {
  if (this.isNew && this.cvvHash && !this.cvvHash.startsWith('$2')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.cvvHash = await bcrypt.hash(this.cvvHash, salt);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Method to verify CVV
cardSchema.methods.verifyCVV = async function(cvv) {
  return bcrypt.compare(cvv, this.cvvHash);
};

// Index for efficient queries
cardSchema.index({ accountId: 1 });
cardSchema.index({ cardNumber: 1 });

module.exports = mongoose.model('Card', cardSchema);
