// Payment Controller
const PaymentMethod = require('../models/Payment');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51QNEQqCB9m7BI3uyF4aF7xzIpXHuPfM6cmBIvq1iGe7jSVPMq6BKMxF9M0OapM8coC9VcZ99PwjzubJVtbdLVgk900ZPxuHlRU');

// Get all payment methods for a user
exports.getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.find({ userId: req.user.id });
    res.status(200).json({ success: true, data: paymentMethods });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Get a specific payment method by ID
exports.getPaymentMethod = async (req, res) => {
  try {
    const paymentMethod = await PaymentMethod.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!paymentMethod) {
      return res.status(404).json({ success: false, message: 'Payment method not found' });
    }
    
    res.status(200).json({ success: true, data: paymentMethod });
  } catch (error) {
    console.error('Error fetching payment method:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create a new payment method
exports.createPaymentMethod = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { paymentMethodId, billingDetails } = req.body;
    
    // Find the user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user already has a Stripe customer ID
    let stripeCustomerId = user.stripeCustomerId;
    
    // If not, create a new customer in Stripe
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        phone: user.phone
      });
      
      stripeCustomerId = customer.id;
      
      // Save the Stripe customer ID to the user
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }
    
    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    });
    
    // Retrieve the payment method details from Stripe
    const stripePaymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    // Create new payment method in our database
    const newPaymentMethod = new PaymentMethod({
      userId: req.user.id,
      stripeCustomerId,
      stripePaymentMethodId: paymentMethodId,
      cardType: stripePaymentMethod.card.brand,
      lastFourDigits: stripePaymentMethod.card.last4,
      expirationMonth: stripePaymentMethod.card.exp_month.toString(),
      expirationYear: stripePaymentMethod.card.exp_year.toString(),
      billingDetails: billingDetails || {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone
      }
    });

    const savedPaymentMethod = await newPaymentMethod.save();
    res.status(201).json({ success: true, data: savedPaymentMethod });
  } catch (error) {
    console.error('Error creating payment method:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Update an existing payment method
exports.updatePaymentMethod = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { billingDetails, isDefault } = req.body;
    
    let paymentMethod = await PaymentMethod.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!paymentMethod) {
      return res.status(404).json({ success: false, message: 'Payment method not found' });
    }
    
    // Update billing details if provided
    if (billingDetails) {
      paymentMethod.billingDetails = {
        ...paymentMethod.billingDetails,
        ...billingDetails
      };
    }
    
    // Update isDefault if specified
    if (isDefault !== undefined) {
      paymentMethod.isDefault = isDefault;
    }
    
    const updatedPaymentMethod = await paymentMethod.save();
    res.status(200).json({ success: true, data: updatedPaymentMethod });
  } catch (error) {
    console.error('Error updating payment method:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Delete a payment method
exports.deletePaymentMethod = async (req, res) => {
  try {
    const paymentMethod = await PaymentMethod.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!paymentMethod) {
      return res.status(404).json({ success: false, message: 'Payment method not found' });
    }
    
    const wasDefault = paymentMethod.isDefault;
    
    // Detach the payment method from the customer in Stripe
    await stripe.paymentMethods.detach(paymentMethod.stripePaymentMethodId);
    
    // Delete the payment method from our database
    await PaymentMethod.deleteOne({ _id: req.params.id });
    
    // If deleted payment method was default, set another payment method as default
    if (wasDefault) {
      const anotherPaymentMethod = await PaymentMethod.findOne({ userId: req.user.id });
      if (anotherPaymentMethod) {
        anotherPaymentMethod.isDefault = true;
        await anotherPaymentMethod.save();
      }
    }
    
    res.status(200).json({ success: true, message: 'Payment method deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Set a payment method as default
exports.setDefaultPaymentMethod = async (req, res) => {
  try {
    const paymentMethod = await PaymentMethod.findOne({ _id: req.params.id, userId: req.user.id });
    
    if (!paymentMethod) {
      return res.status(404).json({ success: false, message: 'Payment method not found' });
    }
    
    // Set this payment method as default
    paymentMethod.isDefault = true;
    await paymentMethod.save();
    
    res.status(200).json({ success: true, data: paymentMethod });
  } catch (error) {
    console.error('Error setting default payment method:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create a Stripe setup intent for securely collecting payment details
exports.createSetupIntent = async (req, res) => {
  try {
    // Find the user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user already has a Stripe customer ID
    let stripeCustomerId = user.stripeCustomerId;
    
    // If not, create a new customer in Stripe
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        phone: user.phone
      });
      
      stripeCustomerId = customer.id;
      
      // Save the Stripe customer ID to the user
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }
    
    // Create a setup intent
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
    });
    
    res.status(200).json({ 
      success: true, 
      clientSecret: setupIntent.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_51QNEQqCB9m7BI3uyCTXMJwGiBcJhnN1j8rXxNZEfVmVsqHMyRZ2YqWwBXErPBXexEhG2nrYCcNGJ7Aqbdbhygj9h00CcLESv3P'
    });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Process a payment with a saved payment method
exports.processPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { amount, currency, paymentMethodId, description } = req.body;
    
    // Find the payment method
    let paymentMethod;
    if (paymentMethodId) {
      paymentMethod = await PaymentMethod.findOne({ _id: paymentMethodId, userId: req.user.id });
      if (!paymentMethod) {
        return res.status(404).json({ success: false, message: 'Payment method not found' });
      }
    } else {
      // Use default payment method if no specific one is provided
      paymentMethod = await PaymentMethod.findOne({ userId: req.user.id, isDefault: true });
      if (!paymentMethod) {
        return res.status(400).json({ success: false, message: 'No default payment method found' });
      }
    }
    
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: currency || 'usd',
      customer: paymentMethod.stripeCustomerId,
      payment_method: paymentMethod.stripePaymentMethodId,
      description: description || 'Payment for order',
      confirm: true,
      off_session: true
    });
    
    res.status(200).json({ 
      success: true, 
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    
    if (error.type === 'StripeCardError') {
      return res.status(400).json({ 
        success: false, 
        message: error.message,
        code: error.code
      });
    }
    
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Create a payment intent for processing a payment
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'eur' } = req.body;
    
    // Validate the amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }
    
    // Find the user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user already has a Stripe customer ID
    let stripeCustomerId = user.stripeCustomerId;
    
    // If not, create a new customer in Stripe
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        phone: user.phone
      });
      
      stripeCustomerId = customer.id;
      
      // Save the Stripe customer ID to the user
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }
    
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // amount in cents
      currency: currency,
      customer: stripeCustomerId,
      metadata: {
        userId: req.user.id,
        // You can add more metadata as needed
      }
    });
    
    // Return the client secret to the client
    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment intent'
    });
  }
}; 