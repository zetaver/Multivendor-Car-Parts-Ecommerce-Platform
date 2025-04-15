import React, { useState, useEffect } from 'react';
import { createShipment, getPickupRates, createPickup } from '../services/locationService';
import { CheckCircle, Truck, AlertTriangle, Loader, Package, MapPin } from 'lucide-react';
import axios from 'axios';

interface ShippingFormProps {
  orderId: string;
  orderDetails: any;
  onLabelGenerated: (labelData: any) => void;
}

// Define country code type to avoid type errors
type CountryCode = 'US' | 'CA' | 'FR' | 'GB';

// Define address interface
interface Address {
  _id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const ShippingForm: React.FC<ShippingFormProps> = ({ orderId, orderDetails, onLabelGenerated }) => {
  const [step, setStep] = useState<'shipping' | 'pickup' | 'complete'>('shipping');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shipmentData, setShipmentData] = useState<any>(null);
  const [pickupOptions, setPickupOptions] = useState<any[]>([]);
  const [selectedPickup, setSelectedPickup] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null);
  const [sellerInfo, setSellerInfo] = useState<any>(null);
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressApplied, setAddressApplied] = useState(false);
  
  // Use order tracking number if available
  useEffect(() => {
    if (orderDetails && orderDetails.trackingNumber) {
      setTrackingNumber(orderDetails.trackingNumber);
    }
    
    // Get seller information from local storage
    try {
      const userDataString = localStorage.getItem('user');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setSellerInfo(userData);
        console.log('Loaded seller information:', userData);
      }
    } catch (err) {
      console.error('Error loading seller info from localStorage:', err);
    }
    
    // Fetch default address - make sure this is always the LAST operation
    // to ensure it takes precedence over other data sources
    setTimeout(() => {
      console.log('Fetching default address after slight delay to ensure it has priority');
      fetchDefaultAddress();
    }, 100);
  }, [orderDetails]);
  
  // Fetch default address from the server
  const fetchDefaultAddress = async () => {
    setAddressLoading(true);
    setAddressError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No authentication token found');
        setAddressError('Please log in to load your default address');
        setAddressLoading(false);
        return;
      }
      
      console.log('Fetching default address using token...');
      
      const response = await axios.get('/api/addresses/current/default', {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      });
      
      console.log('API response for default address:', response.data);
      
      // The API returns the address in response.data.data, not response.data.address
      if (response.data && response.data.success && response.data.data) {
        if (!response.data.data.street || !response.data.data.city) {
          console.warn('Default address is incomplete:', response.data.data);
          setAddressError('Your default address is incomplete. Please check your profile settings.');
          
          // Try to use the data anyway if at least some fields are present
          if (response.data.data.street || response.data.data.city) {
            setDefaultAddress(response.data.data);
            updateFormWithAddress(response.data.data);
          }
        } else {
          setDefaultAddress(response.data.data);
          console.log('Fetched default address:', response.data.data);
          
          // Immediately update the form data here as well
          updateFormWithAddress(response.data.data);
        }
      } else {
        // If no default address is found, try to fetch all addresses and use the first one
        console.log('No default address found, attempting to fetch all addresses...');
        const allAddressesResponse = await axios.get('/api/addresses', {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          }
        });
        
        console.log('API response for all addresses:', allAddressesResponse.data);
        
        if (allAddressesResponse.data && 
            allAddressesResponse.data.success && 
            allAddressesResponse.data.data && 
            allAddressesResponse.data.data.length > 0) {
          // Use the first address as fallback
          const firstAddress = allAddressesResponse.data.data[0];
          
          if (!firstAddress.street || !firstAddress.city) {
            console.warn('First address is incomplete:', firstAddress);
            setAddressError('Your address information is incomplete. Please check your profile settings.');
            
            // Try to use the data anyway if at least some fields are present
            if (firstAddress.street || firstAddress.city) {
              setDefaultAddress(firstAddress);
              updateFormWithAddress(firstAddress);
            }
          } else {
            setDefaultAddress(firstAddress);
            console.log('No default address found. Using first address instead:', firstAddress);
            
            // Immediately update the form data with the first address
            updateFormWithAddress(firstAddress);
          }
        } else {
          console.log('No addresses found at all');
          // setAddressError('No address found in your profile. Please enter your shipping details manually.');
        }
      }
    } catch (err) {
      console.error('Error fetching default address:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        setAddressError('Authentication error. Please try logging in again.');
      } else if (errorMessage.includes('404')) {
        setAddressError('No addresses found. Please add an address to your profile or enter your shipping details manually.');
      } else if (errorMessage.includes('Network Error')) {
        setAddressError('Network error. Please check your internet connection and try again.');
      } else {
        setAddressError('Could not load your default address. Please enter address details manually.');
      }
    } finally {
      setAddressLoading(false);
    }
  };
  
  // Helper function to update form with address data
  const updateFormWithAddress = (address: Address) => {
    if (!address) return;
    
    console.log('Updating form data with address:', address);
    setFormData(prevFormData => {
      const updatedData = {
        ...prevFormData,
        shipperAddress: address.street || '',
        shipperCity: address.city || '',
        shipperState: address.state || '',
        shipperZip: address.postalCode || '',
        shipperCountry: address.country || 'US'
      };
      console.log('Updated form data:', updatedData);
      setAddressApplied(true);
      return updatedData;
    });
  }
  
  // Add this new function after updateFormWithAddress
  const resetAddressData = () => {
    setAddressApplied(false);
    setDefaultAddress(null);
    // Re-fetch the default address
    fetchDefaultAddress();
  };
  
  // Form data for shipping
  const [formData, setFormData] = useState({
    shipperName: orderDetails?.seller?.name || '',
    shipperAttention: orderDetails?.seller?.name || '',
    shipperAddress: orderDetails?.seller?.address || '',
    shipperCity: orderDetails?.seller?.city || '',
    shipperState: orderDetails?.seller?.state || '',
    shipperZip: orderDetails?.seller?.zip || '75001',
    shipperCountry: orderDetails?.seller?.country || 'FR',
    shipperPhone: orderDetails?.seller?.phone || '',
    
    recipientName: orderDetails?.shipping?.name || '',
    recipientAttention: '',
    recipientAddress: orderDetails?.shipping?.address || '',
    recipientCity: orderDetails?.shipping?.city || '',
    recipientState: orderDetails?.shipping?.state || '',
    recipientZip: orderDetails?.shipping?.zip || '',
    recipientCountry: orderDetails?.shipping?.country || 'FR',
    recipientPhone: orderDetails?.shipping?.phone || '',
    
    packageWeight: '1',
    packageLength: '10',
    packageWidth: '10',
    packageHeight: '10',
    description: `Order #${orderId}`.substring(0, 50),
    
    accountNumber: "724114", // Set default UPS account number
    serviceCode: '03' // Ground
  });
  
  // Update form data when default address is fetched
  useEffect(() => {
    if (defaultAddress) {
      // Use our helper function to ensure consistency
      updateFormWithAddress(defaultAddress);
      
      // Log to confirm data is being set correctly
      console.log('Updated form with default address data in useEffect:', defaultAddress);
    }
  }, [defaultAddress]);
  
  // Fill form data from order details if available
  useEffect(() => {
    // Skip if we've already applied address data
    if (addressApplied) {
      console.log('Skipping orderDetails form update because address was already applied');
      return;
    }

    if (orderDetails && orderDetails.seller) {
      // Extract seller info if available
      const seller = orderDetails.seller;
      
      // Check if we have a default address already
      const hasDefaultAddress = defaultAddress && 
                               defaultAddress.street && 
                               defaultAddress.city && 
                               defaultAddress.state && 
                               defaultAddress.postalCode;
      
      console.log('Updating from orderDetails, hasDefaultAddress:', hasDefaultAddress);
      
      // Use seller address from orderDetails if available
      setFormData(prev => {
        // Get shipper country from data (no longer forcing to US)
        const shipperCountry = seller.address?.country || prev.shipperCountry;
        const buyerCountry = orderDetails.shippingAddress?.country || prev.recipientCountry;
        const isInternational = shipperCountry !== buyerCountry;
        
        // For international shipments, use Worldwide Express instead of Ground
        const serviceCode = isInternational ? '07' : prev.serviceCode;
        
        // Create description and limit to 50 characters
        const description = `Order #${orderId} - ${orderDetails.items?.[0]?.product?.title || 'Product'}`;
        const truncatedDescription = description.substring(0, 50);
        
        return {
          ...prev,
          shipperName: seller.storeName || seller.firstName + ' ' + seller.lastName || prev.shipperName,
          shipperAttention: seller.firstName + ' ' + seller.lastName || prev.shipperAttention,
          // Only update address fields if we don't have a default address
          shipperAddress: hasDefaultAddress ? prev.shipperAddress : (seller.address?.street || seller.address?.line1 || prev.shipperAddress),
          shipperCity: hasDefaultAddress ? prev.shipperCity : (seller.address?.city || prev.shipperCity),
          shipperState: hasDefaultAddress ? prev.shipperState : (seller.address?.state || prev.shipperState),
          shipperZip: hasDefaultAddress ? prev.shipperZip : (seller.address?.postalCode || seller.address?.zip || prev.shipperZip),
          shipperPhone: seller.phone || prev.shipperPhone,
          shipperCountry: hasDefaultAddress ? prev.shipperCountry : shipperCountry,
          // Only update recipient info if available and not already set
          recipientName: orderDetails.buyer?.firstName + ' ' + orderDetails.buyer?.lastName || prev.recipientName,
          recipientPhone: orderDetails.buyer?.phone || prev.recipientPhone,
          // Set shipping address if available
          recipientAddress: orderDetails.shippingAddress?.street || prev.recipientAddress,
          recipientCity: orderDetails.shippingAddress?.city || prev.recipientCity,
          recipientState: orderDetails.shippingAddress?.state || prev.recipientState,
          recipientZip: orderDetails.shippingAddress?.postalCode || prev.recipientZip,
          recipientCountry: buyerCountry,
          // Set description with order details and truncate to 50 characters
          description: truncatedDescription,
          // Use appropriate service for international
          serviceCode: serviceCode
        };
      });
    }
  }, [orderDetails, orderId, defaultAddress, addressApplied]);

  // Also update form data from seller info if available
  useEffect(() => {
    // Skip if we've already applied address data
    if (addressApplied) {
      console.log('Skipping sellerInfo form update because address was already applied');
      return;
    }

    if (sellerInfo) {
      setFormData(prev => {
        // Determine the country code for form
        let countryCode = 'US'; // Default
        if (sellerInfo.location === 'Sialkot' || sellerInfo.location?.includes('Pakistan')) {
          countryCode = 'PK';
        } else if (sellerInfo.location?.includes('France')) {
          countryCode = 'FR';
        } else if (sellerInfo.location?.includes('UK') || sellerInfo.location?.includes('United Kingdom')) {
          countryCode = 'GB';
        } else if (sellerInfo.location?.includes('Canada')) {
          countryCode = 'CA';
        }
        
        // Check if we have a default address already
        const hasDefaultAddress = defaultAddress && 
                                 defaultAddress.street && 
                                 defaultAddress.city && 
                                 defaultAddress.state && 
                                 defaultAddress.postalCode;
        
        console.log('Updating from sellerInfo, hasDefaultAddress:', hasDefaultAddress);
        
        return {
          ...prev,
          shipperName: sellerInfo.storeName || `${sellerInfo.firstName} ${sellerInfo.lastName}`,
          shipperAttention: `${sellerInfo.firstName} ${sellerInfo.lastName}`,
          shipperPhone: sellerInfo.phone || prev.shipperPhone,
          // Only update address fields if we don't have a default address
          shipperCity: hasDefaultAddress ? prev.shipperCity : (sellerInfo.city || sellerInfo.location || prev.shipperCity),
          shipperAddress: hasDefaultAddress ? prev.shipperAddress : (sellerInfo.address?.street || sellerInfo.address || prev.shipperAddress),
          shipperState: hasDefaultAddress ? prev.shipperState : (sellerInfo.state || prev.shipperState),
          shipperZip: hasDefaultAddress ? prev.shipperZip : (sellerInfo.postalCode || sellerInfo.zip || prev.shipperZip),
          shipperCountry: hasDefaultAddress ? prev.shipperCountry : (sellerInfo.country || countryCode || prev.shipperCountry),
        };
      });
    }
  }, [sellerInfo, defaultAddress, addressApplied]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-select appropriate service when country changes
    if (name === 'shipperCountry' || name === 'recipientCountry') {
      const updatedFormData = {
        ...formData,
        [name]: value
      };
      
      // Check if this will be an international shipment
      const isInternational = updatedFormData.shipperCountry !== updatedFormData.recipientCountry;
      
      // For international shipments, automatically change to Worldwide Express if currently on Ground
      if (isInternational && updatedFormData.serviceCode === '03') {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          serviceCode: '07' // Switch to Worldwide Express
        }));
      }
    }
  };
  
  const prepareShipmentData = () => {
    // Convert dimensions from inches to centimeters and weight from pounds to kilograms
    const cmLength = (parseFloat(formData.packageLength) * 2.54).toFixed(1);
    const cmWidth = (parseFloat(formData.packageWidth) * 2.54).toFixed(1);
    const cmHeight = (parseFloat(formData.packageHeight) * 2.54).toFixed(1);
    const kgWeight = (parseFloat(formData.packageWeight) * 0.453592).toFixed(2);
    
    // Get current date in YYYYMMDD format for ShipmentDate
    const today = new Date();
    const shipmentDate = today.toISOString().split('T')[0].replace(/-/g, '');
    
    // Ensure it's a valid date (log for debugging)
    console.log(`Using shipment date: ${shipmentDate} (today's date in YYYYMMDD format)`);
    
    // Ensure country codes are in proper ISO format
    // Default to US if no country code is provided to prevent API errors
    let shipperCountryCode: CountryCode = (formData.shipperCountry || 'US') as CountryCode;
    let recipientCountryCode: CountryCode = (formData.recipientCountry || 'US') as CountryCode;
    
    // Fix for common country name issues - ensure we use ISO codes
    let recipientCountryStr = formData.recipientCountry as string;
    let shipperCountryStr = formData.shipperCountry as string;
    
    // Convert full country names to ISO codes
    if (shipperCountryStr === 'France' || shipperCountryStr?.toLowerCase() === 'france') shipperCountryCode = 'FR';
    if (shipperCountryStr === 'United States' || shipperCountryStr?.toLowerCase() === 'united states' || shipperCountryStr?.toLowerCase() === 'usa') shipperCountryCode = 'US';
    if (shipperCountryStr === 'United Kingdom' || shipperCountryStr?.toLowerCase() === 'united kingdom' || shipperCountryStr?.toLowerCase() === 'uk') shipperCountryCode = 'GB';
    if (shipperCountryStr === 'Canada' || shipperCountryStr?.toLowerCase() === 'canada') shipperCountryCode = 'CA';
    
    if (recipientCountryStr === 'France' || recipientCountryStr?.toLowerCase() === 'france') recipientCountryCode = 'FR';
    if (recipientCountryStr === 'United States' || recipientCountryStr?.toLowerCase() === 'united states' || recipientCountryStr?.toLowerCase() === 'usa') recipientCountryCode = 'US';
    if (recipientCountryStr === 'United Kingdom' || recipientCountryStr?.toLowerCase() === 'united kingdom' || recipientCountryStr?.toLowerCase() === 'uk') recipientCountryCode = 'GB';
    if (recipientCountryStr === 'Canada' || recipientCountryStr?.toLowerCase() === 'canada') recipientCountryCode = 'CA';
    
    // Validate country codes - ensure they are exactly 2 characters
    // If not valid, default to US to prevent API errors
    if (!shipperCountryCode || shipperCountryCode.length !== 2) {
      console.warn(`Invalid shipper country code: "${shipperCountryCode}", defaulting to US`);
      shipperCountryCode = 'US';
    }
    
    if (!recipientCountryCode || recipientCountryCode.length !== 2) {
      console.warn(`Invalid recipient country code: "${recipientCountryCode}", defaulting to US`);
      recipientCountryCode = 'US';
    }
    
    // Force uppercase for country codes
    shipperCountryCode = shipperCountryCode.toUpperCase() as CountryCode;
    recipientCountryCode = recipientCountryCode.toUpperCase() as CountryCode;
    
    // Print debug information
    console.log(`Creating shipment with tracking service code: ${formData.serviceCode}`);
    console.log(`Using dimensions (cm): ${cmLength} x ${cmWidth} x ${cmHeight}`);
    console.log(`Using weight (kg): ${kgWeight}`);
    console.log(`Shipment date: ${shipmentDate}`);
    console.log(`Shipper address: ${formData.shipperAddress}, ${formData.shipperCity}, ${formData.shipperState} ${formData.shipperZip}, ${shipperCountryCode}`);
    console.log(`Recipient address: ${formData.recipientAddress}, ${formData.recipientCity}, ${formData.recipientState} ${formData.recipientZip}, ${recipientCountryCode}`);
    
    // Verify country codes are valid ISO codes
    console.log(`Validated country codes - Shipper: ${shipperCountryCode}, Recipient: ${recipientCountryCode}`);
    
    // For international shipments, handle special requirements
    const isInternationalShipment = shipperCountryCode !== recipientCountryCode;
    console.log(`International shipment: ${isInternationalShipment}`);
    
    // For Ground shipments going to international destinations, change to Worldwide Expedited
    let serviceCode = formData.serviceCode;
    if (isInternationalShipment && serviceCode === '03') {
        console.log('Converting Ground shipment to Worldwide Expedited for international shipping');
        serviceCode = '07'; // Worldwide Expedited
    }
    
    return {
        ShipmentRequest: {
            Request: {
                SubVersion: "1801",
                RequestOption: "nonvalidate",
                TransactionReference: {
                    CustomerContext: `Order #${orderId}`
                }
            },
            Shipment: {
                Description: formData.description.substring(0, 50),
                Shipper: {
                    Name: formData.shipperName,
                    AttentionName: formData.shipperAttention || formData.shipperName,
                    Phone: {
                        Number: formData.shipperPhone
                    },
                    ShipperNumber: formData.accountNumber,
                    Address: {
                        AddressLine: formData.shipperAddress ? [formData.shipperAddress] : [],
                        City: formData.shipperCity,
                        StateProvinceCode: formData.shipperState?.trim() || '', // For US addresses, always include state
                        PostalCode: formData.shipperZip,
                        CountryCode: shipperCountryCode
                    }
                },
                ShipTo: {
                    Name: formData.recipientName,
                    AttentionName: formData.recipientAttention || formData.recipientName,
                    Phone: {
                        Number: formData.recipientPhone
                    },
                    Address: {
                        AddressLine: formData.recipientAddress ? [formData.recipientAddress] : [],
                        City: formData.recipientCity,
                        // Handle state code based on country
                        StateProvinceCode: recipientCountryCode === 'FR' ? '' : (formData.recipientState?.trim() || ''),
                        PostalCode: formData.recipientZip,
                        CountryCode: recipientCountryCode
                    },
                    Residential: "true"
                },
                ShipFrom: {
                    Name: formData.shipperName,
                    AttentionName: formData.shipperAttention || formData.shipperName,
                    Phone: {
                        Number: formData.shipperPhone
                    },
                    Address: {
                        AddressLine: formData.shipperAddress ? [formData.shipperAddress] : [],
                        City: formData.shipperCity,
                        StateProvinceCode: formData.shipperState?.trim() || '', // For US addresses, always include state
                        PostalCode: formData.shipperZip,
                        CountryCode: shipperCountryCode
                    }
                },
                PaymentInformation: {
                    ShipmentCharge: {
                        Type: "01",
                        BillShipper: {
                            AccountNumber: formData.accountNumber
                        }
                    }
                },
                Service: {
                    Code: serviceCode,
                    Description: getServiceName(serviceCode)
                },
                ShipmentRatingOptions: {
                    NegotiatedRatesIndicator: ""
                },
                ShipmentDate: shipmentDate,
                Package: {
                    Description: formData.description.substring(0, 50),
                    Packaging: {
                        Code: "02",
                        Description: "Package"
                    },
                    Dimensions: {
                        UnitOfMeasurement: {
                            Code: "CM",
                            Description: "Centimeters"
                        },
                        Length: cmLength,
                        Width: cmWidth,
                        Height: cmHeight
                    },
                    PackageWeight: {
                        UnitOfMeasurement: {
                            Code: "KGS",
                            Description: "Kilograms"
                        },
                        Weight: kgWeight
                    }
                }
            },
            LabelSpecification: {
                LabelImageFormat: {
                    Code: "GIF",
                    Description: "GIF"
                },
                HTTPUserAgent: "Mozilla/5.0"
            }
        }
    };
  };
  
  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Check if this is an international shipment
    const isInternationalShipment = formData.shipperCountry !== formData.recipientCountry;
    
    // Validate service code for international shipments
    if (isInternationalShipment && formData.serviceCode === '03') {
        setError('UPS Ground service is not available for international shipments. Please select an international shipping service like Worldwide Express or Expedited.');
        setLoading(false);
        return;
    }
    
    // Additional validation for country codes
    if (!formData.recipientCountry || formData.recipientCountry.trim() === '') {
      setError('Recipient country is required. Please select a valid country.');
      setLoading(false);
      return;
    }
    
    if (!formData.shipperCountry || formData.shipperCountry.trim() === '') {
      setError('Shipper country is required. Please select a valid country.');
      setLoading(false);
      return;
    }
    
    // Validate required fields before sending
    const requiredFields = [
      { name: 'shipperName', label: 'Shipper Name' },
      { name: 'shipperAddress', label: 'Shipper Address' },
      { name: 'shipperCity', label: 'Shipper City' },
      { name: 'shipperState', label: 'Shipper State' },
      { name: 'shipperZip', label: 'Shipper ZIP Code' },
      { name: 'shipperPhone', label: 'Shipper Phone' },
      { name: 'accountNumber', label: 'UPS Account Number' },
      { name: 'recipientName', label: 'Recipient Name' },
      { name: 'recipientAddress', label: 'Recipient Address' },
      { name: 'recipientCity', label: 'Recipient City' },
      { name: 'recipientState', label: 'Recipient State' },
      { name: 'recipientZip', label: 'Recipient ZIP Code' },
      { name: 'recipientPhone', label: 'Recipient Phone' }
    ];
    
    // Check for empty required fields
    const missingFields = requiredFields.filter(field => {
      const value = formData[field.name as keyof typeof formData]; 
      return !value;
    });
    if (missingFields.length > 0) {
      setError(`Please complete all required fields: ${missingFields.map(f => f.label).join(', ')}`);
      setLoading(false);
      return;
    }
    
    try {
      const data = prepareShipmentData();
      
      // Log the data being sent to the API
      console.log('Sending shipment data to API:', JSON.stringify(data, null, 2));
      
      const response = await createShipment(data);
      
      console.log('Received response from UPS shipment API:', response);
      
      if (response.ShipmentResponse && response.ShipmentResponse.ShipmentResults) {
        setShipmentData(response.ShipmentResponse.ShipmentResults);
        
        // Set tracking number from the response
        if (response.ShipmentResponse.ShipmentResults.ShipmentIdentificationNumber) {
          setTrackingNumber(response.ShipmentResponse.ShipmentResults.ShipmentIdentificationNumber);
        }
        
        // Call the parent handler with the label data
        onLabelGenerated(response.ShipmentResponse.ShipmentResults);
        
        setStep('pickup');
      } else {
        throw new Error('Invalid response format from shipping API');
      }
    } catch (err) {
      console.error('Error details:', err);
      let errorMessage = err instanceof Error ? err.message : 'Failed to create shipment';
      
      // Special case check for UPS account number 724114
      if (formData.accountNumber === '724114' && formData.shipperCountry !== 'FR') {
        errorMessage = 'The UPS account number 724114 is only valid for shipments from France. Please ensure your shipper address is in France.';
        setError(errorMessage);
        return;
      }
      
      // Provide more helpful error messages
      if (errorMessage.includes('400')) {
        // Check if it's an international shipment
        if (isInternationalShipment) {
          errorMessage = 'International shipping error: Please verify all required fields for international shipping. Make sure the country codes are correct and the service type supports international delivery.';
          
          // Add country-specific suggestions
          if (formData.recipientCountry === 'FR' || formData.recipientCountry === 'France') {
            errorMessage += ' For shipments to France, ensure you have selected an international shipping service like Worldwide Express (07) or Expedited (08).';
          }
        } else {
          errorMessage = 'The UPS API rejected the request. Please verify all shipping information is complete and valid. Check that the shipment date is valid and all addresses are formatted correctly.';
        }
      }
      
      // Check for specific UPS API error messages
      if (errorMessage.includes('UPS API Error')) {
        // Format and display the UPS error in a more readable way
        if (errorMessage.includes('Ship To country must match destination country')) {
          errorMessage = 'The recipient country in your shipping details does not match the destination country. Please verify the recipient country is correct.';
        } else if (errorMessage.includes('ShipmentDate')) {
          errorMessage = 'Invalid shipment date. Please ensure the shipment date is not in the past or too far in the future.';
        } else if (errorMessage.includes('RateAccountNumber')) {
          errorMessage = 'There is an issue with the UPS account number. Please verify the account number (724114) is correct and enabled for this type of shipment.';
        } else if (errorMessage.includes('Address')) {
          errorMessage = 'The UPS API could not validate one of the addresses. Please ensure both sender and recipient addresses are complete and correctly formatted.';
        } else if (errorMessage.includes('120120') || errorMessage.includes('Shipper\'s ShipperNumber must be the same as the shipments Shipper\'s country')) {
          errorMessage = 'The UPS account number 724114 is only valid for shipments from France. Please ensure your shipper address is in France.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const getServiceName = (code: string) => {
    switch (code) {
      case '01': return 'Next Day Air';
      case '02': return '2nd Day Air';
      case '03': return 'Ground';
      case '07': return 'Worldwide Express';
      case '08': return 'Worldwide Expedited';
      case '11': return 'Standard';
      case '54': return 'Worldwide Express Plus';
      case '65': return 'UPS Saver';
      default: return 'Unknown';
    }
  };
  
  const handleGetPickupRates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate required address fields
      if (!formData.shipperAddress || !formData.shipperCity || !formData.shipperState || !formData.shipperZip) {
        setError('Shipper address information is incomplete. Please fill in all required address fields.');
        setLoading(false);
        return;
      }
      
      // Create proper pickup rate request format per UPS API docs
      const pickupData = {
        PickupRateRequest: {
          Request: {
            RequestOption: "1",
            TransactionReference: {
              CustomerContext: `Order #${orderId}`
            }
          },
          ShipperAccount: {
            AccountNumber: formData.accountNumber,
            AccountCountryCode: formData.shipperCountry
          },
          PickupAddress: {
            AddressLine: formData.shipperAddress,
            City: formData.shipperCity,
            StateProvince: formData.shipperCountry === 'FR' ? '' : (formData.shipperState?.trim() || ''),
            PostalCode: formData.shipperZip,
            CountryCode: formData.shipperCountry,
            ResidentialIndicator: "N"
          },
          AlternateAddressIndicator: "N",
          ServiceDateOption: "02", // Future-Day Pickup
          PickupDateInfo: {
            CloseTime: "1700",
            ReadyTime: "1000",
            PickupDate: new Date().toISOString().split('T')[0].replace(/-/g, '')
          }
        }
      };
      
      console.log('Sending pickup rate request:', JSON.stringify(pickupData, null, 2));
      
      const response = await getPickupRates(pickupData);
      
      console.log('Pickup rate response received:', response);
      
      // Handle the new response format
      if (response.PickupRateResponse && response.PickupRateResponse.RateResult) {
        const rateResult = response.PickupRateResponse.RateResult;
        
        // Create a standardized format for our UI
        const standardizedRate = {
          ServiceType: rateResult.RateType || 'FD',
          MonetaryValue: rateResult.GrandTotalOfAllCharge || '0.00',
          CurrencyCode: rateResult.CurrencyCode || 'USD',
          ServiceName: 'UPS Pickup Service',
          ReadyTime: '10:00',
          PickupTime: '17:00'
        };
        
        setPickupOptions([standardizedRate]);
      } else {
        throw new Error('Invalid response format from pickup rate API');
      }
    } catch (err) {
      console.error('Error in handleGetPickupRates:', err);
      setError(err instanceof Error ? err.message : 'Failed to get pickup rates');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreatePickup = async () => {
    if (!selectedPickup) {
      setError('Please select a pickup option');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Validate required fields before sending
    if (!formData.shipperPhone || formData.shipperPhone.trim() === '') {
      setError('A valid phone number is required for UPS pickup requests');
      setLoading(false);
      return;
    }
    
    try {
      // Ensure proper country code format for destination country
      let destinationCountryCode = formData.recipientCountry;
      // Fix for common country name issues - ensure we use ISO codes
      if (destinationCountryCode === 'France') destinationCountryCode = 'FR';
      if (destinationCountryCode === 'United States') destinationCountryCode = 'US';
      if (destinationCountryCode === 'United Kingdom') destinationCountryCode = 'GB';
      if (destinationCountryCode === 'Canada') destinationCountryCode = 'CA';
      
      // Default phone number if empty (UPS requires a phone number)
      const phoneNumber = formData.shipperPhone.trim() || '5555555555';
      
      const pickupCreationData = {
        PickupCreationRequest: {
          Request: {
            RequestOption: "1",
            TransactionReference: {
              CustomerContext: `Order #${orderId}`
            }
          },
          RatePickupIndicator: "Y",
          Shipper: {
            Account: {
              AccountNumber: formData.accountNumber,
              AccountCountryCode: formData.shipperCountry
            }
          },
          PickupDateInfo: {
            CloseTime: "1700",
            ReadyTime: "1000",
            PickupDate: new Date().toISOString().split('T')[0].replace(/-/g, '')
          },
          PickupAddress: {
            CompanyName: formData.shipperName,
            ContactName: formData.shipperAttention || formData.shipperName,
            Address: {
              AddressLine: formData.shipperAddress,
              City: formData.shipperCity,
              StateProvince: formData.shipperCountry === 'FR' ? '' : (formData.shipperState?.trim() || ''),
              PostalCode: formData.shipperZip,
              CountryCode: formData.shipperCountry
            },
            Phone: {
              Number: phoneNumber
            }
          },
          AlternateAddressIndicator: "N",
          PickupPiece: [
            {
              ServiceCode: formData.serviceCode,
              Quantity: "1",
              DestinationCountryCode: destinationCountryCode,
              ContainerCode: "02"
            }
          ],
          TotalWeight: {
            Weight: formData.packageWeight,
            UnitOfMeasurement: "LBS"
          },
          OverweightIndicator: "N",
          PaymentMethod: "01",
          SpecialInstruction: `Order #${orderId} pickup request`,
          ReferenceNumber: `Order #${orderId}`,
          FreightOptions: {
            FreightPickupFlag: "N"
          }
        }
      };
      
      console.log('Sending pickup creation request:', JSON.stringify(pickupCreationData, null, 2));
      
      const response = await createPickup(pickupCreationData);
      
      if (response.PickupCreationResponse && response.PickupCreationResponse.PRN) {
        // Successfully created pickup
        setStep('complete');
      } else {
        throw new Error('Invalid response format from pickup creation API');
      }
    } catch (err) {
      console.error('Error creating pickup:', err);
      let errorMessage = err instanceof Error ? err.message : 'Failed to create pickup';
      
      // Try to provide more specific error messages
      if (typeof errorMessage === 'string') {
        if (errorMessage.includes('Phone')) {
          errorMessage = 'UPS requires a valid phone number for pickup. Please enter a phone number.';
        } else if (errorMessage.includes('Country')) {
          errorMessage = 'There was an issue with the country code. Please ensure all country codes are valid.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Display the Current Seller Address section with seller information
  const renderSellerAddressInfo = () => {
    if (defaultAddress) {
      return (
        <div className="text-sm text-gray-600">
          <div className="flex items-center mb-2">
            <div className="bg-blue-100 p-2 rounded-full mr-3">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <strong>Default Address</strong>
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                Default
              </span>
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded border border-gray-200 mt-2">
            <p>
              {sellerInfo?.firstName} {sellerInfo?.lastName}<br />
              {defaultAddress.street}<br />
              {defaultAddress.city}, {defaultAddress.state} {defaultAddress.postalCode}<br />
              {defaultAddress.country}
            </p>
          </div>
          
          <div className="mt-3 text-xs font-medium text-blue-600 p-2 bg-blue-50 rounded border border-blue-100">
            Your default address information has been pre-filled in the form above.
          </div>
        </div>
      );
    }
    
    // Fall back to seller info if no default address
    if (!sellerInfo) {
      return (
        <p className="text-sm text-gray-600">
          {formData.shipperName}<br />
          {formData.shipperAddress}<br />
          {formData.shipperCity}, {formData.shipperState} {formData.shipperZip}<br />
          {formData.shipperCountry}<br />
          Phone: {formData.shipperPhone}
        </p>
      );
    }
    
    return (
      <div className="text-sm text-gray-600">
        <div className="flex items-center mb-2">
          {sellerInfo.banner && (
            <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-100 flex-shrink-0">
              <img 
                src={sellerInfo.banner} 
                alt={sellerInfo.name || sellerInfo.storeName} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).onerror = null;
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100';
                }}
              />
            </div>
          )}
          <div>
            <strong>{sellerInfo.storeName || `${sellerInfo.firstName} ${sellerInfo.lastName}`}</strong>
            {sellerInfo.role === 'seller' && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                Seller
              </span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-2 mt-3">
          {sellerInfo.email && (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {sellerInfo.email}
            </div>
          )}
          
          {sellerInfo.phone && (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {sellerInfo.countryCode} {sellerInfo.phone}
            </div>
          )}
          
          {sellerInfo.location && (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {sellerInfo.location}
            </div>
          )}
        </div>
        
        <div className="mt-3 text-xs font-medium text-blue-600 p-2 bg-blue-50 rounded border border-blue-100">
          Note: The seller information has been pre-filled in the form above. Please ensure all address details are complete for shipping.
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Shipping Management</h3>
      </div>
      
      <div className="p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        {addressError && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
            {addressError}
          </div>
        )}
        
        {/* Debug information for development */}
        {/* {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-gray-100 border border-gray-300 text-gray-700 text-xs rounded">
            <h4 className="font-bold">Debug Info:</h4>
            <ul>
              <li>Default Address Loaded: {defaultAddress ? 'Yes' : 'No'}</li>
              <li>Default Address Applied: {addressApplied ? 'Yes' : 'No'}</li>
              <li>Address Street: {defaultAddress?.street || 'None'}</li>
              <li>Form Address: {formData.shipperAddress || 'Empty'}</li>
              <li>Seller Info: {sellerInfo ? 'Loaded' : 'Not loaded'}</li>
              <li>Order Details: {orderDetails ? 'Available' : 'Not available'}</li>
            </ul>
          </div>
        )} */}
        
        {/* Add a reset button for the address */}
        {/* <div className="mb-4">
          <button 
            type="button"
            onClick={resetAddressData}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Address Data
          </button>
        </div> */}
        
        {addressLoading && (
          <div className="mb-4 flex items-center text-blue-600">
            <Loader className="animate-spin h-4 w-4 mr-2" />
            Loading your default address...
          </div>
        )}
        
        {trackingNumber && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <Package className="h-6 w-6 text-blue-500 mr-3" />
              <div>
                <h4 className="text-md font-medium text-gray-900">Tracking Number</h4>
                <p className="text-sm text-gray-600">{trackingNumber}</p>
              </div>
            </div>
          </div>
        )}
        
        {step === 'shipping' && (
          <form onSubmit={handleCreateShipment}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Shipper Information</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      name="shipperName"
                      value={formData.shipperName}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Attention Name</label>
                    <input
                      type="text"
                      name="shipperAttention"
                      value={formData.shipperAttention}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      name="shipperAddress"
                      value={formData.shipperAddress}
                      onChange={handleInputChange}
                      required
                      className={`w-full border ${defaultAddress ? 'border-emerald-300 bg-emerald-50' : 'border-gray-300'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                      placeholder={addressLoading ? "Loading address..." : ""}
                    />
                    {defaultAddress && defaultAddress.street && (
                      <p className="mt-1 text-xs text-emerald-600">Loaded from your default address</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        name="shipperCity"
                        value={formData.shipperCity}
                        onChange={handleInputChange}
                        required
                        className={`w-full border ${defaultAddress ? 'border-emerald-300 bg-emerald-50' : 'border-gray-300'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        placeholder={addressLoading ? "Loading..." : ""}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        name="shipperState"
                        value={formData.shipperState}
                        onChange={handleInputChange}
                        required
                        className={`w-full border ${defaultAddress ? 'border-emerald-300 bg-emerald-50' : 'border-gray-300'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        placeholder={addressLoading ? "Loading..." : ""}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                      <input
                        type="text"
                        name="shipperZip"
                        value={formData.shipperZip}
                        onChange={handleInputChange}
                        required
                        className={`w-full border ${defaultAddress ? 'border-emerald-300 bg-emerald-50' : 'border-gray-300'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                        placeholder={addressLoading ? "Loading..." : ""}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <select
                        name="shipperCountry"
                        value={formData.shipperCountry}
                        onChange={handleInputChange}
                        required
                        className={`w-full border ${defaultAddress ? 'border-emerald-300 bg-emerald-50' : 'border-gray-300'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                      >
                        <option value="">Select a country</option>
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="FR">France</option>
                        <option value="GB">United Kingdom</option>
                      </select>
                      <p className="mt-1 text-xs text-blue-600">
                        UPS Account 724114 is for France-based shippers only. Your shipper country MUST be set to FR.
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      name="shipperPhone"
                      value={formData.shipperPhone}
                      onChange={handleInputChange}
                      required
                      placeholder="Required for UPS pickups"
                      pattern="[0-9]{10,15}"
                      title="Phone number must be between 10-15 digits with no spaces or special characters"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="mt-1 text-xs text-blue-600">
                      Valid phone number is required for UPS pickups (10+ digits, no spaces or special characters)
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UPS Account Number</label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="mt-1 text-xs text-blue-600">
                      Account 724114 is for France-based shippers only. Your shipper country MUST be set to FR.
                    </p>
                  </div>
                </div>
                
                {/* Update the Seller Address Information display */}
                <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Current Address Information</h5>
                  {renderSellerAddressInfo()}
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Recipient Information</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      name="recipientName"
                      value={formData.recipientName}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Attention Name</label>
                    <input
                      type="text"
                      name="recipientAttention"
                      value={formData.recipientAttention}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      name="recipientAddress"
                      value={formData.recipientAddress}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        name="recipientCity"
                        value={formData.recipientCity}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        name="recipientState"
                        value={formData.recipientState}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                      <input
                        type="text"
                        name="recipientZip"
                        value={formData.recipientZip}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <select
                        name="recipientCountry"
                        value={formData.recipientCountry}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select a country</option>
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="FR">France</option>
                        <option value="GB">United Kingdom</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      name="recipientPhone"
                      value={formData.recipientPhone}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                
                <h4 className="text-md font-medium text-gray-900 mt-6 mb-4">Package Information</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</label>
                      <input
                        type="number"
                        name="packageWeight"
                        value={formData.packageWeight}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                      <select
                        name="serviceCode"
                        value={formData.serviceCode}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="03">Ground</option>
                        <option value="02">2nd Day Air</option>
                        <option value="01">Next Day Air</option>
                        <option value="07">Worldwide Express</option>
                        <option value="08">Worldwide Expedited</option>
                        <option value="11">Standard</option>
                        <option value="54">Worldwide Express Plus</option>
                        <option value="65">UPS Saver</option>
                      </select>
                      {formData.shipperCountry !== formData.recipientCountry && (
                        <p className="mt-1 text-xs text-blue-600">
                          International shipment detected. Please use Worldwide Express (07) or another international service.
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Length (in)</label>
                      <input
                        type="number"
                        name="packageLength"
                        value={formData.packageLength}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Width (in)</label>
                      <input
                        type="number"
                        name="packageWidth"
                        value={formData.packageWidth}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Height (in)</label>
                      <input
                        type="number"
                        name="packageHeight"
                        value={formData.packageHeight}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Creating Shipment...
                  </>
                ) : (
                  <>Create Shipment</>
                )}
              </button>
            </div>
          </form>
        )}
        
        {step === 'pickup' && shipmentData && (
          <div className="mt-6">
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center mb-3">
                <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                <h4 className="text-md font-medium text-green-800">Shipment Created Successfully</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-700 font-medium">Tracking Number:</p>
                  <p className="text-gray-900">{shipmentData.ShipmentIdentificationNumber}</p>
                </div>
                <div>
                  <p className="text-gray-700 font-medium">Service:</p>
                  <p className="text-gray-900">{getServiceName(formData.serviceCode)}</p>
                </div>
                <div>
                  <p className="text-gray-700 font-medium">Shipping Cost:</p>
                  <p className="text-gray-900">
                    ${shipmentData.ShipmentCharges?.TotalCharges?.MonetaryValue || 'N/A'} 
                    {shipmentData.ShipmentCharges?.TotalCharges?.CurrencyCode}
                  </p>
                </div>
                <div>
                  <p className="text-gray-700 font-medium">Delivery Date:</p>
                  <p className="text-gray-900">{shipmentData.ScheduledDeliveryDate || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setStep('complete')}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 mr-3"
            >
              Continue to Completion
            </button>
          </div>
        )}
        
        {step === 'complete' && (
          <div className="mt-6">
            <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">Shipment Process Completed</h3>
              <p className="text-green-700 mb-4">
                Your shipment has been created successfully with tracking number: <br />
                <span className="font-semibold">{trackingNumber}</span>
              </p>
              <p className="text-sm text-gray-600">
                The tracking information has been updated for this order. You can now track the package's journey.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShippingForm; 