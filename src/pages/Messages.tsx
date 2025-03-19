import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Search, Send, Paperclip, MoreVertical, User, Image, Smile, ChevronLeft, Trash2, AlertCircle, Archive, RefreshCw } from 'lucide-react';
import { 
  getConversations, 
  getMessages, 
  sendMessage, 
  markAsRead, 
  deleteMessage, 
  archiveConversation,
  Conversation as ConversationType,
  Message as MessageType,
  PaginatedMessages
} from '../services/messageService';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Messages = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { socket } = useSocket();
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Fetch conversations on component mount
  useEffect(() => {
    // Add debug logging for initial user state
    console.log('Initial user state in useEffect:', {
      user,
      userEmail: user?.email,
      userId: user?._id,
      isAuthenticated: !!user
    });

    if (user) {
      fetchConversations();
    } else {
      setError('You need to be logged in to view conversations. Please log in and try again.');
      setLoading(false);
    }
    
    // Listen for new messages from socket
    if (socket) {
      socket.on('new-message', handleNewMessage);
      socket.on('typing-start', handleTypingStart);
      socket.on('typing-stop', handleTypingStop);
      socket.on('messages-read', handleMessagesRead);
      
      return () => {
        socket.off('new-message', handleNewMessage);
        socket.off('typing-start', handleTypingStart);
        socket.off('typing-stop', handleTypingStop);
        socket.off('messages-read', handleMessagesRead);
      };
    }
  }, [socket, user]);
  
  // Join conversation rooms when conversations change
  useEffect(() => {
    if (socket && conversations.length > 0) {
      const conversationIds = conversations.map(conv => conv._id);
      socket.emit('join-conversations', conversationIds);
    }
  }, [socket, conversations]);
  
  // Mark messages as read when chat is selected
  useEffect(() => {
    if (selectedChat) {
      markMessagesAsRead(selectedChat);
    }
  }, [selectedChat]);
  
  const fetchConversations = async (archived = showArchived) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getConversations(archived);
      setConversations(data);
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      if (err.response && err.response.status === 401) {
        setError('You need to be logged in to view conversations. Please log in and try again.');
      } else {
        setError('Failed to load conversations. Please try again.');
      }
    } finally {
      setLoading(false);
    }
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
      const optimisticMessage: MessageType = {
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
  
  const handleNewMessage = (message: MessageType) => {
    // Add message to messages list if it's for the current conversation
    if (message.conversation === selectedChat) {
      setMessages(prev => [...prev, message]);

      // Scroll to bottom after adding new message
      setTimeout(() => {
        scrollToBottom();
      }, 50);
      
      // Mark as read if we're in the conversation
      markMessagesAsRead(message.conversation);
    }
    
    // Update conversation list with new message
    updateConversationWithMessage(message.conversation, message);
  };
  
  const updateConversationWithMessage = (conversationId: string, message: MessageType) => {
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
              <div className="p-4 text-center text-red-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>{error}</p>
                <button 
                    onClick={() => fetchConversations()}
                  className="mt-2 text-blue-500 hover:underline"
                >
                  Try again
                </button>
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
                        : <Trash2 className="w-5 h-5 text-gray-500" />
                      }
                  </button>
                  </div>
                </div>

                {/* Messages */}
                <div
                  className="flex-1 overflow-y-auto p-4 space-y-4"
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
                        // Log the entire user object to understand what's available
                        console.log('Full user object:', user);

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

                        // Debug all the comparison values
                        console.log('Debug values:', {
                          currentUserId,
                          senderId,
                          currentUserEmail,
                          senderEmail,
                          isCurrentUser
                        });
                        
                        return (
                    <div
                          key={message._id}
                            className={`flex items-start ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}
                          >
                            {/* Avatar and message container - different arrangement based on sender */}
                            {!isCurrentUser && (
                              <div className="flex-shrink-0 mr-2">
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
                                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center border-2 border-gray-300">
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
                              className={`max-w-[70%] px-4 py-2 group relative ${isCurrentUser
                                  ? 'bg-blue-600 text-white rounded-t-lg rounded-bl-lg rounded-br-sm'
                                  : 'bg-gray-100 text-gray-900 rounded-t-lg rounded-br-lg rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm break-words">{message.content}</p>
                            <div className="flex items-center justify-between mt-1">
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
                <div className="p-4 border-t border-gray-200 flex-shrink-0">
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