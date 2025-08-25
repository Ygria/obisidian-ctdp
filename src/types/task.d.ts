export type TaskGroup ="基础" | "后勤"
		| "建设"
		| "突击"
	
		| "健康"
		| "科技"
		| "探索"
		| "采集"
		| "生产";

export type TaskStatus =
	| "idle"
	| "scheduled"
	| "running"
	| "paused"
	| "completed"
	| "failed"
	| "confirming_completion"; // New status for post-task review

//  任务icon
export type TaskIcon = {
	type: "emoji" | "icon";
	value: string; // Emoji character or SVG path or custom identifier
	color?: string; // Optional color for emoji or custom icons
};

export interface TaskData {
	name: string;
	type: "timer" | "toggle";
	rules: string;
	duration?: number;
	allowPause: boolean;
	animation: string;
	appointmentDuration: number;
	taskGroup:TaskGroup
		
	completionSignal: string;
	achievedCount: number;
	totalTimeAchieved: number;
	rulesHistory: RuleChange[];
	startSignal: string;
	icon?: TaskIcon;
}

export interface RuleChange {
	timestamp: string;
	oldRules: string;
	newRules: string;
}
