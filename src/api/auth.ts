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

    console.log('Attempting login with:', {
      username_or_email: request.username_or_email,
      passwordProvided: !!request.password,
    });

    const response = await invoke<LoginResponse>('login', {
      request: {
        username_or_email: request.username_or_email,
        password: request.password,
      },
    });

    console.log('Login successful, received tokens');
    return response;
  } catch (error) {
    console.error('Login error:', error);

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
      // Store tokens in localStorage or secure storage
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });
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

    const response = await invoke<LoginResponse>('refresh_token', {
      request: {
        refresh_token: request.refresh_token,
      },
    });

    return response;
  } catch (error) {
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
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new AuthError('No active session found');
    }

    await invoke('logout', { token });

    // Clear tokens from storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  } catch (error) {
    throw new AuthError(`Logout failed: ${error}`);
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
      // Invalidate all auth queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}

/**
 * Checks if the user is authenticated
 * @returns A promise that resolves to a boolean indicating if the user is authenticated
 */
export async function checkAuth(): Promise<boolean> {
  try {
    // Check both localStorage and sessionStorage for tokens
    const token =
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('access_token');

    if (!token) return false;

    // Validate token with backend
    await invoke('validate_token', { token });
    return true;
  } catch (error) {
    // If token validation fails, try to refresh
    try {
      // Check both storage locations for refresh token
      const refreshTokenValue =
        localStorage.getItem('refresh_token') ||
        sessionStorage.getItem('refresh_token');

      if (!refreshTokenValue) return false;

      const response = await refreshToken({ refresh_token: refreshTokenValue });

      // Store the new access token in the same storage that had the refresh token
      if (localStorage.getItem('refresh_token')) {
        localStorage.setItem('access_token', response.access_token);
      } else {
        sessionStorage.setItem('access_token', response.access_token);
      }

      return true;
    } catch (refreshError) {
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
    const token = localStorage.getItem('access_token');
    if (!token) return null;

    const user = await invoke<UserResponse>('get_current_user', { token });
    return user;
  } catch (error) {
    throw new AuthError(`Failed to get current user: ${error}`);
  }
}

/**
 * React Query hook to get current user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: getCurrentUser,
    retry: false,
  });
}
