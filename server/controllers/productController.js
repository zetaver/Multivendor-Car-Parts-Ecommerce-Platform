const Product = require('../models/Product');
const Setting = require('../models/Setting');
const Category = require('../models/Category');
// Create a new product
exports.createProduct = async (req, res) => {
  try {
    
    // Use a default seller ID if not authenticated
    const sellerId = req.user?.id || '64f8a9b25d42a8a8d0f7e3c7'; // Replace with a default ID

    // Fetch auto-approval setting - use lean() for better performance
    const setting = await Setting.findOne().lean();
    
    // Explicitly check the boolean value - convert to boolean if needed
    const isAutoApproved = setting && setting.autoApprove === true;

    // Add debug logging
    console.log("Auto-approve setting:", { 
      settingFound: !!setting,
      autoApproveValue: setting?.autoApprove,
      isAutoApproved: isAutoApproved 
    });

    // Determine product status
    const productStatus = isAutoApproved ? 'approved' : 'pending';
    
    console.log("Creating product with status:", productStatus);
    console.log("Creating product with seller ID:", sellerId);
    
    // Validate required fields
    const validationErrors = {};
    
    if (!req.body.title || req.body.title.trim().length < 5) {
      validationErrors.title = "Title is required and must be at least 5 characters";
    }
    
    if (!req.body.description || req.body.description.trim().length < 20) {
      validationErrors.description = "Description is required and must be at least 20 characters";
    }
    
    if (!req.body.price || isNaN(req.body.price) || req.body.price <= 0) {
      validationErrors.price = "Price is required and must be greater than zero";
    }
    
    if (!req.body.category) {
      validationErrors.category = "Category is required";
    }
    
    if (!req.body.oemNumber) {
      validationErrors.oem = "OEM number is required";
    }
    
    if (!req.body.images || !Array.isArray(req.body.images) || req.body.images.length < 3) {
      validationErrors.images = "At least 3 images are required";
    }
    
    if (!req.body.compatibility || !Array.isArray(req.body.compatibility) || req.body.compatibility.length === 0) {
      validationErrors.compatibility = "At least one vehicle compatibility entry is required";
    } else {
      // Validate each compatibility item
      const invalidItems = req.body.compatibility.some(
        item => !item.make || !item.model || !item.year
      );
      
      if (invalidItems) {
        validationErrors.compatibility = "All vehicle compatibility fields are required";
      }
    }
    
    // Return validation errors if any
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors
      });
    }

    // If validation passes, create the product
    const productData = {
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category || req.body.categoryId,
      oemNumber: req.body.oemNumber || req.body.oem,
      compatibility: req.body.compatibility,
      seller: sellerId,
      images: req.body.images,
      status: productStatus
    };

    const newProduct = new Product(productData);
    await newProduct.save();
    
    // Return the full product with timestamps
    const savedProduct = await Product.findById(newProduct._id);
    res.status(201).json(savedProduct);
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = {};
      for (const field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return res.status(400).json({
        message: "Validation failed",
        errors
      });
    }
    
    // Handle other errors
    console.error("Product creation error:", error);
    res.status(500).json({ message: "Server error creating product", error: error.message });
  }
};
// Get all products
exports.getProducts = async (req, res) => {
  try {
    let query = {};
    
    // For unauthenticated users or non-admin users, only show approved products
    if (!req.user || (req.user && req.user.role !== 'admin')) {
      query.status = 'approved';
    }
    
    // For sellers, show their own products (regardless of status) plus approved products
    if (req.user && req.user.role === 'seller') {
      query = {
        $or: [
          { seller: req.user._id }, // Their own products
          { status: 'approved' }    // Approved products
        ]
      };
    }
    
    const products = await Product.find(query)
      .populate('category seller')
      .select('title description price images status compatibility oemNumber');

    res.status(200).json(products);
  } catch (error) {
    console.error("Product retrieval error:", error);
    res.status(500).json({ message: error.message });
  }
};


