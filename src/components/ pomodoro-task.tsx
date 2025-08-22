"use client";

import Lottie from "lottie-react";
import { useState, useEffect, useRef } from "react";
import groovyWalkAnimation from "./workout.json";
// Note: All custom component imports have been removed.

// --- SVG Icon Components (Replaces lucide-react) ---
const PlayIcon = ({ className = "" }) => (
	<svg viewBox="0 0 24 24" fill="currentColor" className={className}>
		<path d="M7 6v12l10-6z"></path>
	</svg>
);
const PauseIcon = ({ className = "" }) => (
	<svg viewBox="0 0 24 24" fill="currentColor" className={className}>
		<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>
	</svg>
);
const SquareIcon = ({ className = "" }) => (
	<svg viewBox="0 0 24 24" fill="currentColor" className={className}>
		<path d="M6 6h12v12H6z"></path>
	</svg>
);
const CheckCircleIcon = ({ className = "" }) => (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
	>
		<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
		<polyline points="22 4 12 14.01 9 11.01"></polyline>
	</svg>
);
const XCircleIcon = ({ className = "" }) => (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
	>
		<circle cx="12" cy="12" r="10"></circle>
		<line x1="15" y1="9" x2="9" y2="15"></line>
		<line x1="9" y1="9" x2="15" y2="15"></line>
	</svg>
);
const ClockIcon = ({ className = "" }) => (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
	>
		<circle cx="12" cy="12" r="10"></circle>
		<polyline points="12 6 12 12 16 14"></polyline>
	</svg>
);
const ToggleLeftIcon = ({ className = "" }) => (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
	>
		<rect x="1" y="5" width="22" height="14" rx="7" ry="7"></rect>
		<circle cx="8" cy="12" r="3"></circle>
	</svg>
);
const ToggleRightIcon = ({ className = "" }) => (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
	>
		<rect x="1" y="5" width="22" height="14" rx="7" ry="7"></rect>
		<circle cx="16" cy="12" r="3"></circle>
	</svg>
);

// --- Custom SVG Progress Circle Component ---
const SvgCircularProgress = ({
	progress,
	isIndeterminate = false,
}: {
	progress: number;
	isIndeterminate?: boolean;
}) => {
	const radius = 50;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (progress / 100) * circumference;

	return (
		<svg className="w-32 h-32" viewBox="0 0 120 120">
			<circle
				className="text-gray-200"
				strokeWidth="10"
				stroke="currentColor"
				fill="transparent"
				r={radius}
				cx="60"
				cy="60"
			/>
			<circle
				className={`transition-all duration-500 ${
					isIndeterminate ? "animate-spin origin-center" : ""
				}`}
				strokeWidth="10"
				strokeDasharray={circumference}
				strokeDashoffset={
					isIndeterminate ? circumference * 0.75 : offset
				}
				strokeLinecap="round"
				stroke="currentColor"
				fill="transparent"
				r={radius}
				cx="60"
				cy="60"
				transform="rotate(-90 60 60)"
			/>
		</svg>
	);
};

// --- Main Pomodoro Task Component ---
export interface PomodoroTaskProps {
	name: string;
	type: "timer" | "toggle";
	rules: string;
	duration?: number; // Seconds, for timer type
	appointmentDuration: number; // Seconds, for scheduling
	allowPause: boolean;
	animation: string; // Placeholder for animation component type
}

type TaskStatus =
	| "idle"
	| "scheduled"
	| "running"
	| "paused"
	| "completed"
	| "failed";

