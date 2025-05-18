import { login as apiLogin, logout as apiLogout, checkAuth } from '@/api/auth';
import { createContextLogger } from '@/lib/logger';
import { useQueryClient } from '@tanstack/react-query';
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

// Create a context-specific logger
const log = createContextLogger('AuthContext');

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Check if user is already authenticated
    const verifyAuth = async () => {
      try {
        const isAuth = await checkAuth();
        setIsAuthenticated(isAuth);

        // Synchronize with React Query cache
        queryClient.setQueryData(['auth', 'session'], isAuth);
        log.info('Initial auth state synchronized with query cache', {
          isAuth,
        });
      } catch (error) {
        setIsAuthenticated(false);
        queryClient.setQueryData(['auth', 'session'], false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [queryClient]);

  // Synchronize auth state with React Query cache whenever it changes
  useEffect(() => {
    queryClient.setQueryData(['auth', 'session'], isAuthenticated);
    log.info('Auth state changed, updated query cache', { isAuthenticated });
  }, [isAuthenticated, queryClient]);

  const login = async (
    username: string,
    password: string,
    rememberMe: boolean,
  ) => {
    try {
      log.info('Starting login process');

      // Call the API login function
      const response = await apiLogin({
        username_or_email: username,
        password,
      });

      log.info('Login successful, updating state');

      // Store tokens based on rememberMe preference
      if (rememberMe) {
        // For "remember me", we store tokens in localStorage
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
        log.debug('Tokens stored in localStorage (remember me enabled)');
      } else {
        // For session-only login, we use sessionStorage
        sessionStorage.setItem('access_token', response.access_token);
        sessionStorage.setItem('refresh_token', response.refresh_token);
        log.debug('Tokens stored in sessionStorage (remember me disabled)');
      }

      // Update authentication state
      setIsAuthenticated(true);

      // Explicitly update React Query cache
      queryClient.setQueryData(['auth', 'session'], true);
      queryClient.setQueryData(['auth', 'user'], response.user);

      log.info(
        'Authentication state updated to true and synchronized with query cache',
        {
          username: response.user.username,
          role: response.user.role,
        },
      );
    } catch (error) {
      log.error('Login failed', error);
      // Ensure authentication state is false on error
      setIsAuthenticated(false);
      queryClient.setQueryData(['auth', 'session'], false);
      // Re-throw the error for the component to handle
      throw error;
    }
  };

  const logout = async () => {
    try {
      log.info('Starting logout process');
      await apiLogout();
      setIsAuthenticated(false);
      queryClient.setQueryData(['auth', 'session'], false);
      queryClient.setQueryData(['auth', 'user'], null);
      log.info(
        'Logout successful, auth state reset and synchronized with query cache',
      );
    } catch (error) {
      log.error('Logout failed', error);
      // Still reset auth state on error
      setIsAuthenticated(false);
      queryClient.setQueryData(['auth', 'session'], false);
      queryClient.setQueryData(['auth', 'user'], null);
      log.warn('Auth state reset despite logout error');
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
