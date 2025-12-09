/**
 * Demo Client Application
 *
 * This is a comprehensive client application that demonstrates how to interact
 * with the banking service API including all features:
 * - User authentication
 * - Account management
 * - Transactions (transfers, deposits, withdrawals)
 * - Card management
 * - Statement generation
 */

const axios = require('axios');

// API base URL
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

// Demo user credentials
const demoUser = {
  firstName: 'John',
  lastName: 'Doe',
  email: `demo.user.${Date.now()}@example.com`, // Unique email for each run
  password: 'securePassword123',
  dateOfBirth: '1990-01-01',
  phoneNumber: '+1234567890',
  address: {
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345',
    country: 'USA'
  }
};

// Global variables to store auth token and account info
let authToken = null;
let userId = null;
let checkingAccount = null;
let savingsAccount = null;
let cardId = null;

// Axios instance with base URL
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

// Request interceptor to add auth token to requests
apiClient.interceptors.request.use(config => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.error(`API Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
    } else {
      console.error(`Network Error: ${error.message}`);
    }
    throw error;
  }
);

/**
 * Register a new user
 */
async function registerUser() {
  console.log('\n=== REGISTERING USER ===');
  const response = await apiClient.post('/auth/register', demoUser);
  authToken = response.data.token;
  userId = response.data.user.id;
  console.log('User registered successfully!');
  console.log(`User ID: ${userId}`);
  console.log(`Email: ${demoUser.email}`);
  return response.data;
}

/**
 * Login existing user
 */
async function loginUser() {
  console.log('\n=== LOGGING IN ===');
  const response = await apiClient.post('/auth/login', {
    email: demoUser.email,
    password: demoUser.password
  });
  authToken = response.data.token;
  userId = response.data.user.id;
  console.log('Login successful!');
  return response.data;
}

/**
 * Get user profile
 */
async function getUserProfile() {
  console.log('\n=== FETCHING USER PROFILE ===');
  const response = await apiClient.get('/auth/profile');
  console.log('Profile retrieved:');
  console.log(`  Name: ${response.data.firstName} ${response.data.lastName}`);
  console.log(`  Email: ${response.data.email}`);
  console.log(`  Phone: ${response.data.phoneNumber}`);
  return response.data;
}

/**
 * Create bank accounts
 */
async function createAccounts() {
  console.log('\n=== CREATING BANK ACCOUNTS ===');

  // Create checking account
  const checkingResponse = await apiClient.post('/accounts', {
    accountType: 'checking',
    currency: 'USD'
  });
  checkingAccount = checkingResponse.data.account;
  console.log(`Checking account created: ${checkingAccount.accountNumber}`);

  // Create savings account
  const savingsResponse = await apiClient.post('/accounts', {
    accountType: 'savings',
    currency: 'USD'
  });
  savingsAccount = savingsResponse.data.account;
  console.log(`Savings account created: ${savingsAccount.accountNumber}`);

  return { checkingAccount, savingsAccount };
}

/**
 * Get all user accounts
 */
async function getUserAccounts() {
  console.log('\n=== FETCHING USER ACCOUNTS ===');
  const response = await apiClient.get('/accounts');
  console.log(`Found ${response.data.accounts.length} accounts:`);
  response.data.accounts.forEach(acc => {
    console.log(`  - ${acc.accountNumber} (${acc.accountType}): $${acc.balance} ${acc.currency}`);
  });
  return response.data;
}

/**
 * Deposit money to account
 */
async function depositMoney(accountNumber, amount) {
  console.log(`\n=== DEPOSITING $${amount} ===`);
  const response = await apiClient.post('/transactions/deposit', {
    accountNumber,
    amount,
    description: 'Demo deposit'
  });
  console.log(`Deposit successful! Transaction ID: ${response.data.transaction.transactionId}`);
  return response.data;
}

/**
 * Transfer money between accounts
 */
async function transferMoney(fromAccount, toAccount, amount) {
  console.log(`\n=== TRANSFERRING $${amount} ===`);
  const response = await apiClient.post('/transactions/transfer', {
    fromAccount,
    toAccount,
    amount,
    description: 'Demo transfer'
  });
  console.log(`Transfer successful! Transaction ID: ${response.data.transaction.transactionId}`);
  return response.data;
}

/**
 * Withdraw money from account
 */
async function withdrawMoney(accountNumber, amount) {
  console.log(`\n=== WITHDRAWING $${amount} ===`);
  const response = await apiClient.post('/transactions/withdraw', {
    accountNumber,
    amount,
    description: 'Demo withdrawal'
  });
  console.log(`Withdrawal successful! Transaction ID: ${response.data.transaction.transactionId}`);
  return response.data;
}

/**
 * Get transaction history
 */
async function getTransactionHistory() {
  console.log('\n=== FETCHING TRANSACTION HISTORY ===');
  const response = await apiClient.get('/transactions/history');
  console.log(`Found ${response.data.transactions.length} transactions:`);
  response.data.transactions.forEach(txn => {
    console.log(`  - ${txn.transactionId}: ${txn.transactionType} $${txn.amount} (${txn.status})`);
  });
  return response.data;
}

/**
 * Create a debit card
 */
async function createCard() {
  console.log('\n=== CREATING DEBIT CARD ===');
  const response = await apiClient.post('/cards', {
    accountId: checkingAccount._id,
    cardType: 'debit',
    cardHolderName: `${demoUser.firstName} ${demoUser.lastName}`.toUpperCase(),
    expiryDate: '2028-12-31'
  });
  cardId = response.data.card.id;
  console.log('Card created successfully!');
  console.log(`  Card Number: ${response.data.card.fullCardNumber}`);
  console.log(`  CVV: ${response.data.card.cvv}`);
  console.log(`  Expiry: ${response.data.card.expiryDate}`);
  console.log(`  WARNING: ${response.data.warning}`);
  return response.data;
}

/**
 * Get all user cards
 */
async function getUserCards() {
  console.log('\n=== FETCHING USER CARDS ===');
  const response = await apiClient.get('/cards');
  console.log(`Found ${response.data.cards.length} cards:`);
  response.data.cards.forEach(card => {
    console.log(`  - ${card.cardNumber} (${card.cardType}) - Status: ${card.status}`);
  });
  return response.data;
}

/**
 * Update card daily limit
 */
async function updateCardLimit(newLimit) {
  console.log(`\n=== UPDATING CARD LIMIT TO $${newLimit} ===`);
  const response = await apiClient.put(`/cards/${cardId}`, {
    dailyLimit: newLimit
  });
  console.log(`Card limit updated to $${response.data.card.dailyLimit}`);
  return response.data;
}

/**
 * Generate account statement
 */
async function generateStatement() {
  console.log('\n=== GENERATING ACCOUNT STATEMENT ===');
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);

  const response = await apiClient.post('/statements', {
    accountId: checkingAccount._id,
    startDate: startDate.toISOString(),
    endDate: new Date().toISOString()
  });

  console.log('Statement generated successfully!');
  console.log(`  Statement ID: ${response.data.statement.statementId}`);
  console.log(`  Period: ${response.data.statement.startDate} to ${response.data.statement.endDate}`);
  console.log(`  Opening Balance: $${response.data.statement.openingBalance}`);
  console.log(`  Closing Balance: $${response.data.statement.closingBalance}`);
  console.log(`  Total Credits: $${response.data.statement.totalCredits}`);
  console.log(`  Total Debits: $${response.data.statement.totalDebits}`);
  console.log(`  Transactions: ${response.data.statement.transactionCount}`);
  return response.data;
}

/**
 * Get all statements
 */
async function getStatements() {
  console.log('\n=== FETCHING STATEMENTS ===');
  const response = await apiClient.get('/statements');
  console.log(`Found ${response.data.statements.length} statements`);
  return response.data;
}

/**
 * Display final account balances
 */
async function displayFinalBalances() {
  console.log('\n=== FINAL ACCOUNT BALANCES ===');
  const response = await apiClient.get('/accounts');
  response.data.accounts.forEach(acc => {
    console.log(`  ${acc.accountType.toUpperCase()}: $${acc.balance}`);
  });
}

/**
 * Main demo function
 */
async function runDemo() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           BANKING SERVICE API DEMO                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    // 1. User Registration & Authentication
    await registerUser();
    await getUserProfile();

    // 2. Account Management
    await createAccounts();
    await getUserAccounts();

    // 3. Transactions
    await depositMoney(checkingAccount.accountNumber, 1000);
    await depositMoney(savingsAccount.accountNumber, 500);
    await transferMoney(checkingAccount.accountNumber, savingsAccount.accountNumber, 200);
    await withdrawMoney(checkingAccount.accountNumber, 100);
    await getTransactionHistory();

    // 4. Card Management
    await createCard();
    await getUserCards();
    await updateCardLimit(10000);

    // 5. Statements
    await generateStatement();
    await getStatements();

    // 6. Final Summary
    await displayFinalBalances();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           DEMO COMPLETED SUCCESSFULLY!                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

  } catch (error) {
    console.error('\n❌ Demo failed:', error.message);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  runDemo();
}

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  createAccounts,
  getUserAccounts,
  depositMoney,
  transferMoney,
  withdrawMoney,
  getTransactionHistory,
  createCard,
  getUserCards,
  updateCardLimit,
  generateStatement,
  getStatements,
  runDemo
};
