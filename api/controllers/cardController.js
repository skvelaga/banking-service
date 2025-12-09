const Card = require('../models/Card');
const Account = require('../models/Account');
const crypto = require('crypto');

// Generate card number (Luhn-valid)
const generateCardNumber = () => {
  // Generate a 15-digit number starting with 4 (Visa-like)
  let cardNumber = '4';
  for (let i = 0; i < 14; i++) {
    cardNumber += Math.floor(Math.random() * 10);
  }

  // Calculate Luhn check digit
  let sum = 0;
  let isEven = true;
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i]);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return cardNumber + checkDigit;
};

// Generate CVV (3 digits)
const generateCVV = () => {
  return crypto.randomInt(100, 999).toString();
};

// Mask card number for display
const maskCardNumber = (cardNumber) => {
  return '**** **** **** ' + cardNumber.slice(-4);
};

// Create card
exports.createCard = async (req, res) => {
  try {
    const { accountId, cardType, cardHolderName, expiryDate } = req.body;

    // Validate card type
    if (!['debit', 'credit'].includes(cardType)) {
      return res.status(400).json({ message: 'Invalid card type. Must be debit or credit' });
    }

    // Check if account exists and belongs to user
    const account = await Account.findOne({
      _id: accountId,
      userId: req.user.id
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (account.status !== 'active') {
      return res.status(400).json({ message: 'Cannot create card for inactive account' });
    }

    // Generate card details
    const cardNumber = generateCardNumber();
    const cvv = generateCVV();

    // Create card with hashed CVV
    const card = new Card({
      cardNumber,
      cardNumberLast4: cardNumber.slice(-4),
      cardHolderName,
      accountId,
      cardType,
      expiryDate: new Date(expiryDate),
      cvvHash: cvv // Will be hashed by pre-save hook
    });

    await card.save();

    // Return card details (CVV shown only once at creation)
    res.status(201).json({
      message: 'Card created successfully',
      card: {
        id: card._id,
        cardNumber: maskCardNumber(cardNumber),
        fullCardNumber: cardNumber, // Only shown once
        cvv, // Only shown once at creation
        cardHolderName: card.cardHolderName,
        accountId: card.accountId,
        cardType: card.cardType,
        expiryDate: card.expiryDate,
        status: card.status,
        dailyLimit: card.dailyLimit,
        createdAt: card.createdAt
      },
      warning: 'Please save your card number and CVV securely. The CVV will not be shown again.'
    });
  } catch (error) {
    console.error('Card creation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all cards for user
exports.getUserCards = async (req, res) => {
  try {
    // Get account IDs for the user
    const userAccounts = await Account.find({ userId: req.user.id });
    const accountIds = userAccounts.map(account => account._id);

    // Get cards for user's accounts
    const cards = await Card.find({ accountId: { $in: accountIds } });

    // Remove sensitive information and mask card numbers
    const cardsResponse = cards.map(card => ({
      id: card._id,
      cardNumber: maskCardNumber(card.cardNumber),
      last4: card.cardNumberLast4,
      cardHolderName: card.cardHolderName,
      accountId: card.accountId,
      cardType: card.cardType,
      expiryDate: card.expiryDate,
      status: card.status,
      dailyLimit: card.dailyLimit,
      createdAt: card.createdAt
    }));

    res.json({
      message: 'Cards retrieved successfully',
      cards: cardsResponse
    });
  } catch (error) {
    console.error('Get cards error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get card by ID
exports.getCardById = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Check if card belongs to user's account
    const userAccounts = await Account.find({ userId: req.user.id });
    const accountIds = userAccounts.map(account => account._id.toString());

    if (!accountIds.includes(card.accountId.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this card' });
    }

    // Remove sensitive information
    const cardResponse = {
      id: card._id,
      cardNumber: maskCardNumber(card.cardNumber),
      last4: card.cardNumberLast4,
      cardHolderName: card.cardHolderName,
      accountId: card.accountId,
      cardType: card.cardType,
      expiryDate: card.expiryDate,
      status: card.status,
      dailyLimit: card.dailyLimit,
      createdAt: card.createdAt
    };

    res.json({
      message: 'Card retrieved successfully',
      card: cardResponse
    });
  } catch (error) {
    console.error('Get card error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update card
exports.updateCard = async (req, res) => {
  try {
    const { status, dailyLimit } = req.body;

    // Validate status
    if (status && !['active', 'inactive', 'blocked'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Validate daily limit
    if (dailyLimit !== undefined && (dailyLimit < 0 || dailyLimit > 100000)) {
      return res.status(400).json({ message: 'Daily limit must be between 0 and 100000' });
    }

    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Check if card belongs to user's account
    const userAccounts = await Account.find({ userId: req.user.id });
    const accountIds = userAccounts.map(account => account._id.toString());

    if (!accountIds.includes(card.accountId.toString())) {
      return res.status(403).json({ message: 'Not authorized to update this card' });
    }

    // Update card
    if (status) card.status = status;
    if (dailyLimit !== undefined) card.dailyLimit = dailyLimit;
    card.updatedAt = Date.now();

    await card.save();

    // Remove sensitive information
    const cardResponse = {
      id: card._id,
      cardNumber: maskCardNumber(card.cardNumber),
      last4: card.cardNumberLast4,
      cardHolderName: card.cardHolderName,
      accountId: card.accountId,
      cardType: card.cardType,
      expiryDate: card.expiryDate,
      status: card.status,
      dailyLimit: card.dailyLimit,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt
    };

    res.json({
      message: 'Card updated successfully',
      card: cardResponse
    });
  } catch (error) {
    console.error('Update card error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete card
exports.deleteCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Check if card belongs to user's account
    const userAccounts = await Account.find({ userId: req.user.id });
    const accountIds = userAccounts.map(account => account._id.toString());

    if (!accountIds.includes(card.accountId.toString())) {
      return res.status(403).json({ message: 'Not authorized to delete this card' });
    }

    // Delete card
    await Card.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Card deleted successfully'
    });
  } catch (error) {
    console.error('Delete card error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Verify card CVV (for payment processing)
exports.verifyCVV = async (req, res) => {
  try {
    const { cardId, cvv } = req.body;

    const card = await Card.findById(cardId);

    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Check if card belongs to user's account
    const userAccounts = await Account.find({ userId: req.user.id });
    const accountIds = userAccounts.map(account => account._id.toString());

    if (!accountIds.includes(card.accountId.toString())) {
      return res.status(403).json({ message: 'Not authorized to verify this card' });
    }

    const isValid = await card.verifyCVV(cvv);

    res.json({
      message: isValid ? 'CVV verified successfully' : 'Invalid CVV',
      valid: isValid
    });
  } catch (error) {
    console.error('Verify CVV error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
