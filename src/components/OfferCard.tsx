import React from 'react';
import { DollarSign, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { API_URL } from '../config';

interface OfferCardProps {
  productId: string;
  productTitle: string;
  productImage: string;
  listingPrice: number;
  offerAmount: number;
  isOwnOffer: boolean;
  onAccept: () => void;
  onDecline: () => void;
  status?: string;
  isLoading?: boolean;
}

// Add formatImageUrl function to properly handle image URLs
const formatImageUrl = (imageUrl: string | undefined | null): string => {
  // If the URL is null, undefined, or empty, return a placeholder image
  if (!imageUrl || imageUrl.trim() === '') {
    return 'https://via.placeholder.com/64';
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

const OfferCard: React.FC<OfferCardProps> = ({
  productId,
  productTitle,
  productImage,
  listingPrice,
  offerAmount,
  isOwnOffer,
  onAccept,
  onDecline,
  status,
  isLoading = false
}) => {
  const discountPercent = Math.round(100 - (offerAmount / listingPrice * 100));
  
  const isActedUpon = status === 'accepted' || status === 'declined';

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-3 flex items-center space-x-3">
        <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden">
          {productImage ? (
            <img
              src={formatImageUrl(productImage)}
              alt={productTitle}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <AlertCircle className="text-gray-400 h-8 w-8" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">{productTitle}</h3>
          <div className="flex items-center mt-1">
            <span className="text-sm font-bold text-gray-900">{formatCurrency(offerAmount)}</span>
            <span className="text-xs text-gray-500 ml-2 line-through">{formatCurrency(listingPrice)}</span>
            <span className="text-xs text-green-600 ml-2">{discountPercent}% off</span>
          </div>
        </div>
      </div>
      
      {!isOwnOffer && !isActedUpon && (
        <div className="border-t border-gray-200 flex divide-x divide-gray-200">
          <button 
            onClick={onAccept}
            disabled={isLoading}
            className={`flex-1 py-2 text-sm font-medium 
              ${isLoading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-green-600 hover:bg-green-50'} 
              transition-colors`}
          >
            Accept
          </button>
          <button 
            onClick={onDecline}
            disabled={isLoading}
            className={`flex-1 py-2 text-sm font-medium 
              ${isLoading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-red-600 hover:bg-red-50'} 
              transition-colors`}
          >
            Decline
          </button>
        </div>
      )}

      {!isOwnOffer && isActedUpon && (
        <div className="border-t border-gray-200 p-2 text-center">
          <p className={`text-sm font-medium ${status === 'accepted' ? 'text-green-600' : 'text-red-600'}`}>
            {status === 'accepted' ? 'Offer accepted' : 'Offer declined'}
          </p>
        </div>
      )}
      
      {isOwnOffer && (
        <div className="border-t border-gray-200 p-2">
          <p className="text-xs text-gray-500 text-center">
            {isActedUpon
              ? status === 'accepted' 
                ? 'Your offer was accepted!' 
                : 'Your offer was declined.'
              : 'Waiting for seller response...'}
          </p>
        </div>
      )}
    </div>
  );
};

export default OfferCard;