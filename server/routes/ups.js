const express = require('express');
const axios = require('axios');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// Proxy endpoint to get UPS API token
router.post('/token', async (req, res) => {
  try {
    console.log('Processing UPS token request');
    
    // UPS API credentials (in production, these should be in environment variables)
    const clientId = 'vXlzNZLGL3h8RL6FJCGZh4hzSY3ijkU05Tw7anG8edB0uIe1';
    const clientSecret = 'Gx5wMoNyrilyoWmTdzp4zFpNSk5K1tVlznd5NYfrVNW7XjHM9B3IWOptGAb4cFdr';
    
    // Create Basic Auth credentials
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    // Make request to UPS OAuth endpoint
    const response = await axios({
      method: 'POST',
      url: 'https://wwwcie.ups.com/security/v1/oauth/token',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-merchant-id': '123456' // Replace with your actual UPS merchant ID
      },
      data: 'grant_type=client_credentials'
    });
    
    // Return the token response
    res.json(response.data);
    
  } catch (error) {
    console.error('Error proxying UPS token request:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to get UPS access token',
      error: error.response?.data || error.message
    });
  }
});

// Proxy endpoint for UPS location search
router.post('/locations/search', authenticate, async (req, res) => {
  try {
    const { accessToken, params } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Create properly formatted request body according to UPS API docs
    const requestBody = {
      LocatorRequest: {
        Request: {
          TransactionReference: {
            CustomerContext: "testing"
          },
          RequestAction: "Locator"
        },
        OriginAddress: {
          AddressKeyFormat: {
            AddressLine: params.address,
            PoliticalDivision2: params.city,
            PoliticalDivision1: params.state,
            PostcodePrimaryLow: params.postalCode,
            PostcodeExtendedLow: params.postalCode,
            CountryCode: "US"
          },
          MaximumListSize: "10"
        },
        Translate: {
          LanguageCode: "eng",
          Locale: "en_US"
        },
        UnitOfMeasurement: {
          Code: "MI"
        },
        LocationSearchCriteria: {
          SearchOption: [
            {
              OptionType: {
                Code: "01"
              },
              OptionCode: {
                Code: "001"
              }
            }
          ],
          MaximumListSize: "10",
          SearchRadius: "75"
        },
        SortCriteria: {
          SortType: "01"
        }
      }
    };

    const response = await axios({
      method: 'POST',
      url: 'https://wwwcie.ups.com/api/locations/v3/search/availabilities/8',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'transId': new Date().getTime().toString(),
        'transactionSrc': 'testing'
      },
      params: {
        Locale: 'en_US'
      },
      data: requestBody
    });

    // Check if we have a successful response
    if (response.data?.LocatorResponse?.Response?.ResponseStatusCode === "1") {
      const locations = transformUPSLocationsResponse(response.data.LocatorResponse.SearchResults);
      res.json({
        success: true,
        locations: locations
      });
    } else {
      throw new Error('Invalid response from UPS API');
    }

  } catch (error) {
    console.error('Error proxying UPS locations request:', error.response?.data || error);
    
    const errorMessage = error.response?.data?.LocatorResponse?.Response?.ResponseStatusDescription || 
                        error.message || 
                        'Failed to fetch UPS locations';
    
    res.status(error.response?.status || 500).json({
      success: false,
      message: errorMessage,
      error: error.response?.data || error.message
    });
  }
});

// Helper function to transform UPS API response to our format
function transformUPSLocationsResponse(searchResults) {
  if (!searchResults || !searchResults.AvailableLocationAttributes) {
    return [];
  }
  
  // Extract available services from the response
  const availableServices = searchResults.AvailableLocationAttributes
    .flatMap(attr => attr.OptionCode || [])
    .map(option => ({
      code: option.Code,
      name: option.Name,
      description: option.Description
    }));

  // Since the response doesn't include actual locations, we'll create a mock location
  // You might want to make another API call to get actual locations or modify this based on your needs
  return [{
    id: `ups-${Math.random().toString(36).substring(2, 10)}`,
    provider: 'UPS',
    name: 'UPS Store',
    address: '123 Fork rd',
    city: 'Atlanta',
    postalCode: '30005',
    price: 3.99,
    deliveryDays: '2 - 3',
    services: availableServices.map(service => service.name)
  }];
}

// Add tracking endpoint
router.get('/tracking/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    // Get UPS access token
    const token = await getUPSToken();
    
    // Make request to UPS Tracking API
    const response = await axios({
      method: 'GET',
      url: `https://wwwcie.ups.com/api/track/v1/details/${trackingNumber}?locale=en_US&returnSignature=false&returnMilestones=false&returnPOD=false`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'transId': 'string',
        'transactionSrc': 'testing'
      }
    });
    
    // Return the tracking data
    res.json(response.data);
    
  } catch (error) {
    console.error('Error fetching tracking details:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to fetch tracking details',
      error: error.response?.data || error.message
    });
  }
});

