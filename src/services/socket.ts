import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  constructor() {
    this.socket = null;
  }

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.token = token;
    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: { token }
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });
  }

  joinConversations(conversations: string[]) {
    if (!this.socket?.connected) return;
    this.socket.emit('join-conversations', conversations);
  }

  sendMessage(data: { conversationId: string; content: string; receiverId: string }) {
    if (!this.socket?.connected) return;
    this.socket.emit('send-message', data);
  }

  onNewMessage(callback: (message: any) => void) {
    if (!this.socket) return;
    this.socket.on('new-message', callback);
  }

  onMessageNotification(callback: (data: any) => void) {
    if (!this.socket) return;
    this.socket.on('message-notification', callback);
  }

  startTyping(conversationId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('typing-start', { conversationId });
  }

  stopTyping(conversationId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('typing-stop', { conversationId });
  }

  onTypingStart(callback: (data: { userId: string; conversationId: string }) => void) {
    if (!this.socket) return;
    this.socket.on('typing-start', callback);
  }

  onTypingStop(callback: (data: { userId: string; conversationId: string }) => void) {
    if (!this.socket) return;
    this.socket.on('typing-stop', callback);
  }

  markMessagesAsRead(conversationId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('mark-read', { conversationId });
  }

  onMessagesRead(callback: (data: { conversationId: string; userId: string }) => void) {
    if (!this.socket) return;
    this.socket.on('messages-read', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  reconnect() {
    if (this.token) {
      this.connect(this.token);
    }
  }
}

export const socketService = new SocketService();