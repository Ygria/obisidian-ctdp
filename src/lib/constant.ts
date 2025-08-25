import { TaskGroup, TaskStatus } from "src/types/task";

export const TaskGroupStyles: Record<TaskGroup, string> = {
	基础: "bg-gray-100 text-gray-800",
	生产: "bg-green-100 text-green-800",
	建设: "bg-yellow-100 text-yellow-800",
	突击: "bg-red-100 text-red-800",
	健康: "bg-pink-100 text-pink-800",
	科技: "bg-indigo-100 text-indigo-800",
	探索: "bg-purple-100 text-purple-800",
	后勤: "bg-teal-100 text-teal-800",
	采集: "bg-cyan-100 text-cyan-800",
};

export const TaskTypeStyles: Record<"timer" | "toggle", string> = {
	timer: "bg-blue-100 text-blue-800",
	toggle: "bg-yellow-100 text-yellow-800",
};

export const TaskStatusColors: Record<TaskStatus, string> = {
	idle: "",
	scheduled: "",
	running: "",
	paused: "",
	completed: "",
	failed: "",
	confirming_completion: "",
};
