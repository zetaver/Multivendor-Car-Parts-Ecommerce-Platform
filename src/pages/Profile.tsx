import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store/store";
import { API_URL } from "../config";
import {
  User,
  Package,
  Heart,
  MessageSquare,
  Settings,
  CreditCard,
  LogOut,
  Edit,
  Camera,
  ChevronRight,
  ShoppingBag,
  AlertCircle,
  ShoppingCart, Trash2,
  MapPin,
  Plus,
  Eye
} from "lucide-react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { logout } from "../store/slices/authSlice";
import { Conversation, getConversations, } from '../services/messageService';


interface Address {
  _id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

// Updated to match the actual product structure in the wishlist
interface WishlistItem {
  _id: string;
  title: string;
  price: number;
  oemNumber?: string;
  images: string[];
  category?: {
    _id: string;
    name: string;
  };
}

// Updated to match the API response structure
interface WishlistResponse {
  success: boolean;
  data: {
    _id: string;
    user: string;
    products: WishlistItem[];
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
}

interface Product {
  _id: string;
  title: string;
  price: number;
  oemNumber?: string;
  images: string[];
  status: string;
  createdAt: string;
  category?: {
    _id: string;
    name: string;
  };
}

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

interface PaymentMethod {
  _id: string;
  cardType: string;
  lastFourDigits: string;
  expirationMonth: string;
  expirationYear: string;
  isDefault: boolean;
  billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    }
  }
}

interface BillingDetailsForm {
  name: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }
}

