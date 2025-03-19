const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

// @route   GET /api/payments
// @desc    Get all payment methods for authenticated user
// @access  Private
router.get('/', authenticate, paymentController.getPaymentMethods);

// @route   GET /api/payments/:id
// @desc    Get payment method by ID
// @access  Private
router.get('/:id', authenticate, paymentController.getPaymentMethod);

// @route   POST /api/payments
// @desc    Create a new payment method
// @access  Private
router.post(
  '/',
  [
    authenticate,
    [
      check('paymentMethodId', 'Payment method ID is required').not().isEmpty()
    ]
  ],
  paymentController.createPaymentMethod
);

// @route   PUT /api/payments/:id
// @desc    Update a payment method
// @access  Private
router.put(
  '/:id',
  [
    authenticate,
    [
      check('billingDetails', 'Billing details must be an object').optional().isObject(),
      check('isDefault', 'isDefault must be a boolean').optional().isBoolean()
    ]
  ],
  paymentController.updatePaymentMethod
);

// @route   DELETE /api/payments/:id
// @desc    Delete a payment method
// @access  Private
router.delete('/:id', authenticate, paymentController.deletePaymentMethod);

// @route   PATCH /api/payments/:id/default
// @desc    Set a payment method as default
// @access  Private
router.patch('/:id/default', authenticate, paymentController.setDefaultPaymentMethod);

// @route   POST /api/payments/setup-intent
// @desc    Create a setup intent for adding a payment method
// @access  Private
router.post('/setup-intent', authenticate, paymentController.createSetupIntent);

// @route   POST /api/payments/process
// @desc    Process a payment with a saved payment method
// @access  Private
router.post(
  '/process',
  [
    authenticate,
    [
      check('amount', 'Amount is required and must be a number').isNumeric(),
      check('currency', 'Currency must be a valid currency code').optional().isLength({ min: 3, max: 3 }),
      check('paymentMethodId', 'Payment method ID must be a valid ID').optional().isMongoId(),
      check('description', 'Description must be a string').optional().isString()
    ]
  ],
  paymentController.processPayment
);

module.exports = router; 