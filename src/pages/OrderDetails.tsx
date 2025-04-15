import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  ChevronDown,
  Star,
  MessageCircle,
  Printer,
  Home
} from "lucide-react";
import { CSSTransition } from 'react-transition-group';
import ShippingForm from '../components/ShippingForm';
import { useTranslation } from 'react-i18next';
// import { BiPackage } from "react-icons/bi";

interface OrderItem {
  _id: string;
  product: {
    _id: string;
    title: string;
    price: number;
    images: string[];
    condition: string;
    oemNumber: string;
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
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    storeName: string;
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
  pickupPoint?: {
    id: string;
    name: string;
    provider: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    price: number;
    deliveryDays: string;
    distance: string;
  };
  deliveryDestination?: {
    type: 'pickup' | 'home';
    name?: string;
    provider?: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    fullAddress: string;
  };
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingMethod: string;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
}

// Add interface for the review form
interface ReviewForm {
  rating: number;
  comment: string;
  sellerId: string;
  orderId: string;
  productId: string;
}

const OrderDetails: React.FC = () => {
  const { t } = useTranslation();
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
  
  // Review state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewForm>({
    rating: 5,
    comment: '',
    sellerId: '',
    orderId: '',
    productId: ''
  });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Add these new states for the toast notification
  const [showStatusToast, setShowStatusToast] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');
  const toastRef = useRef(null);

  // Shipping state
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [shippingLabel, setShippingLabel] = useState<any>(null);
  
  // New state for label preview modal
  const [showLabelPreview, setShowLabelPreview] = useState(false);
  const [previewImageData, setPreviewImageData] = useState<string | null>(null);
  // Add new state for zoom level
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated && !localStorage.getItem('accessToken')) {
      navigate("/login", { state: { returnUrl: `/orders/${id}` } });
      return;
    }

    fetchOrderDetails();
    
    // Check if we have saved label data for this order
    const savedLabelData = localStorage.getItem(`shipping_label_${id}`);
    if (savedLabelData) {
      try {
        const parsedLabelData = JSON.parse(savedLabelData);
        setShippingLabel(parsedLabelData);
      } catch (error) {
        console.error('Error parsing saved label data:', error);
      }
    }
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

    if (!window.confirm(t('orderDetails.confirmCancel'))) {
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
      
      // Show success toast instead of alert
      setStatusMessage(`Order status updated to ${status} successfully.`);
      setStatusType('success');
      setShowStatusToast(true);
      
      // Auto hide the toast after 4 seconds
      setTimeout(() => {
        setShowStatusToast(false);
      }, 4000);
      
    } catch (error) {
      console.error("Error updating order status:", error);
      
      // Show error toast instead of alert
      setStatusMessage("Failed to update order status. Please try again.");
      setStatusType('error');
      setShowStatusToast(true);
      
      // Auto hide the toast after 4 seconds
      setTimeout(() => {
        setShowStatusToast(false);
      }, 4000);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Add available statuses for sellers
  const availableStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  // Function to open review modal
  const openReviewModal = (product: any) => {
    if (!order || !order.seller || !id) {
      setReviewError('Cannot create review: missing order information');
      return;
    }
    
    setSelectedProduct(product);
    setReviewForm({
      rating: 5,
      comment: '',
      sellerId: order.seller._id,
      orderId: id,
      productId: product._id
    });
    setReviewError(null);
    setReviewSuccess(false);
    setShowReviewModal(true);
  };

  // Function to handle rating change
  const handleRatingChange = (newRating: number) => {
    setReviewForm({
      ...reviewForm,
      rating: newRating
    });
  };

  // Function to handle comment change
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReviewForm({
      ...reviewForm,
      comment: e.target.value
    });
  };

  // Function to submit review
  const submitReview = async () => {
    setReviewLoading(true);
    setReviewError(null);
    
    try {
      // Get authentication token from localStorage
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setReviewError('You must be logged in to leave a review');
        return;
      }
      
      // Create headers with authentication
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      const response = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers,
        body: JSON.stringify(reviewForm)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit review');
      }
      
      setReviewSuccess(true);
      
      // Refresh order data after successful review
      fetchOrderDetails();
      
      // Auto close after 2 seconds
      setTimeout(() => {
        setShowReviewModal(false);
      }, 2000);
      
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setReviewLoading(false);
    }
  };

  // Review Stars component
  const ReviewStars: React.FC<{ 
    rating: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
  }> = ({ rating, onRatingChange, readonly = false }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={24}
            className={`${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            } ${!readonly ? 'cursor-pointer' : ''}`}
            onClick={() => {
              if (!readonly && onRatingChange) {
                onRatingChange(star);
              }
            }}
          />
        ))}
      </div>
    );
  };

  // Add this function
  const getStatusColor = (status: string) => {
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

  // Add this renderOrderItems function to the component body
  const renderOrderItems = () => {
    return (
      <div className="bg-white rounded-lg shadow-sm mb-5 overflow-hidden mt-10 md:mx-10">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Products</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subtotal
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {order?.items.map((item) => (
                <tr key={item._id}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                        {item.product.images && item.product.images.length > 0 ? (
                          <img
                            src={
                              item.product.images[0].startsWith('http')
                                ? item.product.images[0]
                                : `${API_URL}${item.product.images[0].startsWith('/') ? '' : '/'}${item.product.images[0]}`
                            }
                            alt={item.product.title}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gray-100">
                            <Package className="text-gray-400 h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {item.product.title}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order?.status || 'pending')}`}>
                      {order?.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    €{item.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    €{(item.price * item.quantity).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    {order?.status === 'delivered' && (
                      <button
                        onClick={() => openReviewModal(item.product)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Write Review
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Function to update order tracking information
  const updateOrderTracking = async (trackingNumber: string) => {
    try {
      console.log(`Updating tracking information for order ${id} with tracking number ${trackingNumber}`);
      
      const response = await fetch(`${API_URL}/api/orders/${id}/tracking`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify({ trackingNumber })
      });

      const responseText = await response.text();
      console.log('Server response:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
      }

      if (!response.ok) {
        throw new Error(`Failed to update tracking information: ${response.status} - ${responseData?.message || responseText}`);
      }

      // Refresh order details
      fetchOrderDetails();
      
      // Show success toast
      setStatusMessage(`Tracking information updated successfully.`);
      setStatusType('success');
      setShowStatusToast(true);
      
      // Auto hide the toast after 4 seconds
      setTimeout(() => {
        setShowStatusToast(false);
      }, 4000);
      
    } catch (error) {
      console.error("Error updating tracking:", error);
      setStatusMessage(`Failed to update tracking information: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatusType('error');
      setShowStatusToast(true);
      
      setTimeout(() => {
        setShowStatusToast(false);
      }, 4000);
    }
  };
  
  // Function to print shipping label
  const handlePrintLabel = () => {
    if (shippingLabel) {
      console.log('Printing shipping label with data:', shippingLabel);
      
      // Handle both single package result or array of package results
      let labelImage: string | null = null;
      
      if (shippingLabel.PackageResults) {
        if (Array.isArray(shippingLabel.PackageResults)) {
          // If it's an array, use the first package result
          if (shippingLabel.PackageResults.length > 0 && 
              shippingLabel.PackageResults[0].ShippingLabel) {
            labelImage = shippingLabel.PackageResults[0].ShippingLabel.GraphicImage;
          }
        } else if (shippingLabel.PackageResults.ShippingLabel) {
          // If it's a single object
          labelImage = shippingLabel.PackageResults.ShippingLabel.GraphicImage;
        }
      }
      
      if (labelImage) {
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Shipping Label - Order #${id}</title>
                <style>
                  .rotated-label {
                    transform: rotate(90deg);
                    transform-origin: center center;
                    max-height: 100vh;
                    margin: 0 auto;
                    display: block;
                  }
                  .container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    width: 100%;
                    overflow: hidden;
                  }
                </style>
              </head>
              <body style="margin: 0; padding: 0;">
                <div class="container">
                  <img src="data:image/gif;base64,${labelImage}" alt="Shipping Label" class="rotated-label" />
                </div>
                <script>
                  window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                  };
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      } else {
        console.error('Cannot print label: Missing shipping label image data', shippingLabel);
        setStatusMessage('Cannot print shipping label: Missing label image data');
        setStatusType('error');
        setShowStatusToast(true);
        
        setTimeout(() => {
          setShowStatusToast(false);
        }, 4000);
      }
    } else {
      console.error('Cannot print label: No shipping label data');
      setStatusMessage('Cannot print shipping label: No label data');
      setStatusType('error');
      setShowStatusToast(true);
      
      setTimeout(() => {
        setShowStatusToast(false);
      }, 4000);
    }
  };

  // Function to download shipping label with proper rotation
  const handleDownloadLabel = () => {
    if (shippingLabel) {
      console.log('Downloading shipping label...');
      
      // Handle both single package result or array of package results
      let downloadLabelImage: string | null = null;
      
      if (shippingLabel.PackageResults) {
        if (Array.isArray(shippingLabel.PackageResults)) {
          // If it's an array, use the first package result
          if (shippingLabel.PackageResults.length > 0 && 
              shippingLabel.PackageResults[0].ShippingLabel) {
            downloadLabelImage = shippingLabel.PackageResults[0].ShippingLabel.GraphicImage;
          }
        } else if (shippingLabel.PackageResults.ShippingLabel) {
          // If it's a single object
          downloadLabelImage = shippingLabel.PackageResults.ShippingLabel.GraphicImage;
        }
      }
      
      if (downloadLabelImage) {
        // Create an image object to get the original dimensions
        const img = new Image();
        img.onload = function() {
          // Create a canvas element to rotate the image
          const canvas = document.createElement('canvas');
          // Swap width and height for rotation
          canvas.width = img.height;
          canvas.height = img.width;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // Translate and rotate the canvas context
            ctx.translate(canvas.width/2, canvas.height/2);
            ctx.rotate(Math.PI/2); // 90 degrees in radians
            ctx.drawImage(img, -img.width/2, -img.height/2);
            
            // Convert the rotated image to a data URL
            const rotatedImageData = canvas.toDataURL('image/png');
            
            // Create a downloadable link from the rotated image
            const link = document.createElement('a');
            link.href = rotatedImageData;
            link.download = `shipping-label-${order?.trackingNumber || id}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else {
            // Fallback if canvas context is not available
            fallbackDownload();
          }
        };
        
        img.onerror = fallbackDownload;
        
        // Start loading the image
        img.src = `data:image/gif;base64,${downloadLabelImage}`;
        
        // Fallback function if we can't process the image with canvas
        function fallbackDownload() {
          // Just download the original image without rotation
          const link = document.createElement('a');
          link.href = `data:image/gif;base64,${downloadLabelImage}`;
          link.download = `shipping-label-${order?.trackingNumber || id}.gif`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          console.warn('Used fallback download method - image may not be rotated correctly');
        }
      } else {
        console.error('Cannot download label: Missing shipping label image data', shippingLabel);
        setStatusMessage('Cannot download shipping label: Missing label image data');
        setStatusType('error');
        setShowStatusToast(true);
        
        setTimeout(() => {
          setShowStatusToast(false);
        }, 4000);
      }
    } else {
      console.error('Cannot download label: No shipping label data');
      setStatusMessage('Cannot download shipping label: No label data');
      setStatusType('error');
      setShowStatusToast(true);
      
      setTimeout(() => {
        setShowStatusToast(false);
      }, 4000);
    }
  };

  // Function to generate shipping label
  const handleGenerateLabel = () => {
    // Show the shipping form
    setShowShippingForm(true);
    
    // Scroll to the shipping form
    setTimeout(() => {
      const shippingFormElement = document.getElementById('shipping-form');
      if (shippingFormElement) {
        shippingFormElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
    
    // Set a notification that the user should complete the form
    setStatusMessage('Please complete the shipping form to generate a label');
    setStatusType('success');
    setShowStatusToast(true);
    
    setTimeout(() => {
      setShowStatusToast(false);
    }, 4000);
  };

  // Add handler for shipping label generation
  const handleLabelGenerated = (labelData: any) => {
    console.log('Label generated:', labelData);
    setShippingLabel(labelData);
    
    // Save label data to localStorage for persistence
    localStorage.setItem(`shipping_label_${id}`, JSON.stringify(labelData));
    
    // Update order with tracking number if available
    if (labelData.ShipmentIdentificationNumber) {
      updateOrderTracking(labelData.ShipmentIdentificationNumber);
    } else {
      console.error('Missing tracking number in shipment response', labelData);
      setStatusMessage('Missing tracking number in shipment response');
      setStatusType('error');
      setShowStatusToast(true);
      
      setTimeout(() => {
        setShowStatusToast(false);
      }, 4000);
    }
  };

  // Add this function to render delivery destination with proper formatting
  const renderDeliveryDestination = (order: Order) => {
    if (!order) return null;
    
    // Determine delivery type (pickup or home)
    const isPickup = order.shippingMethod === 'pickup' || (order.deliveryDestination && order.deliveryDestination.type === 'pickup');
    
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Delivery Destination
        </h3>
        
        <div className="flex items-start">
          <div className={`flex-shrink-0 rounded-full p-2 mr-4 ${isPickup ? 'bg-purple-100' : 'bg-blue-100'}`}>
            {isPickup ? (
              <MapPin className="h-6 w-6 text-purple-600" />
            ) : (
              <Home className="h-6 w-6 text-blue-600" />
            )}
          </div>
          
          <div>
            <div className="flex items-center mb-1">
              <h4 className="text-md font-medium text-gray-900">
                {isPickup ? 'Pickup Point' : 'Home Delivery'}
              </h4>
              <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                isPickup ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {isPickup ? 'Pickup' : 'Standard Delivery'}
              </span>
            </div>
            
            <div className="text-sm text-gray-600 mt-2">
              {isPickup && order.pickupPoint ? (
                // Render pickup point details
                <>
                  <p className="font-medium">{order.pickupPoint.name}</p>
                  <p className="text-gray-700 mt-1">
                    {order.pickupPoint.provider}<br />
                    {order.pickupPoint.address}<br />
                    {order.pickupPoint.city}, {order.pickupPoint.state} {order.pickupPoint.postalCode}<br />
                    {order.pickupPoint.country}
                  </p>
                  {order.pickupPoint.distance && (
                    <p className="text-gray-500 mt-1">Distance: {order.pickupPoint.distance}</p>
                  )}
                </>
              ) : isPickup && order.deliveryDestination ? (
                // If it's pickup but using deliveryDestination object
                <>
                  <p className="font-medium">{order.deliveryDestination.name || 'Pickup Location'}</p>
                  <p className="text-gray-700 mt-1">
                    {order.deliveryDestination.provider || ''}<br />
                    {order.deliveryDestination.address}<br />
                    {order.deliveryDestination.city}, {order.deliveryDestination.state} {order.deliveryDestination.postalCode}<br />
                    {order.deliveryDestination.fullAddress ? `Full Address: ${order.deliveryDestination.fullAddress}` : ''}
                  </p>
                </>
              ) : order.deliveryDestination ? (
                // Home delivery using deliveryDestination object
                <>
                  <p className="font-medium">{order.buyer.firstName} {order.buyer.lastName}</p>
                  <p className="text-gray-700 mt-1">
                    {order.deliveryDestination.address}<br />
                    {order.deliveryDestination.city}, {order.deliveryDestination.state} {order.deliveryDestination.postalCode}<br />
                    {order.deliveryDestination.fullAddress ? `${order.deliveryDestination.fullAddress}` : ''}
                  </p>
                </>
              ) : (
                // Fallback to shippingAddress
                <>
                  <p className="font-medium">{order.buyer.firstName} {order.buyer.lastName}</p>
                  <p className="text-gray-700 mt-1">
                    {order.shippingAddress.street}<br />
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                    {order.shippingAddress.country}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add these functions to handle zooming
  const handleZoomIn = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setZoomLevel(prevZoom => Math.min(prevZoom + 0.2, 2.5));
  };

  const handleZoomOut = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setZoomLevel(prevZoom => Math.max(prevZoom - 0.2, 0.5));
  };

  const resetZoom = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setZoomLevel(1);
  };
  
  // Update the handleLabelPreview function to reset zoom when opening the preview
  const handleLabelPreview = () => {
    if (shippingLabel) {
      let labelImage: string | null = null;
      
      if (shippingLabel.PackageResults) {
        if (Array.isArray(shippingLabel.PackageResults)) {
          // If it's an array, use the first package result
          if (shippingLabel.PackageResults.length > 0 && 
              shippingLabel.PackageResults[0].ShippingLabel) {
            labelImage = shippingLabel.PackageResults[0].ShippingLabel.GraphicImage;
          }
        } else if (shippingLabel.PackageResults.ShippingLabel) {
          // If it's a single object
          labelImage = shippingLabel.PackageResults.ShippingLabel.GraphicImage;
        }
      }
      
      if (labelImage) {
        setPreviewImageData(labelImage);
        setShowLabelPreview(true);
        // Reset zoom level when opening
        setZoomLevel(1);
      } else {
        console.error('Cannot preview label: Missing shipping label image data');
        setStatusMessage('Cannot preview shipping label: Missing label image data');
        setStatusType('error');
        setShowStatusToast(true);
        
        setTimeout(() => {
          setShowStatusToast(false);
        }, 4000);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen md:pt-24 pt-0 pb-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        <p className="ml-3 text-gray-600">{t('orderDetails.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen md:pt-24 pt-6 pb-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-500">{error}</p>
        <div className="mt-4 flex space-x-4">
          <button 
            onClick={() => navigate("/profile?tab=orders")}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            {t('orderDetails.backToOrders')}
          </button>
          {isSeller && (
            <button 
              onClick={() => navigate("/profile?tab=seller-orders")}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              {t('orderDetails.backToSellerOrders')}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen md:pt-24 pt-6 pb-12">
        <Package className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600">{t('orderDetails.notFound')}</p>
        <div className="mt-4 flex space-x-4">
          <button 
            onClick={() => navigate("/profile?tab=orders")}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            {t('orderDetails.backToOrders')}
          </button>
          {isSeller && (
            <button 
              onClick={() => navigate("/profile?tab=seller-orders")}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              {t('orderDetails.backToSellerOrders')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen md:pt-24 pt-6 pb-12">
      {/* Status Update Toast Notification */}
      <CSSTransition
        in={showStatusToast}
        timeout={300}
        classNames="toast"
        unmountOnExit
        nodeRef={toastRef}
      >
        <div 
          ref={toastRef}
          className={`fixed top-20 right-4 z-50 flex items-center p-4 mb-4 w-full max-w-xs rounded-lg shadow ${
            statusType === 'success' 
              ? 'text-green-800 bg-green-50 border border-green-200' 
              : 'text-red-800 bg-red-50 border border-red-200'
          } transition-transform transform`}
          role="alert"
        >
          <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg ${
            statusType === 'success' ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'
          }`}>
            {statusType === 'success' 
              ? <CheckCircle className="w-5 h-5" /> 
              : <AlertCircle className="w-5 h-5" />
            }
          </div>
          <div className="ml-3 text-sm font-normal">{statusMessage}</div>
          <button 
            type="button" 
            onClick={() => setShowStatusToast(false)}
            className="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex h-8 w-8 text-gray-500 hover:text-gray-900 bg-white hover:bg-gray-100"
          >
            <span className="sr-only">Close</span>
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      </CSSTransition>

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
              {t('orderDetails.backToSellerOrders')}
            </button>
          ) : (
            <button 
              onClick={() => navigate("/profile?tab=orders")}
              className="flex items-center text-emerald-600 hover:text-emerald-700 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t('orderDetails.backToOrders')}
            </button>
          )}

          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">{t('orderDetails.title')}</h1>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 inline-flex items-center rounded-full text-sm font-medium ${getStatusBadgeColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <span className="ml-1">{t(`orderDetails.status.${order.status.toLowerCase()}`)}</span>
              </span>
              
              {/* Add shipping method badge */}
              <span className={`px-3 py-1 inline-flex items-center rounded-full text-sm font-medium ${
                order.shippingMethod === 'pickup' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {order.shippingMethod === 'pickup' 
                  ? <MapPin className="h-4 w-4 mr-1" /> 
                  : <Truck className="h-4 w-4 mr-1" />
                }
                <span className="ml-1">
                  {order.shippingMethod === 'pickup' ? 'Pickup' : 'Home Delivery'}
                </span>
              </span>
              
              {/* Add Track Parcel Button */}
              <button 
                onClick={() => navigate('/track-parcel', { 
                  state: { trackingNumber: order.trackingNumber || '' }
                })}
                className="ml-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-sm"
              >
                <Package className="h-4 w-4 mr-1" />
                {t('orderDetails.trackParcel')}
              </button>
              
              {/* Status Update Dropdown for Sellers */}
              {isSeller && (
                <div className="relative">
                  <button
                    onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                    disabled={isUpdatingStatus}
                    className="ml-2 px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center text-sm"
                  >
                    {isUpdatingStatus ? "Updating..." : t('orderDetails.updateStatus')}
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
                          {t(`orderDetails.status.${status.toLowerCase()}`)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <p className="text-gray-500 mt-1">{t('orderDetails.orderNumber')} #{order._id.substring(0, 8).toUpperCase()} • {t('orderDetails.orderDate')}: {formatDate(order.createdAt)}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">{t('orderDetails.order.summary')}</h2>
              </div>
              <div className="px-6 py-4">
                <div className="divide-y divide-gray-200">
                  {order.items.map((item) => (
                    <div key={item.product._id} className="py-4 flex items-start">
                      <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                        {item.product.images && item.product.images.length > 0 ? (
                          <img
                            src={
                              item.product.images[0].startsWith('http')
                                ? item.product.images[0]
                                : `${API_URL}${item.product.images[0].startsWith('/') ? '' : '/'}${item.product.images[0]}`
                            }
                            alt={item.product.title}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gray-200">
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
                    <p className="text-sm text-gray-500">{t('orderDetails.order.subtotal')}</p>
                    <p className="text-sm font-medium text-gray-900">${order.totalAmount.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between py-2">
                    <p className="text-sm text-gray-500">{t('orderDetails.shipping')}</p>
                    <p className="text-sm font-medium text-gray-900">{t('orderDetails.free')}</p>
                  </div>
                  <div className="flex justify-between py-2">
                    <p className="text-sm text-gray-500">{t('orderDetails.tax')}</p>
                    <p className="text-sm font-medium text-gray-900">{t('orderDetails.included')}</p>
                  </div>
                  <div className="flex justify-between py-2 border-t border-gray-200 mt-2">
                    <p className="text-base font-medium text-gray-900">{t('orderDetails.total')}</p>
                    <p className="text-base font-medium text-gray-900">${order.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Status Management - Only for Sellers */}
            {isSeller && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">{t('orderDetails.shipping.management')}</h2>
                </div>
                <div className="px-6 py-4">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{t('orderDetails.status.title')}</p>
                        <div className="mt-1 flex items-center">
                          <span className={`px-3 py-1 inline-flex items-center rounded-full text-sm font-medium ${getStatusBadgeColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{t(`orderDetails.status.${order.status.toLowerCase()}`)}</span>
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">{t('orderDetails.lastUpdated')}</p>
                        <p className="text-sm font-medium">{formatDate(order.updatedAt)}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 mb-2">{t('orderDetails.updateStatus')}</p>
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
                            {t(`orderDetails.status.${status.toLowerCase()}`)}
                          </button>
                        ))}
                      </div>
                      {isUpdatingStatus && (
                        <p className="text-sm text-gray-500 mt-2">{t('orderDetails.updating')}</p>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">
                        <strong>{t('orderDetails.note')}:</strong> {t('orderDetails.updateStatusNote')}
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
                  <h2 className="text-lg font-semibold text-gray-900">{t('orderDetails.orderActions')}</h2>
                </div>
                <div className="px-6 py-4">
                  <button
                    onClick={handleCancelOrder}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    {t('orderDetails.cancelOrder')}
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {t('orderDetails.cancelOrderNote')}
                  </p>
                </div>
              </div>
            )}

            {/* Shipping Management - Only for Sellers when order is shipped */}
            {isSeller && order.status === 'shipped' && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">{t('orderDetails.shipping.management')}</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowShippingForm(!showShippingForm)}
                      className="text-sm text-blue-500 hover:text-blue-700"
                    >
                      {showShippingForm ? t('orderDetails.shipping.hideForm') : t('orderDetails.shipping.showForm')}
                    </button>
                    <button
                      onClick={() => navigate(`/pickup-request/${id}`)}
                      className="text-sm px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center"
                    >
                      <Truck className="h-4 w-4 mr-1" /> {t('orderDetails.requestPickup')}
                    </button>
                  </div>
                </div>
                
                <div className="px-6 py-4">
                  {/* Delivery Destination Section */}
                  {renderDeliveryDestination(order)}

                  {/* Show tracking information if available */}
                  {order.trackingNumber ? (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{t('orderDetails.shipping.trackingNumber')}</p>
                          <p className="text-sm text-gray-600">
                            {order.trackingNumber ? (
                              <a 
                                href={`https://www.ups.com/track?tracknum=${order.trackingNumber}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {order.trackingNumber}
                              </a>
                            ) : t('orderDetails.na')}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate('/track-parcel', { 
                              state: { trackingNumber: order.trackingNumber }
                            })}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                          >
                            <Truck className="w-4 h-4 mr-1" /> {t('orderDetails.track')}
                          </button>
                          
                          {shippingLabel && (
                            <button
                              onClick={handlePrintLabel}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
                            >
                              <Printer className="w-4 h-4 mr-1" /> {t('orderDetails.printLabel')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-700">
                        {t('orderDetails.shipping.noTrackingInfo')}
                      </p>
                    </div>
                  )}
                  
                  {/* Shipping Label Section */}
                  {shippingLabel && (
                    <div className="mt-4">
                      <h3 className="text-lg font-medium mb-2">{t('orderDetails.shipping.label.title')}</h3>
                      <div className="border rounded-lg p-6 bg-gray-50">
                        {(() => {
                          let labelImageData: string | null = null;
                          
                          if (shippingLabel && shippingLabel.PackageResults) {
                            if (Array.isArray(shippingLabel.PackageResults)) {
                              // If it's an array, use the first package result
                              if (shippingLabel.PackageResults.length > 0 && 
                                  shippingLabel.PackageResults[0].ShippingLabel) {
                                labelImageData = shippingLabel.PackageResults[0].ShippingLabel.GraphicImage;
                              }
                            } else if (shippingLabel.PackageResults.ShippingLabel) {
                              // If it's a single object
                              labelImageData = shippingLabel.PackageResults.ShippingLabel.GraphicImage;
                            }
                          }
                          
                          return labelImageData ? (
                            <div className="mb-3 flex justify-center items-center bg-gray-50 p-4 rounded-lg">
                              <div className="relative w-full max-w-2xl mx-auto" style={{ aspectRatio: '1/1' }}>
                                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                                  <img 
                                    src={`data:image/gif;base64,${labelImageData}`} 
                                    alt="Shipping Label" 
                                    className="max-w-full max-h-full object-contain transform rotate-90 cursor-pointer hover:opacity-90 transition-opacity"
                                    style={{ 
                                      transformOrigin: 'center center',
                                    }}
                                    onClick={handleLabelPreview}
                                    title={t('orderDetails.label.clickToEnlarge')}
                                  />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-2 p-4 bg-black bg-opacity-50">
                                  <button
                                    onClick={handlePrintLabel}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                                  >
                                    <Printer className="w-4 h-4 mr-2" /> {t('orderDetails.shipping.label.print')}
                                  </button>
                                  <button
                                    onClick={handleDownloadLabel}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  >
                                    <ArrowLeft className="w-4 h-4 mr-2 transform rotate-90" /> {t('orderDetails.shipping.label.download')}
                                  </button>
                                  <button
                                    onClick={handleLabelPreview}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M15 3h6v6M14 10l6.1-6.1M9 21H3v-6M10 14l-6.1 6.1"/>
                                    </svg>
                                    {t('orderDetails.shipping.label.preview')}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-yellow-600 mb-3 p-4 bg-yellow-50 rounded-lg flex items-center">
                              <AlertCircle className="h-5 w-5 mr-2" /> {t('orderDetails.shipping.label.missingImage')}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                  
                  {/* If no shipping label, show a message for regenerating */}
                  {order.trackingNumber && !shippingLabel && (
                    <div className="mt-4">
                      <h3 className="text-lg font-medium mb-2">{t('orderDetails.shipping.label.title')}</h3>
                      <div className="border rounded-lg p-6 bg-gray-50">
                        <div className="flex flex-col items-center text-center">
                          <Package className="h-12 w-12 text-gray-400 mb-3" />
                          <h4 className="text-lg font-medium text-gray-900 mb-2">{t('orderDetails.shipping.label.missing')}</h4>
                          <p className="text-sm text-gray-600 mb-4 max-w-md">
                            {t('orderDetails.shipping.label.missingMessage')}
                          </p>
                          <button
                            onClick={handleGenerateLabel}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Package className="w-4 h-4 mr-2" /> {t('orderDetails.shipping.label.generate')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Shipping Form */}
                  {showShippingForm && (
                    <div id="shipping-form">
                      <ShippingForm 
                        orderId={id || ''} 
                        orderDetails={order}
                        onLabelGenerated={handleLabelGenerated}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Order Info */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">{t('orderDetails.order.information')}</h2>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {t('orderDetails.shippingAddress')}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {order.shippingMethod === 'pickup' && order.pickupPoint ? (
                        <>
                          <span className="font-medium">{order.pickupPoint.name}</span> ({order.pickupPoint.provider})<br />
                          {order.pickupPoint.address}, {order.pickupPoint.city}, {order.pickupPoint.state} {order.pickupPoint.postalCode}
                        </>
                      ) : (
                        <>
                          {order.shippingAddress.street}<br />
                          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                          {order.shippingAddress.country}
                        </>
                      )}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                      {t('orderDetails.paymentMethod')}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1).replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('orderDetails.paymentStatus.title')}: <span className={`font-medium ${order.paymentStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {t(`orderDetails.paymentStatus.${order.paymentStatus.toLowerCase()}`)}
                      </span>
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 flex items-center">
                      <Truck className="h-4 w-4 mr-2 text-gray-400" />
                      {t('orderDetails.shippingInformation')}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('orderDetails.shippingMethod')}: <span className="font-medium">
                        {order.shippingMethod === 'pickup' ? t('orderDetails.shipping.pickup') : 
                         order.shippingMethod === 'home' ? t('orderDetails.shipping.homeDelivery') : 
                         t(`orderDetails.shipping.${order.shippingMethod.charAt(0).toUpperCase() + order.shippingMethod.slice(1)}`)}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('orderDetails.status.title')}: <span className="font-medium">{t(`orderDetails.status.${order.status.toLowerCase()}`)}</span>
                    </p>
                    {order.status === 'shipped' && (
                      <p className="text-sm text-gray-500 mt-1">
                        {t('orderDetails.shipping.trackingNumber')}: <span className="font-medium">
                          {order.trackingNumber ? (
                            <a 
                              href={`https://www.ups.com/track?tracknum=${order.trackingNumber}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {order.trackingNumber}
                            </a>
                          ) : t('orderDetails.na')}
                        </span>
                      </p>
                    )}
                    {order.shippingMethod === 'pickup' && order.pickupPoint?.deliveryDays && (
                      <p className="text-sm text-gray-500 mt-1">
                        {t('orderDetails.estimatedDelivery')}: <span className="font-medium">{order.pickupPoint.deliveryDays} {t('orderDetails.businessDays')}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{t('orderDetails.contactInformation')}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {order.buyer.firstName} {order.buyer.lastName}<br />
                      {order.buyer.email}<br />
                      {order.buyer.phone}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{t('orderDetails.sellerInformation')}</h3>
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
                <h2 className="text-lg font-semibold text-gray-900">{t('orderDetails.support.title')}</h2>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm text-gray-500">
                  {t('orderDetails.support.message')}
                </p>
                <button 
                  onClick={() => navigate('/seller-support')}
                  className="mt-4 w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                  {t('orderDetails.support.contact')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-0 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {t('orderDetails.review.title')}
                  </h3>
                  
                  {reviewSuccess ? (
                    <div className="rounded-md bg-green-50 p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">
                            {t('orderDetails.review.success')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {reviewError && (
                        <div className="rounded-md bg-red-50 p-4 mb-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <AlertCircle className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-red-800">
                                {reviewError}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="mb-6">
                        <div className="flex items-center mb-2">
                          {selectedProduct && selectedProduct.images && selectedProduct.images.length > 0 ? (
                            <img
                              src={selectedProduct.images[0].startsWith('http') 
                                ? selectedProduct.images[0] 
                                : `${API_URL}${selectedProduct.images[0]}`}
                              alt={selectedProduct.title}
                              className="h-16 w-16 object-cover rounded"
                            />
                          ) : (
                            <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center">
                              <span className="text-gray-500">{t('orderDetails.noImage')}</span>
                            </div>
                          )}
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {selectedProduct?.title || t('orderDetails.product')}
                            </p>
                            <p className="text-sm text-gray-500">
                              {order?.seller?.storeName || (order?.seller?.firstName + ' ' + order?.seller?.lastName)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('orderDetails.rating')}
                        </label>
                        <div className="flex justify-center">
                          <ReviewStars 
                            rating={reviewForm.rating} 
                            onRatingChange={handleRatingChange} 
                          />
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                          {t('orderDetails.comment')}
                        </label>
                        <textarea
                          id="comment"
                          rows={4}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder={t('orderDetails.reviewPlaceholder')}
                          value={reviewForm.comment}
                          onChange={handleCommentChange}
                        ></textarea>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                {!reviewSuccess && (
                  <button
                    type="button"
                    onClick={submitReview}
                    disabled={reviewLoading}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm ${
                      reviewLoading ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    {reviewLoading ? t('orderDetails.submitting') : t('orderDetails.review.submit')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  {reviewSuccess ? t('orderDetails.close') : t('orderDetails.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add the Label Preview Modal */}
      {showLabelPreview && previewImageData && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div 
                className="absolute inset-0 bg-gray-800 opacity-75"
                onClick={() => setShowLabelPreview(false)}
              ></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
              <div className="relative">
                {/* Close button */}
                <button 
                  onClick={() => setShowLabelPreview(false)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-500 z-10 bg-white rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                  aria-label={t('orderDetails.label.closePreview')}
                >
                  <XCircle className="h-6 w-6" />
                </button>
                
                <div className="bg-gray-100 px-4 py-3 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-emerald-600" />
                    {t('orderDetails.shipping.label.preview')}
                    {order?.trackingNumber && (
                      <span className="ml-2 text-sm text-gray-500">
                        {t('orderDetails.trackingNumber')}: {order.trackingNumber}
                      </span>
                    )}
                  </h3>
                </div>
                
                <div className="bg-white px-4 py-6 sm:px-6 md:px-8">
                  <div className="flex flex-col items-center">
                    {/* Image container with rotation controls */}
                    <div className="relative w-full h-[60vh] lg:h-[70vh] flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 mb-4 overflow-hidden">
                      <div 
                        className="flex items-center justify-center w-full h-full overflow-auto"
                        style={{ padding: '2rem' }} // Add more padding to prevent cutoff
                      >
                        <div className="relative transform-gpu" style={{ 
                          transform: `scale(${zoomLevel})`,
                          transition: 'transform 0.2s ease-out',
                        }}>
                          <img 
                            src={`data:image/gif;base64,${previewImageData}`} 
                            alt="Shipping Label" 
                            className="object-contain transform rotate-90"
                            style={{ 
                              transformOrigin: 'center center',
                              maxHeight: '80vh', // Set max height to prevent initial cutoff
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Image controls overlay */}
                      <div className="absolute bottom-4 right-4 flex space-x-2">
                        <button
                          onClick={handleZoomIn}
                          className="bg-white rounded-full p-2 shadow-md text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                          title={t('orderDetails.zoomIn')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="11" y1="8" x2="11" y2="14"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                          </svg>
                        </button>
                        <button
                          onClick={handleZoomOut}
                          className="bg-white rounded-full p-2 shadow-md text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                          title={t('orderDetails.zoomOut')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            <line x1="8" y1="11" x2="14" y2="11"></line>
                          </svg>
                        </button>
                        <button
                          onClick={resetZoom}
                          className="bg-white rounded-full p-2 shadow-md text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                          title={t('orderDetails.resetZoom')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M8 12h8"></path>
                          </svg>
                        </button>
                      </div>
                      
                      {/* Zoom indicator */}
                      <div className="absolute top-4 left-4 bg-white bg-opacity-75 px-2 py-1 rounded text-xs font-medium text-gray-700">
                        {Math.round(zoomLevel * 100)}%
                      </div>
                    </div>
                    
                    {/* Information note */}
                    <div className="text-sm text-gray-500 mb-4 bg-blue-50 p-3 rounded-md border border-blue-100 w-full max-w-2xl">
                      <div className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="16" x2="12" y2="12"></line>
                          <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        <span>{t('orderDetails.label.info')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-4 sm:px-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                    <button
                      type="button"
                      onClick={handlePrintLabel}
                      className="w-full sm:w-auto flex justify-center items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                    >
                      <Printer className="w-4 h-4 mr-2" /> {t('orderDetails.shipping.label.print')}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadLabel}
                      className="w-full sm:w-auto flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      {t('orderDetails.download')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLabelPreview(false)}
                      className="w-full sm:w-auto flex justify-center items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      {t('orderDetails.close')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update the products section to use renderOrderItems */}
      {!isLoading && order && renderOrderItems()}
    </div>
  );
};

// Add CSS for toast animation
const styles = document.createElement('style');
styles.innerHTML = `
.toast-enter {
  transform: translateX(100%);
  opacity: 0;
}
.toast-enter-active {
  transform: translateX(0);
  opacity: 1;
  transition: opacity 300ms, transform 300ms;
}
.toast-exit {
  opacity: 1;
}
.toast-exit-active {
  transform: translateX(100%);
  opacity: 0;
  transition: opacity 300ms, transform 300ms;
}
`;
document.head.appendChild(styles);

export default OrderDetails; 