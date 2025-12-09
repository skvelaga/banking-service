const Statement = require('../models/Statement');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const crypto = require('crypto');

// Generate unique statement ID
const generateStatementId = () => {
  return 'STMT' + Date.now() + crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Generate statement for an account
exports.generateStatement = async (req, res) => {
  try {
    const { accountId, startDate, endDate } = req.body;

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    if (start >= end) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }

    // Check if account exists and belongs to user
    const account = await Account.findOne({
      _id: accountId,
      userId: req.user.id
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // Get transactions for the period
    const transactions = await Transaction.find({
      $or: [
        { fromAccount: account.accountNumber },
        { toAccount: account.accountNumber }
      ],
      createdAt: { $gte: start, $lte: end },
      status: 'completed'
    }).sort({ createdAt: 1 });

    // Calculate statement data
    let totalCredits = 0;
    let totalDebits = 0;
    let runningBalance = account.balance;

    // Calculate backwards to get opening balance
    const reversedTransactions = [...transactions].reverse();
    for (const txn of reversedTransactions) {
      if (txn.toAccount === account.accountNumber) {
        runningBalance -= txn.amount;
      } else if (txn.fromAccount === account.accountNumber) {
        runningBalance += txn.amount;
      }
    }

    const openingBalance = runningBalance;

    // Build transaction list with running balance
    const statementTransactions = [];
    runningBalance = openingBalance;

    for (const txn of transactions) {
      let amount = txn.amount;
      let type = 'credit';

      if (txn.fromAccount === account.accountNumber) {
        type = 'debit';
        totalDebits += amount;
        runningBalance -= amount;
      } else {
        totalCredits += amount;
        runningBalance += amount;
      }

      statementTransactions.push({
        transactionId: txn.transactionId,
        date: txn.createdAt,
        description: txn.description || `${txn.transactionType} - ${type === 'credit' ? 'From' : 'To'} ${type === 'credit' ? txn.fromAccount : txn.toAccount}`,
        type,
        amount,
        balance: runningBalance
      });
    }

    // Create statement
    const statement = new Statement({
      statementId: generateStatementId(),
      accountId: account._id,
      accountNumber: account.accountNumber,
      startDate: start,
      endDate: end,
      openingBalance,
      closingBalance: account.balance,
      totalCredits,
      totalDebits,
      transactionCount: transactions.length,
      transactions: statementTransactions,
      currency: account.currency
    });

    await statement.save();

    res.status(201).json({
      message: 'Statement generated successfully',
      statement
    });
  } catch (error) {
    console.error('Generate statement error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all statements for user
exports.getUserStatements = async (req, res) => {
  try {
    // Get account IDs for the user
    const userAccounts = await Account.find({ userId: req.user.id });
    const accountIds = userAccounts.map(account => account._id);

    // Get statements for user's accounts
    const statements = await Statement.find({
      accountId: { $in: accountIds }
    }).sort({ generatedAt: -1 });

    res.json({
      message: 'Statements retrieved successfully',
      statements
    });
  } catch (error) {
    console.error('Get statements error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get statement by ID
exports.getStatementById = async (req, res) => {
  try {
    const statement = await Statement.findById(req.params.id);

    if (!statement) {
      return res.status(404).json({ message: 'Statement not found' });
    }

    // Check if statement belongs to user's account
    const userAccounts = await Account.find({ userId: req.user.id });
    const accountIds = userAccounts.map(account => account._id.toString());

    if (!accountIds.includes(statement.accountId.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this statement' });
    }

    res.json({
      message: 'Statement retrieved successfully',
      statement
    });
  } catch (error) {
    console.error('Get statement error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get statements by account
exports.getStatementsByAccount = async (req, res) => {
  try {
    const { accountId } = req.params;

    // Check if account belongs to user
    const account = await Account.findOne({
      _id: accountId,
      userId: req.user.id
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const statements = await Statement.find({
      accountId
    }).sort({ generatedAt: -1 });

    res.json({
      message: 'Statements retrieved successfully',
      statements
    });
  } catch (error) {
    console.error('Get statements by account error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
