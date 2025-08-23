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

	const handleRulesUpdate = (newRules: string) => {
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

	// NEW: State for view, search, filter, and sort
	type ViewMode = "card" | "table" | "compact";
	const [view, setView] = useState<ViewMode>("card");
	const [searchTerm, setSearchTerm] = useState("");
	const [filterGroup, setFilterGroup] = useState<TaskGroup | "All">("All");
	const [sortCriteria, setSortCriteria] = useState<string>("default");

	const handleCreateTask = (newTask: TaskData) => {
		setTasks([
			...tasks,
			{ ...newTask, achievedCount: 0, totalTimeAchieved: 0 },
		]);
		setShowCreateForm(false);
		handleAddNew(newTask);
	};

	const handleCancelCreate = () => {
		setShowCreateForm(false);
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

	const handleTaskFail = () => {
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

	// NEW: Memoized derivation of tasks to display based on filters and sorting
	const displayedTasks = useMemo(() => {
		let processedTasks = tasks.map((task, index) => ({
			...task,
			originalIndex: index,
		})); // Attach original index to handle actions correctly

		// 1. Filter by Group
		if (filterGroup !== "All") {
			processedTasks = processedTasks.filter(
				(task) => task.taskGroup === filterGroup
			);
		}

		// 2. Filter by Search Term
		if (searchTerm) {
			const lowercasedSearchTerm = searchTerm.toLowerCase();
			processedTasks = processedTasks.filter(
				(task) =>
					task.name.toLowerCase().includes(lowercasedSearchTerm) ||
					task.rules.toLowerCase().includes(lowercasedSearchTerm)
			);
		}
		// 3. Sort
		switch (sortCriteria) {
			case "name-asc":
				processedTasks.sort((a, b) => a.name.localeCompare(b.name));
				break;
			case "name-desc":
				processedTasks.sort((a, b) => b.name.localeCompare(a.name));
				break;
			case "group-asc":
				processedTasks.sort((a, b) =>
					a.taskGroup.localeCompare(b.taskGroup)
				);
				break;
			case "achievement-desc":
				processedTasks.sort((a, b) => {
					const achievementA =
						a.type === "timer"
							? a.totalTimeAchieved
							: a.achievedCount;
					const achievementB =
						b.type === "timer"
							? b.totalTimeAchieved
							: b.achievedCount;
					return achievementB - achievementA;
				});
				break;
			default:
				break;
		}

		return processedTasks;
	}, [tasks, filterGroup, searchTerm, sortCriteria]);

	return (
		<div className="bg-gray-50 min-h-screen p-4 sm:p-8  bg-linear-to-r from-cyan-50 to-blue-50">
			{activeTask ? (
				// --- FOCUS VIEW ---
				<>
					<div className="flex justify-center items-start min-h-[80vh]">
						<PomodoroTask
							onRulesUpdate={handleRulesUpdate} key={`${activeTask.name}-${activeTaskIndex}`}
							{...activeTask}
							onEnd={handleTaskEnd}
							onTaskFail={handleTaskFail}
							animation={animationMap[activeTask.animation] || <></>} />
					</div>
				</>
			) : (
				// --- DASHBOARD VIEW ---
				<div className="max-w-6xl mx-auto">
					<div className="flex justify-between items-center mb-6">
						<h1 className="text-3xl font-bold text-gray-800">
							任务中心
						</h1>
						<button
							onClick={() => setShowCreateForm(true)}
							className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
						>
							<Plus className="h-4 w-4 mr-2" />
							添加任务
						</button>
					</div>

					{showCreateForm && (
						<div className="mb-8">
							<TaskCreateForm
								onSubmit={handleCreateTask}
								onCancel={handleCancelCreate}
							/>
						</div>
					)}

					{/* NEW: Filter, Sort, and View Controls */}
					<div className="mb-6 p-4 bg-white rounded-lg shadow-sm border space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
							<div>
								<label
									htmlFor="search"
									className="block text-sm font-medium text-gray-700"
								>
									搜索任务
								</label>
								<input
									type="text"
									id="search"
									placeholder="按名称或规则搜索..."
									value={searchTerm}
									onChange={(e) =>
										setSearchTerm(e.target.value)
									}
									className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
								/>
							</div>
							<div>
								<label
									htmlFor="sort"
									className="block text-sm font-medium text-gray-700"
								>
									排序方式
								</label>
								<select
									id="sort"
									value={sortCriteria}
									onChange={(e) =>
										setSortCriteria(e.target.value)
									}
									className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
								>
									<option value="default">默认排序</option>
									<option value="name-asc">名称 (A-Z)</option>
									<option value="name-desc">
										名称 (Z-A)
									</option>
									<option value="group-asc">分组</option>
									<option value="achievement-desc">
										成就最高
									</option>
								</select>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700">
									视图模式
								</label>
								<div className="mt-1 flex rounded-md shadow-sm">
									<button
										onClick={() => setView("card")}
										className={`relative inline-flex items-center px-4 py-2 rounded-l-md border text-sm font-medium ${view === "card"
											? "bg-blue-600 text-white border-blue-600 z-10"
											: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
											}`}
									>
										<Columns2 className="w-5 h-5" />
									</button>
									<button
										onClick={() => setView("table")}
										className={`-ml-px relative inline-flex items-center px-4 py-2 border text-sm font-medium ${view === "table"
											? "bg-blue-600 text-white border-blue-600 z-10"
											: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
											}`}
									>
										<List className="w-5 h-5" />
									</button>
									<button
										onClick={() => setView("compact")}
										className={`-ml-px relative inline-flex items-center px-4 py-2 rounded-r-md border text-sm font-medium ${view === "compact"
											? "bg-blue-600 text-white border-blue-600 z-10"
											: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
											}`}
									>
										<Grid className="w-5 h-5" />
									</button>
								</div>
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								按分组筛选
							</label>
							<div className="flex flex-wrap gap-2">
								<button
									onClick={() => setFilterGroup("All")}
									className={`px-3 py-1 text-sm rounded-full ${filterGroup === "All"
										? "bg-blue-600 text-white"
										: "bg-gray-200 text-gray-800 hover:bg-gray-300"
										}`}
								>
									所有
								</button>
								{taskGroups.map((group) => (
									<button
										key={group}
										onClick={() => setFilterGroup(group)}
										className={`px-3 py-1 text-sm rounded-full ${filterGroup === group
											? "bg-blue-600 text-white"
											: "bg-gray-200 text-gray-800 hover:bg-gray-300"
											}`}
									>
										{group}
									</button>
								))}
							</div>
						</div>
					</div>

					{/* NEW: Conditional Rendering of Different Views */}
					{view === "card" && (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
							{displayedTasks.map((task) => (
								<div
									key={task.originalIndex}
									className="relative"
								>
									<PomodoroTask
										onRulesUpdate={function (newRules: string): void {
											throw new Error("Function not implemented.");
										}} onTaskFail={function (reason: string): void {
											throw new Error("Function not implemented.");
										}} {...task}
										onStart={() => handleTaskStart(task.originalIndex)} />
									{formatAchievement(task) && (
										<div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
											<Trophy className="w-3 h-3" />
											{formatAchievement(task)}
										</div>
									)}
								</div>
							))}
						</div>
					)}

					{view === "table" && (
						<div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th
											scope="col"
											className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											任务名称
										</th>
										<th
											scope="col"
											className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											分组
										</th>
										<th
											scope="col"
											className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											类型
										</th>
										<th
											scope="col"
											className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
										>
											成就
										</th>
										<th
											scope="col"
											className="relative px-6 py-3"
										>
											<span className="sr-only">
												Actions
											</span>
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{displayedTasks.map((task) => (
										<tr key={task.originalIndex}>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm font-medium text-gray-900">
													{task.name}
												</div>
												<div className="text-sm text-gray-500 max-w-xs truncate">
													{task.rules}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
													{task.taskGroup}
												</span>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{task.type === "timer"
													? "定时"
													: "开关"}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{formatAchievement(task) ||
													"暂无"}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
												<button
													onClick={() =>
														handleTaskStart(
															task.originalIndex
														)
													}
													className="text-blue-600 hover:text-blue-900 font-semibold"
												>
													开始
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}

					{view === "compact" && (
						<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
							{displayedTasks.map((task) => (
								<div
									key={task.originalIndex}
									className="p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
								>
									<div>
										<h3 className="font-semibold text-gray-800 truncate">
											{task.name}
										</h3>
										<div className="flex items-center gap-2 mt-2 flex-wrap">
											<span
												className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${task.type === "timer"
													? "bg-blue-100 text-blue-800"
													: "bg-gray-100 text-gray-800"
													}`}
											>
												{task.type === "timer"
													? "定时"
													: "开关"}
											</span>
											<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
												{task.taskGroup}
											</span>
										</div>
										{formatAchievement(task) && (
											<div className="mt-2 text-xs text-yellow-700 flex items-center gap-1">
												<Trophy className="w-3 h-3 text-yellow-500" />
												{formatAchievement(task)}
											</div>
										)}
									</div>
									<button
										onClick={() =>
											handleTaskStart(task.originalIndex)
										}
										className="mt-4 w-full inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
									>
										<Play className="w-4 h-4 mr-2" />
										开始
									</button>
								</div>
							))}
						</div>
					)}

					{/* NEW: Empty state message */}
					{displayedTasks.length === 0 && !showCreateForm && (
						<div className="text-center py-12 px-4 bg-white rounded-lg shadow-sm border">
							<h3 className="text-lg font-medium text-gray-900">
								未找到任务
							</h3>
							<p className="mt-1 text-sm text-gray-500">
								尝试调整搜索或筛选条件，或创建一个新任务。
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default App;
