const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../api/server');
const User = require('../api/models/User');
const Account = require('../api/models/Account');
const Transaction = require('../api/models/Transaction');

describe('Transactions API', () => {
  let authToken;
  let userId;
  let senderAccount;
  let receiverAccount;

  const testUser = {
    firstName: 'Transaction',
    lastName: 'Tester',
    email: 'transaction.tester@example.com',
    password: 'password123',
    dateOfBirth: '1990-01-01',
    phoneNumber: '+1234567890',
    address: {
      street: '123 Test St',
      city: 'Testville',
      state: 'TS',
      zipCode: '12345',
      country: 'USA'
    }
  };

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/banking_test');

    // Register and get token
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    authToken = response.body.token;
    userId = response.body.user.id;

    // Create sender account
    const senderResponse = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ accountType: 'checking' });

    senderAccount = senderResponse.body.account;

    // Create receiver account
    const receiverResponse = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ accountType: 'savings' });

    receiverAccount = receiverResponse.body.account;

    // Add initial balance to sender account
    await Account.findByIdAndUpdate(senderAccount._id, { balance: 1000 });
  });

  afterAll(async () => {
    await User.deleteMany({ email: testUser.email });
    await Account.deleteMany({ userId });
    await Transaction.deleteMany({
      $or: [
        { fromAccount: senderAccount?.accountNumber },
        { toAccount: receiverAccount?.accountNumber }
      ]
    });
    await mongoose.connection.close();
  });

  describe('POST /api/transactions/deposit', () => {
    it('should deposit money to account', async () => {
      const response = await request(app)
        .post('/api/transactions/deposit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          accountNumber: receiverAccount.accountNumber,
          amount: 500,
          description: 'Test deposit'
        })
        .expect(201);

      expect(response.body.message).toBe('Deposit successful');
      expect(response.body.transaction.amount).toBe(500);
      expect(response.body.transaction.transactionType).toBe('deposit');
    });

    it('should reject zero amount', async () => {
      await request(app)
        .post('/api/transactions/deposit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          accountNumber: receiverAccount.accountNumber,
          amount: 0
        })
        .expect(400);
    });

    it('should reject negative amount', async () => {
      await request(app)
        .post('/api/transactions/deposit')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          accountNumber: receiverAccount.accountNumber,
          amount: -100
        })
        .expect(400);
    });
  });

  describe('POST /api/transactions/transfer', () => {
    it('should transfer money between accounts', async () => {
      const response = await request(app)
        .post('/api/transactions/transfer')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fromAccount: senderAccount.accountNumber,
          toAccount: receiverAccount.accountNumber,
          amount: 100,
          description: 'Test transfer'
        })
        .expect(201);

      expect(response.body.message).toBe('Transfer successful');
      expect(response.body.transaction.amount).toBe(100);
      expect(response.body.transaction.transactionType).toBe('transfer');
    });

    it('should reject insufficient balance', async () => {
      const response = await request(app)
        .post('/api/transactions/transfer')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fromAccount: senderAccount.accountNumber,
          toAccount: receiverAccount.accountNumber,
          amount: 1000000
        })
        .expect(400);

      expect(response.body.message).toBe('Insufficient balance');
    });

    it('should reject transfer to same account', async () => {
      const response = await request(app)
        .post('/api/transactions/transfer')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fromAccount: senderAccount.accountNumber,
          toAccount: senderAccount.accountNumber,
          amount: 100
        })
        .expect(400);

      expect(response.body.message).toBe('Cannot transfer to the same account');
    });

    it('should reject non-existent sender account', async () => {
      const response = await request(app)
        .post('/api/transactions/transfer')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fromAccount: 'INVALID123',
          toAccount: receiverAccount.accountNumber,
          amount: 100
        })
        .expect(404);

      expect(response.body.message).toBe('Sender account not found');
    });

    it('should reject non-existent receiver account', async () => {
      const response = await request(app)
        .post('/api/transactions/transfer')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fromAccount: senderAccount.accountNumber,
          toAccount: 'INVALID123',
          amount: 100
        })
        .expect(404);

      expect(response.body.message).toBe('Receiver account not found');
    });
  });

  describe('POST /api/transactions/withdraw', () => {
    it('should withdraw money from account', async () => {
      const response = await request(app)
        .post('/api/transactions/withdraw')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          accountNumber: senderAccount.accountNumber,
          amount: 50,
          description: 'Test withdrawal'
        })
        .expect(201);

      expect(response.body.message).toBe('Withdrawal successful');
      expect(response.body.transaction.amount).toBe(50);
      expect(response.body.transaction.transactionType).toBe('withdrawal');
    });

    it('should reject insufficient balance withdrawal', async () => {
      await request(app)
        .post('/api/transactions/withdraw')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          accountNumber: senderAccount.accountNumber,
          amount: 1000000
        })
        .expect(400);
    });
  });

  describe('GET /api/transactions/history', () => {
    it('should get transaction history', async () => {
      const response = await request(app)
        .get('/api/transactions/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Transaction history retrieved successfully');
      expect(Array.isArray(response.body.transactions)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/transactions/history?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.pagination.limit).toBe(5);
    });
  });
});
