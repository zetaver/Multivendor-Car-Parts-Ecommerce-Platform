const jwt = require('jsonwebtoken');
const { createError } = require('../utils/error');

exports.authenticate = (req, res, next) => {
  try {
    // Log the request path to help with debugging
    console.log(`Auth request for path: ${req.method} ${req.originalUrl}`);
    
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Auth failed: No auth header or not Bearer token', {
        authHeader: authHeader ? `${authHeader.substring(0, 15)}...` : 'none',
        path: req.originalUrl
      });
      return res.status(401).json(createError('Authentication required. Please log in.'));
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('Auth failed: Token extraction failed');
      return res.status(401).json(createError('Invalid authentication token format'));
    }
    
    // Log token info without exposing the full token
    console.log(`Processing token: ${token.substring(0, 10)}...${token.substring(token.length - 5)}`);
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Add user from payload
      req.user = decoded;
      
      // For debugging only - log authenticated user
      console.log(`Authenticated user: ${decoded.id} (${decoded.email || 'no email'}) for ${req.method} ${req.originalUrl}`);
      
      next();
    } catch (jwtError) {
      // More specific JWT error handling
      if (jwtError.name === 'TokenExpiredError') {
        console.log('Auth failed: Token expired', {
          error: jwtError.message,
          expiredAt: jwtError.expiredAt,
          path: req.originalUrl
        });
        return res.status(401).json(createError('Your session has expired. Please log in again.'));
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        console.log('Auth failed: Invalid token', { 
          error: jwtError.message,
          path: req.originalUrl 
        });
        return res.status(401).json(createError('Invalid authentication token'));
      }
      
      // Handle other JWT errors
      console.error('JWT verification error:', jwtError);
      return res.status(401).json(createError('Authentication error'));
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json(createError('Internal server error during authentication'));
  }
};

exports.authorize = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(createError('Not authenticated'));
    }
    
    if (req.user.role !== role) {
      console.log(`Authorization failed: User ${req.user.id} has role ${req.user.role}, but ${role} is required`);
      return res.status(403).json(createError(`Access denied. ${role} role required.`));
    }
    
    next();
  };
};