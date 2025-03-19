const jwt = require('jsonwebtoken');
const { createError } = require('../utils/error');

exports.authenticate = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(createError('No token, authorization denied'));
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json(createError('No token, authorization denied'));
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user from payload
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json(createError('Token is not valid'));
  }
};

exports.authorize = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(createError('Not authenticated'));
    }
    
    if (req.user.role !== role) {
      return res.status(403).json(createError('Not authorized'));
    }
    
    next();
  };
};