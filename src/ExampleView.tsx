import { ItemView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom/client";

export const VIEW_TYPE_EXAMPLE = "example-view";

export class ExampleView extends ItemView {
	private root: ReactDOM.Root | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_EXAMPLE;
	}

	getDisplayText(): string {
		return "Example React View";
	}

	async onOpen() {
		this.root = ReactDOM.createRoot(
			this.containerEl.children[1] as HTMLElement
		);
		this.root.render(
			<React.StrictMode>
				<ReactView />
			</React.StrictMode>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}

function ReactView() {
  const WORK_TIME = 25 * 60; // 25分钟，单位：秒
  const [timeLeft, setTimeLeft] = React.useState(WORK_TIME);
  const [isRunning, setIsRunning] = React.useState(false);

  // 定时器逻辑
  React.useEffect(() => {
    let timer: number | undefined;

    if (isRunning && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft]);

  // 格式化时间 mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h2>⏳ 番茄钟</h2>
      <p style={{ fontSize: "2rem", margin: "1rem 0" }}>{formatTime(timeLeft)}</p>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button onClick={() => setIsRunning(!isRunning)}>
          {isRunning ? "暂停" : "开始"}
        </button>
        <button
          onClick={() => {
            setIsRunning(false);
            setTimeLeft(WORK_TIME);
          }}
        >
          重置
        </button>
      </div>
    </div>
  );
}
