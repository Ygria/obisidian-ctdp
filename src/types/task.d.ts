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
}