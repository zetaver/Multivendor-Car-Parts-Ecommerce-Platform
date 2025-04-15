import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';

interface MessageCallback {
  (message: any): void;
  id?: string;
}

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private messageCallbacks: MessageCallback[] = [];
  private notificationCallbacks: Array<(data: any) => void> = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private isConnecting = false;
  private joinedRooms: string[] = [];

  // Track all rooms we need to join
  private pendingRooms: string[] = [];

  constructor() {
    this.socket = null;
    
    // Setup window event listener for handling visibility changes
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      console.log('Page became visible, checking socket connection');
      this.checkConnection();
    }
  }

  private handleOnline = () => {
    console.log('Network connection restored, reconnecting socket');
    this.reconnect();
  }

  private handleOffline = () => {
    console.log('Network connection lost, socket may disconnect');
  }

  private checkConnection() {
    if (!this.socket || !this.socket.connected) {
      console.log('Socket not connected during visibility check, reconnecting');
      this.reconnect();
    } else {
      // Send a ping to verify connection is really active
      this.ping();
    }
  }

  connect(token: string) {
    if (this.isConnecting) {
      console.log('Connection attempt already in progress, skipping');
      return;
    }

    if (this.socket?.connected) {
      console.log('Socket is already connected, not connecting again');
      return;
    }

    this.isConnecting = true;
    this.token = token;
    this.reconnectAttempts = 0;
    
    // Clear any existing reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Set a connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }
    
    this.connectionTimeout = setTimeout(() => {
      if (!this.socket?.connected) {
        console.error('Socket connection timeout, forcing reconnect');
        this.forceReconnect();
      }
    }, 10000); // 10 seconds timeout
    
    // Extract base URL without /api if needed
    const baseUrl = API_URL.replace(/\/api\/?$/, '');
    console.log('SocketService attempting to connect to:', baseUrl);
    
    // Disconnect any existing socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.socket = io(baseUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 10000,
      query: { token } // Also include token in query for redundancy
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) {
      console.error('Cannot setup event listeners: socket is null');
      return;
    }

    this.socket.on('connect', () => {
      console.log('SocketService connected successfully with ID:', this.socket?.id);
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      // Clear connection timeout
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      // Setup ping interval to keep connection alive
      this.setupPingInterval();
      
      // Trigger custom event that components can listen for
      window.dispatchEvent(new CustomEvent('socket-connected', { 
        detail: { socketId: this.socket?.id }
      }));
      
      // Re-join any pending rooms
      if (this.pendingRooms.length > 0) {
        console.log('Re-joining pending rooms after connection:', this.pendingRooms);
        this.joinConversations(this.pendingRooms);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('SocketService connection error:', error.message);
      this.isConnecting = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        
        // Exponential backoff for reconnection attempts
        const delay = Math.min(1000 * (Math.pow(2, this.reconnectAttempts) - 1), 30000);
        
        this.reconnectTimer = setTimeout(() => {
          console.log(`Attempting reconnect after ${delay}ms delay`);
          this.reconnect();
        }, delay);
      } else {
        console.error('Max reconnect attempts reached, giving up automatic reconnection');
        // But we'll still try one more time if the user takes an action
        window.dispatchEvent(new CustomEvent('socket-reconnect-failed'));
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('SocketService disconnected:', reason);
      this.isConnecting = false;
      
      // Clear ping interval
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }
      
      // If the disconnection was initiated by the server, attempt to reconnect
      if (reason === 'io server disconnect' || reason === 'transport close') {
        console.log('Attempting to reconnect after server-initiated disconnect...');
        this.reconnect();
      }
      
      // Trigger event for components to handle disconnection
      window.dispatchEvent(new CustomEvent('socket-disconnected', { 
        detail: { reason } 
      }));
    });
    
    // Listen for custom server events
    this.socket.on('connection-confirmed', (data) => {
      console.log('Server confirmed connection:', data);
    });
    
    this.socket.on('rooms-joined', (data) => {
      console.log('Server confirmed rooms joined:', data);
      this.joinedRooms = data.rooms || [];
      
      // Trigger event that components can listen for
      window.dispatchEvent(new CustomEvent('socket-rooms-joined', { 
        detail: data 
      }));
    });
    
    this.socket.on('room-join-error', (data) => {
      console.error('Error joining rooms:', data.error);
    });
    
    this.socket.on('message-sent-confirmation', (data) => {
      console.log('Message sent confirmation:', data);
    });
    
    this.socket.on('pong', (data) => {
      console.log('Received pong from server:', data);
    });
    
    // Re-register any existing callbacks after reconnection
    if (this.messageCallbacks.length > 0) {
      this.messageCallbacks.forEach(callback => {
        this.socket?.on('new-message', callback);
      });
    }
    
    if (this.notificationCallbacks.length > 0) {
      this.notificationCallbacks.forEach(callback => {
        this.socket?.on('message-notification', callback);
      });
    }
  }

  private setupPingInterval() {
    // Clear any existing interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    // Set up ping interval to keep connection alive
    this.pingInterval = setInterval(() => {
      this.ping();
    }, 30000); // ping every 30 seconds
  }
  
  ping() {
    if (!this.socket?.connected) {
      console.warn('Cannot ping: socket not connected');
      return;
    }
    
    this.socket.emit('ping', { 
      timestamp: new Date(),
      clientId: this.socket.id
    });
  }

  joinConversations(conversations: string[]) {
    // Always store conversations to rejoin on reconnection
    this.pendingRooms = [...new Set([...this.pendingRooms, ...conversations])];
    
    if (!this.socket) {
      console.error('Cannot join conversations: socket is null');
      return;
    }
    
    if (!this.socket.connected) {
      console.warn('Socket is not connected, conversations will be joined after reconnection');
      this.reconnect();
      return;
    }
    
    console.log('Joining conversations:', conversations);
    this.socket.emit('join-conversations', conversations);
  }

  sendMessage(data: { conversationId: string; content: string }) {
    if (!this.socket) {
      console.error('Cannot send message: socket is null');
      return Promise.reject(new Error('Socket not initialized'));
    }
    
    if (!this.socket.connected) {
      console.warn('Socket is not connected, attempting to reconnect before sending message');
      this.reconnect();
      
      // Return a promise that can handle the reconnection and sending
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          document.removeEventListener('socket-connected', sendAfterConnect);
          reject(new Error('Reconnection timeout reached'));
        }, 5000);
        
        const sendAfterConnect = () => {
          clearTimeout(timeoutId);
          document.removeEventListener('socket-connected', sendAfterConnect);
          
          console.log('Sending message after reconnect:', data);
          this.socket?.emit('send-message', data);
          resolve(true);
        };
        
        document.addEventListener('socket-connected', sendAfterConnect, { once: true });
      });
    }
    
    console.log('Sending message via socket:', data);
    this.socket.emit('send-message', data);
    return Promise.resolve(true);
  }

  onNewMessage(callback: (message: any) => void, id?: string) {
    if (!this.socket) {
      console.error('Cannot register new message callback: socket is null');
      return;
    }
    
    // Store the callback for potential reconnection with an optional ID
    const callbackWithId = callback as MessageCallback;
    callbackWithId.id = id || Math.random().toString(36).substring(2, 15);
    
    // Remove any existing callback with the same ID to prevent duplicates
    this.messageCallbacks = this.messageCallbacks.filter(cb => cb.id !== callbackWithId.id);
    
    // Add the new callback
    this.messageCallbacks.push(callbackWithId);
    this.socket.on('new-message', callback);
    
    // Return a function to remove this listener
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb.id !== callbackWithId.id);
      if (this.socket) {
        this.socket.off('new-message', callback);
      }
    };
  }

  onMessageNotification(callback: (data: any) => void) {
    if (!this.socket) {
      console.error('Cannot register message notification callback: socket is null');
      return;
    }
    
    // Store the callback for potential reconnection
    if (!this.notificationCallbacks.includes(callback)) {
      this.notificationCallbacks.push(callback);
    }
    
    this.socket.on('message-notification', callback);
    
    // Return a function to remove this listener
    return () => {
      this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
      if (this.socket) {
        this.socket.off('message-notification', callback);
      }
    };
  }

  startTyping(conversationId: string) {
    if (!this.socket?.connected) {
      console.warn('Cannot send typing start: socket not connected');
      return;
    }
    
    this.socket.emit('typing-start', { conversationId });
  }

  stopTyping(conversationId: string) {
    if (!this.socket?.connected) {
      console.warn('Cannot send typing stop: socket not connected');
      return;
    }
    
    this.socket.emit('typing-stop', { conversationId });
  }

  onTypingStart(callback: (data: { userId: string; conversationId: string }) => void) {
    if (!this.socket) {
      console.warn('Cannot register typing start callback: socket not connected');
      return;
    }
    
    this.socket.on('typing-start', callback);
    
    // Return a function to remove this listener
    return () => {
      if (this.socket) {
        this.socket.off('typing-start', callback);
      }
    };
  }

  onTypingStop(callback: (data: { userId: string; conversationId: string }) => void) {
    if (!this.socket) {
      console.warn('Cannot register typing stop callback: socket not connected');
      return;
    }
    
    this.socket.on('typing-stop', callback);
    
    // Return a function to remove this listener
    return () => {
      if (this.socket) {
        this.socket.off('typing-stop', callback);
      }
    };
  }

  markMessagesAsRead(conversationId: string) {
    if (!this.socket) {
      console.error('Cannot mark messages as read: socket is null');
      return;
    }
    
    if (!this.socket.connected) {
      console.warn('Socket is not connected, attempting to reconnect before marking messages as read');
      this.reconnect();
      setTimeout(() => {
        if (this.socket?.connected) {
          console.log('Marking messages as read after reconnect:', conversationId);
          this.socket.emit('mark-read', { conversationId });
        } else {
          console.error('Failed to reconnect before marking messages as read');
        }
      }, 1000);
      return;
    }
    
    console.log('Marking messages as read via socket for conversation:', conversationId);
    this.socket.emit('mark-read', { conversationId });
  }

  onMessagesRead(callback: (data: { conversationId: string; userId: string }) => void) {
    if (!this.socket) {
      console.warn('Cannot register messages read callback: socket not connected');
      return;
    }
    
    this.socket.on('messages-read', callback);
    
    // Return a function to remove this listener
    return () => {
      if (this.socket) {
        this.socket.off('messages-read', callback);
      }
    };
  }

  // Add new event handlers for real-time updates
  onConversationUpdate(callback: (conversation: any) => void) {
    if (!this.socket) {
      console.warn('Cannot register conversation update callback: socket not connected');
      return;
    }
    
    this.socket.on('conversation-update', callback);
    
    // Return a function to remove this listener
    return () => {
      if (this.socket) {
        this.socket.off('conversation-update', callback);
      }
    };
  }

  onConversationDelete(callback: (conversationId: string) => void) {
    if (!this.socket) {
      console.warn('Cannot register conversation delete callback: socket not connected');
      return;
    }
    
    this.socket.on('conversation-delete', callback);
    
    // Return a function to remove this listener
    return () => {
      if (this.socket) {
        this.socket.off('conversation-delete', callback);
      }
    };
  }

  onMessageDelete(callback: (data: { messageId: string; conversationId: string }) => void) {
    if (!this.socket) {
      console.warn('Cannot register message delete callback: socket not connected');
      return;
    }
    
    this.socket.on('message-delete', callback);
    
    // Return a function to remove this listener
    return () => {
      if (this.socket) {
        this.socket.off('message-delete', callback);
      }
    };
  }

  onConversationArchive(callback: (data: { conversationId: string; archived: boolean }) => void) {
    if (!this.socket) {
      console.warn('Cannot register conversation archive callback: socket not connected');
      return;
    }
    
    this.socket.on('conversation-archive', callback);
    
    // Return a function to remove this listener
    return () => {
      if (this.socket) {
        this.socket.off('conversation-archive', callback);
      }
    };
  }

  // Add new emit methods for real-time updates
  emitConversationUpdate(conversation: any) {
    if (!this.socket?.connected) {
      console.warn('Cannot emit conversation update: socket not connected');
      return;
    }
    
    this.socket.emit('conversation-update', conversation);
  }

  emitConversationDelete(conversationId: string) {
    if (!this.socket?.connected) {
      console.warn('Cannot emit conversation delete: socket not connected');
      return;
    }
    
    this.socket.emit('conversation-delete', conversationId);
  }

  emitMessageDelete(messageId: string, conversationId: string) {
    if (!this.socket?.connected) {
      console.warn('Cannot emit message delete: socket not connected');
      return;
    }
    
    this.socket.emit('message-delete', { messageId, conversationId });
  }

  emitConversationArchive(conversationId: string, archived: boolean) {
    if (!this.socket?.connected) {
      console.warn('Cannot emit conversation archive: socket not connected');
      return;
    }
    
    this.socket.emit('conversation-archive', { conversationId, archived });
  }

  disconnect() {
    // Clear all intervals and timers
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    if (this.socket) {
      console.log('Explicitly disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      
      // Clear callbacks
      this.messageCallbacks = [];
      this.notificationCallbacks = [];
      this.joinedRooms = [];
    }
  }

  reconnect() {
    // Only attempt reconnection if we have a token
    if (this.token) {
      console.log('Attempting to reconnect socket with saved token');
      this.connect(this.token);
    } else {
      console.error('Cannot reconnect: no token available');
    }
  }
  
  // Force a complete reconnection by destroying the current socket and creating a new one
  forceReconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnecting = false;
    
    if (this.token) {
      console.log('Forcing a complete socket reconnection');
      this.connect(this.token);
    }
  }
  
  isConnected(): boolean {
    return !!this.socket?.connected;
  }
  
  // Clean up event listeners on app shutdown
  cleanup() {
    this.disconnect();
    
    if (typeof window !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
  }
}

export const socketService = new SocketService();

// Ensure clean disconnection when window is closed
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    socketService.disconnect();
  });
}