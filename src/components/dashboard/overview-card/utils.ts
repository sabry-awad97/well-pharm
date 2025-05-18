// Helper to get the start of a week (Monday)
export const getStartOfWeek = (date: Date): Date => {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
	const start = new Date(d.setDate(diff));
	start.setHours(0, 0, 0, 0); // Set time to start of day
	return start;
};

// Mock API data structure
export interface DailyData {
	day: string;
	prescriptions: number;
	revenue: number; // Added revenue field
}

// Mock API function
export const fetchWeeklyData = async (
	startDate: Date,
): Promise<DailyData[]> => {
	console.log(`Fetching data for week starting: ${startDate.toDateString()}`);
	// Simulate API delay
	await new Promise((resolve) => setTimeout(resolve, 750));

	// Simulate potential API error
	// if (Math.random() > 0.8) {
	//   throw new Error('Failed to fetch weekly data. Please try again.');
	// }

	const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
	return days.map((day) => {
		const prescriptions =
			Math.floor(Math.random() * ((startDate.getDate() % 10) + 1) * 15) + 20;
		// Generate revenue based on prescriptions with some variability
		const revenue = prescriptions * (Math.random() * 50 + 100);

		return {
			day,
			prescriptions,
			revenue: Math.round(revenue), // Round to whole number for simplicity
		};
	});
};
