const Product = require('../models/Product');
const Setting = require('../models/Setting');
// Create a new product
exports.createProduct = async (req, res) => {
  try {
    
    // Use a default seller ID if not authenticated
    const sellerId = req.user?.id || '64f8a9b25d42a8a8d0f7e3c7'; // Replace with a default ID

    // Fetch auto-approval setting
    const setting = await Setting.findOne();
    const isAutoApproved = setting ? setting.autoApprove : false;

    // Determine product status
    const productStatus = isAutoApproved ? 'approved' : 'pending';
    
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
    const product = await Product.findByIdAndUpdate(id, req.body, { new: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
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

    if (typeof autoApprove !== 'boolean') {
      return res.status(400).json({ message: "Invalid value. autoApprove must be true or false." });
    }

    let setting = await Setting.findOne();
    if (!setting) {
      setting = new Setting({ autoApprove });
    } else {
      setting.autoApprove = autoApprove;
    }

    await setting.save();

    res.status(200).json({ message: `Auto-approval set to ${autoApprove}`, setting });
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



