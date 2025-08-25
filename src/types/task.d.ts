// 将所有可能的任务分组定义为一个 const 数组
// 这是我们的“唯一数据源”

import { TaskGroup } from "src/lib/constant";

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
	taskGroup: TaskGroup;

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


// 实际执行的任务record
export interface TaskRecord {
	id: string; // 实例ID
	taskId: string; // 外键 -> TaskData.id
	taskGroupId: string; // 冗余存储，方便快速查询

	// 时间
	appointmentStart: Date; // 预约开始
	appointmentEnd: Date;   // 预约结束
	actualStart?: Date;     // 实际开始
	actualEnd?: Date;       // 实际结束

	// 状态
	completed: boolean;        // 是否完成
	pausedCount: number;       // 暂停次数
	pauseDurations: number[];  // 每次暂停时长（毫秒/秒）
	totalPausedDuration: number; // 总暂停用时（毫秒/秒）
	totalActiveDuration: number; // 实际执行时长（扣除暂停）（毫秒/秒）

	// 反馈
	feeling?: string;  // 心情
	thoughts?: string; // 感想
	rating?: number;   // 打分

	createdAt: Date;
	updatedAt: Date;
}


