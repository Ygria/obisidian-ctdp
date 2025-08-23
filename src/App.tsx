"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { TaskCreateForm } from "./components/task-create-form";
import { Columns2, Columns2Icon, Grid, List, Play, Plus, Timer, Trophy } from "lucide-react";
import Lottie from "lottie-react";
import workout from "./assets/workout.json";
import building from "./assets/building.json";
import MyPlugin from "./main";
import type { RuleChange, TaskData, TaskGroup } from "./types/task";
import { PomodoroTask } from "./components/pomodoro-task";
import { Dashboard } from "./components/dashboard";

// NEW: Define task groups array for easy mapping

const taskGroups: Array<TaskGroup> = ["后勤", "建设", "突击", "基础"];

const animationMap: { [key: string]: React.ReactNode } = {
	exercise: (
		<Lottie
			animationData={workout}
			loop={true}
			className="w-[100px] h-[100px] mx-auto mb-4 select-none pointer-events-none"
		/>
	),

	study: (
		<Lottie
			animationData={building}
			loop={true}
			className="w-[100px] h-[100px] mx-auto mb-4 select-none pointer-events-none"
		/>
	),
};

// 1. 定义 props 的接口
interface AppProps {
	plugin: MyPlugin;
}

export function App({ plugin }: AppProps) {
	const [tasks, setTasks] = React.useState(() => plugin.getTasks());
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [activeTaskIndex, setActiveTaskIndex] = useState<number | null>(null);

	// 从插件的缓存初始化 state
	const [data, setData] = React.useState(() =>
		Object.fromEntries(plugin.cache ? plugin.cache : [])
	);

	// 定义一个刷新函数，用于从插件的 cache 更新 React state
	const refreshData = () => {
		setData(Object.fromEntries(plugin.cache ? plugin.cache : []));
	};

	// 处理添加新条目的函数
	const handleAddNew = async (newTask: TaskData) => {
		console.log("React: Calling plugin.addEntry");
		await plugin.addEntry({ ...newTask });
		// 因为 addEntry 会触发 'create' 事件，所以视图会自动刷新
	};

	// 处理删除条目的函数
	const handleDelete = async (path: string) => {
		await plugin.deleteEntry(path);
		// 因为 deleteEntry 会触发 'delete' 事件，所以视图会自动刷新
	};

	const handleRulesUpdate = (index: number, newRules: string) => {
		const newHistoryEntry: RuleChange = {
			timestamp: new Date().toISOString(),
			change: `规则更新`, // In a real app, you might generate a diff here too
		};
		console.log("规则已在父组件中更新！");
	};

	// 3. 使用 useEffect 监听文件变化以实现自动刷新
	React.useEffect(() => {
		// 当 vault 中的文件发生变化时，刷新数据
		plugin.registerEvent(plugin.app.vault.on("create", refreshData));
		plugin.registerEvent(plugin.app.vault.on("modify", refreshData));
		plugin.registerEvent(plugin.app.vault.on("delete", refreshData));
	}, [plugin]); // 依赖项是 plugin，确保只注册一次


	const handleCreateTask = (newTask: TaskData) => {
		setTasks([
			...tasks,
			{ ...newTask, achievedCount: 0, totalTimeAchieved: 0 },
		]);
		setShowCreateForm(false);
		handleAddNew(newTask);
	};


	const handleTaskStart = (index: number) => {
		setActiveTaskIndex(index);
	};

	const handleTaskEnd = (completed: boolean, timeSpent: number) => {
		if (completed && activeTaskIndex !== null) {
			const newTasks = [...tasks];
			const task = newTasks[activeTaskIndex];
			if (task.type === "toggle") {
				task.achievedCount += 1;
			} else {
				task.totalTimeAchieved += timeSpent;
			}
			setTasks(newTasks);
		}
		setActiveTaskIndex(null);
	};

	const handleTaskFail = (activeTaskIndex: number, reason: string) => {
		if (activeTaskIndex !== null) {
			const newTasks = [...tasks];
			const task = newTasks[activeTaskIndex];
			task.achievedCount = 0;
			task.totalTimeAchieved = 0;
			setTasks(newTasks);
		}
		setActiveTaskIndex(null);
	};

	const activeTask = activeTaskIndex !== null ? tasks[activeTaskIndex] : null;

	const formatAchievement = (task: TaskData) => {
		if (task.type === "timer") {
			if (task.totalTimeAchieved === 0) return null;
			const hours = (task.totalTimeAchieved / 3600).toFixed(1);
			return `已专注 ${hours} 小时`;
		} else {
			if (task.achievedCount === 0) return null;
			return `已完成 ${task.achievedCount} 次`;
		}
	};



	return (
		<div className="bg-gray-50 min-h-screen p-4 sm:p-8 bg-linear-to-r from-cyan-50 to-blue-50">
			{activeTask && activeTaskIndex !== null ? (
				// --- FOCUS VIEW ---
				<div className="flex justify-center items-start min-h-[80vh]">
					<PomodoroTask
						key={`${activeTask.name}-${activeTaskIndex}`}
						{...activeTask}
						onEnd={handleTaskEnd}
						onTaskFail={(reason) => handleTaskFail(activeTaskIndex, reason)}
						onRulesUpdate={(newRules) => handleRulesUpdate(activeTaskIndex, newRules)}
						animation={animationMap[activeTask.animation] || <></>}
					/>
				</div>
			) : (
				// --- DASHBOARD VIEW ---
				<Dashboard
					tasks={tasks}
					onTaskStart={handleTaskStart}
					onCreateTask={handleCreateTask}
					onTaskFail={handleTaskFail}
					onRulesUpdate={handleRulesUpdate}
					formatAchievement={formatAchievement}
				/>
			)}
		</div>
	);
}

export default App;
