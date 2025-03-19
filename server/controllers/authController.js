const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createError } = require('../utils/error');
const crypto = require('crypto');

exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(createError('Email is required'));
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });

    return res.json({
      exists: !!existingUser,
      email
    });
  } catch (error) {
    console.error('Error checking email:', error);
    return res.status(500).json(createError('Internal server error'));
  }
};

exports.register = async (req, res) => {
  try {
    const { email, password, title, firstName, lastName, countryCode, phone, role } = req.body;

    // Validate required fields
    const requiredFields = ['email', 'password', 'title', 'firstName', 'lastName', 'countryCode', 'phone'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json(createError(`Missing required fields: ${missingFields.join(', ')}`));
    }

    // Validate title enum
    if (!['Sir', 'Madam', 'Neutral'].includes(title)) {
      return res.status(400).json(createError('Invalid title. Must be one of: Sir, Madam, Neutral'));
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json(createError('Password must be at least 8 characters long'));
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(createError('User with this email already exists'));
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create new user
    const user = new User({
      email,
      password,
      title,
      firstName,
      lastName,
      countryCode,
      phone,
      role: role || 'buyer', // Set default role if not provided
      verificationToken,
      verificationExpires
    });

    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        title: user.title,
        firstName: user.firstName,
        lastName: user.lastName,
        countryCode: user.countryCode,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json(createError('Error registering user'));
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json(createError('Invalid credentials'));
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json(createError('Invalid credentials'));
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Log user data to debug
    console.log("User data from DB:", user);

    // Create user object with all required fields, using empty strings as fallbacks
    const userResponse = {
      id: user._id,
      email: user.email || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      title: user.title || "",
      countryCode: user.countryCode || "",
      phone: user.phone || "",
      role: user.role || "buyer"
    };

    // Log the response object
    console.log("Sending user response:", userResponse);

    res.json({
      accessToken,
      refreshToken,
      user: userResponse
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json(createError('Error logging in'));
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json(createError('Refresh token required'));
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json(createError('Invalid refresh token'));
    }

    // Generate new tokens
    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Update refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(401).json(createError('Invalid refresh token'));
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json(createError('User not found'));
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = Date.now() + 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // TODO: Send password reset email

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json(createError('Error processing request'));
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json(createError('Invalid or expired reset token'));
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json(createError('Error resetting password'));
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json(createError('Invalid or expired verification token'));
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json(createError('Error verifying email'));
  }
};

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '30d' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
};