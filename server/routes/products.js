const express = require("express");
const {
  createProduct,
  getProducts,
  searchProducts,
  updateProduct,
  deleteProduct,
  getProductById,
  getProductCount,
  getTotalProductCountAdmin,
  getSellerProductCounts,
  getSellerProductCount
} = require("../controllers/productController");
const { authenticate } = require("../middleware/auth");
const wishlistController = require('../controllers/wishlistController');
const productController = require('../controllers/productController');

const router = express.Router();

// Public product routes - no authentication required
router.get("/count", getProductCount);
router.get("/", getProducts);
router.get("/search", searchProducts);
router.get("/:id", getProductById);
router.get('/:id/favorite-count', wishlistController.getProductFavoriteCount);

// Add view tracking routes
router.post('/:id/view', productController.trackProductView);
router.get('/:id/view-count', productController.getProductViewCount);

// Admin-only product count routes
router.get("/admin/count", authenticate, getTotalProductCountAdmin);
router.get("/admin/seller-counts", authenticate, getSellerProductCounts);
router.get("/seller/:sellerId/count", authenticate, getSellerProductCount);

// Protected routes for products - require authentication
router.post("/", authenticate, createProduct);
router.put("/:id", authenticate, updateProduct);
router.delete("/:id", authenticate, deleteProduct);

module.exports = router;
