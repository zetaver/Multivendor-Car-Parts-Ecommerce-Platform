import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Star, Loader2 } from 'lucide-react';
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

const NewArrivals = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_URL}/api/products/new-arrivals?limit=8`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch new arrivals: ${response.status}`);
        }
        
        const data: ApiResponse = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setProducts(data.data);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Error fetching new arrivals:', err);
        setError('Failed to load new arrivals. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNewArrivals();
  }, []);

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

  // Format date to show how long ago a product was added
  const formatDate = (dateString: string) => {
    const now = new Date();
    const productDate = new Date(dateString);
    
    // Calculate difference in milliseconds
    const diffMs = now.getTime() - productDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return t('newArrivals.timeLabels.today');
    } else if (diffDays === 1) {
      return t('newArrivals.timeLabels.yesterday');
    } else if (diffDays < 7) {
      return t('newArrivals.timeLabels.daysAgo', { days: diffDays });
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 
        ? t('newArrivals.timeLabels.weekAgo') 
        : t('newArrivals.timeLabels.weeksAgo', { weeks });
    } else {
      return new Date(dateString).toLocaleDateString();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('newArrivals.title')}</h1>
        <div className="flex items-center text-gray-500">
          <Clock className="w-5 h-5 mr-2" />
          <span>{t('newArrivals.updatedDaily')}</span>
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
          {t('newArrivals.noArrivals')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              key={product._id}
              to={`/products/${product._id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={formatImageUrl(product.images[0])}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400';
                  }}
                />
                {product.category && (
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    {product.category.name}
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{product.title}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-blue-600">€{product.price.toFixed(2)}</span>
                  {product.viewCount && (
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="ml-1 text-gray-600">{product.viewCount} views</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 text-sm text-gray-500 flex justify-between items-center">
                  <span>{t('newArrivals.timeLabels.added')} {formatDate(product.createdAt)}</span>
                  {product.seller && (
                    <span className="text-xs text-gray-400">
                      {t('newArrivals.by')} {product.seller.firstName} {product.seller.lastName}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewArrivals;