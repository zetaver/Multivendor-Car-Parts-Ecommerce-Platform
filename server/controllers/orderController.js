const Order = require('../models/Order');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const { createError } = require('../utils/error');
const { io } = require('../socket');

exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    // Start transaction
    const session = await Order.startSession();
    session.startTransaction();

    try {
      // Calculate total amount and validate stock
      let totalAmount = 0;
      for (const item of items) {
        const product = await Product.findById(item.product).session(session);
        if (!product) {
          throw new Error(`Product ${item.product} not found`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.title}`);
        }
        totalAmount += product.price * item.quantity;

        // Update stock
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } },
          { session }
        );
      }

      const order = new Order({
        buyer: req.user.id,
        seller: items[0].product.seller,
        items,
        totalAmount,
        shippingAddress,
        paymentMethod
      });

      await order.save({ session });

      // Create notifications
      const buyerNotification = new Notification({
        user: req.user.id,
        type: 'order',
        title: 'Order Placed',
        message: `Your order #${order._id} has been placed successfully`,
        data: { orderId: order._id }
      });

      const sellerNotification = new Notification({
        user: items[0].product.seller,
        type: 'order',
        title: 'New Order',
        message: `You have received a new order #${order._id}`,
        data: { orderId: order._id }
      });

      await Promise.all([
        buyerNotification.save({ session }),
        sellerNotification.save({ session })
      ]);

      await session.commitTransaction();

      // Emit real-time notifications
      io.to(`user:${req.user.id}`).emit('notification', buyerNotification);
      io.to(`user:${items[0].product.seller}`).emit('notification', sellerNotification);

      res.status(201).json(order);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    res.status(500).json(createError(error.message || 'Error creating order'));
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = {};

    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort('-createdAt')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('buyer', 'name')
      .populate('seller', 'name')
      .populate('items.product', 'title images');

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (error) {
    res.status(500).json(createError('Error fetching orders'));
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name email')
      .populate('seller', 'name email')
      .populate('items.product', 'title images price');

    if (!order) {
      return res.status(404).json(createError('Order not found'));
    }

    // Check authorization
    if (order.buyer.toString() !== req.user.id && 
        order.seller.toString() !== req.user.id && 
        req.user.role !== 'admin') {
      return res.status(403).json(createError('Not authorized'));
    }

    res.json(order);
  } catch (error) {
    res.status(500).json(createError('Error fetching order'));
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json(createError('Order not found'));
    }

    // Check authorization
    if (order.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json(createError('Not authorized'));
    }

    order.status = status;
    await order.save();

    // Create notification
    const notification = new Notification({
      user: order.buyer,
      type: 'order',
      title: 'Order Status Updated',
      message: `Your order #${order._id} status has been updated to ${status}`,
      data: { orderId: order._id, status }
    });

    await notification.save();

    // Emit real-time notification
    io.to(`user:${order.buyer}`).emit('notification', notification);
    io.to(`order:${order._id}`).emit('orderStatusUpdate', {
      orderId: order._id,
      status
    });

    res.json(order);
  } catch (error) {
    res.status(500).json(createError('Error updating order status'));
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json(createError('Order not found'));
    }

    // Check authorization
    if (order.buyer.toString() !== req.user.id && 
        order.seller.toString() !== req.user.id && 
        req.user.role !== 'admin') {
      return res.status(403).json(createError('Not authorized'));
    }

    // Only allow cancellation if order is pending or processing
    if (!['pending', 'processing'].includes(order.status)) {
      return res.status(400).json(createError('Order cannot be cancelled'));
    }

    // Start transaction
    const session = await Order.startSession();
    session.startTransaction();

    try {
      // Update order status
      order.status = 'cancelled';
      await order.save({ session });

      // Restore product stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } },
          { session }
        );
      }

      // Create notifications
      const buyerNotification = new Notification({
        user: order.buyer,
        type: 'order',
        title: 'Order Cancelled',
        message: `Your order #${order._id} has been cancelled`,
        data: { orderId: order._id }
      });

      const sellerNotification = new Notification({
        user: order.seller,
        type: 'order',
        title: 'Order Cancelled',
        message: `Order #${order._id} has been cancelled`,
        data: { orderId: order._id }
      });

      await Promise.all([
        buyerNotification.save({ session }),
        sellerNotification.save({ session })
      ]);

      await session.commitTransaction();

      // Emit real-time notifications
      io.to(`user:${order.buyer}`).emit('notification', buyerNotification);
      io.to(`user:${order.seller}`).emit('notification', sellerNotification);
      io.to(`order:${order._id}`).emit('orderCancelled', {
        orderId: order._id
      });

      res.json(order);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    res.status(500).json(createError('Error cancelling order'));
  }
};

exports.getSellerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { seller: req.user.id };
    
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort('-createdAt')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('buyer', 'name')
      .populate('items.product', 'title images');

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (error) {
    res.status(500).json(createError('Error fetching seller orders'));
  }
};

exports.getBuyerOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { buyer: req.user.id };
    
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort('-createdAt')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('seller', 'name')
      .populate('items.product', 'title images');

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (error) {
    res.status(500).json(createError('Error fetching buyer orders'));
  }
};