import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Edit3, CreditCard, X, CheckCircle, AlertTriangle, ChevronLeft, MapPin, Search, Loader, Home } from 'lucide-react';
import { API_URL } from '../config';
import { loadStripe } from '@stripe/stripe-js';
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { createPaymentIntent } from '../services/paymentService';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { getAllPickupLocations, PickupLocation, getUPSAccessToken } from '../services/locationService';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe('pk_test_51QNEQqCB9m7BI3uyCTXMJwGiBcJhnN1j8rXxNZEfVmVsqHMyRZ2YqWwBXErPBXexEhG2nrYCcNGJ7Aqbdbhygj9h00CcLESv3P');

interface LocationState {
  product: {
    _id: string;
    title: string;
    price: number;
    images: string[];
    seller?: {
      _id: string;
      name: string;
    };
  };
  quantity: number;
  subtotal: number;
  buyNow: boolean;
  isOffer?: boolean;
  offerData?: {
    offerId: string;
    offerAmount: number;
    originalPrice: number;
    conversationId: string;
  };
}

interface Address {
  _id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface UserContact {
  firstName: string;
  lastName: string;
  phone: string;
  countryCode: string;
  email: string;
}

type ShippingMethod = 'pickup' | 'home';

// Payment dialog component
interface PaymentDialogProps {
  isOpen: boolean;
  isSuccess: boolean;
  message: string;
  orderId?: string;
  onClose: () => void;
  onViewOrder?: () => void;
  onTryAgain?: () => void;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  isOpen,
  isSuccess,
  message,
  orderId,
  onClose,
  onViewOrder,
  onTryAgain
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center mb-6">
          {isSuccess ? (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          )}
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {isSuccess ? t('checkout.paymentSuccess') : t('checkout.paymentFailed')}
          </h3>
          
          <p className="text-gray-600 mb-2">{message}</p>
          
          {isSuccess && orderId && (
            <p className="text-sm text-gray-500 mb-4">{t('checkout.orderId')}: {orderId}</p>
          )}
        </div>
        
