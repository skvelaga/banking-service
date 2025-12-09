const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../api/server');
const User = require('../api/models/User');
const Account = require('../api/models/Account');

describe('Accounts API', () => {
  let authToken;
  let userId;
  let accountId;

  const testUser = {
    firstName: 'Account',
    lastName: 'Tester',
    email: 'account.tester@example.com',
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
  });

  afterAll(async () => {
    await User.deleteMany({ email: testUser.email });
    await Account.deleteMany({ userId });
    await mongoose.connection.close();
  });

  describe('POST /api/accounts', () => {
    it('should create a checking account', async () => {
      const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ accountType: 'checking', currency: 'USD' })
        .expect(201);

      expect(response.body.message).toBe('Account created successfully');
      expect(response.body.account.accountType).toBe('checking');
      expect(response.body.account.balance).toBe(0);
      expect(response.body.account.status).toBe('active');
      accountId = response.body.account._id;
    });

    it('should create a savings account', async () => {
      const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ accountType: 'savings' })
        .expect(201);

      expect(response.body.account.accountType).toBe('savings');
    });

    it('should reject invalid account type', async () => {
      const response = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ accountType: 'invalid' })
        .expect(400);

      expect(response.body.message).toBe('Invalid account type. Must be checking or savings');
    });

    it('should reject unauthenticated requests', async () => {
      await request(app)
        .post('/api/accounts')
        .send({ accountType: 'checking' })
        .expect(401);
    });
  });

  describe('GET /api/accounts', () => {
    it('should get all user accounts', async () => {
      const response = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Accounts retrieved successfully');
      expect(Array.isArray(response.body.accounts)).toBe(true);
      expect(response.body.accounts.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/accounts/:id', () => {
    it('should get account by ID', async () => {
      const response = await request(app)
        .get(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Account retrieved successfully');
      expect(response.body.account._id).toBe(accountId);
    });

    it('should return 404 for non-existent account', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/accounts/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/accounts/:id', () => {
    it('should update account status', async () => {
      const response = await request(app)
        .put(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'inactive' })
        .expect(200);

      expect(response.body.message).toBe('Account updated successfully');
      expect(response.body.account.status).toBe('inactive');
    });

    it('should reject invalid status', async () => {
      await request(app)
        .put(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'invalid' })
        .expect(400);
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    it('should close account', async () => {
      const response = await request(app)
        .delete(`/api/accounts/${accountId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Account closed successfully');
      expect(response.body.account.status).toBe('closed');
    });
  });
});
