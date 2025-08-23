import { useMemo } from "react";
import type { TaskData, TaskGroup } from "../types/task";

// We create an extended type that includes the originalIndex
export type DisplayTask = TaskData & { originalIndex: number };

export function useFilteredTasks(
    tasks: TaskData[],
    filterGroup: TaskGroup | "All",
    searchTerm: string,
    sortCriteria: string
): DisplayTask[] {
    return useMemo(() => {
        let processedTasks = tasks.map((task, index) => ({
            ...task,
            originalIndex: index,
        }));

        if (filterGroup !== "All") {
            processedTasks = processedTasks.filter(
                (task) => task.taskGroup === filterGroup
            );
        }

        if (searchTerm) {
            const lowercasedSearchTerm = searchTerm.toLowerCase();
            processedTasks = processedTasks.filter(
                (task) =>
                    task.name.toLowerCase().includes(lowercasedSearchTerm) ||
                    task.rules.toLowerCase().includes(lowercasedSearchTerm)
            );
        }

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
                    const achievementA = a.type === "timer" ? a.totalTimeAchieved : a.achievedCount;
                    const achievementB = b.type === "timer" ? b.totalTimeAchieved : b.achievedCount;
                    return achievementB - achievementA;
                });
                break;
            default:
                break;
        }

        return processedTasks;
    }, [tasks, filterGroup, searchTerm, sortCriteria]);
}