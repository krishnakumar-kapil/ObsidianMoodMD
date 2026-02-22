import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, ItemView, TFile, Editor, Notice, MarkdownRenderChild, MarkdownView } from 'obsidian';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MoodTrackerView } from './MoodTrackerView';

import { SliderConfig, TextBlockConfig, MoodTrackerSettings, DataService, Emotion } from './DataService';
import { EMOTION_WHEEL } from './constants';

const DEFAULT_SETTINGS: MoodTrackerSettings = {
	sliders: [
		{ id: 'mood', name: 'Mood', minLabel: 'Very unpleasant', maxLabel: 'Pleasant', color: 'linear-gradient(to right, #ff4d4d 0%, #ffcc00 50%, #4cd964 100%)' }
	],
	textBlocks: [
		{ id: 'gratitude', name: 'Gratitude', prompts: "What are you grateful for today?\nWhat made you smile today?\nWhat is one small win you had today?"
		}
	],
	emotionViewMode: 'grid',
	emotionWheel: EMOTION_WHEEL
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

		new Setting(containerEl)
			.setName('Mood tracker')
			.setHeading();

		new Setting(containerEl)
			.setName('Emotion view mode')
			.setDesc('Compact uses an expansion toggle; Grid shows all emotions at once.')
			.addDropdown(dropdown => dropdown
				.addOption('compact', 'Compact')
				.addOption('grid', 'Grid')
				.setValue(this.plugin.settings.emotionViewMode)
				.onChange(async (value: 'compact' | 'grid') => {
					this.plugin.settings.emotionViewMode = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl('h3', { text: 'Emotion Wheel' });
		this.plugin.settings.emotionWheel.forEach((parent, pIndex) => {
			const s = new Setting(containerEl)
				.setName(`Category: ${parent.label}`)
				.addText(text => text
					.setValue(parent.label)
					.onChange(async (val) => {
						parent.label = val;
						await this.plugin.saveSettings();
					}))
				.addButton(btn => btn
					.setButtonText('Remove Category')
					.setWarning()
					.onClick(async () => {
						this.plugin.settings.emotionWheel.splice(pIndex, 1);
						await this.plugin.saveSettings();
						this.display();
					}));
			
			const subContainer = containerEl.createDiv({ cls: 'mood-tracker-settings-subs' });
			subContainer.style.paddingLeft = '20px';
			subContainer.style.marginBottom = '10px';

			parent.subEmotions?.forEach((sub, sIndex) => {
				const subSetting = new Setting(subContainer)
					.setName(`Emotion: ${sub.label}`)
					.addText(text => text
						.setValue(sub.label)
						.onChange(async (val) => {
							sub.label = val;
							await this.plugin.saveSettings();
						}))
					.addButton(btn => btn
						.setIcon('trash')
						.setWarning()
						.onClick(async () => {
							parent.subEmotions?.splice(sIndex, 1);
							await this.plugin.saveSettings();
							this.display();
						}));
			});

			new Setting(subContainer)
				.addButton(btn => btn
					.setButtonText(`Add Emotion to ${parent.label}`)
					.onClick(async () => {
						if (!parent.subEmotions) parent.subEmotions = [];
						parent.subEmotions.push({
							id: `emo-${Date.now()}`,
							label: 'New Emotion',
							type: parent.type
						});
						await this.plugin.saveSettings();
						this.display();
					}));
		});

		new Setting(containerEl)
			.addButton(btn => btn
				.setButtonText('Add Category')
				.setCta()
				.onClick(async () => {
					this.plugin.settings.emotionWheel.push({
						id: `cat-${Date.now()}`,
						label: 'New Category',
						type: 'neutral',
						subEmotions: []
					});
					await this.plugin.saveSettings();
					this.display();
				}));

		containerEl.createEl('h3', { text: 'Sliders' });
		this.plugin.settings.sliders.forEach((slider, index) => {
			const s = new Setting(containerEl)
				.setName(`Slider: ${slider.name}`)
				.addText(text => text
					.setPlaceholder('Slider name')
					.setValue(slider.name)
					.onChange(async (value) => {
						slider.name = value;
						await this.plugin.saveSettings();
					}))
				.addButton(button => button
					.setButtonText('Remove')
					.setWarning()
					.onClick(async () => {
						this.plugin.settings.sliders.splice(index, 1);
						await this.plugin.saveSettings();
						this.display();
					}));
		});

		new Setting(containerEl)
			.addButton(button => button
				.setButtonText('Add slider')
				.setCta()
				.onClick(async () => {
					this.plugin.settings.sliders.push({
						id: `slider-${Date.now()}`,
						name: 'New Metric',
						minLabel: 'Low',
						maxLabel: 'High',
						color: 'linear-gradient(to right, #ff4d4d 0%, #ffcc00 50%, #4cd964 100%)'
					});
					await this.plugin.saveSettings();
					this.display();
				}));

		containerEl.createEl('h3', { text: 'Text blocks' });
		this.plugin.settings.textBlocks.forEach((block, index) => {
			const s = new Setting(containerEl)
				.setName(`Block: ${block.name}`)
				.addText(text => text
					.setPlaceholder('Block name')
					.setValue(block.name)
					.onChange(async (value) => {
						block.name = value;
						await this.plugin.saveSettings();
					}))
				.addButton(button => button
					.setButtonText('Remove')
					.setWarning()
					.onClick(async () => {
						this.plugin.settings.textBlocks.splice(index, 1);
						await this.plugin.saveSettings();
						this.display();
					}));
			
			new Setting(containerEl)
				.setName('Prompts')
				.setDesc('One prompt per line.')
				.addTextArea(text => text
					.setPlaceholder('Enter prompts...')
					.setValue(block.prompts)
					.onChange(async (value) => {
						block.prompts = value;
						await this.plugin.saveSettings();
					}));
		});

		new Setting(containerEl)
			.addButton(button => button
				.setButtonText('Add text block')
				.setCta()
				.onClick(async () => {
					this.plugin.settings.textBlocks.push({
						id: `block-${Date.now()}`,
						name: 'New Block',
						prompts: 'Enter prompts here...'
					});
					await this.plugin.saveSettings();
					this.display();
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
		return 'Mood tracker';
	}

	onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass('mood-tracker-plugin-view');

		this.root = createRoot(container);
		this.root.render(React.createElement(MoodTrackerView, { 
            app: this.app, 
            settings: this.plugin.settings
        }));
        return Promise.resolve();
	}

	onClose() {
		this.root?.unmount();
        return Promise.resolve();
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

		this.addRibbonIcon('heart', 'Insert mood tracker', () => {
			this.insertTrackerIntoCurrentNote();
		});

		this.addCommand({
			id: 'insert-mood-tracker',
			name: 'Insert mood tracker into current note',
            editorCallback: (editor: Editor) => {
                editor.replaceSelection('```mood-tracker\n```\n');
            }
		});

		this.addCommand({
			id: 'open-mood-tracker-sidebar',
			name: 'Open mood tracker sidebar',
			callback: () => {
				void this.activateView();
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
                settings: this.settings
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
                new Notice("Mood tracker already exists in this note.");
                return;
            }

            const lastLine = editor.lineCount();
            editor.replaceRange(`\n${trackerBlock}\n`, { line: lastLine, ch: 0 });
            new Notice("Mood tracker added!");
        } else {
            new Notice("Open a Markdown note to add the mood tracker.");
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
			void workspace.revealLeaf(leaf);
		}
	}
}