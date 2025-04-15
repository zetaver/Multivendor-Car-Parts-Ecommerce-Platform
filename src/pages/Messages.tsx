import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, Search, Send, Paperclip, MoreVertical, User, Image, Smile, ChevronLeft, Trash2, AlertCircle, Archive, RefreshCw } from 'lucide-react';
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
  archiveConversation,
  getConversationById,
  deleteConversation,
  Conversation as ConversationType,
  Message as MessageType,
  PaginatedMessages,
  updateOfferStatus
} from '../services/messageService';
import { socketService } from '../services/socket';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { API_URL } from '../config';
import ProductMessageCard from '../components/ProductMessageCard';
import OfferCard from '../components/OfferCard';

// Function to format image URLs
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

// Update the ExtendedMessage interface to include debug metadata
interface ExtendedMessage extends MessageType {
  metadata?: {
    offerStatusUpdate?: boolean;
    status?: string;
    originalOfferId?: string;
    orderReference?: string;
    [key: string]: any;
  };
  // Add debugging metadata fields that might be included by server
  _roomDelivery?: string;
  _directDelivery?: boolean;
  _timestamp?: string;
  [key: string]: any; // Allow any additional properties
}

const Messages = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [searchParams] = useSearchParams();
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [isContactingSellerLoading, setIsContactingSellerLoading] = useState(false);
  const [checkoutInProgress, setCheckoutInProgress] = useState<Record<string, boolean>>({});
  const [actedOffers, setActedOffers] = useState<Record<string, string>>({});
  const [completedCheckouts, setCompletedCheckouts] = useState<string[]>([]);

  // Get the conversation ID from URL if available
  const conversationIdFromUrl = searchParams.get('conversation');

  // Fetch conversations on component mount
  useEffect(() => {
    // Add debug logging for initial user state
    console.log('Initial user state in useEffect:', {
      user,
      userEmail: user?.email,
      userId: user?._id,
      isAuthenticated: !!user
    });

    // Check if we have a valid token in localStorage regardless of user state
    const token = localStorage.getItem('accessToken');
    const localStorageUser = localStorage.getItem('user');
    
    if (token && (user || localStorageUser)) {
      fetchConversations();
      
      // Ensure socket connection is established
      if (!socket || !socket.connected) {
        console.log('Initializing socket in Messages component');
        socketService.connect(token);
      }
    } else {
      setError('You need to be logged in to view conversations. Please log in and try again.');
      setLoading(false);
    }

    // Setup socket event handlers
    const setupSocketEvents = () => {
      console.log('Setting up socket event handlers in Messages component');
      
      // Remove any existing handlers to avoid duplicates
      if (socket) {
        socket.off('new-message');
        socket.off('typing-start');
        socket.off('typing-stop');
        socket.off('messages-read');
      }
      
      // Setup handlers through socket context
      if (socket) {
        socket.on('new-message', handleNewMessage);
        socket.on('typing-start', handleTypingStart);
        socket.on('typing-stop', handleTypingStop);
        socket.on('messages-read', handleMessagesRead);
      }
      
      // Also setup handlers through socketService for redundancy
      socketService.onNewMessage(handleNewMessage);
      socketService.onTypingStart(handleTypingStart);
      socketService.onTypingStop(handleTypingStop);
      socketService.onMessagesRead(handleMessagesRead);
    };
    
    setupSocketEvents();

    // Clean up on unmount
    return () => {
      if (socket) {
        socket.off('new-message', handleNewMessage);
        socket.off('typing-start', handleTypingStart);
        socket.off('typing-stop', handleTypingStop);
        socket.off('messages-read', handleMessagesRead);
      }
    };
  }, [socket, user]);

  // Handle conversation selection from URL parameter
  useEffect(() => {
    if (!conversationIdFromUrl || !user) return;
    
    // First check if the conversation from URL exists in our loaded conversations
    const conversationExists = conversations.some(conv => conv._id === conversationIdFromUrl);
    
    if (conversationExists) {
      console.log('Selecting conversation from URL parameter:', conversationIdFromUrl);
      handleChatSelect(conversationIdFromUrl);
      setShowMobileChat(true); // Ensure chat is visible on mobile
    } else if (!loading) {
      // If conversations are loaded but the requested one isn't found, try to fetch it directly
      const fetchConversationById = async () => {
        try {
          console.log('Fetching specific conversation by ID:', conversationIdFromUrl);
          setLoadingMessages(true);
          
          // First get conversation details 
          const targetConversation = await getConversationById(conversationIdFromUrl);
          
          if (targetConversation) {
            // Add this conversation to our state if not already there
            setConversations(prev => {
              if (prev.some(conv => conv._id === conversationIdFromUrl)) {
                return prev;
              }
              return [targetConversation, ...prev];
            });
            
            // Then get messages for this conversation
            const messagesData = await getMessages(conversationIdFromUrl, 1);
            
            // Select this conversation
            setSelectedChat(conversationIdFromUrl);
            setShowMobileChat(true);
            setMessages(messagesData.messages);
            
            // Mark messages as read
            markMessagesAsRead(conversationIdFromUrl);
          } else {
            throw new Error('Conversation not found or you don\'t have access to it');
          }
        } catch (err) {
          console.error('Error fetching specified conversation:', err);
          toast.error('Couldn\'t load the conversation. It may have been deleted or you don\'t have access to it.');
        } finally {
          setLoadingMessages(false);
        }
      };
      
      fetchConversationById();
    }
  }, [conversationIdFromUrl, conversations, loading, user]);

  // Join conversation rooms when conversations change
  useEffect(() => {
    if (socket && conversations.length > 0) {
      console.log('Joining conversation rooms:', conversations.map(conv => conv._id));
      const conversationIds = conversations.map(conv => conv._id);
      
      // Use both the socket context and socketService for redundancy
      socket.emit('join-conversations', conversationIds);
      
      // Also use the socketService explicitly
      socketService.joinConversations(conversationIds);
    }
  }, [socket, conversations]);

  // Mark messages as read when chat is selected
  useEffect(() => {
    if (selectedChat) {
      markMessagesAsRead(selectedChat);
    }
  }, [selectedChat]);

  // Add new effect to track accepted/declined offers in messages
  useEffect(() => {
    // When new messages are loaded, check if any are related to offer status updates
    if (messages.length > 0) {
      messages.forEach(message => {
        // Look for offer status updates in new messages
        if (message.metadata?.offerStatusUpdate) {
          // Update the actedOffers state with the status from the message
          setActedOffers(prev => ({
            ...prev,
            [message.metadata?.originalOfferId || '']: message.metadata?.status || ''
          }));
        }
      });
    }
  }, [messages]);

  // Add this new useEffect to load completed checkouts from localStorage on component mount
  useEffect(() => {
    // Get completed checkouts from localStorage
    const storedCheckouts = localStorage.getItem('completedCheckouts');
    if (storedCheckouts) {
      try {
        const parsedCheckouts = JSON.parse(storedCheckouts);
        if (Array.isArray(parsedCheckouts)) {
          setCompletedCheckouts(parsedCheckouts);
        }
      } catch (error) {
        console.error('Error parsing completed checkouts:', error);
      }
    }
  }, []);

  const fetchConversations = async (archived = showArchived) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check token validity before making API call
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('You need to be logged in to view conversations. Please log in and try again.');
        setLoading(false);
        return;
      }
      
      console.log('Fetching conversations, archived:', archived);
      const data = await getConversations(archived);
      console.log('Conversations fetched successfully:', data.length);
      setConversations(data);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      
      // Provide a more specific error message depending on the error type
      if (err.message && err.message.includes('session has expired')) {
        setError('Your session has expired. Please log in again.');
      } else if (err.message && err.message.includes('Network error')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError('Failed to load conversations. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Add a retry function for better user experience
  const handleRefresh = () => {
    console.log('Manually refreshing conversations');
    // Clear any previous errors
    setError(null);
    // Fetch conversations again with current archived state
    fetchConversations(showArchived);
  };

  const fetchMessages = async (conversationId: string, resetMessages = false) => {
    try {
      if (resetMessages) {
        setMessages([]);
        setPage(1);
        setHasMore(true);
      }

      setLoadingMessages(true);
      setError(null);

      const data = await getMessages(conversationId, resetMessages ? 1 : page);

      if (resetMessages) {
        setMessages(data.messages);
        // After setting new messages, scroll to bottom with a small delay to ensure rendering
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      } else {
        setMessages(prev => [...data.messages, ...prev]);
      }

      setHasMore(data.pagination.page < data.pagination.pages);
      setPage(prev => resetMessages ? 2 : prev + 1);
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages. Please try again.');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleChatSelect = (conversationId: string) => {
    setSelectedChat(conversationId);
    setShowMobileChat(true);
    fetchMessages(conversationId, true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedChat) return;

    try {
      // Ensure consistent ID format by using String() conversion
      const userId = user?._id ? String(user._id) : '';

      // Optimistically add message to UI
      const optimisticMessage: ExtendedMessage = {
        _id: Date.now().toString(), // Temporary ID
        conversation: selectedChat,
        sender: {
          _id: userId,
          name: user?.name || '',
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          avatar: user?.avatar || '',
          email: user?.email || ''
        },
        receiver: '', // Will be set by server
        content: newMessage.trim(),
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');

      // Scroll to bottom after adding message
      setTimeout(() => {
        scrollToBottom();
      }, 50);

      // Send to server
      if (socket) {
        socket.emit('typing-stop', { conversationId: selectedChat });
      }

      const sentMessage = await sendMessage(selectedChat, newMessage.trim());

      // Replace optimistic message with actual message
      setMessages(prev =>
        prev.map(msg => msg._id === optimisticMessage._id ? sentMessage : msg)
      );

      // Update conversation list with new message
      updateConversationWithMessage(selectedChat, sentMessage);
    } catch (err: any) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message. Please try again.');

      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg._id !== Date.now().toString()));
    }
  };

  const handleNewMessage = (message: ExtendedMessage) => {
    if (!message || !message._id) {
      console.error('Received invalid message object:', message);
      return;
    }

    console.log(`New message received via socket: ${message._id} for conversation ${message.conversation}`, message);
    
    try {
      // First check if this is a valid message with required properties
      if (!message.conversation || !message.sender) {
        console.error('Received message missing required fields:', message);
        return;
      }
      
      // Check for debugging metadata
      if (message._roomDelivery) {
        console.log(`Message ${message._id} delivered via room: ${message._roomDelivery}`);
      }
      
      if (message._directDelivery) {
        console.log(`Message ${message._id} delivered via direct socket`);
      }
      
      // Check if this message is already in our messages array to avoid duplicates
      const isMessageAlreadyDisplayed = messages.some(m => m._id === message._id);
      
      if (isMessageAlreadyDisplayed) {
        console.log(`Message ${message._id} already displayed, skipping`);
        return;
      }
      
      // Add message to messages list if it's for the current conversation
      if (message.conversation === selectedChat) {
        console.log(`Adding message ${message._id} to current conversation: ${selectedChat}`);
        
        setMessages(prevMessages => {
          // Double check for duplicates again
          if (prevMessages.some(m => m._id === message._id)) {
            return prevMessages;
          }
          return [...prevMessages, message];
        });

        // Check if this is an offer status update
        if (message.metadata?.offerStatusUpdate && message.metadata?.originalOfferId) {
          // Update our tracked offer statuses
          setActedOffers(prev => ({
            ...prev,
            [message.metadata?.originalOfferId || '']: message.metadata?.status || ''
          }));
        }

        // Scroll to bottom after adding new message with a slight delay to ensure rendering
        setTimeout(() => {
          scrollToBottom();
        }, 100);

        // Mark as read if we're in the conversation
        markMessagesAsRead(message.conversation);
        
        // Play a notification sound if the message is from another user
        if (message.sender._id.toString() !== user?._id?.toString()) {
          // If we had a notification sound, we'd play it here
          console.log(`Message received from ${message.sender.name || 'another user'}`);
        }
      } else {
        console.log(`Message ${message._id} is for a different conversation: ${message.conversation}, current: ${selectedChat || 'none'}`);
        
        // Update the conversation list to show unread indicator and move conversation to top
        updateConversationWithMessage(message.conversation, message);
      }
    } catch (error) {
      console.error('Error handling new message:', error);
    }
  };

  const updateConversationWithMessage = (conversationId: string, message: ExtendedMessage) => {
    setConversations(prev => {
      const updatedConversations = [...prev];
      const index = updatedConversations.findIndex(c => c._id === conversationId);

      if (index !== -1) {
        // Update last message and move to top
        const conversation = { ...updatedConversations[index] };
        conversation.lastMessage = message;

        // Try different ways to determine if this is the current user's message
        // First attempt with ID comparison
        const currentUserId = user?._id ? String(user._id) : '';
        const senderId = message.sender?._id ? String(message.sender._id) : '';

        // Second attempt with email comparison which is often more reliable
        const currentUserEmail = user?.email || '';
        const senderEmail = message.sender?.email || '';

        // Try both ID and email matching
        let isFromCurrentUser = false;

        // Check ID match if both IDs are present
        if (currentUserId && senderId) {
          isFromCurrentUser = currentUserId === senderId;
        }

        // If ID match failed or IDs weren't available, try email match
        if (!isFromCurrentUser && currentUserEmail && senderEmail) {
          isFromCurrentUser = currentUserEmail === senderEmail;
        }

        // Update unread count if message is from other user
        if (!isFromCurrentUser) {
          conversation.unreadCount = (conversation.unreadCount || 0) + 1;
        }

        // Remove from current position
        updatedConversations.splice(index, 1);

        // Add to top
        return [conversation, ...updatedConversations];
      }

      return updatedConversations;
    });
  };

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      if (socket) {
        socket.emit('mark-read', { conversationId });
      }

      await markAsRead(conversationId);

      // Update unread count in conversations list
      setConversations(prev =>
        prev.map(conv =>
          conv._id === conversationId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (err: any) {
      console.error('Error marking messages as read:', err);
    }
  };

  const handleMessagesRead = ({ conversationId }: { conversationId: string }) => {
    // Update read status of messages in the current conversation
    if (selectedChat === conversationId) {
      setMessages(prev =>
        prev.map(msg => {
          // Try different ways to determine if this is the current user's message
          // First attempt with ID comparison
          const currentUserId = user?._id ? String(user._id) : '';
          const senderId = msg.sender?._id ? String(msg.sender._id) : '';

          // Second attempt with email comparison which is often more reliable
          const currentUserEmail = user?.email || '';
          const senderEmail = msg.sender?.email || '';

          // Try both ID and email matching
          let isFromCurrentUser = false;

          // Check ID match if both IDs are present
          if (currentUserId && senderId) {
            isFromCurrentUser = currentUserId === senderId;
          }

          // If ID match failed or IDs weren't available, try email match
          if (!isFromCurrentUser && currentUserEmail && senderEmail) {
            isFromCurrentUser = currentUserEmail === senderEmail;
          }

          return isFromCurrentUser ? { ...msg, isRead: true } : msg;
        })
      );
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      // Optimistically remove message from UI
      setMessages(prev => prev.filter(msg => msg._id !== messageId));

      await deleteMessage(messageId);
      toast.success('Message deleted');
    } catch (err: any) {
      console.error('Error deleting message:', err);
      toast.error('Failed to delete message');

      // Refresh messages on error
      if (selectedChat) {
        fetchMessages(selectedChat, true);
      }
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      await archiveConversation(conversationId, true); // Explicitly pass true for archiving

      // Remove conversation from list
      setConversations(prev => prev.filter(conv => conv._id !== conversationId));

      if (selectedChat === conversationId) {
        setSelectedChat(null);
        setShowMobileChat(false);
      }

      toast.success('Conversation archived');
    } catch (err: any) {
      console.error('Error archiving conversation:', err);
      toast.error('Failed to archive conversation');
    }
  };

  const handleRestoreConversation = async (conversationId: string) => {
    try {
      await archiveConversation(conversationId, false); // Passing false to restore

      // Remove conversation from list
      setConversations(prev => prev.filter(conv => conv._id !== conversationId));

      if (selectedChat === conversationId) {
        setSelectedChat(null);
        setShowMobileChat(false);
      }

      toast.success('Conversation restored');
    } catch (err: any) {
      console.error('Error restoring conversation:', err);
      toast.error('Failed to restore conversation');
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId); // Call the correct function
      setConversations(prev => prev.filter(conv => conv._id !== conversationId));

      if (selectedChat === conversationId) {
        setSelectedChat(null);
        setShowMobileChat(false);
      }

      toast.success('Conversation deleted');
    } catch (err: any) {
      console.error('Error deleting conversation:', err);
      toast.error('Failed to delete conversation');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    // Emit typing events
    if (socket && selectedChat) {
      socket.emit('typing-start', { conversationId: selectedChat });

      // Clear previous timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      // Set new timeout
      const timeout = setTimeout(() => {
        socket.emit('typing-stop', { conversationId: selectedChat });
      }, 2000);

      setTypingTimeout(timeout);
    }
  };

  const handleTypingStart = ({ userId, conversationId }: { userId: string, conversationId: string }) => {
    if (selectedChat === conversationId && userId !== user?._id?.toString()) {
      setIsTyping(true);
    }
  };

  const handleTypingStop = ({ userId, conversationId }: { userId: string, conversationId: string }) => {
    if (selectedChat === conversationId && userId !== user?._id?.toString()) {
      setIsTyping(false);
    }
  };

  const loadMoreMessages = () => {
    if (selectedChat && hasMore && !loadingMessages) {
      fetchMessages(selectedChat);
    }
  };

  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      const scrollContainer = messageContainerRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  };

  const handleBackToList = () => {
    setSelectedChat(null);
    setShowMobileChat(false);
  };

  const formatMessageTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (err: any) {
      return timestamp;
    }
  };

  const toggleArchivedView = () => {
    const newArchivedState = !showArchived;
    setShowArchived(newArchivedState);
    setSelectedChat(null);
    setShowMobileChat(false);
    fetchConversations(newArchivedState);
  };

  // Ensure the UI correctly displays conversations based on the showArchived state
  const filteredConversations = conversations.filter(conv => {
    const otherParticipant = conv.participants.find(p => p._id.toString() !== user?._id?.toString());
    return otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedConversation = conversations.find(conv => conv._id === selectedChat);
  const otherParticipant = selectedConversation?.participants.find(p => p._id.toString() !== user?._id?.toString());

  // Function to check if a message is a product message
  const isProductMessage = (message: ExtendedMessage, conversation: ConversationType): boolean => {
    // Check if the message content matches product message patterns
    const hasProductKeywords = 
      message.content.toLowerCase().includes("interested in") || 
      message.content.toLowerCase().includes("product") ||
      message.content.includes("👋");
    
    const hasPricePattern = message.content.match(/\(\d+\.?\d*\s*USD\)/i);
    
    // If it has both keywords and price pattern, likely a product message
    if (hasProductKeywords && hasPricePattern) {
      return true;
    }
    
    // Extract product info and check if title was found
    const extractedInfo = extractProductInfo(message);
    if (extractedInfo.title) {
      return true;
    }
    
    // If this is a simple greeting (hello, hi, hey), don't show the product card
    // even if the conversation has a product
    if (conversation && conversation.product) {
      const lowerContent = message.content.toLowerCase().trim();
      if (lowerContent === "hello" || 
          lowerContent === "hi" || 
          lowerContent === "hey" ||
          lowerContent === "hello!" || 
          lowerContent === "hi!" || 
          lowerContent === "hey!") {
        return false;
      }
    }
    
    // For the first message in a product conversation, we might want to show the product
    // Only if it's clearly a product inquiry
    if (conversation && conversation.product && 
        (message.content.includes("interested in") || 
         message.content.includes("product"))) {
      return true;
    }
    
    return false;
  };

  // Function to extract product info from message content
  const extractProductInfo = (message: ExtendedMessage) => {
    let productInfo = {
      _id: 'unknown', // Always set a default ID for extracted products
      title: '',
      price: 0,
      images: [] as string[]
    };
    
    // Extract product title - match pattern like "product: Product Name"
    const titleMatch = message.content.match(/(?:product:|interested in(?: your)? product:?)\s+([^(]+)/i);
    if (titleMatch && titleMatch[1]) {
      productInfo.title = titleMatch[1].trim();
    }
    
    // Extract price - match pattern like "(29.99 USD)"
    const priceMatch = message.content.match(/\((\d+\.?\d*)\s*USD\)/i);
    if (priceMatch && priceMatch[1]) {
      productInfo.price = parseFloat(priceMatch[1]);
    }
    
    // Check for emoji - likely a product inquiry
    const hasProductEmoji = message.content.includes("👋") && (
      message.content.toLowerCase().includes("product") || 
      message.content.includes("interested in")
    );
    
    if (hasProductEmoji && !productInfo.title) {
      // If there's an emoji but no title extracted, try to extract title differently
      const secondTitleMatch = message.content.match(/interested in(?:.*?):?\s*(.*?)(?:\(|\.|$)/i);
      if (secondTitleMatch && secondTitleMatch[1]) {
        productInfo.title = secondTitleMatch[1].trim();
      }
    }
    
    return productInfo;
  };

  // Modify the isOfferMessage function to be more robust and handle accepted offers
  const isOfferMessage = (message: ExtendedMessage): boolean => {
    // Check for the offer emoji and wording
    return (
      (message.content.includes("💰") && 
      message.content.toLowerCase().includes("make an offer") && 
      message.content.includes("$")) ||
      // Also detect accepted offer messages
      message.content.includes("✅ Offer accepted!")
    );
  };

  // Add a function to check if a message is an accepted offer
  const isAcceptedOfferMessage = (message: ExtendedMessage): boolean => {
    return message.content.includes("✅ Offer accepted!");
  };

  // Add a function to extract order reference from an accepted offer message
  const extractOrderReference = (content: string): string | null => {
    const match = content.match(/Order reference: ([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  // Modify the handleAcceptOffer function to update the actedOffers state
  const handleAcceptOffer = (message: ExtendedMessage) => {
    if (!selectedConversation || !selectedConversation.product) {
      toast.error('Product information not available');
      return;
    }
    
    // Extract offer amount from message
    const offerAmount = extractOfferAmount(message.content);
    if (!offerAmount) {
      toast.error('Could not determine offer amount');
      return;
    }
    
    setIsContactingSellerLoading(true);
    
    // Just update the offer status and don't navigate
    updateOfferStatus(selectedChat!, message._id, 'accepted')
      .then(() => {
        toast.success('Offer accepted! The buyer can now complete the purchase.');
        
        // Mark this offer as acted upon so we can hide the buttons
        setActedOffers(prev => ({
          ...prev,
          [message._id]: 'accepted'
        }));
        
        // No navigation here - we'll show a checkout button to the buyer instead
      })
      .catch(err => {
        console.error('Error updating offer status:', err);
        toast.error('Failed to accept offer. Please try again.');
      })
      .finally(() => {
        setIsContactingSellerLoading(false);
      });
  };

  // Modify the handleDeclineOffer function to update the actedOffers state
  const handleDeclineOffer = (message: ExtendedMessage) => {
    if (!selectedChat || !message.sender) {
      toast.error('Cannot decline offer at this time');
      return;
    }
    
    setIsContactingSellerLoading(true);
    
    // Update offer status to declined
    updateOfferStatus(selectedChat, message._id, 'declined')
      .then(() => {
        toast.success('Offer declined');
        
        // Mark this offer as acted upon so we can hide the buttons
        setActedOffers(prev => ({
          ...prev,
          [message._id]: 'declined'
        }));
      })
      .catch(err => {
        console.error('Error updating offer status:', err);
        toast.error('Could not decline offer. Please try again.');
      })
      .finally(() => {
        setIsContactingSellerLoading(false);
      });
  };

  // Function to extract offer amount from message content - move it earlier
  const extractOfferAmount = (content: string): string | null => {
    // Look for a dollar amount pattern
    const match = content.match(/\$(\d+(\.\d{1,2})?)/);
    return match ? match[1] : null;
  };

  // Add the isValidProduct function back
  const isValidProduct = (product: any): boolean => {
    return (
      product && 
      typeof product === 'object' && 
      product._id && 
      typeof product.title === 'string' && 
      typeof product.price === 'number'
    );
  };

  // Update the handleCheckoutFromAcceptedOffer function
  const handleCheckoutFromAcceptedOffer = (message: ExtendedMessage) => {
    if (!selectedConversation || !selectedConversation.product) {
      toast.error('Product information not available');
      return;
    }
    
    // Check if this message's checkout has already been completed
    if (completedCheckouts.includes(message._id)) {
      toast.success('You have already started checkout for this offer');
      return;
    }
    
    // If already in progress, do nothing - prevent multiple clicks
    if (checkoutInProgress[message._id]) {
      return;
    }
    
    // Set this message as being processed for checkout - with a new approach using an object
    setCheckoutInProgress(prev => ({
      ...prev,
      [message._id]: true
    }));
    
    try {
      // Find the original offer message to get the amount
      // First try to get it from the accepted message metadata if available
      let originalOfferId = message.metadata?.originalOfferId;
      let offerMessage: ExtendedMessage | undefined;
      let orderReference = message.metadata?.orderReference;
      
      if (originalOfferId) {
        offerMessage = messages.find(m => m._id === originalOfferId);
      }
      
      // If we couldn't find the original message, look for a message with an offer
      if (!offerMessage) {
        offerMessage = messages.find(m => 
          m.content.includes("💰") && 
          m.content.toLowerCase().includes("make an offer") && 
          m.content.includes("$")
        );
      }
      
      // Extract the offer amount
      const offerAmount = offerMessage 
        ? extractOfferAmount(offerMessage.content) 
        : extractOfferAmount(message.content); // Try to get it from the accepted message if original not found
      
      if (!offerAmount) {
        toast.error('Could not determine offer amount. Please contact support.');
        // Reset the in-progress state for this message
        setCheckoutInProgress(prev => ({
          ...prev,
          [message._id]: false
        }));
        return;
      }
      
      const product = selectedConversation.product;
      const offerPrice = parseFloat(offerAmount);
      
      console.log('Proceeding to checkout with offer:', {
        product: product.title,
        offerPrice,
        orderReference,
        conversationId: selectedConversation._id
      });
      
      // Add this message ID to completedCheckouts and persist to localStorage
      const updatedCompletedCheckouts = [...completedCheckouts, message._id];
      setCompletedCheckouts(updatedCompletedCheckouts);
      localStorage.setItem('completedCheckouts', JSON.stringify(updatedCompletedCheckouts));
      
      // Now navigate to checkout
      navigate('/checkout', { 
        state: { 
          product: product,
          quantity: 1,
          subtotal: offerPrice, // Use the offer price as subtotal
          buyNow: true,
          isOffer: true,
          offerData: {
            offerId: offerMessage?._id || message._id,
            offerAmount: offerPrice,
            originalPrice: product.price,
            conversationId: selectedConversation._id,
            orderReference: orderReference || undefined // Include order reference if available
          }
        } 
      });
    } catch (error) {
      console.error('Error navigating to checkout:', error);
      toast.error('An unexpected error occurred. Please try again.');
      
      // Reset the in-progress state for this message on error
      setCheckoutInProgress(prev => ({
        ...prev,
        [message._id]: false
      }));
    }
  };

  // Update the reconnection handler with the right dependencies
  useEffect(() => {
    if (!socket) return;
    
    const handleReconnectEvent = () => {
      console.log('Socket reconnection event detected');
      handleRefresh();
      
      if (selectedChat) {
        fetchMessages(selectedChat, true);
      }
    };
    
    console.log('Setting up socket reconnection handlers');
    window.addEventListener('socket-reconnected', handleReconnectEvent);
    window.addEventListener('socket-connected', handleReconnectEvent);
    
    // Set up ping interval to verify connection
    const pingInterval = setInterval(() => {
      if (socket && !socket.connected) {
        console.log('Socket not connected in ping check, attempting reconnection');
        const token = localStorage.getItem('accessToken');
        if (token) {
          socketService.reconnect();
        }
      }
    }, 30000);
    
    return () => {
      window.removeEventListener('socket-reconnected', handleReconnectEvent);
      window.removeEventListener('socket-connected', handleReconnectEvent);
      clearInterval(pingInterval);
      
      // Clean up socket event listeners
      if (socket) {
        socket.off('new-message');
        socket.off('typing-start');
        socket.off('typing-stop');
        socket.off('messages-read');
      }
    };
  }, [socket, selectedChat, handleRefresh, fetchMessages]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 md:mt-10 ">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 md:h-[calc(100vh-12rem)] h-[calc(109vh-12rem)]">
          {/* Conversations List */}
          <div
            className={`border-r border-gray-200 ${showMobileChat ? 'hidden md:block' : 'block'
              } flex flex-col h-full overflow-hidden md:col-span-1`}
          >
            <div className="p-4 border-b border-gray-200 md:pt-5 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {t('common.messages')}
                </h2>
                <button
                  onClick={toggleArchivedView}
                  className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${showArchived ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
                  title={showArchived ? "Show active conversations" : "Show archived conversations"}
                >
                  {showArchived ? <RefreshCw className="h-5 w-5" /> : <Archive className="h-5 w-5" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('common.searchMessages')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <div className="bg-red-50 border border-red-100 rounded-lg p-6 max-w-md">
                    <AlertCircle className="h-10 w-10 mx-auto mb-4 text-red-500" />
                    <p className="text-red-700 font-medium mb-2">{error}</p>
                    <p className="text-gray-500 text-sm mb-4">
                      This could be due to connectivity issues or authentication problems.
                    </p>
                    <button
                      onClick={handleRefresh}
                      className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 w-full"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Try again</span>
                    </button>
                  </div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-lg font-medium text-gray-900 mb-1">
                    {showArchived
                      ? "No archived conversations"
                      : "No conversations yet"}
                  </p>
                  <p>
                    {showArchived
                      ? "Archived conversations will appear here"
                      : "Start a new conversation from a product page"}
                  </p>
                </div>
              ) : (
                <div className="h-full">
                  {filteredConversations.map((conv) => {
                    const otherUser = conv.participants.find(p => p._id.toString() !== user?._id?.toString());
                    const isSelected = selectedChat === conv._id;
                    return (
                      <div
                        key={conv._id}
                        onClick={() => handleChatSelect(conv._id)}
                        className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''
                          }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 relative">
                            {otherUser?.avatar ? (
                              <img
                                src={otherUser.avatar}
                                alt={otherUser.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48';
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center border-2 border-gray-300">
                                {otherUser?.firstName ? (
                                  <span className="text-gray-600 font-medium text-lg">
                                    {otherUser.firstName.charAt(0).toUpperCase()}
                                  </span>
                                ) : (
                                  <User className="w-6 h-6 text-gray-500" />
                                )}
                              </div>
                            )}
                            {conv.unreadCount > 0 && (
                              <div className="absolute -top-1 -right-1 flex-shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-xs text-white font-medium">
                                  {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className={`text-sm font-medium ${isSelected ? 'text-blue-600' : 'text-gray-900'} truncate`}>
                                {otherUser?.name || 'Unknown User'}
                              </h3>
                              <span className="text-xs text-gray-500">
                                {conv.lastMessage ? formatMessageTime(conv.lastMessage.createdAt) : 'New'}
                              </span>
                            </div>
                            {conv.product && (
                              <p className="text-xs text-blue-600 truncate mb-1">
                                {conv.product.title}
                              </p>
                            )}
                            <p className="text-sm text-gray-500 truncate">
                              {conv.lastMessage?.sender._id.toString() === user?._id?.toString() && <span className="text-xs text-gray-400 mr-1">You: </span>}
                              {conv.lastMessage?.content || 'Start a conversation'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div
            className={`md:col-span-3 flex flex-col ${!showMobileChat ? 'hidden md:flex' : 'flex'
              } h-full`}
          >
            {selectedChat && selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center">
                    <button
                      onClick={handleBackToList}
                      className="md:hidden mr-2 p-2 hover:bg-gray-100 rounded-full"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center space-x-3">
                      {otherParticipant?.avatar ? (
                        <img
                          src={otherParticipant.avatar}
                          alt={otherParticipant.name}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {otherParticipant?.firstName ? (
                            <span className="text-gray-600 font-medium text-sm">
                              {otherParticipant.firstName.charAt(0).toUpperCase()}
                            </span>
                          ) : (
                            <User className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {otherParticipant?.name || 'Unknown User'}
                        </h3>
                        <p className="text-xs text-green-500">{t('common.online')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {selectedConversation.product && (
                      <div className="mr-4 hidden sm:block">
                        <p className="text-xs text-gray-500">Discussing:</p>
                        <p className="text-sm font-medium text-blue-600 truncate max-w-[150px]">
                          {selectedConversation.product.title}
                        </p>
                      </div>
                    )}
                    <button
                      className="p-2 hover:bg-gray-100 rounded-full"
                      onClick={() => showArchived
                        ? handleRestoreConversation(selectedChat)
                        : handleArchiveConversation(selectedChat)
                      }
                      title={showArchived ? "Restore conversation" : "Archive conversation"}
                    >
                      {showArchived
                        ? <RefreshCw className="w-5 h-5 text-blue-500" />
                        : <Archive className="w-5 h-5 text-gray-500" />
                      }
                    </button>
                    <button
                      className="p-2 hover:bg-gray-100 rounded-full"
                      onClick={() => handleDeleteConversation(selectedChat!)}
                      title="Delete conversation"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div
                  className="flex-1 overflow-y-auto p-4 space-y-4 "
                  ref={messageContainerRef}
                  style={{ maxHeight: 'calc(100vh - 200px)' }}
                >
                  {loadingMessages && page === 1 ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <>
                      {hasMore && (
                        <div className="text-center">
                          <button
                            onClick={loadMoreMessages}
                            className="text-blue-500 text-sm hover:underline"
                            disabled={loadingMessages}
                          >
                            {loadingMessages ? 'Loading...' : 'Load more messages'}
                          </button>
                        </div>
                      )}

                      {messages.map((message) => {
                        // Try different ways to determine if this is the current user's message
                        // First attempt with ID comparison
                        const currentUserId = user?._id ? String(user._id) : '';
                        const senderId = message.sender?._id ? String(message.sender._id) : '';

                        // Second attempt with email comparison which is often more reliable
                        const currentUserEmail = user?.email || '';
                        const senderEmail = message.sender?.email || '';

                        // Try both ID and email matching
                        let isCurrentUser = false;

                        // Check ID match if both IDs are present
                        if (currentUserId && senderId) {
                          isCurrentUser = currentUserId === senderId;
                        }

                        // If ID match failed or IDs weren't available, try email match
                        if (!isCurrentUser && currentUserEmail && senderEmail) {
                          isCurrentUser = currentUserEmail === senderEmail;
                        }

                        // Check if message is about a product
                        const productMessage = isProductMessage(message, selectedConversation);

                        return (
                          <div
                            key={message._id}
                            className={`flex items-start ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
                          >
                            {/* Avatar and message container - different arrangement based on sender */}
                            {!isCurrentUser && (
                              <div className="flex-shrink-0 mr-2 ">
                                {message.sender.avatar ? (
                                  <img
                                    src={message.sender.avatar}
                                    alt={message.sender.name}
                                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32';
                                    }}
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center border-2 border-gray-300 ">
                                    {message.sender.firstName ? (
                                      <span className="text-gray-600 font-medium text-sm">
                                        {message.sender.firstName.charAt(0).toUpperCase()}
                                      </span>
                                    ) : (
                                      <User className="w-4 h-4 text-gray-500" />
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            <div
                              className={`max-w-[70%] group relative ${isCurrentUser
                                ? 'bg-blue-600 text-white rounded-t-lg rounded-bl-lg rounded-br-sm'
                                : 'bg-gray-100 text-gray-900 rounded-t-lg rounded-br-lg rounded-bl-sm'
                                } ${productMessage ? 'pb-2' : ''}`}
                            >
                              <div className="px-4 py-2">
                                {isOfferMessage(message) ? (
                                  <div className="space-y-3">
                                    <p className="text-sm break-words font-medium">
                                      {message.content}
                                    </p>
                                    {/* Special offer card styling */}
                                    <div className={`${isCurrentUser ? 'bg-white rounded-lg p-3 mt-2' : 'bg-white rounded-lg p-3 mt-2'}`}>
                                      {selectedConversation?.product && (
                                        <div className="flex flex-col">
                                          {isAcceptedOfferMessage(message) ? (
                                            // Show the accepted offer with a Checkout button for the buyer
                                            <div>
                                              <div className="mb-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                                                <p className="text-green-800 font-medium text-sm mb-2">
                                                  {isCurrentUser 
                                                    ? "You've accepted this offer. The buyer can now complete the purchase."
                                                    : "Offer has been accepted! You can now complete your purchase."}
                                                </p>
                                                {!isCurrentUser && !completedCheckouts.includes(message._id) && ( // Only show checkout button to the buyer (not the seller who accepted) and if not already checked out
                                                  <button
                                                    onClick={(e) => {
                                                      // Additional safeguard to prevent multiple clicks
                                                      e.currentTarget.disabled = true;
                                                      handleCheckoutFromAcceptedOffer(message);
                                                    }}
                                                    disabled={!!checkoutInProgress[message._id] || completedCheckouts.includes(message._id)}
                                                    className={`w-full py-2 px-4 
                                                      ${!!checkoutInProgress[message._id] || completedCheckouts.includes(message._id)
                                                        ? "bg-gray-400 cursor-not-allowed opacity-70" 
                                                        : "bg-green-600 hover:bg-green-700"
                                                      } text-white rounded-md transition-colors font-medium`}
                                                    style={{pointerEvents: checkoutInProgress[message._id] || completedCheckouts.includes(message._id) ? 'none' : 'auto'}}
                                                  >
                                                    {checkoutInProgress[message._id] ? "Processing..." : completedCheckouts.includes(message._id) ? "Checkout Started" : "Proceed to Checkout"}
                                                  </button>
                                                )}
                                                {!isCurrentUser && completedCheckouts.includes(message._id) && (
                                                  <div className="w-full py-2 px-4 bg-gray-100 text-gray-600 rounded-md text-center text-sm">
                                                    Checkout already initiated
                                                  </div>
                                                )}
                                              </div>
                                              <ProductMessageCard 
                                                product={selectedConversation.product as {
                                                  _id: string;
                                                  title: string;
                                                  price: number;
                                                  images: string[];
                                                  description?: string;
                                                }}
                                                compact={true}
                                                className="mt-2"
                                              />
                                            </div>
                                          ) : (
                                            // Show the regular offer card with accept/decline buttons
                                            <OfferCard
                                              productId={selectedConversation.product._id}
                                              productTitle={selectedConversation.product.title}
                                              productImage={selectedConversation.product.images && selectedConversation.product.images.length > 0 ? 
                                                formatImageUrl(selectedConversation.product.images[0]) : ''}
                                              listingPrice={selectedConversation.product.price}
                                              offerAmount={parseFloat(extractOfferAmount(message.content) || '0')}
                                              isOwnOffer={isCurrentUser}
                                              onAccept={() => handleAcceptOffer(message)}
                                              onDecline={() => handleDeclineOffer(message)}
                                              status={actedOffers[message._id]}
                                              isLoading={isContactingSellerLoading}
                                            />
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : productMessage ? (
                                  <div className="space-y-3">
                                    <p className="text-sm break-words">{message.content}</p>
                                    <div className={`${isCurrentUser ? 'bg-white rounded-lg p-1 mt-2' : ''}`}>
                                      {selectedConversation?.product ? (
                                        <ProductMessageCard 
                                          product={selectedConversation.product as {
                                            _id: string;
                                            title: string;
                                            price: number;
                                            images: string[];
                                            description?: string;
                                          }}
                                          compact={true}
                                          className="mt-2"
                                        />
                                      ) : (
                                        // If we don't have the product in conversation but can extract info from message
                                        (() => {
                                          const extractedInfo = extractProductInfo(message);
                                          if (extractedInfo.title) {
                                            // The extracted info already has _id set to 'unknown'
                                            return (
                                              <ProductMessageCard 
                                                product={extractedInfo}
                                                compact={true}
                                                className="mt-2"
                                              />
                                            );
                                          }
                                          return null;
                                        })()
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm break-words">{message.content}</p>
                                )}
                              </div>
                              <div className="flex items-center justify-between mt-1 px-4 pb-2">
                                <span
                                  className={`text-xs ${isCurrentUser
                                    ? 'text-blue-100'
                                    : 'text-gray-500'
                                    }`}
                                >
                                  {formatMessageTime(message.createdAt)}
                                </span>

                                {isCurrentUser && (
                                  <span
                                    className={`text-xs ml-2 ${message.isRead ? 'text-blue-100' : 'text-blue-200'
                                      }`}
                                  >
                                    {message.isRead ? 'Read' : 'Sent'}
                                  </span>
                                )}
                              </div>

                              {/* Delete button for own messages */}
                              {isCurrentUser && (
                                <button
                                  onClick={() => handleDeleteMessage(message._id)}
                                  className="absolute right-0 top-0 -mt-2 -mr-2 bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Delete message"
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </button>
                              )}
                            </div>

                            {isCurrentUser && (
                              <div className="flex-shrink-0 ml-2">
                                {user?.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.name || 'You'}
                                    className="w-8 h-8 rounded-full object-cover border-2 border-blue-200"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32';
                                    }}
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200">
                                    {user?.firstName ? (
                                      <span className="text-blue-600 font-medium text-sm">
                                        {user.firstName.charAt(0).toUpperCase()}
                                      </span>
                                    ) : (
                                      <User className="w-4 h-4 text-blue-500" />
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div className="h-32"></div>

                      {/* Typing indicator */}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 rounded-lg px-4 py-2 text-gray-500">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 flex-shrink-0 sticky bottom-0 bg-white">
                  <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                    <button
                      type="button"
                      className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-full hidden sm:block"
                    >
                      {/* <Paperclip className="w-5 h-5" /> */}
                    </button>
                    <button
                      type="button"
                      className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-full hidden sm:block"
                    >
                      {/* <Image className="w-5 h-5" /> */}
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={handleInputChange}
                        placeholder={t('common.typeMessage')}
                        className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-full focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-2 text-gray-500 hover:text-gray-600"
                      >
                        {/* <Smile className="w-5 h-5" /> */}
                      </button>
                    </div>
                    <button
                      type="submit"
                      className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!newMessage.trim()}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {t('common.noMessageSelected')}
                  </h3>
                  <p className="text-gray-500">
                    {t('common.selectConversation')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;