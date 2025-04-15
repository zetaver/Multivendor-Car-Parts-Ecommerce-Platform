const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Get user's wishlist
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let wishlist = await Wishlist.findOne({ user: userId })
      .populate({
        path: 'products',
        select: 'title price images oemNumber category',
        populate: { path: 'category', select: 'name' }
      });
    
    // If no wishlist exists, create an empty one
    if (!wishlist) {
      wishlist = new Wishlist({ user: userId, products: [] });
      await wishlist.save();
    }
    
    res.status(200).json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve wishlist',
      error: error.message
    });
  }
};

// Add product to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    
    // Validate if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Find user's wishlist or create a new one
    let wishlist = await Wishlist.findOne({ user: userId });
    
    if (!wishlist) {
      wishlist = new Wishlist({
        user: userId,
        products: [productId]
      });
    } else {
      // Check if product already exists in wishlist
      if (wishlist.products.includes(productId)) {
        return res.status(400).json({
          success: false,
          message: 'Product already exists in wishlist'
        });
      }
      
      // Add product to wishlist
      wishlist.products.push(productId);
    }
    
    await wishlist.save();
    
    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      data: wishlist
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product to wishlist',
      error: error.message
    });
  }
};

// Remove product from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    
    // Find user's wishlist
    const wishlist = await Wishlist.findOne({ user: userId });
    
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }
    
    // Check if product exists in wishlist
    if (!wishlist.products.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Product does not exist in wishlist'
      });
    }
    
    // Remove product from wishlist
    wishlist.products = wishlist.products.filter(
      product => product.toString() !== productId
    );
    
    await wishlist.save();
    
    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      data: wishlist
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove product from wishlist',
      error: error.message
    });
  }
};

// Clear wishlist
exports.clearWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find user's wishlist
    const wishlist = await Wishlist.findOne({ user: userId });
    
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }
    
    // Clear products array
    wishlist.products = [];
    await wishlist.save();
    
    res.status(200).json({
      success: true,
      message: 'Wishlist cleared successfully',
      data: wishlist
    });
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear wishlist',
      error: error.message
    });
  }
};

// Check if a product is in the wishlist
exports.checkWishlistItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    
    // Find user's wishlist
    const wishlist = await Wishlist.findOne({ user: userId });
    
    if (!wishlist) {
      return res.status(200).json({
        success: true,
        isInWishlist: false
      });
    }
    
    // Check if product exists in wishlist
    const isInWishlist = wishlist.products.some(
      product => product.toString() === productId
    );
    
    res.status(200).json({
      success: true,
      isInWishlist
    });
  } catch (error) {
    console.error('Error checking wishlist item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check wishlist item',
      error: error.message
    });
  }
}; 

// Get user's wishlist count
exports.getWishlistCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find user's wishlist
    const wishlist = await Wishlist.findOne({ user: userId });
    
    // If no wishlist exists, return count as 0
    if (!wishlist) {
      return res.status(200).json({
        success: true,
        count: 0
      });
    }
    
    // Return the count of products in the wishlist
    const count = wishlist.products.length;
    
    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error fetching wishlist count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wishlist count',
      error: error.message
    });
  }
};

// Get product favorite count (how many users have added this product to their wishlist)
exports.getProductFavoriteCount = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    
    // Count how many wishlists contain this product
    const count = await Wishlist.countDocuments({
      products: id
    });
    
    res.status(200).json({
      success: true,
      productId: id,
      favoriteCount: count
    });
  } catch (error) {
    console.error('Error fetching product favorite count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product favorite count',
      error: error.message
    });
  }
}; 

// Get recently added wishlist items
exports.getRecentWishlistItems = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find user's wishlist
    const wishlist = await Wishlist.findOne({ user: userId })
      .populate({
        path: 'products',
        select: 'title price images oemNumber category',
        populate: { path: 'category', select: 'name' }
      })
      .sort({ updatedAt: -1 })
      .limit(5);
    
    if (!wishlist) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    res.status(200).json({
      success: true,
      data: wishlist.products
    });
    
  } catch (error) {
    console.error('Error fetching recent wishlist items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent wishlist items',
      error: error.message
    });
  }
};

// Toggle product in wishlist (add if not exists, remove if exists)
exports.toggleWishlistItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    
    // Validate if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Find user's wishlist
    let wishlist = await Wishlist.findOne({ user: userId });
    
    // If no wishlist exists, create a new one with the product
    if (!wishlist) {
      wishlist = new Wishlist({
        user: userId,
        products: [productId]
      });
      await wishlist.save();
      
      return res.status(200).json({
        success: true,
        message: 'Product added to wishlist',
        isInWishlist: true
      });
    }
    
    // Check if product already exists in wishlist
    const productIndex = wishlist.products.findIndex(
      product => product.toString() === productId
    );
    
    if (productIndex === -1) {
      // Product not in wishlist, add it
      wishlist.products.push(productId);
      await wishlist.save();
      
      return res.status(200).json({
        success: true,
        message: 'Product added to wishlist',
        isInWishlist: true
      });
    } else {
      // Product already in wishlist, remove it
      wishlist.products.splice(productIndex, 1);
      await wishlist.save();
      
      return res.status(200).json({
        success: true,
        message: 'Product removed from wishlist',
        isInWishlist: false
      });
    }
    
  } catch (error) {
    console.error('Error toggling wishlist item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle wishlist item',
      error: error.message
    });
  }
};

