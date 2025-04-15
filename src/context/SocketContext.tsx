import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_URL } from '../config';
import { socketService } from '../services/socket';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Get token from localStorage
    const storedToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    
    // Only connect if we have a token (either through context or localStorage)
    const shouldConnect = (isAuthenticated || (storedToken && storedUser)) && !socketRef.current;
    
    if (!shouldConnect) {
      return;
    }

    console.log('Initializing socket connection...');

    // Create socket connection
    try {
      // Extract base URL without /api 
      const baseUrl = API_URL.replace(/\/api\/?$/, '');
      console.log('Socket attempting to connect to:', baseUrl);
      
      // Force disconnect any existing socket to prevent duplicate connections
      if (socketRef.current) {
        console.log('Disconnecting existing socket before creating new one');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      const socketInstance = io(baseUrl, {
        auth: { token: storedToken },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        forceNew: true // Force a new connection
      });

      socketRef.current = socketInstance;

      // Also initialize the socketService for redundancy
      if (storedToken) {
        socketService.connect(storedToken);
      }

      // Set up event listeners
      socketInstance.on('connect', () => {
        console.log('Socket connected successfully with ID:', socketInstance.id);
        setIsConnected(true);
        
        // Trigger a re-join of all conversation rooms after connection
        // This handles reconnection scenarios
        const user = storedUser ? JSON.parse(storedUser) : null;
        if (user) {
          console.log('Attempting to auto-join user conversations after connection');
        }
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        
        // Attempt to reconnect if this wasn't a manual disconnect
        if (reason === 'io server disconnect' || reason === 'transport close') {
          console.log('Attempting to reconnect after disconnect...');
          socketInstance.connect();
        }
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

      // Save socket instance
      setSocket(socketInstance);

      // Clean up on unmount
      return () => {
        console.log('Cleaning up socket connection...');
        socketInstance.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      socketRef.current = null;
      setIsConnected(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!socket) return;

    const logSocketStatus = () => {
      console.log(`Socket status check - Connected: ${socket.connected}, ID: ${socket.id}`);
    };

    // Log current status
    logSocketStatus();

    // Setup status check interval for debugging
    const statusInterval = setInterval(logSocketStatus, 60000); // Every minute

    // Listen for reconnection events
    socket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      
      // Notify other components about the reconnection
      window.dispatchEvent(new CustomEvent('socket-reconnected'));
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket reconnection attempt #${attemptNumber}`);
    });

    socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('Socket failed to reconnect, giving up');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Listen for server confirmation events
    socket.on('connection-confirmed', (data) => {
      console.log('Server confirmed socket connection:', data);
    });

    socket.on('rooms-joined', (data) => {
      console.log('Server confirmed rooms joined:', data.rooms);
    });

    return () => {
      clearInterval(statusInterval);
      socket.off('reconnect');
      socket.off('reconnect_attempt');
      socket.off('reconnect_error');
      socket.off('reconnect_failed');
      socket.off('error');
      socket.off('connection-confirmed');
      socket.off('rooms-joined');
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}; 