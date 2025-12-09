const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../api/server');
const User = require('../api/models/User');
const Account = require('../api/models/Account');
const Transaction = require('../api/models/Transaction');
const Statement = require('../api/models/Statement');

describe('Statements API', () => {
  let authToken;
  let userId;
  let accountId;
  let accountNumber;
  let statementId;

  const testUser = {
    firstName: 'Statement',
    lastName: 'Tester',
    email: 'statement.tester@example.com',
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

    // Create account
    const accountResponse = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ accountType: 'checking' });

    accountId = accountResponse.body.account._id;
    accountNumber = accountResponse.body.account.accountNumber;

    // Add some transactions
    await Account.findByIdAndUpdate(accountId, { balance: 1000 });

    await request(app)
      .post('/api/transactions/deposit')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        accountNumber,
        amount: 500,
        description: 'Initial deposit'
      });
  });

  afterAll(async () => {
    await User.deleteMany({ email: testUser.email });
    await Account.deleteMany({ userId });
    await Transaction.deleteMany({ toAccount: accountNumber });
    await Statement.deleteMany({ accountId });
    await mongoose.connection.close();
  });

  describe('POST /api/statements', () => {
    it('should generate a statement', async () => {
      const response = await request(app)
        .post('/api/statements')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          accountId,
          startDate: '2020-01-01',
          endDate: new Date().toISOString()
        })
        .expect(201);

      expect(response.body.message).toBe('Statement generated successfully');
      expect(response.body.statement.accountNumber).toBe(accountNumber);
      expect(response.body.statement.statementId).toBeDefined();
      statementId = response.body.statement._id;
    });

    it('should reject invalid date range', async () => {
      const response = await request(app)
        .post('/api/statements')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          accountId,
          startDate: '2024-12-31',
          endDate: '2024-01-01'
        })
        .expect(400);

      expect(response.body.message).toBe('Start date must be before end date');
    });

    it('should reject non-existent account', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .post('/api/statements')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          accountId: fakeId,
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        })
        .expect(404);
    });
  });

  describe('GET /api/statements', () => {
    it('should get all user statements', async () => {
      const response = await request(app)
        .get('/api/statements')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Statements retrieved successfully');
      expect(Array.isArray(response.body.statements)).toBe(true);
    });
  });

  describe('GET /api/statements/:id', () => {
    it('should get statement by ID', async () => {
      const response = await request(app)
        .get(`/api/statements/${statementId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Statement retrieved successfully');
      expect(response.body.statement._id).toBe(statementId);
    });

    it('should return 404 for non-existent statement', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/statements/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/statements/account/:accountId', () => {
    it('should get statements by account', async () => {
      const response = await request(app)
        .get(`/api/statements/account/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Statements retrieved successfully');
      expect(Array.isArray(response.body.statements)).toBe(true);
    });
  });
});
