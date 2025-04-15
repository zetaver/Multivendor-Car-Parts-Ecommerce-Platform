import { UPS_API_URL } from '../config';
import { API_URL } from '../config';

// UPS API Authentication
export const getUPSAccessToken = async (forceRefresh = false): Promise<string> => {
  try {
    // Check if we have a valid token in localStorage and not forcing refresh
    const tokenData = localStorage.getItem('ups_token_data');
    if (tokenData && !forceRefresh) {
      const parsedToken = JSON.parse(tokenData);
      const currentTime = Math.floor(Date.now() / 1000);
      
      // If token is still valid (with 5-minute buffer)
      if (parsedToken.expires_at > currentTime + 300) {
        console.log('Using existing UPS token from localStorage');
        return parsedToken.access_token;
      }
    }
    
    // If no token, expired, or forced refresh, get a new one
    console.log('Requesting new UPS access token');
    if (forceRefresh) {
      console.log('Force refreshing token');
      localStorage.removeItem('ups_token_data');
    } else {
      console.log('Token status:', tokenData ? 'Found expired token' : 'No existing token');
    }
    
    // Make API call to our backend proxy instead of directly to UPS
    const response = await fetch(`${API_URL}/api/ups/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `UPS API proxy responded with status: ${response.status}`);
    }
    
    const tokenResponse = await response.json();
    console.log('UPS token response received');
    
    // Calculate expiration timestamp
    const expiresAt = Math.floor(Date.now() / 1000) + parseInt(tokenResponse.expires_in);
    
    // Store token with expiration in localStorage
    const tokenToStore = {
      access_token: tokenResponse.access_token,
      expires_at: expiresAt
    };
    localStorage.setItem('ups_token_data', JSON.stringify(tokenToStore));
    
    return tokenResponse.access_token;
    
  } catch (error) {
    console.error('Error getting UPS access token:', error);
    throw error;
  }
};

export interface UPSLocationSearchParams {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  countryCode: string;
  maxResults?: number;
  searchRadius?: number;
}

export interface PickupLocation {
  id: string;
  provider: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  price: number;
  deliveryDays: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  distance?: string;
  services?: string[];
}

/**
 * Search for UPS pickup locations using the real UPS Locator API
 */
export const searchPickupLocations = async (params: UPSLocationSearchParams): Promise<PickupLocation[]> => {
  try {
    console.log('Searching for pickup locations with params:', params);
    
    // Get UPS access token
    const accessToken = await getUPSAccessToken();
    const userToken = localStorage.getItem('accessToken'); // Get user's auth token
    
    console.log('Successfully obtained UPS access token');

    // Validate required parameters
    if (!params.address || !params.city || !params.postalCode) {
      throw new Error('Address, city, and postal code are required for location search');
    }

    // Call our backend proxy endpoint with both tokens
    const response = await fetch(`${API_URL}/api/ups/locations/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}` // Add user's auth token
      },
      body: JSON.stringify({
        accessToken, // UPS token
        params: {
          ...params,
          maxResults: params.maxResults || 10,
          searchRadius: params.searchRadius || 75
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to fetch locations: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success && Array.isArray(data.locations) && data.locations.length > 0) {
      console.log(`Successfully found ${data.locations.length} pickup locations`);
      return data.locations;
    }

    console.warn('No locations found in response', data);
    return []; // Return empty array instead of throwing error for no locations
  } catch (error) {
    console.error('Error searching for pickup locations:', error);
    throw error;
  }
};

/**
 * Get pickup locations from UPS API
 */
export const getAllPickupLocations = async (params: UPSLocationSearchParams): Promise<PickupLocation[]> => {
  try {
    console.log('Getting all pickup locations with params:', params);
    
    // Get locations from the UPS API
    const locations = await searchPickupLocations(params);
    
    if (locations && locations.length > 0) {
      console.log(`Found ${locations.length} UPS locations`);
      return locations;
    } else {
      console.warn('No UPS locations found');
      return []; // Return empty array for UI to handle
    }
  } catch (error) {
    console.error('Error in getAllPickupLocations:', error);
    throw error;
  }
};

// This transformer is now moved to the server-side for direct response formatting
export const transformUPSLocationsToPickupLocations = (upsLocations: any[]): PickupLocation[] => {
  return upsLocations.map(location => ({
    id: location.LocationID || `ups-${Math.random().toString(36).substring(2, 10)}`,
    provider: 'UPS',
    name: location.LocationName || 'UPS Location',
    address: location.AddressKeyFormat?.AddressLine || '',
    city: location.AddressKeyFormat?.PoliticalDivision2 || '',
    postalCode: location.AddressKeyFormat?.PostcodePrimaryLow || '',
    price: 3.99, // Standard price for UPS locations
    deliveryDays: '2 - 3', // Standard delivery estimate
    coordinates: location.GeoCode ? {
      lat: parseFloat(location.GeoCode.Latitude),
      lng: parseFloat(location.GeoCode.Longitude)
    } : undefined,
    distance: location.Distance ? `${location.Distance.Value} ${location.Distance.UnitOfMeasure.Code}` : undefined,
    services: extractServicesFromLocation(location)
  }));
};

// Helper function to extract services from UPS location data
const extractServicesFromLocation = (location: any): string[] => {
  const services: string[] = [];
  
  // Extract from additional services if available
  if (location.AccessorialServices && Array.isArray(location.AccessorialServices)) {
    location.AccessorialServices.forEach((service: any) => {
      if (service.Description) {
        services.push(service.Description);
      }
    });
  }
  
  // Add other service information if available
  if (location.StdMondayReadyForPickupIndicator === 'Y') {
    services.push('Monday Pickup Available');
  }
  
  return services;
};

export const getTrackingDetails = async (inquiryNumber: string): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/api/ups/tracking/${inquiryNumber}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to fetch tracking details: ${response.statusText}`);
    }

    const data = await response.json();
    return data.trackResponse;
  } catch (error) {
    console.error('Error fetching tracking details:', error);
    throw error;
  }
};

