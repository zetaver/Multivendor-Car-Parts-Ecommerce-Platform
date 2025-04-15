import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { Eye, Heart, MessageCircle, DollarSign, ExternalLink, ShoppingBag } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ProductCardProps {
  product: {
    _id: string;
    title: string;
    price: number;
    images: string[];
    description?: string;
  };
  compact?: boolean;
  className?: string;
}

const ProductMessageCard: React.FC<ProductCardProps> = ({ 
  product, 
  compact = false,
  className = '' 
}) => {
  const navigate = useNavigate();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);

  // Check if product is in wishlist on component mount
  useEffect(() => {
    const checkWishlistStatus = async () => {
      try {
        // Skip wishlist check for unknown products or if product ID is missing
        if (!product?._id || product._id === 'unknown') {
          return;
        }
        
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        
        console.log(`Checking wishlist status for product: ${product._id}`);
        const response = await fetch(`${API_URL}/api/wishlist/check/${product._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Wishlist status response:', data);
          setIsInWishlist(data.isInWishlist);
        } else {
          console.error('Failed to check wishlist status:', await response.text());
        }
      } catch (error) {
        console.error('Error checking wishlist status:', error);
      }
    };
    
    checkWishlistStatus();
  }, [product?._id]);

  // Ensure we have a valid product object
  if (!product) {
    console.error('ProductMessageCard received null or undefined product');
    return (
      <div className={`flex flex-col md:flex-row gap-4 ${compact ? 'max-w-full' : 'max-w-2xl'} ${className}`}>
        <div className="bg-gray-100 p-4 rounded-lg text-gray-500 text-center w-full">
          Product information unavailable
        </div>
      </div>
    );
  }

  // Ensure product has the required fields
  const safeProduct = {
    _id: product._id || 'unknown',
    title: product.title || 'Unnamed Product',
    price: typeof product.price === 'number' ? product.price : 0,
    images: Array.isArray(product.images) ? product.images : [],
    description: product.description || ''
  };

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(safeProduct.price);

  const formatImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '/product-placeholder.jpg';

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

  const handleViewProduct = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('View Product clicked, product data:', {
      id: safeProduct._id,
      title: safeProduct.title
    });
    
    // For unknown products or products without an ID, show a toast and return
    if (safeProduct._id === 'unknown') {
      toast.error('Cannot view details for this product');
      return;
    }
    
    try {
      const productDetailUrl = `/product/${safeProduct._id}`;
      console.log('Navigating to:', productDetailUrl);
      
      // Use navigate with a state object to provide context
      navigate(productDetailUrl, { 
        state: { 
          fromProductCard: true,
          productId: safeProduct._id,
          productTitle: safeProduct.title
        }
      });
    } catch (error) {
      console.error('Navigation error:', error);
      toast.error('Failed to navigate to product details');
    }
  };

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // For unknown products or products without an ID, show a toast and return
    if (safeProduct._id === 'unknown') {
      toast.error('Cannot save this product to wishlist');
      return;
    }

    // Check if user is authenticated
    if (!localStorage.getItem('accessToken')) {
      navigate('/login', { state: { from: `/product/${safeProduct._id}` } });
      return;
    }

    try {
      setIsAddingToWishlist(true);

      // Try to use the toggle endpoint if available, otherwise fall back to separate add/remove endpoints
      let endpoint;
      let method;
      let body;

      try {
        // First try the toggle endpoint
        endpoint = `${API_URL}/api/wishlist/toggle/${safeProduct._id}`;
        method = 'POST';
        body = null;
      } catch (error) {
        // Fall back to separate endpoints if toggle fails
        endpoint = isInWishlist
          ? `${API_URL}/api/wishlist/remove/${safeProduct._id}`
          : `${API_URL}/api/wishlist/add`;
        method = isInWishlist ? 'DELETE' : 'POST';
        body = !isInWishlist ? JSON.stringify({ productId: safeProduct._id }) : undefined;
      }

      console.log(`${isInWishlist ? 'Removing from' : 'Adding to'} wishlist:`, safeProduct._id);
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        ...(body && { body })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Wishlist operation failed:', errorText);
        throw new Error(`Failed to ${isInWishlist ? 'remove from' : 'add to'} wishlist: ${errorText}`);
      }

      // Parse the response
      const result = await response.json();
      console.log('Wishlist operation result:', result);

      // Update local state - if we get an explicit status from API use it, otherwise toggle
      if (result && typeof result.isInWishlist === 'boolean') {
        setIsInWishlist(result.isInWishlist);
      } else {
        setIsInWishlist(!isInWishlist);
      }
      
      // Show success message
      toast.success(isInWishlist 
        ? 'Product removed from wishlist' 
        : 'Product added to wishlist'
      );

    } catch (error) {
      console.error('Error updating wishlist:', error);
      toast.error('Could not update wishlist. Please try again.');
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  return (
    <div className={`flex flex-col md:flex-row gap-4 ${compact ? 'max-w-full' : 'max-w-2xl'} ${className}`}>
      {/* Product Card */}
      <div 
        className={`product-message-card flex-shrink-0 overflow-hidden rounded-xl shadow-sm hover:shadow-md border border-gray-100 bg-white transition-all duration-300 transform hover:-translate-y-1 ${compact ? 'w-full md:w-[280px]' : 'w-full md:w-[320px]'}`}
      >
        <div className="relative overflow-hidden group">
          <img 
            src={safeProduct.images && safeProduct.images.length > 0 ? formatImageUrl(safeProduct.images[0]) : '/product-placeholder.jpg'} 
            alt={safeProduct.title || 'Product'}
            className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${compact ? 'h-32' : 'h-48'}`}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/product-placeholder.jpg';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-semibold px-2.5 py-1.5 rounded-full flex items-center shadow-sm">
            <DollarSign className="w-3 h-3 mr-1" />
            {formattedPrice}
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-gray-800 text-sm truncate mb-1">{safeProduct.title}</h3>
          
          {!compact && safeProduct.description && (
            <p className="text-gray-500 text-xs mt-1.5 line-clamp-2">{safeProduct.description}</p>
          )}
          
          <div className="mt-4 flex justify-between items-center">
            <button 
              onClick={handleViewProduct}
              role="link"
              title={safeProduct._id === 'unknown' ? 'Product details unavailable' : 'View product details'}
              className={`text-xs ${safeProduct._id === 'unknown' ? 'bg-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'} text-white px-4 py-2 rounded-full font-medium transition-all duration-300 flex items-center shadow-sm hover:shadow`}
              disabled={safeProduct._id === 'unknown'}
            >
              <ShoppingBag className="w-3 h-3 mr-1.5" />
              View Product
            </button>
            
            {safeProduct._id !== 'unknown' && (
              <button 
                className={`p-2 rounded-full transition-all duration-300 flex items-center justify-center ${isInWishlist 
                  ? 'bg-pink-50 text-pink-500 hover:bg-pink-100' 
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                onClick={toggleWishlist}
                disabled={isAddingToWishlist}
                title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart 
                  className={`w-4 h-4 ${isInWishlist 
                    ? 'text-pink-500 fill-pink-500' 
                    : 'text-gray-400 hover:text-gray-500'}`}
                />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Message Text */}
      <div className="flex flex-col justify-center flex-grow p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-100">
        <p className="text-sm text-gray-700 leading-relaxed">
          Hi Support, I'm interested in this product: {safeProduct.title} ({formattedPrice}), but I couldn't contact the seller directly.
        </p>
        <div className="mt-2 text-xs text-gray-500 flex items-center">
          <MessageCircle className="w-3 h-3 mr-1.5 text-blue-500" />
          Support will assist with your inquiry
        </div>
      </div>
    </div>
  );
};

export default ProductMessageCard; 