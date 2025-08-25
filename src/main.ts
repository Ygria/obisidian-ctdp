import { PomodoroView, VIEW_TYPE_EXAMPLE } from "@/PomodoroView";
import {
	addIcon,
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	TFolder,
	Vault,
	WorkspaceLeaf,
} from "obsidian";
import "./index.css";
import { TaskData, TaskRecord } from "./types/task"; // 假设 TaskRecord 也在这个文件
import { dump, load } from "js-yaml";

// 自定义SVG (番茄 + 钟表) - (无变化)
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

// --- 1. 全局用户配置的接口 ---
interface GlobalUserSettings {
	userName: string;
	showCompletionAnimation: boolean;
	defaultTaskDuration: number; // 默认任务时长（分钟）
}

const DEFAULT_GLOBAL_SETTINGS: GlobalUserSettings = {
	userName: "User",
	showCompletionAnimation: true,
	defaultTaskDuration: 25,
};


// --- 插件内部设置 ---
interface MyPluginSettings {
	taskFolder: string;
	recordFolder: string;
	nextTaskId: number;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	taskFolder: "CDTP-Pomodoro/tasks",
	recordFolder: "CDTP-Pomodoro/records",
	nextTaskId: 1,
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	globalSettings: GlobalUserSettings;
	cache: Map<string, string>;

	async onload() {
		await this.loadSettings();
		await this.loadGlobalConfig();

		console.log("This Plugin Settings", this.settings)

	

		await this.ensureFolder(this.settings.taskFolder);
		await this.ensureFolder(this.settings.recordFolder);

		await this.scanFiles();
		addIcon("tomato-clock", tomatoClockSvg);

		this.registerView(
			VIEW_TYPE_EXAMPLE,
			(leaf) => new PomodoroView(leaf, this)
		);

		const ribbonIconEl = this.addRibbonIcon("tomato-clock", "CDTP 番茄钟", () => {
			this.activateView();
		});
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	// --- 2. 全局配置文件的读写方法 ---
	get configPath(): string {
		return `${this.manifest.dir}/config.json`;
	}

	async loadGlobalConfig() {
		const path = this.configPath;
		if (await this.app.vault.adapter.exists(path)) {
			const json = await this.app.vault.adapter.read(path);
			this.globalSettings = Object.assign({}, DEFAULT_GLOBAL_SETTINGS, JSON.parse(json));
		} else {
			this.globalSettings = DEFAULT_GLOBAL_SETTINGS;
			await this.saveGlobalConfig();
		}
		console.log("全局配置已加载:", this.globalSettings);
	}

	async saveGlobalConfig() {
		await this.app.vault.adapter.write(this.configPath, JSON.stringify(this.globalSettings, null, 2));
	}

	/**
	 * 激活插件的主视图
	 */
	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);

		if (leaves.length > 0) {
			// 如果视图已存在，则直接激活它
			leaf = leaves[0];
		} else {
			// 否则，在右侧边栏创建一个新的视图
			leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({ type: VIEW_TYPE_EXAMPLE, active: true });
		}

		// 确保视图是可见的
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	/**
	 * 插件卸载时调用的生命周期函数
	 */
	onunload() {
		// 卸载视图，清理工作区
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_EXAMPLE);
		console.log("CDTP Pomodoro plugin unloaded.");
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * 确保指定的文件夹存在，如果不存在则创建
	 * @param path 文件夹路径
	 */
	async ensureFolder(path: string) {
		const folder = this.app.vault.getAbstractFileByPath(path);
		if (!folder) {
			await this.app.vault.createFolder(path);
			console.log("已创建文件夹:", path);
		}
	}

	/**
	 * 扫描任务文件夹中的所有文件，并将其内容加载到内存缓存中
	 */
	async scanFiles() {
		this.cache = new Map();
		const folder = this.app.vault.getAbstractFileByPath(
			this.settings.taskFolder
		);
		if (folder instanceof TFolder) {
			for (const child of folder.children) {
				if (child instanceof TFile && child.extension === 'md') {
					const content = await this.app.vault.read(child);
					this.cache.set(child.path, content);
				}
			}
		}
		console.log("已扫描任务文件夹，缓存数据:", this.cache);
	}

