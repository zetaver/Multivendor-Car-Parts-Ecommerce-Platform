const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/adminAuth');

// Public routes - only read access
router.get('/', brandController.getAllBrands);
router.get('/:id', brandController.getBrandById);

// Admin-only routes - for managing brands
// Brand CRUD operations
router.post('/', authenticate, isAdmin, brandController.createBrand);
router.put('/:id', authenticate, isAdmin, brandController.updateBrand);
router.delete('/:id', authenticate, isAdmin, brandController.deleteBrand);

// Model operations
router.post('/:brandId/models', authenticate, isAdmin, brandController.addModel);
router.put('/:brandId/models/:modelId', authenticate, isAdmin, brandController.updateModel);
router.delete('/:brandId/models/:modelId', authenticate, isAdmin, brandController.deleteModel);

// Version operations
router.post('/:brandId/models/:modelId/versions', authenticate, isAdmin, brandController.addVersion);
router.put('/:brandId/models/:modelId/versions/:versionId', authenticate, isAdmin, brandController.updateVersion);
router.delete('/:brandId/models/:modelId/versions/:versionId', authenticate, isAdmin, brandController.deleteVersion);

// Seed initial data - admin only
router.post('/populate', authenticate, isAdmin, brandController.populateInitialData);

module.exports = router; 