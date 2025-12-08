# Markmap for Obsidian

Visualize your Markdown notes as interactive mindmaps directly in Obsidian.

## Features

- 🧠 **Interactive Mindmaps**: Convert your Markdown notes into beautiful, interactive mindmaps
- 🔄 **Real-time Updates**: Mindmap updates automatically as you edit your notes
- 🎨 **Theme Support**: Seamlessly integrates with Obsidian's light and dark themes
- 🛠️ **Toolbar Controls**: Zoom, fit, and expand/collapse nodes with built-in toolbar
- 📱 **Cross-platform**: Works on desktop and mobile (if supported by Obsidian)

## Installation

### From Obsidian Community Plugins (Recommended)

1. Open Obsidian Settings
2. Navigate to Community Plugins
3. Click "Browse" and search for "Markmap"
4. Click "Install"
5. Enable the plugin

### Manual Installation

1. Download the latest release from GitHub
2. Extract the files to your vault's `.obsidian/plugins/markmap-obsidian/` directory
3. Reload Obsidian
4. Enable the plugin in Settings → Community Plugins

## Usage

### Opening the Markmap View

There are several ways to open the Markmap view:

1. **Command Palette**: Press `Ctrl/Cmd + P` and search for "Open Markmap view"
2. **Ribbon Icon**: Click the brain icon (🧠) in the left sidebar
3. **Command**: Use the "Preview current file as Markmap" command when viewing a markdown file

### How it Works

The plugin automatically converts your Markdown headings into a mindmap structure:

```markdown
# Main Topic

## Subtopic 1
- Point A
- Point B

## Subtopic 2
- Point C
  - Detail 1
  - Detail 2

## Subtopic 3
```

This will be rendered as an interactive mindmap with collapsible nodes.

### Supported Markdown Features

- **Headings**: `#`, `##`, `###`, etc.
- **Lists**: Bullet points and numbered lists
- **Links**: Both internal `[[wikilinks]]` and external `[links](url)`
- **Formatting**: **bold**, *italic*, `code`, etc.
- **Code blocks**: Syntax-highlighted code blocks
- **Math**: KaTeX math expressions (if enabled)

### Toolbar Controls

The mindmap includes a toolbar with the following controls:

- **Zoom In/Out**: Adjust the zoom level
- **Fit**: Automatically fit the entire mindmap in view
- **Expand/Collapse**: Toggle all nodes
- **Download**: Export the mindmap as SVG or PNG

## Development

### Building the Plugin

```bash
# Install dependencies
npm install

# Development mode (auto-rebuild on changes)
npm run dev

# Production build
npm run build
```

### Project Structure

```
markmap-obsidian/
├── main.ts          # Plugin entry point
├── view.ts          # Markmap view component
├── manifest.json    # Plugin metadata
├── styles.css       # Plugin styles
├── esbuild.config.mjs  # Build configuration
└── README.md        # This file
```

## Related Projects

- [markmap](https://github.com/markmap/markmap) - The core markmap library
- [markmap-vscode](https://marketplace.visualstudio.com/items?itemName=gera2ld.markmap-vscode) - VSCode extension

## Credits

This plugin is based on [markmap](https://markmap.js.org/) by [gera2ld](https://github.com/gera2ld).

## License

MIT License - See LICENSE file for details

## Support

If you encounter any issues or have suggestions:

- 🐛 [Report a bug](https://github.com/markmap/markmap/issues)
- 💡 [Request a feature](https://github.com/markmap/markmap/issues)
- 💬 [Join the discussion](https://gitter.im/gera2ld/markmap)

## Changelog

### 0.1.0 (Initial Release)

- Basic mindmap visualization
- Real-time updates
- Theme support
- Toolbar controls
- Support for common Markdown features
