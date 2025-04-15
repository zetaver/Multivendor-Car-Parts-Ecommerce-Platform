import axios from 'axios';
import { API_URL } from '../config';
import { socketService } from './socket';

// Types
export interface Participant {
  _id: string;
  name: string;
  firstName: string;
  lastName: string;
  avatar: string;
  email: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: Participant;
  receiver: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  participants: Participant[];
  lastMessage?: Message;
  product?: {
    _id: string;
    title: string;
    images: string[];
    price: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
}

export interface PaginatedMessages {
  messages: Message[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Helper function to get token
const getAuthToken = (): string => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    console.error('Authentication token not found. User may need to log in again.');
    throw new Error('Authentication required. Please log in to view messages.');
  }
  return token;
};

// Helper function to create API request headers
const createAuthHeaders = () => {
  const token = getAuthToken();
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    withCredentials: true
  };
};

// API functions
export const getConversations = async (archived: boolean = false): Promise<Conversation[]> => {
  try {
    // Check for token before making API call
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('Authentication token not found when fetching conversations');
      throw new Error('Authentication required. Please log in to view messages.');
    }

    // Log the request being made
    console.log(`Fetching conversations with archived=${archived}`);
    console.log(`API URL: ${API_URL}/api/messages/conversations?archived=${archived}`);
    
    // Use fetch instead of axios for more control over the request
    const response = await fetch(`${API_URL}/api/messages/conversations?archived=${archived}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    // Log response status
    console.log(`Conversations API response status: ${response.status}`);
    
    // Handle non-2xx responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from conversations API:', errorText);
      
      if (response.status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      } else {
        throw new Error(`Failed to fetch conversations: ${response.status} ${response.statusText}`);
      }
    }
    
    // Parse the response
    const data = await response.json();
    console.log(`Successfully fetched ${data.length || 0} conversations`);
    return data;
  } catch (error: any) {
    // Improved error handling with more details
    console.error('Error fetching conversations:', error);
    
    // Check if it's a network error
    if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
      console.error('Network error when fetching conversations - check API connectivity');
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    
    throw error;
  }
};

export const getConversationById = async (conversationId: string): Promise<Conversation> => {
  const token = getAuthToken();
  
  try {
    const response = await axios.get(`${API_URL}/api/messages/conversations/${conversationId}/info`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching conversation with ID ${conversationId}:`, error);
    throw error;
  }
};

export const createConversation = async (
  recipientId: string,
  productId: string,
  content: string,
  metadata?: any
): Promise<Conversation> => {
  try {
    const token = getAuthToken();
    // Get the proper endpoint URL from your API
    const response = await fetch(`${API_URL}/api/messages/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        participantId: recipientId, // Changed from recipientId to match server expectations
        productId,
        initialMessage: content,
        metadata: metadata || undefined
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Conversation creation failed:', errorData);
      throw new Error(`Failed to create conversation: ${response.status} ${errorData}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

export const getMessages = async (
  conversationId: string,
  page = 1,
  limit = 20
): Promise<PaginatedMessages> => {
  const token = getAuthToken();
  
  try {
    const response = await axios.get(
      `${API_URL}/api/messages/conversations/${conversationId}?page=${page}&limit=${limit}`,
      { 
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true 
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

export const sendMessage = async (
  conversationId: string,
  content: string
): Promise<Message> => {
  const token = getAuthToken();
  
  try {
    const response = await axios.post(
      `${API_URL}/api/messages/conversations/${conversationId}`,
      { content },
      { 
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true 
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const markAsRead = async (conversationId: string): Promise<{ message: string; count: number }> => {
  const token = getAuthToken();
  
  try {
    // Log the endpoint we're trying to access
    console.log(`Marking messages as read for conversation: ${conversationId}`);
    
    // Socket-based marking as read - socket works even if API endpoint is different
    socketService.markMessagesAsRead(conversationId);
    
    // Check if conversation exists before making API call
    try {
      // API-based marking as read
      const response = await axios.put(
        `${API_URL}/api/messages/conversations/${conversationId}/read`,
        {},
        { 
          headers: {
            Authorization: `Bearer ${token}`
          },
          withCredentials: true 
        }
      );
      return response.data;
    } catch (error) {
      // Using socket marking only if the API endpoint doesn't exist
      console.log('API endpoint for marking as read failed, using socket only');
      return { message: 'Messages marked as read via socket', count: 0 };
    }
  } catch (error) {
    console.error('Error marking messages as read:', error);
    // Silently fail but still return something valid so the UI doesn't break
    return { message: 'Failed to mark as read', count: 0 };
  }
};

export const deleteMessage = async (messageId: string): Promise<{ message: string }> => {
  const token = getAuthToken();
  
  try {
    const response = await axios.delete(
      `${API_URL}/api/messages/messages/${messageId}`,
      { 
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true 
      }
    );
    
    // Emit socket event for real-time update
    socketService.emitMessageDelete(messageId, response.data.conversationId);
    
    return response.data;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

export const getUnreadCount = async (): Promise<{ unreadCount: number }> => {
  const token = getAuthToken();
  
  try {
    const response = await axios.get(
      `${API_URL}/api/messages/unread-count`,
      { 
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true 
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};

export const archiveConversation = async (conversationId: string, archive: boolean = true): Promise<{ message: string }> => {
  const token = getAuthToken();
  
  try {
    const endpoint = archive 
      ? `${API_URL}/api/messages/conversations/${conversationId}/archive`
      : `${API_URL}/api/messages/conversations/${conversationId}/restore`;
      
    const response = await axios.put(
      endpoint,
      {},
      { 
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true 
      }
    );

    // Emit socket event for real-time update
    socketService.emitConversationArchive(conversationId, archive);
    
    return response.data;
  } catch (error) {
    console.error(`Error ${archive ? 'archiving' : 'restoring'} conversation:`, error);
    throw error;
  }
};

export const restoreConversation = async (conversationId: string): Promise<{ message: string }> => {
  return archiveConversation(conversationId, false);
};

export const deleteConversation = async (conversationId: string): Promise<void> => {
  const token = getAuthToken();

  try {
    const response = await axios.delete(
      `${API_URL}/api/messages/conversations/${conversationId}`, // Corrected endpoint
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );

    if (!response.status.toString().startsWith('2')) {
      throw new Error('Failed to delete conversation');
    }
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
};

// Update offer status (accepted, declined, completed)
export const updateOfferStatus = async (
  conversationId: string, 
  offerId: string, 
  status: 'accepted' | 'declined' | 'completed',
  orderReference?: string
): Promise<any> => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${API_URL}/api/messages/conversations/${conversationId}/offer-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        offerId,
        status,
        orderReference
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Error updating offer status: ${text}`);
      throw new Error(`Failed to update offer status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error in updateOfferStatus:', error);
    throw error;
  }
};