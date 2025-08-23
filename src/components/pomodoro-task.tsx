"use client";

import Lottie from "lottie-react";
import { useState, useEffect, useRef } from "react";
import * as Diff from "diff";
import groovyWalkAnimation from "./workout.json";
import ConfenttiAnimation from "../assets/Confetti.json"
import { BookOpen, CheckCircle, ClockIcon, Home, Play, Timer, XCircle } from "lucide-react";
import { RuleChange, TaskStatus } from "../types/task";

// --- Custom SVG Progress Circle Component (Unchanged) ---
const SvgCircularProgress = ({ progress, isIndeterminate = false }: { progress: number; isIndeterminate?: boolean; }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;
    return (
        <svg className="w-32 h-32" viewBox="0 0 120 120">
            <circle className="text-gray-200" strokeWidth="10" stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60" />
            <circle className={`transition-all duration-500 ${isIndeterminate ? "animate-spin origin-center" : ""}`} strokeWidth="10" strokeDasharray={circumference} strokeDashoffset={isIndeterminate ? circumference * 0.75 : offset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60" transform="rotate(-90 60 60)" />
        </svg>
    );
};

// --- NEW: Component to render the text diff ---
const RuleDiffViewer = ({ oldRules, newRules }: { oldRules: string; newRules: string }) => {
    const changes = Diff.diffChars(oldRules, newRules);
    if (changes.length === 1 && !changes[0].added && !changes[0].removed) {
        return <p className="text-sm text-gray-400 italic">No changes to the rules.</p>;
    }

    return (
        <div className="p-3 bg-gray-50 rounded-md border text-sm whitespace-pre-wrap font-mono">
            {changes.map((part, index) => {
                const style = part.added
                    ? "bg-green-100 text-green-800"
                    : part.removed
                        ? "bg-red-100 text-red-800 line-through"
                        : "text-gray-600";
                return (
                    <span key={index} className={style}>
                        {part.value}
                    </span>
                );
            })}
        </div>
    );
};


// --- PomodoroTask Component (Modified with onStart/onEnd/onFail) ---
export interface PomodoroTaskProps {
    name: string;
    type: "timer" | "toggle";
    rules: string;
    duration?: number;
    appointmentDuration: number;
    allowPause: boolean;
    rulesHistory: RuleChange[],
    onRulesUpdate: (newRules: string) => void;
    onTaskFail: (reason: string) => void;
    onStart?: () => void;
    onEnd?: (completed: boolean, timeSpent: number) => void;
    onFail?: () => void;
    animation: React.ReactNode;

}


export function PomodoroTask({
    name,
    type,
    rules,
    rulesHistory = [],
    duration = 25 * 60,
    appointmentDuration,
    allowPause,
    animation,
    onRulesUpdate,
    onTaskFail,
    onStart,
    onEnd = (completed: boolean, timeSpent: number) => undefined

}: PomodoroTaskProps) {
    const [status, setStatus] = useState<TaskStatus>("idle");
    const [timeLeft, setTimeLeft] = useState(duration);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [appointmentTimeLeft, setAppointmentTimeLeft] = useState(appointmentDuration);

    // --- State for new features ---
    const [showScheduleFail, setShowScheduleFail] = useState(false);
    const [showGiveUpConfirm, setShowGiveUpConfirm] = useState(false);
    const [failureReason, setFailureReason] = useState("");
    const [editedRules, setEditedRules] = useState(rules);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const handleStartImmediately = () => {
        onStart?.();
        handleScheduleSuccess();
    };

    const clearTimer = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    // --- Task Lifecycle Handlers ---
    const handleStartTask = () => {
        setStatus("running");
        if (type === "timer") {
            setTimeLeft(duration);
            startTimer();
        } else {
            setElapsedTime(0);
            startStopwatch();
        }
    };

    const handleSchedule = () => {
        setStatus("scheduled");
        setAppointmentTimeLeft(appointmentDuration);
        clearTimer();
        intervalRef.current = setInterval(() => {
            setAppointmentTimeLeft((prev) => {
                if (prev <= 1) {
                    clearTimer();
                    const success = Math.random() > 0.2;
                    if (success) handleStartTask();
                    else {
                        setStatus("failed");
                        setShowScheduleFail(true);
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const startTimer = () => {
        clearTimer();
        intervalRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearTimer();
                    setStatus("confirming_completion"); // Go to review screen
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

    const startStopwatch = () => {
        clearTimer();
        intervalRef.current = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
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

    const handleToggleComplete = () => {
        clearTimer();
        setStatus("confirming_completion"); // Go to review screen

    };

    // --- NEW: Handlers for Failure and Completion Confirmation ---
    const handleInitiateGiveUp = () => {
        clearTimer();
        setShowGiveUpConfirm(true);
    };

    const handleConfirmGiveUp = () => {
        onTaskFail(failureReason); // Inform parent component
        setStatus("failed");
        setShowGiveUpConfirm(false);
        // In a real app, you might want a specific "failed" view before resetting
        setTimeout(resetTaskState, 2000);
    };

    const handleConfirmCompletion = () => {
        if (editedRules !== rules) {
            onRulesUpdate(editedRules); // Inform parent of the change
        }
        setStatus("completed");
        onEnd(true, 10)
    };

    const resetTaskState = () => {
        clearTimer();
        setStatus("idle");
        setTimeLeft(duration);
        setElapsedTime(0);
        setAppointmentTimeLeft(appointmentDuration);
        setShowScheduleFail(false);
        setShowGiveUpConfirm(false);
        setFailureReason("");
        setEditedRules(rules); // Reset editor text
    };

    useEffect(() => {
        setEditedRules(rules);
    }, [rules]);

    useEffect(() => () => clearTimer(), []);

    // --- Utility and Display Logic ---
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const getProgress = () => {
        if (status === "scheduled") return ((appointmentDuration - appointmentTimeLeft) / appointmentDuration) * 100;
        if (status === 'completed' || status === 'confirming_completion') return 100;
        if (type === "timer" && (status === "running" || status === "paused")) return ((duration - timeLeft) / duration) * 100;
        return 0;
    };

    const renderTimeDisplay = () => {
        if (status === "scheduled") return { time: formatTime(appointmentTimeLeft), label: "预约剩余时间" };
        if (type === "timer") return { time: formatTime(timeLeft), label: "任务剩余时间" };
        return { time: formatTime(elapsedTime), label: "已用时间" };
    };
    const { time, label } = renderTimeDisplay();

    // --- NEW: Render completion confirmation view ---
    if (status === "confirming_completion") {
        return (
            <div className="w-full max-w-md mx-auto shadow-lg border rounded-lg bg-white p-6">
                <div className="text-center">


                    <Lottie animationData={ConfenttiAnimation} className="w-[200px] h-[200px] mx-auto" />
                    <h2 className="mt-2 text-xl font-semibold">任务完成！</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        做的很棒！根据本次经验，是否需要调整任务规则？
                    </p>
                </div>
                <div className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="rules-editor" className="block text-sm font-medium text-gray-700">
                            任务规则描述
                        </label>
                        <textarea
                            id="rules-editor"
                            rows={4}
                            value={editedRules}
                            onChange={(e) => setEditedRules(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">变更预览</h3>
                        <RuleDiffViewer oldRules={rules} newRules={editedRules} />
                    </div>
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={handleConfirmCompletion}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <CheckCircle className="w-4 h-4 mr-2" /> 保存并结束
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="w-full max-w-md mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300 border rounded-lg bg-white">
                <div className="p-6 pb-4">
                    <Lottie animationData={groovyWalkAnimation} loop={status === 'running'} />
                    <div className="flex items-center justify-between mt-4">
                        <h2 className="text-lg font-semibold">{name}</h2>
                        {/* Status Tags ... */}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{rules}</p>
                    {rulesHistory.length > 0 && (
                        <details className="mt-3">
                            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                查看规则变更历史
                            </summary>
                            <div className="mt-2 pl-4 border-l-2 space-y-2">
                                {rulesHistory.map((entry, i) => (
                                    <div key={i} className="text-xs text-gray-600">
                                        <p className="font-semibold">{new Date(entry.timestamp).toLocaleString()}</p>
                                        <p className="whitespace-pre-wrap">{entry.change}</p>
                                    </div>
                                ))}
                            </div>
                        </details>
                    )}
                </div>

                <div className="p-6 pt-0 space-y-4">
                    <div className="flex justify-center items-center relative text-blue-600">
                        <SvgCircularProgress progress={getProgress()} isIndeterminate={type === "toggle" && status === "running"} />
                        <div className="absolute flex flex-col items-center">
                            <div className={`w-32 h-32 flex items-center justify-center text-xs text-gray-500`}>
                                {animation}
                            </div>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-mono font-bold text-gray-800">{time}</div>
                        <div className="text-xs text-gray-500">{label}</div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex gap-2 justify-center">
                        {status === "idle" && (
                            <>
                                <button
                                    onClick={handleSchedule}
                                    className="flex-1 inline-flex items-center justify-center px-4 py-2  text-sm font-medium rounded-md text-white bg-blue-400 hover:bg-blue-700"
                                >
                                    <Timer className="w-4 h-4 mr-2" /> 预约
                                </button>
                                <button
                                    onClick={handleStartImmediately}
                                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <Play
                                        className="w-4 h-4 mr-2"
                                        fill="green"
                                    />{" "}
                                    直接开始
                                </button>
                            </>
                        )}
                        {status === "scheduled" && (

                            <>
                                <button
                                    disabled
                                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-400 cursor-not-allowed"
                                >
                                    <ClockIcon className="w-4 h-4 mr-2 animate-spin" />{" "}
                                    预约中...
                                </button>

                                <button>完成预约</button>
                                <button>放弃任务</button>

                            </>
                        )}

                        {(status === "running" || status === "paused") && (
                            <>
                                {allowPause && (
                                    <button onClick={handlePauseResume} className="...">
                                        {status === "running" ? "暂停" : "继续"}
                                    </button>
                                )}
                                <button
                                    onClick={handleInitiateGiveUp} // Changed from resetTaskState
                                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 inline-flex items-center"
                                >
                                    <XCircle className="w-4 h-4 mr-1" /> 放弃
                                </button>
                                {type === "toggle" && status === "running" && (
                                    <button onClick={handleToggleComplete} className="...">
                                        <CheckCircle className="w-4 h-4 mr-1" /> 完成
                                    </button>
                                )}
                            </>
                        )}
                        {status === "completed" && (
                            <button onClick={resetTaskState} className="flex-1 ...">
                                <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> 再来一次！
                            </button>
                        )}
                        {status === "failed" && (
                            <>
                                <button onClick={resetTaskState} className="flex-1 ...">
                                    <XCircle className="w-4 h-4 mr-2 text-red-500" /> 重新开始
                                </button>
                                <button>
                                    <Home />

                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* --- MODALS --- */}
            {/* Appointment Failure Modal */}
            {showScheduleFail && (<></>)}

            {/* NEW: Give Up / Failure Confirmation Modal */}
            {showGiveUpConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="w-96 mx-4 bg-white rounded-lg shadow-xl border">
                        <div className="p-6">
                            <h2 className="flex items-center gap-2 text-red-600 font-semibold">
                                <XCircle className="w-5 h-5" /> 确认放弃任务？
                            </h2>
                        </div>
                        <div className="p-6 pt-0 space-y-4">
                            <p className="text-sm text-gray-500">
                                确定要将任务 "{name}" 标记为失败吗？这个操作无法撤销。
                            </p>
                            <div>
                                <label htmlFor="failure-reason" className="block text-sm font-medium text-gray-700">
                                    总结经验（可选）
                                </label>
                                <textarea
                                    id="failure-reason"
                                    rows={3}
                                    value={failureReason}
                                    onChange={(e) => setFailureReason(e.target.value)}
                                    placeholder="例如：受到了干扰、任务预估时间不足..."
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleConfirmGiveUp}
                                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                >
                                    确认失败
                                </button>
                                <button
                                    onClick={() => setShowGiveUpConfirm(false)}
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
