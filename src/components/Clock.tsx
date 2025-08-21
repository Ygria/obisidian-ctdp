import { Book, Coffee, Pen, Plus } from "lucide-react";
import { JSX, useEffect, useState } from "react";

interface Task {
	id: number;
	name: string;
	duration: number;
	icon: JSX.Element;
	enabled: boolean;
	chain: number;
}

export function Clock() {
	const [tasks, setTasks] = useState<Task[]>([
		{
			id: 1,
			name: "写作",
			duration: 25 * 60,
			icon: <Pen className="w-6 h-6 text-red-500 " />,
			enabled: true,
			chain: 0,
		},
		{
			id: 2,
			name: "学习",
			duration: 30 * 60,
			icon: <Book className="w-6 h-6 text-blue-500" />,
			enabled: true,
			chain: 0,
		},
		{
			id: 3,
			name: "休息",
			duration: 5 * 60,
			icon: <Coffee className="w-6 h-6 text-yellow-500" />,
			enabled: true,
			chain: 0,
		},
	]);

	const [currentTaskId, setCurrentTaskId] = useState<number>(1);
	const [timeLeft, setTimeLeft] = useState(tasks[0].duration);
	const [isRunning, setIsRunning] = useState(false);

	const currentTask = tasks.find((t) => t.id === currentTaskId)!;

	useEffect(() => {
		let timer: number | undefined;
		if (isRunning && timeLeft > 0) {
			timer = window.setInterval(() => setTimeLeft((t) => t - 1), 1000);
		} else if (isRunning && timeLeft === 0) {
			setIsRunning(false);
			setTasks((prev) =>
				prev.map((t) =>
					t.id === currentTaskId ? { ...t, chain: t.chain + 1 } : t
				)
			);
		}
		return () => timer && clearInterval(timer);
	}, [isRunning, timeLeft]);

	const startTask = (task: Task) => {
		setCurrentTaskId(task.id);
		setTimeLeft(task.duration);
		setIsRunning(true);
	};

	const failTask = () => {
		setIsRunning(false);
		setTasks((prev) =>
			prev.map((t) => (t.id === currentTaskId ? { ...t, chain: 0 } : t))
		);
		setTimeLeft(currentTask.duration);
	};

	const formatTime = (sec: number) => {
		const m = String(Math.floor(sec / 60)).padStart(2, "0");
		const s = String(sec % 60).padStart(2, "0");
		return `${m}:${s}`;
	};

	return (
		<div className="p-4 font-sans bg-gray-900 text-white min-h-[300px] bg-red-500">
			<h2 className="text-xl font-bold mb-4">🔥 Pomodoro Chain</h2>

      <button className = "hover:bg-indigo-50">
					<Plus />
					添加任务
				</button>

			{/* 当前任务 */}

			<div className="mb-4 p-4 rounded-lg bg-gray-800 flex flex-col gap-2 shadow-lg">
				<div className="flex items-center gap-2">
					{currentTask.icon}
					<span className="text-lg">{currentTask.name}</span>
				</div>
				<p className="text-2xl">{formatTime(timeLeft)}</p>
				<p>链条: {currentTask.chain} 🔗</p>

				
				<div className="flex gap-2">
					<button
						className="px-3 py-1 bg-green-500 rounded"
						onClick={() => setIsRunning(!isRunning)}
					>
						{isRunning ? "暂停" : "开始"}
					</button>
					<button
						className="px-3 py-1 bg-red-500 rounded"
						onClick={failTask}
					>
						失败
					</button>
				</div>
			</div>

			{/* 任务列表 */}
			<ul className="space-y-2">
				{tasks.map((task) => (
					<li key={task.id}>
						<button
							className={`flex items-center gap-2 px-3 py-2 rounded transition ${
								task.enabled
									? "bg-gray-700 hover:bg-gray-600 text-white"
									: "bg-gray-900 text-gray-500 cursor-not-allowed"
							}`}
							disabled={!task.enabled}
							onClick={() => startTask(task)}
						>
							{task.icon}
							{task.name} (链条:{task.chain})
						</button>
					</li>
				))}
			</ul>
		</div>
	);
}
