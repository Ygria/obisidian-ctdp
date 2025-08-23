"use client"

import type React from "react"
import { useState } from "react"
import { X } from "lucide-react"
import type { TaskData } from "../types/task"
import { Animation } from "./animation"
import { ANIMATION_DATA } from "./animation"


const PlusIcon = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M5 12h14" />
        <path d="M12 5v14" />
    </svg>
)
// --- End Icon Replacements ---



interface TaskCreateFormProps {
    onSubmit: (task: TaskData) => void
    onCancel: () => void
}

const animationOptions = [
    { value: "study", label: "📚 学习" },
    { value: "writing", label: "✍️ 写作" },
    { value: "exercise", label: "🏃 运动" },
    { value: "cleaning", label: "🧹 清洁" },
    { value: "coding", label: "💻 编程" },
    { value: "reading", label: "📖 阅读" },
    { value: "cooking", label: "🍳 烹饪" },
    { value: "meditation", label: "🧘 冥想" },
]

// 新增：任务分组选项
const taskGroupOptions: TaskData["taskGroup"][] = ["基础", "后勤", "建设", "突击"]

export function TaskCreateForm({ onSubmit, onCancel }: TaskCreateFormProps) {
    // 更新：为新字段设置默认值
    const [formData, setFormData] = useState<TaskData>({
        name: "",
        type: "timer",
        rules: "",
        duration: 25 * 60, // 默认25分钟
        allowPause: true,
        animation: "building",
        // 新字段的默认值
        appointmentDuration: 15 * 60, // 默认15分钟
        taskGroup: "基础",
        completionSignal: "任务完成！",
        startSignal: "打一个响指",
        achievedCount: 0,
        totalTimeAchieved: 0,
        rulesHistory: []
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    // 更新：为新字段添加验证逻辑
    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.name.trim()) {
            newErrors.name = "任务名称不能为空"
        }

        if (!formData.rules.trim()) {
            newErrors.rules = "任务规则不能为空"
        }

        if (formData.type === "timer" && (!formData.duration || formData.duration <= 0)) {
            newErrors.duration = "定时任务需要设置有效时间"
        }

        // 新增验证
        if (!formData.appointmentDuration || formData.appointmentDuration <= 0) {
            newErrors.appointmentDuration = "预约时长必须大于0"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (validateForm()) {
            onSubmit(formData)
        }
    }

    const formatTimeMMSS = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
    }

    // 新增：用于显示 时:分:秒 的格式化函数
    const formatTimeHHMMSS = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }

    const inputClass = (fieldName: keyof typeof errors) =>
        `bg-input border-border ${errors[fieldName] ? "border-destructive" : ""}`

    return (
        <div className="max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <div className="pb-4 card-header p-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-card-foreground card-title">创建新任务</h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="h-8 w-8 p-0 hover:bg-secondary inline-flex items-center justify-center rounded-md text-sm font-medium"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="space-y-4 card-content p-6 pt-0">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 任务名称 */}
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-foreground">
                            任务名称
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="输入任务名称..."
                            className={`w-full rounded-md border p-2 ${inputClass("name")}`}
                        />
                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>

                    {/* 新增：任务分组 */}
                    <div className="space-y-2">
                        <label htmlFor="taskGroup" className="text-sm font-medium text-foreground">
                            任务分组
                        </label>
                        <select
                            id="taskGroup"
                            value={formData.taskGroup}
                            onChange={(e) =>
                                setFormData({ ...formData, taskGroup: e.target.value as TaskData["taskGroup"] })
                            }
                            className="w-full rounded-md border p-2 bg-input border-border"
                        >
                            {taskGroupOptions.map((group) => (
                                <option key={group} value={group}>
                                    {group}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 任务类型 */}
                    <div className="space-y-2">
                        <label htmlFor="type" className="text-sm font-medium text-foreground">
                            任务类型
                        </label>
                        <select
                            id="type"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as "timer" | "toggle" })}
                            className="w-full rounded-md border p-2 bg-input border-border"
                        >
                            <option value="timer">⏱️ 定时任务</option>
                            <option value="toggle">✅ 开关任务</option>
                        </select>
                    </div>

                    {/* 时间设置（仅定时任务） */}
                    {formData.type === "timer" && (
                        <div className="space-y-2">
                            <label htmlFor="duration" className="text-sm font-medium text-foreground">
                                任务时长
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    id="duration"
                                    type="number"
                                    min="1"
                                    max="120"
                                    value={Math.floor((formData.duration || 0) / 60)}
                                    onChange={(e) =>
                                        setFormData({ ...formData, duration: Number.parseInt(e.target.value) * 60 })
                                    }
                                    className={`rounded-md border p-2 w-20 ${inputClass("duration")}`}
                                />
                                <span className="text-sm text-muted-foreground">分钟</span>
                                <div className="text-sm text-muted-foreground ml-2">({formatTimeMMSS(formData.duration || 0)})</div>
                            </div>
                            {errors.duration && <p className="text-sm text-destructive">{errors.duration}</p>}
                        </div>
                    )}

                    {/* 新增：预约时长 */}
                    <div className="space-y-2">
                        <label htmlFor="appointmentDuration" className="text-sm font-medium text-foreground">
                            预约时长 (倒计时)
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                id="appointmentDuration"
                                type="number"
                                min="1"
                                value={Math.floor(formData.appointmentDuration / 60)}
                                onChange={(e) =>
                                    setFormData({ ...formData, appointmentDuration: Number.parseInt(e.target.value) * 60 })
                                }
                                className={`rounded-md border p-2 w-20 ${inputClass("appointmentDuration")}`}
                            />
                            <span className="text-sm text-muted-foreground">分钟</span>
                            <div className="text-sm text-muted-foreground ml-2">
                                ({formatTimeHHMMSS(formData.appointmentDuration)})
                            </div>
                        </div>
                        {errors.appointmentDuration && <p className="text-sm text-destructive">{errors.appointmentDuration}</p>}
                    </div>

                    {/* 任务规则 */}
                    <div className="space-y-2">
                        <label htmlFor="rules" className="text-sm font-medium text-foreground">
                            任务规则
                        </label>
                        <textarea
                            id="rules"
                            value={formData.rules}
                            onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                            placeholder="描述任务的具体要求和规则...您将在实践中持续完善这些规则"
                            className={`w-full rounded-md border p-2 min-h-[80px] resize-none ${inputClass("rules")}`}
                        />
                        {errors.rules && <p className="text-sm text-destructive">{errors.rules}</p>}
                    </div>


                    <div className="space-y-2">
                        <label htmlFor="startSignal" className="text-sm font-medium text-foreground">
                            行动开始信号
                        </label>
                        <input
                            id="startSignal"
                            type="text"
                            value={formData.startSignal}
                            onChange={(e) => setFormData({ ...formData, startSignal: e.target.value })}
                            placeholder="例如：打一个响指，或者坐到指定位置上"
                            className="w-full rounded-md border p-2 bg-input border-border"
                        />
                    </div>

                    {/* 动画类型 */}
                    <div className="space-y-2">
                        <label htmlFor="animation" className="text-sm font-medium text-foreground">
                            动画效果
                        </label>
                        <select
                            id="animation"
                            value={formData.animation}
                            onChange={(e) => setFormData({ ...formData, animation: e.target.value })}
                            className="w-full rounded-md border p-2 bg-input border-border"
                        >
                            {Object.values(ANIMATION_DATA).filter(item => item.name).map((option) => (
                                <option key={option.code} value={option.code}>
                                    {option.name}

                                </option>
                            ))}


                        </select>
                        <span className="text-sm font-medium text-foreground mt-2">动画预览</span>
                        <div className="w-[100px] h-[100px] mb-12">
                            <Animation name={formData.animation} />
                        </div>
                    </div>

                    {/* 是否允许暂停 */}
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="allowPause"
                            checked={formData.allowPause}
                            onChange={(e) => setFormData({ ...formData, allowPause: e.target.checked })}
                            className="border-border"
                        />
                        <label htmlFor="allowPause" className="text-sm font-medium text-foreground cursor-pointer">
                            允许暂停任务
                        </label>
                    </div>

                    {/* 按钮组 */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-medium inline-flex items-center justify-center rounded-md text-sm h-10 px-4 py-2"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            创建任务
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 inline-flex items-center justify-center rounded-md text-sm h-10 px-4 py-2"
                        >
                            取消
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}