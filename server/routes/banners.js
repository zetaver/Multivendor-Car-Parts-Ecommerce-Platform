const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const bannerController = require('../controllers/bannerController');
const { authenticate } = require('../middleware/auth');

// Public route - Get active banners
router.get('/active', bannerController.getActiveBanners);

// Admin routes - Protected and require admin role
// Get all banners (admin only)
router.get('/', authenticate, bannerController.getAllBanners);

// Get a specific banner by ID (admin only)
router.get('/:id', authenticate, bannerController.getBannerById);

// Create a new banner (admin only)
router.post(
  '/',
  authenticate,
  [
    check('title', 'Title is required').not().isEmpty(),
    check('imageUrl', 'Image URL is required').not().isEmpty(),
    check('position', 'Position is required').not().isEmpty()
  ],
  bannerController.createBanner
);

// Update a banner (admin only)
router.put(
  '/:id',
  authenticate,
  [
    check('title', 'Title is required').optional(),
    check('imageUrl', 'Image URL is required').optional(),
    check('position', 'Position is required').optional()
  ],
  bannerController.updateBanner
);

// Delete a banner (admin only)
router.delete('/:id', authenticate, bannerController.deleteBanner);

// Toggle banner active status (admin only)
router.patch('/:id/toggle-status', authenticate, bannerController.toggleBannerStatus);

module.exports = router; 