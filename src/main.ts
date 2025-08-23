import { ExampleView, VIEW_TYPE_EXAMPLE } from "@/ExampleView";
import {
	addIcon,
	App,
	parseYaml,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	TFolder,
	Vault,
	WorkspaceLeaf,
} from "obsidian";
import "./index.css";
import { TaskData } from "./types/task";
import { dump } from "js-yaml";

// Remember to rename these classes and interfaces!

// 自定义SVG (番茄 + 钟表)
const tomatoClockSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="currentColor">
  <!-- 番茄主体 -->
  <circle cx="32" cy="36" r="20" fill="#e74c3c" stroke="#c0392b" stroke-width="2"/>
  <!-- 番茄叶子 -->
  <path d="M32 16c-4 0-6-4-6-8 2 2 4 2 6 2s4 0 6-2c0 4-2 8-6 8z" fill="#27ae60" stroke="#1e8449" stroke-width="1.5"/>
  <!-- 钟表外圈 -->
  <circle cx="32" cy="36" r="12" fill="white" stroke="black" stroke-width="2"/>
  <!-- 时针 -->
  <line x1="32" y1="36" x2="32" y2="28" stroke="black" stroke-width="2" stroke-linecap="round"/>
  <!-- 分针 -->
  <line x1="32" y1="36" x2="38" y2="36" stroke="black" stroke-width="2" stroke-linecap="round"/>
</svg>
`;

interface MyPluginSettings {
	mySetting: string;
	folder: string;
	nextId: number; // 自增id
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
	folder: "CDTP-Pomodoro",
	nextId: 1, // 用于生成唯一的文件名
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	cache: Map<string, string>; // 文件名 -> 内容

	async onload() {
		await this.loadSettings();
		await this.ensureFolder(this.settings.folder);
		await this.scanFiles();
		// 注册自定义图标
		addIcon("tomato-clock", tomatoClockSvg);


		this.registerView(
			VIEW_TYPE_EXAMPLE,
			(leaf) => new ExampleView(leaf, this)
		);

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon("tomato-clock", "CDTP 番茄钟", () => {
			this.activateView();
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({ type: VIEW_TYPE_EXAMPLE, active: true });
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	onunload() { }

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	// ---------- 文件夹处理 ----------
	async ensureFolder(path: string) {
		const folder = this.app.vault.getAbstractFileByPath(path);
		if (!folder) {
			await this.app.vault.createFolder(path);
			console.log("已创建文件夹:", path);
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async scanFiles() {
		this.cache = new Map();
		const folder = this.app.vault.getAbstractFileByPath(
			this.settings.folder
		);
		if (folder instanceof TFolder) {
			for (const child of folder.children) {
				if (child instanceof TFile) {
					const content = await this.app.vault.read(child);
					this.cache.set(child.path, content);
				}
			}
		}
		console.log("已扫描文件夹，缓存数据:", this.cache);
	}

	// ---------- CRUD ----------
	/**
	 * 3. 重写 addEntry 方法，以适配 TaskData 和 frontmatter
	 * @param taskData 要添加的任务对象
	 */
	async addEntry(taskData: TaskData) {
		const id = this.settings.nextId++;
		await this.saveSettings();

		// 文件名使用 .md 后缀
		const fileName = `${this.settings.folder}/task-${id}.md`;

		// 使用 js-yaml 的 dump 方法将对象转换为 YAML 字符串
		const frontmatter = dump(taskData);

		// 拼接成完整的 frontmatter 格式
		const fileContent = `---\n${frontmatter}---\n`;

		try {
			const file = await this.app.vault.create(fileName, fileContent);
			this.cache.set(file.path, fileContent);
			console.log("新增任务文件:", file.path);
			return file;
		} catch (error) {
			console.error(`创建文件 ${fileName} 失败:`, error);
			// 回滚ID
			this.settings.nextId--;
			await this.saveSettings();
		}
	}

	/**
	 * 4. 新增 getTasks 方法，用于从缓存中解析并获取所有任务
	 * 这是给 React 视图使用的主要数据接口
	 * @returns TaskData[]
	 */
	getTasks(): TaskData[] {
		const tasks: TaskData[] = [];

		const folder = this.app.vault.getAbstractFileByPath(this.settings.folder);

		// 3. 检查它是否确实是一个文件夹 (TFolder)
		if (folder instanceof TFolder) {
			// 4. 使用 Vault.recurseChildren 来递归遍历这个文件夹
			Vault.recurseChildren(folder, (fileOrFolder) => {
				// 我们只关心文件 (TFile)，并且是 markdown 文件
				if (fileOrFolder instanceof TFile && fileOrFolder.extension === 'md') {
					// 这就是文件夹中的一个 Markdown 文件
					const file = fileOrFolder;

					// 在这里处理你的 metadataCache 逻辑
					const fileCache = this.app.metadataCache.getFileCache(file);
					if (fileCache?.frontmatter?.taskGroup) {
						tasks.push({ ...fileCache.frontmatter as TaskData,
							filePath: fileOrFolder.path
						});
					}
				}
			});
		} else {
			console.error(`未查询到缓存信息`);
		}


		return tasks;
	}

	async readEntry(path: string) {
		const file = this.app.vault.getAbstractFileByPath(path);
		if (file instanceof TFile) {
			return await this.app.vault.read(file);
		}
		return null;
	}

	// (可选) 更新和删除方法也需要相应调整
	async updateEntry(filePath: string, updatedTaskData: Partial<TaskData>) {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (!(file instanceof TFile)) return;

		// 读取现有 frontmatter 并合并更新
		const existingTask = this.getTasks().find(
			(t) => t.name === updatedTaskData.name
		); // 假设用name查找
		if (!existingTask) return;

		const mergedData = { ...existingTask, ...updatedTaskData };
		const newFrontmatter = dump(mergedData);
		const newFileContent = `---\n${newFrontmatter}---\n`;

		await this.app.vault.modify(file, newFileContent);
		this.cache.set(filePath, newFileContent);
		console.log("更新任务文件:", filePath);
	}

	async deleteEntry(filePath: string) {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (file instanceof TFile) {
			await this.app.vault.delete(file);
			this.cache.delete(filePath);
			console.log("删除文件:", filePath);
		}
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
