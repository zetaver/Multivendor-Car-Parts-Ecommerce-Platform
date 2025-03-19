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
    throw new Error('Authentication token not found. Please log in.');
  }
  return token;
};

// API functions
export const getConversations = async (archived: boolean = false): Promise<Conversation[]> => {
  const token = getAuthToken();
  
  try {
    const response = await axios.get(`${API_URL}/api/messages/conversations?archived=${archived}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

export const createConversation = async (
  participantId: string,
  productId?: string,
  initialMessage?: string
): Promise<Conversation> => {
  const token = getAuthToken();
  
  try {
    const response = await axios.post(
      `${API_URL}/api/messages/conversations`,
      { 
        participantId: participantId || undefined, 
        productId, 
        initialMessage 
      },
      { 
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true 
      }
    );
    return response.data;
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
    console.error('Error marking messages as read:', error);
    throw error;
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