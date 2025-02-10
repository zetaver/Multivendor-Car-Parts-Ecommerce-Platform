const Product = require('../models/Product');
const { createError } = require('../utils/error');
const { io } = require('../socket');

exports.getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      subcategory,
      condition,
      minPrice,
      maxPrice,
      sort = '-createdAt',
      search,
      inStock
    } = req.query;

    const query = { status: 'active' };

    // Apply filters
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (condition) query.condition = condition;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (inStock === 'true') query.stock = { $gt: 0 };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { oemNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .sort(sort)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('seller', 'name rating totalSales location');

    const total = await Product.countDocuments(query);

    // Add cache headers
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes

    res.json({
      products,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (error) {
    res.status(500).json(createError('Error fetching products'));
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name rating totalSales location')
      .populate({
        path: 'reviews',
        populate: {
          path: 'reviewer',
          select: 'name avatar'
        }
      });

    if (!product) {
      return res.status(404).json(createError('Product not found'));
    }

    // Increment views atomically
    await Product.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    // Add cache headers
    res.set('Cache-Control', 'public, max-age=60'); // 1 minute

    res.json(product);
  } catch (error) {
    res.status(500).json(createError('Error fetching product'));
  }
};

exports.createProduct = async (req, res) => {
  try {
    const product = new Product({
      ...req.body,
      seller: req.user.id
    });

    await product.save();

    // Notify followers
    io.to(`seller:${req.user.id}`).emit('newProduct', {
      sellerId: req.user.id,
      product: {
        id: product._id,
        title: product.title,
        price: product.price,
        image: product.images[0]
      }
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json(createError('Error creating product'));
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json(createError('Product not found'));
    }

    // Check ownership
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json(createError('Not authorized'));
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    // Notify price change if applicable
    if (req.body.price && req.body.price !== product.price) {
      io.to(`product:${product._id}`).emit('priceUpdate', {
        productId: product._id,
        newPrice: req.body.price,
        oldPrice: product.price
      });
    }

    // Notify stock change if applicable
    if (req.body.stock !== undefined && req.body.stock !== product.stock) {
      io.to(`product:${product._id}`).emit('stockUpdate', {
        productId: product._id,
        newStock: req.body.stock,
        oldStock: product.stock
      });
    }

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json(createError('Error updating product'));
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json(createError('Product not found'));
    }

    // Check ownership
    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json(createError('Not authorized'));
    }

    // Soft delete
    product.status = 'deleted';
    await product.save();

    // Notify followers
    io.to(`product:${product._id}`).emit('productDeleted', {
      productId: product._id
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json(createError('Error deleting product'));
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const { q, category, condition, minPrice, maxPrice } = req.query;
    
    const query = {
      status: 'active',
      $text: { $search: q }
    };

    if (category) query.category = category;
    if (condition) query.condition = condition;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(
      query,
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(20)
    .populate('seller', 'name rating');

    // Add cache headers
    res.set('Cache-Control', 'public, max-age=60'); // 1 minute

    res.json(products);
  } catch (error) {
    res.status(500).json(createError('Error searching products'));
  }
};

exports.getSellerProducts = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { page = 1, limit = 20, status = 'active' } = req.query;

    const query = { 
      seller: sellerId,
      status
    };

    const products = await Product.find(query)
      .sort('-createdAt')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('seller', 'name rating totalSales');

    const total = await Product.countDocuments(query);

    // Add cache headers
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes

    res.json({
      products,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (error) {
    res.status(500).json(createError('Error fetching seller products'));
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json(createError('Product not found'));
    }

    if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json(createError('Not authorized'));
    }

    // Update stock atomically
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $inc: { stock: quantity } },
      { new: true }
    );

    // Notify stock change
    io.to(`product:${id}`).emit('stockUpdate', {
      productId: id,
      newStock: updatedProduct.stock
    });

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json(createError('Error updating stock'));
  }
};