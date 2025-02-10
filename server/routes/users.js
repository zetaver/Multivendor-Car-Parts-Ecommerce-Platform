const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  getSellerProfile,
  getSellerStats
} = require('../controllers/userController');

const router = express.Router();

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/seller/:sellerId', getSellerProfile);
router.get('/seller/:sellerId/stats', getSellerStats);

module.exports = router;