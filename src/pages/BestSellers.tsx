import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Award, TrendingUp, Loader2, ChevronDown } from 'lucide-react';
import { API_URL } from '../config';
import { useTranslation } from 'react-i18next';

// Define interfaces for the product data
interface Product {
  _id: string;
  title: string;
  price: number;
  images: string[];
  createdAt: string;
  oemNumber: string;
  viewCount?: number;
  rating?: number;
  soldCount?: number;
  category?: {
    _id: string;
    name: string;
  };
  seller?: {
    firstName: string;
    lastName: string;
  };
}

interface ApiResponse {
  success: boolean;
  count: number;
  data: Product[];
}

const BestSellers = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('viewCount'); // Default sort by views
  const [limit, setLimit] = useState<number>(8); // Default limit
  const [isLimitDropdownOpen, setIsLimitDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_URL}/api/products/best-sellers?limit=${limit}&sortBy=${sortBy}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch best sellers: ${response.status}`);
        }
        
        const data: ApiResponse = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setProducts(data.data);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Error fetching best sellers:', err);
        setError('Failed to load best selling products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, [sortBy, limit]);

  // Format image URL properly
  const formatImageUrl = (imageUrl: string | undefined | null): string => {
    // If the URL is null, undefined, or empty, return a placeholder image
    if (!imageUrl || imageUrl.trim() === '') {
      return 'https://via.placeholder.com/400';
    }
    
    // Check if the URL already includes http:// or https://
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

  // Get appropriate metric to display based on sort criteria
  const getMetricDisplay = (product: Product) => {
    if (sortBy === 'rating' && product.rating) {
      return (
        <div className="flex items-center">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="ml-1 text-gray-600">{product.rating.toFixed(1)}</span>
        </div>
      );
    } else if (sortBy === 'soldCount' && product.soldCount) {
      return (
        <span className="text-gray-600 text-sm">{product.soldCount} {t('bestSellers.metrics.sold')}</span>
      );
    } else if (product.viewCount) {
      return (
        <span className="text-gray-600 text-sm">{product.viewCount} {t('bestSellers.metrics.views')}</span>
      );
    }
    
    // Fallback if no metric is available
    return null;
  };

  const changeSortCriteria = (criteria: string) => {
    if (criteria !== sortBy) {
      setSortBy(criteria);
    }
  };

  // Handle limit dropdown toggle
  const toggleLimitDropdown = () => {
    setIsLimitDropdownOpen(!isLimitDropdownOpen);
  };

  // Handle limit selection
  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setIsLimitDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if the click is outside the dropdown container
      const dropdownContainer = document.getElementById('limit-dropdown-container');
      if (isLimitDropdownOpen && dropdownContainer && !dropdownContainer.contains(target)) {
        setIsLimitDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLimitDropdownOpen]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div className="flex items-center">
          <Award className="w-8 h-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">{t('bestSellers.title')}</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Limit selector */}
          <div className="relative">
            <div className="flex items-center" id="limit-dropdown-container">
              <span className="text-gray-500 mr-2">{t('bestSellers.limit')}</span>
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLimitDropdown();
                  }}
                  className="flex items-center justify-between min-w-[100px] px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span>{limit} {t('bestSellers.items')}</span>
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>
                
                {isLimitDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-sm ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60 overflow-y-auto">
                    {[4, 8, 12, 16, 24, 32, 40, 48, 56, 64, 72, 80].map((value) => (
                      <div
                        key={value}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLimitChange(value);
                          console.log(`Selected limit: ${value}`);
                        }}
                        className={`cursor-pointer px-4 py-2 hover:bg-gray-100 ${
                          limit === value ? 'bg-blue-50 text-blue-600' : ''
                        }`}
                      >
                        {value} {t('bestSellers.items')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Sort criteria */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-gray-500" />
              <span className="text-gray-500 mr-2">{t('bestSellers.filterBy')}</span>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => changeSortCriteria('viewCount')}
                className={`px-3 py-1 text-sm rounded-full ${
                  sortBy === 'viewCount' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t('bestSellers.filters.views')}
              </button>
              <button 
                onClick={() => changeSortCriteria('rating')}
                className={`px-3 py-1 text-sm rounded-full ${
                  sortBy === 'rating' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t('bestSellers.filters.rating')}
              </button>
              <button 
                onClick={() => changeSortCriteria('soldCount')}
                className={`px-3 py-1 text-sm rounded-full ${
                  sortBy === 'soldCount' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t('bestSellers.filters.sales')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {t('bestSellers.noProducts')}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <Link
                key={product._id}
                to={`/products/${product._id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative">
                  <img
                    src={formatImageUrl(product.images[0])}
                    alt={product.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400';
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-sm">
                    #{index + 1}
                  </div>
                  {product.category && (
                    <div className="absolute top-2 left-2 bg-gray-800 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {product.category.name}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{product.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-blue-600">€{product.price.toFixed(2)}</span>
                    {getMetricDisplay(product)}
                  </div>
                  <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                    {product.seller && (
                      <span className="text-xs text-gray-400">
                        {t('newArrivals.by')} {product.seller.firstName} {product.seller.lastName}
                      </span>
                    )}
                    {index < 3 && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                        {index === 0 ? 'Top Pick' : index === 1 ? 'Popular' : 'Trending'}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center text-gray-500 text-sm">
            {t('categories.showing')} {products.length} {t('bestSellers.items')}
          </div>
        </>
      )}
    </div>
  );
};

export default BestSellers;