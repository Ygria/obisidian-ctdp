
import { Columns2, Grid, List, Check } from 'lucide-react';
import type { TaskGroup, TaskGroupCount } from '../types/task';



type ViewMode = "card" | "table" | "compact";


interface TaskToolbarProps {
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    sortCriteria: string;
    onSortCriteriaChange: (value: string) => void;
    view: ViewMode;
    onViewChange: (view: ViewMode) => void;
    filterGroup: TaskGroup | "All";
    onFilterGroupChange: (group: TaskGroup | "All") => void;
    taskGroupsNum: TaskGroupCount[]
}

export function TaskToolbar({
    searchTerm, onSearchTermChange,
    sortCriteria, onSortCriteriaChange,
    view, onViewChange,
    filterGroup, onFilterGroupChange,
    taskGroupsNum

}: TaskToolbarProps) {
    return (
        <div className="mb-6 p-4 bg-white rounded-lg shadow-sm  space-y-4">
            <div className="flex flex-wrap gap-4 items-end">
                {/* Search Input */}
                <div>
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700">搜索任务</label>
                    <input
                        type="text" id="search" placeholder="按名称或规则搜索..."
                        value={searchTerm} onChange={(e) => onSearchTermChange(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                </div>

                <div>
                    <label htmlFor="sort" className="block text-sm font-medium text-gray-700">排序方式</label>
                    <select
                        id="sort" value={sortCriteria} onChange={(e) => onSortCriteriaChange(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                        <option value="default">默认排序</option>
                        <option value="name-asc">名称 (A-Z)</option>
                        <option value="name-desc">名称 (Z-A)</option>
                        <option value="group-asc">分组</option>
                        <option value="achievement-desc">成就最高</option>
                    </select>
                </div>
                {/* View Mode Buttons */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">视图模式</label>
                    <div className="mt-1 flex rounded-md shadow-sm">
                        <button onClick={() => onViewChange("card")} className={`p-2  shadow-sm ${view === 'card' ? 'bg-green-100 ...' : '...'}`}><Columns2 className="w-5 h-5" /></button>
                        <button onClick={() => onViewChange("table")} className={`p-2 shadow-sm ${view === 'table' ? 'bg-green-100 ...' : '...'}`}><List className="w-5 h-5" /></button>
                        <button onClick={() => onViewChange("compact")} className={`p-2 shadow-sm ${view === 'compact' ? 'bg-green-100 ...' : '...'}`}><Grid className="w-5 h-5" /></button>
                    </div>
                </div>
            </div>
            {/* Filter Buttons */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">按分组筛选</label>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => onFilterGroupChange("All")} className={`flex items-center shadow-sm  px-3 py-1 rounded-sm'`}>
                        {filterGroup === 'All' && (<Check className="w-4 h-4 mr-2" stroke="green" />)}
                        所有</button>
                    {taskGroupsNum?.map((group) => (
                        <button key={group.name} onClick={() => onFilterGroupChange(group.name)} className='flex items-center shadow-sm px-3 py-1'>

                            {filterGroup === group.name && (<Check className="w-4 h-4 mr-2" stroke="green" />)}

                            {group.name}

                            <span className="mx-2 bg-blue-100 text-blue-800 text-xs font-medium me-2 px-2 py-0.5 rounded-sm dark:bg-blue-900 dark:text-blue-300">{group.count}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}