	// ---------- 任务(Task)的 CRUD ----------
	async addTask(taskData: Omit<TaskData, 'id' | 'filePath'>): Promise<TFile | undefined> {
		const id = this.settings.nextTaskId++;
		await this.saveSettings();

		const fileName = `${this.settings.taskFolder}/task-${id}.md`;

		const fullTaskData: TaskData = { ...taskData, id: `task-${id}`, filePath: fileName };
		const frontmatter = dump(fullTaskData);
		const fileContent = `---\n${frontmatter}---\n`;

		try {
			const file = await this.app.vault.create(fileName, fileContent);
			this.cache.set(file.path, fileContent);
			console.log("新增任务文件:", file.path);
			return file;
		} catch (error) {
			console.error(`创建文件 ${fileName} 失败:`, error);
			this.settings.nextTaskId--;
			await this.saveSettings();
		}
	}

	getTasks(): TaskData[] {
		const tasks: TaskData[] = [];
		const folder = this.app.vault.getAbstractFileByPath(this.settings.taskFolder);

		if (folder instanceof TFolder) {
			Vault.recurseChildren(folder, (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					const fileCache = this.app.metadataCache.getFileCache(file);
					console.log("filepath", fileCache)
					if (fileCache?.frontmatter?.id && fileCache?.frontmatter?.id.startsWith('task-')) {
						tasks.push({
							...fileCache.frontmatter as TaskData,
							filePath: file.path
						});
					}
				}
			});
		}
		return tasks;
	}

	getRecords(): TaskRecord[] {
		const records: TaskRecord[] = []
		const folder = this.app.vault.getAbstractFileByPath(this.settings.taskFolder);


		return records
	}




	// --- 3. 任务记录(TaskRecord)的写入方法 ---
	async addRecord(recordData: TaskRecord): Promise<TFile | undefined> {
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const fileName = `${this.settings.recordFolder}/record-${recordData.taskId}-${timestamp}.md`;

		const frontmatter = dump(recordData);
		const fileContent = `---\n${frontmatter}---\n`;

		try {
			const file = await this.app.vault.create(fileName, fileContent);
			console.log("新增任务记录文件:", file.path);
			return file;
		} catch (error) {
			console.error(`创建记录文件 ${fileName} 失败:`, error);
		}
	}

	/**
	 * 更新指定路径的任务文件
	 * @param filePath 文件的绝对路径
	 * @param updatedTaskData 需要更新的任务数据 (部分或全部)
	 */
	async updateTask(filePath: string, updatedTaskData: Partial<TaskData>) {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (!(file instanceof TFile)) {
			console.error("更新失败：文件未找到", filePath);
			return;
		}

		const fileCache = this.app.metadataCache.getFileCache(file);
		const existingTask = fileCache?.frontmatter as TaskData | undefined;
		if (!existingTask) {
			console.error("更新失败：无法读取文件的 frontmatter", filePath);
			return;
		}

		// 合并新旧数据
		const mergedData = { ...existingTask, ...updatedTaskData };
		// js-yaml 的 dump 会处理好对象的序列化
		const newFrontmatter = dump(mergedData);
		const newFileContent = `---\n${newFrontmatter}---\n`;

		await this.app.vault.modify(file, newFileContent);
		this.cache.set(filePath, newFileContent);
		console.log("更新任务文件:", filePath);
	}

	/**
	 * 删除指定路径的任务文件
	 * @param filePath 文件的绝对路径
	 */
	async deleteTask(filePath: string) {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (file instanceof TFile) {
			await this.app.vault.delete(file);
			this.cache.delete(filePath);
			console.log("删除文件:", filePath);
		} else {
			console.error("删除失败：文件未找到", filePath);
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
		containerEl.createEl("h2", { text: "CDTP 番茄钟设置" });

		// --- 4. 设置面板以支持全局配置 ---
		new Setting(containerEl)
			.setName("用户名")
			.setDesc("你的名字将用于激励信息。")
			.addText((text) =>
				text
					.setPlaceholder("输入你的名字")
					.setValue(this.plugin.globalSettings.userName)
					.onChange(async (value) => {
						this.plugin.globalSettings.userName = value;
						await this.plugin.saveGlobalConfig();
					})
			);

		new Setting(containerEl)
			.setName("显示完成动画")
			.setDesc("任务成功完成后，是否显示庆祝动画。")
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.globalSettings.showCompletionAnimation)
					.onChange(async (value) => {
						this.plugin.globalSettings.showCompletionAnimation = value;
						await this.plugin.saveGlobalConfig();
					})
			);

		new Setting(containerEl)
			.setName("默认任务时长 (分钟)")
			.addSlider(slider =>
				slider
					.setLimits(5, 60, 5) // 最小5分钟，最大60分钟，步长5
					.setValue(this.plugin.globalSettings.defaultTaskDuration)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.globalSettings.defaultTaskDuration = value;
						await this.plugin.saveGlobalConfig();
					})
			);
	}
}
