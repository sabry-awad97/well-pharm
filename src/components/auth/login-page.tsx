import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { Loader2, Pill } from "lucide-react";

// Define the form schema with Zod
const loginFormSchema = z.object({
	username_or_email: z.string().min(1, "Username or email is required"),
	password: z.string().min(1, "Password is required"),
	rememberMe: z.boolean().default(false),
});

// Define the form values type
type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginPage() {
	const navigate = useNavigate();
	const { login } = useAuth();
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Initialize form with react-hook-form and zod validation
	const form = useForm({
		resolver: zodResolver(loginFormSchema),
		defaultValues: {
			username_or_email: "",
			password: "",
			rememberMe: false,
		},
	});

	// Handle form submission
	const onSubmit = async (data: LoginFormValues) => {
		setIsLoading(true);
		setError(null);

		try {
			// Use the login function from our auth context
			await login(data.username_or_email, data.password, data.rememberMe);

			console.log("Login successful, attempting navigation to dashboard");

			// Force a small delay to ensure state updates are processed
			// and avoid any race conditions with the authentication state
			setTimeout(() => {
				console.log("Executing navigation to dashboard");
				// Try a more direct navigation approach
				navigate({
					to: "/",
					replace: true, // Use replace to avoid back button issues
				});
			}, 200);
		} catch (err) {
			console.error("Login error:", err);
			// Handle login errors
			setError(
				err instanceof Error
					? err.message
					: "Invalid credentials. Please try again.",
			);
		} finally {
			setIsLoading(false);
		}
	};

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
				type: "spring",
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
															"h-9",
															form.formState.errors.username_or_email &&
																"border-destructive",
														)}
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
															"h-9",
															form.formState.errors.password &&
																"border-destructive",
														)}
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
															onCheckedChange={field.onChange}
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
											onClick={(e) => {
												e.preventDefault();
												// Handle forgot password
											}}
										>
											Forgot password?
										</Button>
									</div>

									<Button type="submit" className="w-full" disabled={isLoading}>
										{isLoading ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Signing in...
											</>
										) : (
											"Sign In"
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
