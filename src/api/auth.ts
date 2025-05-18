import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { z } from "zod";

// Schema definitions
export const LoginRequestSchema = z.object({
	username_or_email: z.string().min(1, "Username or email is required"),
	password: z.string().min(1, "Password is required"),
});

export const RefreshTokenRequestSchema = z.object({
	refresh_token: z.string().min(1, "Refresh token is required"),
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
		this.name = "AuthError";
	}
}

// Query keys
export const authKeys = {
	all: ["auth"] as const,
	session: () => [...authKeys.all, "session"] as const,
	user: () => [...authKeys.all, "user"] as const,
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

		console.log("Attempting login with:", {
			username_or_email: request.username_or_email,
			passwordProvided: !!request.password,
		});

		const response = await invoke<LoginResponse>("login", {
			request: {
				username_or_email: request.username_or_email,
				password: request.password,
			},
		});

		console.log("Login successful, received tokens");
		return response;
	} catch (error) {
		console.error("Login error:", error);

		if (error instanceof z.ZodError) {
			throw new AuthError(
				`Validation error: ${error.errors.map((e) => e.message).join(", ")}`,
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
		onSuccess: (data) => {
			console.log("Login API: Login successful, updating query cache");

			// Store tokens in localStorage or secure storage
			localStorage.setItem("access_token", data.access_token);
			localStorage.setItem("refresh_token", data.refresh_token);

			// Immediately update auth session state in cache
			queryClient.setQueryData(["auth", "session"], true);

			// Store user data in cache
			queryClient.setQueryData(["auth", "user"], data.user);

			// Invalidate relevant queries
			queryClient.invalidateQueries({ queryKey: authKeys.all });

			console.log("Login API: Auth state updated in query cache");

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

		const response = await invoke<LoginResponse>("refresh_token", {
			request: {
				refresh_token: request.refresh_token,
			},
		});

		return response;
	} catch (error) {
		if (error instanceof z.ZodError) {
			throw new AuthError(
				`Validation error: ${error.errors.map((e) => e.message).join(", ")}`,
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
		onSuccess: (data) => {
			// Update access token in storage
			localStorage.setItem("access_token", data.access_token);

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
			localStorage.getItem("access_token") ||
			sessionStorage.getItem("access_token");

		if (token) {
			// Only call the backend if we have a token
			try {
				await invoke("logout", { token });
				console.log("Backend logout successful");
			} catch (error) {
				console.warn(
					"Backend logout failed, continuing with client-side cleanup:",
					error,
				);
			}
		} else {
			console.log(
				"No active session found, performing client-side cleanup only",
			);
		}

		// Always clear tokens from storage regardless of backend success
		localStorage.removeItem("access_token");
		localStorage.removeItem("refresh_token");
		sessionStorage.removeItem("access_token");
		sessionStorage.removeItem("refresh_token");

		console.log("Client-side logout completed, tokens cleared");
	} catch (error) {
		console.error("Logout error:", error);
		// Still clear tokens even if there was an error
		localStorage.removeItem("access_token");
		localStorage.removeItem("refresh_token");
		sessionStorage.removeItem("access_token");
		sessionStorage.removeItem("refresh_token");

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
			queryClient.setQueryData(["auth", "session"], false);

			// Remove user data from cache
			queryClient.setQueryData(["auth", "user"], null);

			// Invalidate all auth queries
			queryClient.invalidateQueries({ queryKey: authKeys.all });

			console.log(
				"Logout mutation successful, auth queries invalidated and state reset",
			);
		},
		onError: (error) => {
			console.warn(
				"Logout mutation error, but continuing with cleanup:",
				error,
			);

			// Even on error, immediately set auth session to false
			queryClient.setQueryData(["auth", "session"], false);

			// Remove user data from cache
			queryClient.setQueryData(["auth", "user"], null);

			// Invalidate all auth queries
			queryClient.invalidateQueries({ queryKey: authKeys.all });

			console.log("Auth state reset after logout error");
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
			localStorage.getItem("access_token") ||
			sessionStorage.getItem("access_token");

		if (!token) return false;

		// Validate token with backend
		await invoke("validate_token", { token });
		return true;
	} catch (error) {
		// If token validation fails, try to refresh
		try {
			// Check both storage locations for refresh token
			const refreshTokenValue =
				localStorage.getItem("refresh_token") ||
				sessionStorage.getItem("refresh_token");

			if (!refreshTokenValue) return false;

			const response = await refreshToken({ refresh_token: refreshTokenValue });

			// Store the new access token in the same storage that had the refresh token
			if (localStorage.getItem("refresh_token")) {
				localStorage.setItem("access_token", response.access_token);
			} else {
				sessionStorage.setItem("access_token", response.access_token);
			}

			return true;
		} catch (refreshError) {
			// If refresh fails, user is not authenticated
			localStorage.removeItem("access_token");
			localStorage.removeItem("refresh_token");
			sessionStorage.removeItem("access_token");
			sessionStorage.removeItem("refresh_token");
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
		console.log("getCurrentUser: Attempting to fetch user data");

		// Check if we have an access token
		const token =
			localStorage.getItem("access_token") ||
			sessionStorage.getItem("access_token");

		if (!token) {
			console.log("getCurrentUser: No access token found, returning null");
			return null;
		}

		console.log("getCurrentUser: Access token found, fetching user data");

		// Invoke the backend API to get current user
		const user = await invoke<UserResponse>("get_current_user", { token });

		console.log("getCurrentUser: User data fetched successfully", user);
		return user;
	} catch (error) {
		console.error("getCurrentUser: Error fetching user data:", error);

		// Check if error is due to token expiration or invalidation
		if (
			error instanceof Error &&
			(error.message.includes("expired") ||
				error.message.includes("invalid") ||
				error.message.includes("token"))
		) {
			console.log(
				"getCurrentUser: Token appears to be invalid, attempting refresh",
			);

			try {
				// Try to refresh the token
				const refreshTokenValue =
					localStorage.getItem("refresh_token") ||
					sessionStorage.getItem("refresh_token");

				if (refreshTokenValue) {
					console.log(
						"getCurrentUser: Refresh token found, attempting to refresh",
					);

					const response = await refreshToken({
						refresh_token: refreshTokenValue,
					});

					// Store the new access token
					if (localStorage.getItem("refresh_token")) {
						localStorage.setItem("access_token", response.access_token);
					} else {
						sessionStorage.setItem("access_token", response.access_token);
					}

					console.log("getCurrentUser: Token refreshed, retrying user fetch");

					// Retry fetching user with new token
					const user = await invoke<UserResponse>("get_current_user", {
						token: response.access_token,
					});

					console.log(
						"getCurrentUser: User data fetched successfully after token refresh",
						user,
					);
					return user;
				}
			} catch (refreshError) {
				console.error("getCurrentUser: Token refresh failed:", refreshError);
				// If refresh fails, clear tokens and return null
				localStorage.removeItem("access_token");
				localStorage.removeItem("refresh_token");
				sessionStorage.removeItem("access_token");
				sessionStorage.removeItem("refresh_token");
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
	const authSession = queryClient.getQueryData<boolean>(["auth", "session"]);

	return useQuery({
		queryKey: authKeys.user(),
		queryFn: getCurrentUser,
		// Only run the query if we believe the user is authenticated
		enabled: authSession !== false,
		// Don't retry on 401/403 errors
		retry: (failureCount, error) => {
			if (
				error instanceof AuthError &&
				(error.message.includes("unauthorized") ||
					error.message.includes("forbidden"))
			) {
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
