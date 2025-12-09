const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');
const transactionRoutes = require('./routes/transactions');
const cardRoutes = require('./routes/cards');
const statementRoutes = require('./routes/statements');

// Import middleware
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10kb' })); // Limit body size for security
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/statements', statementRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Banking Service API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      accounts: '/api/accounts',
      transactions: '/api/transactions',
      cards: '/api/cards',
      statements: '/api/statements'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);

  // Don't leak error details in production
  const isDev = process.env.NODE_ENV === 'development';

  res.status(err.status || 500).json({
    message: isDev ? err.message : 'Something went wrong!',
    ...(isDev && { stack: err.stack })
  });
});

// 404 handler
app.use('/{*splat}', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/banking';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start the server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

// Export for testing
module.exports = app;
