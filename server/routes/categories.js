const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getTotalCategories,
  searchCategories,
  getTopCategories
} = require('../controllers/categoryController');

console.log('✅ Categories routes loaded');

// 🔹 Public Routes (Anyone can access)
router.get('/', (req, res) => {
  console.log('➡️ GET /categories route hit');
  getAllCategories(req, res);
});

// 🔹 Public Route to count total categories
router.get('/total', (req, res) => {
  console.log('➡️ GET /categories/total route hit');
  getTotalCategories(req, res);
});

// 🔹 New Route for searching categories
router.get('/search', (req, res) => {
  console.log(`➡️ GET /categories/search?query=${req.query.query} route hit`);
  searchCategories(req, res);
});

// 🔹 Route to get top categories by sales
router.get('/top', (req, res) => {
  console.log(`➡️ GET /categories/top?limit=${req.query.limit || 5} route hit`);
  getTopCategories(req, res);
});

// 🔹 Route to get category by ID
router.get('/:id', (req, res) => {
  console.log(`➡️ GET /categories/${req.params.id} route hit`);
  getCategoryById(req, res);
});

// 🔹 Protected Routes (Only Admins can modify categories)
router.post('/', authenticate, authorize('admin'), (req, res) => {
  console.log('➡️ POST /categories route hit');
  createCategory(req, res);
});

router.put('/:id', authenticate, authorize('admin'), (req, res) => {
  console.log(`➡️ PUT /categories/${req.params.id} route hit`);
  updateCategory(req, res);
});

router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  console.log(`➡️ DELETE /categories/${req.params.id} route hit`);
  deleteCategory(req, res);
});

module.exports = router;
