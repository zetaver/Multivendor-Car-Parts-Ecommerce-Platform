const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const setupSocket = require('./socket');
const apiRoutes = require('./routes/api');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = setupSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Make io accessible to route handlers
app.set('io', io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});