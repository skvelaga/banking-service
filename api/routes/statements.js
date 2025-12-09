const express = require('express');
const {
  generateStatement,
  getUserStatements,
  getStatementById,
  getStatementsByAccount
} = require('../controllers/statementController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getUserStatements)
  .post(generateStatement);

router.route('/:id')
  .get(getStatementById);

router.route('/account/:accountId')
  .get(getStatementsByAccount);

module.exports = router;