// Get all products for admin (includes status information)
exports.adminGetAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('category seller')
      .select('title description price images status oemNumber compatibility'); // Include status field

    res.status(200).json(products);
  } catch (error) {
    console.error("Admin product retrieval error:", error);
    res.status(500).json({ message: "Server error retrieving products", error: error.message });
  }
};

// Update product status by admin
exports.updateProductStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    // Validate status value
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status value", 
        error: "Status must be 'pending', 'approved', or 'rejected'" 
      });
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Update only the status field
    product.status = status;
    await product.save();
    
    res.status(200).json({ 
      message: "Product status updated successfully", 
      product: {
        id: product._id,
        title: product.title,
        status: product.status
      }
    });
  } catch (error) {
    console.error("Status update error:", error);
    res.status(500).json({ message: "Server error updating product status", error: error.message });
  }
};
// Search products
exports.searchProducts = async (req, res) => {
  const { query } = req.query; // Get search query from query parameters
  try {
    const products = await Product.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }).populate('category seller');
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a product
exports.updateProduct = async (req, res) => {
  const { id } = req.params; // Get product ID from URL parameters
  try {
    // First, check if the product exists
    const existingProduct = await Product.findById(id);
    
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if the user has permission to update this product (must be the seller or an admin)
    if (req.user.role !== 'admin' && existingProduct.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to update this product' });
    }
    
    // Validate required fields
    const validationErrors = {};
    
    if (req.body.title && req.body.title.trim().length < 5) {
      validationErrors.title = "Title must be at least 5 characters";
    }
    
    if (req.body.description && req.body.description.trim().length < 20) {
      validationErrors.description = "Description must be at least 20 characters";
    }
    
    if (req.body.price && (isNaN(req.body.price) || req.body.price <= 0)) {
      validationErrors.price = "Price must be greater than zero";
    }
    
    if (req.body.oemNumber === '') {
      validationErrors.oem = "OEM number is required";
    }
    
    if (req.body.images && (!Array.isArray(req.body.images) || req.body.images.length === 0)) {
      validationErrors.images = "At least one image is required";
    }
    
    if (req.body.compatibility && (!Array.isArray(req.body.compatibility) || req.body.compatibility.length === 0)) {
      validationErrors.compatibility = "At least one vehicle compatibility entry is required";
    } else if (req.body.compatibility) {
      // Validate each compatibility item
      const invalidItems = req.body.compatibility.some(
        item => !item.make || !item.model || !item.year
      );
      
      if (invalidItems) {
        validationErrors.compatibility = "All vehicle compatibility fields are required";
      }
    }
    
    // Return validation errors if any
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors
      });
    }
    
    // Prepare the update data
    const updateData = {
      ...req.body
    };
    
    // Make sure the seller field cannot be changed
    delete updateData.seller;
    delete updateData.status; // Prevent status changes through this endpoint
    
    console.log("Updating product with data:", updateData);
    
    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('category');
    
    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error("Error updating product:", error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = {};
      for (const field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return res.status(400).json({
        message: "Validation failed",
        errors
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Server error updating product", 
      error: error.message 
    });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  const { id } = req.params; // Get product ID from URL parameters
  try {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(204).send(); // No content
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 


exports.setAutoApproval = async (req, res) => {
  try {
    const { autoApprove } = req.body;

    // Ensure autoApprove is treated as a boolean
    const autoApproveBoolean = autoApprove === true;

    console.log("Setting auto-approve to:", { 
      receivedValue: autoApprove, 
      convertedValue: autoApproveBoolean 
    });

    if (typeof autoApprove !== 'boolean') {
      return res.status(400).json({ message: "Invalid value. autoApprove must be true or false." });
    }

    let setting = await Setting.findOne();
    if (!setting) {
      setting = new Setting({ autoApprove: autoApproveBoolean });
    } else {
      setting.autoApprove = autoApproveBoolean;
    }

    await setting.save();

    // Verify the setting was saved correctly
    const updatedSetting = await Setting.findOne();
    console.log("Auto-approve setting after save:", { autoApprove: updatedSetting.autoApprove });

    res.status(200).json({ message: `Auto-approval set to ${autoApproveBoolean}`, setting });
  } catch (error) {
    console.error("Error updating auto-approval:", error);
    res.status(500).json({ message: "Server error updating auto-approval", error: error.message });
  }
};


// ✅ Get Auto-Approve Status
exports.getAutoApprovalStatus = async (req, res) => {
  try {
    const setting = await Setting.findOne();

    if (!setting) {
      return res.status(404).json({ message: 'Auto-approve setting not found' });
    }
    res.status(200).json({ autoApprove: setting.autoApprove });
  } catch (error) {
    console.error('Error fetching auto-approve status:', error);
    res.status(500).json({ message: 'Error fetching auto-approve status', error: error.message });
  }
};

// Get all products publicly (no auth required, only approved products)
// exports.getPublicProducts = async (req, res) => {
//   try {
//     const products = await Product.find({ status: 'approved' })
//       .populate('category')
//       .select('title description price images compatibility oemNumber'); // Only necessary public fields

//     res.status(200).json(products);
//   } catch (error) {
//     console.error("Public product retrieval error:", error);
//     res.status(500).json({ message: "Error retrieving products", error: error.message });
//   }
// };

// Get a single product by ID

exports.getProductById = async (req, res) => {
  try {
    console.log(`Fetching product with ID: ${req.params.id}`);

    // ✅ Fetch product and populate seller and category
    const product = await Product.findById(req.params.id)
      .populate("category seller")
      .select("title description price images oemNumber compatibility status seller createdAt");

    // ✅ If product not found
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ✅ Ensure `seller` is defined before accessing its properties
    if (!product.seller) {
      return res.status(500).json({ message: "Seller information is missing for this product" });
    }

    // Only check authentication if the product is not approved
    if (product.status !== "approved") {
      // For unapproved products, check if user is authenticated and has appropriate role
      if (!req.user) {
        return res.status(403).json({ message: "Unauthorized. Product is not publicly available." });
      }

      // Allow sellers to view their own unapproved products
      if (req.user.role === "seller" && product.seller?._id?.toString() === req.user._id?.toString()) {
        return res.status(200).json(product);
      }

      // Admins can view all products
      if (req.user.role === "admin") {
        return res.status(200).json(product);
      }

      // If none of the above conditions are met, deny access
      return res.status(403).json({ message: "Unauthorized. Product not available." });
    }

    // For approved products, allow access to everyone
    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Error retrieving product", error: error.message });
  }
};

// Get product count own Seller Side
exports.getProductCount = async (req, res) => {
  try {
    // Count only approved products by default
    const query = { status: 'approved' };
    
    // If user is authenticated and has admin role, count all products
    if (req.user && req.user.role === 'admin') {
      // Count all products regardless of status
      const total = await Product.countDocuments();
      const approved = await Product.countDocuments({ status: 'approved' });
      const pending = await Product.countDocuments({ status: 'pending' });
      const rejected = await Product.countDocuments({ status: 'rejected' });
      
      return res.status(200).json({
        total,
        approved,
        pending,
        rejected
      });
    }
    
    // For everyone else, just return the count of approved products
    const count = await Product.countDocuments(query);
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error counting products:", error);
    res.status(500).json({ message: "Error counting products", error: error.message });
  }
};

// Get total product count for admin
exports.getTotalProductCountAdmin = async (req, res) => {
  try {
    // Ensure only admins can access this route
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }

    // Count all products based on status
    const total = await Product.countDocuments();
    const approved = await Product.countDocuments({ status: 'approved' });
    const pending = await Product.countDocuments({ status: 'pending' });
    const rejected = await Product.countDocuments({ status: 'rejected' });

    res.status(200).json({
      total,
      approved,
      pending,
      rejected
    });
  } catch (error) {
    console.error("Error counting products:", error);
    res.status(500).json({ message: "Error counting products", error: error.message });
  }
};

// Get product counts for all sellers
exports.getSellerProductCounts = async (req, res) => {
  try {
    // Only admins should access this endpoint
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }

    // Use MongoDB aggregation to count products by seller
    const sellerProductCounts = await Product.aggregate([
      // Group by seller ID
      { 
        $group: { 
          _id: "$seller", 
          totalProducts: { $sum: 1 },
          approvedProducts: { 
            $sum: { 
              $cond: [{ $eq: ["$status", "approved"] }, 1, 0] 
            } 
          },
          pendingProducts: { 
            $sum: { 
              $cond: [{ $eq: ["$status", "pending"] }, 1, 0] 
            } 
          },
          rejectedProducts: { 
            $sum: { 
              $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] 
            } 
          }
        } 
      },
      // Lookup seller details from User collection
      { 
        $lookup: {
          from: "users", // The users collection name
          localField: "_id",
          foreignField: "_id",
          as: "sellerInfo"
        } 
      },
      // Project to reshape the output
      { 
        $project: {
          _id: 1,
          sellerId: "$_id",
          sellerInfo: { $arrayElemAt: ["$sellerInfo", 0] },
          totalProducts: 1,
          approvedProducts: 1,
          pendingProducts: 1,
          rejectedProducts: 1
        } 
      },
      // Final projection to clean up the response
      {
        $project: {
          _id: 0,
          sellerId: 1,
          sellerName: "$sellerInfo.firstName",
          sellerEmail: "$sellerInfo.email",
          sellerRole: "$sellerInfo.role",
          totalProducts: 1,
          approvedProducts: 1,
          pendingProducts: 1,
          rejectedProducts: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: sellerProductCounts
    });
  } catch (error) {
    console.error("Error fetching seller product counts:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching seller product counts", 
      error: error.message 
    });
  }
};

// Get product count for a specific seller
exports.getSellerProductCount = async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    // Verify that the requesting user is either the seller or an admin
    if (!req.user || (req.user.role !== 'admin' && req.user.id !== sellerId)) {
      return res.status(403).json({ 
        success: false,
        message: "Unauthorized. You can only view your own product count or must be an admin." 
      });
    }
    
    // Count products by status for the specified seller
    const total = await Product.countDocuments({ seller: sellerId });
    const approved = await Product.countDocuments({ seller: sellerId, status: 'approved' });
    const pending = await Product.countDocuments({ seller: sellerId, status: 'pending' });
    const rejected = await Product.countDocuments({ seller: sellerId, status: 'rejected' });
    
    res.status(200).json({
      success: true,
      data: {
        sellerId,
        total,
        approved,
        pending,
        rejected
      }
    });
  } catch (error) {
    console.error("Error fetching seller product count:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching seller product count", 
      error: error.message 
    });
  }
};

