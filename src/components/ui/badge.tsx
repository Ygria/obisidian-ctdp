import { cn } from "@/lib/utils";

interface BadgeProps {
	text?: string;
	style?: string;
}

export const Badge = ({ text, style }: BadgeProps) => {
	return (
		<span
			className={cn(
				"bg-blue-100 text-blue-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300 truncate",
				style ?? ""
			)}
		>
			{text || "default"}
		</span>
	);
};
