const jwt = require('jsonwebtoken');

/**
 * Generates a JWT authentication token for a user
 * @param {Object} user - The user object containing id, email, and role information
 * @returns {string} JWT token
 */
exports.generateAuthToken = (user) => {
  // Make sure we're including the correct role information in the token
  const payload = {
    id: user._id,
    email: user.email,
    // If user has roles array, use it; otherwise fall back to single role or 'user' as default
    roles: Array.isArray(user.roles) ? user.roles : [user.role || 'user'],
    // Include single role field for backward compatibility, prioritizing 'seller' or 'admin' over 'user'
    role: Array.isArray(user.roles) ? 
          (user.roles.includes('seller') ? 'seller' : 
           (user.roles.includes('admin') ? 'admin' : 'user')) : 
          (user.role || 'user')
  };

  // If the user has a specific isSeller flag, include that too
  if (user.hasOwnProperty('isSeller') && user.isSeller) {
    payload.isSeller = true;
  }

  // Generate and return the JWT token
  // Token expires in 7 days (or as specified in the environment variable)
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Verifies a JWT token and returns the decoded payload
 * @param {string} token - The JWT token to verify
 * @returns {Object} The decoded payload
 */
exports.verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
}; 