// Create a UPS shipment and generate a label
export const createShipment = async (shipmentData: any): Promise<any> => {
  try {
    const userToken = localStorage.getItem('accessToken');
    
    console.log(`Creating shipment using API URL: ${API_URL}/api/ups/shipments`);
    console.log('Using authentication token:', userToken ? 'Token available' : 'Token missing');
    
    // Add additional logging to trace what's being sent
    console.log('Sending request body:', JSON.stringify({ shipmentData }, null, 2));
    
    // Create an AbortController for timeout control
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout
    
    const response = await fetch(`${API_URL}/api/ups/shipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        shipmentData
      }),
      signal: controller.signal
    });
    
    // Clear the timeout since the request completed
    clearTimeout(timeoutId);

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        console.error('Server returned JSON error:', errorData);
        
        // Extract more detailed error information if available
        let detailedMessage = errorData.message || `Failed to create shipment: ${response.statusText}`;
        
        if (errorData.error) {
          // If there's a specific error message from UPS API, use it
          detailedMessage = `UPS API Error: ${errorData.error}`;
          
          // If we have raw error data, log it for debugging
          if (errorData.rawError) {
            console.error('UPS Raw Error Data:', errorData.rawError);
          }
        }
        
        throw new Error(detailedMessage);
      } else {
        const textError = await response.text();
        console.error('Server returned text error:', textError);
        throw new Error(`Failed to create shipment: ${response.statusText} - ${textError}`);
      }
    }

    const data = await response.json();
    console.log('Received shipment data from server:', data);
    
    if (!data.success) {
      throw new Error(data.message || 'Server returned unsuccessful response');
    }
    
    return data.shipmentResponse;
  } catch (error: any) {
    // Handle AbortController timeout
    if (error.name === 'AbortError') {
      console.error('Request timed out after 30 seconds');
      throw new Error('Request timed out. Please try again.');
    }
    
    console.error('Error creating shipment:', error);
    throw error;
  }
};

// Get pickup rates
export const getPickupRates = async (pickupData: any) => {
  try {
    // Add logging to debug the request
    console.log('Sending pickup rate request with data:', JSON.stringify(pickupData, null, 2));
    
    const response = await fetch(`${API_URL}/api/ups/pickuprate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify(pickupData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed pickup rate response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      throw new Error(errorData.message || `Failed to get pickup rates: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Pickup rate response:', data);
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to get pickup rates');
    }
    
    return data.pickupResponse || {};
  } catch (error) {
    console.error('Error in getPickupRates:', error);
    throw error;
  }
};

// Create a pickup request
export const createPickup = async (pickupData: any) => {
  try {
    const response = await fetch(`${API_URL}/api/ups/createpickup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify(pickupData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to create pickup: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to create pickup');
    }
    
    return data.pickupResponse || {};
  } catch (error) {
    console.error('Error in createPickup:', error);
    throw error;
  }
};

/**
 * Get the status of a pickup request using the PRN (Pickup Reference Number)
 * @param prn The Pickup Reference Number
 * @param accountNumber UPS account number (defaults to "724114")
 * @returns The pickup status information
 */
export const getPickupStatus = async (prn: string, accountNumber: string = "724114"): Promise<any> => {
  try {
    console.log(`Getting status for pickup: ${prn} with account number: ${accountNumber}`);
    
    // Build the URL for the proper endpoint with the PRN
    const url = `${API_URL}/api/ups/pickup-status/${prn}`;
    
    // Make the request with the AccountNumber in the headers
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'X-UPS-Account-Number': accountNumber,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server returned error:', errorData);
      throw new Error(errorData.error || errorData.message || `Failed to get UPS pickup status: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Pickup status response:', data);
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to get UPS pickup status');
    }
    
    return data.pickupStatusResponse || {};
  } catch (error) {
    console.error('Error getting pickup status:', error);
    throw error;
  }
};

/**
 * Translate the pickup status code to a user-friendly message
 * @param statusCode The status code from the UPS API
 * @returns A user-friendly status message
 */
export const getPickupStatusMessage = (statusCode: string): string => {
  const statusMessages: {[key: string]: string} = {
    '001': 'Received at dispatch',
    '002': 'Dispatched to driver',
    '003': 'Order successfully completed',
    '004': 'Order unsuccessfully completed',
    '005': 'Missed commit – Updated ETA supplied by driver',
    '007': 'Cancelled',
    '008': 'Order has invalid order status',
    '012': 'Your pickup request is being processed'
  };
  
  return statusMessages[statusCode] || `Unknown status code: ${statusCode}`;
};