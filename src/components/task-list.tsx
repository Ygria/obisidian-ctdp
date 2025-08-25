import React from "react";
import { Timer, Play, Trophy } from "lucide-react";
import type { DisplayTask } from "../hooks/useFilteredTasks";
import { renderIcon } from "./ui/icon-picker";
import { Badge } from "./ui/badge";
import { TaskGroupStyles, TaskTypeStyles } from "./../lib/constant";
import { formatDuration } from "../lib/utils";

interface TaskListProps {
	tasks: DisplayTask[];
	view: "card" | "table" | "compact";
	onTaskStart: (index: number, mode: "immediate" | "schedule") => void;
	formatAchievement: (task: DisplayTask) => string | null;
	// You need to pass these down if you want to update from the card view
	onTaskFail: (index: number, reason: string) => void;
	onRulesUpdate: (index: number, newRules: string) => void;
}

export function TaskList({
	tasks,
	view,
	onTaskStart,
	formatAchievement,
	onTaskFail,
	onRulesUpdate,
}: TaskListProps) {
	if (tasks.length === 0) {
		return (
			<div className="text-center py-12 px-4 bg-white rounded-lg shadow-sm border">
				<h3 className="text-lg font-medium text-gray-900">
					未找到任务
				</h3>
				<p className="mt-1 text-sm text-gray-500">
					尝试调整搜索或筛选条件，或创建一个新任务。
				</p>
			</div>
		);
	}

	if (view === "card") {
		return (
			<>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
					{tasks.map((task) => (
						<div
							key={task.originalIndex}
							className="relative p-4  max-w-sm  bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700"
						>
							<h5 className="flex flex-wrap items-center mb-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white gap-2">
								{task.icon && (
									<div> {renderIcon(task.icon)}</div>
								)}
								{task.name}

								<Badge
									text={task.taskGroup}
									style={TaskGroupStyles[task.taskGroup]}
								/>
								<Badge
									text={
										task.type === "timer"
											? `定时${formatDuration(
													task.duration
											  )}`
											: "开关"
									}
									style={TaskTypeStyles[task.type]}
								/>
							</h5>

							<p className="mb-3 font-normal text-gray-500 dark:text-gray-400">
								{task.rules}
							</p>

							<div className="flex flex-wrap gap-2 mt-12">
								<div
									onClick={() =>
										onTaskStart(
											task.originalIndex,
											"schedule"
										)
									}
									className="relative inline-flex items-center justify-center p-0.5  me-2 overflow-hidden text-sm font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-cyan-300 to-lime-300 group-hover:from-teal-300 group-hover:to-lime-300 dark:text-white dark:hover:text-gray-900 focus:ring-4 focus:outline-none focus:ring-lime-200 dark:focus:ring-lime-800"
								>
									<span className=" flex items-center relative px-5 py-2.5 transition-all ease-in duration-75 bg-white dark:bg-gray-900 rounded-md group-hover:bg-transparent group-hover:dark:bg-transparent">
										<Timer className="w-4 h-4 mr-2 text-lime-400" />
										预约
										{formatDuration(
											task.appointmentDuration
										)}
										后开始
									</span>
								</div>
								<div
									onClick={() =>
										onTaskStart(
											task.originalIndex,
											"immediate"
										)
									}
									className="flex items-center text-white bg-gradient-to-r from-cyan-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 shadow-lg shadow-green-500/50 dark:shadow-lg dark:shadow-green-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 "
								>
									<Play className="w-4 h-4 mr-2 text-white" />
									立刻开始
								</div>
							</div>
							{formatAchievement(task) && (
								<div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
									<Trophy className="w-3 h-3" />
									{formatAchievement(task)}
								</div>
							)}
						</div>
					))}
				</div>
			</>
		);
	}

	if (view === "table") {
		return (
			<div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
				<table className="min-w-full divide-y divide-gray-200">
					{/* ... table thead ... */}
					<tbody className="bg-white divide-y divide-gray-200">
						{tasks.map((task) => (
							<tr key={task.originalIndex}>
								<td className="px-6 py-4">{task.name}</td>
								<td className="px-6 py-4">{task.taskGroup}</td>
								<td className="px-6 py-4">
									{task.type === "timer" ? "定时" : "开关"}
								</td>
								<td className="px-6 py-4">
									{formatAchievement(task) || "暂无"}
								</td>
								<td className="px-6 py-4 text-right">
									<button
										onClick={() =>
											onTaskStart(task.originalIndex)
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
		);
	}

	if (view === "compact") {
		return (
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
				{tasks.map((task) => (
					<div
						key={task.originalIndex}
						className="p-4 bg-white rounded-lg shadow-sm border flex flex-col justify-between"
					>
						<div>
							<h3 className="font-semibold truncate">
								{task.name}
							</h3>
							{/* ... other details ... */}
						</div>
						<button
							onClick={() => onTaskStart(task.originalIndex)}
							className="mt-4 w-full ..."
						>
							<Play className="w-4 h-4 mr-2" />
							立刻开始
						</button>
					</div>
				))}
			</div>
		);
	}

	return null;
}
