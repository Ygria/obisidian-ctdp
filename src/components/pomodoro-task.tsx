"use client";

import Lottie from "lottie-react";
import { useState, useEffect, useRef } from "react";
import * as Diff from "diff";

import ConfenttiAnimation from "../assets/Confetti.json"

import {
    BookOpen, CheckCircle, ClockIcon, Home, Play, Timer, XCircle, Triangle, TriangleAlert,

    Crown,
    Split,
    Pause


} from "lucide-react";
import { RuleChange, TaskRecord, TaskStatus } from "../types/task";
import { Animation } from "./animation";

// --- Custom SVG Progress Circle Component (Unchanged) ---
const SvgCircularProgress = ({ progress, isIndeterminate = false }: { progress: number; isIndeterminate?: boolean; }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;
    return (
        <svg className="w-32 h-32" viewBox="0 0 120 120">
            {!isIndeterminate && <><circle className="text-gray-200" strokeWidth="10" stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60"

            />
                <circle className={`transition-all duration-500 ${isIndeterminate ? "" : ""}`} strokeWidth="10" strokeDasharray={circumference} strokeDashoffset={isIndeterminate ? 0 : offset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60" transform="rotate(-90 60 60)" />
            </>
            }
        </svg>
    );
};

// --- NEW: Component to render the text diff ---
const RuleDiffViewer = ({ oldRules, newRules }: { oldRules: string; newRules: string }) => {
    if (!oldRules || !newRules) {
        return <></>
    }
    const changes = Diff.diffChars(oldRules, newRules);
    if (changes.length === 1 && !changes[0].added && !changes[0].removed) {
        return <p className="text-sm text-gray-400 italic">
            为了维护规则神圣，请您确认本次行为符合当前规则。

        </p>;
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

    id: string;
    recordId: string;

    name: string;
    type: "timer" | "toggle";
    rules: string;
    duration?: number;
    appointmentDuration: number;
    allowPause: boolean;
    taskGroup: string;
    rulesHistory: RuleChange[],
    startSignal: string,
    completionSignal: string;
    onRulesUpdate: (oldRules: string, newRules: string) => void;
    onTaskFail: (reason: string) => void;
    onStart?: () => void;
    onEnd?: (completed: boolean, timeSpent: number) => void;
    onFail?: () => void;
    animation: string

    initialAction?: 'immediate' | 'schedule' | null;

    // 任务结束时，创建一条任务记录
    onRecordCreate: (record: TaskRecord) => void;
}


// A temporary internal state to hold record data as it's being built
type InProgressRecord = Partial<Omit<TaskRecord, 'id' | 'createdAt' | 'updatedAt'>> & {
    pauseStartTime?: Date; // Temporarily store when a pause begins
};


export function PomodoroTask({
    id: taskId,
    recordId,
    name,
    type,
    taskGroup,
    startSignal,
    completionSignal,
    rules,
    rulesHistory = [],
    duration = 25 * 60,
    appointmentDuration,
    allowPause,
    animation,
    onRulesUpdate,
    onTaskFail,
    onStart,
    onEnd = (completed: boolean, timeSpent: number) => undefined,
    initialAction = null, // <-- 在解构时获取新 prop
    onRecordCreate

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
    // +++ State for completion feedback
    const [completionThoughts, setCompletionThoughts] = useState("");
    const [completionRating, setCompletionRating] = useState<number | undefined>();

    // +++ State to build the TaskRecord during the task lifecycle
    const [recordInProgress, setRecordInProgress] = useState<InProgressRecord>({});

    const intervalRef = useRef<NodeJS.Timeout | null>(null);


    useEffect(() => {
        if (initialAction === 'immediate') {
            console.log("initial action", initialAction)
            handleStartImmediately(); // 直接开始
        } else if (initialAction === 'schedule') {
            console.log("initial action", initialAction)
            handleSchedule(); // 开始预约
        }
    }, []); // 仍然只运行一次

    const handleStartImmediately = () => {
        onStart?.();
        // 为现在开始的任务创建一条记录
        const now = new Date();
        setRecordInProgress({
            appointmentStart: now,
            appointmentEnd: now,
            actualStart: now,
            pausedCount: 0,
            pauseDurations: [],
        });
        handleScheduleSuccess();
    };

    const clearTimer = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    // --- Task Lifecycle Handlers ---
    // This is now only called by the automatic scheduler
    const handleStartTask = () => {
        setStatus("running");

        //  Record actual start time 记录真实开始时间
        setRecordInProgress(prev => ({ // +++ Record appointment end and actual start
            ...prev,
            appointmentEnd: new Date(),
            actualStart: new Date(),
        }));
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
        //  Record appointment start 记录预约时间
        setRecordInProgress({
            appointmentStart: new Date(),
            pausedCount: 0,
            pauseDurations: [],
        });
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

        // +++ Record actual start time
        if (!recordInProgress.actualStart) {
            setRecordInProgress(prev => ({
                ...prev,
                appointmentEnd: new Date(),
                actualStart: new Date()
            }));
        }
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
            //  Record pause start time and increment count 记录暂停使用了多久
            setRecordInProgress(prev => ({
                ...prev,
                pausedCount: (prev.pausedCount || 0) + 1,
                pauseStartTime: new Date(),
            }));
        } else if (status === "paused") {
            setStatus("running");
            type === "timer" ? startTimer() : startStopwatch();

            if (recordInProgress.pauseStartTime) {
                const pauseEnd = new Date();
                const durationMs = pauseEnd.getTime() - recordInProgress.pauseStartTime.getTime();
                setRecordInProgress(prev => ({
                    ...prev,
                    pauseDurations: [...(prev.pauseDurations || []), durationMs],
                    pauseStartTime: undefined, // Clear the temp start time
                }));
            }
        }
    };

    const finalizeAndCreateRecord = (completed: boolean, feedback: { thoughts?: string; rating?: number; }) => {
        const now = new Date();
        const totalPausedDuration = recordInProgress.pauseDurations?.reduce((a, b) => a + b, 0) || 0;
        const totalActiveDuration = recordInProgress.actualStart
            ? now.getTime() - recordInProgress.actualStart.getTime() - totalPausedDuration
            : 0;

        const finalRecord: TaskRecord = {
            id: recordId,
            taskId,
            taskGroup,
            appointmentStart: recordInProgress.appointmentStart,
            appointmentEnd: recordInProgress.appointmentEnd,
            actualStart: recordInProgress.actualStart,
            actualEnd: now,
            completed,
            pausedCount: recordInProgress.pausedCount || 0,
            pauseDurations: recordInProgress.pauseDurations || [],
            totalPausedDuration,
            totalActiveDuration,
            thoughts: feedback.thoughts,
            rating: feedback.rating,
            createdAt: now,
            updatedAt: now,
        };

        onRecordCreate(finalRecord);
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

        finalizeAndCreateRecord(false, { thoughts: failureReason });
        // onTaskFail(failureReason); // Inform parent component
        setStatus("failed");
        setShowGiveUpConfirm(false);
        // In a real app, you might want a specific "failed" view before resetting
        setTimeout(resetTaskState, 2000);
        onEnd(false, 0)
    };

    const handleConfirmCompletion = () => {
        if (editedRules !== rules) {
            onRulesUpdate(rules, editedRules); // Inform parent of the change
        }

        finalizeAndCreateRecord(true, { thoughts: completionThoughts, rating: completionRating });
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
        // +++ Reset record-related state
        setRecordInProgress({});
        setCompletionThoughts("");
        setCompletionRating(undefined);
    };

    const restartTask = () =>{
        resetTaskState()
        handleStartImmediately()
    }

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
            <div className="w-full max-w-md mx-auto shadow-lg  rounded-lg bg-white p-6">
                <div className="text-center">


                    <Lottie animationData={ConfenttiAnimation} className="w-[200px] h-[200px] mx-auto" />
                    <h2 className="mt-2 text-xl font-semibold">任务完成！</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        做的很棒！根据本次经验，是否需要调整任务规则？
                    </p>
                    <div className="p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300" role="alert">
                        <span className="font-medium">下必为例。</span>
                        您的选择将影响接下来所有的任务，为了保证规则的神圣，请您谨慎选择。
                    </div>
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
            <div className="w-full max-w-md mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg bg-white">
                <div className="p-6 pb-4">

                    <div className="flex items-center justify-between mt-4">
                        <h2 className="text-lg font-semibold">{name}</h2>

                    </div>
                    {status === 'scheduled' && (<p>
                        <div class="p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50 dark:bg-gray-800 dark:text-blue-400" role="alert">
                            请在预约时间内完成任务开始标志动作:
                            <span class="font-medium">{startSignal} </span>
                        </div>
                    </p>)
                    }

                    <p className="text-sm text-gray-500 mt-2">{rules}</p>
                    {rulesHistory?.length > 0 && (
                        <details className="mt-3">
                            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                查看规则变更历史
                            </summary>
                            <div className="mt-2 pl-4 border-l-2 space-y-2">
                                {rulesHistory.map((entry, i) => (
                                    <div key={i} className="text-xs text-gray-600">
                                        <p className="font-semibold">{new Date(entry.timestamp).toLocaleString()}</p>

                                        <RuleDiffViewer oldRules={entry.oldRules} newRules={entry.newRules} />
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
                                {/* {animation} */}

                                {status === 'scheduled' && (<Animation name='timer' />)}

                                {status === 'running' && (<Animation name={animation ?? 'waiting'} />)}

                                {status === 'paused' && (<Animation name='sandy-loading' />)}
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

                                <button onClick={handleStartImmediately}>完成预约</button>
                                <button onClick={handleInitiateGiveUp}>放弃任务</button>

                            </>
                        )}

                        {(status === "running" || status === "paused") && (
                            <>
                                {allowPause && (
                                    <button onClick={handlePauseResume} className="px-4 border border-gray-300 py-2 hover:bg-gray-200 text-sm font-medium rounded-md inline-flex items-center">


                                        {status === "running" ? <Pause className="w-4 h-4 mr-1" stroke="orange" /> :

                                            <Play className="w-4 h-4 mr-1" stroke="green"> </Play>}
                                        {status === "running" ? "暂停" : "继续"}
                                    </button>
                                )}
                                <button
                                    onClick={handleInitiateGiveUp} // Changed from resetTaskState
                                    className="px-4 py-2 border text-sm font-medium rounded-md  inline-flex items-center border-gray-300  hover:bg-gray-200"
                                >
                                    <XCircle className="w-4 h-4 mr-1" stroke="red" /> 放弃
                                </button>
                                {type === "toggle" && status === "running" && (
                                    <button onClick={handleToggleComplete} className="px-4 border py-2 border-gray-300  hover:bg-gray-200 text-sm font-medium rounded-md inline-flex items-center">
                                        <CheckCircle className="w-4 h-4 mr-1" stroke="green" /> 完成
                                    </button>
                                )}
                            </>
                        )}
                        {status === "completed" && (
                            <button onClick={restartTask} className="flex-1 ...">
                                <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> 再来一次！
                            </button>
                        )}
                        {status === "failed" && (
                            <>
                                <button onClick={resetTaskState} className="flex-1 ">
                                    <XCircle className="w-4 h-4 mr-2 text-red-500" /> 重新开始
                                </button>
                                <button onClick={()=> onEnd(false, 0)}>
                                    <Home /> 返回 

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
                            <span className="flex items-center gap-2 text-red-600 font-semibold">
                                <TriangleAlert className="w-5 h-5 text-red-600" /> 确认放弃任务？

                            </span>
                            <Animation name={"broken-chain"} />
                        </div>
                        <div className="p-6 pt-0 space-y-4">
                            <p className="text-sm text-gray-500">
                                确定要将任务 "{name}" 标记为失败吗？


                            </p>
                            <p className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400">
                                太可惜了！这个操作<span className="font-medium">无法撤销</span>，且将会将此前积累的成就
                                <span className="font-medium">全部清空</span>。
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
