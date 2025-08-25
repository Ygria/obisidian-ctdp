import React, { useMemo, useState } from "react";
import { Plus, Network } from "lucide-react";
import type { TaskData, TaskGroup, TaskGroupCount } from "../types/task";
import { useFilteredTasks } from "../hooks/useFilteredTasks";
import { TaskToolbar } from "./task-toolbar";
import { TaskList } from "./task-list";
import { TaskCreateForm } from "./task-create-form";

interface DashboardProps {
	tasks: TaskData[];
	onTaskStart: (index: number, mode: "immediate" | "schedule") => void;
	onCreateTask: (newTask: TaskData) => void;
	onTaskFail: (index: number, reason: string) => void;
	onRulesUpdate: (index: number, oldRules: string, newRules: string) => void;
	formatAchievement: (task: TaskData) => string | null;
}

export function Dashboard({
	tasks,
	onTaskStart,
	onCreateTask,
	onTaskFail,
	onRulesUpdate,
	formatAchievement,
}: DashboardProps) {
	const [showCreateForm, setShowCreateForm] = useState(false);

	// State for controls now lives here
	const [view, setView] = useState<"card" | "table" | "compact">("card");
	const [searchTerm, setSearchTerm] = useState("");
	const [filterGroup, setFilterGroup] = useState<TaskGroup | "All">("All");
	const [sortCriteria, setSortCriteria] = useState<string>("default");



	const taskGroupsNum: TaskGroupCount[] = useMemo(() => {
		console.log("正在重新计算任务组...");

		// 使用 reduce 方法进行聚合
		const groupsMap = tasks.reduce((acc, task) => {
			// 检查 task 是否有 taskGroupId，没有则归入 "未分组"
			const groupId = task.taskGroup || "未分组";

			// 如果累加器中还没有这个组，则初始化它
			if (!acc[groupId]) {
				acc[groupId] = {
					name: groupId,
					count: 0,
					// tasks: [],
				};
			}

			// 将当前任务添加到对应的组，并增加计数
			// acc[groupId].tasks.push(task);
			acc[groupId].count++;

			return acc;
		}, {} as Record<string, TaskGroup>); // 初始值是一个空对象


		// 将 map 结构转换为数组，方便在 React 中渲染
		return Object.values(groupsMap);

	}, [tasks]); // 依赖项数组，当 tasks 变化时，useMemo 会重新计算



	// Use the custom hook to get the derived data
	const displayedTasks = useFilteredTasks(
		tasks,
		filterGroup,
		searchTerm,
		sortCriteria
	);

	const handleCreateTask = (newTask: TaskData) => {
		onCreateTask(newTask);
		setShowCreateForm(false);
	};

	return (
		<div className="max-w-6xl mx-auto">
			<div className="flex justify-between items-center mb-6">


				<div className="flex items-center gap-x-2">
					<div
						onClick={() => setShowCreateForm(true)}
						className="flex items-center gap-x-2 text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
					>
						<Network className="h-4 w-4 mr-2" />
						国策树
					</div>

					<div
						onClick={() => setShowCreateForm(true)}
						className="flex items-center gap-x-2 text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
					>
						<Plus className="h-4 w-4 mr-2" />
						添加任务
					</div>
				</div>
			</div>



			{showCreateForm && (
				<div className="mb-8">
					<TaskCreateForm
						onSubmit={handleCreateTask}
						onCancel={() => setShowCreateForm(false)}
					/>
				</div>
			)}



			<TaskToolbar
				taskGroupsNum={taskGroupsNum}
				searchTerm={searchTerm}
				onSearchTermChange={setSearchTerm}
				sortCriteria={sortCriteria}
				onSortCriteriaChange={setSortCriteria}
				view={view}
				onViewChange={setView}
				filterGroup={filterGroup}
				onFilterGroupChange={setFilterGroup}
			/>

			<TaskList
				tasks={displayedTasks}
				view={view}
				onTaskStart={onTaskStart}
				formatAchievement={formatAchievement}
				onTaskFail={onTaskFail}
				onRulesUpdate={onRulesUpdate}
			/>
		</div>
	);
}
