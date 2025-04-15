const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  imageUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 🔹 Update slug before saving a new category
categorySchema.pre('save', function (next) {
  this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  this.updatedAt = Date.now();
  next();
});

// 🔹 Ensure slug is updated on `findOneAndUpdate`
categorySchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();

  if (update.name) {
    update.slug = update.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  }

  update.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Category', categorySchema);
