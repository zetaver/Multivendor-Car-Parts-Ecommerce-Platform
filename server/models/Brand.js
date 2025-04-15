const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Version name is required'],
    trim: true
  }
}, { timestamps: true });

const modelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Model name is required'],
    trim: true
  },
  versions: [versionSchema]
}, { timestamps: true });

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Brand name is required'],
    unique: true,
    trim: true
  },
  logo: {
    type: String,
    default: ''
  },
  models: [modelSchema],
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Brand', brandSchema); 