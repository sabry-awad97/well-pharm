import { useTestDatabaseConnection } from "@/api/onboarding";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import {
	ArrowLeft,
	ArrowRight,
	CheckCircle,
	HelpCircle,
	Loader2,
	Server,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DatabaseConfigScreenProps {
	formData: {
		dbHost: string;
		dbPort: string;
		dbName: string;
		dbUser: string;
		dbPassword: string;
	};
	onChange: (field: string, value: string) => void;
	onNext: () => void;
	onBack: () => void;
}

export function DatabaseConfigScreen({
	formData,
	onChange,
	onNext,
	onBack,
}: DatabaseConfigScreenProps) {
	const [connectionStatus, setConnectionStatus] = useState<
		"idle" | "success" | "error"
	>("idle");
	const [, setConnectionError] = useState<string | null>(null);

	const testConnectionMutation = useTestDatabaseConnection();

	const handleSubmit = () => {
		onNext();
	};

	const handleTestConnection = async () => {
		setConnectionStatus("idle");
		setConnectionError(null);

		const dbConfig = {
			host: formData.dbHost,
			port: Number.parseInt(formData.dbPort),
			name: formData.dbName,
			user: formData.dbUser,
			password: formData.dbPassword,
		};

		testConnectionMutation.mutate(dbConfig, {
			onSuccess: () => {
				setConnectionStatus("success");
				toast.success("Database connection successful!", {
					description: "Your database configuration is valid.",
				});
			},
			onError: (error) => {
				setConnectionStatus("error");
				setConnectionError(String(error));
				toast.error("Connection failed", {
					description: String(error),
				});
			},
		});
	};

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
		hidden: { y: 10, opacity: 0 },
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
		<div className="flex h-full flex-col">
			<motion.div
				className="flex-1 overflow-hidden"
				variants={containerVariants}
				initial="hidden"
				animate="visible"
			>
				<div className="flex h-full flex-col">
					<div className="mb-4 text-center">
						<motion.h2
							className="text-2xl font-bold tracking-tight"
							variants={itemVariants}
						>
							Database Configuration
						</motion.h2>
						<motion.p
							className="text-muted-foreground text-sm"
							variants={itemVariants}
						>
							Connect to your PostgreSQL database
						</motion.p>
					</div>

					<ScrollArea className="flex-1 pr-4 mb-2">
						<div className="space-y-4 pb-4">
							<motion.div variants={itemVariants}>
								<Card className="border-muted bg-card overflow-hidden shadow-sm">
									<div className="border-border/40 bg-muted/30 border-b p-3">
										<div className="flex items-center gap-2">
											<Server className="text-primary h-4 w-4" />
											<h3 className="text-sm font-medium">
												Connection Settings
											</h3>
										</div>
									</div>
									<div className="space-y-3 p-3">
										<div className="grid grid-cols-2 gap-3">
											<div className="space-y-1.5">
												<div className="flex items-center gap-1">
													<Label
														htmlFor="dbHost"
														className="text-xs font-medium"
													>
														Host
													</Label>
													<TooltipProvider>
														<Tooltip>
															<TooltipTrigger asChild>
																<HelpCircle className="text-muted-foreground h-3 w-3 cursor-help" />
															</TooltipTrigger>
															<TooltipContent
																side="right"
																className="max-w-xs text-xs"
															>
																<p>
																	The hostname or IP address of your PostgreSQL
																	server. Use "localhost" if the database is on
																	the same machine.
																</p>
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												</div>
												<Input
													id="dbHost"
													value={formData.dbHost}
													onChange={(e) => onChange("dbHost", e.target.value)}
													placeholder="localhost"
													className="h-8 text-sm"
													required
												/>
											</div>

											<div className="space-y-1.5">
												<div className="flex items-center gap-1">
													<Label
														htmlFor="dbPort"
														className="text-xs font-medium"
													>
														Port
													</Label>
													<TooltipProvider>
														<Tooltip>
															<TooltipTrigger asChild>
																<HelpCircle className="text-muted-foreground h-3 w-3 cursor-help" />
															</TooltipTrigger>
															<TooltipContent side="right" className="text-xs">
																<p>The default PostgreSQL port is 5432.</p>
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												</div>
												<Input
													id="dbPort"
													value={formData.dbPort}
													onChange={(e) => onChange("dbPort", e.target.value)}
													placeholder="5432"
													type="number"
													className="h-8 text-sm"
													required
												/>
											</div>
										</div>

										<div className="space-y-1.5">
											<Label htmlFor="dbName" className="text-xs font-medium">
												Database Name
											</Label>
											<Input
												id="dbName"
												value={formData.dbName}
												onChange={(e) => onChange("dbName", e.target.value)}
												placeholder="wellpharm"
												className="h-8 text-sm"
												required
											/>
										</div>

										<div className="grid grid-cols-2 gap-3">
											<div className="space-y-1.5">
												<div className="flex items-center gap-1">
													<Label
														htmlFor="dbUser"
														className="text-xs font-medium"
													>
														Username
													</Label>
												</div>
												<Input
													id="dbUser"
													value={formData.dbUser}
													onChange={(e) => onChange("dbUser", e.target.value)}
													placeholder="postgres"
													className="h-8 text-sm"
													required
												/>
											</div>

											<div className="space-y-1.5">
												<div className="flex items-center gap-1">
													<Label
														htmlFor="dbPassword"
														className="text-xs font-medium"
													>
														Password
													</Label>
												</div>
												<Input
													id="dbPassword"
													type="password"
													value={formData.dbPassword}
													onChange={(e) =>
														onChange("dbPassword", e.target.value)
													}
													placeholder="Enter password"
													className="h-8 text-sm"
													required
												/>
											</div>
										</div>

										<div className="pt-1">
											<Button
												type="button"
												variant={
													connectionStatus === "success"
														? "default"
														: "secondary"
												}
												size="sm"
												className={`w-full gap-1 ${connectionStatus === "success" ? "bg-green-600 hover:bg-green-700" : ""}`}
												onClick={handleTestConnection}
												disabled={testConnectionMutation.isPending}
											>
												{testConnectionMutation.isPending ? (
													<>
														<Loader2 className="h-3.5 w-3.5 animate-spin" />
														Testing Connection...
													</>
												) : connectionStatus === "success" ? (
													<>
														<CheckCircle className="h-3.5 w-3.5" />
														Connection Successful
													</>
												) : (
													<>
														<Server className="h-3.5 w-3.5" />
														Test Connection
													</>
												)}
											</Button>
										</div>
									</div>
								</Card>
							</motion.div>
						</div>
					</ScrollArea>
				</div>
			</motion.div>

			<motion.div
				variants={itemVariants}
				className="mt-auto py-2 flex justify-between border-t"
			>
				<Button
					type="button"
					variant="outline"
					onClick={onBack}
					size="sm"
					className="gap-1"
				>
					<ArrowLeft className="h-3.5 w-3.5" />
					Back
				</Button>
				<Button
					type="button"
					onClick={handleSubmit}
					size="sm"
					className="gap-1"
				>
					Next
					<ArrowRight className="h-3.5 w-3.5" />
				</Button>
			</motion.div>
		</div>
	);
}
