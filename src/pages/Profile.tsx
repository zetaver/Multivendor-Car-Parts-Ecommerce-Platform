import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store/store";
import { API_URL } from "../config";
import { useTranslation } from "react-i18next";
import {
  User as UserIcon,
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
  ShoppingCart,
  Trash2,
  MapPin,
  Plus,
  Eye,
  Edit3,
  Star,
  ThumbsUp,
  MessageCircle,
  X,
  Check,
} from "lucide-react";
import {
  useNavigate,
  useSearchParams,
  useParams,
  useLocation,
} from "react-router-dom";
import { logout } from "../store/slices/authSlice";
import { Conversation, getConversations } from "../services/messageService";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

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
    };
  };
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
  };
}

// CardForm component for Stripe integration
const CardForm: React.FC<{
  onSubmit: (paymentMethodId: string) => void;
  onCancel: () => void;
  billingDetails: BillingDetailsForm;
  onBillingDetailsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string;
}> = ({
  onSubmit,
  onCancel,
  billingDetails,
  onBillingDetailsChange,
  error,
}) => {
  const { t } = useTranslation();
  const [cardError, setCardError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // In a real implementation, this would use Stripe.js to create a payment method
    // For now, we'll simulate success with a test payment method ID
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // This would be the actual payment method ID from Stripe
      const paymentMethodId =
        "pm_" + Math.random().toString(36).substring(2, 15);

      onSubmit(paymentMethodId);
    } catch (error) {
      setCardError(
        "An error occurred while processing your card. Please try again."
      );
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <input
                type="text"
                placeholder="4242 4242 4242 4242"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration Date
                </label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVC
                </label>
                <input
                  type="text"
                  placeholder="123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {cardError && (
            <div className="mt-2 text-sm text-red-600">{cardError}</div>
          )}
        </div>

        {/* Billing details section */}
        <div className="space-y-4 mt-4">
          <h5 className="font-medium text-gray-900">Billing Details</h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={billingDetails.name}
                onChange={onBillingDetailsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={billingDetails.email}
                onChange={onBillingDetailsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  name="address.line1"
                  value={billingDetails.address.line1}
                  onChange={onBillingDetailsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apartment, suite, etc.
                </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="address.city"
                    value={billingDetails.address.city}
                    onChange={onBillingDetailsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State / Province
                  </label>
                  <input
                    type="text"
                    name="address.state"
                    value={billingDetails.address.state}
                    onChange={onBillingDetailsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
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
            {isProcessing ? "Processing..." : "Save Payment Method"}
          </button>
        </div>
      </form>
    </div>
  );
};

interface SellerProfileDetails {
  storeName: string;
  banner: string;
  firstName: string;
  lastName: string;
  rating: number;
  totalSales: number;
}

// Add this interface before ExtendedUser
interface UserType {
  _id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  role?: string;
}

// Then the ExtendedUser will extend from this interface
interface ExtendedUser extends UserType {
  storeName?: string;
  banner?: string;
  joinDate?: string;
  profilePicture?: string;
  countryCode?: string;
  phone?: string;
  location?: string;
  address?: string;
  state?: string;
  zipCode?: string;
  id?: string;
}

interface ReviewableOrder {
  _id: string;
  seller: {
    _id: string;
    firstName: string;
    lastName: string;
    storeName?: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface ReviewForm {
  rating: number;
  comment: string;
  sellerId: string;
  orderId: string;
  productId: string;
}

// Add this interface for user reviews
interface UserReview {
  _id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  seller: {
    _id: string;
    firstName?: string;
    lastName?: string;
    storeName?: string;
  };
  productId: {
    _id: string;
    title?: string;
    images?: string[];
  };
  order: {
    _id: string;
    createdAt?: string;
  };
}

// Add ConfirmationDialog component
interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  type: 'danger' | 'warning' | 'info';
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  type
}) => {
  if (!isOpen) return null;

  // Get color scheme based on type
  const getColorScheme = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <AlertCircle className="h-6 w-6 text-red-600" />,
          confirmButton: "bg-red-600 hover:bg-red-700 text-white",
          title: "text-red-600"
        };
      case 'warning':
        return {
          icon: <AlertCircle className="h-6 w-6 text-yellow-600" />,
          confirmButton: "bg-yellow-600 hover:bg-yellow-700 text-white",
          title: "text-yellow-600"
        };
      case 'info':
      default:
        return {
          icon: <AlertCircle className="h-6 w-6 text-emerald-600" />,
          confirmButton: "bg-emerald-600 hover:bg-emerald-700 text-white",
          title: "text-emerald-600"
        };
    }
  };

  const colorScheme = getColorScheme();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn">
        <div className="flex items-center mb-4">
          {colorScheme.icon}
          <h2 className={`text-lg font-semibold ml-2 ${colorScheme.title}`}>{title}</h2>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${colorScheme.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [userState, setUserState] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    state: "",
    zipCode: "",
    countryCode: "",
    location: "",
  });

  const location = useLocation();
  const navigate = useNavigate();
  const {
    user: authUser,
    isAuthenticated,
    logout,
    ensureToken,
  } = useAuth() as {
    user: ExtendedUser | null;
    isAuthenticated: boolean;
    logout: () => void;
    ensureToken: () => string | null;
  };
  const [storeName, setStoreName] = useState(authUser?.storeName || "");
  const [banner, setBanner] = useState(authUser?.banner || "");
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [sellerDetails, setSellerDetails] =
    useState<SellerProfileDetails | null>(null);
  const [isLoadingSellerDetails, setIsLoadingSellerDetails] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [reviewableOrders, setReviewableOrders] = useState<ReviewableOrder[]>(
    []
  );
  const [isLoadingReviewableOrders, setIsLoadingReviewableOrders] =
    useState(false);
  const [reviewableOrdersError, setReviewableOrdersError] = useState<
    string | null
  >(null);
  const [selectedOrderForReview, setSelectedOrderForReview] =
    useState<ReviewableOrder | null>(null);
  const [selectedProductForReview, setSelectedProductForReview] = useState<
    any | null
  >(null);
  const [reviewForm, setReviewForm] = useState<ReviewForm>({
    rating: 5,
    comment: "",
    sellerId: "",
    orderId: "",
    productId: "",
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState<string | null>(
    null
  );

  // Add these state variables with the other review state variables
  const [userReviews, setUserReviews] = useState<UserReview[]>([]);
  const [isLoadingUserReviews, setIsLoadingUserReviews] = useState(false);
  const [userReviewsError, setUserReviewsError] = useState<string | null>(null);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState<any>(null);
  const [isDeletingReview, setIsDeletingReview] = useState(false);
  const [reviewsTab, setReviewsTab] = useState<"write" | "my-reviews">("write");

  // Add becomingSellerLoading state near the other state definitions in the Profile component
  const [becomingSellerLoading, setBecomingSellerLoading] = useState(false);

  // Add state for language modal
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  // Add state for confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    onConfirm: () => {},
    type: 'info'
  });
  
  // Function to open confirmation dialog
  const openConfirmDialog = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: 'danger' | 'warning' | 'info' = 'info',
    confirmText: string = t('common.confirm') || 'Confirm',
    cancelText: string = t('common.cancel') || 'Cancel'
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      type
    });
  };
  
  // Function to close confirmation dialog
  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  // Add useEffect for initialization
  useEffect(() => {
    // Load user from localStorage
    const userFromStorage = localStorage.getItem("user");
    if (userFromStorage) {
      const parsedUser = JSON.parse(userFromStorage);
      console.log("Loaded user data from localStorage:", parsedUser);
      setUserState(parsedUser);

      // Initialize form data with user data
      setFormData({
        firstName: parsedUser.firstName || "",
        lastName: parsedUser.lastName || "",
        email: parsedUser.email || "",
        phone: parsedUser.phone || "",
        address: parsedUser.address || "",
        state: parsedUser.state || "",
        zipCode: parsedUser.zipCode || "",
        countryCode: parsedUser.countryCode || "",
        location: parsedUser.location || "",
      });

      console.log("Initialized form data with:", {
        address: parsedUser.address,
        state: parsedUser.state,
        zipCode: parsedUser.zipCode,
      });
    }

    // Check for location state to set active tab
    if (location.state && location.state.activeTab) {
      setActiveTab(location.state.activeTab);
    }

    // Check if contact info was passed from checkout
    if (location.state && location.state.contactInfo) {
      const contactInfo = location.state.contactInfo;
      setFormData((prevData) => ({
        ...prevData,
        firstName: contactInfo.firstName || prevData.firstName,
        lastName: contactInfo.lastName || prevData.lastName,
        email: contactInfo.email || prevData.email,
        phone: contactInfo.phone || prevData.phone,
        countryCode: contactInfo.countryCode || prevData.countryCode,
      }));
      setIsEditing(true);
    }
  }, [location]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Get token for authentication
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("Authentication token not found. Please log in again.");
      toast.error("Authentication token not found. Please log in again.");
      return;
    }

    try {
      // Use the new API endpoint to update user details
      const response = await fetch(`${API_URL}/api/users/profile/details`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          state: formData.state,
          zipCode: formData.zipCode,
          countryCode: formData.countryCode || "+1", // Default to +1 if not provided
          location: formData.location,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const data = await response.json();

      if (data.success) {
        // Log the response data to debug
        console.log("API response data:", data.data);

        // Update local user state with the updated data
        setUserState(data.data);

        // Update user in localStorage if needed
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

        // Ensure all form fields are explicitly included in the updated user data
        const updatedUser = {
          ...currentUser,
          ...data.data,
          address: data.data.address || formData.address,
          state: data.data.state || formData.state,
          zipCode: data.data.zipCode || formData.zipCode,
        };

        console.log("Updating localStorage user data:", updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));

        // Make sure authUser is updated if it's being used
        if (typeof window !== "undefined") {
          // Trigger a user reload in the auth context if possible
          if (window.dispatchEvent) {
            window.dispatchEvent(new Event("storage"));
          }
        }

        setIsEditing(false);
        toast.success("Profile updated successfully");
      } else {
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        toast.error(err.message);
      } else {
        setError("An unexpected error occurred");
        toast.error("An unexpected error occurred");
      }
    }
  };

  const [searchParams, setSearchParams] = useSearchParams();
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
    isDefault: false,
  });
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);
  const [wishlistError, setWishlistError] = useState("");
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [productCount, setProductCount] = useState(0);
  const [productStats, setProductStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });
  const [selectedProductFilter, setSelectedProductFilter] = useState("total");
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const userObj = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = userObj?.role || authUser?.role || "";
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
  const [selectedSellerOrderFilter, setSelectedSellerOrderFilter] =
    useState("total");

  // Payment methods state
  // const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  // const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false);
  // const [paymentMethodError, setPaymentMethodError] = useState("");
  // const [isAddingPaymentMethod, setIsAddingPaymentMethod] = useState(false);
  // const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  // const [isEditingPaymentMethod, setIsEditingPaymentMethod] = useState(false);
  // const [billingDetailsForm, setBillingDetailsForm] = useState<BillingDetailsForm>({
  //   name: "",
  //   email: "",
  //   phone: "",
  //   address: {
  //     line1: "",
  //     line2: "",
  //     city: "",
  //     state: "",
  //     postalCode: "",
  //     country: ""
  //   }
  // });

  const { conversationId } = useParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations();
        setConversations(data);
      } catch (error) {
        console.error("Error fetching conversations:", error);
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
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update order status: ${response.status}`);
      }

      // Update the order status in the local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
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
  const availableStatuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  const fetchAddresses = async () => {
    try {
      setIsLoadingAddresses(true);
      setAddressError("");

      const response = await fetch(`${API_URL}/api/addresses`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
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
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(addressForm),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${editingAddressId ? "update" : "create"} address: ${
            response.status
          }`
        );
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
        isDefault: false,
      });
    } catch (error) {
      console.error("Error saving address:", error);
      setAddressError(
        `Failed to ${
          editingAddressId ? "update" : "create"
        } address. Please try again.`
      );
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    // Replace window.confirm with custom dialog
    openConfirmDialog(
      t('common.confirmDelete') || 'Confirm Deletion',
      t('common.confirmDeleteAddress') || 'Are you sure you want to delete this address?',
      async () => {
        try {
          const token = localStorage.getItem('accessToken');
          const response = await fetch(`${API_URL}/api/addresses/${addressId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
  
          if (!response.ok) {
            throw new Error('Failed to delete address');
          }
  
          // Remove the address from the local state
          setAddresses(prevAddresses => prevAddresses.filter(addr => addr._id !== addressId));
          
          // Show success message
          toast.success('Address deleted successfully');
        } catch (error) {
          console.error('Error deleting address:', error);
          toast.error('Failed to delete address');
        }
      },
      'danger'
    );
  };

  const handleEditAddress = (address: Address) => {
    setAddressForm({
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setEditingAddressId(address._id);
    setIsAddingAddress(true);
  };
  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      setAddressError(""); // Clear any existing errors

      const response = await fetch(
        `${API_URL}/api/addresses/${addressId}/default`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to set default address: ${response.status}`
        );
      }

      // Update the addresses list to reflect the change
      setAddresses((prevAddresses) =>
        prevAddresses.map((addr) => ({
          ...addr,
          isDefault: addr._id === addressId,
        }))
      );
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
    const token = localStorage.getItem("accessToken");
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const userRole = storedUser?.role || "";

    console.log("Profile - Auth check:", {
      isAuthenticated,
      token,
      userRole,
      storedUser,
    });

    if (!isAuthenticated && !token) {
      // Only redirect if both Redux state is unauthenticated AND no token exists
      navigate("/login", { state: { returnUrl: "/profile?tab=profile" } });
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
    const tabParam = searchParams.get("tab");
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
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
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
      const userId =
        authUser?.id || JSON.parse(localStorage.getItem("user") || "{}")._id;

      if (!userId) {
        console.error("User ID not found");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/products/seller/${userId}/count`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

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
          rejected: data.data.rejected,
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
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
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
    openConfirmDialog(
      t('profile.logout.button'),
      t('profile.logout.confirmation'),
      () => {
        logout();
        navigate("/");
        closeConfirmDialog();
      },
      'danger',
      t('profile.logout.button'),
      t('common.cancel')
    );
  };

  const deleteProduct = async (productId: string) => {
    openConfirmDialog(
      t('common.confirmDelete') || 'Confirm Deletion',
      t('common.confirmDeleteProduct') || 'Are you sure you want to delete this product? This action cannot be undone.',
      async () => {
        try {
          const response = await fetch(`${API_URL}/api/products/${productId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to delete product: ${response.status}`);
          }

          // Remove the product from the local state
          setSellerProducts((prevProducts) =>
            prevProducts.filter((product) => product._id !== productId)
          );

          alert("Product deleted successfully!");
        } catch (error) {
          console.error("Error deleting product:", error);
          alert("Failed to delete product. Please try again.");
        }
        closeConfirmDialog();
      },
      'danger'
    );
  };

  const formatImageUrl = (imageUrl: string) => {
    if (!imageUrl) return "";

    // If the URL is already absolute, return it as is
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }

    // If it's a relative path starting with /api/media, add the base URL
    if (imageUrl.startsWith("/api/media/")) {
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
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch wishlist: ${response.status}`);
      }

      const data = await response.json();

      // Add safety check for data structure - adjusted for nested response
      if (
        !data ||
        !data.success ||
        !data.data ||
        !Array.isArray(data.data.products)
      ) {
        console.error("Invalid wishlist data format:", data);
        setWishlistItems([]);
        setWishlistError("Received invalid data format from server.");
        return;
      }

      // Set wishlist items from the nested data structure
      setWishlistItems(data.data.products);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      setWishlistError(
        "Failed to load wishlist items. Please try again later."
      );
      // Initialize with empty array on error to prevent rendering issues
      setWishlistItems([]);
    } finally {
      setIsLoadingWishlist(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/wishlist/remove/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to remove item: ${response.status}`);
      }

      // Update wishlist items by filtering out the removed product
      setWishlistItems((prev) => prev.filter((item) => item._id !== productId));
    } catch (error) {
      console.error("Error removing item from wishlist:", error);
      alert("Failed to remove item from wishlist. Please try again.");
    }
  };

  const clearWishlist = async () => {
    // Replace window.confirm with custom dialog
    openConfirmDialog(
      t('common.confirmClear') || 'Confirm Clear Wishlist',
      t('common.confirmClearWishlist') || 'Are you sure you want to clear your entire wishlist?',
      async () => {
        try {
          const response = await fetch(`${API_URL}/api/wishlist/clear`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          });
  
          if (!response.ok) {
            throw new Error(`Failed to clear wishlist: ${response.status}`);
          }
  
          setWishlistItems([]);
        } catch (error) {
          console.error("Error clearing wishlist:", error);
          alert("Failed to clear wishlist. Please try again.");
        }
      },
      'warning'
    );
  };

  const fetchWishlistCount = async () => {
    try {
      const response = await fetch(`${API_URL}/api/wishlist/count`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
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
  // useEffect(() => {
  //   if (activeTab === "payment") {
  //     fetchPaymentMethods();
  //   }
  // }, [activeTab]);

  // Add this function for filtering products by status
  const getFilteredProducts = () => {
    if (selectedProductFilter === "total") {
      return sellerProducts;
    }
    return sellerProducts.filter(
      (product) => product.status === selectedProductFilter
    );
  };

  // Add a function to handle tab navigation that updates both the state and URL
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab: tab });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "pending":
      default:
        return "bg-gray-100 text-gray-800";
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
      if (
        activeDropdownId &&
        !(event.target as Element).closest(".status-dropdown")
      ) {
        setActiveDropdownId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
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
      setSellerOrderError(
        "Failed to load seller orders. Please try again later."
      );
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
    return sellerOrders.filter((order) => order.status === sellerOrderFilter);
  };

  useEffect(() => {
    // Check if user is a seller from local storage or user object
    const userObj =
      authUser || JSON.parse(localStorage.getItem("user") || "{}");

    // Set seller status based on role from either source
    if (userObj?.role === "seller") {
      setIsSeller(true);
    }

    console.log("User role check:", { userObjRole: userObj?.role, isSeller });
  }, [authUser]);

  // Payment methods functions
  // const fetchPaymentMethods = async () => {
  //   setIsLoadingPaymentMethods(true);
  //   setPaymentMethodError("");

  //   try {

  //     await new Promise(resolve => setTimeout(resolve, 1000));

  //     if (paymentMethods.length === 0) {

  //       const samplePaymentMethod = {
  //         _id: "sample-payment-method-id",
  //         cardType: "visa",
  //         lastFourDigits: "4242",
  //         expirationMonth: "12",
  //         expirationYear: "2025",
  //         isDefault: true,
  //         billingDetails: {
  //           name: authUser?.firstName && authUser?.lastName ? `${authUser.firstName} ${authUser.lastName}` : "John Doe",
  //           email: authUser?.email || "john@example.com",
  //           phone: authUser?.phone || "+1234567890"
  //         }
  //       };

  //       setPaymentMethods([samplePaymentMethod]);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching payment methods:", error);
  //     setPaymentMethodError("Error fetching payment methods. Please try again.");
  //   } finally {
  //     setIsLoadingPaymentMethods(false);
  //   }
  // };

  // const handleAddPaymentMethod = () => {
  //   setIsAddingPaymentMethod(true);
  //   setBillingDetailsForm({
  //     name: authUser?.firstName && authUser?.lastName ? `${authUser.firstName} ${authUser.lastName}` : "",
  //     email: authUser?.email || "",
  //     phone: authUser?.phone || "",
  //     address: {
  //       line1: "",
  //       line2: "",
  //       city: "",
  //       state: "",
  //       postalCode: "",
  //       country: ""
  //     }
  //   });
  //   setPaymentMethodError("");
  // };

  // const handlePaymentMethodSubmit = async (paymentMethodId: string) => {
  //   try {
  //     setPaymentMethodError("");
  //     const token = localStorage.getItem("accessToken");
  //     const mockPaymentMethod = {
  //       _id: Math.random().toString(36).substring(2, 15),
  //       cardType: "visa",
  //       lastFourDigits: "4242",
  //       expirationMonth: "12",
  //       expirationYear: "2025",
  //       isDefault: paymentMethods.length === 0,
  //       billingDetails: billingDetailsForm
  //     };

  //     setPaymentMethods([...paymentMethods, mockPaymentMethod]);
  //     setIsAddingPaymentMethod(false);

  //     setBillingDetailsForm({
  //       name: "",
  //       email: "",
  //       phone: "",
  //       address: {
  //         line1: "",
  //         line2: "",
  //         city: "",
  //         state: "",
  //         postalCode: "",
  //         country: ""
  //       }
  //     });
  //   } catch (error) {
  //     console.error("Error adding payment method:", error);
  //     setPaymentMethodError("Error adding payment method. Please try again.");
  //   }
  // };

  // const handleDeletePaymentMethod = async (paymentMethodId: string) => {
  //   try {
  //     setPaymentMethodError("");

  //     // Confirm deletion
  //     if (!window.confirm("Are you sure you want to remove this payment method?")) {
  //       return;
  //     }

  //     setPaymentMethods(paymentMethods.filter(pm => pm._id !== paymentMethodId));

  //   } catch (error) {
  //     console.error("Error deleting payment method:", error);
  //     setPaymentMethodError("Error deleting payment method. Please try again.");
  //   }
  // };

  // const handleEditPaymentMethod = (paymentMethod: PaymentMethod) => {
  //   setSelectedPaymentMethod(paymentMethod);
  //   setIsEditingPaymentMethod(true);
  //   setBillingDetailsForm({
  //     name: paymentMethod.billingDetails?.name || "",
  //     email: paymentMethod.billingDetails?.email || "",
  //     phone: paymentMethod.billingDetails?.phone || "",
  //     address: {
  //       line1: paymentMethod.billingDetails?.address?.line1 || "",
  //       line2: paymentMethod.billingDetails?.address?.line2 || "",
  //       city: paymentMethod.billingDetails?.address?.city || "",
  //       state: paymentMethod.billingDetails?.address?.state || "",
  //       postalCode: paymentMethod.billingDetails?.address?.postalCode || "",
  //       country: paymentMethod.billingDetails?.address?.country || ""
  //     }
  //   });
  // };

  // const handleUpdatePaymentMethod = async () => {
  //   if (!selectedPaymentMethod) return;

  //   try {
  //     setPaymentMethodError("");

  //     setPaymentMethods(
  //       paymentMethods.map(pm =>
  //         pm._id === selectedPaymentMethod._id
  //           ? { ...pm, billingDetails: billingDetailsForm }
  //           : pm
  //       )
  //     );

  //     setIsEditingPaymentMethod(false);
  //     setSelectedPaymentMethod(null);

  //     setBillingDetailsForm({
  //       name: "",
  //       email: "",
  //       phone: "",
  //       address: {
  //         line1: "",
  //         line2: "",
  //         city: "",
  //         state: "",
  //         postalCode: "",
  //         country: ""
  //       }
  //     });
  //   } catch (error) {
  //     console.error("Error updating payment method:", error);
  //     setPaymentMethodError("Error updating payment method. Please try again.");
  //   }
  // };

  // const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
  //   try {
  //     setPaymentMethodError("");

  //     setPaymentMethods(
  //       paymentMethods.map(pm => ({
  //         ...pm,
  //         isDefault: pm._id === paymentMethodId
  //       }))
  //     );
  //   } catch (error) {
  //     console.error("Error setting default payment method:", error);
  //     setPaymentMethodError("Error setting default payment method. Please try again.");
  //   }
  // };

  // const handleBillingDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const { name, value } = e.target;

  //   if (name.includes('.')) {
  //     const [parent, child] = name.split('.');
  //     if (parent === 'address') {
  //       setBillingDetailsForm(prev => ({
  //         ...prev,
  //         address: {
  //           ...prev.address,
  //           [child]: value
  //         }
  //       }));
  //     }
  //   } else {
  //     setBillingDetailsForm(prev => ({
  //       ...prev,
  //       [name]: value
  //     }));
  //   }
  // };

  // useEffect(() => {
  //   if (isAuthenticated) {
  //     fetchPaymentMethods();
  //   }
  // }, [isAuthenticated]);

  const handleReplyClick = (conversationId: string) => {
    navigate(`/messages`);
  };

  useEffect(() => {
    if (conversationId) {
      setSelectedChat(conversationId);
    }
  }, [conversationId]);

  // Add image upload function
  const uploadImage = async () => {
    if (!imageFile) return null;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      const token = ensureToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`${API_URL}/api/media/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      // The API returns { success: true, url: "/api/media/filename.jpg" }
      // We need to construct the full URL
      const imageUrl = data.url.startsWith("http")
        ? data.url
        : `${API_URL}${data.url}`;

      return imageUrl;
    } catch (err) {
      console.error("Error uploading image:", err);
      setUploadError(
        "Error uploading image: " +
          (err instanceof Error ? err.message : String(err))
      );
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);

    // Create preview for selected image
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview("");
    }
  };

  // Update the handleUpdateSellerProfile function to include image upload
  const handleUpdateSellerProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      const token = ensureToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      // Upload image if a file is selected
      let bannerUrl = banner;
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          bannerUrl = uploadedUrl;
        } else if (uploadError) {
          // If there was an upload error but we have a previous banner URL, we can still proceed
          // Otherwise, the error has already been set by uploadImage
          if (!banner) {
            return;
          }
        }
      }

      const response = await axios.put(
        `${API_URL}/api/users/seller/profile`,
        {
          storeName,
          banner: bannerUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setUpdateSuccess(true);
        setIsEditing(false);
        setImageFile(null);
        setImagePreview("");
        // Refresh seller details after successful update
        await fetchSellerDetails();
      }
    } catch (error) {
      console.error("Error updating seller profile:", error);
      setUpdateError(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    }
  };

  // Add this new function to fetch seller details
  const fetchSellerDetails = async () => {
    if (!authUser?._id) return;

    setIsLoadingSellerDetails(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/users/seller/${authUser._id}/details`
      );
      if (response.data.success) {
        setSellerDetails(response.data.data);
        // Update local state with fetched details
        setStoreName(response.data.data.storeName || "");
        setBanner(response.data.data.banner || "");
      }
    } catch (error) {
      console.error("Error fetching seller details:", error);
    } finally {
      setIsLoadingSellerDetails(false);
    }
  };

  // Add useEffect to fetch seller details when component mounts
  useEffect(() => {
    if (authUser?.role === "seller") {
      fetchSellerDetails();
    }
  }, [authUser?._id]);

  const fetchReviewableOrders = async () => {
    try {
      setIsLoadingReviewableOrders(true);
      setReviewableOrdersError(null);

      const response = await fetch(`${API_URL}/api/reviews/eligible-orders`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch reviewable orders: ${response.status}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch reviewable orders");
      }

      setReviewableOrders(data.data || []);
    } catch (error) {
      console.error("Error fetching reviewable orders:", error);
      setReviewableOrdersError(
        "Failed to load orders eligible for review. Please try again later."
      );
    } finally {
      setIsLoadingReviewableOrders(false);
    }
  };

  // Add this useEffect to fetch reviewable orders when the "reviews" tab is active
  useEffect(() => {
    if (activeTab === "reviews") {
      fetchReviewableOrders();
    }
  }, [activeTab]);

  // Add these functions for handling reviews
  const selectOrderForReview = (order: ReviewableOrder) => {
    setSelectedOrderForReview(order);
    setSelectedProductForReview(null);

    // Reset the review form
    setReviewForm({
      rating: 5,
      comment: "",
      sellerId: order.seller._id,
      orderId: order._id,
      productId: "",
    });

    setReviewSubmitSuccess(false);
    setReviewSubmitError(null);
  };

  const selectProductForReview = (product: any) => {
    setSelectedProductForReview(product);

    // Update the productId in the review form
    setReviewForm((prev) => ({
      ...prev,
      productId: product._id,
    }));
  };

  const handleRatingChange = (rating: number) => {
    setReviewForm((prev) => ({
      ...prev,
      rating,
    }));
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReviewForm((prev) => ({
      ...prev,
      comment: e.target.value,
    }));
  };

  const submitReview = async () => {
    try {
      setIsSubmittingReview(true);
      setReviewSubmitError(null);

      // Validate the form
      if (
        !reviewForm.sellerId ||
        !reviewForm.orderId ||
        !reviewForm.productId
      ) {
        throw new Error("Please select a product to review");
      }

      const response = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(reviewForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to submit review: ${response.status}`
        );
      }

      const data = await response.json();

      if (data.success) {
        setReviewSubmitSuccess(true);

        // Refresh the list of reviewable orders
        fetchReviewableOrders();

        // Reset the selected order and product
        setSelectedOrderForReview(null);
        setSelectedProductForReview(null);
      } else {
        throw new Error(data.message || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      setReviewSubmitError(
        error instanceof Error
          ? error.message
          : "An error occurred while submitting your review"
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Fetch user's submitted reviews
  const fetchUserReviews = async () => {
    try {
      console.log("Fetching user reviews from:", `${API_URL}/api/reviews/user`);
      setIsLoadingUserReviews(true);
      setUserReviewsError(null);

      // Initialize reviews as empty array to prevent undefined reference
      setUserReviews([]);

      // Get the auth token
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("No authentication token found in localStorage");
        throw new Error("Authentication required. Please log in again.");
      }

      console.log(
        "Using token (first 10 chars):",
        token.substring(0, 10) + "..."
      );

      const response = await fetch(`${API_URL}/api/reviews/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(
          `Failed to fetch user reviews: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("Reviews data received:", data);

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch user reviews");
      }

      // Make sure we always set an array, even if data.data is null/undefined
      const reviews = Array.isArray(data.data) ? data.data : [];
      setUserReviews(reviews);
      console.log("User reviews set:", reviews.length, "reviews");
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      setUserReviewsError(
        "Failed to load your reviews. Please try again later."
      );
    } finally {
      setIsLoadingUserReviews(false);
    }
  };

  // Add this useEffect to fetch user reviews when the "reviews" tab is active
  useEffect(() => {
    if (activeTab === "reviews" && reviewsTab === "my-reviews") {
      fetchUserReviews();
    }
  }, [activeTab, reviewsTab]);

  // Add these functions for handling review updates and deletions
  const startEditReview = (review: any) => {
    setReviewToEdit(review);
    setReviewForm({
      rating: review.rating,
      comment: review.comment || "",
      sellerId: review.seller._id,
      orderId: review.order._id,
      productId: review.productId._id,
    });
    setIsEditingReview(true);
    setReviewSubmitSuccess(false);
    setReviewSubmitError(null);
  };

  const cancelEditReview = () => {
    setReviewToEdit(null);
    setIsEditingReview(false);
  };

  const updateReview = async () => {
    try {
      setIsSubmittingReview(true);
      setReviewSubmitError(null);

      if (!reviewToEdit || !reviewToEdit._id) {
        throw new Error("Cannot update review: review ID is missing");
      }

      console.log(`Updating review ${reviewToEdit._id} with:`, {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });

      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const response = await fetch(
        `${API_URL}/api/reviews/${reviewToEdit._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating: reviewForm.rating,
            comment: reviewForm.comment,
          }),
        }
      );

      console.log("Update response status:", response.status);

      if (!response.ok) {
        let errorMessage = `Failed to update review: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If we can't parse the error as JSON, just use the status code
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Update response data:", data);

      if (data.success) {
        setReviewSubmitSuccess(true);
        setIsEditingReview(false);
        setReviewToEdit(null);

        // Refresh the list of user reviews
        fetchUserReviews();
      } else {
        throw new Error(data.message || "Failed to update review");
      }
    } catch (error) {
      console.error("Error updating review:", error);
      setReviewSubmitError(
        error instanceof Error
          ? error.message
          : "An error occurred while updating your review"
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const deleteReview = async (reviewId: string) => {
    openConfirmDialog(
      t('common.confirmDelete') || 'Confirm Deletion',
      t('profile.reviews.myReviews.deleteConfirmation'),
      async () => {
        try {
          setIsDeletingReview(true);
          
          const token = localStorage.getItem('accessToken');
          const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to delete review');
          }
          
          // Remove the deleted review from the state
          setUserReviews(prevReviews => prevReviews.filter(review => review._id !== reviewId));
          
          toast.success(t('profile.reviews.myReviews.deleteSuccess'));
        } catch (error) {
          console.error('Error deleting review:', error);
          toast.error(t('profile.reviews.myReviews.deleteError'));
        } finally {
          setIsDeletingReview(false);
        }
      },
      'danger'
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  const becomeASeller = async () => {
    try {
      setBecomingSellerLoading(true);
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`${API_URL}/api/users/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: "seller",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const currentUserData = JSON.parse(
          localStorage.getItem("user") || "{}"
        );

        localStorage.removeItem("accessToken");

        const updatedUser = {
          ...currentUserData,
          isSeller: true,
          role: "seller",
          roles: data.user?.roles || ["seller"],
        };

        // Update user in localStorage
        localStorage.setItem("user", JSON.stringify(updatedUser));

        // Show success message
        toast.success("You are now a seller!");

        // Reload page to reflect changes
        window.location.reload();
        navigate("/login");
      } else {
        toast.error(data.message || "Failed to become a seller");
      }
    } catch (error) {
      console.error("Error becoming a seller:", error);
      toast.error("Failed to become a seller");
    } finally {
      setBecomingSellerLoading(false);
    }
  };

  // Add language change function
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsLanguageModalOpen(false);
  };

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
                      {authUser?.profilePicture ? (
                        <img
                          src={authUser.profilePicture}
                          alt={authUser?.firstName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>
                          {sellerDetails?.storeName?.[0] ||
                            storeName?.[0] ||
                            (authUser?.firstName
                              ? authUser?.firstName[0]
                              : "S")}
                        </span>
                      )}
                    </div>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-gray-900 text-center">
                    {authUser?.firstName} {authUser?.lastName}
                  </h3>
                  <p className="text-gray-500 text-sm">{authUser?.email}</p>
                  <p className="text-emerald-600 text-xs mt-1 font-medium">
                    Member since{" "}
                    {authUser?.joinDate
                      ? new Date(authUser.joinDate).getFullYear()
                      : new Date().getFullYear()}
                  </p>
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
                    className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeTab === "profile"
                        ? "bg-emerald-50 text-emerald-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => handleTabChange("profile")}
                  >
                    <UserIcon className="h-5 w-5 mr-3" />
                    {t("profile.tabs.profile")}
                  </button>

                  {/* Wardrobe - Only visible for sellers */}
                  {isSeller && (
                    <button
                      className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                        activeTab === "wardrobe"
                          ? "bg-emerald-50 text-emerald-700 font-medium"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => handleTabChange("wardrobe")}
                    >
                      <Package className="h-5 w-5 mr-3" />
                      {t("profile.tabs.wardrobe")}{" "}
                      <span className="ml-auto bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {!isLoadingCount && productCount}
                      </span>
                    </button>
                  )}
                  <button
                    className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeTab === "orders"
                        ? "bg-emerald-50 text-emerald-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => handleTabChange("orders")}
                  >
                    <Package className="h-5 w-5 mr-3" />
                    {t("profile.tabs.orders")}
                    <span className="ml-auto bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {orderCount}
                    </span>
                  </button>

                  {/* Seller Orders - Only visible for sellers */}
                  {isSeller && (
                    <button
                      className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                        activeTab === "seller-orders"
                          ? "bg-emerald-50 text-emerald-700 font-medium"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => handleTabChange("seller-orders")}
                    >
                      <ShoppingCart className="h-5 w-5 mr-3" />
                      {t("profile.tabs.sellerOrders")}
                      <span className="ml-auto bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {sellerOrderCount}
                      </span>
                    </button>
                  )}

                  <button
                    className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeTab === "addresses"
                        ? "bg-emerald-50 text-emerald-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => handleTabChange("addresses")}
                  >
                    <MapPin className="h-5 w-5 mr-3" />
                    {t("profile.tabs.addresses")}
                  </button>

                  <button
                    className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeTab === "wishlist"
                        ? "bg-emerald-50 text-emerald-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => handleTabChange("wishlist")}
                  >
                    <Heart className="h-5 w-5 mr-3" />
                    {t("profile.tabs.wishlist")}{" "}
                    <span className="ml-auto bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {wishlistCount}
                    </span>
                  </button>

                  <button
                    className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeTab === "reviews"
                        ? "bg-emerald-50 text-emerald-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => handleTabChange("reviews")}
                  >
                    <Star className="h-5 w-5 mr-3" />
                    {t("profile.tabs.reviews")}{" "}
                    <span className="ml-auto bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {userReviews.length}
                    </span>
                  </button>

                  <button
                    className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeTab === "messages"
                        ? "bg-emerald-50 text-emerald-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => handleTabChange("messages")}
                  >
                    <MessageSquare className="h-5 w-5 mr-3" />
                    {t("profile.tabs.messages")}{" "}
                    <span className="ml-auto bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {conversations?.length || 0}
                    </span>
                    {/* <span className="ml-auto bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded-full">3</span> */}
                  </button>

                  <button
                    className={`flex items-center w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeTab === "settings"
                        ? "bg-emerald-50 text-emerald-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => handleTabChange("settings")}
                  >
                    <Settings className="h-5 w-5 mr-3" />
                    {t("profile.tabs.settings")}
                  </button>

                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <button
                      className="flex items-center w-full px-3 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      {t("profile.logout.button")}
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
                {/* Conditionally render buyer or seller profile based on role */}
                {authUser?.role === "seller" ? (
                  // Seller Profile
                  <div className="space-y-6">
                    {/* Store Banner and Info */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                      {/* Banner Image */}
                      <div className="h-48 bg-gradient-to-r from-blue-500 to-blue-600 relative">
                        {isLoadingSellerDetails ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                          </div>
                        ) : isEditing ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                            {imagePreview ? (
                              <div className="relative w-full h-full">
                                <img
                                  src={imagePreview}
                                  alt="Banner Preview"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setImageFile(null);
                                      setImagePreview("");
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 mb-2"
                                  >
                                    {t("profile.fields.removeImage")}
                                  </button>
                                  <p className="text-white text-sm">
                                    Preview only - save to apply changes
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <>
                                <label className="flex flex-col items-center justify-center cursor-pointer mb-2">
                                  <div className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    {isUploading
                                      ? t("profile.fields.uploading")
                                      : t("profile.fields.selectBannerImage")}
                                  </div>
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    disabled={isUploading}
                                  />
                                </label>
                                <input
                                  type="text"
                                  value={banner}
                                  onChange={(e) => setBanner(e.target.value)}
                                  placeholder="Or enter banner image URL"
                                  className="w-3/4 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                  disabled={isUploading}
                                />
                                {uploadError && (
                                  <p className="text-red-600 text-sm mt-1">
                                    {uploadError}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          <img
                            src={
                              sellerDetails?.banner ||
                              banner ||
                              "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80&w=1920"
                            }
                            alt="Store Banner"
                            className="w-full h-full object-cover opacity-50"
                          />
                        )}
                        {/* Store Icon - Positioned to overlap banner and content */}
                        <div className="absolute -bottom-16 left-6">
                          <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg">
                            <div className="w-full h-full bg-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                              {sellerDetails?.storeName?.[0] ||
                                storeName?.[0] ||
                                (authUser?.firstName
                                  ? authUser?.firstName[0]
                                  : "S")}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Store Info */}
                      <div className="pt-20 px-6 pb-6">
                        {isLoadingSellerDetails ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          </div>
                        ) : isEditing ? (
                          <form
                            onSubmit={handleUpdateSellerProfile}
                            className="space-y-4"
                          >
                            <div>
                              <label
                                htmlFor="storeName"
                                className="block text-sm font-medium text-gray-700"
                              >
                                {t("profile.fields.storeName")}
                              </label>
                              <input
                                type="text"
                                id="storeName"
                                value={storeName}
                                onChange={(e) => setStoreName(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                placeholder={t(
                                  "profile.fields.storeNamePlaceholder"
                                )}
                              />
                            </div>
                            {updateError && (
                              <div className="text-red-600 text-sm">
                                {updateError}
                              </div>
                            )}
                            {updateSuccess && (
                              <div className="text-green-600 text-sm">
                                {t("profile.fields.updateSuccess")}
                              </div>
                            )}
                            <div className="flex space-x-3">
                              <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              >
                                {t("profile.fields.saveChanges")}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditing(false);
                                  setStoreName(authUser?.storeName || "");
                                  setBanner(authUser?.banner || "");
                                  setUpdateError(null);
                                  setUpdateSuccess(false);
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              >
                                {t("profile.fields.cancel")}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="flex justify-between items-start">
                              <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                  {sellerDetails?.storeName ||
                                    storeName ||
                                    "Your Store Name"}
                                </h1>
                                <p className="text-gray-500 mt-1">
                                  {t("profile.fields.memberSince")}{" "}
                                  {authUser?.joinDate
                                    ? new Date(authUser.joinDate).getFullYear()
                                    : new Date().getFullYear()}{" "}
                                  • {sellerOrderCount || 0}{" "}
                                  {t("profile.fields.sales")}
                                </p>
                                {sellerDetails?.rating && (
                                  <div className="flex items-center mt-1">
                                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                    <span className="ml-1 text-sm text-gray-600">
                                      {sellerDetails.rating.toFixed(1)}
                                    </span>
                                    <span className="ml-1 text-sm text-gray-600">
                                      • {t("profile.fields.reviews")}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 focus:outline-none"
                              >
                                {t("profile.fields.editProfile")}
                              </button>
                            </div>
                            <div className="mt-4 flex items-center space-x-4">
                              <div className="text-sm">
                                <span className="text-gray-500">
                                  {t("profile.fields.activeListings")}:
                                </span>
                                <span className="ml-1 font-medium">
                                  {productStats.approved}
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                      <h3 className="text-lg font-semibold mb-4">
                        {t("profile.fields.quickActions")}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button
                          onClick={() => handleTabChange("wardrobe")}
                          className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <Package className="h-8 w-8 text-emerald-600 mb-2" />
                          <span className="text-gray-800 font-medium">
                            {t("profile.tabs.wardrobe")}
                          </span>
                          <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full mt-1">
                            {!isLoadingCount && productCount}
                          </span>
                        </button>

                        {/* Add Become a Seller button if user is not already a seller */}
                        {(authUser?.role as string) === "user" && !isSeller && (
                          <button
                            onClick={becomeASeller}
                            disabled={becomingSellerLoading}
                            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            {becomingSellerLoading ? (
                              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
                            ) : (
                              <ShoppingBag className="h-8 w-8 text-blue-600 mb-2" />
                            )}
                            <span className="text-gray-800 font-medium">
                              {t("profile.fields.becomeASeller")}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full mt-1">
                              {t("profile.fields.upgrade")}
                            </span>
                          </button>
                        )}

                        <button
                          onClick={() => handleTabChange("seller-orders")}
                          className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <ShoppingBag className="h-8 w-8 text-blue-600 mb-2" />
                          <span className="text-gray-800 font-medium">
                            {t("profile.tabs.sellerOrders")}
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full mt-1">
                            {sellerOrders?.length || 0}
                          </span>
                        </button>

                        <button
                          onClick={() => navigate("/messages")}
                          className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <MessageCircle className="h-8 w-8 text-purple-600 mb-2" />
                          <span className="text-gray-800 font-medium">
                            {t("profile.tabs.messages")}
                          </span>
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full mt-1">
                            {conversations?.length || 0}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Personal Information */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">
                          {t("profile.personalInfo")}
                        </h3>
                        {!isEditing && (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="text-emerald-600 hover:text-emerald-700 flex items-center text-sm"
                          >
                            <Edit3 className="h-4 w-4 mr-1" />
                            {t("profile.editProfile")}
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <form onSubmit={handleSubmit}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label
                                htmlFor="firstName"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                {t("profile.fields.firstName")}
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
                              <label
                                htmlFor="lastName"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                {t("profile.fields.lastName")}
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
                              <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                {t("profile.fields.email")}
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
                              <label
                                htmlFor="phone"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                {t("profile.fields.phone")}
                              </label>
                              <div className="flex">
                                <input
                                  type="text"
                                  id="countryCode"
                                  name="countryCode"
                                  value={formData.countryCode}
                                  onChange={handleInputChange}
                                  className="w-20 border border-gray-300 rounded-l-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                  placeholder="+1"
                                />
                                <input
                                  type="tel"
                                  id="phone"
                                  name="phone"
                                  value={formData.phone}
                                  onChange={handleInputChange}
                                  className="flex-1 border border-gray-300 rounded-r-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                            <div className="md:col-span-2">
                              <label
                                htmlFor="location"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                {t("profile.fields.location")}
                              </label>
                              <input
                                type="text"
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                className="w-full border border-gray-300 rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                placeholder="City, Country"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label
                                htmlFor="address"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                {t("profile.fields.address")}
                              </label>
                              <input
                                type="text"
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                className="w-full border border-gray-300 rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                placeholder="Street Address"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="state"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                {t("profile.fields.state")}
                              </label>
                              <input
                                type="text"
                                id="state"
                                name="state"
                                value={formData.state}
                                onChange={handleInputChange}
                                className="w-full border border-gray-300 rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                placeholder="State/Province"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="zipCode"
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                {t("profile.fields.zipCode")}
                              </label>
                              <input
                                type="text"
                                id="zipCode"
                                name="zipCode"
                                value={formData.zipCode}
                                onChange={handleInputChange}
                                className="w-full border border-gray-300 rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                placeholder="ZIP/Postal Code"
                              />
                            </div>
                          </div>

                          {/* Error message display */}
                          {error && (
                            <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg">
                              {error}
                            </div>
                          )}

                          <div className="mt-6 flex justify-end">
                            <button
                              type="button"
                              onClick={() => setIsEditing(false)}
                              className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 mr-3"
                            >
                              {t("profile.fields.cancel")}
                            </button>
                            <button
                              type="submit"
                              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                            >
                              {t("profile.fields.saveChanges")}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              {t("profile.fields.firstName")}
                            </label>
                            <p className="mt-1 text-sm text-gray-900">
                              {authUser?.firstName || "Not set"}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              {t("profile.fields.lastName")}
                            </label>
                            <p className="mt-1 text-sm text-gray-900">
                              {authUser?.lastName || "Not set"}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              {t("profile.fields.email")}
                            </label>
                            <p className="mt-1 text-sm text-gray-900">
                              {authUser?.email}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              {t("profile.fields.phone")}
                            </label>
                            <p className="mt-1 text-sm text-gray-900">
                              {authUser?.countryCode && authUser?.phone
                                ? `${authUser.countryCode} ${authUser.phone}`
                                : "Not set"}
                            </p>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">
                              {t("profile.fields.location")}
                            </label>
                            <p className="mt-1 text-sm text-gray-900">
                              {authUser?.location || "Not set"}
                            </p>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">
                              {t("profile.fields.address")}
                            </label>
                            <p className="mt-1 text-sm text-gray-900">
                              {authUser?.address || "Not set"}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              {t("profile.fields.state")}
                            </label>
                            <p className="mt-1 text-sm text-gray-900">
                              {authUser?.state || "Not set"}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              {t("profile.fields.zipCode")}
                            </label>
                            <p className="mt-1 text-sm text-gray-900">
                              {authUser?.zipCode || "Not set"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Buyer Profile
                  <>
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {t("profile.personalInfo")}
                        </h3>
                        <button
                          onClick={() => setIsEditing(!isEditing)}
                          className="flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          {isEditing
                            ? t("profile.fields.cancel")
                            : t("profile.fields.editProfile")}
                        </button>
                      </div>

                      <div className="px-6 py-4">
                        {isEditing ? (
                          <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label
                                  htmlFor="firstName"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  {t("profile.fields.firstName")}
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
                                <label
                                  htmlFor="lastName"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  {t("profile.fields.lastName")}
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
                                <label
                                  htmlFor="email"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  {t("profile.fields.email")}
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
                                <label
                                  htmlFor="phone"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  {t("profile.fields.phone")}
                                </label>
                                <div className="flex">
                                  <input
                                    type="text"
                                    id="countryCode"
                                    name="countryCode"
                                    value={formData.countryCode}
                                    onChange={handleInputChange}
                                    className="w-20 border border-gray-300 rounded-l-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="+1"
                                  />
                                  <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="flex-1 border border-gray-300 rounded-r-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                  />
                                </div>
                              </div>
                              <div className="md:col-span-2">
                                <label
                                  htmlFor="address"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  {t("profile.fields.address")}
                                </label>
                                <input
                                  type="text"
                                  id="address"
                                  name="address"
                                  value={formData.address || ""}
                                  onChange={handleInputChange}
                                  className="w-full border border-gray-300 rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                  placeholder="Street Address"
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor="state"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  {t("profile.fields.state")}
                                </label>
                                <input
                                  type="text"
                                  id="state"
                                  name="state"
                                  value={formData.state || ""}
                                  onChange={handleInputChange}
                                  className="w-full border border-gray-300 rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                  placeholder="State/Province"
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor="zipCode"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  {t("profile.fields.zipCode")}
                                </label>
                                <input
                                  type="text"
                                  id="zipCode"
                                  name="zipCode"
                                  value={formData.zipCode || ""}
                                  onChange={handleInputChange}
                                  className="w-full border border-gray-300 rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                  placeholder="ZIP/Postal Code"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label
                                  htmlFor="location"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  {t("profile.fields.location")}
                                </label>
                                <input
                                  type="text"
                                  id="location"
                                  name="location"
                                  value={formData.location}
                                  onChange={handleInputChange}
                                  className="w-full border border-gray-300 rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                  placeholder="City, Country"
                                />
                              </div>
                            </div>

                            {/* Error message display */}
                            {error && (
                              <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg">
                                {error}
                              </div>
                            )}

                            <div className="mt-6 flex justify-end">
                              <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 mr-3"
                              >
                                {t("profile.fields.cancel")}
                              </button>
                              <button
                                type="submit"
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                              >
                                {t("profile.fields.saveChanges")}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <p className="text-sm text-gray-500">
                                  {t("profile.fields.firstName")}
                                </p>
                                <p className="text-base text-gray-900">
                                  {authUser?.firstName || "Not set"}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">
                                  {t("profile.fields.lastName")}
                                </p>
                                <p className="text-base text-gray-900">
                                  {authUser?.lastName || "Not set"}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">
                                  {t("profile.fields.email")}
                                </p>
                                <p className="text-base text-gray-900">
                                  {authUser?.email || "Not set"}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">
                                  {t("profile.fields.phone")}
                                </p>
                                <p className="text-base text-gray-900">
                                  {authUser?.countryCode && authUser?.phone
                                    ? `${authUser.countryCode} ${authUser.phone}`
                                    : "Not set"}
                                </p>
                              </div>
                              <div className="md:col-span-2">
                                <p className="text-sm text-gray-500">
                                  {t("profile.fields.address")}
                                </p>
                                <p className="text-base text-gray-900">
                                  {authUser?.address || "Not set"}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">
                                  {t("profile.fields.state")}
                                </p>
                                <p className="text-base text-gray-900">
                                  {authUser?.state || "Not set"}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">
                                  {t("profile.fields.zipCode")}
                                </p>
                                <p className="text-base text-gray-900">
                                  {authUser?.zipCode || "Not set"}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">
                                  {t("profile.fields.location")}
                                </p>
                                <p className="text-base text-gray-900">
                                  {authUser?.location || "Not set"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {t("profile.seller.sellerAccountAccess")}
                        </h3>
                      </div>
                      <div className="px-6 py-4">
                        <div className="space-y-4">
                          <p className="text-sm text-gray-700">
                            {t("profile.seller.storeDescription")}
                          </p>
                          <div className="flex justify-end">
                            <button
                              onClick={becomeASeller}
                              disabled={becomingSellerLoading}
                              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                              {becomingSellerLoading ? (
                                <>
                                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                                  {t("profile.seller.processing")}
                                </>
                              ) : (
                                t("profile.seller.becomeSeller")
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Wardrobe Tab - Only for sellers */}
            {activeTab === "wardrobe" && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {t("profile.wardrobe.title")}
                    </h3>
                  </div>
                  <button
                    onClick={() => navigate("/products/add")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm rounded-lg transition-colors"
                  >
                    {t("profile.wardrobe.addNew")}
                  </button>
                </div>

                {/* Replace the existing static badges with an interactive tab bar */}
                <div className="px-6 pt-4">
                  <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setSelectedProductFilter("total")}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${
                        selectedProductFilter === "total"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {t("profile.wardrobe.filters.total")}:{" "}
                      {productStats.total}
                    </button>
                    <button
                      onClick={() => setSelectedProductFilter("approved")}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${
                        selectedProductFilter === "approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-white text-gray-500 hover:bg-gray-50"
                      } border-l border-gray-200`}
                    >
                      {t("profile.wardrobe.filters.approved")}:{" "}
                      {productStats.approved}
                    </button>
                    {productStats.pending > 0 && (
                      <button
                        onClick={() => setSelectedProductFilter("pending")}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${
                          selectedProductFilter === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-white text-gray-500 hover:bg-gray-50"
                        } border-l border-gray-200`}
                      >
                        {t("profile.wardrobe.filters.pending")}:{" "}
                        {productStats.pending}
                      </button>
                    )}
                    {productStats.rejected > 0 && (
                      <button
                        onClick={() => setSelectedProductFilter("rejected")}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${
                          selectedProductFilter === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-white text-gray-500 hover:bg-gray-50"
                        } border-l border-gray-200`}
                      >
                        {t("profile.wardrobe.filters.rejected")}:{" "}
                        {productStats.rejected}
                      </button>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4">
                  {isLoadingProducts ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 mx-auto"></div>
                      <p className="mt-4 text-gray-600">
                        {t("profile.wardrobe.loading")}
                      </p>
                    </div>
                  ) : productsError ? (
                    <div className="text-center py-8 text-red-500">
                      <p>{productsError}</p>
                      <button
                        onClick={fetchSellerProducts}
                        className="mt-4 text-emerald-600 hover:text-emerald-800"
                      >
                        {t("profile.wardrobe.tryagain")}
                      </button>
                    </div>
                  ) : getFilteredProducts().length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {getFilteredProducts().map((product) => (
                        <div
                          key={product._id}
                          className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                        >
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
                              <h3 className="text-sm font-medium text-gray-900 truncate max-w-[70%]">
                                {product.title}
                              </h3>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  product.status === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : product.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {product.status.charAt(0).toUpperCase() +
                                  product.status.slice(1)}
                              </span>
                            </div>

                            <p className="mt-1 text-sm font-medium text-gray-900">
                              ${product.price.toFixed(2)}
                            </p>
                            {product.oemNumber && (
                              <p className="mt-1 text-xs text-gray-500">
                                {t("profile.wardrobe.productDetails.oem")}:{" "}
                                {product.oemNumber}
                              </p>
                            )}
                            {product.category && (
                              <p className="mt-1 text-xs text-gray-500">
                                {t("profile.wardrobe.productDetails.category")}:{" "}
                                {product.category.name}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                              {t("profile.wardrobe.productDetails.listedOn")}{" "}
                              {new Date(product.createdAt).toLocaleDateString()}
                            </p>

                            <div className="mt-4 flex space-x-3">
                              <button
                                onClick={() =>
                                  navigate(`/products/${product._id}`)
                                }
                                className="text-xs px-3 py-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-colors"
                              >
                                {t("profile.wardrobe.actions.view")}
                              </button>
                              <button
                                onClick={() =>
                                  navigate(`/products/${product._id}/edit`)
                                }
                                className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                              >
                                {t("profile.wardrobe.actions.edit")}
                              </button>
                              <button
                                onClick={() => deleteProduct(product._id)}
                                className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                              >
                                {t("profile.wardrobe.actions.delete")}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      {selectedProductFilter !== "total" ? (
                        <>
                          <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">
                            No {selectedProductFilter} products found
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Try selecting a different filter.
                          </p>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">
                            {t("profile.wardrobe.noProducts")}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {t("profile.wardrobe.startSelling")}
                          </p>
                          <div className="mt-6">
                            <button
                              type="button"
                              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                              onClick={() => navigate("/products/add")}
                            >
                              {t("profile.wardrobe.addNew")}
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
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t("profile.orders.title")}
                  </h3>
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
                      <p className="mt-3 text-sm text-gray-500">
                        {t("profile.orders.loading")}
                      </p>
                    </div>
                  ) : orders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {t("profile.orders.orderId")}
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {t("profile.orders.orderDate")}
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {t("profile.orders.status")}
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {t("profile.orders.amount")}
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {t("profile.orders.actions")}
                            </th>
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
                                  <span
                                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                                      order.status
                                    )}`}
                                  >
                                    {order.status.charAt(0).toUpperCase() +
                                      order.status.slice(1)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatCurrency(order.totalAmount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  className="text-emerald-600 hover:text-emerald-900 inline-flex items-center"
                                  onClick={() =>
                                    navigate(`/orders/${order._id}`)
                                  }
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  {t("profile.orders.viewDetails")}
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
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        {t("profile.orders.noOrders")}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {t("profile.orders.startShopping")}
                      </p>
                      <div className="mt-6">
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                          onClick={() => navigate("/")}
                        >
                          {t("profile.orders.browseProducts")}
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
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t("profile.addresses.title")}
                  </h3>
                  {!isAddingAddress && (
                    <button
                      onClick={() => setIsAddingAddress(true)}
                      className="flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {t("profile.addresses.addNew")}
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
                          <label
                            htmlFor="street"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            {t("profile.addresses.fields.street")}
                          </label>
                          <input
                            type="text"
                            id="street"
                            value={addressForm.street}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                street: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="city"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            {t("profile.addresses.fields.city")}
                          </label>
                          <input
                            type="text"
                            id="city"
                            value={addressForm.city}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                city: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="state"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            {t("profile.addresses.fields.state")}
                          </label>
                          <input
                            type="text"
                            id="state"
                            value={addressForm.state}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                state: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="postalCode"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            {t("profile.addresses.fields.postalCode")}
                          </label>
                          <input
                            type="text"
                            id="postalCode"
                            value={addressForm.postalCode}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                postalCode: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="country"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            {t("profile.addresses.fields.country")}
                          </label>
                          <input
                            type="text"
                            id="country"
                            value={addressForm.country}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                country: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            required
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="isDefault"
                            checked={addressForm.isDefault}
                            onChange={(e) =>
                              setAddressForm({
                                ...addressForm,
                                isDefault: e.target.checked,
                              })
                            }
                            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="isDefault"
                            className="ml-2 block text-sm text-gray-700"
                          >
                            {t("profile.addresses.fields.isDefault")}
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
                              isDefault: false,
                            });
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                          {t("profile.addresses.cancel")}
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
                      <p className="mt-4 text-gray-600">
                        {t("profile.addresses.loading")}
                      </p>
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
                                      {t("profile.addresses.defaultAddress")}
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-500 text-sm">
                                  {address.city}, {address.state}{" "}
                                  {address.postalCode}
                                </p>
                                <p className="text-gray-500 text-sm">
                                  {address.country}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              {!address.isDefault && (
                                <button
                                  onClick={() =>
                                    handleSetDefaultAddress(address._id)
                                  }
                                  className="text-emerald-600 hover:text-emerald-700 text-sm"
                                >
                                  {t("profile.addresses.makeDefault")}
                                </button>
                              )}
                              <button
                                onClick={() => handleEditAddress(address)}
                                className="text-blue-600 hover:text-blue-700 text-sm"
                              >
                                {t("profile.addresses.edit")}
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(address._id)}
                                className="text-red-600 hover:text-red-700 text-sm"
                              >
                                {t("profile.addresses.delete")}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MapPin className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No addresses added
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Add your first address to get started.
                      </p>
                      <div className="mt-6">
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {t("profile.addresses.addNew")}
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
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t("profile.wishlist.title")}
                  </h3>
                  {wishlistItems.length > 0 && (
                    <button
                      onClick={clearWishlist}
                      className="text-sm text-red-600 hover:text-red-800 flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {t("profile.wishlist.clearWishlist")}
                    </button>
                  )}
                </div>
                <div className="px-6 py-4">
                  {isLoadingWishlist ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 mx-auto"></div>
                      <p className="mt-4 text-gray-600">
                        {t("profile.wishlist.loading")}
                      </p>
                    </div>
                  ) : wishlistError ? (
                    <div className="text-center py-8 text-red-500 flex flex-col items-center">
                      <AlertCircle className="h-12 w-12 mb-2" />
                      <p>{wishlistError}</p>
                      <button
                        onClick={fetchWishlist}
                        className="mt-4 text-emerald-600 hover:text-emerald-800"
                      >
                        {t("profile.wishlist.errorLoading")}
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
                          <div
                            key={item._id || "missing-id"}
                            className="flex space-x-4 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                              {item.images && item.images.length > 0 ? (
                                <img
                                  src={formatImageUrl(item.images[0])}
                                  alt={item.title || "Product"}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                  <ShoppingBag className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {item.title || "Unnamed Product"}
                              </p>
                              <p className="text-sm text-gray-500">
                                ${(item.price || 0).toFixed(2)}
                              </p>
                              {item.oemNumber && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {t("profile.wardrobe.productDetails.oem")}:{" "}
                                  {item.oemNumber}
                                </p>
                              )}
                              {item.category && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {t(
                                    "profile.wardrobe.productDetails.category"
                                  )}
                                  : {item.category.name}
                                </p>
                              )}
                              <div className="mt-2 flex gap-2">
                                <button
                                  onClick={() =>
                                    navigate(`/products/${item._id}`)
                                  }
                                  className="bg-emerald-600 text-white text-xs px-3 py-1 rounded hover:bg-emerald-700 transition-colors flex items-center"
                                >
                                  <ShoppingCart className="h-3 w-3 mr-1" />
                                  {t("profile.wardrobe.actions.view")}
                                </button>
                                <button
                                  onClick={() => removeFromWishlist(item._id)}
                                  className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded hover:bg-gray-200 transition-colors flex items-center"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  {t("profile.wardrobe.actions.delete")}
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
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        {t("profile.wishlist.noItems")}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {t("profile.wishlist.startAdding")}
                      </p>
                      <div className="mt-6">
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                          onClick={() => navigate("/")}
                        >
                          {t("profile.wishlist.browseProducts")}
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
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t("profile.messages.title")}
                  </h3>
                </div>
                <div className="px-6 py-4">
                  {conversations.length > 0 ? (
                    <ul className="space-y-4">
                      {conversations.map((conversation) => (
                        <li
                          key={conversation._id}
                          className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg shadow-sm hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                              {conversation.participants[0].name.charAt(0)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conversation.participants[0].name}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {conversation.lastMessage?.content}
                            </p>
                          </div>
                          <div>
                            <button
                              onClick={() => handleReplyClick(conversation._id)}
                              className="text-sm text-emerald-600 hover:text-emerald-800"
                            >
                              {t("profile.messages.reply")}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        {t("profile.messages.noMessages")}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {t("profile.messages.startmessage")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t("profile.settings.title")}
                  </h3>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3">
                      <div>
                        <p className="text-gray-900 font-medium">
                          {t("profile.settings.language")}
                        </p>
                        <p className="text-sm text-gray-500">
                          {t("profile.settings.languageDescription")}
                        </p>
                      </div>
                      <button
                        className="text-sm text-emerald-600 font-medium hover:text-emerald-700 flex items-center"
                        onClick={() => setIsLanguageModalOpen(true)}
                      >
                        {i18n.language === "fr"
                          ? t("profile.settings.french")
                          : t("profile.settings.english")}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="text-red-600 font-medium">
                      {t("profile.settings.dangerZone")}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1 mb-4">
                      {t("profile.settings.dangerZoneDescription")}
                    </p>
                    <button 
                    onClick={handleLogout}
                    className="bg-white text-red-600 border border-red-300 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      {t("profile.logout.button")}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Seller Orders Tab - Only for sellers */}
            {activeTab === "seller-orders" && isSeller && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t("profile.seller.sellerOrders.title")}
                  </h3>
                </div>
                {/* Order Statistics */}
                {getFilteredSellerOrders().length > 0 && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      {t("profile.seller.sellerOrders.orderStatistics")}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-xs text-gray-500">
                          {t("profile.seller.sellerOrders.totalOrders")}
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          {sellerOrders.length}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-xs text-gray-500">
                          {t("profile.seller.sellerOrders.filterPending")}
                        </p>
                        <p className="text-lg font-semibold text-yellow-600">
                          {
                            sellerOrders.filter(
                              (order) => order.status === "pending"
                            ).length
                          }
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-xs text-gray-500">
                          {t("profile.seller.sellerOrders.filterShipped")}
                        </p>
                        <p className="text-lg font-semibold text-blue-600">
                          {
                            sellerOrders.filter(
                              (order) => order.status === "shipped"
                            ).length
                          }
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-xs text-gray-500">
                          {t("profile.seller.sellerOrders.filterDelivered")}
                        </p>
                        <p className="text-lg font-semibold text-green-600">
                          {
                            sellerOrders.filter(
                              (order) => order.status === "delivered"
                            ).length
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Status filter tabs */}
                <div className="px-6 pt-4">
                  <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setSellerOrderFilter("all")}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${
                        sellerOrderFilter === "all"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {t("profile.seller.sellerOrders.filterAll")}
                    </button>
                    <button
                      onClick={() => setSellerOrderFilter("pending")}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${
                        sellerOrderFilter === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-white text-gray-500 hover:bg-gray-50"
                      } border-l border-gray-200`}
                    >
                      {t("profile.seller.sellerOrders.filterPending")}
                    </button>
                    <button
                      onClick={() => setSellerOrderFilter("processing")}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${
                        sellerOrderFilter === "processing"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-white text-gray-500 hover:bg-gray-50"
                      } border-l border-gray-200`}
                    >
                      {t("profile.seller.sellerOrders.filterProcessing")}
                    </button>
                    <button
                      onClick={() => setSellerOrderFilter("shipped")}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${
                        sellerOrderFilter === "shipped"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-white text-gray-500 hover:bg-gray-50"
                      } border-l border-gray-200`}
                    >
                      {t("profile.seller.sellerOrders.filterShipped")}
                    </button>
                    <button
                      onClick={() => setSellerOrderFilter("delivered")}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${
                        sellerOrderFilter === "delivered"
                          ? "bg-green-100 text-green-800"
                          : "bg-white text-gray-500 hover:bg-gray-50"
                      } border-l border-gray-200`}
                    >
                      {t("profile.seller.sellerOrders.filterDelivered")}
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
                      <p className="mt-3 text-sm text-gray-500">
                        {t("profile.seller.sellerOrders.loading")}
                      </p>
                    </div>
                  ) : getFilteredSellerOrders().length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {t("profile.orders.orderId")}
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {t("profile.orders.customer")}
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {t("profile.orders.orderDate")}
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {t("profile.orders.status")}
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {t("profile.orders.amount")}
                            </th>
                            <th
                              scope="col"
                              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {t("profile.orders.actions")}
                            </th>
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
                                  <span
                                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                                      order.status
                                    )}`}
                                  >
                                    {order.status.charAt(0).toUpperCase() +
                                      order.status.slice(1)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                ${order.totalAmount.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  className="text-emerald-600 hover:text-emerald-900 inline-flex items-center"
                                  onClick={() =>
                                    navigate(`/orders/${order._id}`)
                                  }
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  {t("profile.orders.viewDetails")}
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
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No orders found
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {sellerOrderFilter !== "all"
                          ? `No ${sellerOrderFilter} orders found. Try selecting a different filter.`
                          : "You haven't received any orders for your products yet."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t("profile.reviews.title")}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {t("profile.reviews.reviewdes")}
                  </p>

                  {/* Sub-tabs for reviews */}
                  <div className="flex mt-4 border-b border-gray-200">
                    <button
                      onClick={() => setReviewsTab("write")}
                      className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px ${
                        reviewsTab === "write"
                          ? "text-emerald-600 border-emerald-500"
                          : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {t("profile.reviews.writeReview.title")}
                    </button>
                    <button
                      onClick={() => setReviewsTab("my-reviews")}
                      className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px ${
                        reviewsTab === "my-reviews"
                          ? "text-emerald-600 border-emerald-500"
                          : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {t("profile.reviews.myReviews.title")}
                    </button>
                  </div>
                </div>

                <div className="px-6 py-4">
                  {/* Show error messages */}
                  {reviewableOrdersError && reviewsTab === "write" && (
                    <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      {reviewableOrdersError}
                    </div>
                  )}

                  {userReviewsError && reviewsTab === "my-reviews" && (
                    <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      {userReviewsError}
                    </div>
                  )}

                  {reviewSubmitSuccess && (
                    <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg flex items-center">
                      <ThumbsUp className="h-5 w-5 mr-2" />
                      {isEditingReview
                        ? t("profile.reviews.myReviews.updateSuccess")
                        : t("profile.reviews.writeReview.success")}
                    </div>
                  )}

                  {/* Write Review Tab */}
                  {reviewsTab === "write" && (
                    <>
                      {isLoadingReviewableOrders ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
                          <p className="mt-3 text-sm text-gray-500">
                            {t("profile.reviews.writeReview.noreview")}
                          </p>
                        </div>
                      ) : reviewableOrders.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <h4 className="text-lg font-medium text-gray-900 mb-1">
                            {t("profile.reviews.writeReview.noOrders")}
                          </h4>
                          <p className="text-gray-500 max-w-md mx-auto">
                            {t("profile.reviews.writeReview.noreviewdes")}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-6">
                          {!selectedOrderForReview ? (
                            // Display list of reviewable orders
                            <div className="space-y-4">
                              <h4 className="font-medium text-gray-900">
                                {t("profile.reviews.writeReview.selectOrder")}:
                              </h4>
                              {reviewableOrders.map((order) => (
                                <div
                                  key={order._id}
                                  className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-white"
                                  onClick={() => selectOrderForReview(order)}
                                >
                                  <div className="p-4 border-b border-gray-200">
                                    <div className="flex justify-between">
                                      <div>
                                        <h4 className="font-medium text-gray-900">
                                          {order.seller.storeName ||
                                            `${order.seller.firstName} ${order.seller.lastName}`}
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                          Order #
                                          {order._id.substring(
                                            order._id.length - 8
                                          )}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-sm font-medium text-gray-900">
                                          €{order.totalAmount.toFixed(2)}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          {formatDate(order.createdAt)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="px-4 py-3 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-gray-500">
                                        {order.items.length}{" "}
                                        {order.items.length === 1
                                          ? "item"
                                          : "items"}
                                      </span>
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        {order.status}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="p-4 flex justify-end">
                                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
                                      {t("profile.reviews.writeReview.title")}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            // Display the review form for the selected order
                            <div className="border border-gray-200 rounded-lg bg-white">
                              <div className="p-4 border-b border-gray-200">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium text-gray-900">
                                      {selectedOrderForReview.seller
                                        .storeName ||
                                        `${selectedOrderForReview.seller.firstName} ${selectedOrderForReview.seller.lastName}`}
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                      Order #
                                      {selectedOrderForReview._id.substring(
                                        selectedOrderForReview._id.length - 8
                                      )}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() =>
                                      setSelectedOrderForReview(null)
                                    }
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                  >
                                    Back to orders
                                  </button>
                                </div>
                              </div>

                              {!selectedProductForReview ? (
                                // Select a product to review
                                <div className="p-4">
                                  <h5 className="font-medium text-gray-900 mb-4">
                                    Select a product to review:
                                  </h5>
                                  <div className="grid grid-cols-1 gap-3">
                                    {selectedOrderForReview.items.map(
                                      (item) => (
                                        <div
                                          key={item.product._id}
                                          className="flex items-center p-3 border border-gray-200 rounded-md hover:border-emerald-500 cursor-pointer bg-white"
                                          onClick={() =>
                                            selectProductForReview(item.product)
                                          }
                                        >
                                          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                            {item.product.images &&
                                            item.product.images.length > 0 ? (
                                              <img
                                                src={
                                                  item.product.images[0].startsWith(
                                                    "http"
                                                  )
                                                    ? item.product.images[0]
                                                    : `${API_URL}${
                                                        item.product.images[0].startsWith(
                                                          "/"
                                                        )
                                                          ? ""
                                                          : "/"
                                                      }${
                                                        item.product.images[0]
                                                      }`
                                                }
                                                alt={item.product.title}
                                                className="h-full w-full object-cover object-center"
                                              />
                                            ) : (
                                              <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                                                <Package className="h-8 w-8 text-gray-400" />
                                              </div>
                                            )}
                                          </div>
                                          <div className="ml-4 flex-1">
                                            <h6 className="text-sm font-medium text-gray-900">
                                              {item.product.title}
                                            </h6>
                                            <p className="text-sm text-gray-500">
                                              Quantity: {item.quantity} · €
                                              {item.price.toFixed(2)}
                                            </p>
                                          </div>
                                          <div>
                                            <ChevronRight className="h-5 w-5 text-gray-400" />
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              ) : (
                                // Write the review for the selected product
                                <div className="p-4">
                                  <div className="flex items-center mb-4">
                                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                      {selectedProductForReview.images &&
                                      selectedProductForReview.images.length >
                                        0 ? (
                                        <img
                                          src={
                                            selectedProductForReview.images[0].startsWith(
                                              "http"
                                            )
                                              ? selectedProductForReview
                                                  .images[0]
                                              : `${API_URL}${
                                                  selectedProductForReview.images[0].startsWith(
                                                    "/"
                                                  )
                                                    ? ""
                                                    : "/"
                                                }${
                                                  selectedProductForReview
                                                    .images[0]
                                                }`
                                          }
                                          alt={selectedProductForReview.title}
                                          className="h-full w-full object-cover object-center"
                                        />
                                      ) : (
                                        <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                                          <Package className="h-8 w-8 text-gray-400" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="ml-4">
                                      <h5 className="text-sm font-medium text-gray-900">
                                        {selectedProductForReview.title}
                                      </h5>
                                      <p className="text-sm text-gray-500">
                                        From:{" "}
                                        {selectedOrderForReview.seller
                                          .storeName ||
                                          `${selectedOrderForReview.seller.firstName} ${selectedOrderForReview.seller.lastName}`}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Your Rating
                                    </label>
                                    <div className="flex space-x-2">
                                      {[1, 2, 3, 4, 5].map((rating) => (
                                        <button
                                          key={rating}
                                          type="button"
                                          onClick={() =>
                                            handleRatingChange(rating)
                                          }
                                          className="focus:outline-none"
                                        >
                                          <Star
                                            className={`h-8 w-8 ${
                                              rating <= reviewForm.rating
                                                ? "text-yellow-400 fill-yellow-400"
                                                : "text-gray-300"
                                            }`}
                                          />
                                        </button>
                                      ))}
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">
                                      {reviewForm.rating === 1 &&
                                        "Poor - Not what I expected"}
                                      {reviewForm.rating === 2 &&
                                        "Fair - Below average"}
                                      {reviewForm.rating === 3 &&
                                        "Good - Average quality"}
                                      {reviewForm.rating === 4 &&
                                        "Very Good - Above average"}
                                      {reviewForm.rating === 5 &&
                                        "Excellent - Highly recommended"}
                                    </p>
                                  </div>

                                  <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Your Review
                                      <span className="text-gray-500 font-normal ml-1">
                                        (Optional)
                                      </span>
                                    </label>
                                    <textarea
                                      value={reviewForm.comment}
                                      onChange={handleCommentChange}
                                      placeholder="Share your experience with this seller and product. What was good? What could be improved?"
                                      rows={4}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    ></textarea>
                                    <p className="mt-1 text-xs text-gray-500">
                                      Your review helps other buyers make better
                                      choices and provides valuable feedback to
                                      sellers.
                                    </p>
                                  </div>

                                  {reviewSubmitError && (
                                    <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
                                      {reviewSubmitError}
                                    </div>
                                  )}

                                  <div className="flex justify-end space-x-3">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedProductForReview(null)
                                      }
                                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                                    >
                                      Back
                                    </button>
                                    <button
                                      type="button"
                                      onClick={submitReview}
                                      disabled={isSubmittingReview}
                                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isSubmittingReview ? (
                                        <>
                                          <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                                          Submitting...
                                        </>
                                      ) : (
                                        "Submit Review"
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* My Reviews Tab */}
                  {reviewsTab === "my-reviews" && (
                    <div className="w-full">
                      {/* Debug info */}
                      {(() => {
                        console.log("Rendering My Reviews tab", {
                          isLoadingUserReviews,
                          userReviewsError,
                          userReviews: userReviews
                            ? `Array of ${userReviews.length} items`
                            : "undefined/null",
                        });
                        return null;
                      })()}

                      {isLoadingUserReviews ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
                          <p className="mt-3 text-sm text-gray-500">
                            Loading your reviews...
                          </p>
                        </div>
                      ) : userReviewsError ? (
                        <div className="text-center py-12 bg-red-50 rounded-lg">
                          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                          <h4 className="text-lg font-medium text-red-800 mb-1">
                            Error Loading Reviews
                          </h4>
                          <p className="text-red-600 max-w-md mx-auto">
                            {userReviewsError}
                          </p>
                          <button
                            onClick={() => fetchUserReviews()}
                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none"
                          >
                            Try Again
                          </button>
                        </div>
                      ) : !userReviews || userReviews.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <h4 className="text-lg font-medium text-gray-900 mb-1">
                            {t("profile.reviews.writeReview.noOrders")}
                          </h4>
                          <p className="text-gray-500 max-w-md mx-auto">
                            {t("profile.reviews.writeReview.noreviewdes")}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-6">
                          {!selectedOrderForReview ? (
                            // Display list of reviewable orders
                            <div className="space-y-4">
                              <h4 className="font-medium text-gray-900">
                                {t("profile.reviews.writeReview.selectOrder")}:
                              </h4>
                              {reviewableOrders.map((order) => (
                                <div
                                  key={order._id}
                                  className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-white"
                                  onClick={() => selectOrderForReview(order)}
                                >
                                  <div className="p-4 border-b border-gray-200">
                                    <div className="flex justify-between">
                                      <div>
                                        <h4 className="font-medium text-gray-900">
                                          {order.seller.storeName ||
                                            `${order.seller.firstName} ${order.seller.lastName}`}
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                          Order #
                                          {order._id.substring(
                                            order._id.length - 8
                                          )}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-sm font-medium text-gray-900">
                                          €{order.totalAmount.toFixed(2)}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          {formatDate(order.createdAt)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="px-4 py-3 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-gray-500">
                                        {order.items.length}{" "}
                                        {order.items.length === 1
                                          ? "item"
                                          : "items"}
                                      </span>
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        {order.status}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="p-4 flex justify-end">
                                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
                                      {t("profile.reviews.writeReview.title")}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            // Display the review form for the selected order
                            <div className="border border-gray-200 rounded-lg bg-white">
                              <div className="p-4 border-b border-gray-200">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium text-gray-900">
                                      {selectedOrderForReview.seller
                                        .storeName ||
                                        `${selectedOrderForReview.seller.firstName} ${selectedOrderForReview.seller.lastName}`}
                                    </h4>
                                    <p className="text-sm text-gray-500">
                                      Order #
                                      {selectedOrderForReview._id.substring(
                                        selectedOrderForReview._id.length - 8
                                      )}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() =>
                                      setSelectedOrderForReview(null)
                                    }
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                  >
                                    Back to orders
                                  </button>
                                </div>
                              </div>

                              {!selectedProductForReview ? (
                                // Select a product to review
                                <div className="p-4">
                                  <h5 className="font-medium text-gray-900 mb-4">
                                    Select a product to review:
                                  </h5>
                                  <div className="grid grid-cols-1 gap-3">
                                    {selectedOrderForReview.items.map(
                                      (item) => (
                                        <div
                                          key={item.product._id}
                                          className="flex items-center p-3 border border-gray-200 rounded-md hover:border-emerald-500 cursor-pointer bg-white"
                                          onClick={() =>
                                            selectProductForReview(item.product)
                                          }
                                        >
                                          <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                            {item.product.images &&
                                            item.product.images.length > 0 ? (
                                              <img
                                                src={
                                                  item.product.images[0].startsWith(
                                                    "http"
                                                  )
                                                    ? item.product.images[0]
                                                    : `${API_URL}${
                                                        item.product.images[0].startsWith(
                                                          "/"
                                                        )
                                                          ? ""
                                                          : "/"
                                                      }${
                                                        item.product.images[0]
                                                      }`
                                                }
                                                alt={item.product.title}
                                                className="h-full w-full object-cover object-center"
                                              />
                                            ) : (
                                              <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                                                <Package className="h-8 w-8 text-gray-400" />
                                              </div>
                                            )}
                                          </div>
                                          <div className="ml-4 flex-1">
                                            <h6 className="text-sm font-medium text-gray-900">
                                              {item.product.title}
                                            </h6>
                                            <p className="text-sm text-gray-500">
                                              Quantity: {item.quantity} · €
                                              {item.price.toFixed(2)}
                                            </p>
                                          </div>
                                          <div>
                                            <ChevronRight className="h-5 w-5 text-gray-400" />
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              ) : (
                                // Write the review for the selected product
                                <div className="p-4">
                                  <div className="flex items-center mb-4">
                                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                      {selectedProductForReview.images &&
                                      selectedProductForReview.images.length >
                                        0 ? (
                                        <img
                                          src={
                                            selectedProductForReview.images[0].startsWith(
                                              "http"
                                            )
                                              ? selectedProductForReview
                                                  .images[0]
                                              : `${API_URL}${
                                                  selectedProductForReview.images[0].startsWith(
                                                    "/"
                                                  )
                                                    ? ""
                                                    : "/"
                                                }${
                                                  selectedProductForReview
                                                    .images[0]
                                                }`
                                          }
                                          alt={selectedProductForReview.title}
                                          className="h-full w-full object-cover object-center"
                                        />
                                      ) : (
                                        <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                                          <Package className="h-8 w-8 text-gray-400" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="ml-4">
                                      <h5 className="text-sm font-medium text-gray-900">
                                        {selectedProductForReview.title}
                                      </h5>
                                      <p className="text-sm text-gray-500">
                                        From:{" "}
                                        {selectedOrderForReview.seller
                                          .storeName ||
                                          `${selectedOrderForReview.seller.firstName} ${selectedOrderForReview.seller.lastName}`}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Your Rating
                                    </label>
                                    <div className="flex space-x-2">
                                      {[1, 2, 3, 4, 5].map((rating) => (
                                        <button
                                          key={rating}
                                          type="button"
                                          onClick={() =>
                                            handleRatingChange(rating)
                                          }
                                          className="focus:outline-none"
                                        >
                                          <Star
                                            className={`h-8 w-8 ${
                                              rating <= reviewForm.rating
                                                ? "text-yellow-400 fill-yellow-400"
                                                : "text-gray-300"
                                            }`}
                                          />
                                        </button>
                                      ))}
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">
                                      {reviewForm.rating === 1 &&
                                        "Poor - Not what I expected"}
                                      {reviewForm.rating === 2 &&
                                        "Fair - Below average"}
                                      {reviewForm.rating === 3 &&
                                        "Good - Average quality"}
                                      {reviewForm.rating === 4 &&
                                        "Very Good - Above average"}
                                      {reviewForm.rating === 5 &&
                                        "Excellent - Highly recommended"}
                                    </p>
                                  </div>

                                  <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Your Review
                                      <span className="text-gray-500 font-normal ml-1">
                                        (Optional)
                                      </span>
                                    </label>
                                    <textarea
                                      value={reviewForm.comment}
                                      onChange={handleCommentChange}
                                      placeholder="Share your experience with this seller and product..."
                                      rows={4}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    ></textarea>
                                  </div>

                                  {reviewSubmitError && (
                                    <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
                                      {reviewSubmitError}
                                    </div>
                                  )}

                                  <div className="flex justify-end space-x-3">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedProductForReview(null)
                                      }
                                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                                    >
                                      Back
                                    </button>
                                    <button
                                      type="button"
                                      onClick={submitReview}
                                      disabled={isSubmittingReview}
                                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isSubmittingReview ? (
                                        <>
                                          <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                                          Submitting...
                                        </>
                                      ) : (
                                        "Submit Review"
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
        
        @keyframes fadeIn {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>

      {/* Language selection modal */}
      {isLanguageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-semibold">
                {t("profile.settings.selectLanguage")}
              </h2>
              <button
                onClick={() => setIsLanguageModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-2 md:space-y-3 mb-4">
              {["en", "fr"].map((lang) => (
                <button
                  key={lang}
                  className={`w-full text-left px-3 py-2 md:px-4 md:py-3 rounded-lg flex justify-between items-center transition-colors ${
                    i18n.language === lang
                      ? "bg-emerald-50 text-emerald-600 font-medium"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => changeLanguage(lang)}
                >
                  <span>
                    {lang === "en" && t("profile.settings.english")}
                    {lang === "fr" && t("profile.settings.french")}
                  </span>
                  {i18n.language === lang && (
                    <Check className="h-4 w-4 md:h-5 md:w-5" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setIsLanguageModalOpen(false)}
              >
                {t("common.cancel")}
              </button>
              <button
                className="px-3 py-2 md:px-4 md:py-2 bg-emerald-600 rounded-md text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                onClick={() => {
                  // Save language preference
                  setIsLanguageModalOpen(false);
                }}
              >
                {t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add ConfirmationDialog component at the end of the return statement */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
        type={confirmDialog.type}
      />
    </div>
  );
};

export default Profile;
