import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

interface User {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  avatar?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  ensureToken: () => string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUser: () => {},
  ensureToken: () => null
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');
        
        console.log('AUTH: Checking authentication on init', { 
          hasToken: !!storedToken, 
          hasUser: !!storedUser,
          tokenPreview: storedToken ? `${storedToken.substring(0, 10)}...` : 'none' 
        });
        
        if (storedToken && storedUser) {
          // Set token in axios defaults
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          setToken(storedToken);
          
          try {
            // Use stored user data since /auth/me endpoint doesn't exist
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setIsAuthenticated(true);
            console.log('AUTH: Authenticated with stored user data:', parsedUser.email, parsedUser.role);
            
            // Optionally, verify token validity with a lightweight API call
            try {
              await axios.get(`${API_URL}/api/auth/verify-token`, {
                headers: { Authorization: `Bearer ${storedToken}` }
              });
              console.log('AUTH: Token verified successfully');
            } catch (tokenError) {
              console.warn('AUTH: Token verification failed, but continuing with stored credentials', tokenError);
            }
          } catch (parseError) {
            console.error('AUTH: Failed to parse stored user:', parseError);
            cleanupAuth();
          }
        } else {
          console.log('AUTH: No token or user found in localStorage');
          cleanupAuth();
        }
      } catch (error) {
        console.error('AUTH: Authentication check failed:', error);
        cleanupAuth();
      } finally {
        setIsLoading(false);
      }
    };
    
    // Helper function to clean up auth state
    const cleanupAuth = () => {
      console.log('AUTH: Cleaning up authentication state');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('AUTH: Attempting login for', email);
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      }, {
        withCredentials: true
      });
      
      const { user, token } = response.data;
      
      console.log('AUTH: Login successful', { 
        userId: user._id, 
        email: user.email,
        role: user.role,
        tokenPreview: token ? `${token.substring(0, 10)}...` : 'none'
      });
      
      // Save token and user to localStorage
      localStorage.setItem('accessToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userId', user._id);
      localStorage.setItem('userRole', user.role);
      
      // Set token in axios defaults
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      setToken(token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('AUTH: Login failed:', error);
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      console.log('AUTH: Attempting registration for', userData.email);
      const response = await axios.post(`${API_URL}/api/auth/register`, userData, {
        withCredentials: true
      });
      
      const { user, token } = response.data;
      
      console.log('AUTH: Registration successful', { 
        userId: user._id, 
        email: user.email,
        role: user.role 
      });
      
      // Save token and user to localStorage
      localStorage.setItem('accessToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userId', user._id);
      localStorage.setItem('userRole', user.role);
      
      // Set token in axios defaults
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      setToken(token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('AUTH: Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('AUTH: Logging out user');
    // Remove token and user from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    
    // Remove token from axios defaults
    delete axios.defaults.headers.common['Authorization'];
    
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log('AUTH: User data updated', updatedUser);
    }
  };
  
  // Ensure token is set in axios defaults
  const ensureToken = () => {
    const currentToken = token || localStorage.getItem('accessToken');
    
    if (currentToken) {
      // Make sure token is set in axios defaults
      axios.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
      console.log('AUTH: Token ensured for API call', currentToken.substring(0, 10) + '...');
      return currentToken;
    }
    
    console.warn('AUTH: No token available when requested');
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        ensureToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 