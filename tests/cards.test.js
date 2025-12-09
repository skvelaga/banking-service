const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../api/server');
const User = require('../api/models/User');
const Account = require('../api/models/Account');
const Card = require('../api/models/Card');

describe('Cards API', () => {
  let authToken;
  let userId;
  let accountId;
  let cardId;

  const testUser = {
    firstName: 'Card',
    lastName: 'Tester',
    email: 'card.tester@example.com',
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

    // Create account for card
    const accountResponse = await request(app)
      .post('/api/accounts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ accountType: 'checking' });

    accountId = accountResponse.body.account._id;
  });

  afterAll(async () => {
    await User.deleteMany({ email: testUser.email });
    await Account.deleteMany({ userId });
    await Card.deleteMany({ accountId });
    await mongoose.connection.close();
  });

  describe('POST /api/cards', () => {
    it('should create a debit card', async () => {
      const response = await request(app)
        .post('/api/cards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          accountId,
          cardType: 'debit',
          cardHolderName: 'Card Tester',
          expiryDate: '2028-12-31'
        })
        .expect(201);

      expect(response.body.message).toBe('Card created successfully');
      expect(response.body.card.cardType).toBe('debit');
      expect(response.body.card.status).toBe('active');
      expect(response.body.card.cvv).toBeDefined();
      expect(response.body.card.fullCardNumber).toBeDefined();
      expect(response.body.warning).toContain('CVV will not be shown again');
      cardId = response.body.card.id;
    });

    it('should create a credit card', async () => {
      const response = await request(app)
        .post('/api/cards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          accountId,
          cardType: 'credit',
          cardHolderName: 'Card Tester',
          expiryDate: '2028-12-31'
        })
        .expect(201);

      expect(response.body.card.cardType).toBe('credit');
    });

    it('should reject invalid card type', async () => {
      const response = await request(app)
        .post('/api/cards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          accountId,
          cardType: 'invalid',
          cardHolderName: 'Card Tester',
          expiryDate: '2028-12-31'
        })
        .expect(400);

      expect(response.body.message).toBe('Invalid card type. Must be debit or credit');
    });

    it('should reject non-existent account', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .post('/api/cards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          accountId: fakeId,
          cardType: 'debit',
          cardHolderName: 'Card Tester',
          expiryDate: '2028-12-31'
        })
        .expect(404);
    });
  });

  describe('GET /api/cards', () => {
    it('should get all user cards', async () => {
      const response = await request(app)
        .get('/api/cards')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Cards retrieved successfully');
      expect(Array.isArray(response.body.cards)).toBe(true);
      expect(response.body.cards.length).toBeGreaterThan(0);
      // CVV should not be returned
      expect(response.body.cards[0].cvv).toBeUndefined();
      expect(response.body.cards[0].cvvHash).toBeUndefined();
    });
  });

  describe('GET /api/cards/:id', () => {
    it('should get card by ID', async () => {
      const response = await request(app)
        .get(`/api/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Card retrieved successfully');
      expect(response.body.card.id).toBe(cardId);
      // Card number should be masked
      expect(response.body.card.cardNumber).toContain('****');
    });

    it('should return 404 for non-existent card', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/cards/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/cards/:id', () => {
    it('should update card status', async () => {
      const response = await request(app)
        .put(`/api/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'inactive' })
        .expect(200);

      expect(response.body.message).toBe('Card updated successfully');
      expect(response.body.card.status).toBe('inactive');
    });

    it('should update daily limit', async () => {
      const response = await request(app)
        .put(`/api/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ dailyLimit: 10000 })
        .expect(200);

      expect(response.body.card.dailyLimit).toBe(10000);
    });

    it('should reject invalid status', async () => {
      await request(app)
        .put(`/api/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'invalid' })
        .expect(400);
    });

    it('should reject invalid daily limit', async () => {
      await request(app)
        .put(`/api/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ dailyLimit: -100 })
        .expect(400);
    });
  });

  describe('DELETE /api/cards/:id', () => {
    it('should delete card', async () => {
      const response = await request(app)
        .delete(`/api/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Card deleted successfully');
    });

    it('should return 404 for deleted card', async () => {
      await request(app)
        .get(`/api/cards/${cardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
