const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const addressController = require('../controllers/addressController');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/addresses
// @desc    Get all addresses for authenticated user
// @access  Private
router.get('/', authenticate, addressController.getAddresses);

// @route   GET /api/addresses/:id
// @desc    Get address by ID
// @access  Private
router.get('/:id', authenticate, addressController.getAddress);

// @route   POST /api/addresses
// @desc    Create a new address
// @access  Private
router.post(
  '/',
  [
    authenticate,
    [
      check('street', 'Street is required').not().isEmpty(),
      check('city', 'City is required').not().isEmpty(),
      check('state', 'State is required').not().isEmpty(),
      check('postalCode', 'Postal code is required').not().isEmpty(),
      check('country', 'Country is required').not().isEmpty()
    ]
  ],
  addressController.createAddress
);

// @route   PUT /api/addresses/:id
// @desc    Update an address
// @access  Private
router.put(
  '/:id',
  [
    authenticate,
    [
      check('street', 'Street is required').optional(),
      check('city', 'City is required').optional(),
      check('state', 'State is required').optional(),
      check('postalCode', 'Postal code is required').optional(),
      check('country', 'Country is required').optional(),
      check('isDefault', 'isDefault must be a boolean').optional().isBoolean()
    ]
  ],
  addressController.updateAddress
);

// @route   DELETE /api/addresses/:id
// @desc    Delete an address
// @access  Private
router.delete('/:id', authenticate, addressController.deleteAddress);

// @route   PATCH /api/addresses/:id/default
// @desc    Set an address as default
// @access  Private
router.patch('/:id/default', authenticate, addressController.setDefaultAddress);

// @route   GET /api/addresses/current/default
// @desc    Set current user's most recent address as default
// @access  Private
router.get('/current/default', authenticate, addressController.setCurrentAddressAsDefault);

module.exports = router; 