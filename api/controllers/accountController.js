const Account = require('../models/Account');
const User = require('../models/User');

// Generate unique account number
const generateAccountNumber = () => {
  return 'ACC' + Date.now() + Math.floor(Math.random() * 10000);
};

// Create account
exports.createAccount = async (req, res) => {
  try {
    const { accountType, currency } = req.body;
    
    // Validate account type
    if (!['checking', 'savings'].includes(accountType)) {
      return res.status(400).json({ message: 'Invalid account type. Must be checking or savings' });
    }
    
    // Check if user exists
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create account
    const account = new Account({
      accountNumber: generateAccountNumber(),
      accountType,
      userId: req.user.id,
      currency: currency || 'USD'
    });
    
    await account.save();
    
    res.status(201).json({
      message: 'Account created successfully',
      account
    });
  } catch (error) {
    console.error('Account creation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all accounts for user
exports.getUserAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.user.id });
    
    res.json({
      message: 'Accounts retrieved successfully',
      accounts
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get account by ID
exports.getAccountById = async (req, res) => {
  try {
    const account = await Account.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });
    
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    res.json({
      message: 'Account retrieved successfully',
      account
    });
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update account
exports.updateAccount = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    if (status && !['active', 'inactive', 'frozen'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    res.json({
      message: 'Account updated successfully',
      account
    });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: 'closed', updatedAt: Date.now() },
      { new: true }
    );
    
    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    res.json({
      message: 'Account closed successfully',
      account
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};