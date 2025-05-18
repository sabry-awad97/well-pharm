import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';
import { z } from 'zod';

// Schema definitions
export const DatabaseConfigSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.number().int().positive('Port must be a positive integer'),
  name: z.string().min(1, 'Database name is required'),
  user: z.string().min(1, 'Username is required'),
  password: z.string(),
});

export const AdminUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const WorkspaceSettingsSchema = z.object({
  name: z.string().min(1, 'Workspace name is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Invalid email address'),
  license: z.string().min(1, 'License number is required'),
});

// Type definitions
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
export type AdminUser = z.infer<typeof AdminUserSchema>;
export type WorkspaceSettings = z.infer<typeof WorkspaceSettingsSchema>;

// Error handling
export class OnboardingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OnboardingError';
  }
}

// Query keys
export const onboardingKeys = {
  all: ['onboarding'] as const,
  status: () => [...onboardingKeys.all, 'status'] as const,
};

/**
 * Checks if the onboarding process has been completed
 * @returns A promise that resolves to a boolean indicating if onboarding is completed
 */
export async function checkOnboardingStatus(): Promise<boolean> {
  try {
    return await invoke<boolean>('check_onboarding_status');
  } catch (error) {
    throw new OnboardingError(`Failed to check onboarding status: ${error}`);
  }
}

/**
 * React Query hook to check onboarding status
 */
export function useOnboardingStatus() {
  return useQuery({
    queryKey: onboardingKeys.status(),
    queryFn: checkOnboardingStatus,
  });
}

/**
 * Configures the database connection
 * @param config Database configuration parameters
 * @returns A promise that resolves when the database is configured
 */
export async function configureDatabase(config: DatabaseConfig): Promise<void> {
  try {
    // Validate input with Zod
    DatabaseConfigSchema.parse(config);

    await invoke('configure_database', {
      host: config.host,
      port: config.port,
      name: config.name,
      user: config.user,
      password: config.password,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new OnboardingError(
        `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
      );
    }
    throw new OnboardingError(`Failed to configure database: ${error}`);
  }
}

/**
 * React Query hook to configure database
 */
export function useConfigureDatabase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: configureDatabase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.status() });
    },
  });
}

/**
 * Creates an admin user
 * @param user Admin user details
 * @returns A promise that resolves when the admin user is created
 */
export async function createAdminUser(user: AdminUser): Promise<void> {
  try {
    // Validate input with Zod
    AdminUserSchema.parse(user);

    await invoke('create_admin_user', {
      name: user.name,
      email: user.email,
      password: user.password,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new OnboardingError(
        `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
      );
    }
    throw new OnboardingError(`Failed to create admin user: ${error}`);
  }
}

/**
 * React Query hook to create admin user
 */
export function useCreateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.status() });
    },
  });
}

/**
 * Sets up the workspace with pharmacy details
 * @param settings Workspace settings
 * @returns A promise that resolves when the workspace is set up
 */
export async function setupWorkspace(
  settings: WorkspaceSettings,
): Promise<void> {
  try {
    // Validate input with Zod
    WorkspaceSettingsSchema.parse(settings);

    await invoke('setup_workspace', {
      name: settings.name,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      license: settings.license,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new OnboardingError(
        `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
      );
    }
    throw new OnboardingError(`Failed to set up workspace: ${error}`);
  }
}

/**
 * React Query hook to setup workspace
 */
export function useSetupWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setupWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.status() });
    },
  });
}

/**
 * Completes the onboarding process
 * @returns A promise that resolves when onboarding is completed
 */
export async function completeOnboarding(): Promise<void> {
  try {
    await invoke('complete_onboarding');
  } catch (error) {
    throw new OnboardingError(`Failed to complete onboarding: ${error}`);
  }
}

/**
 * React Query hook to complete onboarding
 */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.status() });
    },
  });
}

/**
 * Type for the full onboarding process
 */
export type OnboardingProcess = {
  dbConfig: DatabaseConfig;
  adminUser: AdminUser;
  workspaceSettings: WorkspaceSettings;
};

/**
 * Runs the entire onboarding process in sequence
 * @param data Object containing all required onboarding data
 * @returns A promise that resolves when the entire onboarding process is completed
 */
export async function runOnboardingProcess(
  data: OnboardingProcess,
): Promise<void> {
  try {
    // Step 1: Configure database
    await configureDatabase(data.dbConfig);

    // Step 2: Create admin user
    await createAdminUser(data.adminUser);

    // Step 3: Setup workspace
    await setupWorkspace(data.workspaceSettings);

    // Step 4: Complete onboarding
    await completeOnboarding();
  } catch (error) {
    throw new OnboardingError(`Onboarding process failed: ${error}`);
  }
}

/**
 * React Query hook to run the complete onboarding process
 */
export function useRunOnboardingProcess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runOnboardingProcess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.all });
    },
  });
}

export interface DbConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
}

export function useTestDatabaseConnection() {
  return useMutation({
    mutationFn: async (dbConfig: DbConfig) => {
      await invoke('test_database_connection', { dbConfig });
      return true;
    },
  });
}
