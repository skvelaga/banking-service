# Banking Service API

## Overview
This is a RESTful API for a banking service that provides functionalities for user authentication, account management, transactions, and card services.

## Base URL
```
http://localhost:3000/api
```

## Authentication

### Register
```
POST /auth/register
```

**Request Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string",
  "dateOfBirth": "date",
  "phoneNumber": "string",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "country": "string"
  }
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "firstName": "string",
    "lastName": "string",
    "email": "string"
  }
}
```

### Login
```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "firstName": "string",
    "lastName": "string",
    "email": "string"
  }
}
```

### Get Profile
```
GET /auth/profile
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "_id": "user_id",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "dateOfBirth": "date",
  "phoneNumber": "string",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "country": "string"
  },
  "createdAt": "date",
  "updatedAt": "date"
}
```

## Accounts

### Create Account
```
POST /accounts
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "accountType": "checking|savings",
  "currency": "string" // optional, defaults to USD
}
```

**Response:**
```json
{
  "message": "Account created successfully",
  "account": {
    "_id": "account_id",
    "accountNumber": "string",
    "accountType": "checking|savings",
    "userId": "user_id",
    "balance": 0,
    "currency": "USD",
    "status": "active",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

### Get All Accounts
```
GET /accounts
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Accounts retrieved successfully",
  "accounts": [
    {
      "_id": "account_id",
      "accountNumber": "string",
      "accountType": "checking|savings",
      "userId": "user_id",
      "balance": 0,
      "currency": "USD",
      "status": "active",
      "createdAt": "date",
      "updatedAt": "date"
    }
  ]
}
```

### Get Account by ID
```
GET /accounts/:id
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Account retrieved successfully",
  "account": {
    "_id": "account_id",
    "accountNumber": "string",
    "accountType": "checking|savings",
    "userId": "user_id",
    "balance": 0,
    "currency": "USD",
    "status": "active",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

### Update Account
```
PUT /accounts/:id
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "active|inactive|frozen" // optional
}
```

**Response:**
```json
{
  "message": "Account updated successfully",
  "account": {
    "_id": "account_id",
    "accountNumber": "string",
    "accountType": "checking|savings",
    "userId": "user_id",
    "balance": 0,
    "currency": "USD",
    "status": "updated_status",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

### Delete Account (Close Account)
```
DELETE /accounts/:id
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Account closed successfully",
  "account": {
    "_id": "account_id",
    "accountNumber": "string",
    "accountType": "checking|savings",
    "userId": "user_id",
    "balance": 0,
    "currency": "USD",
    "status": "closed",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

## Transactions

### Transfer Money
```
POST /transactions/transfer
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "fromAccount": "account_number",
  "toAccount": "account_number",
  "amount": "number",
  "description": "string" // optional
}
```

**Response:**
```json
{
  "message": "Transfer successful",
  "transaction": {
    "_id": "transaction_id",
    "transactionId": "string",
    "fromAccount": "account_number",
    "toAccount": "account_number",
    "amount": "number",
    "currency": "USD",
    "transactionType": "transfer",
    "status": "completed",
    "description": "string",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

### Get Transaction History
```
GET /transactions/history
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Transaction history retrieved successfully",
  "transactions": [
    {
      "_id": "transaction_id",
      "transactionId": "string",
      "fromAccount": "account_number",
      "toAccount": "account_number",
      "amount": "number",
      "currency": "USD",
      "transactionType": "transfer",
      "status": "completed",
      "description": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  ]
}
```

### Get Transaction by ID
```
GET /transactions/:id
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Transaction retrieved successfully",
  "transaction": {
    "_id": "transaction_id",
    "transactionId": "string",
    "fromAccount": "account_number",
    "toAccount": "account_number",
    "amount": "number",
    "currency": "USD",
    "transactionType": "transfer",
    "status": "completed",
    "description": "string",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

## Cards

### Create Card
```
POST /cards
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "accountId": "account_id",
  "cardType": "debit|credit",
  "cardHolderName": "string",
  "expiryDate": "date"
}
```

**Response:**
```json
{
  "message": "Card created successfully",
  "card": {
    "id": "card_id",
    "cardNumber": "string",
    "cardHolderName": "string",
    "accountId": "account_id",
    "cardType": "debit|credit",
    "expiryDate": "date",
    "status": "active",
    "dailyLimit": 5000,
    "createdAt": "date"
  }
}
```

### Get All Cards
```
GET /cards
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Cards retrieved successfully",
  "cards": [
    {
      "id": "card_id",
      "cardNumber": "string",
      "cardHolderName": "string",
      "accountId": "account_id",
      "cardType": "debit|credit",
      "expiryDate": "date",
      "status": "active",
      "dailyLimit": 5000,
      "createdAt": "date"
    }
  ]
}
```

### Get Card by ID
```
GET /cards/:id
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Card retrieved successfully",
  "card": {
    "id": "card_id",
    "cardNumber": "string",
    "cardHolderName": "string",
    "accountId": "account_id",
    "cardType": "debit|credit",
    "expiryDate": "date",
    "status": "active",
    "dailyLimit": 5000,
    "createdAt": "date"
  }
}
```

### Update Card
```
PUT /cards/:id
```

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "active|inactive|blocked", // optional
  "dailyLimit": "number" // optional
}
```

**Response:**
```json
{
  "message": "Card updated successfully",
  "card": {
    "id": "card_id",
    "cardNumber": "string",
    "cardHolderName": "string",
    "accountId": "account_id",
    "cardType": "debit|credit",
    "expiryDate": "date",
    "status": "updated_status",
    "dailyLimit": "updated_limit",
    "createdAt": "date"
  }
}
```

### Delete Card
```
DELETE /cards/:id
```

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Card deleted successfully"
}
```