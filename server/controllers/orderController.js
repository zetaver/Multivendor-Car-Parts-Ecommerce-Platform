const Order = require('../models/Order');
const User = require('../models/User');
const Address = require('../models/Address');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// Create a new order
exports.createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Order validation failed:', errors.array());
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    console.log('Creating order for user:', req.user.id);
    console.log('Order request body:', JSON.stringify(req.body, null, 2));

    // Check if user already has a pending order
    const existingPendingOrder = await Order.findOne({
      buyer: req.user.id,
      status: 'pending'
    });

    if (existingPendingOrder) {
      console.log('User has pending order:', existingPendingOrder._id);
      return res.status(400).json({
        success: false,
        message: 'You already have a pending order. Please complete or cancel it before placing a new order.'
      });
    }

    const { 
      items, 
      addressId, 
      paymentMethod, 
      paymentIntentId, 
      shippingMethod, 
      totalAmount: providedTotal,
      // Get pickup point details if provided
      pickupPoint,
      // Add offer-related fields
      isOffer,
      offerId,
      offerAmount,
      conversationId
    } = req.body;

    console.log('Processing order with payment intent:', paymentIntentId || 'none');
    console.log('Shipping method:', shippingMethod);
    
    if (shippingMethod === 'pickup' && pickupPoint) {
      console.log('Pickup point details:', pickupPoint);
    }
    
    // Log if this is an offer-based order
    if (isOffer) {
      console.log('Processing offer-based order:', {
        offerId,
        offerAmount,
        conversationId
      });
    }
    
    // Validate address belongs to user
    const address = await Address.findOne({
      _id: addressId,
      userId: req.user.id
    });

    if (!address) {
      console.log('Address validation failed:', { addressId, userId: req.user.id });
      return res.status(404).json({
        success: false,
        message: 'Address not found or does not belong to you'
      });
    }
    
    console.log('Address found and validated:', address._id);

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
    let calculatedTotal = 0;
    let seller = null;
    let originalPrices = {};

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

      // Store original price for offer comparison
      originalPrices[product._id.toString()] = product.price;

      // Calculate item price - use standard price if not an offer
      const itemPrice = isOffer && offerAmount ? offerAmount : (product.price * item.quantity);
      calculatedTotal += itemPrice;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        // If this is an offer order, use the actual product price but we'll use offerAmount for total
        price: product.price
      });
    }

    // Add shipping costs and fees if total was provided from frontend
    // Otherwise use the calculated total from product prices
    const totalAmount = providedTotal || calculatedTotal;

    // Prepare the order data
    const orderData = {
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
      shippingMethod: shippingMethod || 'standard',
      status: paymentIntentId ? 'processing' : 'pending',
      paymentStatus: paymentIntentId ? 'completed' : 'pending',
      paymentIntentId: paymentIntentId || null
    };

    // Add pickup point details if shipping method is pickup
    if (shippingMethod === 'pickup' && pickupPoint) {
      orderData.pickupPoint = {
        id: pickupPoint.id,
        name: pickupPoint.name,
        provider: pickupPoint.provider,
        address: pickupPoint.address,
        city: pickupPoint.city,
        state: pickupPoint.state,
        postalCode: pickupPoint.postalCode,
        country: pickupPoint.country || address.country,
        price: pickupPoint.price,
        deliveryDays: pickupPoint.deliveryDays,
        distance: pickupPoint.distance
      };
      console.log('Added pickup point details to order:', orderData.pickupPoint);
    }

    // Add offer details if this is an offer-based purchase
    if (isOffer && offerId && offerAmount) {
      // Get the first product's original price for reference
      const firstProductId = items[0].productId;
      const originalPrice = originalPrices[firstProductId] || 0;

      orderData.isOfferPurchase = true;
      orderData.offerDetails = {
        offerId,
        originalPrice,
        offerAmount,
        conversationId
      };

      console.log('Adding offer details to order:', {
        isOfferPurchase: true,
        offerId,
        originalPrice,
        offerAmount
      });
    }

    // Create the order with all the data
    const newOrder = new Order(orderData);

    console.log('Saving new order with details:', {
      buyerId: newOrder.buyer,
      sellerId: seller,
      items: orderItems.length,
      total: totalAmount,
      paymentStatus: newOrder.paymentStatus,
      isOfferPurchase: newOrder.isOfferPurchase || false,
      shippingMethod: newOrder.shippingMethod,
      hasPickupPoint: !!newOrder.pickupPoint
    });

    const savedOrder = await newOrder.save();
    console.log('Order saved successfully with ID:', savedOrder._id);

    // Populate product details for response
    const populatedOrder = await Order.findById(savedOrder._id)
      .populate('buyer', 'firstName lastName email phone')
      .populate('seller', 'firstName lastName email')
      .populate('items.product', 'title price images');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderId: savedOrder._id,
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

    // Process orders to add delivery destination information
    const formattedOrders = orders.map(order => {
      const orderObj = order.toObject();
      
      if (orderObj.shippingMethod === 'pickup' && orderObj.pickupPoint) {
        orderObj.deliveryDestination = {
          type: 'pickup',
          name: orderObj.pickupPoint.name,
          provider: orderObj.pickupPoint.provider,
          address: orderObj.pickupPoint.address,
          city: orderObj.pickupPoint.city,
          postalCode: orderObj.pickupPoint.postalCode,
          state: orderObj.pickupPoint.state,
          fullAddress: `${orderObj.pickupPoint.address}, ${orderObj.pickupPoint.city}, ${orderObj.pickupPoint.state} ${orderObj.pickupPoint.postalCode}`
        };
      } else {
        orderObj.deliveryDestination = {
          type: 'home',
          address: orderObj.shippingAddress.street,
          city: orderObj.shippingAddress.city,
          state: orderObj.shippingAddress.state,
          postalCode: orderObj.shippingAddress.postalCode,
          fullAddress: `${orderObj.shippingAddress.street}, ${orderObj.shippingAddress.city}, ${orderObj.shippingAddress.state} ${orderObj.shippingAddress.postalCode}`
        };
      }
      
      return orderObj;
    });

    res.status(200).json({
      success: true,
      count: formattedOrders.length,
      data: formattedOrders
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

    // Add a formatted display of the delivery destination based on shipping method
    if (order.toObject) {
      const orderObj = order.toObject();
      
      if (orderObj.shippingMethod === 'pickup' && orderObj.pickupPoint) {
        orderObj.deliveryDestination = {
          type: 'pickup',
          name: orderObj.pickupPoint.name,
          provider: orderObj.pickupPoint.provider,
          address: orderObj.pickupPoint.address,
          city: orderObj.pickupPoint.city,
          postalCode: orderObj.pickupPoint.postalCode,
          state: orderObj.pickupPoint.state,
          fullAddress: `${orderObj.pickupPoint.address}, ${orderObj.pickupPoint.city}, ${orderObj.pickupPoint.state} ${orderObj.pickupPoint.postalCode}`
        };
      } else {
        orderObj.deliveryDestination = {
          type: 'home',
          address: orderObj.shippingAddress.street,
          city: orderObj.shippingAddress.city,
          state: orderObj.shippingAddress.state,
          postalCode: orderObj.shippingAddress.postalCode,
          fullAddress: `${orderObj.shippingAddress.street}, ${orderObj.shippingAddress.city}, ${orderObj.shippingAddress.state} ${orderObj.shippingAddress.postalCode}`
        };
      }
      
      res.status(200).json({
        success: true,
        data: orderObj
      });
    } else {
      res.status(200).json({
        success: true,
        data: order
      });
    }
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

// Update tracking number (for admin or seller)
exports.updateOrderTracking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { trackingNumber } = req.body;

    // Validate tracking number
    if (!trackingNumber || typeof trackingNumber !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid tracking number is required'
      });
    }

    console.log(`Updating tracking for order ${req.params.id} with tracking number ${trackingNumber}`);

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
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update tracking information'
      });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or you are not authorized to update it'
      });
    }

    // Check if order is in a state where tracking can be updated
    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update tracking for cancelled orders'
      });
    }

    // Update the tracking number
    order.trackingNumber = trackingNumber;
    
    // If the order is pending, update it to shipped
    if (order.status === 'pending' || order.status === 'processing') {
      order.status = 'shipped';
      console.log(`Automatically updating order status to 'shipped'`);
    }

    await order.save();
    console.log(`Successfully updated tracking information for order ${req.params.id}`);

    res.status(200).json({
      success: true,
      message: 'Order tracking information updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating order tracking:', error);
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

    // Process orders to add delivery destination information
    const formattedOrders = orders.map(order => {
      const orderObj = order.toObject();
      
      if (orderObj.shippingMethod === 'pickup' && orderObj.pickupPoint) {
        orderObj.deliveryDestination = {
          type: 'pickup',
          name: orderObj.pickupPoint.name,
          provider: orderObj.pickupPoint.provider,
          address: orderObj.pickupPoint.address,
          city: orderObj.pickupPoint.city,
          postalCode: orderObj.pickupPoint.postalCode,
          state: orderObj.pickupPoint.state,
          fullAddress: `${orderObj.pickupPoint.address}, ${orderObj.pickupPoint.city}, ${orderObj.pickupPoint.state} ${orderObj.pickupPoint.postalCode}`
        };
      } else {
        orderObj.deliveryDestination = {
          type: 'home',
          address: orderObj.shippingAddress.street,
          city: orderObj.shippingAddress.city,
          state: orderObj.shippingAddress.state,
          postalCode: orderObj.shippingAddress.postalCode,
          fullAddress: `${orderObj.shippingAddress.street}, ${orderObj.shippingAddress.city}, ${orderObj.shippingAddress.state} ${orderObj.shippingAddress.postalCode}`
        };
      }
      
      return orderObj;
    });

    res.status(200).json({
      success: true,
      count: formattedOrders.length,
      data: formattedOrders
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