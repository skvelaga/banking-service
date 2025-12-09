const express = require('express');
const {
  transferMoney,
  getTransactionHistory,
  getTransactionById,
  deposit,
  withdraw
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/transfer')
  .post(transferMoney);

router.route('/deposit')
  .post(deposit);

router.route('/withdraw')
  .post(withdraw);

router.route('/history')
  .get(getTransactionHistory);

router.route('/:id')
  .get(getTransactionById);

module.exports = router;
