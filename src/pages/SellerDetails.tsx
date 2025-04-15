import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, MapPin, MessageCircle, Package, Filter, Search, SortDesc, ChevronDown, ThumbsUp } from 'lucide-react';
import { API_URL } from '../config';
import { format } from 'date-fns';

interface Seller {
  _id: string;
  firstName: string;
  lastName: string;
  storeName?: string;
  rating?: number;
  totalSales?: number;
  location?: string;
  joinDate?: string;
  responseTime?: string;
  description?: string;
  banner?: string;
}

interface Product {
  _id: string;
  title: string;
  price: number;
  images: string[];
  description: string;
  condition: string;
  oemNumber: string;
  stock: number;
  rating?: number;
  status?: string;
}

interface Review {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  productId: {
    _id: string;
    title: string;
    images: string[];
  };
  rating: number;
  comment?: string;
  createdAt: string;
}

interface ReviewsStats {
  average: number;
  total: number;
  distribution: {
    [key: number]: number;
  };
}

const SellerDetails: React.FC = () => {
  const navigate = useNavigate();
  const { sellerId } = useParams();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsStats, setReviewsStats] = useState<ReviewsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [reviewSortBy, setReviewSortBy] = useState('recent');
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsPagination, setReviewsPagination] = useState({
    total: 0,
    pages: 1,
    page: 1,
    limit: 5
  });
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'reviews'>('products');

  // Fetch seller reviews
  const fetchSellerReviews = async (sort = reviewSortBy, page = 1, limit = 5) => {
    try {
      setReviewsLoading(true);
      
      if (!sellerId) return;
      
      const url = `${API_URL}/api/reviews/seller/${sellerId}?sort=${sort}&page=${page}&limit=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('Failed to fetch seller reviews:', response.status);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.data.reviews);
        setReviewsStats(data.data.stats);
        setReviewsPagination(data.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching seller reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Handle review sort change
  const handleReviewSortChange = (sort: string) => {
    setReviewSortBy(sort);
    setReviewsPage(1);
    fetchSellerReviews(sort, 1);
  };

  // When reviewsPage changes, fetch new reviews
  useEffect(() => {
    if (sellerId) {
      fetchSellerReviews(reviewSortBy, reviewsPage);
    }
  }, [reviewsPage, sellerId]);

  // Add useEffect to fetch reviews on component mount
  useEffect(() => {
    if (sellerId) {
      fetchSellerReviews();
    }
  }, [sellerId]);

  // Debug URL parameters
  useEffect(() => {
    // Get seller ID from URL as a fallback
    const pathSegments = window.location.pathname.split('/');
    const urlSellerId = pathSegments[pathSegments.length - 1];
    
    console.log('URL Debug Info:', {
      'useParams.sellerId': sellerId,
      'pathSegments': pathSegments,
      'urlSellerId': urlSellerId,
      'fullPath': window.location.pathname
    });
    
    // If useParams fails but we can extract from URL, use that instead
    if (!sellerId && urlSellerId && urlSellerId.length > 10) {
      console.log('Using seller ID from URL:', urlSellerId);
      
      // Manual fetch if useParams fails
      const fetchWithUrlId = async () => {
        try {
          setLoading(true);
          console.log(`Manual fetch with ID: ${urlSellerId}`);
          
          // Get authentication token from localStorage
          const token = localStorage.getItem('accessToken');
          console.log('Auth token available for manual fetch:', !!token);
          
          // Create headers with authentication
          const headers: HeadersInit = {
            'Content-Type': 'application/json'
          };
          
          // Add token if available
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          // First try seller info
          const sellerResponse = await fetch(`${API_URL}/api/users/seller-info/${urlSellerId}`, {
            headers
          });
          if (!sellerResponse.ok) {
            throw new Error(`Seller info fetch failed: ${sellerResponse.status}`);
          }
          
          const sellerData = await sellerResponse.json();
          console.log('Manual fetch - Seller data:', sellerData);
          
          // Then try products
          const productsResponse = await fetch(`${API_URL}/api/products/seller/${urlSellerId}`, {
            headers
          });
          const productsData = await productsResponse.json();
          console.log('Manual fetch - Products data:', productsData);
          
          // Process seller data
          const sellerInfo = sellerData.success ? sellerData.data : sellerData;
          const formattedSeller: Seller = {
            _id: sellerInfo._id,
            firstName: sellerInfo.name?.split(' ')[0] || '',
            lastName: sellerInfo.name?.split(' ')[1] || '',
            storeName: sellerInfo.storeName || undefined,
            rating: sellerInfo.rating || 0,
            totalSales: sellerInfo.totalSales || 0,
            location: sellerInfo.location || undefined,
            joinDate: sellerInfo.joinDate || new Date().getFullYear().toString(),
            responseTime: '24h',
            description: sellerInfo.description || 'No description available',
            banner: sellerInfo.banner || undefined
          };
          
          setSeller(formattedSeller);
          
          // Process products data
          const productsList = productsData.success ? productsData.data : productsData;
          setProducts(Array.isArray(productsList) ? productsList : []);
          
        } catch (err) {
          console.error('Error in manual fetch:', err);
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setLoading(false);
        }
      };
      
      fetchWithUrlId();
    }
  }, [sellerId]);

  useEffect(() => {
    const fetchSellerDetails = async () => {
      try {
        // Log the sellerId and API URL to help with debugging
        console.log('Fetching details for seller:', sellerId);
        console.log('Using API URL:', API_URL);
        
        setLoading(true);
        
        // Check if sellerId exists
        if (!sellerId) {
          throw new Error('No seller ID provided');
        }

        // Get authentication token from localStorage
        const token = localStorage.getItem('accessToken');
        console.log('Auth token available:', !!token);
        
        // Create headers with authentication
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        
        // Add token if available
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Try directly fetching seller info first to isolate any issues
        console.log(`Fetching seller info from: ${API_URL}/api/users/seller-info/${sellerId}`);
        const sellerResponse = await fetch(`${API_URL}/api/users/seller-info/${sellerId}`, {
          headers
        });
        
        // If seller info fetch fails, throw an error
        if (!sellerResponse.ok) {
          console.error('Failed to fetch seller info:', sellerResponse.status, sellerResponse.statusText);
          throw new Error(`Seller info fetch failed: ${sellerResponse.status}`);
        }
        
        const sellerData = await sellerResponse.json();
        console.log('Seller data received:', sellerData);
        
          // Transform the seller data to match the Seller interface
        const sellerInfo = sellerData.success ? sellerData.data : sellerData;
        const formattedSeller: Seller = {
          _id: sellerInfo._id,
          firstName: sellerInfo.name?.split(' ')[0] || '',
          lastName: sellerInfo.name?.split(' ')[1] || '',
          storeName: sellerInfo.storeName || undefined,
          rating: sellerInfo.rating || 0,
          totalSales: sellerInfo.totalSales || 0,
          location: sellerInfo.location || undefined,
          joinDate: sellerInfo.joinDate || new Date().getFullYear().toString(),
          responseTime: '24h', // Default value
          description: sellerInfo.description || 'No description available',
          banner: sellerInfo.banner || undefined
        };

        setSeller(formattedSeller);
        
        // Fetch the products
        const productsList = await fetchSellerProducts(sellerId);
        setProducts(productsList);
      } catch (err) {
        console.error('Error fetching seller details:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (sellerId) {
      fetchSellerDetails();
    } else {
      console.error('No sellerId provided to SellerDetails component');
      setError('No seller ID provided');
      setLoading(false);
    }
  }, [sellerId]);

  const formatImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${API_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  };

  // Function to fetch products for a seller
  const fetchSellerProducts = async (sellerId: string): Promise<Product[]> => {
    try {
      // Get authentication token from localStorage
      const token = localStorage.getItem('accessToken');
      
      // Create headers with authentication
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      // Add token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      console.log(`Fetching seller products from: ${API_URL}/api/products/seller/${sellerId}`);
      const productsResponse = await fetch(`${API_URL}/api/products/seller/${sellerId}`, {
        headers
      });
      
      if (!productsResponse.ok) {
        console.error('Failed to fetch seller products:', productsResponse.status, productsResponse.statusText);
        return [];
      }
      
      const productsData = await productsResponse.json();
      console.log('Products data received:', productsData);
      
      // The products endpoint returns { success: true, data: [...] }
      const productsList = productsData.success ? productsData.data : productsData;
      return Array.isArray(productsList) ? productsList : [];
    } catch (err) {
      console.error('Error fetching seller products:', err);
      return [];
    }
  };
  
  // New function to search products from the API
  const searchProducts = async (query: string) => {
    if (!query.trim() || !sellerId) {
      // If query is empty or no seller ID, reset to all products
      const allProducts = await fetchSellerProducts(sellerId || '');
      setProducts(allProducts);
      setIsSearching(false);
      return;
    }
    
    try {
      setIsSearching(true);
      
      // Get authentication token from localStorage
      const token = localStorage.getItem('accessToken');
      
      // Create headers with authentication
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      // Add token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Construct the search URL with seller ID as an additional parameter
      const searchUrl = `${API_URL}/api/products/search?query=${encodeURIComponent(query)}&sellerId=${sellerId}`;
      console.log(`Searching products: ${searchUrl}`);
      
      const response = await fetch(searchUrl, { headers });
      
      if (!response.ok) {
        console.error('Search failed:', response.status, response.statusText);
        // If search fails, we could either keep the current products or reset to all products
        return;
      }
      
      const data = await response.json();
      console.log('Search results:', data);
      
      // Update products with search results
      const searchResults = data.success ? data.data : data;
      setProducts(Array.isArray(searchResults) ? searchResults : []);
    } catch (err) {
      console.error('Error during search:', err);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle search input with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce the search
    searchTimeoutRef.current = setTimeout(() => {
      searchProducts(query);
    }, 500);
  };
  
  // Clean up the timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (err) {
      return dateString;
    }
  };

  // Rating Stars component
  const RatingStars: React.FC<{ rating: number; size?: number }> = ({ rating, size = 16 }) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={`${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Rating Progress Bar
  const RatingProgressBar: React.FC<{ 
    value: number; 
    total: number;
    level: number;
  }> = ({ value, total, level }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    
    return (
      <div className="flex items-center py-1">
        <div className="w-6 text-sm text-gray-600">{level}</div>
        <div className="w-full bg-gray-200 h-2 mx-2 rounded-full overflow-hidden">
          <div 
            className="bg-yellow-400 h-full rounded-full"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="w-10 text-sm text-gray-600 text-right">{value}</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !seller) {
    // Check if the error is related to authentication
    const isAuthError = error && error.includes('401');
    const errorMessage = isAuthError 
      ? 'Authentication required. Please log in to view seller details.'
      : (error || 'Seller not found');
      
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Seller</h2>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <div className="flex flex-col space-y-2 items-center">
            <button 
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go Back
            </button>
            
            {isAuthError && (
              <button 
                onClick={() => window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 mt-2"
              >
                Log In
              </button>
            )}
          </div>
          <p className="mt-4 text-sm text-gray-500">
            If the problem persists, please refresh the page or try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Seller Banner - Adjusted for mobile */}
      <div className="h-48 md:h-64 relative mt-0">
        <div className="absolute inset-0">
          <img
            src={seller?.banner || "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80&w=1920"}
            alt="Store Banner"
            className="w-full h-full object-cover opacity-80"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end">
          <div className="pb-4 md:pb-6 flex items-end space-x-4 md:space-x-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg bg-white p-1 shadow-xl">
              <div className="w-full h-full bg-blue-600 rounded-lg flex items-center justify-center text-white text-3xl md:text-4xl font-bold">
                {seller && seller.storeName && seller.storeName[0] 
                  ? seller.storeName[0] 
                  : (seller && seller.firstName && seller.firstName[0] 
                    ? seller.firstName[0] 
                    : 'S')}
              </div>
            </div>
            <div className="pb-2 md:pb-4 text-white">
              <h1 className="text-xl md:text-3xl font-bold">
                {seller && seller.storeName 
                  ? seller.storeName 
                  : `${seller && seller.firstName ? seller.firstName : ''} ${seller && seller.lastName ? seller.lastName : ''}`}
              </h1>
              <div className="flex flex-wrap items-center mt-1 md:mt-2 space-x-2 md:space-x-4 text-sm md:text-base">
                <div className="flex items-center">
                  <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 fill-current" />
                  <span className="ml-1">{seller && seller.rating ? seller.rating : '0.0'}</span>
                </div>
                <span>•</span>
                <span>{seller && seller.totalSales ? seller.totalSales : 0} sales</span>
                {seller && seller.location && (
                  <>
                    <span>•</span>
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                      <span>{seller.location}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Seller Stats - Made responsive with grid adjustments */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-8">
          <div className="bg-white rounded-lg shadow p-3 md:p-6">
            <h3 className="text-sm md:text-lg font-semibold mb-1 md:mb-2">Member Since</h3>
            <p className="text-xs md:text-base text-gray-600">{seller.joinDate || new Date().getFullYear()}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 md:p-6">
            <h3 className="text-sm md:text-lg font-semibold mb-1 md:mb-2">Total Sales</h3>
            <p className="text-xs md:text-base text-gray-600">{seller.totalSales || 0} sales</p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 md:p-6 col-span-2 md:col-span-1">
            <h3 className="text-sm md:text-lg font-semibold mb-1 md:mb-2">Total Products</h3>
            <p className="text-xs md:text-base text-gray-600">{products.length} active listings</p>
          </div>
        </div>

        {/* Tabs Navigation - Adjusted for mobile */}
        <div className="flex border-b border-gray-200 mb-4 md:mb-8 overflow-x-auto">
          <button
            className={`py-2 md:py-4 px-4 md:px-6 text-xs md:text-sm font-medium -mb-px whitespace-nowrap ${
              activeTab === 'products'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('products')}
          >
            Products ({products.length})
          </button>
          <button
            className={`py-2 md:py-4 px-4 md:px-6 text-xs md:text-sm font-medium -mb-px whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('reviews')}
          >
            Customer Reviews
          </button>
        </div>

        {/* Products Section */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-lg shadow mb-4 md:mb-8">
          <div className="p-3 md:p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
                <h2 className="text-lg md:text-xl font-semibold">Available Products</h2>
                
                {/* Search input */}
                <div className="relative w-full md:w-64 mt-2 md:mt-0">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 pr-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-2.5">
                      <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                    </div>
                  )}
              </div>
            </div>
          </div>

            {/* Products grid - Updated for better mobile display */}
          <div className="p-3 md:p-6">
              {products.length === 0 ? (
              <div className="text-center py-6 md:py-12">
                <Package className="mx-auto h-8 w-8 md:h-12 md:w-12 text-gray-400" />
                <h3 className="mt-2 text-xs md:text-sm font-medium text-gray-900">No products found</h3>
                <p className="mt-1 text-xs md:text-sm text-gray-500">
                  {searchQuery ? `No results for "${searchQuery}"` : 'This seller has no active listings'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                  {products.map((product) => (
                  <Link
                    key={product._id}
                    to={`/products/${product._id}`}
                    className="group bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="aspect-square overflow-hidden rounded-t-lg">
                      <img
                        src={formatImageUrl(product.images[0])}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            e.currentTarget.src = '/product-placeholder.jpg';
                          }}
                      />
                    </div>
                    <div className="p-2 md:p-4">
                      <h3 className="text-xs md:text-sm font-medium text-gray-900 line-clamp-2">{product.title}</h3>
                        <p className="mt-1 text-xs text-gray-500">OEM: {product.oemNumber || 'N/A'}</p>
                      <div className="mt-1 md:mt-2 flex items-center justify-between">
                          <span className="text-sm md:text-lg font-bold text-blue-600">€{product.price.toFixed(2)}</span>
                        {product.rating && (
                          <div className="flex items-center">
                            <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-current" />
                            <span className="ml-1 text-xs md:text-sm text-gray-600">{product.rating}</span>
                          </div>
                        )}
                      </div>
                        {product.status && (
                      <div className="mt-1 md:mt-2 text-xs md:text-sm text-gray-500">
                            Status: {product.status}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews Section - Made responsive */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-lg shadow mb-4 md:mb-8">
            <div className="p-3 md:p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
                <h2 className="text-lg md:text-xl font-semibold">Customer Reviews</h2>
                
                {/* Sort options */}
                <div className="relative mt-2 md:mt-0">
                  <select
                    value={reviewSortBy}
                    onChange={(e) => handleReviewSortChange(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-md py-1 md:py-2 pl-3 pr-10 text-xs md:text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest">Highest Rated</option>
                    <option value="lowest">Lowest Rated</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1.5 md:top-2.5 h-4 w-4 text-gray-500" />
                </div>
              </div>
            </div>

            {reviewsLoading ? (
              <div className="flex justify-center items-center py-6 md:py-12">
                <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-6 md:py-12">
                <MessageCircle className="mx-auto h-8 w-8 md:h-12 md:w-12 text-gray-400" />
                <h3 className="mt-2 text-xs md:text-sm font-medium text-gray-900">No Reviews Yet</h3>
                <p className="mt-1 text-xs md:text-sm text-gray-500">
                  This seller hasn't received any reviews yet.
                </p>
              </div>
            ) : (
              <div>
                {/* Reviews summary - Adjusted for mobile */}
                <div className="p-3 md:p-6 border-b border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {/* Average rating */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-3xl md:text-5xl font-bold text-gray-900 mb-1 md:mb-2">
                        {reviewsStats?.average?.toFixed(1) || "0.0"}
                      </div>
                      <RatingStars rating={reviewsStats?.average || 0} size={20} />
                      <div className="text-xs md:text-sm text-gray-500 mt-1 md:mt-2">
                        Based on {reviewsStats?.total || 0} reviews
                      </div>
                    </div>
                    
                    {/* Rating distribution */}
                    <div className="col-span-1 md:col-span-2 mt-4 md:mt-0">
                      <div className="space-y-1">
                        {[5, 4, 3, 2, 1].map(num => (
                          <RatingProgressBar 
                            key={num} 
                            level={num} 
                            value={reviewsStats?.distribution?.[num] || 0} 
                            total={reviewsStats?.total || 0} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Reviews list - Adjusted for mobile */}
                <div className="divide-y divide-gray-200">
                  {reviews.map(review => (
                    <div key={review?._id || 'review-item'} className="p-3 md:p-6">
                      <div className="flex items-start">
                        {/* User avatar */}
                        <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gray-200 flex-shrink-0 mr-3 md:mr-4 overflow-hidden">
                          {review?.user?.avatar ? (
                            <img 
                              src={formatImageUrl(review.user.avatar)} 
                              alt={`${review?.user?.firstName || ''} ${review?.user?.lastName || ''}`} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-blue-600 text-white font-bold text-sm md:text-lg">
                              {review?.user?.firstName && review.user.firstName[0] ? review.user.firstName[0] : '?'}
                            </div>
                          )}
                        </div>
                        
                        {/* Review content */}
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <h4 className="text-xs md:text-sm font-medium text-gray-900">
                              {review?.user?.firstName || ''} {review?.user?.lastName || ''}
                            </h4>
                            <span className="text-xs text-gray-500 mt-1 md:mt-0">
                              {review?.createdAt ? formatDate(review.createdAt) : ''}
                            </span>
                          </div>
                          
                          <div className="mt-1">
                            <RatingStars rating={review?.rating || 0} size={16} />
                          </div>
                          
                          {review?.comment && (
                            <p className="mt-2 text-xs md:text-sm text-gray-600">
                              {review.comment}
                            </p>
                          )}
                          
                          {/* Product purchased info */}
                          {review?.productId && (
                          <div className="mt-2 md:mt-3 flex items-center text-xs text-gray-500">
                            <Link 
                                to={`/products/${review.productId._id || '0'}`}
                              className="flex items-center hover:text-blue-600"
                            >
                              <div className="h-6 w-6 md:h-8 md:w-8 rounded bg-gray-100 mr-2 overflow-hidden">
                                  {review?.productId?.images && review.productId.images.length > 0 ? (
                                  <img 
                                    src={formatImageUrl(review.productId.images[0])} 
                                      alt={review?.productId?.title || 'Product'} 
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-gray-300 text-white">
                                    <Package size={12} />
                                  </div>
                                )}
                              </div>
                                <span className="text-xs md:text-sm">Purchased: {review?.productId?.title || 'Product'}</span>
                  </Link>
                          </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination - Adjusted for mobile */}
                {reviewsPagination.pages > 1 && (
                  <div className="flex justify-center items-center p-3 md:p-6 border-t border-gray-200">
                    <nav className="flex flex-wrap space-x-1 md:space-x-2">
                      <button
                        onClick={() => setReviewsPage(Math.max(1, reviewsPage - 1))}
                        disabled={reviewsPage === 1}
                        className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm ${
                          reviewsPage === 1 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Previous
                      </button>
                      
                      {Array.from({ length: reviewsPagination.pages }, (_, i) => i + 1)
                        .filter(page => (
                          page === 1 || 
                          page === reviewsPagination.pages || 
                          Math.abs(page - reviewsPage) <= 1
                        ))
                        .map((page, i, arr) => {
                          // Add ellipsis if needed
                          if (i > 0 && page - arr[i - 1] > 1) {
                            return (
                              <React.Fragment key={`ellipsis-${page}`}>
                                <span className="px-2 md:px-3 py-1 text-xs md:text-sm">...</span>
                                <button
                                  onClick={() => setReviewsPage(page)}
                                  className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm ${
                                    reviewsPage === page
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  {page}
                                </button>
                              </React.Fragment>
                            );
                          }
                          
                          return (
                            <button
                              key={page}
                              onClick={() => setReviewsPage(page)}
                              className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm ${
                                reviewsPage === page
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      
                      <button
                        onClick={() => setReviewsPage(Math.min(reviewsPagination.pages, reviewsPage + 1))}
                        disabled={reviewsPage === reviewsPagination.pages}
                        className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm ${
                          reviewsPage === reviewsPagination.pages 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDetails;