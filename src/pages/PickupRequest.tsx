import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { API_URL } from '../config';
import { getPickupRates, getPickupStatus, getPickupStatusMessage } from '../services/locationService';
import { ArrowLeft, Truck, Package, Calendar, Clock, CheckCircle, AlertCircle, Loader, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PickupRate {
  ServiceType: string;
  CurrencyCode: string;
  MonetaryValue: string;
  ServiceName: string;
  ReadyTime: string;
  PickupTime: string;
  PickupDate?: string;
  RateType?: string;
  PickupDelay?: number;
  ChargeDetails?: string;
}

const PickupRequest: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRatesLoading, setIsRatesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickupRates, setPickupRates] = useState<PickupRate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('10:00-18:00');
  const [selectedRate, setSelectedRate] = useState<string | null>(null);
  
  // Initialize states with stored values from localStorage if available
  const [pickupSuccess, setPickupSuccess] = useState<boolean>(() => {
    const stored = localStorage.getItem(`pickup_success_${id}`);
    return stored ? JSON.parse(stored) : false;
  });
  
  const [pickupConfirmation, setPickupConfirmation] = useState<any>(() => {
    const stored = localStorage.getItem(`pickup_confirmation_${id}`);
    return stored ? JSON.parse(stored) : null;
  });
  
  const [pickupStatus, setPickupStatus] = useState<any>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Time slot options
  const timeSlots = [
    { label: t('pickup.dateTime.timeSlots.morning'), value: '10:00-14:00', readyTime: '1000', closeTime: '1400' },
    { label: t('pickup.dateTime.timeSlots.afternoon'), value: '14:00-18:00', readyTime: '1400', closeTime: '1800' },
    { label: t('pickup.dateTime.timeSlots.allDay'), value: '10:00-18:00', readyTime: '1000', closeTime: '1800' }
  ];

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated && !localStorage.getItem('accessToken')) {
      navigate('/login', { state: { returnUrl: `/pickup-request/${id}` } });
      return;
    }

    fetchOrderDetails();
  }, [id, isAuthenticated, navigate]);

  useEffect(() => {
    if (order && order.pickupReferenceNumber) {
      fetchPickupStatus(order.pickupReferenceNumber);
    } else if (pickupConfirmation && pickupConfirmation.PRN) {
      fetchPickupStatus(pickupConfirmation.PRN);
    }
  }, [order, pickupConfirmation]);

  // Add new useEffect to handle pickupSuccess state changes
  useEffect(() => {
    // When pickup is successful, try to fetch status
    if (pickupSuccess && pickupConfirmation && pickupConfirmation.PRN) {
      fetchPickupStatus(pickupConfirmation.PRN);
    }
  }, [pickupSuccess, pickupConfirmation]);

  // Add effect to save to localStorage when values change
  useEffect(() => {
    if (pickupSuccess) {
      localStorage.setItem(`pickup_success_${id}`, JSON.stringify(pickupSuccess));
    }
    if (pickupConfirmation) {
      localStorage.setItem(`pickup_confirmation_${id}`, JSON.stringify(pickupConfirmation));
    }
  }, [pickupSuccess, pickupConfirmation, id]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch order details: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch order details');
      }

      setOrder(data.data);
      
      // Check if order has tracking number
      if (!data.data.trackingNumber) {
        setError('This order does not have a tracking number. Create a shipment first.');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Failed to load order details. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchPickupRates = async () => {
    if (!order || !order.seller) {
      setError('Order details not available');
      return;
    }

    try {
      setIsRatesLoading(true);
      setError(null);
      
      // Validate seller address
      const sellerAddress = order.seller.address || {};
      if (!sellerAddress.street || !sellerAddress.city || !sellerAddress.state || !sellerAddress.postalCode) {
        setError('Seller address information is incomplete. Please update the seller profile with complete address details.');
        setIsRatesLoading(false);
        return;
      }
      
      // Format date for API
      const formattedDate = selectedDate.replace(/-/g, '');
      const selectedSlot = timeSlots.find(slot => slot.value === selectedTimeSlot);
      
      if (!selectedSlot) {
        throw new Error('Invalid time slot selected');
      }

      // Log order details for debugging
      console.log('Order details:', JSON.stringify(order, null, 2));
      console.log('Seller address:', JSON.stringify(sellerAddress, null, 2));
      
      // Update to use the correct PickupRateRequest format from UPS API
      const pickupData = {
        PickupRateRequest: {
          PickupAddress: {
            AddressLine: sellerAddress.street || '',
            City: sellerAddress.city || '',
            StateProvince: sellerAddress.state || '',
            PostalCode: sellerAddress.postalCode || '',
            CountryCode: 'US',
            ResidentialIndicator: "Y"
          },
          AlternateAddressIndicator: "N",
          ServiceDateOption: "02", // Future-Day Pickup
          PickupDateInfo: {
            CloseTime: selectedSlot.closeTime,
            ReadyTime: selectedSlot.readyTime,
            PickupDate: formattedDate
          }
        }
      };
      
      console.log('Sending pickup rate request:', JSON.stringify(pickupData, null, 2));
      
      const response = await getPickupRates(pickupData);
      console.log('Pickup rate response received:', response);
      
      if (response.PickupRateResponse && response.PickupRateResponse.RateResult) {
        const rateResult = response.PickupRateResponse.RateResult;
        
        // Create a standardized format for our UI
        // Include charge details if available
        let chargeDescription = '';
        if (rateResult.ChargeDetail && rateResult.ChargeDetail.length > 0) {
          chargeDescription = rateResult.ChargeDetail.map((charge: any) => 
            `${charge.ChargeDescription}: $${charge.ChargeAmount}`
          ).join(', ');
        }
        
        const standardizedRate = {
          ServiceType: rateResult.RateType || 'FD',
          MonetaryValue: rateResult.GrandTotalOfAllCharge || '0.00',
          CurrencyCode: rateResult.CurrencyCode || 'USD',
          ServiceName: 'UPS Pickup Service',
          ReadyTime: selectedSlot.readyTime.substring(0, 2) + ':' + selectedSlot.readyTime.substring(2),
          PickupTime: selectedSlot.closeTime.substring(0, 2) + ':' + selectedSlot.closeTime.substring(2),
          ChargeDetails: chargeDescription
        };
        
        setPickupRates([standardizedRate]);
        setSelectedRate(standardizedRate.ServiceType);
      } else {
        throw new Error('Invalid response format from pickup rate API');
      }
    } catch (err) {
      console.error('Error fetching pickup rates:', err);
      setError(err instanceof Error ? err.message : 'Failed to get pickup rates');
    } finally {
      setIsRatesLoading(false);
    }
  };

  // Update the populateTestAddress function
  const populateTestAddress = () => {
    if (!order || !order.seller) return;
    
    // Create a deep copy of the order to avoid mutating the original state directly
    const updatedOrder = JSON.parse(JSON.stringify(order));
    
    // Add address data if missing
    if (!updatedOrder.seller) updatedOrder.seller = {};
    if (!updatedOrder.seller.address) updatedOrder.seller.address = {};
    
    // Populate with UPS test address and contact details
    updatedOrder.seller.address = {
      street: '315 Saddle Bridge Drive',
      city: 'Allendale',
      state: 'NJ',
      postalCode: '07401'
    };
    updatedOrder.seller.phone = '5555555555';
    updatedOrder.seller.countryCode = 'US';
    
    setOrder(updatedOrder);
    setError(null);
    console.log('Test address populated');
  };

  const handleCreatePickup = async () => {
    if (!order || !selectedRate) {
      setError('Please select a pickup option first');
      return;
    }
    
    // Validate address fields are not empty
    const sellerAddress = order.seller?.address || {};
    if (!sellerAddress.street || !sellerAddress.city || !sellerAddress.state || !sellerAddress.postalCode) {
      setError('Seller address information is incomplete. Please update the seller profile with complete address details before scheduling a pickup.');
      return;
    }
    
    // Validate phone number
    if (!order.seller.phone || order.seller.phone.trim() === '') {
      console.warn('Seller phone number is missing. Using default phone number for UPS pickup.');
      // We'll use a default phone number below, but still show a warning to the user
    }
    
    try {
      setIsRatesLoading(true);
      setError(null);
      
      // Format date for API
      const formattedDate = selectedDate.replace(/-/g, '');
      const selectedSlot = timeSlots.find(slot => slot.value === selectedTimeSlot);
      
      if (!selectedSlot) {
        throw new Error('Invalid time slot selected');
      }

      // Find the selected rate details
      const rateDetails = pickupRates.find(rate => rate.ServiceType === selectedRate);
      
      if (!rateDetails) {
        throw new Error('Selected rate details not found');
      }

      // Create pickup request payload exactly matching UPS API documentation
      const pickupCreationData = {
        PickupCreationRequest: {
          Request: {
            RequestOption: "1",
            TransactionReference: {
              CustomerContext: `Order #${id}`
            }
          },
          RatePickupIndicator: "N",
          Shipper: {
            Account: {
              AccountNumber: "724114",
              AccountCountryCode: "US"
            }
          },
          PickupDateInfo: {
            CloseTime: selectedSlot.closeTime,
            ReadyTime: selectedSlot.readyTime,
            PickupDate: formattedDate
          },
          PickupAddress: {
            CompanyName: order.seller.storeName || `${order.seller.firstName} ${order.seller.lastName}`,
            ContactName: `${order.seller.firstName} ${order.seller.lastName}`,
            AddressLine: order.seller.address?.street || '',
            City: order.seller.address?.city || '',
            StateProvince: order.seller.address?.state || '',
            PostalCode: order.seller.address?.postalCode || '',
            CountryCode: 'US',
            ResidentialIndicator: "Y",
            Phone: {
              Number: order.seller.phone || '5555555555'
            }
          },
          AlternateAddressIndicator: "N",
          PickupPiece: [
            {
              ServiceCode: "001",
              Quantity: "1",
              DestinationCountryCode: "US",
              ContainerCode: "01"
            }
          ],
          TotalWeight: {
            Weight: "1",
            UnitOfMeasurement: "LBS"
          },
          OverweightIndicator: "N",
          PaymentMethod: "01",
          SpecialInstruction: `Pickup for Order #${id}`,
          ReferenceNumber: order.trackingNumber || `Order #${id}`
        }
      };
      
      console.log('Sending final request to:', `${API_URL}/api/ups/pickupcreation`);
      console.log('With headers:', {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer [TOKEN REDACTED]'
      });
      console.log('And body:', JSON.stringify({
        pickupCreationData
      }, null, 2));
      
      const response = await fetch(`${API_URL}/api/ups/pickupcreation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          pickupCreationData
        })
      });

      // Log response headers
      console.log('Response status:', response.status, response.statusText);
      console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('UPS API Error Response:', errorData);
        const errorMessage = errorData.message || errorData.error || `Failed to create pickup: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Pickup creation response received:', data);
      
      if (data.success && data.pickupCreationResponse && data.pickupCreationResponse.PickupCreationResponse) {
        setPickupSuccess(true);
        setPickupConfirmation(data.pickupCreationResponse.PickupCreationResponse);
      } else if (data.pickupCreationResponse && data.pickupCreationResponse.PRN) {
        // Direct response from UPS API
        setPickupSuccess(true);
        setPickupConfirmation(data.pickupCreationResponse);
      } else {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from pickup creation API');
      }
    } catch (err) {
      console.error('Error creating pickup:', err);
      // Log more details about the error
      if (err instanceof Error) {
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
      } else {
        console.error('Unknown error type:', typeof err);
      }
      
      let errorMessage = err instanceof Error ? err.message : 'Failed to create pickup';
      
      // Add specific error handling for common issues
      if (typeof errorMessage === 'string') {
        if (errorMessage.includes('Phone')) {
          errorMessage = 'UPS requires a valid phone number for pickup. Please update your seller profile with a valid phone number.';
        } else if (errorMessage.includes('Country')) {
          errorMessage = 'There was an issue with the country code. Please ensure all addresses have valid country codes.';
        } else if (errorMessage.includes('PickupAddress')) {
          errorMessage = 'The pickup address information is incomplete or invalid. Please provide complete address details.';
        } else if (errorMessage.includes('Service')) {
          errorMessage = 'The selected service is not available for this pickup. Please try a different service or contact UPS.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsRatesLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Add this function to ensure proper country code format
  const formatCountryCode = (country: string): string => {
    // Convert country names to ISO codes
    if (country === 'France') return 'FR';
    if (country === 'United States') return 'US';
    if (country === 'United Kingdom') return 'GB';
    if (country === 'Canada') return 'CA';
    return country;
  };

  // Add new function to fetch pickup status
  const fetchPickupStatus = async (prn: string) => {
    if (!prn) {
      setStatusError('Pickup Reference Number (PRN) is required');
      return;
    }
    
    try {
      setIsStatusLoading(true);
      setStatusError(null);
      
      // Pass the explicit UPS account number "724114" as the second parameter
      const statusData = await getPickupStatus(prn, "724114");
      setPickupStatus(statusData);
      
      console.log('Pickup status fetched:', statusData);
    } catch (err) {
      console.error('Error fetching pickup status:', err);
      setStatusError(err instanceof Error ? err.message : 'Failed to fetch pickup status');
    } finally {
      setIsStatusLoading(false);
    }
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen md:pt-24 pt-0 pb-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="ml-3 text-gray-600">{t('pickup.loading.orderDetails')}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen md:pt-24 pt-6 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={() => navigate(`/orders/${id}`)}
            className="flex items-center text-indigo-600 hover:text-indigo-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t('pickup.backToOrder')}
          </button>

          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">{t('pickup.title')}</h1>
            {order?.trackingNumber && (
              <div className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                <Package className="h-4 w-4 mr-1" />
                {t('pickup.trackingNumber')}: {order.trackingNumber}
              </div>
            )}
          </div>
          <p className="text-gray-500 mt-1">{t('pickup.orderId')} {id?.substring(0, 8).toUpperCase()}</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          {error && (
            <div className="px-6 py-4 bg-red-50 border-b border-red-200 text-red-700">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p>{error}</p>
              </div>
            </div>
          )}
          
          {pickupSuccess ? (
            <div className="p-6">
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <h4 className="text-md font-medium text-green-800">{t('pickup.success.title')}</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {pickupConfirmation?.PRN && (
                    <div>
                      <p className="text-gray-700 font-medium">{t('pickup.success.confirmation')}:</p>
                      <p className="text-gray-900">{pickupConfirmation.PRN}</p>
                    </div>
                  )}
                  {pickupConfirmation?.RateResult?.RateType && (
                    <div>
                      <p className="text-gray-700 font-medium">{t('pickup.success.rate')}:</p>
                      <p className="text-gray-900">
                        ${pickupConfirmation.RateResult.RateType.MonetaryValue || 'N/A'} 
                        {pickupConfirmation.RateResult.RateType.CurrencyCode}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-700 font-medium">{t('pickup.success.date')}:</p>
                    <p className="text-gray-900">{formatDate(selectedDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">{t('pickup.success.window')}:</p>
                    <p className="text-gray-900">{timeSlots.find(slot => slot.value === selectedTimeSlot)?.label || selectedTimeSlot}</p>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm text-blue-700">{t('pickup.success.note')}</p>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => navigate(`/orders/${id}`)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {t('pickup.success.returnToOrder')}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('pickup.schedulePickup')}</h2>
                <p className="text-gray-600">{t('pickup.scheduleDescription')}</p>
              </div>
              
              {error && error.includes('address information is incomplete') && (
                <div className="p-4 mb-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm text-yellow-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Address Management Form */}
              <div className="mb-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">{t('pickup.address.form.title')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">{t('pickup.address.form.labels.street')}</label>
                      <input
                        type="text"
                        value={order?.seller?.address?.street || ''}
                        onChange={(e) => {
                          const updatedOrder = JSON.parse(JSON.stringify(order));
                          if (!updatedOrder.seller) updatedOrder.seller = {};
                          if (!updatedOrder.seller.address) updatedOrder.seller.address = {};
                          updatedOrder.seller.address.street = e.target.value;
                          setOrder(updatedOrder);
                        }}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder={t('pickup.address.form.placeholders.street')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">{t('pickup.address.form.labels.city')}</label>
                      <input
                        type="text"
                        value={order?.seller?.address?.city || ''}
                        onChange={(e) => {
                          const updatedOrder = JSON.parse(JSON.stringify(order));
                          if (!updatedOrder.seller) updatedOrder.seller = {};
                          if (!updatedOrder.seller.address) updatedOrder.seller.address = {};
                          updatedOrder.seller.address.city = e.target.value;
                          setOrder(updatedOrder);
                        }}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder={t('pickup.address.form.placeholders.city')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">{t('pickup.address.form.labels.state')}</label>
                      <input
                        type="text"
                        value={order?.seller?.address?.state || ''}
                        onChange={(e) => {
                          const updatedOrder = JSON.parse(JSON.stringify(order));
                          if (!updatedOrder.seller) updatedOrder.seller = {};
                          if (!updatedOrder.seller.address) updatedOrder.seller.address = {};
                          updatedOrder.seller.address.state = e.target.value;
                          setOrder(updatedOrder);
                        }}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder={t('pickup.address.form.placeholders.state')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">{t('pickup.address.form.labels.postalCode')}</label>
                      <input
                        type="text"
                        value={order?.seller?.address?.postalCode || ''}
                        onChange={(e) => {
                          const updatedOrder = JSON.parse(JSON.stringify(order));
                          if (!updatedOrder.seller) updatedOrder.seller = {};
                          if (!updatedOrder.seller.address) updatedOrder.seller.address = {};
                          updatedOrder.seller.address.postalCode = e.target.value;
                          setOrder(updatedOrder);
                        }}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder={t('pickup.address.form.placeholders.postalCode')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">{t('pickup.address.form.labels.phone')}</label>
                      <input
                        type="text"
                        value={order?.seller?.phone || ''}
                        onChange={(e) => {
                          const updatedOrder = JSON.parse(JSON.stringify(order));
                          if (!updatedOrder.seller) updatedOrder.seller = {};
                          updatedOrder.seller.phone = e.target.value;
                          setOrder(updatedOrder);
                        }}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder={t('pickup.address.form.placeholders.phone')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">{t('pickup.address.form.labels.countryCode')}</label>
                      <input
                        type="text"
                        value={order?.seller?.countryCode || ''}
                        onChange={(e) => {
                          const updatedOrder = JSON.parse(JSON.stringify(order));
                          if (!updatedOrder.seller) updatedOrder.seller = {};
                          updatedOrder.seller.countryCode = e.target.value;
                          setOrder(updatedOrder);
                        }}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        placeholder={t('pickup.address.form.placeholders.countryCode')}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={populateTestAddress}
                      className="text-xs px-3 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                    >
                      {t('pickup.address.buttons.useTest')}
                    </button>
                    <button
                      onClick={() => {
                        const updatedOrder = JSON.parse(JSON.stringify(order));
                        if (!updatedOrder.seller) updatedOrder.seller = {};
                        if (!updatedOrder.seller.address) updatedOrder.seller.address = {};
                        updatedOrder.seller.address = {
                          street: '',
                          city: '',
                          state: '',
                          postalCode: ''
                        };
                        updatedOrder.seller.phone = '';
                        updatedOrder.seller.countryCode = '';
                        setOrder(updatedOrder);
                      }}
                      className="text-xs px-3 py-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                    >
                      {t('pickup.address.buttons.clear')}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Display warning if seller phone is missing */}
              {(!order?.seller?.phone || order?.seller?.phone.trim() === '') && (
                <div className="p-4 mb-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 mr-2" />
                    <div>
                      <p className="text-sm text-yellow-700">
                        Seller phone number is missing. UPS requires a valid phone number for pickup requests. 
                        A default phone number will be used, but it's recommended to update your seller profile with a valid phone number.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Pickup Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]} // Today or later
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Pickup Time Window
                  </label>
                  <select
                    value={selectedTimeSlot}
                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {timeSlots.map((slot) => (
                      <option key={slot.value} value={slot.value}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={handleFetchPickupRates}
                  disabled={isRatesLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                >
                  {isRatesLoading ? (
                    <>
                      <Loader className="animate-spin h-4 w-4 mr-2" />
                      Getting Rates...
                    </>
                  ) : (
                    <>Get Pickup Rates</>
                  )}
                </button>
              </div>
              
              {pickupRates.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-4">Available Pickup Options</h3>
                  
                  <div className="space-y-3">
                    {pickupRates.map((rate) => (
                      <div 
                        key={rate.ServiceType}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedRate === rate.ServiceType 
                            ? 'border-indigo-500 bg-indigo-50' 
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                        onClick={() => setSelectedRate(rate.ServiceType)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className={`h-5 w-5 rounded-full border ${
                              selectedRate === rate.ServiceType 
                                ? 'border-indigo-600' 
                                : 'border-gray-300'
                            } flex items-center justify-center mr-3`}>
                              {selectedRate === rate.ServiceType && (
                                <div className="h-3 w-3 rounded-full bg-indigo-600"></div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {rate.ServiceName || `UPS Pickup Service`}
                              </p>
                              <p className="text-sm text-gray-500">
                                Pickup between {rate.ReadyTime && rate.PickupTime 
                                  ? `${rate.ReadyTime} - ${rate.PickupTime}`
                                  : timeSlots.find(slot => slot.value === selectedTimeSlot)?.label
                                }
                              </p>
                              {rate.ChargeDetails && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {rate.ChargeDetails}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-lg font-semibold text-gray-900">
                            ${rate.MonetaryValue} {rate.CurrencyCode}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6">
                    <button
                      onClick={handleCreatePickup}
                      disabled={isRatesLoading || !selectedRate}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center"
                    >
                      {isRatesLoading ? (
                        <>
                          <Loader className="animate-spin h-4 w-4 mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>Schedule Pickup</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Pickup Status Section */}
        {(order?.pickupReferenceNumber || (pickupConfirmation && pickupConfirmation.PRN) || pickupSuccess) && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Info className="h-5 w-5 mr-2 text-indigo-500" />
                Pickup Status
              </h2>
            </div>
            <div className="p-6">
              {statusError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <p>{statusError}</p>
                  </div>
                </div>
              )}
              
              {isStatusLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="animate-spin h-8 w-8 text-indigo-500 mr-3" />
                  <p className="text-gray-600">Loading pickup status...</p>
                </div>
              ) : pickupStatus ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Pickup Reference Number (PRN)</p>
                      <p className="text-lg font-medium text-gray-900">
                        {pickupStatus.PickupPendingStatusResponse?.PendingStatus?.PRN || 
                         order?.pickupReferenceNumber || 
                         pickupConfirmation?.PRN}
                      </p>
                    </div>
                    
                    {pickupStatus.PickupPendingStatusResponse?.PendingStatus?.PickupStatusMessage && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Status</p>
                        <div className="mt-1">
                          {pickupStatus.PickupPendingStatusResponse.PendingStatus.OnCallStatusCode ? (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium 
                              ${pickupStatus.PickupPendingStatusResponse.PendingStatus.OnCallStatusCode === '003' 
                                ? 'bg-green-100 text-green-800' 
                                : pickupStatus.PickupPendingStatusResponse.PendingStatus.OnCallStatusCode === '007'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'}`}>
                              {getPickupStatusMessage(pickupStatus.PickupPendingStatusResponse.PendingStatus.OnCallStatusCode)}
                            </span>
                          ) : (
                            <span className="text-gray-700">
                              {pickupStatus.PickupPendingStatusResponse.PendingStatus.PickupStatusMessage}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {pickupStatus.PickupPendingStatusResponse?.PendingStatus?.ServiceDate && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Service Date</p>
                      <p className="text-gray-700">
                        {formatPickupDate(pickupStatus.PickupPendingStatusResponse.PendingStatus.ServiceDate)}
                      </p>
                    </div>
                  )}
                  
                  {/* Display extended pickup details if available */}
                  {pickupStatus.PickupPendingStatusResponse?.PendingStatus?.PickupDetail && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2">Pickup Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {pickupStatus.PickupPendingStatusResponse.PendingStatus.PickupDetail.ReadyTime && (
                          <div>
                            <span className="text-gray-500">Ready Time:</span>{' '}
                            <span className="text-gray-900">
                              {formatTime(pickupStatus.PickupPendingStatusResponse.PendingStatus.PickupDetail.ReadyTime)}
                            </span>
                          </div>
                        )}
                        {pickupStatus.PickupPendingStatusResponse.PendingStatus.PickupDetail.CloseTime && (
                          <div>
                            <span className="text-gray-500">Close Time:</span>{' '}
                            <span className="text-gray-900">
                              {formatTime(pickupStatus.PickupPendingStatusResponse.PendingStatus.PickupDetail.CloseTime)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-2 p-4 bg-blue-50 rounded border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> Pickup status information is updated periodically by UPS. Refresh this page 
                      to get the latest status.
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => fetchPickupStatus(pickupStatus.PickupPendingStatusResponse?.PendingStatus?.PRN || 
                                                      order?.pickupReferenceNumber || 
                                                      pickupConfirmation?.PRN)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Refresh Status
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  {pickupSuccess && pickupConfirmation && pickupConfirmation.PRN ? (
                    <div>
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-500">Pickup Reference Number (PRN)</p>
                        <p className="text-lg font-medium text-gray-900">{pickupConfirmation.PRN}</p>
                      </div>
                      <p className="text-gray-600 mb-4">UPS is processing your pickup request. Status information will be available soon.</p>
                      <button
                        onClick={() => fetchPickupStatus(pickupConfirmation.PRN)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Clock className="w-4 h-4 mr-2" /> Check Status Now
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-500">No pickup status information available.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Pickup Information */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{t('pickup.info.title')}</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <Truck className="h-4 w-4 mr-2 text-gray-400" />
                  {t('pickup.info.guidelines')}
                </h3>
                <ul className="mt-2 space-y-2 text-sm text-gray-600 list-disc list-inside">
                  {(t('pickup.info.guidelinesList', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">{t('pickup.info.note')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to format the pickup date from YYYYMMDD to a readable format
const formatPickupDate = (dateString: string): string => {
  if (!dateString || dateString.length !== 8) {
    return 'Invalid date';
  }
  
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);
  
  const date = new Date(`${year}-${month}-${day}`);
  
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Helper function to format time strings from UPS (format: "1430") to readable format (format: "2:30 PM")
const formatTime = (timeString: string): string => {
  if (!timeString || timeString.length !== 4) {
    return 'Invalid time';
  }
  
  const hours = parseInt(timeString.substring(0, 2), 10);
  const minutes = timeString.substring(2, 4);
  
  // Convert to 12-hour format
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  
  return `${hours12}:${minutes} ${period}`;
};

export default PickupRequest; 