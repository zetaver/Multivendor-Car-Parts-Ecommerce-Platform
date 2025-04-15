const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/easycasse')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Get all products
      const products = await Product.find();
      console.log(`Found ${products.length} products`);
      
      // Get unique seller IDs
      const sellerIds = [...new Set(products.map(product => product.seller?.toString()).filter(Boolean))];
      console.log(`Found ${sellerIds.length} unique sellers`);
      
      // Update each seller
      let updatedCount = 0;
      
      for (const sellerId of sellerIds) {
        const user = await User.findById(sellerId);
        
        if (!user) {
          console.log(`User with ID ${sellerId} not found`);
          continue;
        }
        
        let updated = false;
        
        // Update roles array if it exists
        if (Array.isArray(user.roles)) {
          if (!user.roles.includes('seller')) {
            console.log(`Adding 'seller' role to user ${user.email || user._id}`);
            // Remove 'user' role if it exists
            user.roles = user.roles.filter(role => role !== 'user');
            // Add 'seller' role
            user.roles.push('seller');
            updated = true;
          }
        } 
        // Update role string if it exists
        else if (typeof user.role === 'string') {
          if (user.role !== 'seller' && user.role !== 'admin') {
            console.log(`Changing role from '${user.role}' to 'seller' for user ${user.email || user._id}`);
            user.role = 'seller';
            updated = true;
          }
        }
        
        // Update isSeller property if it exists
        if (user.hasOwnProperty('isSeller') && !user.isSeller) {
          console.log(`Setting isSeller flag to true for user ${user.email || user._id}`);
          user.isSeller = true;
          updated = true;
        }
        
        if (updated) {
          await user.save();
          updatedCount++;
          console.log(`Updated user ${user.email || user._id} to seller role`);
        } else {
          console.log(`User ${user.email || user._id} already has seller role`);
        }
      }
      
      console.log(`Updated ${updatedCount} users to seller role`);
    } catch (error) {
      console.error('Error updating seller roles:', error);
    } finally {
      mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  }); 