# Obsidian Mood MD

An Obsidian plugin that mimics the Apple Health/Fitness UI for tracking mental health, workouts, and gratitude, with all data stored directly in your Markdown daily notes.

![Mood Tracker UI Placeholder](https://via.placeholder.com/800x450.png?text=Obsidian+Mood+MD+UI+Preview)

## Features

- **Apple-Inspired UI**: Clean, card-based interface with bold typography and interactive elements.
- **Mood Tracking**: Log your daily mental state with an emoji-based selector.
- **Workout Logging**: Quick entry for activity type and duration.
- **Gratitude Journal**: Dedicated space for daily reflections.
- **Markdown-Native**: 
  - Mood and Workout data are stored in **YAML Frontmatter**.
  - Gratitude entries are stored in the body under a `## Gratitude` heading.
- **Daily Note Integration**: Automatically syncs with your daily notes based on the current date.

## Installation

1. Download the latest release (`main.js`, `manifest.json`, `styles.css`).
2. Create a folder named `obsidian-mood-md` in your vault's `.obsidian/plugins/` directory.
3. Move the downloaded files into that folder.
4. Reload Obsidian and enable the plugin in **Settings > Community Plugins**.

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

## License
MIT