export function PomodoroTask({
	name,
	type,
	rules,
	duration = 25 * 60,
	appointmentDuration,
	allowPause,
	animation,
}: PomodoroTaskProps) {
	const [status, setStatus] = useState<TaskStatus>("idle");
	const [timeLeft, setTimeLeft] = useState(duration);
	const [elapsedTime, setElapsedTime] = useState(0);
	const [appointmentTimeLeft, setAppointmentTimeLeft] =
		useState(appointmentDuration);
	const [showFailConfirm, setShowFailConfirm] = useState(false);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	const clearTimer = () => {
		if (intervalRef.current) clearInterval(intervalRef.current);
	};

	const handleStartImmediately = () => {
		handleScheduleSuccess();
	};

	const handleSchedule = () => {
		setStatus("scheduled");
		setAppointmentTimeLeft(appointmentDuration);
		clearTimer();
		intervalRef.current = setInterval(() => {
			setAppointmentTimeLeft((prev) => {
				if (prev <= 1) {
					clearTimer();
					// Simulate success/fail after appointment time is up
					const success = Math.random() > 0.2; // 80% success rate
					if (success) handleScheduleSuccess();
					else handleScheduleFail();
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
	};

	const handleScheduleSuccess = () => {
		setStatus("running");
		if (type === "timer") {
			setTimeLeft(duration);
			startTimer();
		} else {
			setElapsedTime(0);
			startStopwatch();
		}
	};

	const handleScheduleFail = () => {
		setStatus("failed");
		setShowFailConfirm(true);
	};

	const startTimer = () => {
		clearTimer();
		intervalRef.current = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					clearTimer();
					setStatus("completed");
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
	};

	const startStopwatch = () => {
		clearTimer();
		intervalRef.current = setInterval(
			() => setElapsedTime((prev) => prev + 1),
			1000
		);
	};

	const handlePauseResume = () => {
		if (status === "running") {
			setStatus("paused");
			clearTimer();
		} else if (status === "paused") {
			setStatus("running");
			type === "timer" ? startTimer() : startStopwatch();
		}
	};

	const resetTaskState = () => {
		clearTimer();
		setStatus("idle");
		setTimeLeft(duration);
		setElapsedTime(0);
		setAppointmentTimeLeft(appointmentDuration);
		setShowFailConfirm(false);
	};

	const handleToggleComplete = () => {
		clearTimer();
		setStatus("completed");
	};

	const confirmFail = () => {
		setShowFailConfirm(false);
		resetTaskState();
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs
			.toString()
			.padStart(2, "0")}`;
	};

	const getProgress = () => {
		if (status === "scheduled") {
			return (
				((appointmentDuration - appointmentTimeLeft) /
					appointmentDuration) *
				100
			);
		}
		if (
			type === "timer" &&
			(status === "running" ||
				status === "paused" ||
				status === "completed")
		) {
			return ((duration - timeLeft) / duration) * 100;
		}
		return 0;
	};

	useEffect(() => () => clearTimer(), []);

	// Dynamic content based on status
	const renderTimeDisplay = () => {
		if (status === "scheduled") {
			return {
				time: formatTime(appointmentTimeLeft),
				label: "预约剩余时间",
			};
		}
		if (type === "timer") {
			return {
				time: formatTime(timeLeft),
				label: "任务剩余时间",
			};
		}
		return {
			time: formatTime(elapsedTime),
			label: "已用时间",
		};
	};
	const { time, label } = renderTimeDisplay();

	return (
		<>
			
			<div className="w-full max-w-md mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300 border rounded-lg bg-white">
				
        
        <div className="p-6 pb-4">
          <Lottie animationData={groovyWalkAnimation} />
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold">{name}</h2>
						<div className="flex items-center gap-2">
							<span
								className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
									type === "timer"
										? "bg-blue-100 text-blue-800"
										: "bg-gray-100 text-gray-800"
								}`}
							>
								{type === "timer" ? (
									<>
										<ClockIcon className="w-3 h-3 mr-1" />{" "}
										定时
									</>
								) : status === "completed" ? (
									<>
										<ToggleRightIcon className="w-3 h-3 mr-1" />{" "}
										开关
									</>
								) : (
									<>
										<ToggleLeftIcon className="w-3 h-3 mr-1" />{" "}
										开关
									</>
								)}
							</span>
							<span
								className={`capitalize inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
									status === "completed"
										? "bg-green-100 text-green-800"
										: status === "failed"
										? "bg-red-100 text-red-800"
										: "bg-gray-100 text-gray-800"
								}`}
							>
								{status === "idle" && "待机"}
								{status === "scheduled" && "预约中"}
								{status === "running" && "执行中"}
								{status === "paused" && "暂停"}
								{status === "completed" && "已完成"}
								{status === "failed" && "失败"}
							</span>
						</div>
					</div>
					<p className="text-sm text-gray-500 mt-2">{rules}</p>
				</div>

				<div className="p-6 pt-0 space-y-4">
					<div className="flex justify-center items-center relative text-blue-600">
						<SvgCircularProgress
							progress={getProgress()}
							isIndeterminate={
								type === "toggle" && status === "running"
							}
						/>
						<div className="absolute flex flex-col items-center">
							{/* Placeholder for PixelAnimation component */}
							<div
								className={`w-32 h-32 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500`}
							>
								{animation}
							</div>
						</div>
					</div>

					<div className="text-center">
						<div className="text-2xl font-mono font-bold text-gray-800">
							{time}
						</div>
						<div className="text-xs text-gray-500">{label}</div>
					</div>

					<div className="flex gap-2 justify-center">
						{status === "idle" && (
							<>
								<button
									onClick={handleSchedule}
									className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
								>
									<PlayIcon className="w-4 h-4 mr-2" /> 预约
								</button>
								<button
									onClick={handleStartImmediately}
									className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
								>
									直接开始
								</button>
							</>
						)}

						{status === "scheduled" && (
							<button
								disabled
								className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-400 cursor-not-allowed"
							>
								<ClockIcon className="w-4 h-4 mr-2 animate-spin" />{" "}
								预约中...
							</button>
						)}

						{(status === "running" || status === "paused") && (
							<>
								{allowPause && (
									<button
										onClick={handlePauseResume}
										className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 inline-flex items-center"
									>
										{status === "running" ? (
											<>
												<PauseIcon className="w-4 h-4 mr-1" />{" "}
												暂停
											</>
										) : (
											<>
												<PlayIcon className="w-4 h-4 mr-1" />{" "}
												继续
											</>
										)}
									</button>
								)}
								<button
									onClick={resetTaskState}
									className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 inline-flex items-center"
								>
									<SquareIcon className="w-4 h-4 mr-1" /> 停止
								</button>
								{type === "toggle" && status === "running" && (
									<button
										onClick={handleToggleComplete}
										className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 inline-flex items-center"
									>
										<CheckCircleIcon className="w-4 h-4 mr-1" />{" "}
										完成
									</button>
								)}
							</>
						)}

						{status === "completed" && (
							<button
								onClick={resetTaskState}
								className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
							>
								<CheckCircleIcon className="w-4 h-4 mr-2 text-green-500" />{" "}
								重新开始
							</button>
						)}

						{status === "failed" && (
							<button
								onClick={resetTaskState}
								className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
							>
								<XCircleIcon className="w-4 h-4 mr-2 text-red-500" />{" "}
								重新预约
							</button>
						)}
					</div>
				</div>
			</div>

			{showFailConfirm && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div className="w-80 mx-4 bg-white rounded-lg shadow-xl border">
						<div className="p-6">
							<h2 className="flex items-center gap-2 text-red-600 font-semibold">
								<XCircleIcon className="w-5 h-5" /> 任务预约失败
							</h2>
						</div>
						<div className="p-6 pt-0 space-y-4">
							<p className="text-sm text-gray-500">
								很抱歉，任务 "{name}"
								预约失败。可能是系统繁忙或其他原因导致。
							</p>
							<div className="flex gap-2">
								<button
									onClick={confirmFail}
									className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
								>
									确认
								</button>
								<button
									onClick={() => setShowFailConfirm(false)}
									className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
								>
									取消
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
