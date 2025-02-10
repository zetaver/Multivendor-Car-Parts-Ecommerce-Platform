const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { createError } = require('../utils/error');

exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate('products.product', 'title images price condition oemNumber');

    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user.id, products: [] });
      await wishlist.save();
    }

    res.json(wishlist);
  } catch (error) {
    res.status(500).json(createError('Error fetching wishlist'));
  }
};

exports.addToWishlist = async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json(createError('Product not found'));
    }

    let wishlist = await Wishlist.findOne({ user: req.user.id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user.id, products: [] });
    }

    if (!wishlist.hasProduct(productId)) {
      wishlist.addProduct(productId, product.price);
      await wishlist.save();
    }

    await wishlist.populate('products.product', 'title images price condition oemNumber');
    res.json(wishlist);
  } catch (error) {
    res.status(500).json(createError('Error adding to wishlist'));
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const productId = req.params.productId;
    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      return res.status(404).json(createError('Wishlist not found'));
    }

    wishlist.removeProduct(productId);
    await wishlist.save();
    await wishlist.populate('products.product', 'title images price condition oemNumber');

    res.json(wishlist);
  } catch (error) {
    res.status(500).json(createError('Error removing from wishlist'));
  }
};

exports.clearWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      return res.status(404).json(createError('Wishlist not found'));
    }

    wishlist.products = [];
    await wishlist.save();

    res.json(wishlist);
  } catch (error) {
    res.status(500).json(createError('Error clearing wishlist'));
  }
};