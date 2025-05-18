import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { createComponentLogger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { Loader2, Pill } from 'lucide-react';

// Create a component-specific logger
const log = createComponentLogger('LoginPage');

// Define the form schema with Zod
const loginFormSchema = z.object({
  username_or_email: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});

// Define the form values type
type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Log component initialization
  useEffect(() => {
    log.debug('Component initialized');
    return () => {
      log.debug('Component unmounting');
    };
  }, []);

  // Initialize form with react-hook-form and zod validation
  const form = useForm({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username_or_email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Handle form submission
  const onSubmit = async (data: LoginFormValues) => {
    log.info('Login form submitted', {
      username_or_email: data.username_or_email,
      rememberMe: data.rememberMe,
    });

    setIsLoading(true);
    setError(null);

    try {
      log.debug('Attempting login via auth context');

      // Use the login function from our auth context
      await login(data.username_or_email, data.password, data.rememberMe);

      log.info(
        'Login successful, updating query cache and preparing navigation',
      );

      // Show success toast notification
      toast.success('Successfully logged in', {
        description: 'Welcome back to WellPharm',
        duration: 3000,
      });

      // Explicitly update the query cache to ensure consistency
      queryClient.setQueryData(['auth', 'session'], true);
      log.debug('Query cache updated with authentication state');

      // Force a small delay to ensure state updates are processed
      // and avoid any race conditions with the authentication state
      setTimeout(() => {
        log.debug('Executing navigation to dashboard');

        // Try to get previous location from session storage
        const previousPath = sessionStorage.getItem('previousPath') || '/';
        log.info('Navigating to path', { path: previousPath });

        // Navigate to previous path or dashboard
        navigate({
          to: previousPath,
          replace: true, // Use replace to avoid back button issues
        });
      }, 300); // Increased delay to ensure state propagation
    } catch (err) {
      log.error('Login attempt failed', err);

      // Show error toast notification
      toast.error('Login failed', {
        description:
          err instanceof Error
            ? err.message
            : 'Invalid credentials. Please try again.',
        duration: 5000,
      });

      // Handle login errors
      setError(
        err instanceof Error
          ? err.message
          : 'Invalid credentials. Please try again.',
      );

      log.warn('Error message displayed to user', {
        errorMessage:
          err instanceof Error ? err.message : 'Invalid credentials',
      });
    } finally {
      setIsLoading(false);
      log.debug('Login form processing completed');
    }
  };

  // Log form validation errors when they occur
  useEffect(() => {
    const errors = form.formState.errors;
    if (Object.keys(errors).length > 0) {
      log.debug('Form validation errors', errors);
    }
  }, [form.formState.errors]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 24,
      },
    },
  };

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="mb-8 text-center" variants={itemVariants}>
          <div className="mb-4 flex justify-center">
            <div className="text-primary flex items-center gap-2">
              <Pill className="h-8 w-8" />
              <span className="text-2xl font-bold">WellPharm</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground mt-1">
            Sign in to your account to continue
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-muted bg-card shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4"
                >
                  <Alert variant="destructive" className="py-2 text-sm">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="username_or_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">
                          Username or Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your username or email"
                            disabled={isLoading}
                            className={cn(
                              'h-9',
                              form.formState.errors.username_or_email &&
                                'border-destructive',
                            )}
                            onChange={e => {
                              field.onChange(e);
                              log.debug('Username/email field updated');
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Enter your password"
                            disabled={isLoading}
                            className={cn(
                              'h-9',
                              form.formState.errors.password &&
                                'border-destructive',
                            )}
                            onChange={e => {
                              field.onChange(e);
                              log.debug('Password field updated');
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between">
                    <FormField
                      control={form.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-y-0 space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={checked => {
                                field.onChange(checked);
                                log.debug('Remember me toggled', { checked });
                              }}
                              disabled={isLoading}
                              id="remember-me"
                            />
                          </FormControl>
                          <FormLabel
                            htmlFor="remember-me"
                            className="cursor-pointer text-sm font-normal"
                          >
                            Remember me
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <Button
                      variant="link"
                      className="h-auto p-0 text-sm"
                      disabled={isLoading}
                      onClick={e => {
                        e.preventDefault();
                        log.info('Forgot password link clicked');
                        // Handle forgot password
                      }}
                    >
                      Forgot password?
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    onClick={() => {
                      if (isLoading) {
                        log.debug(
                          'Submit button clicked while loading, ignoring',
                        );
                      } else {
                        log.debug(
                          'Submit button clicked, form will be validated',
                        );
                      }
                    }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-center border-t p-4">
              <p className="text-muted-foreground text-sm">
                Pharmacy Management System
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
