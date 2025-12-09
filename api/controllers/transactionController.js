const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const crypto = require('crypto');

// Generate unique transaction ID
const generateTransactionId = () => {
  return 'TXN' + Date.now() + crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Transfer money between accounts with proper transaction support
exports.transferMoney = async (req, res) => {
  // Start a session for atomic transactions
  const session = await mongoose.startSession();

  try {
    const { fromAccount, toAccount, amount, description } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }

    if (fromAccount === toAccount) {
      return res.status(400).json({ message: 'Cannot transfer to the same account' });
    }

    // Start transaction
    session.startTransaction();

    // Check if fromAccount exists and belongs to user
    const senderAccount = await Account.findOne({
      accountNumber: fromAccount,
      userId: req.user.id
    }).session(session);

    if (!senderAccount) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Sender account not found' });
    }

    if (senderAccount.status !== 'active') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Sender account is not active' });
    }

    // Check if toAccount exists
    const receiverAccount = await Account.findOne({
      accountNumber: toAccount
    }).session(session);

    if (!receiverAccount) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Receiver account not found' });
    }

    if (receiverAccount.status !== 'active') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Receiver account is not active' });
    }

    // Check if sender has sufficient balance
    if (senderAccount.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Create transaction record
    const transaction = new Transaction({
      transactionId: generateTransactionId(),
      fromAccount,
      toAccount,
      amount,
      description: description || 'Fund transfer',
      transactionType: 'transfer',
      status: 'completed'
    });

    // Update account balances atomically
    await Account.findByIdAndUpdate(
      senderAccount._id,
      {
        $inc: { balance: -amount },
        $set: { updatedAt: Date.now() }
      },
      { session }
    );

    await Account.findByIdAndUpdate(
      receiverAccount._id,
      {
        $inc: { balance: amount },
        $set: { updatedAt: Date.now() }
      },
      { session }
    );

    // Save transaction
    await transaction.save({ session });

    // Commit the transaction
    await session.commitTransaction();

    res.status(201).json({
      message: 'Transfer successful',
      transaction
    });
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    console.error('Transfer error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    session.endSession();
  }
};

// Get transaction history
exports.getTransactionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;

    // Get account numbers for the user
    const userAccounts = await Account.find({ userId: req.user.id });
    const accountNumbers = userAccounts.map(account => account.accountNumber);

    if (accountNumbers.length === 0) {
      return res.json({
        message: 'Transaction history retrieved successfully',
        transactions: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 }
      });
    }

    // Build query
    const query = {
      $or: [
        { fromAccount: { $in: accountNumbers } },
        { toAccount: { $in: accountNumbers } }
      ]
    };

    // Add date filters if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Get total count
    const total = await Transaction.countDocuments(query);

    // Get transactions with pagination
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      message: 'Transaction history retrieved successfully',
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check if transaction involves user's accounts
    const userAccounts = await Account.find({ userId: req.user.id });
    const accountNumbers = userAccounts.map(account => account.accountNumber);

    const isUserTransaction = accountNumbers.includes(transaction.fromAccount) ||
                             accountNumbers.includes(transaction.toAccount);

    if (!isUserTransaction) {
      return res.status(403).json({ message: 'Not authorized to view this transaction' });
    }

    res.json({
      message: 'Transaction retrieved successfully',
      transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Deposit money to account
exports.deposit = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { accountNumber, amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }

    session.startTransaction();

    const account = await Account.findOne({
      accountNumber,
      userId: req.user.id
    }).session(session);

    if (!account) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Account not found' });
    }

    if (account.status !== 'active') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Account is not active' });
    }

    // Create transaction record
    const transaction = new Transaction({
      transactionId: generateTransactionId(),
      fromAccount: 'EXTERNAL',
      toAccount: accountNumber,
      amount,
      description: description || 'Cash deposit',
      transactionType: 'deposit',
      status: 'completed'
    });

    // Update account balance
    await Account.findByIdAndUpdate(
      account._id,
      {
        $inc: { balance: amount },
        $set: { updatedAt: Date.now() }
      },
      { session }
    );

    await transaction.save({ session });
    await session.commitTransaction();

    res.status(201).json({
      message: 'Deposit successful',
      transaction
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Deposit error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    session.endSession();
  }
};

// Withdraw money from account
exports.withdraw = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { accountNumber, amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }

    session.startTransaction();

    const account = await Account.findOne({
      accountNumber,
      userId: req.user.id
    }).session(session);

    if (!account) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Account not found' });
    }

    if (account.status !== 'active') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Account is not active' });
    }

    if (account.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Create transaction record
    const transaction = new Transaction({
      transactionId: generateTransactionId(),
      fromAccount: accountNumber,
      toAccount: 'EXTERNAL',
      amount,
      description: description || 'Cash withdrawal',
      transactionType: 'withdrawal',
      status: 'completed'
    });

    // Update account balance
    await Account.findByIdAndUpdate(
      account._id,
      {
        $inc: { balance: -amount },
        $set: { updatedAt: Date.now() }
      },
      { session }
    );

    await transaction.save({ session });
    await session.commitTransaction();

    res.status(201).json({
      message: 'Withdrawal successful',
      transaction
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Withdrawal error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    session.endSession();
  }
};
