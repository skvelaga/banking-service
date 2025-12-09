# Database Design

## Overview
This document describes the database schema for the banking service. The database is designed using MongoDB with Mongoose ODM.

## Collections

### Users
Stores user account information for authentication and profile data.

**Fields:**
- `_id` (ObjectId) - Unique identifier
- `firstName` (String) - User's first name
- `lastName` (String) - User's last name
- `email` (String) - User's email (unique)
- `password` (String) - Hashed password
- `dateOfBirth` (Date) - User's date of birth
- `phoneNumber` (String) - User's phone number
- `address` (Object) - User's address information
  - `street` (String)
  - `city` (String)
  - `state` (String)
  - `zipCode` (String)
  - `country` (String)
- `createdAt` (Date) - Timestamp when record was created
- `updatedAt` (Date) - Timestamp when record was last updated

**Indexes:**
- Unique index on `email`

### Accounts
Stores bank account information.

**Fields:**
- `_id` (ObjectId) - Unique identifier
- `accountNumber` (String) - Unique account number
- `accountType` (String) - Type of account (checking, savings, credit)
- `userId` (ObjectId) - Reference to User
- `balance` (Number) - Current account balance
- `currency` (String) - Currency code (default: USD)
- `status` (String) - Account status (active, inactive, frozen, closed)
- `createdAt` (Date) - Timestamp when record was created
- `updatedAt` (Date) - Timestamp when record was last updated

**Indexes:**
- Unique index on `accountNumber`
- Index on `userId`

### Transactions
Stores transaction records between accounts.

**Fields:**
- `_id` (ObjectId) - Unique identifier
- `transactionId` (String) - Unique transaction ID
- `fromAccount` (String) - Source account number
- `toAccount` (String) - Destination account number
- `amount` (Number) - Transaction amount
- `currency` (String) - Currency code (default: USD)
- `transactionType` (String) - Type of transaction (transfer, deposit, withdrawal, payment)
- `status` (String) - Transaction status (pending, completed, failed, cancelled)
- `description` (String) - Description of transaction
- `createdAt` (Date) - Timestamp when record was created
- `updatedAt` (Date) - Timestamp when record was last updated

**Indexes:**
- Unique index on `transactionId`
- Index on `fromAccount`
- Index on `toAccount`

### Cards
Stores card information linked to accounts.

**Fields:**
- `_id` (ObjectId) - Unique identifier
- `cardNumber` (String) - Unique card number
- `cardHolderName` (String) - Name on the card
- `accountId` (ObjectId) - Reference to Account
- `cardType` (String) - Type of card (debit, credit)
- `expiryDate` (Date) - Card expiration date
- `cvv` (String) - Card CVV (stored securely)
- `status` (String) - Card status (active, inactive, blocked, expired)
- `dailyLimit` (Number) - Daily spending limit
- `createdAt` (Date) - Timestamp when record was created
- `updatedAt` (Date) - Timestamp when record was last updated

**Indexes:**
- Unique index on `cardNumber`
- Index on `accountId`

## Relationships
- Users have a one-to-many relationship with Accounts
- Accounts have a one-to-many relationship with Cards
- Accounts participate in many-to-many relationships through Transactions

## Security Considerations
- Passwords are hashed and never stored in plain text
- Sensitive fields like CVV are handled with care
- All communications should use TLS/SSL
- Regular backups should be performed
- Access controls should be implemented at the application level

## Scalability Considerations
- Indexes are created on frequently queried fields
- Sharding can be implemented on high-volume collections
- Read replicas can be used for reporting queries
- Connection pooling should be configured appropriately