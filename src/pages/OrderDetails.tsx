import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { API_URL } from '../config';
import {
  ArrowLeft,
  Package,
  Truck,
  CreditCard,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown
} from "lucide-react";

interface OrderItem {
  product: {
    _id: string;
    title: string;
    price: number;
    images: string[];
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  buyer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  seller: {
    firstName: string;
    lastName: string;
    email: string;
  };
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const userRole = localStorage.getItem('userRole');
  const isSeller = userRole === 'seller';

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated && !localStorage.getItem('accessToken')) {
      navigate("/login", { state: { returnUrl: `/orders/${id}` } });
      return;
    }

    fetchOrderDetails();
  }, [id, isAuthenticated, navigate]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/orders/${id}`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch order details: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch order details");
      }

      setOrder(data.data);
    } catch (error) {
      console.error("Error fetching order details:", error);
      setError("Failed to load order details. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '';

    // If the URL is already absolute, return it as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    // If it's a relative path starting with /api/media, add the base URL
    if (imageUrl.startsWith('/api/media/')) {
      return `${API_URL}${imageUrl}`;
    }

    // For just filenames, assume they're in the media directory
    return `${API_URL}/api/media/${imageUrl}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-blue-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    
    if (order.status !== 'pending') {
      alert("Only pending orders can be cancelled.");
      return;
    }

    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/orders/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify({ status: "cancelled" })
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel order: ${response.status}`);
      }

      // Refresh order details
      fetchOrderDetails();
      alert("Order cancelled successfully.");
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert("Failed to cancel order. Please try again.");
    }
  };

  const updateOrderStatus = async (status: string) => {
    if (!order) return;
    
    try {
      setIsUpdatingStatus(true);
      
      const response = await fetch(`${API_URL}/api/orders/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error(`Failed to update order status: ${response.status}`);
      }

      // Refresh order details
      await fetchOrderDetails();
      setStatusDropdownOpen(false);
      alert(`Order status updated to ${status} successfully.`);
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status. Please try again.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Add available statuses for sellers
  const availableStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen pt-24 pb-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        <p className="ml-3 text-gray-600">Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen pt-24 pb-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-500">{error}</p>
        <div className="mt-4 flex space-x-4">
          <button 
            onClick={() => navigate("/profile?tab=orders")}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Back to My Orders
          </button>
          {isSeller && (
            <button 
              onClick={() => navigate("/profile?tab=seller-orders")}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Back to Seller Orders
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen pt-24 pb-12">
        <Package className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600">Order not found</p>
        <div className="mt-4 flex space-x-4">
          <button 
            onClick={() => navigate("/profile?tab=orders")}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Back to My Orders
          </button>
          {isSeller && (
            <button 
              onClick={() => navigate("/profile?tab=seller-orders")}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Back to Seller Orders
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          {/* Determine if this is a seller order or buyer order */}
          {isSeller ? (
            <button 
              onClick={() => navigate("/profile?tab=seller-orders")}
              className="flex items-center text-emerald-600 hover:text-emerald-700 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Seller Orders
            </button>
          ) : (
            <button 
              onClick={() => navigate("/profile?tab=orders")}
              className="flex items-center text-emerald-600 hover:text-emerald-700 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to My Orders
            </button>
          )}

          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 inline-flex items-center rounded-full text-sm font-medium ${getStatusBadgeColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <span className="ml-1">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
              </span>
              
              {/* Status Update Dropdown for Sellers */}
              {isSeller && (
                <div className="relative">
                  <button
                    onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                    disabled={isUpdatingStatus}
                    className="ml-2 px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center text-sm"
                  >
                    {isUpdatingStatus ? "Updating..." : "Update Status"}
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </button>
                  
                  {statusDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1">
                      {availableStatuses.map((status) => (
                        <button
                          key={status}
                          onClick={() => updateOrderStatus(status)}
                          className={`block w-full text-left px-4 py-2 text-sm ${
                            order.status === status 
                              ? 'bg-gray-100 text-gray-900 font-medium' 
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <p className="text-gray-500 mt-1">Order #{order._id.substring(0, 8).toUpperCase()} • Placed on {formatDate(order.createdAt)}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
              </div>
              <div className="px-6 py-4">
                <div className="divide-y divide-gray-200">
                  {order.items.map((item) => (
                    <div key={item.product._id} className="py-4 flex items-start">
                      <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                        {item.product.images && item.product.images.length > 0 ? (
                          <img
                            src={formatImageUrl(item.product.images[0])}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between">
                          <h3 className="text-sm font-medium text-gray-900">{item.product.title}</h3>
                          <p className="text-sm font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex justify-between py-2">
                    <p className="text-sm text-gray-500">Subtotal</p>
                    <p className="text-sm font-medium text-gray-900">${order.totalAmount.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between py-2">
                    <p className="text-sm text-gray-500">Shipping</p>
                    <p className="text-sm font-medium text-gray-900">Free</p>
                  </div>
                  <div className="flex justify-between py-2">
                    <p className="text-sm text-gray-500">Tax</p>
                    <p className="text-sm font-medium text-gray-900">Included</p>
                  </div>
                  <div className="flex justify-between py-2 border-t border-gray-200 mt-2">
                    <p className="text-base font-medium text-gray-900">Total</p>
                    <p className="text-base font-medium text-gray-900">${order.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Status Management - Only for Sellers */}
            {isSeller && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Order Status Management</h2>
                </div>
                <div className="px-6 py-4">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Current Status</p>
                        <div className="mt-1 flex items-center">
                          <span className={`px-3 py-1 inline-flex items-center rounded-full text-sm font-medium ${getStatusBadgeColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Last Updated</p>
                        <p className="text-sm font-medium">{formatDate(order.updatedAt)}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Update Status</p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {availableStatuses.map((status) => (
                          <button
                            key={status}
                            onClick={() => updateOrderStatus(status)}
                            disabled={isUpdatingStatus || order.status === status}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              order.status === status 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : status === 'cancelled' 
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                  : status === 'delivered'
                                    ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        ))}
                      </div>
                      {isUpdatingStatus && (
                        <p className="text-sm text-gray-500 mt-2">Updating order status...</p>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">
                        <strong>Note:</strong> Updating the order status will notify the customer. Make sure to update the tracking information if you're marking an order as shipped.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Order Actions - Only for Customers */}
            {order.status === 'pending' && !isSeller && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Order Actions</h2>
                </div>
                <div className="px-6 py-4">
                  <button
                    onClick={handleCancelOrder}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Cancel Order
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    You can only cancel orders that are in "pending" status.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Order Info */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Order Information</h2>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      Shipping Address
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {order.shippingAddress.street}<br />
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                      {order.shippingAddress.country}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                      Payment Method
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1).replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Payment Status: <span className={`font-medium ${order.paymentStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </span>
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 flex items-center">
                      <Truck className="h-4 w-4 mr-2 text-gray-400" />
                      Shipping Information
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Status: <span className="font-medium">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                    </p>
                    {order.status === 'shipped' && (
                      <p className="text-sm text-gray-500 mt-1">
                        Tracking Number: <span className="font-medium">N/A</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Contact Information</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {order.buyer.firstName} {order.buyer.lastName}<br />
                      {order.buyer.email}<br />
                      {order.buyer.phone}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Seller Information</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {order.seller.firstName} {order.seller.lastName}<br />
                      {order.seller.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Need Help?</h2>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm text-gray-500">
                  If you have any questions or concerns about your order, please contact our customer support team.
                </p>
                <button className="mt-4 w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails; 