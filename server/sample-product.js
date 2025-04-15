const mongoose = require('mongoose');
const Product = require('./models/Product');

mongoose.connect('mongodb://localhost:27017/easycasse')
  .then(() => {
    console.log('Connected to MongoDB');
    return Product.findOne();
  })
  .then(product => {
    console.log('Sample product:', JSON.stringify(product, null, 2));
    return mongoose.disconnect();
  })
  .then(() => {
    console.log('Disconnected from MongoDB');
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
  }); 