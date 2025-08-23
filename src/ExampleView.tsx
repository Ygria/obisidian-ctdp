import { ItemView, WorkspaceLeaf } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { StrictMode } from "react";
import { App } from "@/App";
import MyPlugin from "./main";

export const VIEW_TYPE_EXAMPLE = "example-view";

export class ExampleView extends ItemView {
	root: Root;
	plugin: MyPlugin; // <-- 2. 添加一个属性来保存插件实例

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin
	}

	getViewType() {
		return VIEW_TYPE_EXAMPLE;
	}

	getDisplayText() {
		return "Example view";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		this.root = createRoot(container);
		this.root.render(
			<StrictMode>
				<div className="my-plugin-react-root" id="my-plugin-react-root">
					<App plugin={this.plugin} />
				</div>
			</StrictMode>
		);
	}

	async onClose() {
		// 确保 root 存在再调用 unmount
		if (this.root) {
			this.root.unmount();
		}
	}
}
