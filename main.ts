import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, ItemView } from 'obsidian';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { MoodTrackerView } from './MoodTrackerView';

const VIEW_TYPE_MOOD_TRACKER = 'mood-tracker-view';

class MoodTrackerItemView extends ItemView {
	root: Root | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
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
		// Add a class for styling
		container.addClass('mood-tracker-plugin-view');

		this.root = createRoot(container);
		this.root.render(React.createElement(MoodTrackerView, { app: this.app }));
	}

	async onClose() {
		this.root?.unmount();
	}
}

export default class ObsidianMoodPlugin extends Plugin {
	async onload() {
		this.registerView(
			VIEW_TYPE_MOOD_TRACKER,
			(leaf) => new MoodTrackerItemView(leaf)
		);

		this.addRibbonIcon('heart', 'Open Mood Tracker', () => {
			this.activateView();
		});

		this.addCommand({
			id: 'open-mood-tracker',
			name: 'Open Mood Tracker',
			callback: () => {
				this.activateView();
			}
		});
	}

	onunload() {

	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_MOOD_TRACKER);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for default placement
			const rightLeaf = workspace.getRightLeaf(false);
			if (rightLeaf) {
				leaf = rightLeaf;
			} else {
				// Fallback if right leaf logic fails (rare)
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
