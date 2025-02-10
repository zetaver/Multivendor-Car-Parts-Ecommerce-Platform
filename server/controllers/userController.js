const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { createError } = require('../utils/error');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json(createError('User not found'));
    }
    res.json(user);
  } catch (error) {
    res.status(500).json(createError('Error fetching profile'));
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, location, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $set: { 
          name,
          location,
          phone,
          lastActive: new Date()
        } 
      },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json(createError('Error updating profile'));
  }
};

exports.getSellerProfile = async (req, res) => {
  try {
    const seller = await User.findById(req.params.sellerId)
      .select('name avatar location rating totalSales joinDate');
    
    if (!seller) {
      return res.status(404).json(createError('Seller not found'));
    }

    res.json(seller);
  } catch (error) {
    res.status(500).json(createError('Error fetching seller profile'));
  }
};

exports.getSellerStats = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;

    const [activeListings, totalOrders, averageRating] = await Promise.all([
      Product.countDocuments({ seller: sellerId, status: 'active' }),
      Order.countDocuments({ seller: sellerId }),
      Product.aggregate([
        { $match: { seller: sellerId } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ])
    ]);

    res.json({
      activeListings,
      totalOrders,
      averageRating: averageRating[0]?.avgRating || 0
    });
  } catch (error) {
    res.status(500).json(createError('Error fetching seller stats'));
  }
};