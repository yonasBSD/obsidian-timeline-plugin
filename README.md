# Sequential Timeline for Obsidian

Render beautiful sequential timelines with vertical connectors using simple Markdown syntax.

## Syntax
````markdown
```timeline
1. **Locate Anchor Node** *Hover interaction*
Hovering over any historical user prompt reveals the structural control menu.

2. **Execute Fork or Edit** *Action selection*
The user selects "Fork Path" to clone the context.

3. **Deploy Changes** *Production*
Run the final deployment script.
```
````

## Features
- ✅ Vertical connector lines with dashed styling
- ✅ Numeric badges that respect your indices (1, 5, 10, etc.)
- ✅ Auto-conversion of `*` or `-` to sequential numbers
- ✅ XSS-safe sanitization
- ✅ Dark/light theme support

## Installation

### From Obsidian Community Plugins (coming soon)
1. Open Settings → Community plugins
2. Turn off Safe Mode
3. Browse and search for "Markdown Timeline"
4. Install and enable

### Manual Installation
1. Create folder `{your_vault}/.obsidian/plugins/obsidian-timeline-plugin/`
2. Copy `main.js`, `styles.css`, and `manifest.json` to that folder
3. Restart Obsidian
4. Enable the plugin in Community plugins settings

## Development
```bash
git clone https://github.com/Your Name/obsidian-timeline-plugin
cd obsidian-timeline-plugin
npm install
npm run dev
```

## Example Timeline

````markdown
```timeline
1. **First Step** *Getting started*
This is the first timeline step with a description.

3. **Jump to three** *Skip ahead*
The badge shows "3" not "2"

* **Auto-converted** *From asterisk*
This becomes step 3 (or next sequential)
```
````

## License
MIT
