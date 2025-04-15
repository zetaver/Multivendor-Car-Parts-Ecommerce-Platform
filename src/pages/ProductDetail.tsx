import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
// import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Share2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Car,
} from 'lucide-react';
// import clsx from 'clsx';
import { createConversation } from '../services/messageService';
import { API_URL } from '../config';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

// interface SimilarProduct {
//   id: string;
//   title: string;
//   price: number;
//   originalPrice?: number;
//   discount?: number;
//   image: string;
//   condition?: string;
//   negotiable?: boolean;
// }

interface ProductCategory {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
  slug: string;
}

interface ProductCompatibility {
  make: string;
  model: string;
  year: number;
  _id: string;
}

interface ProductData {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: ProductCategory;
  oemNumber: string;
  compatibility: ProductCompatibility[];
  images: string[];
  status: string;
  createdAt?: string;
  seller?: {
    _id: string;
    name: string;
    storeName?: string;
    avatar?: string;
    banner?: string;
    location?: string;
    rating?: number;
    totalSales?: number;
  };
}

interface WishlistResponse {
  success: boolean;
  data: {
    _id: string;
    user: string;
    products: Array<string>;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
}

// Add this component near the top, before the main ProductDetail component
interface ContactButtonProps {
  product: ProductData | null;
  isLoading: boolean;
  onContact: () => void;
  error: string | null;
}

const ContactButton: React.FC<ContactButtonProps> = ({
  product,
  isLoading,
  onContact,
  error
}) => {
  const { t } = useTranslation();
  // Determine if there's a valid seller with a simple boolean check
  // This avoids any null reference issues
  const hasSeller = Boolean(product && product.seller && product.seller._id);
  
  return (
    <div className="flex-1">
      <button
        onClick={onContact}
        disabled={isLoading}
        className="w-full py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center justify-center"
      >
        {isLoading ? t('common.loading') : (hasSeller ? t('productDetail.contactSeller') : t('common.contactSupport'))}
      </button>
      {error && (
        <div className="mt-2 text-sm text-red-500">{error}</div>
      )}
    </div>
  );
};

// Add a new interface for SellerInfo responses
interface SellerInfoResponse {
  success: boolean;
  data: {
    _id: string;
    name: string;
    storeName: string | null;
    banner: string | null;
    location: string | null;
    rating: number;
    totalSales: number;
  }
}

const ProductDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [offerAmount, setOfferAmount] = useState('');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerMessage, setOfferMessage] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showTechnicalInfo, setShowTechnicalInfo] = useState(false);
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);
  const [showReturnsInfo, setShowReturnsInfo] = useState(false);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceFeeCost, setServiceFeeCost] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [wishlistData, setWishlistData] = useState<WishlistResponse | null>(null);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [wishlistError, setWishlistError] = useState<string | null>(null);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [isContactingSellerLoading, setIsContactingSellerLoading] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [sellerInfo, setSellerInfo] = useState<SellerInfoResponse['data'] | null>(null);

  // Function to handle back navigation while preserving search query
  const handleGoBack = () => {
    // Check if we have a search parameter in the URL
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('search');
    
    if (searchQuery) {
      // If we have a search query, navigate to search page with the query
      navigate(`/search?search=${encodeURIComponent(searchQuery)}`);
    } else {
      // Otherwise just go back
      navigate(-1);
    }
  };

  useEffect(() => {
    const fetchProductData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        setError(null);

        // Try to fetch the product with seller details first
        let response = await fetch(`${API_URL}/api/products/${id}/withSeller`);
        
        // If that fails, fall back to the regular product endpoint
        if (!response.ok) {
          console.log('Falling back to regular product endpoint');
          response = await fetch(`${API_URL}/api/products/${id}`);
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch product details: ${response.status}`);
        }

        const result = await response.json();
        const data = result.success ? result.data : result;
        setProduct(data);
        
        // If we didn't get seller details and we have a seller ID, 
        // we'll need to fetch them separately
        if (data.seller && data.seller._id && !data.seller.storeName) {
          fetchSellerInfo(data.seller._id);
        }
      } catch (err) {
        console.error('Error fetching product data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load product details');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchWishlist = async () => {
      // Skip if user is not authenticated
      if (!localStorage.getItem('accessToken')) {
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/wishlist`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch wishlist: ${response.status}`);
        }

        const data = await response.json();
        console.log("Wishlist data:", data);

        // Check for proper data structure
        if (!data || !data.success || !data.data) {
          throw new Error('Invalid wishlist data format');
        }

        // Store the complete wishlist data
        setWishlistData(data);

        // Extract product IDs from wishlist data structure
        const extractedIds = Array.isArray(data.data.products)
          ? data.data.products.map((item: any) => {
            if (typeof item === 'string') return item;
            return item._id ? item._id : null;
          }).filter(Boolean)
          : [];

        setWishlistIds(extractedIds);

        // Check if current product is in wishlist
        if (id && extractedIds.includes(id)) {
          setIsInWishlist(true);
        } else {
          setIsInWishlist(false);
        }

      } catch (error) {
        console.error('Error fetching wishlist:', error);
        setWishlistError(error instanceof Error ? error.message : 'Unknown error');
        setWishlistIds([]);
        setIsInWishlist(false);
      }
    };

    const fetchFavoriteCount = async () => {
      if (!id) return;

      try {
        const response = await fetch(`${API_URL}/api/products/${id}/favorite-count`);

        if (!response.ok) {
          throw new Error(`Failed to fetch favorite count: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setFavoriteCount(data.favoriteCount);
        }
      } catch (error) {
        console.error('Error fetching favorite count:', error);
      }
    };

    const fetchViewCount = async () => {
      if (!id) return;

      try {
        const response = await fetch(`${API_URL}/api/products/${id}/view-count`);

        if (!response.ok) {
          throw new Error(`Failed to fetch view count: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setViewCount(data.viewCount);
        }
      } catch (error) {
        console.error('Error fetching view count:', error);
      }
    };

    const trackProductView = async () => {
      if (!id || hasTrackedView) return;

      try {
        const response = await fetch(`${API_URL}/api/products/${id}/view`, {
          method: 'POST'
        });

        if (response.ok) {
          setHasTrackedView(true);
          // Update the view count after tracking
          fetchViewCount();
        }
      } catch (error) {
        console.error('Error tracking product view:', error);
      }
    };

    const fetchSellerInfo = async (sellerId: string) => {
      try {
        // The correct endpoint URL
        const response = await fetch(`${API_URL}/api/users/seller-info/${sellerId}`);
        if (!response.ok) {
          console.error('Failed to fetch seller info - Status:', response.status);
          throw new Error('Failed to fetch seller info');
        }
        const data: SellerInfoResponse = await response.json();
        if (data.success && data.data) {
          setSellerInfo(data.data);
          
          // Update the product.seller with the new info
          if (product && product.seller) {
            // Keep the existing seller data, including _id
            setProduct({
              ...product,
              seller: {
                _id: product.seller._id, // Ensure _id is kept from original product.seller
                name: data.data.name,
                storeName: data.data.storeName || undefined,
                banner: data.data.banner || undefined,
                location: data.data.location || undefined, 
                rating: data.data.rating,
                totalSales: data.data.totalSales,
                avatar: product.seller.avatar // Keep existing avatar if present
              }
            });
          }
        }
      } catch (error) {
        console.error('Error fetching seller info:', error);
      }
    };

    if (id) {
      fetchProductData();
      fetchWishlist();
      fetchFavoriteCount();
      fetchViewCount();
      // Track the view after a short delay to ensure the page has loaded
      const timer = setTimeout(() => {
        trackProductView();
      }, 2000);

      if (product && product.seller && product.seller._id) {
        fetchSellerInfo(product.seller._id);
      }

      return () => clearTimeout(timer);
    }
  }, [id, hasTrackedView, product?.seller?._id]);

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  useEffect(() => {
    // Calculate service fee (e.g., 5% of offer amount)
    if (offerAmount) {
      const fee = parseFloat(offerAmount) * 0.05;
      setServiceFeeCost(fee.toFixed(2));
      setTotalCost((parseFloat(offerAmount) + fee).toFixed(2));
    } else {
      setServiceFeeCost('0.00');
      setTotalCost('0.00');
    }
  }, [offerAmount]);
  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % (product?.images.length || 0));
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + (product?.images.length || 0)) % (product?.images.length || 0));
  };
  const handleShare = () => {
    if (navigator.share && product) {
      navigator.share({
        title: product.title,
        text: t('productDetail.shareMessage', { title: product.title }),
        url: window.location.href,
      })
      .then(() => console.log('Successfully shared'))
      .catch((error) => console.log('Error sharing:', error));
    } else {
      setShowShareOptions(!showShareOptions);
    }
  };
  const handleMakeOffer = () => {
    setShowOfferModal(true);
  };

  const handleSubmitOffer = async () => {
    if (!offerAmount) return;
    
    // Check if user is authenticated
    if (!localStorage.getItem('accessToken')) {
      // Save current product page as the return destination after login
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }
    
    // Check if product exists
    if (!product) {
      toast.error('Product information is not available');
      return;
    }
    
    // After the null check, we can safely use the product
    const productData = product as NonNullable<typeof product>;
    
    // Start loading state
    setIsContactingSellerLoading(true);
    setContactError(null);
    
    try {
      // Format image URL for message
      const productImageUrl = productData.images && productData.images.length > 0
        ? formatImageUrl(productData.images[0])
        : '';
      
      // Create the conversation with the offer data
      // Instead of sending JSON, send a formatted message that's easier to read
      const userMessage = offerMessage; // Store the user's message in a separate variable
      const formattedOfferMessage = `💰 I'd like to make an offer of $${parseFloat(offerAmount).toFixed(2)} for this product: ${productData.title} (${productData.price.toFixed(2)} USD)${userMessage ? '\n\nMessage: ' + userMessage : ''}`;
      
      // Determine the conversation participant
      const conversationParticipant = productData.seller && productData.seller._id
        ? productData.seller._id
        : (import.meta.env.VITE_SUPPORT_USER_ID || "admin_support");
      
      // Create the conversation with the offer data
      const conversation = await createConversation(
        conversationParticipant,
        productData._id,
        formattedOfferMessage,
        { 
          messageType: 'offer',
          offerAmount: parseFloat(offerAmount),
          productDetails: {
            id: productData._id,
            title: productData.title,
            price: productData.price,
            image: productImageUrl
          }
        }
      );
      
      // Show success message
      toast.success(t('productDetail.offerSent'));
      
      // Close the modal and reset form
      setShowOfferModal(false);
      setOfferAmount('');
      setOfferMessage('');
      
      // Navigate to the messages page with parameters to indicate an offer
      navigate(`/messages?conversation=${conversation._id}&messageType=offer`);
    } catch (error) {
      console.error('Error creating offer:', error);
      setContactError('Unable to send your offer. Please try again later.');
      toast.error(t('productDetail.offerError'));
    } finally {
      setIsContactingSellerLoading(false);
    }
  };

  const handleViewStore = (sellerId: string) => {
    if (sellerId) {
      navigate(`/seller/${sellerId}`);
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

  const toggleWishlist = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!id) return;

    if (!localStorage.getItem('accessToken')) {
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }

    try {
      setIsAddingToWishlist(true);

      // Update endpoint and method based on current wishlist status
      const endpoint = isInWishlist
        ? `${API_URL}/api/wishlist/remove/${id}`
        : `${API_URL}/api/wishlist/add`;

      // For adding item to wishlist, the request body should match what's expected by the API
      const body = !isInWishlist ? JSON.stringify({ productId: id }) : undefined;

      console.log(`Making ${isInWishlist ? 'DELETE' : 'POST'} request to ${endpoint}`, body);

      const response = await fetch(endpoint, {
        method: isInWishlist ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        ...(body && { body })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isInWishlist ? 'remove from' : 'add to'} wishlist: ${response.status}`);
      }

      // Update local state optimistically
      setIsInWishlist(!isInWishlist);

      // Also update the wishlistIds array for consistency
      if (isInWishlist) {
        setWishlistIds(prev => prev.filter(itemId => itemId !== id));
        toast.success(t('productDetail.removedFromWishlist'));
      } else {
        setWishlistIds(prev => [...prev, id]);
        toast.success(t('productDetail.addedToWishlist'));
      }

      // Refresh the wishlist to ensure data is in sync
      // await fetchWishlist();

    } catch (error) {
      console.error('Error updating wishlist:', error);
      // Revert optimistic update on error
      // await fetchWishlist();
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `Posted ${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    } else if (diffInHours > 0) {
      return `Posted ${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInMinutes > 0) {
      return `Posted ${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return 'Posted just now';
    }
  };

  const handleContactSeller = async () => {
    // Check if product is null (which shouldn't happen due to our rendering conditions)
    if (!product) {
      toast.error('Product information is not available');
      return;
    }

    // At this point product is guaranteed to be non-null
    // Tell TypeScript this with a type assertion
    const nonNullProduct = product as ProductData;

    // Check if user is authenticated
    if (!localStorage.getItem('accessToken')) {
      // Save current product page as the return destination after login
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }

    // Start loading state regardless of which path we take
    setIsContactingSellerLoading(true);
    setContactError(null);

    try {
      // Create appropriate initial message based on whether seller info is available
      let initialMessage;
      let conversationParticipant;

      // Format image URL for message - ensure it's a complete URL
      let productImageUrl = '';
      if (nonNullProduct.images && nonNullProduct.images.length > 0) {
        productImageUrl = nonNullProduct.images[0];
        // If it's not already a full URL, format it
        if (!productImageUrl.startsWith('http')) {
          productImageUrl = formatImageUrl(productImageUrl);
        }
      }
      
      // Check if product has seller information
      if (nonNullProduct.seller && nonNullProduct.seller._id) {
        // If seller exists, use their ID and craft message for them
        conversationParticipant = nonNullProduct.seller._id;
        initialMessage = `👋 Hello! I'm interested in your product: ${nonNullProduct.title} (${nonNullProduct.price} USD)`;
        
        console.log('Creating conversation with seller:', {
          sellerId: conversationParticipant,
          productId: nonNullProduct._id,
          initialMessage
        });
      } else {
        // If seller doesn't exist, use a default support ID from environment variables
        // Fallback to a known admin/support user ID in your system
        const defaultSupportId = import.meta.env.VITE_SUPPORT_USER_ID || "admin_support"; 
        
        // In a real environment, this should be the ID of a real admin/support user
        // that exists in your database
        conversationParticipant = defaultSupportId;
        initialMessage = `👋 Hi Support! I'm interested in this product: ${nonNullProduct.title} (${nonNullProduct.price} USD), but I couldn't contact the seller directly.`;
        
        console.log('Creating conversation with support about product without seller:', {
          supportId: conversationParticipant,
          productId: nonNullProduct._id,
          initialMessage
        });
      }

      // Create the conversation with the appropriate participant and message
      const metadata = {
        messageType: 'inquiry',
        // Include product information directly in metadata to ensure it gets stored properly
        productDetails: {
          _id: nonNullProduct._id,
          title: nonNullProduct.title,
          price: nonNullProduct.price,
          images: nonNullProduct.images && nonNullProduct.images.length > 0 
            ? [productImageUrl] // Just send the first image to avoid large payloads
            : []
        }
      };

      // Create conversation with the product information embedded directly
      const conversation = await createConversation(
        conversationParticipant,
        nonNullProduct._id,
        initialMessage,
        metadata
      );

      // Show appropriate success message
      if (nonNullProduct.seller && nonNullProduct.seller._id) {
        toast.success('Connected with seller! You can now chat about this product.');
      } else {
        toast.success('Request sent to support! We\'ll help you with this product.');
      }

      // Navigate to the messages page with the new conversation
      navigate(`/messages?conversation=${conversation._id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      setContactError('Unable to initiate conversation. Please try again later.');
      
      // Show error toast for better visibility
      toast.error('Could not connect right now. Please try again later.');
    } finally {
      setIsContactingSellerLoading(false);
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    
    // Navigate to checkout with the product information
    navigate('/checkout', { 
      state: { 
        product: product,
        quantity: quantity,
        subtotal: product.price * quantity,
        buyNow: true 
      } 
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
        <p className="ml-4 text-gray-600">{t('common.loading')} {t('productDetail.productDetails')}</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">{t('productDetail.errorLoading')}</h2>
        <p className="text-gray-600 mb-4">{error || t('productDetail.productNotFound')}</p>
        <h2 className="text-xl font-semibold mb-2">{t('productDetail.afterApprovalMessage')}</h2>
        <button
          onClick={handleGoBack}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          {t('common.goBack')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile View */}
      <div className="md:hidden flex flex-col min-h-screen">
        {/* Mobile Content */}
        <div className="flex-1 pb-[80px]">
          {/* Image Slider */}
          <div className="relative w-full aspect-square bg-gray-100">
            <img
              src={formatImageUrl(product.images[currentImageIndex])}
              alt={product.title}
              className="w-full h-full object-cover"
            />
            {/* Mobile Header */}
            <div className={`fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center transition-all duration-200 ${isScrolled ? 'bg-white border-b shadow-sm' : 'bg-transparent'
              }`}>
              <button
                onClick={handleGoBack}
                className={`w-10 h-10 flex items-center justify-center rounded-full ${isScrolled ? 'hover:bg-gray-100' : 'bg-white hover:bg-gray-100'
                  }`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleShare}
                  className={`w-10 h-10 flex items-center justify-center rounded-full ${isScrolled ? 'hover:bg-gray-100' : 'bg-white hover:bg-gray-100'
                    }`}
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button
                  onClick={toggleWishlist}
                  className={`w-10 h-10 flex items-center justify-center rounded-full ${isScrolled ? 'hover:bg-gray-100' : 'bg-white hover:bg-gray-100'}`}
                  disabled={isAddingToWishlist}
                >
                  <Heart
                    className={`w-5 h-5 ${isInWishlist ? 'text-red-500 fill-red-500' : 'text-gray-400'}`}
                  />
                </button>
              </div>
            </div>

            <button
              onClick={() => setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentImageIndex((prev) => (prev + 1) % product.images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center shadow-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 right-4 bg-black/90 text-white text-xs px-3 py-1 rounded-full">
              {currentImageIndex + 1}/{product.images.length}
            </div>
          </div>

          {/* Product Info */}
          <div className="px-4 py-6 space-y-6">
            <div>
              <h1 className="text-2xl font-semibold mb-3">{product.title}</h1>

              <div className="p-4 bg-gray-50 rounded-lg mb-4">
                <p className="text-sm text-gray-600 whitespace-pre-line">{product.description}</p>
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold">${product.price}</span>

              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                {/* <span>{product.seller.name}</span> */}
                <span>•</span>
                {/* <span>Size: {product.specifications.dimensions}</span> */}
              </div>
            </div>

            {/* Vehicle Compatibility Section - Mobile */}
            {product.compatibility && product.compatibility.length > 0 && (
              <div className="border rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3">{t('productDetail.compatibleVehicles')}</h3>
                <div className="space-y-3">
                  {product.compatibility.map((item) => (
                    <div key={item._id} className="flex items-center p-2 bg-gray-50 rounded-lg">
                      <Car className="w-5 h-5 mr-3 text-gray-500" />
                      <div>
                        <span className="font-medium">{item.make} {item.model}</span>
                        <span className="text-gray-500 ml-1">({item.year})</span>
                      </div>
                    </div>
                  ))}
                </div>
                {product.oemNumber && (
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="font-medium">{t('productDetail.oemNumber')}:</span> {product.oemNumber}
                  </div>
                )}
              </div>
            )}

            {/* Seller Card - Updated spacing */}
            <div className="border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center text-xl font-semibold text-gray-600">
                  <span>{product.seller?.storeName?.[0]?.toUpperCase() || 'S'}</span>
                </div>
                <div className="flex-grow">
                  <div className="font-medium text-gray-800">{product.seller?.name || 'Seller'}</div>
                  <div className="text-sm text-gray-500">{product.seller?.storeName || 'Store'}</div>
                  {product.seller?.location && (
                    <div className="text-xs text-gray-500 mt-1 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {product.seller.location}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => product?.seller?._id ? handleViewStore(product.seller._id) : null}
                  className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center justify-center"
                >
                  {t('productDetail.viewStore')}
                </button>
                <ContactButton 
                  product={product}
                  isLoading={isContactingSellerLoading}
                  onContact={handleContactSeller}
                  error={contactError}
                />
              </div>
            </div>

            {/* Add favorite count in mobile view */}
            <div className="bg-gray-50 rounded-lg p-4 mt-6">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center">
                  <Heart className={`w-4 h-4 mr-3 ${favoriteCount > 0 ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                  <span className="text-sm text-gray-600">{favoriteCount} {favoriteCount === 1 ? 'person has' : 'people have'} added this to wishlist</span>
                </div>

                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-sm text-gray-600">{viewCount} {viewCount === 1 ? 'view' : 'views'}</span>
                </div>

                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-600">{product.createdAt ? formatTimeAgo(product.createdAt) : 'Recently posted'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block mt-16">
        <div className="max-w-4xl mx-auto px-8 py-8">

          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4 mt-16">
            <button onClick={handleGoBack} className="flex items-center gap-2 hover:text-gray-700">
              <ChevronLeft className="w-4 h-4" />
              {t('common.back')}
            </button>
            <span>/</span>
            <span>{product.category.name}</span>
          </nav>

          {/* Main Content */}
          <div className="grid grid-cols-12 gap-8">
            {/* Left Column - Images */}
            <div className="col-span-7 relative">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 relative group max-w-[500px]">
                <img
                  src={formatImageUrl(product.images[currentImageIndex])}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
               


                <button
                  onClick={() => setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setCurrentImageIndex((prev) => (prev + 1) % product.images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
               {/* Webview Header */}
               <div className={`absolute md:top-[0px] mt-[20px] z-60 p-4 w-[475px]`}>
                  <div className="flex justify-between w-full">
                    <button 
                     onClick={handleShare}
                    className={`w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100`}>
                      <Share2 className="w-5 h-5" />
                    </button>

                    <button
                      onClick={toggleWishlist}
                      className={`w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100`}
                      disabled={isAddingToWishlist}
                    >
                      <Heart
                        className={`w-5 h-5 ${isInWishlist ? 'text-red-500 fill-red-500' : 'text-gray-400'}`}
                      />
                    </button>
                  </div>

                </div>
              <div className="grid grid-cols-4 gap-4 mt-4 max-w-[500px]">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden transition-all
                      ${currentImageIndex === index
                        ? 'ring-2 ring-primary ring-offset-2'
                        : 'hover:opacity-80'
                      }`}
                  >
                    <img
                      src={formatImageUrl(image)}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/product-placeholder.jpg';
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column - Product Info */}
            <div className="col-span-5 space-y-6">

              {/* Product Details */}
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-semibold mb-1">{product.title}</h1>

                </div>

                <div className="flex items-baseline gap-4">
                  <span className="text-3xl font-bold">${product.price}</span>

                </div>

                {/* Condition */}
                <div className="p-5 bg-gray-50 rounded-xl">

                  <p className="text-gray-600 text-sm leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Vehicle Compatibility Section - Desktop */}
                {product.compatibility && product.compatibility.length > 0 && (
                  <div className="border rounded-xl p-5">
                    <h3 className="font-semibold text-gray-800 mb-3 text-lg">{t('productDetail.compatibleVehicles')}</h3>
                    <div className="space-y-3">
                      {product.compatibility.map((item) => (
                        <div key={item._id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <Car className="w-5 h-5 mr-3 text-gray-500" />
                          <div>
                            <span className="font-medium">{item.make} {item.model}</span>
                            <span className="text-gray-500 ml-2">({item.year})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {product.oemNumber && (
                      <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        <span className="font-medium">{t('productDetail.oemNumber')}:</span> {product.oemNumber}
                      </div>
                    )}
                  </div>
                )}

                {/* Seller Info */}
                <div className="border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center text-xl font-semibold text-gray-600 overflow-hidden">
                      <span>{product.seller?.storeName?.[0]?.toUpperCase() || 'S'}</span>
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium text-gray-800">{product.seller?.name || 'Seller'}</div>
                      <div className="text-sm text-gray-500">{product.seller?.storeName || 'Store'}</div>
                      {product.seller?.location && (
                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {product.seller.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => product?.seller?._id ? handleViewStore(product.seller._id) : null}
                      className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center justify-center"
                    >
                      {t('productDetail.viewStore')}
                    </button>
                    <ContactButton 
                      product={product}
                      isLoading={isContactingSellerLoading}
                      onContact={handleContactSeller}
                      error={contactError}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">

                  <button
                    onClick={handleMakeOffer}
                    className="flex-1 py-3.5 px-6 border border-secondary rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    {t('productDetail.makeOffer')}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 py-3.5 px-6 bg-primary text-secondary-dark rounded-xl font-medium hover:bg-primary-dark transition-colors"
                  >
                    {t('productDetail.buyNow')}
                  </button>
                </div>

                {/* Add favorite count below buttons */}
                <div className="flex flex-col mt-4 text-sm text-gray-500 space-y-2">
                  <div className="flex items-center">
                    <Heart className={`w-4 h-4 mr-2 ${favoriteCount > 0 ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                    <span>{favoriteCount} {favoriteCount === 1 ? t('productDetail.views.singular') : t('productDetail.views.plural')} {t('productDetail.addedToWishlist')}</span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{viewCount} {viewCount === 1 ? t('productDetail.favorites.singular') : t('productDetail.favorites.plural')} {t('productDetail.viewedProduct')}</span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{product.createdAt ? formatTimeAgo(product.createdAt) : 'Recently posted'}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Add this modal for sharing options when Web Share API is not available */}
      {showShareOptions && (
        <div className="absolute top-16 right-4 bg-white rounded-lg shadow-lg p-4 z-50 border border-gray-200">
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setShowShareOptions(false);
              }}
              className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              </svg>
              <span>Copy Link</span>
            </button>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Check out this product: ${product.title} ${window.location.href}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span>WhatsApp</span>
            </a>

            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </a>

            <button
              onClick={() => setShowShareOptions(false)}
              className="flex items-center justify-center mt-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* Enhanced Make Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-all duration-300">
          <div className="bg-black rounded-xl p-8 w-full max-w-md border border-gray-800 shadow-xl transform transition-all duration-300 ease-out">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">{t('productDetail.offerModal.title')}</h3>
              <button
                onClick={() => setShowOfferModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="offerAmount" className="block text-sm font-medium text-gray-300 mb-2">
                  {t('productDetail.offerModal.yourOffer')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400">$</span>
                  </div>
                  <input
                    type="number"
                    id="offerAmount"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white"
                    placeholder="Enter amount"
                    min="0"
                    step="0.01"
                  />
                </div>
                {product.price && (
                  <p className="mt-2 text-sm text-gray-400">
                    {t('productDetail.offerModal.price')}: ${product.price} • {t('productDetail.offerModal.yourOffer')}: {offerAmount ? `${((parseFloat(offerAmount) / product.price) * 100).toFixed(1)}%` : '0%'} {t('productDetail.offerModal.ofListing')}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="offerMessage" className="block text-sm font-medium text-gray-300 mb-2">
                  {t('productDetail.offerModal.message')}
                </label>
                <textarea
                  id="offerMessage"
                  value={offerMessage || ''}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white h-24"
                  placeholder={t('productDetail.offerModal.messagePlaceholder')}
                />
              </div>

              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">{t('productDetail.offerModal.serviceFee')}</span>
                  <span className="text-white">${serviceFeeCost}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-300">{t('productDetail.offerModal.youllPay')}</span>
                  <span className="text-white font-bold">${totalCost}</span>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowOfferModal(false)}
                  className="flex-1 py-3 px-4 border border-gray-700 rounded-lg font-medium text-gray-300 hover:bg-gray-900 transition-colors"
                >
                  {t('productDetail.offerModal.cancel')}
                </button>
                <button
                  onClick={handleSubmitOffer}
                  disabled={!offerAmount || parseFloat(offerAmount) <= 0}
                  className="flex-1 py-3 px-4 bg-primary text-secondary-dark rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {t('productDetail.offerModal.submit')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;


