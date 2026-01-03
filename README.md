# Obsidian Mood MD

An Obsidian plugin that mimics the Apple Health/Fitness UI for tracking mental health and gratitude, with all data stored directly in your Markdown daily notes.

![Mood Tracker UI Placeholder](https://via.placeholder.com/800x450.png?text=Obsidian+Mood+MD+UI+Preview)

## Features

- **Apple-Inspired UI**: Clean, card-based interface with bold typography and interactive elements.
- **Mood Slider**: Log your daily mental state with a 1-10 range slider ("Very Unpleasant" to "Pleasant").
- **Emotions & Feelings**: Categorized selection chips (Positive, Negative, Neutral) to tag your state.
- **Gratitude Journal**: Dedicated space for daily reflections with randomized prompts.
- **In-Note Rendering**: Render the tracker directly inside any note using a code block.
- **Markdown-Native**: 
  - Data is stored in a human-readable `## Daily Log` section at the bottom of your notes.
  - Portable and accessible even without the plugin.

## Installation

1. Download the latest release (`main.js`, `manifest.json`, `styles.css`).
2. Create a folder named `obsidian-mood-md` in your vault's `.obsidian/plugins/` directory.
3. Move the downloaded files into that folder.
4. Reload Obsidian and enable the plugin in **Settings > Community Plugins**.

## Usage

### Inline Tracker
Add the following code block to any note (e.g., your Daily Note template):

````markdown
```mood-tracker
```
````

### Quick Initialization
Click the **Heart Icon** in the ribbon to automatically append a mood tracker to the end of the current note.

### Settings
Configure your own custom gratitude prompts in **Settings > Obsidian Mood MD**. The plugin will pick one at random as a placeholder.

## Development

### Prerequisites
- Node.js and npm installed.

### Setup
```bash
npm install
```

### Build
To build the plugin and watch for changes:
```bash
npm run dev
```

To create a production build:
```bash
npm run build
```

## Testing
To test the plugin in a local vault:
1. Initialize a test vault (or use the provided `sample_obsidian_vault`).
2. Create a symbolic link from the plugin directory to the vault's plugins folder:
   ```bash
   ln -s /path/to/ObsidianMoodMD /path/to/vault/.obsidian/plugins/obsidian-mood-md
   ```
3. Open the vault in Obsidian and enable the plugin.
4. Verify that the `## Daily Log` section updates correctly when interacting with the UI.

## License
MIT