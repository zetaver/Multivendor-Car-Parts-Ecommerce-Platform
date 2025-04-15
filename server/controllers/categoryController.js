const Category = require('../models/Category');
const { createError } = require('../utils/error');

// ✅ Get all categories (with parent category details)
exports.getAllCategories = async (req, res) => {
  try {
    // Fetch all categories from DB
    const categories = await Category.find().lean(); // Use `.lean()` for better performance

    // Helper function to build category tree
    const buildCategoryTree = (categories, parentId = null) => {
      return categories
        .filter(category => (category.parentId ? category.parentId.toString() : null) === (parentId ? parentId.toString() : null))
        .map(category => ({
          ...category,
          subcategories: buildCategoryTree(categories, category._id) // Recursively attach subcategories
        }));
    };

    // Create the tree from root categories (where parentId is `null`)
    const categoryTree = buildCategoryTree(categories);

    res.status(200).json(categoryTree);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Error fetching categories", error });
  }
};



// ✅ Get category by ID (including parent category details)
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate('parentId', 'name');
    if (!category) {
      return res.status(404).json(createError('Category not found'));
    }
    res.status(200).json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json(createError('Error fetching category'));
  }
};

// ✅ Create a new category (supports parent-child relationship)
exports.createCategory = async (req, res) => {
  try {
    const { name, description, parentId, imageUrl } = req.body;

    // Validate input
    if (!name || !description) {
      return res.status(400).json(createError('Name and description are required'));
    }

    // Check if category already exists
    const existingCategory = await Category.findOne({ name, parentId });
    if (existingCategory) {
      return res.status(400).json(createError('Category with this name already exists'));
    }

    // Create new category
    const newCategory = new Category({
      name,
      description,
      parentId: parentId || null, // Allow categories without parent
      imageUrl // Save the image URL
    });

    const savedCategory = await newCategory.save();

    // If there's a parentId, push this category to the parent's subcategories
    if (parentId) {
      await Category.findByIdAndUpdate(parentId, {
        $push: { subcategories: savedCategory._id }
      });
    }

    // Respond with the saved category including the imageUrl
    res.status(201).json({
      ...savedCategory.toObject(), // Convert to plain object
      imageUrl // Include the image URL in the response
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json(createError(`Error creating category: ${error.message}`));
  }
};

// ✅ Update category (ensures slug updates & updates `updatedAt`)
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, parentId ,imageUrl} = req.body;

    // Find the category
    let category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json(createError('Category not found'));
    }

    // Update fields
    category.name = name || category.name;
    category.description = description || category.description;
    category.parentId = parentId || category.parentId;
    category.imageUrl = imageUrl || category.imageUrl;

    // Auto-update slug if name changes
    if (name) {
      category.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }

    category.updatedAt = Date.now();
    await category.save();

    res.status(200).json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json(createError('Error updating category'));
  }
};

// ✅ Delete category
exports.deleteCategory = async (req, res) => {
  try {
    // Check if category exists
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json(createError('Category not found'));
    }

    // Ensure no subcategories exist before deleting
    const subcategories = await Category.find({ parentId: req.params.id });
    if (subcategories.length > 0) {
      return res.status(400).json(createError('Cannot delete category with subcategories. Delete subcategories first.'));
    }

    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json(createError('Error deleting category'));
  }
};

// ✅ Get total number of categories
exports.getTotalCategories = async (req, res) => {
  try {
    const count = await Category.countDocuments(); // Count total categories
    res.status(200).json({ totalCategories: count });
  } catch (error) {
    console.error("Error counting categories:", error);
    res.status(500).json({ message: "Error counting categories", error: error.message });
  }
};

// ✅ Search categories and subcategories
exports.searchCategories = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json(createError('Search query is required'));
    }

    // Create a case-insensitive regex for the search query
    const searchRegex = new RegExp(query, 'i');
    
    // Search in both name and description fields
    const categories = await Category.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ]
    }).lean();

    // If searching for a subcategory, we also want to include parent categories
    // Get parent IDs of matching categories
    const parentIds = categories
      .filter(cat => cat.parentId)
      .map(cat => cat.parentId);
    
    // Find parent categories that aren't already in our results
    const parentCategories = await Category.find({
      _id: { $in: parentIds },
      _id: { $nin: categories.map(cat => cat._id) }
    }).lean();
    
    // Combine all categories
    const allCategories = [...categories, ...parentCategories];
    
    // Build a tree structure for better client-side navigation
    const buildCategoryTree = (categories, parentId = null) => {
      return categories
        .filter(category => (category.parentId ? category.parentId.toString() : null) === (parentId ? parentId.toString() : null))
        .map(category => ({
          ...category,
          subcategories: buildCategoryTree(categories, category._id)
        }));
    };

    // Create tree from root categories (parentId is null)
    const categoryTree = buildCategoryTree(allCategories);
    
    res.status(200).json({
      results: categoryTree,
      count: categories.length,
      query
    });
  } catch (error) {
    console.error("Error searching categories:", error);
    res.status(500).json(createError(`Error searching categories: ${error.message}`));
  }
};

// ✅ Get top categories sorted by sales count
exports.getTopCategories = async (req, res) => {
  try {
    const { limit = 5, sortBy = 'sales' } = req.query;
    const limitNum = parseInt(limit, 10);
    
    // We need to import the Order and Product models
    const Order = require('../models/Order');
    const Product = require('../models/Product');
    
    // Aggregate pipeline to get categories with their sales count
    const topCategories = await Order.aggregate([
      // Remove the status filter to include all orders
      // { $match: { status: 'delivered', paymentStatus: 'completed' } },
      
      // Unwind the items array to work with individual items
      { $unwind: '$items' },
      
      // Lookup to get product details for each order item
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      
      // Unwind the productDetails array (should be just one product per item)
      { $unwind: '$productDetails' },
      
      // Group by category and sum the quantities
      {
        $group: {
          _id: '$productDetails.category',
          salesCount: { $sum: '$items.quantity' },
          orderCount: { $sum: 1 },  // Count each order item as 1
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      
      // Lookup to get category details
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      
      // Unwind the categoryDetails array
      { $unwind: '$categoryDetails' },
      
      // Project the fields we want to return
      {
        $project: {
          _id: 1,
          name: '$categoryDetails.name',
          description: '$categoryDetails.description',
          imageUrl: '$categoryDetails.imageUrl',
          salesCount: 1,
          orderCount: 1,
          totalRevenue: 1
        }
      },
      
      // Sort by salesCount or orderCount based on sortBy parameter
      { $sort: sortBy === 'orders' ? { orderCount: -1 } : { salesCount: -1 } },
      
      // Limit the results
      { $limit: limitNum }
    ]);
    
    res.status(200).json({
      success: true,
      count: topCategories.length,
      data: topCategories
    });
  } catch (error) {
    console.error("Error fetching top categories:", error);
    res.status(500).json(createError(`Error fetching top categories: ${error.message}`));
  }
};
