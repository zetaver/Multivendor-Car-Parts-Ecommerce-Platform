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
  getTotalUsers,
  getCurrentUserDetails,
  getUserContactDetails,
  updateCurrentUserDetails,
  updateSellerProfile,
  getSellerProfileDetails,
  getSellerInfo,
  promoteToSeller,
  updateUserRole,
  syncRoleWithRolesArray
} = require('../controllers/userController');
const { User } = require('../models/User');
const { generateAuthToken } = require('../utils/auth');

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

// Add new routes
router.get('/profile/details', authenticate, getCurrentUserDetails);
router.put('/profile/details', authenticate, updateCurrentUserDetails);
router.get('/:userId/contact', authenticate, getUserContactDetails);

// Add new route for updating seller profile
router.put('/seller/profile', authenticate, updateSellerProfile);

// Add new route for getting seller profile details
router.get('/seller/:sellerId/details', getSellerProfileDetails);

// Add new route for getting seller info for products
router.get('/seller-info/:sellerId', getSellerInfo);

// Update the route to manually promote a user to seller to use our controller
router.post('/promote-to-seller', authenticate, promoteToSeller);

// New route for updating user role (for current user and admin-only for other users)
router.patch('/role', authenticate, updateUserRole);
router.patch('/:userId/role', authenticate, authorize('admin'), updateUserRole);

// New route for syncing a user's role with their roles array
router.patch('/sync-role', authenticate, syncRoleWithRolesArray);
router.patch('/:userId/sync-role', authenticate, authorize('admin'), syncRoleWithRolesArray);

module.exports = router;