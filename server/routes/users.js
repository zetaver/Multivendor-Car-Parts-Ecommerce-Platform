const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  getSellerProfile,
  getSellerStats,
  getAllUsers,
  createUser,
  deleteUser,
  updateUser,
  getTotalUsers
} = require('../controllers/userController');

const router = express.Router();

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/seller/:sellerId', getSellerProfile);
router.get('/seller/:sellerId/stats', getSellerStats);
router.get('/all', authenticate, authorize('admin'), getAllUsers);
router.post('/', authenticate, authorize('admin'), createUser);
router.delete('/:userId', authenticate, authorize('admin'), deleteUser);
router.put('/:userId', authenticate, authorize('admin'), updateUser);
router.get('/total', authenticate, authorize('admin'), getTotalUsers);

module.exports = router;