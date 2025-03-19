const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const setupSocket = require('./socket');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/adminRoutes'); 
const sellerRoutes = require('./routes/seller');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Set up socket.io
const io = setupSocket(server);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// API Routes
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/seller', sellerRoutes);

// For debugging - print all registered routes
console.log('All routes:');
app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`${Object.keys(r.route.methods).join(',')} ${r.route.path}`);
  }
});

// Add a test route to verify the server is working
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: { message: err.message || 'Something went wrong!' } });
});

// 404 handler - must be after all other routes
app.use((req, res) => {
  res.status(404).json({ error: { message: `Cannot ${req.method} ${req.path}` } });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.io server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });