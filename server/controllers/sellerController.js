const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// Add seller analytics controller
exports.getSellerAnalytics = async (req, res) => {
  try {
    console.log('Getting analytics for seller:', req.user._id);
    const sellerId = req.user._id;
    
    // Get total sales and orders
    const orders = await Order.find({
      'seller._id': sellerId
    });
    
    console.log(`Found ${orders.length} orders for seller ${sellerId}`);
    
    const totalSales = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    
    // Calculate monthly and weekly sales
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    
    const monthlySales = orders
      .filter(order => new Date(order.createdAt) >= startOfMonth)
      .reduce((sum, order) => sum + Number(order.totalAmount), 0);
    
    const weeklySales = orders
      .filter(order => new Date(order.createdAt) >= startOfWeek)
      .reduce((sum, order) => sum + Number(order.totalAmount), 0);
    
    // Count all order statuses
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const processingOrders = orders.filter(order => order.status === 'processing').length;
    const shippedOrders = orders.filter(order => order.status === 'shipped').length;
    const completedOrders = orders.filter(order => order.status === 'delivered').length;
    const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
    
    // Get product counts
    const products = await Product.find({ seller: sellerId });
    console.log(`Found ${products.length} products for seller ${sellerId}`);
    
    // Get monthly sales data
    const monthlySalesData = Array(12).fill(0);
    
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const monthIndex = orderDate.getMonth();
      monthlySalesData[monthIndex] += Number(order.totalAmount);
    });
    
    // Include all 5 order statuses in the distribution
    const orderStatusData = [
      pendingOrders,
      processingOrders,
      shippedOrders,
      completedOrders,
      cancelledOrders
    ];
    
    // Get top products
    const productSales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.product._id.toString();
        if (!productSales[productId]) {
          productSales[productId] = {
            id: productId,
            title: item.product.title,
            totalSold: 0
          };
        }
        productSales[productId].totalSold += Number(item.quantity);
      });
    });
    
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);
    
    const responseData = {
      success: true,
      data: {
        totalSales,
        monthlySales,
        weeklySales,
        totalOrders: orders.length,
        pendingOrders,
        processingOrders,
        shippedOrders,
        completedOrders,
        cancelledOrders,
        monthlySalesData,
        orderStatusData,
        topProducts: {
          labels: topProducts.map(product => product.title),
          data: topProducts.map(product => product.totalSold)
        }
      }
    };
    
    console.log('Sending analytics response:', JSON.stringify(responseData, null, 2));
    res.json(responseData);
  } catch (error) {
    console.error('Error getting seller analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving analytics data',
      error: error.message
    });
  }
};

// Add admin analytics controller to view all sellers' analytics
exports.getAllSellersAnalytics = async (req, res) => {
  try {
    console.log('Getting analytics for all sellers by admin:', req.user._id);
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admin can view all sellers analytics'
      });
    }
    
    // Get all orders
    const allOrders = await Order.find({});
    console.log(`Found ${allOrders.length} total orders`);
    
    // Get all sellers with their orders
    const sellerOrders = {};
    allOrders.forEach(order => {
      if (order.seller && order.seller._id) {
        const sellerId = order.seller._id.toString();
        if (!sellerOrders[sellerId]) {
          sellerOrders[sellerId] = {
            sellerId,
            sellerName: order.seller.name || 'Unknown Seller',
            orders: []
          };
        }
        sellerOrders[sellerId].orders.push(order);
      }
    });
    
    // Calculate aggregated stats
    const totalSalesAll = allOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    
    // Calculate monthly and weekly sales
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    
    const monthlySalesAll = allOrders
      .filter(order => new Date(order.createdAt) >= startOfMonth)
      .reduce((sum, order) => sum + Number(order.totalAmount), 0);
    
    const weeklySalesAll = allOrders
      .filter(order => new Date(order.createdAt) >= startOfWeek)
      .reduce((sum, order) => sum + Number(order.totalAmount), 0);
    
    // Count all order statuses
    const pendingOrdersAll = allOrders.filter(order => order.status === 'pending').length;
    const processingOrdersAll = allOrders.filter(order => order.status === 'processing').length;
    const shippedOrdersAll = allOrders.filter(order => order.status === 'shipped').length;
    const completedOrdersAll = allOrders.filter(order => order.status === 'delivered').length;
    const cancelledOrdersAll = allOrders.filter(order => order.status === 'cancelled').length;
    
    // Get monthly sales data (aggregate)
    const monthlySalesDataAll = Array(12).fill(0);
    
    allOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const monthIndex = orderDate.getMonth();
      monthlySalesDataAll[monthIndex] += Number(order.totalAmount);
    });
    
    // Get order status distribution
    const orderStatusDataAll = [
      pendingOrdersAll,
      processingOrdersAll,
      shippedOrdersAll,
      completedOrdersAll,
      cancelledOrdersAll
    ];
    
    // Calculate individual seller statistics
    const sellersAnalytics = [];
    
    for (const sellerId in sellerOrders) {
      const sellerData = sellerOrders[sellerId];
      const sellerOrders = sellerData.orders;
      
      // Calculate total sales for this seller
      const totalSellerSales = sellerOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
      
      // Get product count for this seller
      const productCount = await Product.countDocuments({ 'seller': sellerId });
      
      // Get top products for this seller
      const sellerProductSales = {};
      sellerOrders.forEach(order => {
        order.items.forEach(item => {
          const productId = item.product._id.toString();
          if (!sellerProductSales[productId]) {
            sellerProductSales[productId] = {
              id: productId,
              title: item.product.title,
              totalSold: 0
            };
          }
          sellerProductSales[productId].totalSold += Number(item.quantity);
        });
      });
      
      const topSellerProducts = Object.values(sellerProductSales)
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 3);
      
      sellersAnalytics.push({
        sellerId: sellerData.sellerId,
        sellerName: sellerData.sellerName,
        totalSales: totalSellerSales,
        orderCount: sellerOrders.length,
        productCount,
        topProducts: topSellerProducts
      });
    }
    
    // Sort sellers by total sales (highest first)
    sellersAnalytics.sort((a, b) => b.totalSales - a.totalSales);
    
    // Get aggregated product data
    const productSalesAll = {};
    allOrders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.product._id.toString();
        if (!productSalesAll[productId]) {
          productSalesAll[productId] = {
            id: productId,
            title: item.product.title,
            totalSold: 0
          };
        }
        productSalesAll[productId].totalSold += Number(item.quantity);
      });
    });
    
    const topProductsAll = Object.values(productSalesAll)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);
    
    const responseData = {
      success: true,
      data: {
        // Aggregate data
        totalSales: totalSalesAll,
        monthlySales: monthlySalesAll, 
        weeklySales: weeklySalesAll,
        totalOrders: allOrders.length,
        pendingOrders: pendingOrdersAll,
        processingOrders: processingOrdersAll,
        shippedOrders: shippedOrdersAll,
        completedOrders: completedOrdersAll,
        cancelledOrders: cancelledOrdersAll,
        monthlySalesData: monthlySalesDataAll,
        orderStatusData: orderStatusDataAll,
        topProducts: {
          labels: topProductsAll.map(product => product.title),
          data: topProductsAll.map(product => product.totalSold)
        },
        // Seller-specific data
        sellers: sellersAnalytics,
        sellerCount: sellersAnalytics.length
      }
    };
    
    console.log('Sending admin analytics response');
    res.json(responseData);
  } catch (error) {
    console.error('Error getting all sellers analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving analytics data',
      error: error.message
    });
  }
};

// Add seller analytics by ID controller
exports.getSellerAnalyticsById = async (req, res) => {
  try {
    const sellerId = req.params.sellerId || req.user._id;
    console.log(`Getting analytics for seller ID: ${sellerId}`);
    
    // Check permissions - only admin can see other sellers' analytics
    if (req.user._id.toString() !== sellerId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own analytics'
      });
    }
    
    // Get total sales and orders
    const orders = await Order.find({
      'seller._id': sellerId
    });
    
    console.log(`Found ${orders.length} orders for seller ${sellerId}`);
    
    const totalSales = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    
    // Calculate monthly and weekly sales
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    
    const monthlySales = orders
      .filter(order => new Date(order.createdAt) >= startOfMonth)
      .reduce((sum, order) => sum + Number(order.totalAmount), 0);
    
    const weeklySales = orders
      .filter(order => new Date(order.createdAt) >= startOfWeek)
      .reduce((sum, order) => sum + Number(order.totalAmount), 0);
    
    // Count all order statuses
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const processingOrders = orders.filter(order => order.status === 'processing').length;
    const shippedOrders = orders.filter(order => order.status === 'shipped').length;
    const completedOrders = orders.filter(order => order.status === 'delivered').length;
    const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
    
    // Get product counts
    const products = await Product.find({ seller: sellerId });
    console.log(`Found ${products.length} products for seller ${sellerId}`);
    
    // Get monthly sales data
    const monthlySalesData = Array(12).fill(0);
    
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const monthIndex = orderDate.getMonth();
      monthlySalesData[monthIndex] += Number(order.totalAmount);
    });
    
    // Include all 5 order statuses in the distribution
    const orderStatusData = [
      pendingOrders,
      processingOrders,
      shippedOrders,
      completedOrders,
      cancelledOrders
    ];
    
    // Get top products
    const productSales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.product._id.toString();
        if (!productSales[productId]) {
          productSales[productId] = {
            id: productId,
            title: item.product.title,
            totalSold: 0
          };
        }
        productSales[productId].totalSold += Number(item.quantity);
      });
    });
    
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5);
    
    // Get seller info
    const seller = await User.findById(sellerId, 'name email');
    
    const responseData = {
      success: true,
      data: {
        sellerId,
        sellerName: seller ? seller.name : 'Unknown Seller',
        sellerEmail: seller ? seller.email : 'unknown@example.com',
        totalSales,
        monthlySales,
        weeklySales,
        totalOrders: orders.length,
        pendingOrders,
        processingOrders,
        shippedOrders,
        completedOrders,
        cancelledOrders,
        monthlySalesData,
        orderStatusData,
        productCount: products.length,
        topProducts: {
          labels: topProducts.map(product => product.title),
          data: topProducts.map(product => product.totalSold)
        }
      }
    };
    
    console.log('Sending seller-specific analytics response');
    res.json(responseData);
  } catch (error) {
    console.error('Error getting seller analytics by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving analytics data',
      error: error.message
    });
  }
}; 