// CardForm component for Stripe integration
const CardForm: React.FC<{
  onSubmit: (paymentMethodId: string) => void;
  onCancel: () => void;
  billingDetails: BillingDetailsForm;
  onBillingDetailsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string;
}> = ({ onSubmit, onCancel, billingDetails, onBillingDetailsChange, error }) => {
  const [cardError, setCardError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // In a real implementation, this would use Stripe.js to create a payment method
    // For now, we'll simulate success with a test payment method ID
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // This would be the actual payment method ID from Stripe
      const paymentMethodId = "pm_" + Math.random().toString(36).substring(2, 15);

      onSubmit(paymentMethodId);
    } catch (error) {
      setCardError("An error occurred while processing your card. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* Card details section */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Please enter your card details securely using our payment provider.
          </p>

          {/* Simulated card input field */}
          <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
              <input
                type="text"
                placeholder="4242 4242 4242 4242"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                <input
                  type="text"
                  placeholder="123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {cardError && (
            <div className="mt-2 text-sm text-red-600">
              {cardError}
            </div>
          )}
        </div>

        {/* Billing details section */}
        <div className="space-y-4 mt-4">
          <h5 className="font-medium text-gray-900">Billing Details</h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={billingDetails.name}
                onChange={onBillingDetailsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={billingDetails.email}
                onChange={onBillingDetailsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={billingDetails.phone}
                onChange={onBillingDetailsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <h6 className="text-sm font-medium text-gray-700 mb-2">Address</h6>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <input
                  type="text"
                  name="address.line1"
                  value={billingDetails.address.line1}
                  onChange={onBillingDetailsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apartment, suite, etc.</label>
                <input
                  type="text"
                  name="address.line2"
                  value={billingDetails.address.line2}
                  onChange={onBillingDetailsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="address.city"
                    value={billingDetails.address.city}
                    onChange={onBillingDetailsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State / Province</label>
                  <input
                    type="text"
                    name="address.state"
                    value={billingDetails.address.state}
                    onChange={onBillingDetailsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    name="address.postalCode"
                    value={billingDetails.address.postalCode}
                    onChange={onBillingDetailsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  name="address.country"
                  value={billingDetails.address.country}
                  onChange={onBillingDetailsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isProcessing}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Save Payment Method'}
          </button>
        </div>
      </form>
    </div>
  );
};

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile");
  const [isSeller, setIsSeller] = useState(false);

  // Get tab from URL query parameter or default to "profile"
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    isDefault: false
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);
  const [wishlistError, setWishlistError] = useState("");
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [productCount, setProductCount] = useState(0);
  const [productStats, setProductStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });
  const [selectedProductFilter, setSelectedProductFilter] = useState('total');
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const userRole = localStorage.getItem('userRole') || user?.role || '';
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [orderCount, setOrderCount] = useState(0);

  // Add state for seller orders
  const [sellerOrders, setSellerOrders] = useState<Order[]>([]);
  const [isLoadingSellerOrders, setIsLoadingSellerOrders] = useState(false);
  const [sellerOrderError, setSellerOrderError] = useState("");
  const [sellerOrderCount, setSellerOrderCount] = useState(0);
  const [sellerOrderFilter, setSellerOrderFilter] = useState("all");
  const [wishlistCount, setWishlistCount] = useState(0);
  const [selectedOrderFilter, setSelectedOrderFilter] = useState("total");
  const [selectedSellerOrderFilter, setSelectedSellerOrderFilter] = useState("total");

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false);
  const [paymentMethodError, setPaymentMethodError] = useState("");
  const [isAddingPaymentMethod, setIsAddingPaymentMethod] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isEditingPaymentMethod, setIsEditingPaymentMethod] = useState(false);
  const [billingDetailsForm, setBillingDetailsForm] = useState<BillingDetailsForm>({
    name: "",
    email: "",
    phone: "",
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: ""
    }
  });

  const { conversationId } = useParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations();
        setConversations(data);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    };

    fetchConversations();
  }, []);

  // Add updateOrderStatus function
  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
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

      // Update the order status in the local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId ? { ...order, status } : order
        )
      );

      alert(`Order status updated to ${status} successfully.`);
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status. Please try again.");
    }
  };

  // Add available statuses for sellers
  const availableStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  const fetchAddresses = async () => {
    try {
      setIsLoadingAddresses(true);
      setAddressError("");

      const response = await fetch(`${API_URL}/api/addresses`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch addresses: ${response.status}`);
      }

      const data = await response.json();
      setAddresses(data.data || []);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      setAddressError("Failed to load addresses. Please try again later.");
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAddressId
        ? `${API_URL}/api/addresses/${editingAddressId}`
        : `${API_URL}/api/addresses`;

      const method = editingAddressId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify(addressForm)
      });

      if (!response.ok) {
        throw new Error(`Failed to ${editingAddressId ? 'update' : 'create'} address: ${response.status}`);
      }

      await fetchAddresses();
      setIsAddingAddress(false);
      setEditingAddressId(null);
      setAddressForm({
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        isDefault: false
      });
    } catch (error) {
      console.error("Error saving address:", error);
      setAddressError(`Failed to ${editingAddressId ? 'update' : 'create'} address. Please try again.`);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!window.confirm("Are you sure you want to delete this address?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/addresses/${addressId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete address: ${response.status}`);
      }

      await fetchAddresses();
    } catch (error) {
      console.error("Error deleting address:", error);
      setAddressError("Failed to delete address. Please try again.");
    }
  };

  const handleEditAddress = (address: Address) => {
    setAddressForm({
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault
    });
    setEditingAddressId(address._id);
    setIsAddingAddress(true);
  };
  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      setAddressError(""); // Clear any existing errors

      const response = await fetch(`${API_URL}/api/addresses/${addressId}/default`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to set default address: ${response.status}`);
      }

      // Update the addresses list to reflect the change
      setAddresses(prevAddresses => prevAddresses.map(addr => ({
        ...addr,
        isDefault: addr._id === addressId
      })));
    } catch (error) {
      console.error("Error setting default address:", error);
      setAddressError("Failed to set default address. Please try again.");
    }
  };

  useEffect(() => {
    if (activeTab === "addresses") {
      fetchAddresses();
    }
  }, [activeTab]);

  // Redirect if not authenticated - improved version
  useEffect(() => {
    // Check both Redux state and localStorage
    const token = localStorage.getItem('accessToken');
    const userRole = localStorage.getItem('userRole');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    console.log("Profile - Auth check:", { isAuthenticated, token, userRole, user });

    if (!isAuthenticated && !token) {
      // Only redirect if both Redux state is unauthenticated AND no token exists
      navigate("/login", { state: { returnUrl: '/profile?tab=profile' } });
    } else if (token && !isAuthenticated) {

    }
  }, [isAuthenticated, navigate]);


  useEffect(() => {
    fetchProductCount();
  }, [isSeller]);
  // Fetch seller products when the wardrobe tab is active
  useEffect(() => {
    if (activeTab === "wardrobe" && isSeller) {
      fetchSellerProducts();
      fetchProductCount();
    }
  }, [activeTab, isSeller]);

  // Update active tab when URL query parameter changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const fetchSellerProducts = async () => {
    try {
      setIsLoadingProducts(true);
      setProductsError("");

      // Log the token being used
      console.log("Using token:", localStorage.getItem("accessToken"));

      const response = await fetch(`${API_URL}/api/seller/products`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error response:", errorData);
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received product data:", data);
      setSellerProducts(data);
    } catch (error) {
      console.error("Error fetching seller products:", error);
      setProductsError("Failed to load your products. Please try again later.");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchProductCount = async () => {
    try {
      setIsLoadingCount(true);

      // Get user ID from auth state or localStorage
      const userId = user?.id || JSON.parse(localStorage.getItem('user') || '{}')._id;

      if (!userId) {
        console.error("User ID not found");
        return;
      }

      const response = await fetch(`${API_URL}/api/products/seller/${userId}/count`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch product count: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Set both the legacy productCount (for backward compatibility) and the new detailed stats
        setProductCount(data.data.total);
        setProductStats({
          total: data.data.total,
          approved: data.data.approved,
          pending: data.data.pending,
          rejected: data.data.rejected
        });
      } else {
        // Fallback to the old endpoint if the new one fails
        const fallbackResponse = await fetch(`${API_URL}/api/products/count`);
        const fallbackData = await fallbackResponse.json();
        setProductCount(fallbackData.count);
      }
    } catch (error) {
      console.error("Error fetching product count:", error);
    } finally {
      setIsLoadingCount(false);
    }
  };

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true);
      setOrderError("");

      const response = await fetch(`${API_URL}/api/orders`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch orders");
      }

      setOrders(data.data || []);
      setOrderCount(data.data?.length || 0);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrderError("Failed to load orders. Please try again later.");
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      dispatch(logout());
      navigate("/");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically dispatch an action to update the user profile
    console.log("Updated profile data:", formData);
    setIsEditing(false);
    // In a real app, you'd dispatch an action to update the user profile
    // dispatch(updateUserProfile(formData));
  };

  const deleteProduct = async (productId: string) => {
    if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      try {
        const response = await fetch(`${API_URL}/api/products/${productId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to delete product: ${response.status}`);
        }

        // Remove the product from the local state
        setSellerProducts(prevProducts =>
          prevProducts.filter(product => product._id !== productId)
        );

        alert("Product deleted successfully!");
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product. Please try again.");
      }
    }
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
  const fetchWishlist = async () => {
    try {
      setIsLoadingWishlist(true);
      setWishlistError("");

      const response = await fetch(`${API_URL}/api/wishlist`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch wishlist: ${response.status}`);
      }

      const data = await response.json();

      // Add safety check for data structure - adjusted for nested response
      if (!data || !data.success || !data.data || !Array.isArray(data.data.products)) {
        console.error("Invalid wishlist data format:", data);
        setWishlistItems([]);
        setWishlistError("Received invalid data format from server.");
        return;
      }

      // Set wishlist items from the nested data structure
      setWishlistItems(data.data.products);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      setWishlistError("Failed to load wishlist items. Please try again later.");
      // Initialize with empty array on error to prevent rendering issues
      setWishlistItems([]);
    } finally {
      setIsLoadingWishlist(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/wishlist/remove/${productId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to remove item: ${response.status}`);
      }

      // Update wishlist items by filtering out the removed product
      setWishlistItems(prev => prev.filter(item => item._id !== productId));
    } catch (error) {
      console.error("Error removing item from wishlist:", error);
      alert("Failed to remove item from wishlist. Please try again.");
    }
  };

  const clearWishlist = async () => {
    if (!window.confirm("Are you sure you want to clear your entire wishlist?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/wishlist/clear`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to clear wishlist: ${response.status}`);
      }

      setWishlistItems([]);
    } catch (error) {
      console.error("Error clearing wishlist:", error);
      alert("Failed to clear wishlist. Please try again.");
    }
  };

  const fetchWishlistCount = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wishlist/count`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch wishlist count: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setWishlistCount(data.count);
      }
    } catch (error) {
      console.error("Error fetching wishlist count:", error);
    }
  };

  useEffect(() => {
    fetchWishlistCount();
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTab === "wishlist") {
      fetchWishlist();
      fetchWishlistCount();
    }
  }, [activeTab]);

  // Fetch payment methods when payment tab is active
  useEffect(() => {
    if (activeTab === "payment") {
      fetchPaymentMethods();
    }
  }, [activeTab]);

  // Add this function for filtering products by status
  const getFilteredProducts = () => {
    if (selectedProductFilter === 'total') {
      return sellerProducts;
    }
    return sellerProducts.filter(product => product.status === selectedProductFilter);
  };

  // Add a function to handle tab navigation that updates both the state and URL
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab: tab });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get status badge color
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

  // This useEffect is now redundant with our new implementation that fetches orders on component mount
  // We're keeping it for now to ensure backward compatibility
  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    }
  }, [activeTab]);

  // Add this useEffect after the other useEffect hooks
  useEffect(() => {
    // Add click outside handler to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdownId && !(event.target as Element).closest('.status-dropdown')) {
        setActiveDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdownId]);

  // Add a new useEffect to fetch orders when component mounts
  useEffect(() => {
    fetchOrders();
  }, []);

  // Modify the existing useEffect for orders tab to update the UI without refetching if already loaded
  useEffect(() => {
    if (activeTab === "orders" && orders.length === 0 && !isLoadingOrders) {
      fetchOrders();
    }
  }, [activeTab]);

  // Add fetchSellerOrders function
  const fetchSellerOrders = async () => {
    if (!isSeller) return;

    try {
      setIsLoadingSellerOrders(true);
      setSellerOrderError("");

      const response = await fetch(`${API_URL}/api/orders/seller`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch seller orders: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch seller orders");
      }

      setSellerOrders(data.data || []);
      setSellerOrderCount(data.data?.length || 0);
    } catch (error) {
      console.error("Error fetching seller orders:", error);
      setSellerOrderError("Failed to load seller orders. Please try again later.");
    } finally {
      setIsLoadingSellerOrders(false);
    }
  };

  // Add useEffect for seller orders
  useEffect(() => {
    if (activeTab === "seller-orders" && isSeller) {
      fetchSellerOrders();
    }
  }, [activeTab, isSeller]);

  // Add useEffect to fetch seller orders on component mount if user is a seller
  useEffect(() => {
    if (isSeller) {
      fetchSellerOrders();
    }
  }, [isSeller]);

  // Get filtered seller orders based on status filter
  const getFilteredSellerOrders = () => {
    if (sellerOrderFilter === "all") {
      return sellerOrders;
    }
    return sellerOrders.filter(order => order.status === sellerOrderFilter);
  };

  useEffect(() => {
    // Check if user is a seller from local storage or user object
    const userRole = localStorage.getItem('userRole');
    const userObj = user || JSON.parse(localStorage.getItem('user') || '{}');

    // Set seller status based on role from either source
    if (userRole === 'seller' || userObj?.role === 'seller') {
      setIsSeller(true);
    }

    console.log("User role check:", { userRole, userObjRole: userObj?.role, isSeller });
  }, [user]);

  // Payment methods functions
  const fetchPaymentMethods = async () => {
    setIsLoadingPaymentMethods(true);
    setPaymentMethodError("");

    try {
      // In a real implementation, this would call the API
      // For now, we'll simulate loading
      await new Promise(resolve => setTimeout(resolve, 1000));

      // If we already have payment methods, don't add more
      if (paymentMethods.length === 0) {
        // Add a sample payment method for demonstration
        const samplePaymentMethod = {
          _id: "sample-payment-method-id",
          cardType: "visa",
          lastFourDigits: "4242",
          expirationMonth: "12",
          expirationYear: "2025",
          isDefault: true,
          billingDetails: {
            name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "John Doe",
            email: user?.email || "john@example.com",
            phone: user?.phone || "+1234567890"
          }
        };

        setPaymentMethods([samplePaymentMethod]);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      setPaymentMethodError("Error fetching payment methods. Please try again.");
    } finally {
      setIsLoadingPaymentMethods(false);
    }
  };

  const handleAddPaymentMethod = () => {
    setIsAddingPaymentMethod(true);
    // Initialize with user data if available
    setBillingDetailsForm({
      name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: ""
      }
    });
    setPaymentMethodError("");
  };

  const handlePaymentMethodSubmit = async (paymentMethodId: string) => {
    try {
      setPaymentMethodError("");
      const token = localStorage.getItem("accessToken");

      // For simulation purposes, we'll create a mock payment method
      const mockPaymentMethod = {
        _id: Math.random().toString(36).substring(2, 15),
        cardType: "visa",
        lastFourDigits: "4242",
        expirationMonth: "12",
        expirationYear: "2025",
        isDefault: paymentMethods.length === 0, // Make default if it's the first one
        billingDetails: billingDetailsForm
      };

      // In a real implementation, this would call the API
      // For now, we'll simulate success
      setPaymentMethods([...paymentMethods, mockPaymentMethod]);
      setIsAddingPaymentMethod(false);

      // Reset form
      setBillingDetailsForm({
        name: "",
        email: "",
        phone: "",
        address: {
          line1: "",
          line2: "",
          city: "",
          state: "",
          postalCode: "",
          country: ""
        }
      });
    } catch (error) {
      console.error("Error adding payment method:", error);
      setPaymentMethodError("Error adding payment method. Please try again.");
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    try {
      setPaymentMethodError("");

      // Confirm deletion
      if (!window.confirm("Are you sure you want to remove this payment method?")) {
        return;
      }

      // In a real implementation, this would call the API
      // For now, we'll simulate success
      setPaymentMethods(paymentMethods.filter(pm => pm._id !== paymentMethodId));

    } catch (error) {
      console.error("Error deleting payment method:", error);
      setPaymentMethodError("Error deleting payment method. Please try again.");
    }
  };

  const handleEditPaymentMethod = (paymentMethod: PaymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    setIsEditingPaymentMethod(true);
    setBillingDetailsForm({
      name: paymentMethod.billingDetails?.name || "",
      email: paymentMethod.billingDetails?.email || "",
      phone: paymentMethod.billingDetails?.phone || "",
      address: {
        line1: paymentMethod.billingDetails?.address?.line1 || "",
        line2: paymentMethod.billingDetails?.address?.line2 || "",
        city: paymentMethod.billingDetails?.address?.city || "",
        state: paymentMethod.billingDetails?.address?.state || "",
        postalCode: paymentMethod.billingDetails?.address?.postalCode || "",
        country: paymentMethod.billingDetails?.address?.country || ""
      }
    });
  };

  const handleUpdatePaymentMethod = async () => {
    if (!selectedPaymentMethod) return;

    try {
      setPaymentMethodError("");

      // In a real implementation, this would call the API
      // For now, we'll simulate success
      setPaymentMethods(
        paymentMethods.map(pm =>
          pm._id === selectedPaymentMethod._id
            ? { ...pm, billingDetails: billingDetailsForm }
            : pm
        )
      );

      setIsEditingPaymentMethod(false);
      setSelectedPaymentMethod(null);

      // Reset form
      setBillingDetailsForm({
        name: "",
        email: "",
        phone: "",
        address: {
          line1: "",
          line2: "",
          city: "",
          state: "",
          postalCode: "",
          country: ""
        }
      });
    } catch (error) {
      console.error("Error updating payment method:", error);
      setPaymentMethodError("Error updating payment method. Please try again.");
    }
  };

  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      setPaymentMethodError("");

      // In a real implementation, this would call the API
      // For now, we'll simulate success
      setPaymentMethods(
        paymentMethods.map(pm => ({
          ...pm,
          isDefault: pm._id === paymentMethodId
        }))
      );
    } catch (error) {
      console.error("Error setting default payment method:", error);
      setPaymentMethodError("Error setting default payment method. Please try again.");
    }
  };

  const handleBillingDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'address') {
        setBillingDetailsForm(prev => ({
          ...prev,
          address: {
            ...prev.address,
            [child]: value
          }
        }));
      }
    } else {
      setBillingDetailsForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Load payment methods when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      fetchPaymentMethods();
    }
  }, [isAuthenticated]);

  const handleReplyClick = (conversationId: string) => {
    navigate(`/messages`);
  };

  useEffect(() => {
    if (conversationId) {
      setSelectedChat(conversationId);
      // fetchMessages(conversationId, true);
    }
  }, [conversationId]);

  if (!isAuthenticated) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen md:pt-24 pb-12 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* User Info */}
              <div className="px-6 py-6 border-b border-gray-200">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full bg-emerald-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden border-4 border-white shadow-md">
                      {user?.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user?.firstName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        user?.firstName?.[0]?.toUpperCase() || <User className="h-10 w-10" />
                      )}
                    </div>
                    <button className="absolute bottom-0 right-0 bg-emerald-500 p-2 rounded-full text-white border-2 border-white hover:bg-emerald-600 transition-colors">
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-gray-900 text-center">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-gray-500 text-sm">{user?.email}</p>
                  <p className="text-emerald-600 text-xs mt-1 font-medium">Member since 2023</p>
                  {/* Show user role if seller */}
                  {isSeller && (
                    <p className="text-orange-600 text-xs mt-1 font-medium bg-orange-50 px-2 py-1 rounded-full">
                      Seller Account
                    </p>
                  )}
                </div>
              </div>

              {/* Navigation */}
              <nav className="px-3 py-2">
                <div className="space-y-1">
                  <button
                    className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${activeTab === "profile"
                      ? "bg-emerald-50 text-emerald-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                      }`}
                    onClick={() => handleTabChange("profile")}
                  >
                    <User className="h-5 w-5 mr-3" />
                    My Profile
                  </button>
                  {/* Wardrobe - Only visible for sellers */}
                  {isSeller && (
                    <button
                      className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${activeTab === "wardrobe"
                        ? "bg-emerald-50 text-emerald-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                        }`}
                      onClick={() => handleTabChange("wardrobe")}
                    >
                      <ShoppingBag className="h-5 w-5 mr-3" />
                      My Wardrobe <span className="ml-auto bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{!isLoadingCount && (
                        productCount
                      )}</span>
                    </button>
                  )}
                  <button
                    className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${activeTab === "orders"
                      ? "bg-emerald-50 text-emerald-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                      }`}
                    onClick={() => handleTabChange("orders")}
                  >
                    <Package className="h-5 w-5 mr-3" />
                    My Orders
                    <span className="ml-auto bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {orderCount}
                    </span>
                  </button>

                  {/* Seller Orders - Only visible for sellers */}
                  {isSeller && (
                    <button
                      className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${activeTab === "seller-orders"
                        ? "bg-emerald-50 text-emerald-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                        }`}
                      onClick={() => handleTabChange("seller-orders")}
                    >
                      <ShoppingCart className="h-5 w-5 mr-3" />
                      Seller Orders
                      <span className="ml-auto bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {sellerOrderCount}
                      </span>
                    </button>
                  )}

                  <button
                    className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${activeTab === "addresses"
                      ? "bg-emerald-50 text-emerald-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                      }`}
                    onClick={() => handleTabChange("addresses")}
                  >
                    <MapPin className="h-5 w-5 mr-3" />
                    My Addresses
                  </button>

                  <button
                    className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${activeTab === "wishlist"
                      ? "bg-emerald-50 text-emerald-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                      }`}
                    onClick={() => handleTabChange("wishlist")}
                  >
                    <Heart className="h-5 w-5 mr-3" />
                    Wishlist <span className="ml-auto bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{wishlistCount}</span>
                  </button>

                  <button
                    className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${activeTab === "messages"
                      ? "bg-emerald-50 text-emerald-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                      }`}
                    onClick={() => handleTabChange("messages")}
                  >
                    <MessageSquare className="h-5 w-5 mr-3" />
                    Messages
                    {/* <span className="ml-auto bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full">3</span> */}
                  </button>

                  <button
                    className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${activeTab === "payment"
                      ? "bg-emerald-50 text-emerald-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                      }`}
                    onClick={() => handleTabChange("payment")}
                  >
                    <CreditCard className="h-5 w-5 mr-3" />
                    Payment Methods
                  </button>

                  <button
                    className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${activeTab === "settings"
                      ? "bg-emerald-50 text-emerald-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                      }`}
                    onClick={() => handleTabChange("settings")}
                  >
                    <Settings className="h-5 w-5 mr-3" />
                    Settings
                  </button>

                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <button
                      className="flex items-center w-full px-3 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Log Out
                    </button>
                  </div>
                </div>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 mb-8">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      className="flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      {isEditing ? "Cancel" : "Edit Profile"}
                    </button>
                  </div>

                  <div className="px-6 py-4">
                    {isEditing ? (
                      <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                              First Name
                            </label>
                            <input
                              type="text"
                              id="firstName"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              className="w-full border border-gray-300 rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                              Last Name
                            </label>
                            <input
                              type="text"
                              id="lastName"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              className="w-full border border-gray-300 rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                              Email Address
                            </label>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className="w-full border border-gray-300 rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              id="phone"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="w-full border border-gray-300 rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                              Address
                            </label>
                            <textarea
                              id="address"
                              name="address"
                              rows={3}
                              value={formData.address}
                              onChange={handleInputChange}
                              className="w-full border border-gray-300 rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 mr-3"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                          >
                            Save Changes
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-gray-500">First Name</p>
                            <p className="text-base text-gray-900">{user?.firstName || "Not set"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Last Name</p>
                            <p className="text-base text-gray-900">{user?.lastName || "Not set"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Email Address</p>
                            <p className="text-base text-gray-900">{user?.email || "Not set"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Phone Number</p>
                            <p className="text-base text-gray-900">{user?.phone || "Not set"}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-sm text-gray-500">Address</p>
                            <p className="text-base text-gray-900">{user?.address || "No address added yet"}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Account Security</h3>
                  </div>
                  <div className="px-6 py-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2">
                        <div>
                          <p className="text-gray-900 font-medium">Password</p>
                          <p className="text-sm text-gray-500">Last changed 3 months ago</p>
                        </div>
                        <button className="bg-white text-emerald-600 hover:text-emerald-700 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                          Change Password
                        </button>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <div>
                          <p className="text-gray-900 font-medium">Two-Factor Authentication</p>
                          <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                        </div>
                        <div className="relative inline-block w-12 mr-2 align-middle select-none">
                          <input type="checkbox" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-gray-300 appearance-none cursor-pointer transition-transform duration-200 ease-in-out translate-x-0" />
                          <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <div>
                          <p className="text-gray-900 font-medium">Active Sessions</p>
                          <p className="text-sm text-gray-500">Manage your logged in devices</p>
                        </div>
                        <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors">
                          View All
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            {/* Wardrobe Tab - Only for sellers */}
            {activeTab === "wardrobe" && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">My Listed Products</h3>
                  </div>
                  <button
                    onClick={() => navigate("/products/add")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm rounded-lg transition-colors"
                  >
                    Add New Product
                  </button>
                </div>

                {/* Replace the existing static badges with an interactive tab bar */}
                <div className="px-6 pt-4">
                  <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setSelectedProductFilter('total')}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${selectedProductFilter === 'total'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      Total: {productStats.total}
                    </button>
                    <button
                      onClick={() => setSelectedProductFilter('approved')}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${selectedProductFilter === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                        } border-l border-gray-200`}
                    >
                      Approved: {productStats.approved}
                    </button>
                    {productStats.pending > 0 && (
                      <button
                        onClick={() => setSelectedProductFilter('pending')}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${selectedProductFilter === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                          } border-l border-gray-200`}
                      >
                        Pending: {productStats.pending}
                      </button>
                    )}
                    {productStats.rejected > 0 && (
                      <button
                        onClick={() => setSelectedProductFilter('rejected')}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${selectedProductFilter === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                          } border-l border-gray-200`}
                      >
                        Rejected: {productStats.rejected}
                      </button>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4">
                  {isLoadingProducts ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Loading your products...</p>
                    </div>
                  ) : productsError ? (
                    <div className="text-center py-8 text-red-500">
                      <p>{productsError}</p>
                      <button
                        onClick={fetchSellerProducts}
                        className="mt-4 text-emerald-600 hover:text-emerald-800"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : getFilteredProducts().length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {getFilteredProducts().map((product) => (
                        <div key={product._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                          <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={formatImageUrl(product.images[0])}
                                alt={product.title}
                                className="w-full h-40 object-cover"
                              />
                            ) : (
                              <div className="w-full h-40 flex items-center justify-center bg-gray-200">
                                <ShoppingBag className="h-10 w-10 text-gray-400" />
                              </div>
                            )}
                          </div>

                          <div className="p-4">
                            <div className="flex justify-between items-start">
                              <h3 className="text-sm font-medium text-gray-900 truncate max-w-[70%]">{product.title}</h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : product.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                                }`}>
                                {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                              </span>
                            </div>

                            <p className="mt-1 text-sm font-medium text-gray-900">${product.price.toFixed(2)}</p>
                            {product.oemNumber && (
                              <p className="mt-1 text-xs text-gray-500">OEM: {product.oemNumber}</p>
                            )}
                            {product.category && (
                              <p className="mt-1 text-xs text-gray-500">
                                Category: {product.category.name}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                              Listed on {new Date(product.createdAt).toLocaleDateString()}
                            </p>

                            <div className="mt-4 flex space-x-3">
                              <button
                                onClick={() => navigate(`/products/${product._id}`)}
                                className="text-xs px-3 py-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-colors"
                              >
                                View
                              </button>
                              <button
                                onClick={() => navigate(`/products/${product._id}/edit`)}
                                className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteProduct(product._id)}
                                className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      {selectedProductFilter !== 'total' ? (
                        <>
                          <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No {selectedProductFilter} products found</h3>
                          <p className="mt-1 text-sm text-gray-500">Try selecting a different filter.</p>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No products listed yet</h3>
                          <p className="mt-1 text-sm text-gray-500">Get started by creating a new product listing.</p>
                          <div className="mt-6">
                            <button
                              type="button"
                              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                              onClick={() => navigate("/products/add")}
                            >
                              Add New Product
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">My Orders</h3>
                </div>
                <div className="px-6 py-4">
                  {orderError && (
                    <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      {orderError}
                    </div>
                  )}

                  {isLoadingOrders ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
                      <p className="mt-3 text-sm text-gray-500">Loading your orders...</p>
                    </div>
                  ) : orders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {orders.map((order) => (
                            <tr key={order._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {order._id.substring(0, 8).toUpperCase()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(order.createdAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                  </span>

                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ${order.totalAmount.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  className="text-emerald-600 hover:text-emerald-900 inline-flex items-center"
                                  onClick={() => navigate(`/orders/${order._id}`)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
                      <p className="mt-1 text-sm text-gray-500">Start shopping to see your orders here.</p>
                      <div className="mt-6">
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                          onClick={() => navigate("/")}
                        >
                          Browse Products
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Addresses Tab */}
            {activeTab === "addresses" && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">My Addresses</h3>
                  {!isAddingAddress && (
                    <button
                      onClick={() => setIsAddingAddress(true)}
                      className="flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add New Address
                    </button>
                  )}
                </div>
                <div className="px-6 py-4">
                  {addressError && (
                    <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      {addressError}
                    </div>
                  )}

                  {isAddingAddress ? (
                    <form onSubmit={handleAddressSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                            Street Address
                          </label>
                          <input
                            type="text"
                            id="street"
                            value={addressForm.street}
                            onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            id="city"
                            value={addressForm.city}
                            onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                            State
                          </label>
                          <input
                            type="text"
                            id="state"
                            value={addressForm.state}
                            onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            id="postalCode"
                            value={addressForm.postalCode}
                            onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                            Country
                          </label>
                          <input
                            type="text"
                            id="country"
                            value={addressForm.country}
                            onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isDefault"
                            checked={addressForm.isDefault}
                            onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                          />
                          <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
                            Set as default address
                          </label>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingAddress(false);
                            setEditingAddressId(null);
                            setAddressForm({
                              street: "",
                              city: "",
                              state: "",
                              postalCode: "",
                              country: "",
                              isDefault: false
                            });
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                          {editingAddressId ? "Update" : "Save"} Address
                        </button>
                      </div>
                    </form>
                  ) : isLoadingAddresses ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Loading addresses...</p>
                    </div>
                  ) : addresses.length > 0 ? (
                    <div className="space-y-4">
                      {addresses.map((address) => (
                        <div
                          key={address._id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-start space-x-3">
                              <div className="mt-1">
                                <MapPin className="h-5 w-5 text-gray-400" />
                              </div>
                              <div>
                                <div className="flex items-center">
                                  <p className="font-medium text-gray-900">
                                    {address.street}
                                  </p>
                                  {address.isDefault && (
                                    <span className="ml-2 bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-500 text-sm">
                                  {address.city}, {address.state} {address.postalCode}
                                </p>
                                <p className="text-gray-500 text-sm">{address.country}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              {!address.isDefault && (
                                <button
                                  onClick={() => handleSetDefaultAddress(address._id)}
                                  className="text-emerald-600 hover:text-emerald-700 text-sm"
                                >
                                  Set as Default
                                </button>
                              )}
                              <button
                                onClick={() => handleEditAddress(address)}
                                className="text-blue-600 hover:text-blue-700 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(address._id)}
                                className="text-red-600 hover:text-red-700 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No addresses added</h3>
                      <p className="mt-1 text-sm text-gray-500">Add your first address to get started.</p>
                      <div className="mt-6">
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add New Address
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Wishlist Tab */}
            {activeTab === "wishlist" && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">My Wishlist</h3>
                  {wishlistItems.length > 0 && (
                    <button
                      onClick={clearWishlist}
                      className="text-sm text-red-600 hover:text-red-800 flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear All
                    </button>
                  )}
                </div>
                <div className="px-6 py-4">
                  {isLoadingWishlist ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Loading your wishlist...</p>
                    </div>
                  ) : wishlistError ? (
                    <div className="text-center py-8 text-red-500 flex flex-col items-center">
                      <AlertCircle className="h-12 w-12 mb-2" />
                      <p>{wishlistError}</p>
                      <button
                        onClick={fetchWishlist}
                        className="mt-4 text-emerald-600 hover:text-emerald-800"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : wishlistItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {wishlistItems.map((item) => {
                        // Added safety check for item structure - updated for direct product structure
                        if (!item || !item._id) {
                          return null;
                        }

                        return (
                          <div key={item._id || 'missing-id'} className="flex space-x-4 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                              {item.images && item.images.length > 0 ? (
                                <img
                                  src={formatImageUrl(item.images[0])}
                                  alt={item.title || 'Product'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                  <ShoppingBag className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{item.title || 'Unnamed Product'}</p>
                              <p className="text-sm text-gray-500">${(item.price || 0).toFixed(2)}</p>
                              {item.oemNumber && (
                                <p className="text-xs text-gray-500 mt-1">OEM: {item.oemNumber}</p>
                              )}
                              {item.category && (
                                <p className="text-xs text-gray-500 mt-1">Category: {item.category.name}</p>
                              )}
                              <div className="mt-2 flex gap-2">
                                <button
                                  onClick={() => navigate(`/products/${item._id}`)}
                                  className="bg-emerald-600 text-white text-xs px-3 py-1 rounded hover:bg-emerald-700 transition-colors flex items-center"
                                >
                                  <ShoppingCart className="h-3 w-3 mr-1" />
                                  View Product
                                </button>
                                <button
                                  onClick={() => removeFromWishlist(item._id)}
                                  className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded hover:bg-gray-200 transition-colors flex items-center"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Heart className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Your wishlist is empty</h3>
                      <p className="mt-1 text-sm text-gray-500">Start adding items to your wishlist.</p>
                      <div className="mt-6">
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                          onClick={() => navigate("/")}
                        >
                          Browse Products
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Messages Tab */}
            {activeTab === "messages" && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
                </div>

                {conversations.map(conversation => (
                  <div key={conversation._id} className="py-4 px-6 max-h-auto ">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                          {conversation.participants[0].name.charAt(0)}
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {conversation.participants[0].name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {conversation.lastMessage?.content}
                        </p>
                        <button
                          onClick={() => handleReplyClick(conversation._id)}
                          className="text-blue-500 hover:underline"
                        >
                          Reply
                        </button>
                      </div>
                    </div></div>))} </div>


            )}

            {/* Payment Methods Tab */}
            {activeTab === "payment" && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
                </div>
                <div className="px-6 py-4">
                  {paymentMethodError && (
                    <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
                      {paymentMethodError}
                    </div>
                  )}

                  {isLoadingPaymentMethods ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {paymentMethods.length > 0 ? (
                        <>
                          {paymentMethods.map((paymentMethod) => (
                            <div
                              key={paymentMethod._id}
                              className={`border ${paymentMethod.isDefault ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'} rounded-lg p-4 flex justify-between items-center`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  {paymentMethod.cardType === 'visa' ? (
                                    <img src="/visa-icon.png" alt="Visa" className="h-8 w-8" />
                                  ) : paymentMethod.cardType === 'mastercard' ? (
                                    <img src="/mastercard-icon.png" alt="Mastercard" className="h-8 w-8" />
                                  ) : paymentMethod.cardType === 'amex' ? (
                                    <img src="/amex-icon.png" alt="American Express" className="h-8 w-8" />
                                  ) : (
                                    <CreditCard className="h-8 w-8 text-gray-400" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center">
                                    <p className="text-gray-900 font-medium capitalize">{paymentMethod.cardType} ending in {paymentMethod.lastFourDigits}</p>
                                    {paymentMethod.isDefault && (
                                      <span className="ml-2 bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500">Expires {paymentMethod.expirationMonth}/{paymentMethod.expirationYear}</p>
                                  {paymentMethod.billingDetails?.name && (
                                    <p className="text-sm text-gray-500">{paymentMethod.billingDetails.name}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {!paymentMethod.isDefault && (
                                  <button
                                    onClick={() => handleSetDefaultPaymentMethod(paymentMethod._id)}
                                    className="text-sm text-emerald-600 hover:text-emerald-800"
                                  >
                                    Set Default
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEditPaymentMethod(paymentMethod)}
                                  className="text-sm text-gray-600 hover:text-gray-900"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeletePaymentMethod(paymentMethod._id)}
                                  className="text-sm text-red-600 hover:text-red-800"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                          <p>You don't have any payment methods yet.</p>
                        </div>
                      )}

                      {!isAddingPaymentMethod ? (
                        <button
                          onClick={handleAddPaymentMethod}
                          className="w-full border border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors"
                        >
                          <p className="text-emerald-600 font-medium">+ Add New Payment Method</p>
                        </button>
                      ) : (
                        <CardForm
                          onSubmit={handlePaymentMethodSubmit}
                          onCancel={() => setIsAddingPaymentMethod(false)}
                          billingDetails={billingDetailsForm}
                          onBillingDetailsChange={handleBillingDetailsChange}
                          error={paymentMethodError}
                        />
                      )}

                      {isEditingPaymentMethod && selectedPaymentMethod && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                          <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Payment Method</h3>

                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name on Card</label>
                                <input
                                  type="text"
                                  name="name"
                                  value={billingDetailsForm.name}
                                  onChange={handleBillingDetailsChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                  type="email"
                                  name="email"
                                  value={billingDetailsForm.email}
                                  onChange={handleBillingDetailsChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                  type="tel"
                                  name="phone"
                                  value={billingDetailsForm.phone}
                                  onChange={handleBillingDetailsChange}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                              <button
                                onClick={() => {
                                  setIsEditingPaymentMethod(false);
                                  setSelectedPaymentMethod(null);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleUpdatePaymentMethod}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                              >
                                Save Changes
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Payment Security</h4>
                        <p className="text-sm text-gray-600">All transactions are secure and encrypted. We never store your full card details on our servers.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Account Settings</h3>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-200">
                      <div>
                        <p className="text-gray-900 font-medium">Email Notifications</p>
                        <p className="text-sm text-gray-500">Receive emails about your account activity</p>
                      </div>
                      <div className="relative inline-block w-12 mr-2 align-middle select-none">
                        <input type="checkbox" id="toggle-email" defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-gray-300 appearance-none cursor-pointer transition-transform duration-200 ease-in-out translate-x-6" />
                        <label htmlFor="toggle-email" className="toggle-label block overflow-hidden h-6 rounded-full bg-emerald-500 cursor-pointer"></label>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-3 border-b border-gray-200">
                      <div>
                        <p className="text-gray-900 font-medium">Marketing Preferences</p>
                        <p className="text-sm text-gray-500">Receive emails about new products and offers</p>
                      </div>
                      <div className="relative inline-block w-12 mr-2 align-middle select-none">
                        <input type="checkbox" id="toggle-marketing" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-gray-300 appearance-none cursor-pointer transition-transform duration-200 ease-in-out translate-x-0" />
                        <label htmlFor="toggle-marketing" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-3 border-b border-gray-200">
                      <div>
                        <p className="text-gray-900 font-medium">Profile Visibility</p>
                        <p className="text-sm text-gray-500">Control who can see your profile information</p>
                      </div>
                      <button className="text-sm text-emerald-600 font-medium hover:text-emerald-700 flex items-center">
                        Public <ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center py-3">
                      <div>
                        <p className="text-gray-900 font-medium">Language</p>
                        <p className="text-sm text-gray-500">Select your preferred language</p>
                      </div>
                      <button className="text-sm text-emerald-600 font-medium hover:text-emerald-700 flex items-center">
                        English <ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="text-red-600 font-medium">Danger Zone</h4>
                    <p className="text-sm text-gray-500 mt-1 mb-4">Permanently delete your account and all associated data</p>
                    <button className="bg-white text-red-600 border border-red-300 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Seller Orders Tab - Only for sellers */}
            {activeTab === "seller-orders" && isSeller && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Orders for My Products</h3>
                </div>

                {/* Status filter tabs */}
                <div className="px-6 pt-4">
                  <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setSellerOrderFilter("all")}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${sellerOrderFilter === "all"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                    >
                      All Orders
                    </button>
                    <button
                      onClick={() => setSellerOrderFilter("pending")}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${sellerOrderFilter === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                        } border-l border-gray-200`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => setSellerOrderFilter("processing")}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${sellerOrderFilter === "processing"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                        } border-l border-gray-200`}
                    >
                      Processing
                    </button>
                    <button
                      onClick={() => setSellerOrderFilter("shipped")}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${sellerOrderFilter === "shipped"
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                        } border-l border-gray-200`}
                    >
                      Shipped
                    </button>
                    <button
                      onClick={() => setSellerOrderFilter("delivered")}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${sellerOrderFilter === "delivered"
                        ? "bg-green-100 text-green-800"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                        } border-l border-gray-200`}
                    >
                      Delivered
                    </button>
                  </div>
                </div>

                <div className="px-6 py-4">
                  {sellerOrderError && (
                    <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      {sellerOrderError}
                    </div>
                  )}

                  {isLoadingSellerOrders ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
                      <p className="mt-3 text-sm text-gray-500">Loading orders...</p>
                    </div>
                  ) : getFilteredSellerOrders().length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {getFilteredSellerOrders().map((order) => (
                            <tr key={order._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {order._id.substring(0, 8).toUpperCase()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {order.buyer.firstName} {order.buyer.lastName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(order.createdAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                  </span>

                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ${order.totalAmount.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  className="text-emerald-600 hover:text-emerald-900 inline-flex items-center"
                                  onClick={() => navigate(`/orders/${order._id}`)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {sellerOrderFilter !== "all"
                          ? `No ${sellerOrderFilter} orders found. Try selecting a different filter.`
                          : "You haven't received any orders for your products yet."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Order Statistics */}
                {getFilteredSellerOrders().length > 0 && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Order Statistics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-xs text-gray-500">Total Orders</p>
                        <p className="text-lg font-semibold text-gray-900">{sellerOrders.length}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-xs text-gray-500">Pending</p>
                        <p className="text-lg font-semibold text-yellow-600">
                          {sellerOrders.filter(order => order.status === 'pending').length}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-xs text-gray-500">Shipped</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {sellerOrders.filter(order => order.status === 'shipped').length}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-xs text-gray-500">Delivered</p>
                        <p className="text-lg font-semibold text-green-600">
                          {sellerOrders.filter(order => order.status === 'delivered').length}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add custom style for toggle switches */}
      <style>{`
        .toggle-checkbox:checked {
          transform: translateX(100%);
          border-color: #10B981;
        }
        .toggle-checkbox:checked + .toggle-label {
          background-color: #10B981;
        }
      `}</style>
    </div>
  );
};

export default Profile; 