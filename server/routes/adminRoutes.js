const express = require('express');
const { adminGetAllProducts, updateProductStatus } = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminAuth');
const { setAutoApproval } = require('../controllers/productController');
const { getAutoApprovalStatus } = require('../controllers/productController');
const brandController = require('../controllers/brandController');
const router = express.Router();

// Admin routes for product management
router.get('/products', authenticate, isAdmin, adminGetAllProducts);
router.patch('/products/:id/status', authenticate, isAdmin, updateProductStatus);
router.patch('/settings/auto-approve', authenticate, isAdmin, setAutoApproval);
router.get('/settings/auto-approve', authenticate, isAdmin, getAutoApprovalStatus);

// Admin routes for brand management
router.get('/brands', authenticate, isAdmin, brandController.getAllBrands);
router.post('/brands', authenticate, isAdmin, brandController.createBrand);
router.put('/brands/:id', authenticate, isAdmin, brandController.updateBrand);
router.delete('/brands/:id', authenticate, isAdmin, brandController.deleteBrand);

// Model operations
router.post('/brands/:brandId/models', authenticate, isAdmin, brandController.addModel);
router.put('/brands/:brandId/models/:modelId', authenticate, isAdmin, brandController.updateModel);
router.delete('/brands/:brandId/models/:modelId', authenticate, isAdmin, brandController.deleteModel);

// Version operations
router.post('/brands/:brandId/models/:modelId/versions', authenticate, isAdmin, brandController.addVersion);
router.put('/brands/:brandId/models/:modelId/versions/:versionId', authenticate, isAdmin, brandController.updateVersion);
router.delete('/brands/:brandId/models/:modelId/versions/:versionId', authenticate, isAdmin, brandController.deleteVersion);

// Populate initial brand data
router.post('/brands/populate', authenticate, isAdmin, brandController.populateInitialData);

module.exports = router;