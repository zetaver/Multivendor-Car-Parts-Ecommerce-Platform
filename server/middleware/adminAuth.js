// middleware/adminAuth.js
const User = require('../models/User'); // Adjust path as needed

exports.isAdmin = async (req, res, next) => {
  try {
    // Make sure user is authenticated first
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access forbidden: Admin privileges required' });
    }
    
    next();
  } catch (error) {
    console.error("Admin authorization error:", error);
    res.status(500).json({ message: "Server error during admin authorization" });
  }
};