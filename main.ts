import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, ItemView, TFile, MarkdownView, Editor, Notice, MarkdownRenderChild } from 'obsidian';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MoodTrackerView } from './MoodTrackerView';

// --- Settings ---
interface MoodTrackerSettings {
	gratitudePrompts: string;
}

const DEFAULT_SETTINGS: MoodTrackerSettings = {
	gratitudePrompts: "What are you grateful for today?\nWhat made you smile today?\nWhat is one small win you had today?"
}

class MoodTrackerSettingTab extends PluginSettingTab {
	plugin: ObsidianMoodPlugin;

	constructor(app: App, plugin: ObsidianMoodPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		containerEl.createEl('h2', {text: 'Mood Tracker Settings'});

		new Setting(containerEl)
			.setName('Gratitude Prompts')
			.setDesc('One prompt per line. A random one will be chosen as the placeholder text.')
			.addTextArea(text => text
				.setPlaceholder('Enter prompts...')
				.setValue(this.plugin.settings.gratitudePrompts)
				.onChange(async (value) => {
					this.plugin.settings.gratitudePrompts = value;
					await this.plugin.saveSettings();
				}));
	}
}

// --- Lifecycle Helper for React in Code Blocks ---
class ReactPortal extends MarkdownRenderChild {
    root: Root;
    constructor(el: HTMLElement, component: React.ReactElement) {
        super(el);
        this.root = createRoot(el);
        this.root.render(component);
    }
    onunload() {
        this.root.unmount();
    }
}

// --- View (Sidebar) ---
const VIEW_TYPE_MOOD_TRACKER = 'mood-tracker-view';

class MoodTrackerItemView extends ItemView {
	root: Root | null = null;
    plugin: ObsidianMoodPlugin;

	constructor(leaf: WorkspaceLeaf, plugin: ObsidianMoodPlugin) {
		super(leaf);
        this.plugin = plugin;
	}

	getViewType() {
		return VIEW_TYPE_MOOD_TRACKER;
	}

	getDisplayText() {
		return 'Mood Tracker';
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass('mood-tracker-plugin-view');

		this.root = createRoot(container);
		this.root.render(React.createElement(MoodTrackerView, { 
            app: this.app, 
            prompts: this.plugin.settings.gratitudePrompts.split('\n') 
        }));
	}

	async onClose() {
		this.root?.unmount();
	}
}

// --- Main Plugin ---
export default class ObsidianMoodPlugin extends Plugin {
	settings: MoodTrackerSettings;

	async onload() {
		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_MOOD_TRACKER,
			(leaf) => new MoodTrackerItemView(leaf, this)
		);

		this.addRibbonIcon('heart', 'Insert Mood Tracker', () => {
			this.insertTrackerIntoCurrentNote();
		});

		this.addCommand({
			id: 'insert-mood-tracker',
			name: 'Insert Mood Tracker into current note',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                editor.replaceSelection('```mood-tracker\n```\n');
            }
		});

		this.addCommand({
			id: 'open-mood-tracker-sidebar',
			name: 'Open Mood Tracker Sidebar',
			callback: () => {
				this.activateView();
			}
		});

		this.addSettingTab(new MoodTrackerSettingTab(this.app, this));

		this.registerMarkdownCodeBlockProcessor("mood-tracker", (source, el, ctx) => {
			el.addClass('mood-tracker-plugin-view');
			
			const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
			const tFile = file instanceof TFile ? file : undefined;
			
            const component = React.createElement(MoodTrackerView, { 
                app: this.app, 
                file: tFile,
                prompts: this.settings.gratitudePrompts.split('\n')
            });

            // Use Lifecycle Helper to ensure cleanup
            ctx.addChild(new ReactPortal(el, component));
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

    insertTrackerIntoCurrentNote() {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view) {
            const editor = view.editor;
            const content = editor.getValue();
            const trackerBlock = "```mood-tracker\n```";
            
            if (content.includes("```mood-tracker")) {
                new Notice("Mood Tracker already exists in this note.");
                return;
            }

            const lastLine = editor.lineCount();
            editor.replaceRange(`\n${trackerBlock}\n`, { line: lastLine, ch: 0 });
            new Notice("Mood Tracker added!");
        } else {
            new Notice("Open a Markdown note to add the Mood Tracker.");
        }
    }

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_MOOD_TRACKER);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			const rightLeaf = workspace.getRightLeaf(false);
			if (rightLeaf) {
				leaf = rightLeaf;
			} else {
				leaf = workspace.getLeaf(true); 
			}
			
			if (leaf) {
				await leaf.setViewState({ type: VIEW_TYPE_MOOD_TRACKER, active: true });
			}
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}
}
