import { login as apiLogin, logout as apiLogout, checkAuth } from '@/api/auth';
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    username: string,
    password: string,
    rememberMe: boolean,
  ) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const verifyAuth = async () => {
      try {
        const isAuth = await checkAuth();
        setIsAuthenticated(isAuth);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = async (
    username: string,
    password: string,
    rememberMe: boolean,
  ) => {
    try {
      console.log('Auth context: Starting login process');

      // Call the API login function
      const response = await apiLogin({
        username_or_email: username,
        password,
      });

      console.log('Auth context: Login successful, updating state');

      // Store tokens based on rememberMe preference
      if (rememberMe) {
        // For "remember me", we store tokens in localStorage
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
      } else {
        // For session-only login, we use sessionStorage
        sessionStorage.setItem('access_token', response.access_token);
        sessionStorage.setItem('refresh_token', response.refresh_token);
      }

      // Update authentication state
      setIsAuthenticated(true);
      console.log('Auth context: Authentication state updated to true');
    } catch (error) {
      console.error('Auth context: Login failed', error);
      // Ensure authentication state is false on error
      setIsAuthenticated(false);
      // Re-throw the error for the component to handle
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
