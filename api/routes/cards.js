const express = require('express');
const { 
  createCard, 
  getUserCards, 
  getCardById, 
  updateCard, 
  deleteCard 
} = require('../controllers/cardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .post(createCard)
  .get(getUserCards);

router.route('/:id')
  .get(getCardById)
  .put(updateCard)
  .delete(deleteCard);

module.exports = router;