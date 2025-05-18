import { createComponentLogger } from '@/lib/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';

// Schema definitions
export const LoginRequestSchema = z.object({
  username_or_email: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshTokenRequestSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email(),
  role: z.string(),
});

export const LoginResponseSchema = z.object({
  user: UserResponseSchema,
  access_token: z.string(),
  refresh_token: z.string(),
});

// Type definitions
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// Create a logger specifically for the auth module
// Fix: Changed from createComponentLogger to createServiceLogger for auth service
const log = createComponentLogger('auth');

// Error handling
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
  user: () => [...authKeys.all, 'user'] as const,
};

/**
 * Logs in a user with username/email and password
 * @param request Login credentials
 * @returns A promise that resolves to the login response with user and tokens
 */
export async function login(request: LoginRequest): Promise<LoginResponse> {
  try {
    // Validate input with Zod
    LoginRequestSchema.parse(request);

    // Fix: Replace console.log with logger
    log.info('Attempting login with', {
      username_or_email: request.username_or_email,
      passwordProvided: !!request.password,
    });

    const response = await invoke<LoginResponse>('login', {
      request: {
        username_or_email: request.username_or_email,
        password: request.password,
      },
    });

    log.info('Login successful, received tokens');
    return response;
  } catch (error) {
    log.error('Login error', error);

    if (error instanceof z.ZodError) {
      throw new AuthError(
        `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
      );
    }
    throw new AuthError(`Login failed: ${error}`);
  }
}

/**
 * React Query hook for login
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: data => {
      log.info('Login API: Login successful, updating query cache');

      // Store tokens in localStorage or secure storage
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);

      // Immediately update auth session state in cache
      queryClient.setQueryData(['auth', 'session'], true);

      // Store user data in cache
      queryClient.setQueryData(['auth', 'user'], data.user);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });

      log.info('Login API: Auth state updated in query cache', {
        username: data.user.username,
      });

      return data;
    },
  });
}

/**
 * Refreshes the access token using a refresh token
 * @param request Refresh token request
 * @returns A promise that resolves to the login response with new access token
 */
export async function refreshToken(
  request: RefreshTokenRequest,
): Promise<LoginResponse> {
  try {
    // Validate input with Zod
    RefreshTokenRequestSchema.parse(request);

    log.debug('Attempting to refresh token');

    const response = await invoke<LoginResponse>('refresh_token', {
      request: {
        refresh_token: request.refresh_token,
      },
    });

    log.info('Token refresh successful');
    return response;
  } catch (error) {
    log.error('Token refresh failed', error);

    if (error instanceof z.ZodError) {
      throw new AuthError(
        `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
      );
    }
    throw new AuthError(`Token refresh failed: ${error}`);
  }
}

/**
 * React Query hook for token refresh
 */
export function useRefreshToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: refreshToken,
    onSuccess: data => {
      // Update access token in storage
      localStorage.setItem('access_token', data.access_token);

      log.info('Token refreshed and updated in storage');

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });
}

/**
 * Logs out the current user
 * @returns A promise that resolves when logout is successful
 */
export async function logout(): Promise<void> {
  try {
    // Check both localStorage and sessionStorage for tokens
    const token =
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('access_token');

    if (token) {
      // Only call the backend if we have a token
      try {
        log.info('Calling backend logout endpoint');
        await invoke('logout', { token });
        log.info('Backend logout successful');
      } catch (error) {
        log.warn(
          'Backend logout failed, continuing with client-side cleanup',
          error,
        );
      }
    } else {
      log.info('No active session found, performing client-side cleanup only');
    }

    // Always clear tokens from storage regardless of backend success
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');

    log.info('Client-side logout completed, tokens cleared');
  } catch (error) {
    log.error('Logout error', error);
    // Still clear tokens even if there was an error
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');

    throw new AuthError(`Logout process encountered an error: ${error}`);
  }
}

/**
 * React Query hook for logout
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Immediately set auth session to false
      queryClient.setQueryData(['auth', 'session'], false);

      // Remove user data from cache
      queryClient.setQueryData(['auth', 'user'], null);

      // Invalidate all auth queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });

      log.info(
        'Logout mutation successful, auth queries invalidated and state reset',
      );
    },
    onError: error => {
      log.warn('Logout mutation error, but continuing with cleanup', error);

      // Even on error, immediately set auth session to false
      queryClient.setQueryData(['auth', 'session'], false);

      // Remove user data from cache
      queryClient.setQueryData(['auth', 'user'], null);

      // Invalidate all auth queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });

      log.info('Auth state reset after logout error');
    },
  });
}

/**
 * Checks if the user is authenticated
 * @returns A promise that resolves to a boolean indicating if the user is authenticated
 */
