import React, { useState } from "react";
import { Plus } from "lucide-react";
import type { TaskData, TaskGroup } from "../types/task";
import { useFilteredTasks } from "../hooks/useFilteredTasks";
import { TaskToolbar } from "./task-toolbar";
import { TaskList } from "./task-list";
import { TaskCreateForm } from "./task-create-form";

interface DashboardProps {
	tasks: TaskData[];
	onTaskStart: (index: number, mode: "immediate" | "schedule") => void;
	onCreateTask: (newTask: TaskData) => void;
	onTaskFail: (index: number, reason: string) => void;
	onRulesUpdate: (index: number, newRules: string) => void;
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
				<h1 className="text-3xl font-bold text-gray-800">
					CDTP任务中心
				</h1>

				<div
					onClick={() => setShowCreateForm(true)}
					className="flex items-center gap-x-2 text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
				>
					<Plus className="h-4 w-4 mr-2" />
					添加任务
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
