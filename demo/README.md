# Banking Service Demo Client

## Overview
This is a simple demo client application that demonstrates how to interact with the banking service API. It showcases the core functionalities including user registration, authentication, account management, and card services.

## Prerequisites
- Node.js (v14 or higher)
- The banking service API running locally or deployed

## Installation
1. Navigate to the demo directory:
   ```bash
   cd demo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage
1. Make sure the banking service API is running on `http://localhost:3000`

2. Run the demo:
   ```bash
   npm start
   ```

## What the Demo Does
The demo client performs the following actions in sequence:

1. **User Registration**: Registers a new user with sample data
2. **User Authentication**: Logs in the newly registered user
3. **Profile Retrieval**: Fetches and displays the user's profile
4. **Account Creation**: Creates a new checking account for the user
5. **Account Listing**: Retrieves and displays all accounts for the user
6. **Card Creation**: Issues a new debit card linked to the account
7. **Card Listing**: Retrieves and displays all cards for the user

## Customization
To customize the demo for your own use:

1. Modify the `demoUser` object in [client.js](client.js) with your desired user information
2. Update the `API_BASE_URL` constant if your API is hosted elsewhere
3. Adjust the account and card creation parameters as needed

## Error Handling
The demo client includes basic error handling for API calls. Errors will be displayed in the console with details about what went wrong.

## Dependencies
- **axios**: HTTP client for making API requests
- **nodemon** (dev): Utility for auto-restarting the application during development