# Banking Service Solution

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup Instructions](#setup-instructions)
4. [API Documentation](#api-documentation)
5. [Database Design](#database-design)
6. [Infrastructure Design](#infrastructure-design)
7. [Security Considerations](#security-considerations)

> **Note:** For detailed AI usage report, see [AI_USAGE.md](AI_USAGE.md)

---

## Overview

This solution implements a RESTful banking service with core functionalities including user authentication, account management, transactions, card services, and statement generation. The implementation follows modern software development practices with a focus on security, scalability, and maintainability.

### Technology Stack

| Component | Technology | Justification |
|-----------|------------|---------------|
| Runtime | Node.js | Fast, event-driven, excellent for I/O-bound operations |
| Framework | Express.js | Lightweight, widely adopted, extensive middleware ecosystem |
| Database | MongoDB | Flexible schema, excellent for financial documents, horizontal scaling |
| ODM | Mongoose | Type validation, schema enforcement, middleware support |
| Authentication | JWT | Stateless, scalable, industry standard |
| Password Hashing | bcrypt | Secure, battle-tested, adaptive cost factor |
| Infrastructure | Terraform | Declarative, version-controlled, multi-cloud support |

### Key Features

- **User Authentication**: Registration, login with JWT tokens, profile management
- **Account Management**: Checking/savings accounts, status management
- **Transactions**: Transfers, deposits, withdrawals with ACID compliance
- **Card Services**: Debit/credit cards with secure CVV hashing
- **Statements**: Automated statement generation with transaction history
- **Rate Limiting**: Protection against brute force and DDoS attacks

---

## Architecture

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT APPLICATIONS                             │
│                    (Web Browsers, Mobile Apps, APIs)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY / LOAD BALANCER                         │
│              (SSL Termination, Rate Limiting, Request Routing)              │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BANKING SERVICE API                               │
│                        (Node.js / Express.js)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │    Auth     │  │   Account   │  │ Transaction │  │    Card     │       │
│  │  Service    │  │   Service   │  │   Service   │  │   Service   │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                             │
│  ┌─────────────┐  ┌─────────────────────────────────────────────────┐      │
│  │  Statement  │  │              MIDDLEWARE LAYER                    │      │
│  │   Service   │  │  (Auth, Rate Limiting, Validation, Logging)     │      │
│  └─────────────┘  └─────────────────────────────────────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            MONGODB DATABASE                                  │
│                                                                              │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│   │  Users   │  │ Accounts │  │   Txns   │  │  Cards   │  │  Stmts   │    │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AWS INFRASTRUCTURE                                   │
│                         (Terraform Managed)                                  │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────┐     │
│   │                          VPC                                      │     │
│   │  ┌─────────────────────┐    ┌─────────────────────┐             │     │
│   │  │   Public Subnet     │    │   Private Subnet    │             │     │
│   │  │   (App Servers)     │    │   (Database)        │             │     │
│   │  └─────────────────────┘    └─────────────────────┘             │     │
│   └──────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Descriptions

#### Authentication Service
- User registration with secure password hashing (bcrypt)
- JWT token generation with configurable expiration
- Protected route middleware for authorization

#### Account Management Service
- Account creation (checking/savings)
- Account status management (active, inactive, frozen, closed)
- Balance tracking and retrieval

#### Transaction Service
- Money transfers with MongoDB sessions (ACID compliance)
- Deposit and withdrawal operations
- Transaction history with pagination
- Date range filtering

#### Card Service
- Card issuance (debit/credit)
- Secure CVV storage (hashed with bcrypt)
- Card status and limit management
- Luhn-valid card number generation

#### Statement Service
- On-demand statement generation
- Transaction aggregation
- Balance calculations (opening/closing)

---

## Setup Instructions

### Prerequisites

- Node.js v14 or higher
- MongoDB v4.4 or higher (local or cloud instance)
- npm or yarn
- Terraform v1.0+ (for infrastructure deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd banking-service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/banking
   JWT_SECRET=your_secure_jwt_secret_key_here
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start MongoDB**
   ```bash
   # Local MongoDB
   mongod --dbpath /path/to/data

   # Or use Docker
   docker run -d -p 27017:27017 mongo:latest
   ```

5. **Run the application**
   ```bash
   # Development mode with hot reload
   npm run dev

   # Production mode
   npm start
   ```

6. **Run tests**
   ```bash
   npm test
   ```

### Infrastructure Deployment

1. **Navigate to infrastructure directory**
   ```bash
   cd infrastructure
   ```

2. **Initialize Terraform**
   ```bash
   terraform init
   ```

3. **Review the execution plan**
   ```bash
   terraform plan
   ```

4. **Apply the configuration**
   ```bash
   terraform apply
   ```

---

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

### Auth Endpoints

#### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "dateOfBirth": "1990-01-01",
  "phoneNumber": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zipCode": "12345",
    "country": "USA"
  }
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  }
}
```

#### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  }
}
```

#### Get Profile
```http
GET /auth/profile
Authorization: Bearer <token>
```

---

### Account Endpoints

#### Create Account
```http
POST /accounts
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "accountType": "checking", // or "savings"
  "currency": "USD"
}
```

#### Get All Accounts
```http
GET /accounts
Authorization: Bearer <token>
```

#### Get Account by ID
```http
GET /accounts/:id
Authorization: Bearer <token>
```

#### Update Account
```http
PUT /accounts/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "active" // active, inactive, frozen
}
```

#### Close Account
```http
DELETE /accounts/:id
Authorization: Bearer <token>
```

---

### Transaction Endpoints

#### Transfer Money
```http
POST /transactions/transfer
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "fromAccount": "ACC1234567890",
  "toAccount": "ACC0987654321",
  "amount": 100.00,
  "description": "Payment for services"
}
```

#### Deposit
```http
POST /transactions/deposit
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "accountNumber": "ACC1234567890",
  "amount": 500.00,
  "description": "Cash deposit"
}
```

#### Withdraw
```http
POST /transactions/withdraw
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "accountNumber": "ACC1234567890",
  "amount": 100.00,
  "description": "ATM withdrawal"
}
```

#### Get Transaction History
```http
GET /transactions/history?page=1&limit=20&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

#### Get Transaction by ID
```http
GET /transactions/:id
Authorization: Bearer <token>
```

---

### Card Endpoints

#### Create Card
```http
POST /cards
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "accountId": "account_id",
  "cardType": "debit", // or "credit"
  "cardHolderName": "JOHN DOE",
  "expiryDate": "2028-12-31"
}
```

**Response (201):**
```json
{
  "message": "Card created successfully",
  "card": {
    "id": "card_id",
    "cardNumber": "**** **** **** 1234",
    "fullCardNumber": "4123456789012345",
    "cvv": "123",
    "cardHolderName": "JOHN DOE",
    "cardType": "debit",
    "expiryDate": "2028-12-31",
    "status": "active",
    "dailyLimit": 5000
  },
  "warning": "Please save your card number and CVV securely. The CVV will not be shown again."
}
```

#### Get All Cards
```http
GET /cards
Authorization: Bearer <token>
```

#### Get Card by ID
```http
GET /cards/:id
Authorization: Bearer <token>
```

#### Update Card
```http
PUT /cards/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "inactive", // active, inactive, blocked
  "dailyLimit": 10000
}
```

#### Delete Card
```http
DELETE /cards/:id
Authorization: Bearer <token>
```

---

### Statement Endpoints

#### Generate Statement
```http
POST /statements
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "accountId": "account_id",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

#### Get All Statements
```http
GET /statements
Authorization: Bearer <token>
```

#### Get Statement by ID
```http
GET /statements/:id
Authorization: Bearer <token>
```

#### Get Statements by Account
```http
GET /statements/account/:accountId
Authorization: Bearer <token>
```

---

## Database Design

### Collections Schema

#### Users Collection
```javascript
{
  _id: ObjectId,
  firstName: String (required),
  lastName: String (required),
  email: String (required, unique, indexed),
  password: String (required, hashed),
  dateOfBirth: Date (required),
  phoneNumber: String (required),
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Accounts Collection
```javascript
{
  _id: ObjectId,
  accountNumber: String (required, unique, indexed),
  accountType: String (enum: ['checking', 'savings', 'credit']),
  userId: ObjectId (ref: 'User', indexed),
  balance: Number (default: 0),
  currency: String (default: 'USD'),
  status: String (enum: ['active', 'inactive', 'frozen', 'closed']),
  createdAt: Date,
  updatedAt: Date
}
```

#### Transactions Collection
```javascript
{
  _id: ObjectId,
  transactionId: String (required, unique, indexed),
  fromAccount: String (indexed),
  toAccount: String (indexed),
  amount: Number (required),
  currency: String (default: 'USD'),
  transactionType: String (enum: ['transfer', 'deposit', 'withdrawal', 'payment']),
  status: String (enum: ['pending', 'completed', 'failed', 'cancelled']),
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Cards Collection
```javascript
{
  _id: ObjectId,
  cardNumber: String (required, unique, indexed),
  cardNumberLast4: String (required),
  cardHolderName: String (required),
  accountId: ObjectId (ref: 'Account', indexed),
  cardType: String (enum: ['debit', 'credit']),
  expiryDate: Date (required),
  cvvHash: String (required, hashed),
  status: String (enum: ['active', 'inactive', 'blocked', 'expired']),
  dailyLimit: Number (default: 5000),
  createdAt: Date,
  updatedAt: Date
}
```

#### Statements Collection
```javascript
{
  _id: ObjectId,
  statementId: String (required, unique, indexed),
  accountId: ObjectId (ref: 'Account', indexed),
  accountNumber: String,
  startDate: Date,
  endDate: Date,
  openingBalance: Number,
  closingBalance: Number,
  totalCredits: Number,
  totalDebits: Number,
  transactionCount: Number,
  transactions: [{
    transactionId: String,
    date: Date,
    description: String,
    type: String,
    amount: Number,
    balance: Number
  }],
  currency: String,
  generatedAt: Date,
  createdAt: Date
}
```

### Indexes

| Collection | Index | Type | Purpose |
|------------|-------|------|---------|
| Users | email | Unique | Fast lookup, prevent duplicates |
| Accounts | accountNumber | Unique | Fast lookup, prevent duplicates |
| Accounts | userId | Standard | User's accounts lookup |
| Transactions | transactionId | Unique | Transaction lookup |
| Transactions | fromAccount | Standard | Sender history |
| Transactions | toAccount | Standard | Receiver history |
| Cards | cardNumber | Unique | Card lookup |
| Cards | accountId | Standard | Account's cards |
| Statements | statementId | Unique | Statement lookup |
| Statements | accountId, startDate | Compound | Account statement history |

---

## Infrastructure Design

### AWS Architecture

The infrastructure is defined using Terraform and includes:

#### Network Layer
- **VPC**: Isolated network environment (CIDR: 10.0.0.0/16)
- **Public Subnet**: Application servers (10.0.1.0/24)
- **Private Subnet**: Database servers (10.0.2.0/24)
- **Internet Gateway**: Public internet access
- **Route Tables**: Traffic routing configuration

#### Security Layer
- **Application Security Group**:
  - Inbound: HTTP (80), HTTPS (443), SSH (22 - restricted)
  - Outbound: All traffic
- **Database Security Group**:
  - Inbound: MongoDB (27017) from app security group only
  - Outbound: All traffic

### Terraform Resources

```hcl
# VPC
aws_vpc.banking_vpc

# Subnets
aws_subnet.public_subnet
aws_subnet.private_subnet

# Networking
aws_internet_gateway.banking_igw
aws_route_table.public_rt
aws_route_table_association.public_rta

# Security
aws_security_group.app_sg
aws_security_group.db_sg
```

### Deployment Commands

```bash
cd infrastructure
terraform init
terraform plan
terraform apply
```

---

## Security Considerations

### Authentication & Authorization
- **Password Hashing**: bcrypt with salt rounds (10)
- **JWT Tokens**: 7-day expiration, secure secret
- **Protected Routes**: Middleware validation on all sensitive endpoints

### Data Security
- **CVV Hashing**: Card CVV stored as bcrypt hash, never in plain text
- **Card Masking**: Full card numbers never returned after creation
- **Input Validation**: Mongoose schema validation on all inputs
- **Body Size Limits**: 10KB max request body to prevent DoS

### Rate Limiting
| Endpoint | Window | Max Requests | Purpose |
|----------|--------|--------------|---------|
| General | 1 min | 100 | Overall API protection |
| Auth | 15 min | 10 | Brute force prevention |
| Transactions | 1 min | 30 | Financial abuse prevention |
| Sensitive | 1 hour | 10 | Card creation limits |

### Network Security
- **CORS**: Configurable allowed origins
- **Helmet**: Security headers (XSS, CSRF, etc.)
- **Private Subnet**: Database not publicly accessible
- **Security Groups**: Least privilege access

### Best Practices Implemented
1. No secrets in code (environment variables)
2. Generic error messages (no stack traces in production)
3. HTTPS enforcement (via load balancer)
4. Audit logging (Morgan middleware)
5. Transaction atomicity (MongoDB sessions)

---

## Project Structure

```
banking-service/
├── api/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── accountController.js
│   │   ├── transactionController.js
│   │   ├── cardController.js
│   │   └── statementController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Account.js
│   │   ├── Transaction.js
│   │   ├── Card.js
│   │   └── Statement.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── accounts.js
│   │   ├── transactions.js
│   │   ├── cards.js
│   │   └── statements.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── rateLimiter.js
│   └── server.js
├── database/
│   └── DESIGN.md
├── infrastructure/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── README.md
├── tests/
│   ├── auth.test.js
│   ├── accounts.test.js
│   ├── transactions.test.js
│   ├── cards.test.js
│   └── statements.test.js
├── demo/
│   ├── client.js
│   └── README.md
├── docs/
│   ├── API.md
│   └── architecture.md
├── package.json
├── SOLUTION.md
└── AI_USAGE.md
```

---

## Future Enhancements

1. **Multi-factor Authentication**: SMS/Email OTP
2. **OAuth Integration**: Google, Facebook login
3. **Redis Caching**: Session and data caching
4. **Microservices**: Service decomposition
5. **Event Sourcing**: Complete audit trail
6. **OpenAPI/Swagger**: Auto-generated documentation
7. **WebSocket**: Real-time notifications
8. **Kubernetes**: Container orchestration
