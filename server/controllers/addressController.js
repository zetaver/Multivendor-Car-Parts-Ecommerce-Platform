const Address = require('../models/Address');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Get all addresses for a user
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user.id });
    res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get a specific address by ID
exports.getAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    res.status(200).json({ success: true, data: address });
  } catch (error) {
    console.error('Error fetching address:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create a new address
exports.createAddress = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { street, city, state, postalCode, country, isDefault } = req.body;
    
    // Find the user to get their fullName and phone
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Create new address
    const newAddress = new Address({
      userId: req.user.id,
      street,
      city,
      state,
      postalCode,
      country,
      isDefault: isDefault || false
    });

    // If this is the user's first address, make it default
    const addressCount = await Address.countDocuments({ userId: req.user.id });
    if (addressCount === 0) {
      newAddress.isDefault = true;
    }

    const savedAddress = await newAddress.save();
    res.status(201).json({ success: true, data: savedAddress });
  } catch (error) {
    console.error('Error creating address:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update an existing address
exports.updateAddress = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { street, city, state, postalCode, country, isDefault } = req.body;
    
    let address = await Address.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    // Update address fields
    address.street = street || address.street;
    address.city = city || address.city;
    address.state = state || address.state;
    address.postalCode = postalCode || address.postalCode;
    address.country = country || address.country;
    
    // Only update isDefault if specified
    if (isDefault !== undefined) {
      address.isDefault = isDefault;
    }
    
    const updatedAddress = await address.save();
    res.status(200).json({ success: true, data: updatedAddress });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete an address
exports.deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    const wasDefault = address.isDefault;
    
    await Address.deleteOne({ _id: req.params.id });
    
    // If deleted address was default, set another address as default
    if (wasDefault) {
      const anotherAddress = await Address.findOne({ userId: req.user.id });
      if (anotherAddress) {
        anotherAddress.isDefault = true;
        await anotherAddress.save();
      }
    }
    
    res.status(200).json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Set an address as default
exports.setDefaultAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    // Set this address as default
    address.isDefault = true;
    await address.save();
    
    res.status(200).json({ success: true, data: address });
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Set current user's most recent address as default
exports.setCurrentAddressAsDefault = async (req, res) => {
  try {
    // First unset default on all addresses
    await Address.updateMany(
      { userId: req.user.id },
      { $set: { isDefault: false } }
    );
    
    // Find the most recent address for the user
    const recentAddress = await Address.findOne(
      { userId: req.user.id },
      {},
      { sort: { 'createdAt': -1 } }
    );
    
    if (!recentAddress) {
      return res.status(404).json({ 
        success: false, 
        message: 'No addresses found for user' 
      });
    }
    
    // Set as default
    recentAddress.isDefault = true;
    await recentAddress.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Current address set as default',
      data: recentAddress 
    });
  } catch (error) {
    console.error('Error setting current address as default:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
}; 