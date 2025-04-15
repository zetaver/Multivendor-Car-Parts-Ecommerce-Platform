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
  getSellerProductCount,
  getProductsBySeller,
  getProductWithSeller,
  getProductsByCategory,
  getFilteredProducts,
  getSearchSuggestions,
  getNewArrivals,
  getBestSellers
} = require("../controllers/productController");
const { authenticate } = require("../middleware/auth");
const wishlistController = require('../controllers/wishlistController');
const productController = require('../controllers/productController');

const router = express.Router();

// Public product routes - no authentication required
router.get("/count", getProductCount);
router.get("/", getProducts);
router.get("/search", searchProducts);
router.get("/suggestions", getSearchSuggestions);
router.get('/filter', productController.getFilteredProducts);
router.get("/category/:categoryId", getProductsByCategory);
router.get("/new-arrivals", productController.getNewArrivals);
router.get("/best-sellers", productController.getBestSellers);
router.get("/:id", getProductById);
router.get('/:id/favorite-count', wishlistController.getProductFavoriteCount);
router.get('/:id/withSeller', getProductWithSeller);

// Add view tracking routes
router.post('/:id/view', productController.trackProductView);
router.get('/:id/view-count', productController.getProductViewCount);

// Get products by seller
router.get('/seller/:sellerId', getProductsBySeller);

// Admin-only product count routes
router.get("/admin/count", authenticate, getTotalProductCountAdmin);
router.get("/admin/seller-counts", authenticate, getSellerProductCounts);
router.get("/seller/:sellerId/count", authenticate, getSellerProductCount);

// Protected routes for products - require authentication
router.post("/", authenticate, createProduct);
router.put("/:id", authenticate, updateProduct);
router.delete("/:id", authenticate, deleteProduct);

module.exports = router;
