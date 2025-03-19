const express = require('express');
const { adminGetAllProducts, updateProductStatus } = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminAuth');
const { setAutoApproval } = require('../controllers/productController');
const { getAutoApprovalStatus } = require('../controllers/productController');
const router = express.Router();

// Admin routes for product management
router.get('/products', authenticate, isAdmin, adminGetAllProducts);
router.patch('/products/:id/status', authenticate, isAdmin, updateProductStatus);
router.patch('/settings/auto-approve', authenticate, isAdmin, setAutoApproval);
router.get('/settings/auto-approve', authenticate, isAdmin, getAutoApprovalStatus);



module.exports = router;