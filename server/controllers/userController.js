const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { createError } = require('../utils/error');
const Address = require('../models/Address');

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

// Get detailed profile information for current authenticated user
exports.getCurrentUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -resetPasswordToken -resetPasswordExpires -verificationToken');
    
    if (!user) {
      return res.status(404).json(createError('User not found'));
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      error: error.message
    });
  }
};

// Get contact details for a specific user
exports.getUserContactDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Only allow access if requester is an admin or the user themselves
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to user contact details'
      });
    }
    
    const user = await User.findById(userId)
      .select('firstName lastName email phone countryCode location');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        countryCode: user.countryCode,
        location: user.location
      }
    });
  } catch (error) {
    console.error('Error fetching user contact details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user contact details',
      error: error.message
    });
  }
};

// Update current user's complete profile details
exports.updateCurrentUserDetails = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      countryCode, 
      location, 
      bio 
    } = req.body;

    // Check if email is being changed and if it's already in use
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: req.user.id } // Exclude current user from check
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use by another user'
        });
      }
    }
    
    // Prepare update fields
    const updateFields = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(countryCode && { countryCode }),
      ...(location && { location }),
      ...(bio && { bio }),
      lastActive: new Date()
    };
    
    // Update name field if firstName or lastName is changing
    if (firstName || lastName) {
      // Get current user to access current firstName/lastName if only one is being updated
      const currentUser = await User.findById(req.user.id);
      updateFields.name = `${firstName || currentUser.firstName} ${lastName || currentUser.lastName}`;
    }
    
    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires -verificationToken');
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
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