export async function checkAuth(): Promise<boolean> {
  try {
    log.debug('Checking authentication status');

    // Check both localStorage and sessionStorage for tokens
    const token =
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('access_token');

    if (!token) {
      log.info('No token found, user is not authenticated');
      return false;
    }

    // Validate token with backend
    log.debug('Token found, validating with backend');
    await invoke('validate_token', { token });
    log.info('Token validated successfully, user is authenticated');
    return true;
  } catch (error) {
    log.warn('Token validation failed, attempting refresh', error);

    // If token validation fails, try to refresh
    try {
      // Check both storage locations for refresh token
      const refreshTokenValue =
        localStorage.getItem('refresh_token') ||
        sessionStorage.getItem('refresh_token');

      if (!refreshTokenValue) {
        log.info('No refresh token found, user is not authenticated');
        return false;
      }

      log.debug('Refresh token found, attempting to refresh');
      const response = await refreshToken({ refresh_token: refreshTokenValue });

      // Store the new access token in the same storage that had the refresh token
      if (localStorage.getItem('refresh_token')) {
        localStorage.setItem('access_token', response.access_token);
      } else {
        sessionStorage.setItem('access_token', response.access_token);
      }

      log.info('Token refreshed successfully, user is authenticated');
      return true;
    } catch (refreshError) {
      log.error(
        'Token refresh failed, user is not authenticated',
        refreshError,
      );

      // If refresh fails, user is not authenticated
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      return false;
    }
  }
}

/**
 * React Query hook to check authentication status
 */
export function useAuthCheck() {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: checkAuth,
  });
}

/**
 * Gets the current user information
 * @returns A promise that resolves to the current user or null if not authenticated
 */
export async function getCurrentUser(): Promise<UserResponse | null> {
  try {
    log.info('Attempting to fetch user data');

    // Check if we have an access token
    const token =
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('access_token');

    if (!token) {
      log.warn('No access token found, returning null');
      return null;
    }

    log.debug('Access token found, fetching user data');

    // Invoke the backend API to get current user
    const user = await invoke<UserResponse>('get_current_user', { token });

    log.info('User data fetched successfully', user);
    return user;
  } catch (error) {
    log.error('Error fetching user data', error);

    // Check if error is due to token expiration or invalidation
    if (
      error instanceof Error &&
      (error.message.includes('expired') ||
        error.message.includes('invalid') ||
        error.message.includes('token'))
    ) {
      log.info('Token appears to be invalid, attempting refresh');

      try {
        // Try to refresh the token
        const refreshTokenValue =
          localStorage.getItem('refresh_token') ||
          sessionStorage.getItem('refresh_token');

        if (refreshTokenValue) {
          log.debug('Refresh token found, attempting to refresh');

          const response = await refreshToken({
            refresh_token: refreshTokenValue,
          });

          // Store the new access token
          if (localStorage.getItem('refresh_token')) {
            localStorage.setItem('access_token', response.access_token);
          } else {
            sessionStorage.setItem('access_token', response.access_token);
          }

          log.info('Token refreshed, retrying user fetch');

          // Retry fetching user with new token
          const user = await invoke<UserResponse>('get_current_user', {
            token: response.access_token,
          });

          log.info('User data fetched successfully after token refresh', user);
          return user;
        }
      } catch (refreshError) {
        log.error('Token refresh failed', refreshError);
        // If refresh fails, clear tokens and return null
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        return null;
      }
    }

    // For other errors, throw a standardized error
    throw new AuthError(`Failed to get current user: ${error}`);
  }
}

/**
 * React Query hook to get current user
 */
export function useCurrentUser() {
  const queryClient = useQueryClient();
  const authSession = queryClient.getQueryData<boolean>(['auth', 'session']);

  return useQuery({
    queryKey: authKeys.user(),
    queryFn: getCurrentUser,
    // Only run the query if we believe the user is authenticated
    enabled: authSession !== false,
    // Don't retry on 401/403 errors
    retry: (failureCount, error) => {
      if (
        error instanceof AuthError &&
        (error.message.includes('unauthorized') ||
          error.message.includes('forbidden'))
      ) {
        log.debug('Not retrying query due to auth error', error);
        return false;
      }
      // Default retry behavior for other errors (up to 3 times)
      return failureCount < 3;
    },
    // Refresh user data every 5 minutes while the app is open
    refetchInterval: 5 * 60 * 1000,
    // Stale time of 1 minute - don't refetch too frequently
    staleTime: 60 * 1000,
  });
}
