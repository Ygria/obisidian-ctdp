export type TaskGroup = "后勤" | "建设" | "突击" | "基础";

export type TaskStatus =
	| "idle"
	| "scheduled"
	| "running"
	| "paused"
	| "completed"
	| "failed"
	| "confirming_completion"; // New status for post-task review


export interface TaskData {
	name: string;
	type: "timer" | "toggle";
	rules: string;
	duration?: number;
	allowPause: boolean;
	animation: string;
	appointmentDuration: number;
	taskGroup: "后勤" | "建设" | "突击" | "基础";
	completionSignal: string;
	achievedCount: number;
	totalTimeAchieved: number;
	rulesHistory: RuleChange[],
	startSignal: string

}


export interface RuleChange {
	timestamp: string;
	oldRules: string;
	newRules: string
}