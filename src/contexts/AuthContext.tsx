import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  apiRequest: <T = any>(endpoint: string, options?: RequestInit) => Promise<T>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

// Auth Service - handles token storage and API calls
class AuthService {
  public baseURL: string = process.env.REACT_APP_API_URL?.replace('/api/v1', '') || 'https://localhost:8080';
  public adminOrigin: string = process.env.REACT_APP_ADMIN_ORIGIN || 'http://localhost:3001';

  // All token and user management is now handled by httpOnly cookies
  // These methods are removed as they're no longer needed

  async verifyAuthentication(): Promise<{ isAuthenticated: boolean; user?: User }> {
    try {
      // Use the user profile endpoint to verify authentication
      // This endpoint works for both admin and regular users
      const profileResponse = await fetch(`${this.baseURL}/api/v1/user/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (profileResponse.ok) {
        const userData = await profileResponse.json();
        if (userData.role === 'admin') {
          return { isAuthenticated: true, user: userData };
        } else {
          // User is authenticated but not admin
          return { isAuthenticated: false };
        }
      }
      
      return { isAuthenticated: false };
    } catch (error) {
      console.error('Authentication verification failed:', error);
      return { isAuthenticated: false };
    }
  }

  async loginWithGoogle(): Promise<AuthResponse> {
    return new Promise((resolve, reject) => {
      const adminOrigin = this.adminOrigin;
      console.log('Opening Google OAuth popup to:', `${this.baseURL}/auth/google?popup=true&origin=${encodeURIComponent(adminOrigin)}`);
      
      const popup = window.open(
        `${this.baseURL}/auth/google?popup=true&origin=${encodeURIComponent(adminOrigin)}`,
        'googleAuth',
        'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,toolbar=no,menubar=no,location=no'
      );

      if (!popup) {
        reject(new Error('Could not open popup window. Please check if popups are blocked.'));
        return;
      }

      // Focus the popup
      popup.focus();

      const handleMessage = (event: MessageEvent) => {
        console.log('Admin popup message received:', {
          origin: event.origin,
          expectedOrigin: this.baseURL,
          data: event.data,
          eventType: event.data?.type
        });

        // Ignore browser extension messages
        if (event.data && typeof event.data === 'object' && event.data.type) {
          console.log('Ignoring browser extension message:', event.data.type);
          return;
        }

        // Check origin securely
        const expectedOrigin = this.baseURL;
        const actualOrigin = event.origin;
        
        // Only allow messages from the configured backend origin
        if (actualOrigin !== expectedOrigin) {
          console.warn('Rejecting message from unexpected origin:', actualOrigin, 'expected:', expectedOrigin);
          return;
        }

        if (event.data && event.data.success && event.data.user) {
          console.log('Admin authentication successful');
          console.log('Admin user data:', event.data.user);
          console.log('CSRF token:', event.data.csrfToken);
          
          // Check if user has admin role
          if (event.data.user.role !== 'admin') {
            window.removeEventListener('message', handleMessage);
            popup.close();
            reject(new Error('Access denied. Admin privileges required.'));
            return;
          }
          
          // CSRF token is now stored in httpOnly cookie by the backend
          // No need to store it in localStorage
          
          // Clean up listeners - popup will be closed by backend
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          
          resolve({
            success: true,
            user: event.data.user,
            csrfToken: event.data.csrfToken
          });
        } else if (event.data && event.data.error) {
          console.error('Admin auth error:', event.data.error);
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          reject(new Error(event.data.error));
        } else {
          console.log('Unexpected message data:', event.data);
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup is closed
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          reject(new Error('Authentication cancelled - popup was closed'));
        }
      }, 1000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
        reject(new Error('Authentication timeout'));
      }, 300000);
    });
  }

  async logout(): Promise<void> {
    try {
      // Call backend logout to clear httpOnly cookies
      await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Admin logout error:', error);
    }
    // All cookies are cleared by the backend, no localStorage to clear
  }

  async apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // CSRF token is now stored in httpOnly cookie by the backend
    // No need to get it from localStorage
    
    const config: RequestInit = {
      ...options,
      credentials: 'include', // Include httpOnly cookies (including CSRF token)
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const url = `${this.baseURL}/api/v1${endpoint}`;
    console.log('Admin API request:', { url, config });

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
          throw new Error('Authentication required');
        }
        
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If not JSON, use the text as is
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      throw new Error('Invalid JSON response from server');
    } catch (error) {
      console.error('Admin API request failed:', error);
      throw error;
    }
  }
}

const authService = new AuthService();

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        console.log('Checking authentication status...');
        
        // Verify authentication with the backend using httpOnly cookies
        const { isAuthenticated, user } = await authService.verifyAuthentication();
        
        if (isAuthenticated && user) {
          console.log('User authenticated:', user);
          setUser(user);
        } else {
          console.log('No authentication found');
          setUser(null);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, []);


  const login = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const { user: userData } = await authService.loginWithGoogle();
      
      // Set user in React state only (no localStorage with httpOnly cookies)
      setUser(userData);
    } catch (error) {
      console.error('Admin login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    await authService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    apiRequest: authService.apiRequest.bind(authService),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
