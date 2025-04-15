const Banner = require('../models/Banner');
const { validationResult } = require('express-validator');

// Get all banners (admin only)
exports.getAllBanners = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only endpoint.'
      });
    }

    // Optional query parameters for filtering
    const { position, isActive } = req.query;
    
    // Build query object
    const query = {};
    
    // Add filters if provided
    if (position) query.position = position;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const banners = await Banner.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: banners.length,
      data: banners
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get active banners (public)
exports.getActiveBanners = async (req, res) => {
  try {
    const { position } = req.query;
    
    // Build query object
    const query = {
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    };
    
    // Add position filter if provided
    if (position) query.position = position;

    const banners = await Banner.find(query)
      .select('-createdBy')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: banners.length,
      data: banners
    });
  } catch (error) {
    console.error('Error fetching active banners:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get a specific banner by ID (admin only)
exports.getBannerById = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only endpoint.'
      });
    }

    const banner = await Banner.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email');
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    res.status(200).json({
      success: true,
      data: banner
    });
  } catch (error) {
    console.error('Error fetching banner:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create a new banner (admin only)
exports.createBanner = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only endpoint.'
      });
    }

    const { title, imageUrl, link, isActive, position, startDate, endDate } = req.body;

    // Create new banner
    const newBanner = new Banner({
      title,
      imageUrl,
      link: link || '#',
      isActive: isActive !== undefined ? isActive : true,
      position: position || 'home_top',
      startDate: startDate || new Date(),
      endDate: endDate || new Date(+new Date() + 30*24*60*60*1000), // Default 30 days from now
      createdBy: req.user.id
    });

    const savedBanner = await newBanner.save();

    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: savedBanner
    });
  } catch (error) {
    console.error('Error creating banner:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update a banner (admin only)
exports.updateBanner = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only endpoint.'
      });
    }

    const { title, imageUrl, link, isActive, position, startDate, endDate } = req.body;

    // Find the banner
    const banner = await Banner.findById(req.params.id);
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    // Update banner fields
    if (title) banner.title = title;
    if (imageUrl) banner.imageUrl = imageUrl;
    if (link) banner.link = link;
    if (isActive !== undefined) banner.isActive = isActive;
    if (position) banner.position = position;
    if (startDate) banner.startDate = startDate;
    if (endDate) banner.endDate = endDate;

    const updatedBanner = await banner.save();

    res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      data: updatedBanner
    });
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete a banner (admin only)
exports.deleteBanner = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only endpoint.'
      });
    }

    const banner = await Banner.findById(req.params.id);
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    await Banner.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Toggle banner active status (admin only)
exports.toggleBannerStatus = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only endpoint.'
      });
    }

    const banner = await Banner.findById(req.params.id);
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }

    // Toggle the isActive status
    banner.isActive = !banner.isActive;
    await banner.save();

    res.status(200).json({
      success: true,
      message: `Banner ${banner.isActive ? 'activated' : 'deactivated'} successfully`,
      data: banner
    });
  } catch (error) {
    console.error('Error toggling banner status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 