// Update seller profile
exports.updateSellerProfile = async (req, res) => {
  try {
    const { storeName, banner } = req.body;
    
    // Check if user is a seller
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        message: 'Only sellers can update their store profile'
      });
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $set: { 
          storeName,
          banner,
          lastActive: new Date()
        } 
      },
      { new: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires -verificationToken');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Seller profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating seller profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get seller profile details (banner and store name)
exports.getSellerProfileDetails = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;
    
    const seller = await User.findById(sellerId)
      .select('storeName banner firstName lastName rating totalSales');
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        storeName: seller.storeName,
        banner: seller.banner,
        firstName: seller.firstName,
        lastName: seller.lastName,
        rating: seller.rating,
        totalSales: seller.totalSales
      }
    });
  } catch (error) {
    console.error('Error fetching seller profile details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get seller info for product display
// @route   GET /api/users/seller-info/:sellerId
// @access  Public
exports.getSellerInfo = async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: 'Seller ID is required'
      });
    }

    const seller = await User.findById(sellerId).select('firstName lastName storeName banner location rating totalSales');
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Get the count of seller's orders
    const orderCount = await Order.countDocuments({ seller: sellerId });
    console.log(`Found ${orderCount} orders for seller ${sellerId}`);

    // Update the seller's totalSales with the order count
    if (orderCount > 0) {
      await User.findByIdAndUpdate(
        sellerId,
        { totalSales: orderCount },
        { new: true }
      );
      console.log(`Updated seller ${sellerId} totalSales to ${orderCount}`);
    }

    // Get the seller's default address
    const defaultAddress = await Address.findOne({ 
      userId: sellerId,
      isDefault: true
    });

    // Format the address for the response
    let formattedAddress = null;
    if (defaultAddress) {
      formattedAddress = {
        _id: defaultAddress._id,
        street: defaultAddress.street,
        city: defaultAddress.city,
        state: defaultAddress.state,
        postalCode: defaultAddress.postalCode,
        country: defaultAddress.country,
        formattedString: `${defaultAddress.street}, ${defaultAddress.city}, ${defaultAddress.state} ${defaultAddress.postalCode}, ${defaultAddress.country}`
      };
    }

    res.status(200).json({
      success: true,
      data: {
        _id: seller._id,
        name: `${seller.firstName} ${seller.lastName}`,
        storeName: seller.storeName || null,
        banner: seller.banner || null,
        location: seller.location || null,
        rating: seller.rating || 0,
        totalSales: orderCount || 0, // Use the fetched count instead of the database value
        defaultAddress: formattedAddress
      }
    });
  } catch (error) {
    console.error('Error getting seller info:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Promote user to seller
exports.promoteToSeller = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get current user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if the user is already a seller or admin
    let isAlreadySeller = false;
    let currentRole = "user"; // Default role
    
    // Check roles array first
    if (Array.isArray(user.roles)) {
      isAlreadySeller = user.roles.includes('seller') || user.roles.includes('admin');
      currentRole = user.roles[0] || "user";
      
      // If not already a seller, replace "user" with "seller"
      if (!isAlreadySeller) {
        // Replace "user" with "seller" instead of adding it
        user.roles = user.roles.filter(role => role !== 'user');
        // Make sure we don't have "seller" already before adding it
        if (!user.roles.includes('seller')) {
          user.roles.push('seller');
        }
      }
    } 
    // Check string role
    else if (typeof user.role === 'string') {
      isAlreadySeller = user.role === 'seller' || user.role === 'admin';
      currentRole = user.role;
      
      // Update to seller if not already a seller or admin and current role is "user"
      if (!isAlreadySeller && user.role === 'user') {
        user.role = 'seller';
      }
    }
    
    // Update isSeller flag if it exists
    if (user.hasOwnProperty('isSeller') && !user.isSeller) {
      user.isSeller = true;
    }
    
    // Only save the user if we've made changes
    if (!isAlreadySeller) {
      await user.save();
    }
    
    // Generate a new token with updated roles
    const { generateAuthToken } = require('../utils/auth');
    const token = generateAuthToken(user);
    
    // Return response based on whether the user was already a seller
    if (isAlreadySeller) {
      return res.status(200).json({
        success: true,
        token,
        message: 'User is already a seller',
        user: {
          id: user._id,
          email: user.email,
          role: Array.isArray(user.roles) ? user.roles[0] : user.role,
          roles: Array.isArray(user.roles) ? user.roles : [user.role],
          isSeller: user.isSeller,
          previousRole: currentRole
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      token,
      message: 'User successfully promoted to seller',
      user: {
        id: user._id,
        email: user.email,
        role: Array.isArray(user.roles) ? user.roles[0] : user.role,
        roles: Array.isArray(user.roles) ? user.roles : [user.role],
        isSeller: user.isSeller,
        previousRole: currentRole
      }
    });
  } catch (error) {
    console.error('Error promoting user to seller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to promote user to seller',
      error: error.message
    });
  }
};

// Update user role field to match roles array
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId format if provided
    if (userId && !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // If no userId is provided, use the authenticated user's ID
    const targetUserId = userId || req.user.id;
    
    // Get the user
    const user = await User.findById(targetUserId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    let updatedRole = req.body.role;
    
    // If no role is provided but the user has roles array, use the first role from there
    if (!updatedRole && Array.isArray(user.roles) && user.roles.length > 0) {
      updatedRole = user.roles[0];
    }
    
    // Ensure the role is valid
    if (!updatedRole || !['user', 'seller', 'admin'].includes(updatedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified. Must be "user", "seller", or "admin"'
      });
    }
    
    // Update only the role field
    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      { $set: { role: updatedRole } },
      { new: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires -verificationToken');
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Generate a new token with the updated role if it's the authenticated user
    let token = null;
    if (targetUserId === req.user?.id) {
      const { generateAuthToken } = require('../utils/auth');
      token = generateAuthToken(updatedUser);
    }
    
    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      token,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message
    });
  }
};

// Sync user's role field with roles array
exports.syncRoleWithRolesArray = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId format if provided
    if (userId && !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // If no userId is provided, use the authenticated user's ID
    const targetUserId = userId || req.user.id;
    
    // Get the user
    const user = await User.findById(targetUserId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Determine the correct role from the roles array
    let updatedRole = 'user'; // Default
    
    if (Array.isArray(user.roles) && user.roles.length > 0) {
      // Prioritize 'seller' or 'admin' over 'user'
      if (user.roles.includes('seller')) {
        updatedRole = 'seller';
      } else if (user.roles.includes('admin')) {
        updatedRole = 'admin';
      } else {
        updatedRole = user.roles[0]; // Use the first role in the array
      }
    }
    
    // Only update if the role needs to be changed
    if (user.role === updatedRole) {
      return res.status(200).json({
        success: true,
        message: 'Role is already synchronized',
        data: user
      });
    }
    
    // Update only the role field
    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      { $set: { role: updatedRole } },
      { new: true }
    ).select('-password -resetPasswordToken -resetPasswordExpires -verificationToken');
    
    // Generate a new token with the updated role if it's the authenticated user
    let token = null;
    if (targetUserId === req.user?.id) {
      const { generateAuthToken } = require('../utils/auth');
      token = generateAuthToken(updatedUser);
    }
    
    res.status(200).json({
      success: true,
      message: `User role updated from "${user.role}" to "${updatedRole}"`,
      token,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error syncing user role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync user role',
      error: error.message
    });
  }
};