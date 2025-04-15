import { API_URL } from '../config';

// We need to make changes to avoid direct localStorage access for tokens

// Function to create a payment intent
export const createPaymentIntent = async (amount: number, currency = 'eur', authToken?: string) => {
  try {
    const token = authToken || localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_URL}/api/payments/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to cents
        currency
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create payment intent');
    }

    return await response.json();
  } catch (error) {
    console.error('Payment intent creation error:', error);
    throw error;
  }
}; 