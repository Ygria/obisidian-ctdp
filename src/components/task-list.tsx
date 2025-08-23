import React from 'react';
import { Play, Trophy } from 'lucide-react';
import type { DisplayTask } from '../hooks/useFilteredTasks';
import { PomodoroTask } from './pomodoro-task'; // Assuming PomodoroTask is now a summary card in dashboard

interface TaskListProps {
    tasks: DisplayTask[];
    view: "card" | "table" | "compact";
    onTaskStart: (index: number) => void;
    formatAchievement: (task: DisplayTask) => string | null;
    // You need to pass these down if you want to update from the card view
    onTaskFail: (index: number, reason: string) => void; 
    onRulesUpdate: (index: number, newRules: string) => void;
}

export function TaskList({ tasks, view, onTaskStart, formatAchievement, onTaskFail, onRulesUpdate }: TaskListProps) {
    if (tasks.length === 0) {
        return (
            <div className="text-center py-12 px-4 bg-white rounded-lg shadow-sm border">
                <h3 className="text-lg font-medium text-gray-900">未找到任务</h3>
                <p className="mt-1 text-sm text-gray-500">尝试调整搜索或筛选条件，或创建一个新任务。</p>
            </div>
        );
    }

    if (view === "card") {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {tasks.map((task) => (
                    <div key={task.originalIndex} className="relative p-4 bg-white rounded-lg shadow-sm border">
                        <h3 className="font-bold">{task.name}</h3>
                        <p className="text-sm text-gray-500">{task.rules}</p>
                        <button onClick={() => onTaskStart(task.originalIndex)} className="mt-4 text-blue-600 font-semibold">开始</button>
                        {formatAchievement(task) && (
                            <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                <Trophy className="w-3 h-3" />
                                {formatAchievement(task)}
                            </div>
                        )}
                    </div>
                ))}
            </div>
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
                                <td className="px-6 py-4">{task.type === "timer" ? "定时" : "开关"}</td>
                                <td className="px-6 py-4">{formatAchievement(task) || "暂无"}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => onTaskStart(task.originalIndex)} className="text-blue-600 hover:text-blue-900 font-semibold">开始</button>
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
                    <div key={task.originalIndex} className="p-4 bg-white rounded-lg shadow-sm border flex flex-col justify-between">
                        <div>
                           <h3 className="font-semibold truncate">{task.name}</h3>
                           {/* ... other details ... */}
                        </div>
                        <button onClick={() => onTaskStart(task.originalIndex)} className="mt-4 w-full ..."><Play className="w-4 h-4 mr-2" />开始</button>
                    </div>
                ))}
            </div>
        );
    }

    return null;
}