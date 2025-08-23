import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './../styles.css'; // 你的 TailwindCSS 入口
import type { TaskData } from './types/task';

const mockPlugin = {
  app : {
    vault: {
      on: (functionName: string) => {
        console.log("register function " , functionName)
      }
    }
  },

  registerEvent: () => {

  },

  getTasks: () => {
    const mockTasks: TaskData[] = []
    return mockTasks
  }
}

// 这个文件只在浏览器预览时使用
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App plugin={mockPlugin} />
  </React.StrictMode>,
);

