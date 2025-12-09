const express = require('express');
const { 
  createAccount, 
  getUserAccounts, 
  getAccountById, 
  updateAccount, 
  deleteAccount 
} = require('../controllers/accountController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .post(createAccount)
  .get(getUserAccounts);

router.route('/:id')
  .get(getAccountById)
  .put(updateAccount)
  .delete(deleteAccount);

module.exports = router;