"use client"

import React, { useState, useEffect, useRef } from "react"
import { TaskCreateForm } from "./components/task-create-form"

// Helper components (Icons and SVG Progress) are included here for completeness
// --- SVG Icon Components (Replaces lucide-react) ---
const PlayIcon = ({ className = "" }) => <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M7 6v12l10-6z"></path></svg>
const PauseIcon = ({ className = "" }) => <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>
const SquareIcon = ({ className = "" }) => <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M6 6h12v12H6z"></path></svg>
const CheckCircleIcon = ({ className = "" }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
const XCircleIcon = ({ className = "" }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
const ClockIcon = ({ className = "" }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
const ToggleLeftIcon = ({ className = "" }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="1" y="5" width="22" height="14" rx="7" ry="7"></rect><circle cx="8" cy="12" r="3"></circle></svg>
const ToggleRightIcon = ({ className = "" }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="1" y="5" width="22" height="14" rx="7" ry="7"></rect><circle cx="16" cy="12" r="3"></circle></svg>
const PlusIcon = ({ className = "" }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="M12 5v14" /></svg>
const TrophyIcon = ({ className = "" }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6m12 5h1.5a2.5 2.5 0 0 0 0-5H18M9 12v7.5A2.5 2.5 0 0 0 11.5 22h1A2.5 2.5 0 0 0 15 19.5V12M9 12H6v- теоретическийM15 12h3v-3M9 9h6"/></svg>


// --- Custom SVG Progress Circle Component ---
const SvgCircularProgress = ({ progress, isIndeterminate = false }: { progress: number; isIndeterminate?: boolean }) => {
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  return (
    <svg className="w-32 h-32 text-blue-600" viewBox="0 0 120 120">
      <circle className="text-gray-200" strokeWidth="10" stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60" />
      <circle
        className={`transition-stroke-dashoffset duration-500 ${isIndeterminate ? 'animate-spin origin-center' : ''}`}
        strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={isIndeterminate ? circumference * 0.75 : offset}
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

// --- PomodoroTask Component (Modified with onStart/onEnd/onFail) ---
export interface PomodoroTaskProps {
  name: string
  type: "timer" | "toggle"
  rules: string
  duration?: number
  appointmentDuration: number
  allowPause: boolean
  animation: string
  onStart?: () => void
  onEnd?: (completed: boolean, timeSpent: number) => void
  onFail?: () => void
}

type TaskStatus = "idle" | "scheduled" | "running" | "paused" | "completed" | "failed"

export function PomodoroTask({
  name,
  type,
  rules,
  duration = 25 * 60,
  appointmentDuration,
  allowPause,
  animation,
  onStart,
  onEnd,
  onFail,
}: PomodoroTaskProps) {
  const [status, setStatus] = useState<TaskStatus>("idle")
  const [timeLeft, setTimeLeft] = useState(duration)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [appointmentTimeLeft, setAppointmentTimeLeft] = useState(appointmentDuration)
  const [showFailConfirm, setShowFailConfirm] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const clearTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const handleStartImmediately = () => {
    onStart?.()
    handleScheduleSuccess()
  }
  
  const handleSchedule = () => {
    onStart?.()
    setStatus("scheduled")
    setAppointmentTimeLeft(appointmentDuration)
    clearTimer()
    intervalRef.current = setInterval(() => {
        setAppointmentTimeLeft(prev => {
            if (prev <= 1) {
                clearTimer()
                const success = Math.random() > 0.2
                if (success) handleScheduleSuccess()
                else handleAppointmentFail()
                return 0
            }
            return prev - 1
        })
    }, 1000)
  }

  const handleScheduleSuccess = () => {
    setStatus("running")
    if (type === "timer") {
        setTimeLeft(duration)
        startTimer()
    } else {
        setElapsedTime(0)
        startStopwatch()
    }
  }

  const handleAppointmentFail = () => {
    setStatus("failed")
    setShowFailConfirm(true)
  }

  const startTimer = () => {
    clearTimer()
    intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
            if (prev <= 1) {
                clearTimer()
                setStatus("completed")
                return 0
            }
            return prev - 1
        })
    }, 1000)
  }

  const startStopwatch = () => {
    clearTimer()
    intervalRef.current = setInterval(() => setElapsedTime((prev) => prev + 1), 1000)
  }

  const handlePauseResume = () => {
    if (status === "running") {
        setStatus("paused")
        clearTimer()
    } else if (status === "paused") {
        setStatus("running")
        type === "timer" ? startTimer() : startStopwatch()
    }
  }

  const resetTaskState = (completed: boolean) => {
    clearTimer()
    const timeSpent = type === 'timer' ? duration - timeLeft : elapsedTime;
    setStatus("idle")
    setTimeLeft(duration)
    setElapsedTime(0)
    setAppointmentTimeLeft(appointmentDuration)
    setShowFailConfirm(false)
    onEnd?.(completed, timeSpent)
  }

  const handleToggleComplete = () => {
    clearTimer()
    setStatus("completed")
  }
  
  const handleFailTask = () => {
    clearTimer()
    setStatus('failed');
    // We call onFail and it will handle resetting the state via the parent
    onFail?.();
  }


  const confirmAppointmentFail = () => {
    setShowFailConfirm(false)
    resetTaskState(false) // Appointment failure is not a success
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getProgress = () => {
    if (status === 'scheduled') return ((appointmentDuration - appointmentTimeLeft) / appointmentDuration) * 100
    if (type === "timer" && (status === 'running' || status === 'paused' || status === 'completed')) return ((duration - timeLeft) / duration) * 100
    return 0
  }

  useEffect(() => {
    // Automatically call onEnd when task completes
    if (status === 'completed') {
        const timeSpent = type === 'timer' ? duration : elapsedTime;
        onEnd?.(true, timeSpent);
    }
  }, [status]);


  useEffect(() => () => clearTimer(), [])

  const renderTimeDisplay = () => {
    if (status === 'scheduled') return { time: formatTime(appointmentTimeLeft), label: '预约剩余时间' }
    if (type === 'timer') return { time: formatTime(timeLeft), label: '任务剩余时间' }
    return { time: formatTime(elapsedTime), label: '已用时间' }
  }
  const { time, label } = renderTimeDisplay();

  return (
    <>
      <div className="w-full max-w-md mx-auto shadow-lg hover:shadow-xl transition-shadow duration-300 border rounded-lg bg-white">
        <div className="p-6 pb-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{name}</h2>
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${type === 'timer' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {type === "timer" ? (<><ClockIcon className="w-3 h-3 mr-1" /> 定时</>) : (status === "completed" ? (<><ToggleRightIcon className="w-3 h-3 mr-1" /> 开关</>) : (<><ToggleLeftIcon className="w-3 h-3 mr-1" /> 开关</>))}
                    </span>
                    <span className={`capitalize inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status === "completed" ? "bg-green-100 text-green-800" : status === "failed" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
                        {status}
                    </span>
                </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">{rules}</p>
        </div>

        <div className="p-6 pt-0 space-y-4">
            <div className="flex justify-center items-center relative">
                <SvgCircularProgress progress={getProgress()} isIndeterminate={type === 'toggle' && status === 'running'} />
                <div className="absolute flex flex-col items-center">
                    <div className={`w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500`}>
                        {animation}
                    </div>
                </div>
            </div>
            
            <div className="text-center">
                <div className="text-2xl font-mono font-bold text-gray-800">{time}</div>
                <div className="text-xs text-gray-500">{label}</div>
            </div>

            <div className="flex gap-2 justify-center">
                {status === "idle" && (
                    <>
                        <button onClick={handleSchedule} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                            <PlayIcon className="w-4 h-4 mr-2" /> 预约
                        </button>
                         <button onClick={handleStartImmediately} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            直接开始
                        </button>
                    </>
                )}
                {status === "scheduled" && <button disabled className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-400 cursor-not-allowed"><ClockIcon className="w-4 h-4 mr-2 animate-spin" /> 预约中...</button>}
                {(status === "running" || status === "paused") && (
                    <>
                        {allowPause && <button onClick={handlePauseResume} className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 inline-flex items-center">{status === "running" ? (<><PauseIcon className="w-4 h-4 mr-1" /> 暂停</>) : (<><PlayIcon className="w-4 h-4 mr-1" /> 继续</>)}</button>}
                        <button onClick={() => resetTaskState(false)} className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 inline-flex items-center"><SquareIcon className="w-4 h-4 mr-1" /> 停止</button>
                        {type === "toggle" && status === "running" && <button onClick={handleToggleComplete} className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 inline-flex items-center"><CheckCircleIcon className="w-4 h-4 mr-1" /> 完成</button>}
                        <button onClick={handleFailTask} className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 inline-flex items-center"><XCircleIcon className="w-4 h-4 mr-1" /> 失败</button>
                    </>
                )}
                {(status === "completed" || status === "failed") && <button onClick={() => resetTaskState(status === 'completed')} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">{status === 'completed' ? <CheckCircleIcon className="w-4 h-4 mr-2 text-green-500" /> : <XCircleIcon className="w-4 h-4 mr-2 text-red-500" />} {status === 'completed' ? '完成' : '已失败'}</button>}
            </div>
        </div>
      </div>
      {showFailConfirm && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="w-80 mx-4 bg-white rounded-lg shadow-xl border"><div className="p-6"><h2 className="flex items-center gap-2 text-red-600 font-semibold"><XCircleIcon className="w-5 h-5" /> 任务预约失败</h2></div><div className="p-6 pt-0 space-y-4"><p className="text-sm text-gray-500">很抱歉，任务 "{name}" 预约失败。</p><div className="flex gap-2"><button onClick={confirmAppointmentFail} className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">确认</button></div></div></div></div>}
    </>
  )
}

// --- Main App Component ---

export interface TaskData {
  name: string;
  type: "timer" | "toggle";
  rules: string;
  duration?: number;
  allowPause: boolean;
  animation: string;
  appointmentDuration: number;
  taskGroup: "后勤" | "建设" | "突击" | "基础";
  completionSignal: string;
  // New Achievement Fields
  achievedCount: number;
  totalTimeAchieved: number; // in seconds
}

const defaultTasks: TaskData[] = [
    {
        name: "学习React",
        type: "timer",
        rules: "专注学习25分钟，不能分心",
        duration: 25 * 60,
        allowPause: true,
        animation: "study",
        appointmentDuration: 5 * 60,
        taskGroup: "建设",
        completionSignal: "React学习完成！",
        achievedCount: 0,
        totalTimeAchieved: 0,
    },
    {
        name: "完成作业",
        type: "toggle",
        rules: "完成今天的所有作业任务",
        duration: 0,
        allowPause: false,
        animation: "writing",
        appointmentDuration: 2 * 60,
        taskGroup: "基础",
        completionSignal: "作业搞定！",
        achievedCount: 5, // Example starting value
        totalTimeAchieved: 0,
    },
    {
        name: "锻炼身体",
        type: "timer",
        rules: "进行30分钟有氧运动",
        duration: 30 * 60,
        allowPause: true,
        animation: "exercise",
        appointmentDuration: 10 * 60,
        taskGroup: "突击",
        completionSignal: "锻炼结束，活力满满！",
        achievedCount: 0,
        totalTimeAchieved: 7200, // Example starting value (2 hours)
    },
    {
        name: "整理房间",
        type: "toggle",
        rules: "把房间收拾干净整洁",
        duration: 0,
        allowPause: false,
        animation: "cleaning",
        appointmentDuration: 1 * 60,
        taskGroup: "后勤",
        completionSignal: "房间焕然一新！",
        achievedCount: 0,
        totalTimeAchieved: 0,
    },
]

export function App() {
    const [tasks, setTasks] = useState<TaskData[]>(defaultTasks)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [activeTaskIndex, setActiveTaskIndex] = useState<number | null>(null)

    const handleCreateTask = (newTask: TaskData) => {
        setTasks([...tasks, { ...newTask, achievedCount: 0, totalTimeAchieved: 0 }])
        setShowCreateForm(false)
    }

    const handleCancelCreate = () => {
        setShowCreateForm(false)
    }

    const handleTaskStart = (index: number) => {
        setActiveTaskIndex(index)
    }

    const handleTaskEnd = (completed: boolean, timeSpent: number) => {
        if (completed && activeTaskIndex !== null) {
            const newTasks = [...tasks];
            const task = newTasks[activeTaskIndex];
            if (task.type === 'toggle') {
                task.achievedCount += 1;
            } else {
                task.totalTimeAchieved += timeSpent;
            }
            setTasks(newTasks);
        }
        setActiveTaskIndex(null)
    }
    
    const handleTaskFail = () => {
        if (activeTaskIndex !== null) {
            const newTasks = [...tasks];
            const task = newTasks[activeTaskIndex];
            task.achievedCount = 0;
            task.totalTimeAchieved = 0;
            setTasks(newTasks);
        }
        setActiveTaskIndex(null);
    }


    const activeTask = activeTaskIndex !== null ? tasks[activeTaskIndex] : null

    const formatAchievement = (task: TaskData) => {
        if (task.type === 'timer') {
            if (task.totalTimeAchieved === 0) return null;
            const hours = (task.totalTimeAchieved / 3600).toFixed(1);
            return `已专注 ${hours} 小时`;
        } else {
            if (task.achievedCount === 0) return null;
            return `已完成 ${task.achievedCount} 次`;
        }
    }

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-8">
            {activeTask ? (
                // --- FOCUS VIEW ---
                <div className="flex justify-center items-start min-h-[80vh]">
                    <PomodoroTask
                        key={`${activeTask.name}-${activeTaskIndex}`}
                        {...activeTask}
                        onEnd={handleTaskEnd}
                        onFail={handleTaskFail}
                    />
                </div>
            ) : (
                // --- DASHBOARD VIEW ---
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-800">任务中心</h1>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            添加任务
                        </button>
                    </div>

                    {showCreateForm && (
                        <div className="mb-8">
                            <TaskCreateForm onSubmit={handleCreateTask} onCancel={handleCancelCreate} />
                        </div>
                    )}

                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-2">
                        {tasks.map((task, index) => (
                           <div key={`${task.name}-${index}`} className="relative">
                                <PomodoroTask
                                    {...task}
                                    onStart={() => handleTaskStart(index)}
                                />
                                {formatAchievement(task) && (
                                     <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                        <TrophyIcon className="w-3 h-3"/>
                                        {formatAchievement(task)}
                                    </div>
                                )}
                           </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