        <div className="flex flex-col gap-3">
          {isSuccess ? (
            <>
              <button
                onClick={onViewOrder}
                className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                {t('checkout.viewOrder')}
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {t('checkout.continueShopping')}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onTryAgain}
                className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                {t('checkout.tryAgain')}
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Add a new PaymentForm component that uses Stripe
const PaymentForm = ({ amount, disabled, onPaymentSuccess, onPaymentError }: {
  amount: number;
  disabled: boolean;
  onPaymentSuccess: (paymentIntent: any) => void;
  onPaymentError: (error: string) => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { ensureToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    const fetchPaymentIntent = async () => {
      try {
        const token = ensureToken();
        if (!token) {
          throw new Error(t('checkout.errors.authRequired'));
        }
        
        const { success, clientSecret } = await createPaymentIntent(amount, 'eur', token);
        if (success) {
          setClientSecret(clientSecret);
        } else {
          throw new Error(t('checkout.errors.paymentIntentFailed'));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('common.errorOccurred'));
        onPaymentError(err instanceof Error ? err.message : t('common.errorOccurred'));
      }
    };

    if (amount > 0) {
      fetchPaymentIntent();
    }
  }, [amount, onPaymentError, ensureToken, t]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    setProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error(t('checkout.errors.cardElementNotFound'));
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        throw new Error(error.message || t('checkout.errors.paymentFailed'));
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onPaymentSuccess(paymentIntent);
      } else {
        throw new Error(t('checkout.errors.paymentProcessingFailed'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.errorOccurred'));
      onPaymentError(err instanceof Error ? err.message : t('common.errorOccurred'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('checkout.cardDetails')}
        </label>
        <div className="border border-gray-300 rounded-md p-3">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <button
        type="submit"
        disabled={processing || disabled || !stripe || !clientSecret}
        className={`w-full py-3 rounded-lg text-white font-medium mt-4 flex items-center justify-center ${
          processing || disabled || !stripe || !clientSecret
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-emerald-600 hover:bg-emerald-700'
        }`}
      >
        {processing ? (
          <>
            <span className="mr-2">{t('checkout.processing')}</span>
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-2" />
            {t('checkout.payAmount', { amount: amount.toFixed(2) })}
          </>
        )}
      </button>
    </form>
  );
};

// Update the PickupPointSelector props and component
interface PickupPointSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPoint: (point: PickupLocation) => void;
  selectedAddress: Address | null;
}

const PickupPointSelector: React.FC<PickupPointSelectorProps> = ({
  isOpen,
  onClose,
  onSelectPoint,
  selectedAddress
}) => {
  const { t } = useTranslation();
  const { ensureToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPoint, setSelectedPoint] = useState<PickupLocation | null>(null);
  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<string | null>(null);

  // Set initial search query based on the user's address
  useEffect(() => {
    if (selectedAddress) {
      const formattedAddress = `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.postalCode}`;
      setSearchQuery(formattedAddress);
      
      // Trigger initial search with the user's address
      if (isOpen) {
        fetchLocations();
      }
    }
  }, [selectedAddress, isOpen]);

  // Handle getting UPS token
  const handleGetUPSToken = async () => {
    try {
      setTokenLoading(true);
      setTokenStatus(null);
      
      // Add token to ensure authentication
      const token = ensureToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const upsToken = await getUPSAccessToken(true);
      const tokenPrefix = upsToken.substring(0, 10);
      console.log('Token obtained:', tokenPrefix + '...');
      setTokenStatus('Token successfully obtained and saved to localStorage!');
    } catch (err) {
      console.error('Error getting UPS token:', err);
      setTokenStatus(`Error: ${err instanceof Error ? err.message : 'Failed to get token'}`);
    } finally {
      setTokenLoading(false);
    }
  };

  // Parse address into components
  const parseAddress = useCallback((addressString: string) => {
    // Simple parsing logic - better to use a more robust address parser in production
    const parts = addressString.split(',').map(part => part.trim());
    
    // Extract state and postal code from the last part (if available)
    let state = selectedAddress?.state || '';
    let postalCode = selectedAddress?.postalCode || '';
    
    if (parts.length > 2) {
      const lastPart = parts[2].split(' ');
      if (lastPart.length > 0) state = lastPart[0] || state;
      if (lastPart.length > 1) postalCode = lastPart[1] || postalCode;
    }
    
    return {
      address: parts[0] || '',
      city: parts[1] || selectedAddress?.city || '',
      state: state,
      postalCode: postalCode,
      countryCode: selectedAddress?.country || 'US' // Default to US for UPS API
    };
  }, [selectedAddress]);

  // Fetch pickup locations
  const fetchLocations = useCallback(async () => {
    if (!searchQuery) return;
    
    setLoading(true);
    setError(null);
    try {
      // Ensure authentication for API calls
      const token = ensureToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const addressParts = parseAddress(searchQuery);
      console.log('Searching with address parts:', addressParts);
      
      // Validate essential address parts before searching
      if (!addressParts.address || !addressParts.city || !addressParts.postalCode) {
        throw new Error('Please provide a complete address with street, city, and postal code');
      }
      
      const locations = await getAllPickupLocations({
        ...addressParts,
        maxResults: 10,
        searchRadius: 75
      });
      
      setLocations(locations);
      // If we have locations and none is selected, select the first one
      if (locations.length > 0 && !selectedPoint) {
        setSelectedPoint(locations[0]);
      } else if (locations.length === 0) {
        // No error, but we didn't find any locations
        setError('No pickup locations found near this address. Try a different address or zip code.');
      }
    } catch (err) {
      console.error('Error fetching pickup locations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pickup locations');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, parseAddress, selectedPoint, ensureToken]);

  // Fetch locations on component mount and when search query changes
  useEffect(() => {
    if (isOpen && searchQuery) {
      fetchLocations();
    }
  }, [isOpen, fetchLocations, searchQuery]);

  // Handle selecting a pickup point
  const handleSelectPoint = (point: PickupLocation) => {
    setSelectedPoint(point);
  };

  // Handle confirming the selection
  const handleConfirmSelection = () => {
    if (selectedPoint) {
      onSelectPoint(selectedPoint);
      onClose();
    }
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) {
      fetchLocations();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white max-w-md w-full h-[90vh] flex flex-col rounded-lg overflow-hidden">
        {/* Header */}
        <div className="border-b px-4 py-3 flex items-center">
          <button onClick={onClose} className="mr-3">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium flex-1 text-center pr-8">
            {t('checkout.choosePickupPoint')}
          </h1>
        </div>

        {/* UPS API Token Test Button */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">API Configuration</h3>
              <button
                onClick={handleGetUPSToken}
                disabled={tokenLoading}
                className={`py-1.5 px-3 rounded-md text-sm flex items-center ${
                  tokenLoading ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {tokenLoading ? (
                  <>
                    <Loader className="w-3 h-3 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg className="h-3 w-3 mr-1.5" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M228,56H28A12,12,0,0,0,16,68V188a12,12,0,0,0,12,12H228a12,12,0,0,0,12-12V68A12,12,0,0,0,228,56ZM28,72H228V96H28ZM28,176V112H228v64Z"></path>
                      <circle cx="44" cy="84" r="8"></circle>
                      <circle cx="68" cy="84" r="8"></circle>
                      <circle cx="92" cy="84" r="8"></circle>
                    </svg>
                    Refresh UPS Token
                  </>
                )}
              </button>
            </div>
            {tokenStatus && (
              <div className={`text-xs p-2 rounded ${
                tokenStatus.startsWith('Error') 
                  ? 'bg-red-50 text-red-700 border border-red-100' 
                  : 'bg-green-50 text-green-700 border border-green-100'
              }`}>
                {tokenStatus}
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-3 pl-12 pr-4 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition duration-150"
                placeholder="Enter full address (e.g., 123 Fork rd, Atlanta, PE 30005)"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={searchQuery.split(',')[1]?.trim() || ''}
                  onChange={(e) => {
                    const parts = searchQuery.split(',');
                    parts[1] = e.target.value;
                    setSearchQuery(parts.join(','));
                  }}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={searchQuery.split(',')[2]?.trim() || ''}
                  onChange={(e) => {
                    const parts = searchQuery.split(',');
                    parts[2] = e.target.value;
                    setSearchQuery(parts.join(','));
                  }}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                  placeholder="State"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ZIP Code</label>
                <input
                  type="text"
                  value={searchQuery.split(',')[3]?.trim() || ''}
                  onChange={(e) => {
                    const parts = searchQuery.split(',');
                    parts[3] = e.target.value;
                    setSearchQuery(parts.join(','));
                  }}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                  placeholder="ZIP Code"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-md text-sm font-medium transition duration-150 flex items-center justify-center"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search Locations
                </button>
              </div>
            </div>

            <div className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-md p-3">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-2">
                  <p className="text-blue-700">For best results:</p>
                  <ul className="list-disc list-inside text-blue-600 mt-1">
                    <li>Enter street number and name</li>
                    <li>Include city, state, and ZIP code</li>
                    <li>Use correct format: Street, City, State ZIP</li>
                  </ul>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center">
                <Loader className="h-8 w-8 text-emerald-600 animate-spin mb-2" />
                <p className="text-gray-600">{t('checkout.loadingPickupPoints')}</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center p-4 text-center">
                <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
                <p className="text-gray-800 font-medium mb-1">{t('checkout.errorLoadingPickupPoints')}</p>
                <p className="text-gray-600 mb-4">{error}</p>
                <button 
                  onClick={fetchLocations}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  {t('checkout.tryAgainLoading')}
                </button>
              </div>
            </div>
          ) : locations.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-4">
                <p className="text-gray-800 font-medium mb-1">{t('checkout.noPickupPointsFound')}</p>
                <p className="text-gray-600 mb-2">{t('checkout.tryDifferentAddress')}</p>
                <p className="text-gray-600 text-sm">
                  Try using a complete address including street number, city, state and zip code.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {locations.map((point) => (
                <div 
                  key={point.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${
                    selectedPoint?.id === point.id ? 'bg-emerald-50 border-l-4 border-emerald-500' : 'border-l-4 border-transparent'
                  }`}
                  onClick={() => handleSelectPoint(point)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm ${
                      point.provider === 'Relais Colis' ? 'bg-green-500' : 
                      point.provider === 'UPS' ? 'bg-[#331F0A]' : 'bg-blue-500'
                    }`}>
                      {point.provider === 'Relais Colis' ? 'RC' : 
                       point.provider === 'UPS' ? 'UPS' : 'CP'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 flex items-center">
                        {point.provider}
                        {selectedPoint?.id === point.id && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                            Selected
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-800 font-medium">{point.name}</p>
                      <p className="text-sm text-gray-600">{point.address}</p>
                      <p className="text-sm text-gray-600">{point.postalCode}, {point.city}</p>
                      <div className="flex items-center mt-1">
                        <div className="h-2 w-2 bg-emerald-500 rounded-full mr-2"></div>
                        <p className="text-xs text-gray-500">
                          {t('checkout.atPickupPointIn', { days: point.deliveryDays })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end justify-between h-full">
                      <div className="text-right">
                        <p className="font-medium text-emerald-600">€{point.price.toFixed(2)}</p>
                        {point.distance && (
                          <p className="text-xs text-gray-500">{point.distance}</p>
                        )}
                      </div>
                      {selectedPoint?.id === point.id && (
                        <Check className="w-5 h-5 text-emerald-600 mt-2" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Button */}
        <div className="border-t p-4">
          <button
            onClick={handleConfirmSelection}
            disabled={!selectedPoint || loading}
            className={`w-full py-3 rounded-lg font-medium text-white ${
              selectedPoint && !loading ? 'bg-emerald-600' : 'bg-gray-300'
            }`}
          >
            {t('checkout.chooseThisPickupPoint')}
          </button>
        </div>
      </div>
    </div>
  );
};

// The main checkout content without the Stripe wrapper
const CheckoutContent = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, ensureToken } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [userContact, setUserContact] = useState<UserContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('pickup');
  
  // Dialog states
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [orderId, setOrderId] = useState('');
  
  // Add new state variables for pickup point selection
  const [showPickupSelector, setShowPickupSelector] = useState(false);
  const [selectedPickupPoint, setSelectedPickupPoint] = useState<PickupLocation | null>(null);
  
  const state = location.state as LocationState;
  
  // Calculate prices
  const subtotal = state?.subtotal || 0;
  const buyerProtectionFee = Math.round(subtotal * 0.05 * 100) / 100; // 5% fee
  
  // Set shipping cost based on selected method
  const pickupShippingCost = 2.69;
  const homeShippingCost = 4.38;
  const shippingCost = shippingMethod === 'pickup' ? pickupShippingCost : homeShippingCost;
  
  const total = (subtotal + buyerProtectionFee + shippingCost).toFixed(2);
  
  // Determine if this is an offer checkout
  const isOfferCheckout = state?.isOffer && state?.offerData;
  
  useEffect(() => {
    // Redirect if no product data was passed
    if (!state || !state.product) {
      navigate('/');
      return;
    }
    
    // Fetch user addresses and contact details
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const token = ensureToken();
        
        if (!token) {
          // Redirect to login if not authenticated
          console.log('No authentication token available, redirecting to login');
          navigate('/login', { state: { from: '/checkout' } });
          return;
        }
        
        // Fetch user addresses
        const addressResponse = await fetch(`${API_URL}/api/addresses`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!addressResponse.ok) {
          throw new Error(t('checkout.errors.fetchAddressesFailed'));
        }
        
        const addressData = await addressResponse.json();
        
        if (addressData.success && Array.isArray(addressData.data)) {
          setAddresses(addressData.data);
          
          // Set default address as selected
          const defaultAddress = addressData.data.find((addr: Address) => addr.isDefault);
          if (defaultAddress) {
            setSelectedAddress(defaultAddress);
          } else if (addressData.data.length > 0) {
            setSelectedAddress(addressData.data[0]);
          }
        }
        
        // Fetch user contact details
        const contactResponse = await fetch(`${API_URL}/api/users/profile/details`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!contactResponse.ok) {
          throw new Error(t('checkout.errors.fetchContactFailed'));
        }
        
        const contactData = await contactResponse.json();
        
        if (contactData.success && contactData.data) {
          setUserContact({
            firstName: contactData.data.firstName || '',
            lastName: contactData.data.lastName || '',
            phone: contactData.data.phone || '',
            countryCode: contactData.data.countryCode || '',
            email: contactData.data.email || ''
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('common.errorOccurred'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [navigate, state, ensureToken, t]);
  
  const handleShippingMethodChange = (method: ShippingMethod) => {
    setShippingMethod(method);
    if (method === 'pickup') {
      // Open the pickup point selector dialog when pickup is selected
      setShowPickupSelector(true);
    }
  };
  
  const formatImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${API_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  };
  
  // Format phone number with country code
  const formatPhoneNumber = (countryCode?: string, phone?: string) => {
    if (!phone) return t('checkout.noPhoneProvided');
    const formattedCode = countryCode || '';
    return `${formattedCode}${phone}`;
  };
  
  // Function to update user contact info
  const handleEditContact = () => {
    // If we have user contact data, navigate to profile with form pre-filled
    if (userContact) {
      navigate('/profile', { 
        state: { 
          activeTab: 'profile',
          contactInfo: userContact
        } 
      });
    } else {
      // Otherwise just navigate to profile page
      navigate('/profile', { state: { activeTab: 'profile' } });
    }
  };
  
  // Function to create a new order in the database
  const createOrder = async (paymentIntentId: string) => {
    try {
      console.log('Creating order with payment intent ID:', paymentIntentId);
      
      const token = ensureToken();
      
      if (!token) {
        throw new Error(t('checkout.errors.authRequired'));
      }
      
      if (!selectedAddress) {
        throw new Error(t('checkout.errors.addressRequired'));
      }

      if (!state || !state.product || !state.product._id) {
        throw new Error(t('checkout.errors.noProductData'));
      }
      
      // Validate that pickup point is selected when shipping method is pickup
      if (shippingMethod === 'pickup' && !selectedPickupPoint) {
        throw new Error(t('checkout.pleaseSelectPickupPoint'));
      }
      
      // Construct the order data with additional offer information if applicable
      const orderData = {
        items: [
          {
            productId: state.product._id,
            quantity: state.quantity || 1
          }
        ],
        addressId: selectedAddress._id,
        paymentMethod: 'credit_card',
        paymentIntentId: paymentIntentId,
        shippingMethod: shippingMethod,
        totalAmount: parseFloat(total),
        // Include pickup point information if the shipping method is pickup
        ...(shippingMethod === 'pickup' && selectedPickupPoint && {
          pickupPoint: selectedPickupPoint
        }),
        // Include offer data if present
        ...(isOfferCheckout && {
          isOffer: true,
          offerId: state.offerData?.offerId,
          offerAmount: state.offerData?.offerAmount,
          conversationId: state.offerData?.conversationId
        })
      };
      
      console.log('Submitting order data:', JSON.stringify(orderData));
      
      const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });
      
      const responseData = await response.json();
      console.log('Order API response:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.message || t('checkout.errors.createOrderFailed'));
      }
      
      // If this was an offer purchase, update the conversation with a confirmation message
      if (isOfferCheckout && state.offerData?.conversationId) {
        try {
          const confirmationMessage = `🎉 ${t('checkout.offerConfirmationMessage', { 
            title: state.product.title, 
            amount: state.offerData.offerAmount.toFixed(2),
            orderId: responseData.orderId || responseData.data?._id 
          })}`;
          
          await fetch(`${API_URL}/api/messages/${state.offerData.conversationId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content: confirmationMessage })
          });
        } catch (msgError) {
          console.error('Error sending confirmation message:', msgError);
          // Don't throw here, just log the error as this shouldn't block order completion
        }
      }
      
      // Return the created order ID
      return responseData.orderId || responseData.data?._id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };
  
  const handlePaymentSuccess = async (paymentIntent: any) => {
    try {
      console.log('Payment successful:', paymentIntent);
      
      if (!paymentIntent || !paymentIntent.id) {
        throw new Error(t('checkout.errors.invalidPaymentInfo'));
      }
      
      // Create order in database
      const newOrderId = await createOrder(paymentIntent.id);
      
      if (!newOrderId) {
        throw new Error(t('checkout.errors.noOrderIdReturned'));
      }
      
      console.log('Order created successfully with ID:', newOrderId);
      
      // Set success dialog data
      setPaymentSuccess(true);
      setPaymentMessage(t('checkout.messages.paymentSuccessful'));
      setOrderId(newOrderId);
      setShowPaymentDialog(true);
      
    } catch (error) {
      // If order creation fails after payment
      console.error('Error after payment:', error);
      setPaymentSuccess(true); // Still show success since payment worked
      setPaymentMessage(t('checkout.messages.paymentSuccessOrderFailed'));
      setOrderId(paymentIntent.id || 'ORD-' + Math.floor(Math.random() * 1000000));
      setShowPaymentDialog(true);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    // Set error dialog data
    setPaymentSuccess(false);
    setPaymentMessage(errorMessage || t('checkout.errors.paymentProcessingProblem'));
    setShowPaymentDialog(true);
    setError(errorMessage);
  };
  
  const handleViewOrder = () => {
    // Navigate to order details page
    navigate('/profile?tab=orders', { 
      state: { 
        message: t('checkout.messages.orderPlacedSuccess'),
        orderId: orderId
      } 
    });
  };
  
  const handleTryAgain = () => {
    // Close dialog and reset error to try payment again
    setShowPaymentDialog(false);
    setError(null);
  };
  
  const handleCloseDialog = () => {
    setShowPaymentDialog(false);
    // If payment was successful, navigate to home page
    if (paymentSuccess) {
      navigate('/');
    }
  };
  
  // Update the handleSelectPickupPoint function to use the PickupLocation type
  const handleSelectPickupPoint = (point: PickupLocation) => {
    setSelectedPickupPoint(point);
    // If the point has a custom price, update the shipping cost
    if (point && point.price) {
      // You might need to update other state variables related to shipping cost here
    }
  };
  
  // Replace the static pickup information with the selected pickup details
  const renderDeliveryOption = () => {
    if (shippingMethod === 'pickup') {
      if (selectedPickupPoint) {
        return (
          <div className="border rounded-lg p-4 mb-4 transition-all duration-200 hover:border-emerald-300 hover:shadow-sm mt-3">
            <div className="flex items-start">
              <div className="bg-emerald-100 text-emerald-500 p-2 rounded-full mr-3 flex-shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{selectedPickupPoint.name}</h3>
                <p className="text-sm text-gray-600">{selectedPickupPoint.address}</p>
                <p className="text-sm text-gray-600">{selectedPickupPoint.city}, {selectedPickupPoint.postalCode}</p>
                <div className="flex items-center mt-1">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full mr-2"></div>
                  <p className="text-xs text-gray-500">{t('checkout.atPickupPointIn', { days: selectedPickupPoint.deliveryDays || '5-7' })}</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowPickupSelector(true)}
              className="mt-3 w-full py-2 px-3 border border-emerald-200 text-emerald-600 rounded-md text-sm font-medium transition-colors duration-150 hover:bg-emerald-50 flex items-center justify-center"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {t('checkout.changePickupPoint')}
            </button>
          </div>
        );
      } else {
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 text-center  mt-3">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                <MapPin className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="font-medium text-gray-800 mb-1">{t('checkout.noPickupPointSelected')}</h3>
              <p className="text-sm text-gray-500 mb-4">{t('checkout.pleaseSelectPickupPoint')}</p>
              <button 
                onClick={() => setShowPickupSelector(true)} 
                className="py-2.5 px-4 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-700 transition-colors duration-150 flex items-center"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {t('checkout.choosePickupPoint')}
              </button>
            </div>
          </div>
        );
      }
    } else if (shippingMethod === 'home') {
      return (
        <div className="border rounded-lg p-4 mb-4 mt-3">
          <div className="flex items-start">
            <div className="bg-blue-100 text-blue-500 p-2 rounded-full mr-3">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">{t('checkout.homeDelivery')}</h3>
              {selectedAddress ? (
                <>
                  <p className="text-sm text-gray-600">{selectedAddress.street}</p>
                  <p className="text-sm text-gray-600">{selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('checkout.estimatedDelivery', { days: '3-5' })}</p>
                </>
              ) : (
                <p className="text-sm text-red-500">{t('checkout.pleaseAddAddress')}</p>
              )}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }
  
  if (!state || !state.product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('checkout.noProductSelected')}</h2>
          <p className="text-gray-600 mb-4">{t('checkout.pleaseSelectProduct')}</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
          >
            {t('checkout.returnToHome')}
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6 md:mt-10">
          {isOfferCheckout ? t('checkout.completeOfferPurchase') : t('checkout.title')}
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Item */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isOfferCheckout ? t('checkout.acceptedOffer') : t('checkout.order')}
                </h3>
              </div>
              
              <div className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                    <img
                      src={formatImageUrl(state.product.images[0])}
                      alt={state.product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-medium text-gray-900">{state.product.title}</h4>
                    <p className="text-sm text-gray-500">{t('checkout.newWithTags')} • {state.product.seller?.name || t('common.seller')}</p>
                  </div>
                  <div className="text-right">
                    {isOfferCheckout ? (
                      <div>
                        <p className="text-xs text-gray-500 line-through">€{state.offerData?.originalPrice.toFixed(2)}</p>
                        <p className="font-semibold text-emerald-600">€{state.offerData?.offerAmount.toFixed(2)}</p>
                      </div>
                    ) : (
                      <p className="font-semibold">€{state.product.price.toFixed(2)}</p>
                    )}
                  </div>
                </div>
                
                {isOfferCheckout && (
                  <div className="mt-4 bg-green-50 p-3 rounded-md border border-green-100">
                    <p className="text-sm text-green-800">
                      <span className="font-medium">{t('checkout.offerAccepted')}</span> {t('checkout.offerSavings', { 
                        offerAmount: (state.offerData?.offerAmount || 0).toFixed(2),
                        originalPrice: (state.offerData?.originalPrice || 0).toFixed(2)
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Address Section */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">{t('checkout.address')}</h3>
                <button 
                  onClick={() => navigate('/profile', { state: { activeTab: 'addresses' } })}
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
              
              <div className="px-6 py-4">
                {addresses.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-2">{t('checkout.noSavedAddresses')}</p>
                    <button 
                      onClick={() => navigate('/profile', { state: { activeTab: 'addresses' } })}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                    >
                      {t('checkout.addNewAddress')}
                    </button>
                  </div>
                ) : (
                  selectedAddress && (
                    <div>
                      <p className="font-medium">{selectedAddress.street}</p>
                      <p className="text-gray-600">
                        {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}
                      </p>
                      <p className="text-gray-600">{selectedAddress.country}</p>
                    </div>
                  )
                )}
              </div>
            </div>
            
            {/* Delivery Option */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">{t('checkout.deliveryOption')}</h3>
              </div>
              
              <div className="px-6 py-4">
                <div className="space-y-2">
                  <label className={`flex items-center p-4 border rounded-lg cursor-pointer ${shippingMethod === 'pickup' ? 'bg-gray-50 border-emerald-500' : ''}`}>
                    <input 
                      type="radio" 
                      name="delivery" 
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                      checked={shippingMethod === 'pickup'}
                      onChange={() => handleShippingMethodChange('pickup')}
                    />
                    <div className="ml-3 flex justify-between w-full">
                      <div>
                        <p className="font-medium">{t('checkout.shipToPickup')}</p>
                        <p className="text-sm text-gray-500">{t('checkout.fromPrice', { price: pickupShippingCost.toFixed(2) })}</p>
                      </div>
                      {shippingMethod === 'pickup' && (
                        <div className="flex items-center">
                          <Check className="h-5 w-5 text-emerald-600" />
                        </div>
                      )}
                    </div>
                  </label>
                  
                  <label className={`flex items-center p-4 border rounded-lg cursor-pointer ${shippingMethod === 'home' ? 'bg-gray-50 border-emerald-500' : ''}`}>
                    <input 
                      type="radio" 
                      name="delivery" 
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                      checked={shippingMethod === 'home'}
                      onChange={() => handleShippingMethodChange('home')}
                    />
                    <div className="ml-3 flex justify-between w-full">
                      <div>
                        <p className="font-medium">{t('checkout.shipToHome')}</p>
                        <p className="text-sm text-gray-500">{t('checkout.fromPrice', { price: homeShippingCost.toFixed(2) })}</p>
                      </div>
                      {shippingMethod === 'home' && (
                        <div className="flex items-center">
                          <Check className="h-5 w-5 text-emerald-600" />
                        </div>
                      )}
                    </div>
                  </label>
                </div>
                
                {/* Render dynamic delivery option details */}
                {renderDeliveryOption()}
              </div>
            </div>
            
            {/* Contact Details */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">{t('checkout.yourContactDetails')}</h3>
                <button 
                  onClick={handleEditContact}
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
              </div>
              
              <div className="px-6 py-4">
                {userContact ? (
                  <div>
                    <p className="font-medium">{userContact.firstName} {userContact.lastName}</p>
                    <p className="text-gray-600">{formatPhoneNumber(userContact.countryCode, userContact.phone)}</p>
                    <p className="text-gray-600">{userContact.email}</p>
                    <p className="mt-2 text-xs text-blue-600 cursor-pointer hover:underline" onClick={handleEditContact}>
                      {t('checkout.editContactInfo')}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-gray-600 mb-2">{t('checkout.noContactInfo')}</p>
                    <button 
                      onClick={handleEditContact}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                    >
                      {t('checkout.addContactInfo')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1 mb-14">
            <div className="bg-white rounded-lg shadow overflow-hidden sticky top-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">{t('checkout.orderSummary')}</h3>
              </div>
              
              <div className="px-6 py-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('checkout.order')}</span>
                  <span className="font-medium">€{subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('checkout.buyerProtectionFee')} <span className="text-blue-600">ⓘ</span></span>
                  <span className="font-medium">€{buyerProtectionFee.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('checkout.postage')}</span>
                  <span className="font-medium">€{shippingCost.toFixed(2)}</span>
                </div>
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between font-medium">
                    <span>{t('checkout.totalToPay')}</span>
                    <span className="text-lg">€{total}</span>
                  </div>
                </div>
                
                <PaymentForm 
                  amount={parseFloat(total)} 
                  disabled={!selectedAddress} 
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                />
                
                <div className="text-center text-sm text-gray-500 mt-2 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {t('checkout.securePayment')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment Dialog */}
      <PaymentDialog
        isOpen={showPaymentDialog}
        isSuccess={paymentSuccess}
        message={paymentMessage}
        orderId={orderId}
        onClose={handleCloseDialog}
        onViewOrder={handleViewOrder}
        onTryAgain={handleTryAgain}
      />
      
      {/* Add Pickup Point Selector Modal */}
      <PickupPointSelector
        isOpen={showPickupSelector}
        onClose={() => setShowPickupSelector(false)}
        onSelectPoint={handleSelectPickupPoint}
        selectedAddress={selectedAddress}
      />
    </div>
  );
};

// Wrapper component for Stripe Elements
const Checkout: React.FC = () => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutContent />
    </Elements>
  );
};

export default Checkout; 