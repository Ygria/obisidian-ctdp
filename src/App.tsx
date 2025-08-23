"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";

import Lottie from "lottie-react";
import workout from "./assets/workout.json";
import building from "./assets/building.json";
import MyPlugin from "./main";
import type { RuleChange, TaskData, TaskGroup } from "./types/task";
import { PomodoroTask } from "./components/pomodoro-task";
import { Dashboard } from "./components/dashboard";

// 1. 定义 props 的接口
interface AppProps {
	plugin: MyPlugin;
}

export function App({ plugin }: AppProps) {
	const [tasks, setTasks] = React.useState(() => plugin.getTasks());
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [activeTaskIndex, setActiveTaskIndex] = useState<number | null>(null);
	// 预约行为
	const [startAction, setStartAction] = useState<'immediate' | 'schedule' | null>(null);

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

	const handleRulesUpdate = async (index: number, oldRules: string,newRules: string) => {

		debugger
		

		const newHistoryEntry: RuleChange = {
			timestamp: new Date().toISOString(),
			
			oldRules: oldRules,
			newRules: newRules
		};

		const newTasks = [...tasks];
		const task = newTasks[index];
		task.rulesHistory = [...(task.rulesHistory ?? []), newHistoryEntry]
		task.rules = newRules

		setTasks(newTasks);
		await plugin.updateEntry(task.filePath, task)
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


	const handleTaskStart = (index: number, mode: 'immediate' | 'schedule' | null = null) => {
		setActiveTaskIndex(index);
		setStartAction(mode); // 设置收到的指令
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
						initialAction={startAction}
						onTaskFail={(reason) => handleTaskFail(activeTaskIndex, reason)}
						onRulesUpdate={(oldRules, newRules) => handleRulesUpdate(activeTaskIndex,oldRules,newRules)}
						animation={activeTask.animation || 'task-running'}
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