// Track product view
exports.trackProductView = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    
    // Find the product
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Increment view count
    if (!product.viewCount) {
      product.viewCount = 1;
    } else {
      product.viewCount += 1;
    }
    
    await product.save();
    
    res.status(200).json({
      success: true,
      viewCount: product.viewCount
    });
  } catch (error) {
    console.error('Error tracking product view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track product view',
      error: error.message
    });
  }
};

// Get product view count
exports.getProductViewCount = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }
    
    // Find the product
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.status(200).json({
      success: true,
      productId: id,
      viewCount: product.viewCount || 0
    });
  } catch (error) {
    console.error('Error fetching product view count:', error);
    res.status(500).json({
      success: false, 
      message: 'Failed to fetch product view count',
      error: error.message
    });
  }
};

// Get products by seller ID
exports.getProductsBySeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    console.log(`Fetching products for seller: ${sellerId} with status: approved`);
    
    const products = await Product.find({ 
      seller: sellerId,
      status: 'approved'
    })
    .sort({ createdAt: -1 })
    .populate('category', 'name');
    
    console.log(`Found ${products.length} approved products for seller ${sellerId}`);
    
    // Return in a standard format with success property
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error fetching seller products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching seller products',
      error: error.message 
    });
  }
};

// Get product by ID with seller details
exports.getProductWithSeller = async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Find the product with basic seller info
    const product = await Product.findById(productId)
      .populate('seller', 'firstName lastName storeName banner location rating totalSales avatar')
      .populate('category', 'name description imageUrl slug');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Format the seller data in the response
    const formattedProduct = {
      ...product.toObject(),
      seller: product.seller ? {
        _id: product.seller._id,
        name: `${product.seller.firstName} ${product.seller.lastName}`,
        storeName: product.seller.storeName || null,
        banner: product.seller.banner || null,
        location: product.seller.location || null,
        rating: product.seller.rating || 0,
        totalSales: product.seller.totalSales || 0,
        avatar: product.seller.avatar || null
      } : null
    };
    
    res.status(200).json({
      success: true,
      data: formattedProduct
    });
  } catch (error) {
    console.error('Error fetching product with seller:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get products by category ID (including subcategories)
exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // First, check if the category exists
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    // Get all subcategories recursively
    const getAllSubcategories = async (categoryId) => {
      const subcategories = await Category.find({ parentId: categoryId });
      let allSubcategoryIds = [categoryId];
      
      for (const subcategory of subcategories) {
        const childrenIds = await getAllSubcategories(subcategory._id);
        allSubcategoryIds = [...allSubcategoryIds, ...childrenIds];
      }
      
      return allSubcategoryIds;
    };
    
    // Get all subcategory IDs including the current category
    const categoryIds = await getAllSubcategories(categoryId);
    
    // Base query - filter by status for non-admin users
    let query = { category: { $in: categoryIds } };
    
    // For unauthenticated users or non-admin users, only show approved products
    if (!req.user || (req.user && req.user.role !== 'admin')) {
      query.status = 'approved';
    }
    
    // For sellers, show their own products (regardless of status) plus approved products from the category
    if (req.user && req.user.role === 'seller') {
      query = {
        $and: [
          { category: { $in: categoryIds } },
          {
            $or: [
              { seller: req.user._id }, // Their own products
              { status: 'approved' }    // Approved products
            ]
          }
        ]
      };
    }
    
    // Fetch products that belong to the category or any of its subcategories
    const products = await Product.find(query)
      .populate('category seller')
      .select('title description price images status compatibility oemNumber');
    
    // Get the category hierarchy for better context
    let categoryHierarchy = [];
    let currentCategory = category;
    categoryHierarchy.unshift({
      _id: currentCategory._id,
      name: currentCategory.name,
      description: currentCategory.description,
      imageUrl: currentCategory.imageUrl
    });
    
    // If the category has a parent, include the parent hierarchy
    while (currentCategory.parentId) {
      const parentCategory = await Category.findById(currentCategory.parentId);
      if (parentCategory) {
        categoryHierarchy.unshift({
          _id: parentCategory._id,
          name: parentCategory.name,
          description: parentCategory.description,
          imageUrl: parentCategory.imageUrl
        });
        currentCategory = parentCategory;
      } else {
        break;
      }
    }
    
    // Get subcategories for navigation
    const directSubcategories = await Category.find({ parentId: categoryId })
      .select('_id name description imageUrl');
    
    res.status(200).json({
      success: true,
      category: {
        _id: category._id,
        name: category.name,
        description: category.description,
        imageUrl: category.imageUrl,
        hierarchy: categoryHierarchy
      },
      subcategories: directSubcategories,
      productsCount: products.length,
      products
    });
  } catch (error) {
    console.error("Error fetching products by category:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching products by category", 
      error: error.message 
    });
  }
};

