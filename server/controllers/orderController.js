const Order = require('../models/Order');
const User = require('../models/User');
const Address = require('../models/Address');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// Create a new order
exports.createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    // Check if user already has a pending order
    const existingPendingOrder = await Order.findOne({
      buyer: req.user.id,
      status: 'pending'
    });

    if (existingPendingOrder) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending order. Please complete or cancel it before placing a new order.'
      });
    }

    const { items, addressId, paymentMethod } = req.body;

    // Validate address belongs to user
    const address = await Address.findOne({
      _id: addressId,
      userId: req.user.id
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found or does not belong to you'
      });
    }

    // Get user details
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate and process items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    const orderItems = [];
    let totalAmount = 0;
    let seller = null;

    // Process each item
    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.productId} not found`
        });
      }

      // Set the seller from the first product (assuming all products have the same seller)
      if (!seller) {
        seller = product.seller;
      } else if (seller.toString() !== product.seller.toString()) {
        return res.status(400).json({
          success: false,
          message: 'All products in an order must be from the same seller'
        });
      }

      // Validate quantity
      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be at least 1 for each item'
        });
      }

      // Calculate item price
      const itemPrice = product.price * item.quantity;
      totalAmount += itemPrice;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });
    }

    // Create the order
    const newOrder = new Order({
      buyer: req.user.id,
      seller,
      items: orderItems,
      totalAmount,
      shippingAddress: {
        street: address.street,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country
      },
      paymentMethod,
      status: 'pending',
      paymentStatus: 'pending'
    });

    const savedOrder = await newOrder.save();

    // Populate product details for response
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('buyer', 'firstName lastName email phone')
      .populate('seller', 'firstName lastName email')
      .populate('items.product', 'title price images');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: populatedOrder
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get order history for a user
exports.getOrderHistory = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate('buyer', 'firstName lastName email phone')
      .populate('seller', 'firstName lastName email')
      .populate('items.product', 'title price images')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get a specific order by ID
exports.getOrderById = async (req, res) => {
  try {
    let order;
    
    // Check if user is a seller
    if (req.user.role === 'seller') {
      // Sellers can view orders where they are the seller
      order = await Order.findOne({
        _id: req.params.id,
        seller: req.user.id
      })
        .populate('buyer', 'firstName lastName email phone')
        .populate('seller', 'firstName lastName email')
        .populate('items.product', 'title price images');
    } else {
      // Regular users can only view their own orders as buyers
      order = await Order.findOne({
        _id: req.params.id,
        buyer: req.user.id
      })
        .populate('buyer', 'firstName lastName email phone')
        .populate('seller', 'firstName lastName email')
        .populate('items.product', 'title price images');
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or you are not authorized to view it'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update order status (for admin or seller)
exports.updateOrderStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    // Find the order
    let order;
    
    // If user is a seller, they can only update their own orders
    if (req.user.role === 'seller') {
      order = await Order.findOne({
        _id: req.params.id,
        seller: req.user.id
      });
    } else if (req.user.role === 'admin') {
      // Admins can update any order
      order = await Order.findById(req.params.id);
    } else {
      // Regular users can only cancel their own pending orders
      if (status !== 'cancelled') {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update order status'
        });
      }
      
      order = await Order.findOne({
        _id: req.params.id,
        buyer: req.user.id,
        status: 'pending' // Can only cancel pending orders
      });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or you are not authorized to update it'
      });
    }

    // Update the order status
    order.status = status;
    
    // If order is cancelled, update payment status accordingly
    if (status === 'cancelled' && order.paymentStatus === 'pending') {
      order.paymentStatus = 'cancelled';
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update payment status (for admin only)
exports.updatePaymentStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    // Only admins can update payment status
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update payment status'
      });
    }

    const { paymentStatus } = req.body;

    // Validate payment status
    const validPaymentStatuses = ['pending', 'completed', 'failed', 'refunded', 'cancelled'];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status value'
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.paymentStatus = paymentStatus;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all seller orders (admin only)
exports.getAllSellerOrders = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only endpoint.'
      });
    }

    // Optional query parameters for filtering
    const { sellerId, status, paymentStatus } = req.query;
    
    // Build query object
    const query = {};
    
    // Add filters if provided
    if (sellerId) query.seller = sellerId;
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const orders = await Order.find(query)
      .populate('buyer', 'firstName lastName email phone')
      .populate('seller', 'firstName lastName email storeName')
      .populate('items.product', 'title price images')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching all seller orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Count all seller orders (admin only)
exports.countSellerOrders = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only endpoint.'
      });
    }

    // Optional query parameters for filtering
    const { sellerId, status, paymentStatus } = req.query;
    
    // Build query object
    const query = {};
    
    // Add filters if provided
    if (sellerId) query.seller = sellerId;
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    // Count orders
    const totalCount = await Order.countDocuments(query);

    // Get count by status
    const statusCounts = await Order.aggregate([
      { $match: query },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Get count by payment status
    const paymentStatusCounts = await Order.aggregate([
      { $match: query },
      { $group: { _id: "$paymentStatus", count: { $sum: 1 } } }
    ]);

    // Get count by seller
    const sellerCounts = await Order.aggregate([
      { $match: query },
      { $group: { _id: "$seller", count: { $sum: 1 } } }
    ]);

    // Populate seller details for sellerCounts
    const populatedSellerCounts = await User.populate(sellerCounts, {
      path: '_id',
      select: 'firstName lastName email storeName'
    });

    res.status(200).json({
      success: true,
      totalCount,
      statusCounts: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      paymentStatusCounts: paymentStatusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      sellerCounts: populatedSellerCounts.map(item => ({
        seller: item._id,
        count: item.count
      }))
    });
  } catch (error) {
    console.error('Error counting seller orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get orders for a seller
exports.getSellerOrders = async (req, res) => {
  try {
    // Check if user is a seller
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Seller only endpoint.'
      });
    }

    // Optional query parameters for filtering
    const { status, paymentStatus } = req.query;
    
    // Build query object with the current user as the seller
    const query = { seller: req.user.id };
    
    // Add filters if provided
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const orders = await Order.find(query)
      .populate('buyer', 'firstName lastName email phone')
      .populate('seller', 'firstName lastName email')
      .populate('items.product', 'title price images')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete an order (admin only)
exports.deleteOrder = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only endpoint.'
      });
    }

    const orderId = req.params.id;
    
    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Delete the order
    await Order.findByIdAndDelete(orderId);
    
    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 