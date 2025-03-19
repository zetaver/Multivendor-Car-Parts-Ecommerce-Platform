const express = require("express");
const { authenticate } = require("../middleware/auth");
const Product = require('../models/Product');

const router = express.Router();

// Get authenticated seller's products
router.get("/products", authenticate, async (req, res) => {
  try {
    // Log the authenticated user ID
    console.log("Authenticated user ID:", req.user.id);
    
    // Only return products for the authenticated seller
    const products = await Product.find({ seller: req.user.id });
    
    // Log the query results
    console.log("Found products count:", products.length);
    
    const populatedProducts = await Product.find({ seller: req.user.id })
      .populate('category')
      .select('title description price images status oemNumber createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json(populatedProducts);
  } catch (error) {
    console.error("Error fetching seller products:", error);
    res.status(500).json({ message: "Error retrieving products", error: error.message });
  }
});

module.exports = router; 