// Get filtered products
exports.getFilteredProducts = async (req, res) => {
  try {
    const { brandId, modelId, versionId, yearFilter, category, minPrice, maxPrice } = req.query;
    
    // Log the request for debugging
    console.log("Filter request:", { brandId, modelId, versionId, yearFilter, category, minPrice, maxPrice });
    
    // Build filter query
    const filter = {};
    
    // Add status filter for non-admin users (only show approved products)
    filter.status = 'approved';
    
    // If category is provided, add it to the filter
    if (category) filter.category = category;
    
    // Price filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Get products with basic filters first
    let products = await Product.find(filter)
      .populate('category')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${products.length} products matching basic filters before compatibility filtering`);
    
    // If we have any compatibility filters, apply them
    if (brandId) {
      // For now, instead of trying to look up the brand name, just use the brandId directly
      // This assumes that brandId matches what's stored in compatibility.make
      console.log(`Filtering by brandId: ${brandId}`);
      
      products = products.filter(product => {
        // Skip products without compatibility data
        if (!product.compatibility || product.compatibility.length === 0) return false;
        
        // Check if any compatibility entry matches the brand
        return product.compatibility.some(comp => comp.make === brandId);
      });
      
      console.log(`After brand filtering: ${products.length} products left`);
    }
    
    if (modelId) {
      console.log(`Filtering by model name: ${modelId}`);
      
      products = products.filter(product => {
        if (!product.compatibility || product.compatibility.length === 0) return false;
        return product.compatibility.some(comp => comp.model === modelId);
      });
      
      console.log(`After model filtering: ${products.length} products left`);
    }
    
    // Handle year filtering - check both versionId and yearFilter
    if (yearFilter || versionId) {
      // Use yearFilter if provided, otherwise fall back to versionId
      const yearValue = yearFilter || versionId;
      console.log(`Filtering by year value: ${yearValue}`);
      
      // Parse as number if it looks like a year
      const yearNum = parseInt(yearValue, 10);
      const isYearNumeric = !isNaN(yearNum);
      console.log(`Parsed year: ${yearNum}, isNumeric: ${isYearNumeric}`);
      
      // Log the first few products' compatibility data to see what we're working with
      const sampleProducts = products.slice(0, 3);
      sampleProducts.forEach((product, index) => {
        console.log(`Sample product ${index + 1} compatibility:`, 
          product.compatibility ? JSON.stringify(product.compatibility) : 'No compatibility data');
      });
      
      products = products.filter(product => {
        if (!product.compatibility || product.compatibility.length === 0) {
          return false;
        }
        
        // Check if product has a direct version field match (in case versionId is an actual ID)
        if (product.version && product.version.toString() === versionId) {
          console.log(`✓ Direct version ID match: product.version=${product.version} matches versionId=${versionId}`);
          return true;
        }
        
        const matches = product.compatibility.some(comp => {
          // Log the comparison being made for debugging
          console.log(`Comparing version/year - Product: ${product.title}, Compatibility year: ${comp.year} (${typeof comp.year}), Looking for: ${yearValue} (parsed: ${yearNum})`);
          
          // If we have a numeric year and the compatibility year is a number, do direct comparison
          if (isYearNumeric && typeof comp.year === 'number') {
            const match = comp.year === yearNum;
            if (match) console.log(`✓ Number match found: ${comp.year} === ${yearNum}`);
            return match;
          }
          
          // String comparison fallback
          const compYearStr = comp.year?.toString() || '';
          const yearValueStr = yearValue?.toString() || '';
          
          const match = compYearStr === yearValueStr;
          if (match) console.log(`✓ String match found: "${compYearStr}" === "${yearValueStr}"`);
          return match;
        });
        
        return matches;
      });
      
      console.log(`After year filtering: ${products.length} products left`);
    }

    console.log(`Final result: ${products.length} products match all filters`);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error("Error getting filtered products:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving filtered products",
      error: error.message
    });
  }
};

// Get search suggestions
exports.getSearchSuggestions = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    console.log(`Getting search suggestions for: "${query}"`);
    
    // Find products that match the query in title, description, or OEM number
    const products = await Product.find({
      $and: [
        { status: 'approved' },
        {
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { oemNumber: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .select('title')
    .limit(10);
    
    // Extract common search phrases from matching products
    const titles = products.map(product => product.title);
    
    // Also check for category matches
    const categories = await Category.find({
      name: { $regex: query, $options: 'i' }
    })
    .select('name')
    .limit(5);
    
    const categoryNames = categories.map(category => category.name);
    
    // Create suggestion phrases based on the query
    // For example: "ski" might suggest "ski boots", "ski jacket", etc.
    const commonPhrases = [
      `${query} for sale`,
      `Best ${query}`,
      `${query.charAt(0).toUpperCase() + query.slice(1)}`,
      // Add product type variations if needed
    ];
    
    // Combine all suggestions, remove duplicates, and limit to 10
    let suggestions = [...titles, ...categoryNames, ...commonPhrases];
    
    // Remove duplicates and items that are too similar
    suggestions = suggestions.filter((item, index, self) => {
      return index === self.findIndex(t => (
        t.toLowerCase() === item.toLowerCase()
      ));
    });
    
    // Sort by relevance (here simplified to just putting exact matches first)
    suggestions.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const queryLower = query.toLowerCase();
      
      if (aLower.startsWith(queryLower) && !bLower.startsWith(queryLower)) return -1;
      if (!aLower.startsWith(queryLower) && bLower.startsWith(queryLower)) return 1;
      return 0;
    });
    
    // Limit to 10 suggestions
    suggestions = suggestions.slice(0, 10);
    
    console.log(`Returning ${suggestions.length} search suggestions`);
    
    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error("Error getting search suggestions:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving search suggestions",
      error: error.message
    });
  }
};

// Get new arrivals - most recently added products
exports.getNewArrivals = async (req, res) => {
  try {
    // Get limit from query parameter or use default of 8
    const limit = parseInt(req.query.limit) || 8;
    
    // Find approved products, sort by createdAt (newest first), and limit to requested count
    const products = await Product.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('category', 'name')
      .populate('seller', 'firstName lastName')
      .select('title price images createdAt oemNumber viewCount');
    
    console.log(`Returning ${products.length} new arrival products`);
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error fetching new arrivals:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching new arrivals',
      error: error.message
    });
  }
};

// Get best sellers - highest rated or most sold products
exports.getBestSellers = async (req, res) => {
  try {
    // Get limit from query parameter or use default of 8
    const limit = parseInt(req.query.limit) || 8;
    
    // Determine sort criteria (rating, sales, viewCount)
    const sortBy = req.query.sortBy || 'viewCount';
    
    // Define valid sort fields and default to viewCount if invalid
    const validSortFields = ['viewCount', 'rating', 'soldCount'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'viewCount';
    
    console.log(`Fetching best sellers sorted by: ${sortField}`);
    
    // Build sort object for MongoDB
    const sortObj = {};
    sortObj[sortField] = -1; // -1 for descending order
    
    // Add secondary sort by createdAt to ensure consistent ordering
    sortObj.createdAt = -1;
    
    // Find approved products, sort by selected criteria, and limit to requested count
    const products = await Product.find({ 
      status: 'approved',
      // Ensure the sort field exists and has a value
      [sortField]: { $exists: true, $ne: null }
    })
      .sort(sortObj)
      .limit(limit)
      .populate('category', 'name')
      .populate('seller', 'firstName lastName')
      .select('title price images createdAt oemNumber viewCount rating soldCount');
    
    console.log(`Returning ${products.length} best seller products`);
    
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error fetching best sellers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching best sellers',
      error: error.message
    });
  }
};


