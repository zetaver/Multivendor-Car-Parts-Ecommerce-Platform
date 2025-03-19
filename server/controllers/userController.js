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

exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || '';
    const role = req.query.role || '';

    let filter = {};
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select('firstName lastName email role status joinDate lastActive')
      .sort({ joinDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json(createError('Error fetching users'));
  }
};

exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(createError('User with this email already exists'));
    }
    
    // Create new user with bcrypt for password hashing
    const bcrypt = require('bcrypt');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create a more complete user object with all possible required fields
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || 'user',
      joinDate: new Date(),
      lastActive: new Date(),
      status: 'active',
      phone: '0000000000',
      countryCode: '+1',
      title: 'Mr',
      location: 'Not specified',
      avatar: '/default-avatar.png',
      bio: '',
      name: `${firstName} ${lastName}`, // Add name field
      isVerified: false,
      verificationToken: '',
      resetPasswordToken: '',
      resetPasswordExpires: null,
      // Add any other fields that might be required by your schema
      address: {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: ''
      },
      preferences: {},
      settings: {}
    });
    
    // Log the user object before saving
    console.log('Attempting to save user:', JSON.stringify(newUser, null, 2));
    
    // Save the user
    const savedUser = await newUser.save();
    
    // Return user without password
    const userResponse = savedUser.toObject();
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Provide more specific error message for client
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(field => 
        `${field}: ${error.errors[field].message}`
      ).join(', ');
      
      return res.status(400).json(createError(`Validation error: ${validationErrors}`));
    }
    
    res.status(500).json(createError(`Error creating user: ${error.message}`));
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json(createError('Invalid user ID format'));
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(createError('User not found'));
    }

    // Prevent deleting self
    if (userId === req.user.id) {
      return res.status(400).json(createError('Cannot delete your own account'));
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json(createError(`Error deleting user: ${error.message}`));
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, role, status, phone, countryCode, title } = req.body;
    
    // Validate userId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json(createError('Invalid user ID format'));
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(createError('User not found'));
    }
    
    // Check if email is being changed and if it's already in use
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json(createError('Email is already in use'));
      }
    }
    
    // Update user fields
    const updatedFields = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(email && { email }),
      ...(role && { role }),
      ...(status && { status }),
      ...(phone && { phone }),
      ...(countryCode && { countryCode }),
      ...(title && { title }),
      lastActive: new Date()
    };
    
    // If name is derived from firstName and lastName, update it too
    if (firstName || lastName) {
      updatedFields.name = `${firstName || user.firstName} ${lastName || user.lastName}`;
    }
    
    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updatedFields },
      { new: true }
    ).select('-password');
    
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json(createError(`Error updating user: ${error.message}`));
  }
};

// ✅ Get total number of users
exports.getTotalUsers = async (req, res) => {
  try {
    const count = await User.countDocuments(); // Count total users
    res.status(200).json({ totalUsers: count });
  } catch (error) {
    console.error("Error counting users:", error);
    res.status(500).json({ message: "Error counting users", error: error.message });
  }
};