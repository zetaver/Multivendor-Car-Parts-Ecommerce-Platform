import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Share2,
  Shield,
  Truck,
  MessageCircle,
  Star,
  Info,
  AlertCircle,
  Check,
  MapPin,
  Package,
  ArrowLeft,
  ArrowRight,
  DollarSign,
  Store,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import clsx from 'clsx';
import { createConversation } from '../services/messageService';
import { API_URL } from '../config';

interface SimilarProduct {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  condition?: string;
  negotiable?: boolean;
}

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
    avatar?: string;
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

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  useEffect(() => {
    const fetchProductData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${API_URL}/api/products/${id}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch product details: ${response.status}`);
        }

        const data = await response.json();
        setProduct(data);
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

    if (id) {
      fetchProductData();
      fetchWishlist();
      fetchFavoriteCount();
      fetchViewCount();
      // Track the view after a short delay to ensure the page has loaded
      const timer = setTimeout(() => {
        trackProductView();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [id, hasTrackedView]);

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

  const handleMakeOffer = () => {
    setShowOfferModal(true);
  };

  const handleSubmitOffer = () => {
    if (!offerAmount) return;

    console.log('Offer submitted:', offerAmount, 'Message:', offerMessage);
    setShowOfferModal(false);
    setOfferAmount('');
    setOfferMessage('');
  };

  const handleViewStore = (sellerId: string) => {
    navigate(`/seller/${sellerId}`);
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
      navigate('/login', { state: { from: `/products/${id}` } });
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
      } else {
        setWishlistIds(prev => [...prev, id]);
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
    // Check if user is authenticated
    if (!localStorage.getItem('accessToken')) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    
    // Check if product has seller information
    if (!product?.seller?._id) {
      setContactError('Seller information not available');
      return;
    }
    
    try {
      setIsContactingSellerLoading(true);
      setContactError(null);
      
      // Create a new conversation with the seller
      const initialMessage = `Hi, I'm interested in your product: ${product.title}`;
      const conversation = await createConversation(
        product.seller._id,
        product._id,
        initialMessage
      );
      
      // Navigate to the messages page with the new conversation
      navigate(`/messages?conversation=${conversation._id}`);
    } catch (error) {
      console.error('Error contacting seller:', error);
      setContactError('Failed to contact seller. Please try again later.');
    } finally {
      setIsContactingSellerLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
        <p className="ml-4 text-gray-600">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error Loading Product</h2>
        <p className="text-gray-600 mb-4">{error || 'Product not found'}</p>
        <h2 className="text-xl font-semibold mb-2">After Approval of Product you can view it here</h2>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          Go Back
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
                onClick={() => navigate(-1)}
                className={`w-10 h-10 flex items-center justify-center rounded-full ${isScrolled ? 'hover:bg-gray-100' : 'bg-white hover:bg-gray-100'
                  }`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex gap-2">
                <button className={`w-10 h-10 flex items-center justify-center rounded-full ${isScrolled ? 'hover:bg-gray-100' : 'bg-white hover:bg-gray-100'
                  }`}>
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

            {/* Seller Card - Updated spacing */}
            <div className="border rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    // src={product.seller.logo}
                    // alt={product.seller.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'logo.png';
                    }}
                  />
                </div>
                <div className="flex-grow">
                  {/* <div className="font-medium">{product.seller.name}</div> */}
                  <div className="text-sm text-gray-500">Partner brand</div>
                  {/* <div className="text-sm text-gray-500">{product.seller.location}</div> */}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  // onClick={() => handleViewStore(product.seller.id)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  View Store
                </button>
                <button 
                  onClick={handleContactSeller}
                  disabled={isContactingSellerLoading}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  {isContactingSellerLoading ? 'Connecting...' : 'Contact Seller'}
                </button>
              </div>
              {contactError && (
                <div className="mt-2 text-sm text-red-500">{contactError}</div>
              )}
            </div>

            {/* Add favorite count in mobile view */}
            <div className="flex flex-col items-center mt-6 text-sm text-gray-500 justify-center space-y-2">
              <div className="flex items-center">
                <Heart className={`w-4 h-4 mr-2 ${favoriteCount > 0 ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                <span>{favoriteCount} {favoriteCount === 1 ? 'person has' : 'people have'} added this to their wishlist</span>
              </div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{viewCount} {viewCount === 1 ? 'person has' : 'people have'} viewed the product</span>
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

      {/* Desktop View */}
      <div className="hidden md:block mt-16">
        <div className="max-w-4xl mx-auto px-8 py-8">

          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4 mt-16">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 hover:text-gray-700">
              <ChevronLeft className="w-4 h-4" />
              Back
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
                {/* Webview Header */}
                <div className={`fixed md:top-[170px] mt-[20px] z-50 p-4 w-[475px]`}>
                  <div className="flex justify-between w-full">
                    <button className={`w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100`}>
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

                {/* Seller Info */}
                <div className="border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        // src={product.seller.logo}
                        // alt={product.seller.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/default-store-logo.png';
                        }}
                      />
                    </div>
                    <div className="flex-grow">
                      {/* <div className="font-medium">{product.seller.name}</div> */}
                      <div className="text-sm text-gray-500">Partner brand</div>
                      {/* <div className="text-sm text-gray-500">{product.seller.location}</div> */}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      // onClick={() => handleViewStore(product.seller.id)}
                      className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      View Store
                    </button>
                    <button 
                      onClick={handleContactSeller}
                      disabled={isContactingSellerLoading}
                      className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      {isContactingSellerLoading ? 'Connecting...' : 'Contact Seller'}
                    </button>
                  </div>
                  {contactError && (
                    <div className="mt-2 text-sm text-red-500">{contactError}</div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">

                  <button
                    onClick={handleMakeOffer}
                    className="flex-1 py-3.5 px-6 border border-secondary rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Make an offer
                  </button>
                  <button className="flex-1 py-3.5 px-6 bg-primary text-secondary-dark rounded-xl font-medium hover:bg-primary-dark transition-colors">
                    Buy Now
                  </button>
                </div>

                {/* Add favorite count below buttons */}
                <div className="flex flex-col mt-4 text-sm text-gray-500 space-y-2">
                  <div className="flex items-center">
                    <Heart className={`w-4 h-4 mr-2 ${favoriteCount > 0 ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
                    <span>{favoriteCount} {favoriteCount === 1 ? 'person has' : 'people have'} added this to their wishlist</span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{viewCount} {viewCount === 1 ? 'person has' : 'people have'} viewed the product</span>
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



      {/* Enhanced Make Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-all duration-300">
          <div className="bg-black rounded-xl p-8 w-full max-w-md border border-gray-800 shadow-xl transform transition-all duration-300 ease-out">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Make an Offer</h3>
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
                  Your Offer Amount
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
                    Listing price: ${product.price} • Your offer: {offerAmount ? `${((parseFloat(offerAmount) / product.price) * 100).toFixed(1)}%` : '0%'} of listing
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="offerMessage" className="block text-sm font-medium text-gray-300 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  id="offerMessage"
                  value={offerMessage || ''}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  className="w-full p-4 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-white h-24"
                  placeholder="Add a message to the seller..."
                />
              </div>

              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Service Fee</span>
                  <span className="text-white">${serviceFeeCost}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-300">You'll Pay</span>
                  <span className="text-white font-bold">${totalCost}</span>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowOfferModal(false)}
                  className="flex-1 py-3 px-4 border border-gray-700 rounded-lg font-medium text-gray-300 hover:bg-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitOffer}
                  disabled={!offerAmount || parseFloat(offerAmount) <= 0}
                  className="flex-1 py-3 px-4 bg-primary text-secondary-dark rounded-lg font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Send Offer
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