// Add Shipments endpoint to create UPS shipments
router.post('/shipments', authenticate, async (req, res) => {
  try {
    const { shipmentData } = req.body;
    
    if (!shipmentData) {
      return res.status(400).json({
        success: false,
        message: 'Shipment data is required'
      });
    }
    
    // Log detailed request info for debugging
    console.log('==== UPS SHIPMENT REQUEST DETAILS ====');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Further validations
    if (!shipmentData.ShipmentRequest || !shipmentData.ShipmentRequest.Shipment) {
      return res.status(400).json({
        success: false,
        message: 'Invalid shipment data format. ShipmentRequest.Shipment is required.'
      });
    }
    
    // Check for required fields
    const shipment = shipmentData.ShipmentRequest.Shipment;
    const requiredFields = [
      'Shipper', 'ShipTo', 'ShipmentDate', 'Service', 'Package'
    ];
    
    const missingFields = requiredFields.filter(field => !shipment[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required shipment fields: ${missingFields.join(', ')}`
      });
    }
    
    console.log('Processing UPS shipment request:', JSON.stringify(shipmentData, null, 2));
    
    // Get UPS access token
    const token = await getUPSToken();
    
    // Make request to UPS Shipments API
    const response = await axios({
      method: 'POST',
      url: 'https://wwwcie.ups.com/api/shipments/v2403/ship',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'transId': new Date().getTime().toString(),
        'transactionSrc': 'testing'
      },
      params: {
        additionaladdressvalidation: '1'
      },
      data: shipmentData
    });
    
    console.log('UPS shipment created successfully');
    
    // Return the shipment data including label
    res.json({
      success: true,
      shipmentResponse: response.data
    });
    
  } catch (error) {
    console.error('Error creating UPS shipment:', error.response?.data || error.message);
    
    // Extract detailed error information to send back to client
    let errorDetails = 'Unknown error';
    let statusCode = error.response?.status || 500;
    
    if (error.response && error.response.data) {
      if (error.response.data.response && error.response.data.response.errors) {
        // UPS specific error format
        errorDetails = error.response.data.response.errors.map(err => 
          `UPS Error: ${err.code} - ${err.message}`
        ).join('; ');
      } else if (error.response.data.error) {
        // Another possible error format
        errorDetails = error.response.data.error;
      } else {
        // Use the full error data
        errorDetails = JSON.stringify(error.response.data);
      }
    } else if (error.message) {
      errorDetails = error.message;
    }
    
    console.log('Sending error details to client:', errorDetails);
    
    res.status(statusCode).json({
      success: false,
      message: 'Failed to create UPS shipment',
      error: errorDetails,
      // Include raw error data for debugging
      rawError: error.response?.data || null
    });
  }
});

// Helper function to get UPS token
async function getUPSToken() {
  const clientId = 'vXlzNZLGL3h8RL6FJCGZh4hzSY3ijkU05Tw7anG8edB0uIe1';
  const clientSecret = 'Gx5wMoNyrilyoWmTdzp4zFpNSk5K1tVlznd5NYfrVNW7XjHM9B3IWOptGAb4cFdr';
  
  // Create Basic Auth credentials
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  // Make request to UPS OAuth endpoint
  const response = await axios({
    method: 'POST',
    url: 'https://wwwcie.ups.com/security/v1/oauth/token',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-merchant-id': '123456'
    },
    data: 'grant_type=client_credentials'
  });
  
  return response.data.access_token;
}

// Add Pickup Rate API endpoint
router.post('/pickuprate', authenticate, async (req, res) => {
  try {
    // Log the received data for debugging
    console.log('Received pickup rate request:', JSON.stringify(req.body, null, 2));
    
    // Check if the request body has the PickupRateRequest property
    if (!req.body.PickupRateRequest) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request format: PickupRateRequest is required'
      });
    }
    
    // Validate required fields
    const pickupAddress = req.body.PickupRateRequest.PickupAddress;
    const pickupDateInfo = req.body.PickupRateRequest.PickupDateInfo;
    
    if (!pickupAddress || !pickupAddress.AddressLine || !pickupAddress.City || 
        !pickupAddress.StateProvince || !pickupAddress.PostalCode) {
      return res.status(400).json({
        success: false,
        message: 'Address information is incomplete. Please provide AddressLine, City, StateProvince, and PostalCode.'
      });
    }
    
    if (!pickupDateInfo || !pickupDateInfo.PickupDate || !pickupDateInfo.ReadyTime || !pickupDateInfo.CloseTime) {
      return res.status(400).json({
        success: false,
        message: 'Pickup date information is incomplete. Please provide PickupDate, ReadyTime, and CloseTime.'
      });
    }
    
    // Get UPS access token
    const token = await getUPSToken();
    
    console.log('Sending request to UPS API:', JSON.stringify(req.body, null, 2));
    
    // Make request to UPS Pickup Rate API
    // Format matches the example provided in the docs
    const response = await axios({
      method: 'POST',
      url: 'https://wwwcie.ups.com/api/shipments/v2409/pickup/2929602E9CP',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'transId': new Date().getTime().toString(),
        'transactionSrc': 'testing'
      },
      data: req.body
    });
    
    console.log('UPS API response:', JSON.stringify(response.data, null, 2));
    
    // Return the pickup rate data
    res.json({
      success: true,
      pickupResponse: response.data
    });
    
  } catch (error) {
    console.error('Error getting UPS pickup rates:', error.response?.data || error.message);
    let errorMessage = 'Failed to get UPS pickup rates';
    let errorDetails = error.message;
    
    // Try to extract more specific error information
    if (error.response && error.response.data) {
      if (error.response.data.response && error.response.data.response.errors) {
        errorDetails = error.response.data.response.errors.map(err => 
          `${err.code}: ${err.message}`
        ).join('; ');
      } else if (typeof error.response.data === 'string') {
        errorDetails = error.response.data;
      } else {
        errorDetails = JSON.stringify(error.response.data);
      }
    }
    
    res.status(error.response?.status || 500).json({
      success: false,
      message: errorMessage,
      error: errorDetails
    });
  }
});

// Add Pickup Creation API endpoint
router.post('/pickupcreation', authenticate, async (req, res) => {
  try {
    const { pickupCreationData } = req.body;
    
    // Log the received data for debugging
    console.log('Received pickup creation request:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    if (!pickupCreationData || !pickupCreationData.PickupCreationRequest) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request format: PickupCreationRequest is required'
      });
    }
    
    // Further validation of required fields
    const pickupRequest = pickupCreationData.PickupCreationRequest;
    
    if (!pickupRequest.PickupAddress || !pickupRequest.PickupDateInfo) {
      return res.status(400).json({
        success: false,
        message: 'Required pickup information missing: PickupAddress and PickupDateInfo are required'
      });
    }
    
    // Get UPS access token
    const token = await getUPSToken();
    
    console.log('Sending pickup creation request to UPS API:', JSON.stringify(pickupCreationData, null, 2));
    
    // Make request to UPS Pickup Creation API
    const response = await axios({
      method: 'POST',
      url: 'https://wwwcie.ups.com/api/pickupcreation/v2409/pickup',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'transId': new Date().getTime().toString(),
        'transactionSrc': 'testing'
      },
      data: pickupCreationData
    });
    
    console.log('UPS API pickup creation response:', JSON.stringify(response.data, null, 2));
    
    // Return the pickup creation data
    res.json({
      success: true,
      pickupCreationResponse: response.data
    });
    
  } catch (error) {
    console.error('Error creating UPS pickup:', error.response?.data || error.message);
    
    // Extract more detailed error information if available
    let errorDetails = error.message;
    if (error.response && error.response.data) {
      if (error.response.data.response && error.response.data.response.errors) {
        errorDetails = error.response.data.response.errors.map(err => 
          `${err.code}: ${err.message}`
        ).join('; ');
      } else {
        errorDetails = JSON.stringify(error.response.data);
      }
    }
    
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to create UPS pickup',
      error: errorDetails,
      // Include raw error data for debugging
      rawError: error.response?.data || null
    });
  }
});

// Add Pickup Pending Status API endpoint
router.get('/pickup-status/:prn', authenticate, async (req, res) => {
  try {
    const { prn } = req.params;
    
    // Get account number from header or use default
    const accountNumber = req.headers['x-ups-account-number'] || "724114";
    
    console.log(`Authenticated user: ${req.user._id} (${req.user.email || 'no email'}) for GET /api/ups/pickup-status/${prn}`);
    console.log(`Checking status for pickup: ${prn} with account: ${accountNumber}`);
    
    // Get UPS access token
    const token = await getUPSToken();
    
    // According to UPS API docs, for pickup status:
    // The AccountNumber should be in the header
    // API path should directly include the PRN in the URL
    const response = await axios({
      method: 'GET',
      url: `https://wwwcie.ups.com/api/shipments/v2409/pickup/${prn}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'transId': new Date().getTime().toString(),
        'transactionSrc': 'testing',
        'AccountNumber': accountNumber
      }
    });
    
    console.log('UPS API pickup status response:', JSON.stringify(response.data, null, 2));
    
    // Return the pickup status data
    res.json({
      success: true,
      pickupStatusResponse: response.data
    });
    
  } catch (error) {
    console.error('Error getting UPS pickup status:', error.response?.data || error.message);
    
    // Extract more detailed error information if available
    let errorDetails = error.message;
    if (error.response && error.response.data) {
      if (error.response.data.response && error.response.data.response.errors) {
        errorDetails = error.response.data.response.errors.map(err => 
          `${err.code}: ${err.message}`
        ).join('; ');
      } else {
        errorDetails = JSON.stringify(error.response.data);
      }
    }
    
    res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to get UPS pickup status',
      error: errorDetails,
      rawError: error.response?.data || null
    });
  }
});

module.exports = router; 