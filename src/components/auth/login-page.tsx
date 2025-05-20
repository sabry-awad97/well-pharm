import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useRevenueExpenseData } from '@/api/finance';
import { useTopSellingMedicines } from '@/api/medicine';
import { RevenueExpenseChart } from '@/components/charts/revenue-expense-chart';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  BarChart3,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Pill,
  User,
} from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);

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

  // Fetch top selling medicines data for dashboard preview
  const { data: topSellingMedicines, isLoading: isLoadingMedicines } =
    useTopSellingMedicines('month', 4, {
      // Set a longer stale time for login page to reduce unnecessary fetches
      staleTime: 15 * 60 * 1000, // 15 minutes
    });

  // Fetch revenue and expense data for dashboard preview
  const {
    data: revenueExpenseData,
    isLoading: isLoadingRevenueData,
    isError: isRevenueError,
  } = useRevenueExpenseData('month');

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
    <div className="flex min-h-screen w-full overflow-hidden bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200">
      <div className="flex w-full flex-col lg:flex-row">
        {/* Left side - Login form */}
        <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
          <motion.div
            className="w-full max-w-md"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="mb-6 text-center" variants={itemVariants}>
              <div className="mb-4 flex justify-center">
                <div className="bg-primary/10 flex h-14 w-14 items-center justify-center rounded-full">
                  <Pill className="text-primary h-7 w-7" />
                </div>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                Welcome to WellPharm
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Your complete pharmacy management solution for inventory, sales,
                and patient care
              </p>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-border/50 overflow-hidden bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6"
                    >
                      <Alert variant="destructive" className="py-2 text-sm">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}

                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-5"
                    >
                      <FormField
                        control={form.control}
                        name="username_or_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Email Address
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                                <Input
                                  {...field}
                                  placeholder="you@example.com"
                                  disabled={isLoading}
                                  aria-describedby="email-description"
                                  className={cn(
                                    'h-10 bg-white pl-9 transition-all duration-200',
                                    form.formState.errors.username_or_email
                                      ? 'border-destructive focus-visible:ring-destructive/30'
                                      : field.value
                                        ? 'border-green-500 focus-visible:ring-green-500/30'
                                        : 'focus-visible:ring-primary/30',
                                  )}
                                  onChange={e => {
                                    field.onChange(e);
                                    log.debug('Username/email field updated');
                                  }}
                                />
                              </div>
                            </FormControl>
                            <div
                              id="email-description"
                              className="text-muted-foreground mt-1.5 text-xs"
                            >
                              Enter the email address associated with your
                              account
                            </div>
                            <FormMessage className="mt-1 text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between">
                              <FormLabel className="text-sm font-medium">
                                Password
                              </FormLabel>
                              <Button
                                variant="link"
                                className="text-primary h-auto p-0 text-xs"
                                disabled={isLoading}
                                onClick={e => {
                                  e.preventDefault();
                                  log.info('Forgot password link clicked');
                                  // Handle forgot password
                                }}
                              >
                                Forgot Password?
                              </Button>
                            </div>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                                <Input
                                  {...field}
                                  type={showPassword ? 'text' : 'password'}
                                  placeholder="••••••••"
                                  disabled={isLoading}
                                  hidePasswordToggle={true}
                                  aria-describedby="password-description"
                                  className={cn(
                                    'h-10 bg-white pl-9 transition-all duration-200',
                                    form.formState.errors.password
                                      ? 'border-destructive focus-visible:ring-destructive/30'
                                      : field.value
                                        ? 'border-green-500 focus-visible:ring-green-500/30'
                                        : 'focus-visible:ring-primary/30',
                                  )}
                                  onChange={e => {
                                    field.onChange(e);
                                    log.debug('Password field updated');
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-1 right-1 h-8 w-8 text-gray-500 hover:text-gray-700"
                                  onClick={() => setShowPassword(!showPassword)}
                                  aria-label={
                                    showPassword
                                      ? 'Hide password'
                                      : 'Show password'
                                  }
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <div
                              id="password-description"
                              className="text-muted-foreground mt-1.5 text-xs"
                            >
                              Password must be at least 8 characters long
                            </div>
                            <FormMessage className="mt-1 text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="rememberMe"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-y-0 space-x-2 pt-1">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={checked => {
                                  field.onChange(checked);
                                  log.debug('Remember me toggled', { checked });
                                }}
                                disabled={isLoading}
                                id="remember-me"
                                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                            </FormControl>
                            <FormLabel
                              htmlFor="remember-me"
                              className="cursor-pointer text-sm font-normal"
                            >
                              Keep me signed in for 30 days
                            </FormLabel>
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="bg-primary hover:bg-primary/90 h-11 w-full text-white transition-all duration-200"
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
                          <motion.div
                            className="flex items-center justify-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                          </motion.div>
                        ) : (
                          <motion.span
                            className="flex items-center justify-center"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Sign In
                          </motion.span>
                        )}
                      </Button>
                    </form>
                  </Form>

                  <div className="mt-6 text-center">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-full border-t border-gray-200" />
                      <span className="relative bg-white px-3 text-xs text-gray-500">
                        SECURE LOGIN
                      </span>
                    </div>

                    <p className="text-muted-foreground mt-4 text-sm">
                      Access your pharmacy management dashboard with confidence
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-6 text-center">
              <p className="text-muted-foreground text-xs">
                WellPharm Desktop v1.2.0 © 2023 Phermo Systems Inc.
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Right side - Dashboard preview */}
        <div className="hidden bg-white p-8 lg:flex lg:w-1/2 lg:items-center lg:justify-center">
          <div className="max-w-2xl rounded-xl bg-white p-8 shadow-lg">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-md bg-blue-100 p-2">
                <Pill className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-lg font-medium">Phermo</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">
                      Graph Report Today
                    </span>
                  </div>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <title>""</title>
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                      <circle cx="5" cy="12" r="1" />
                    </svg>
                  </button>
                </div>

                <div className="mt-4 flex h-32 items-end justify-center gap-4">
                  <div className="flex h-full flex-col justify-end">
                    <div
                      className="mb-1 w-10 rounded-t bg-green-500"
                      style={{ height: '20%' }}
                    />
                    <div
                      className="mb-1 w-10 rounded-t bg-orange-500"
                      style={{ height: '30%' }}
                    />
                    <div
                      className="w-10 rounded-t bg-blue-500"
                      style={{ height: '40%' }}
                    />
                    <div className="mt-2 text-center text-xs font-medium">
                      Purchases
                    </div>
                  </div>

                  <div className="flex h-full flex-col justify-end">
                    <div
                      className="mb-1 w-10 rounded-t bg-green-500"
                      style={{ height: '15%' }}
                    />
                    <div
                      className="mb-1 w-10 rounded-t bg-orange-500"
                      style={{ height: '25%' }}
                    />
                    <div
                      className="w-10 rounded-t bg-blue-500"
                      style={{ height: '50%' }}
                    />
                    <div className="mt-2 text-center text-xs font-medium">
                      Suppliers
                    </div>
                  </div>

                  <div className="flex h-full flex-col justify-end">
                    <div
                      className="mb-1 w-10 rounded-t bg-green-500"
                      style={{ height: '25%' }}
                    />
                    <div
                      className="mb-1 w-10 rounded-t bg-orange-500"
                      style={{ height: '20%' }}
                    />
                    <div
                      className="w-10 rounded-t bg-blue-500"
                      style={{ height: '45%' }}
                    />
                    <div className="mt-2 text-center text-xs font-medium">
                      Sales
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">
                      Top Selling Medicine
                    </span>
                  </div>
                  <div className="text-xs font-medium text-gray-500">
                    This Month
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {isLoadingMedicines
                    ? // Loading state
                      [...Array(4).keys()].map(k => (
                        <div key={`skeleton-${k}`}>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                            <span className="h-3 w-8 animate-pulse rounded bg-gray-200" />
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                            <div className="h-full w-0 animate-pulse rounded-full bg-gray-300" />
                          </div>
                        </div>
                      ))
                    : // Render actual data
                      topSellingMedicines?.map((medicine, index) => (
                        <div key={medicine.id}>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs font-medium">
                              {medicine.name}
                            </span>
                            <span className="text-xs font-medium">
                              {medicine.percentageShare}%
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full ${
                                index === 0
                                  ? 'bg-blue-500'
                                  : index === 1
                                    ? 'bg-green-500'
                                    : index === 2
                                      ? 'bg-orange-500'
                                      : 'bg-purple-500'
                              }`}
                              style={{ width: `${medicine.percentageShare}%` }}
                            />
                          </div>
                        </div>
                      ))}
                </div>
              </div>

              {/* Inside the dashboard preview, replace the simplified chart representation */}
              <div className="md:col-span-2">
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">
                        Over All Revenue vs Expense
                      </span>
                    </div>
                    <div className="text-xs font-medium text-gray-500">
                      Monthly
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="text-xs font-medium">Revenue</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      <span className="text-xs font-medium">Expense</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <RevenueExpenseChart
                      data={revenueExpenseData}
                      isLoading={isLoadingRevenueData}
                      isError={isRevenueError}
                      height={130}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <h2 className="text-xl font-bold">Welcome Back Phermo</h2>
              <p className="mt-2 text-sm text-gray-500">
                Securely access your Phermo Pharmacy Management account. Sign in
                to keep your pharmacy running efficiently.
              </p>

              <div className="mt-4 flex justify-center space-x-1">
                <div className="h-1.5 w-6 rounded-full bg-blue-500" />
                <div className="h-1.5 w-1.5 rounded-full bg-blue-200" />
                <div className="h-1.5 w-1.5 rounded-full bg-blue-200" />
                <div className="h-1.5 w-1.5 rounded-full bg-blue-200" />
                <div className="h-1.5 w-1.5 rounded-full bg-blue-200" />
                <div className="h-1.5 w-1.5 rounded-full bg-blue-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
