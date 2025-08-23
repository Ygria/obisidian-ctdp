import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './../styles.css'; // 你的 TailwindCSS 入口
import type { TaskData } from './types/task';

const mockPlugin = {
  app: {
    vault: {
      on: (functionName: string) => {
        console.log("register function ", functionName)
      }
    }
  },

  registerEvent: () => {

  },

  getTasks: () => {
    const mockTasks: TaskData[] = [{
      name: "1",
      type: "toggle",
      rules: "12",
      duration: 60,
      allowPause: true,
      animation: "study",
      appointmentDuration: 900,
      taskGroup: "基础",
      completionSignal: "任务完成！",
      startSignal: "打一个响指",
      achievedCount: 0,
      totalTimeAchieved: 0,
    },
    {
      name: "222",
      type: "timer",
      rules: "2",
      duration: 1500,
      allowPause: true,
      animation: "study",
      appointmentDuration: 900,
      taskGroup: "后勤",
      completionSignal: "任务完成！",
      startSignal: "打一个响指",
      achievedCount: 0,
      totalTimeAchieved: 0,
    },
    {
      name: "333",
      type: "toggle",
      rules: "2222",
      duration: 60,
      allowPause: true,
      animation: "study",
      appointmentDuration: 900,
      taskGroup: "建设",
      completionSignal: "任务完成！",
      startSignal: "打一个响指",
      achievedCount: 0,
      totalTimeAchieved: 0,
    },
    {
      name: "开关任务测试",
      type: "toggle",
      rules: "开关测试！",
      duration: 1500,
      allowPause: true,
      animation: "study",
      appointmentDuration: 900,
      taskGroup: "基础",
      completionSignal: "任务完成！",
      startSignal: "打一个响指",
      achievedCount: 0,
      totalTimeAchieved: 0,
    },]
    return mockTasks
  }
}

// 这个文件只在浏览器预览时使用
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App plugin={mockPlugin} />
  </React.StrictMode>,
);

