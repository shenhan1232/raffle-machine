# 抽奖系统 (Lottery System)

Electron desktop lottery/raffle app — import name lists, randomly draw winners with animated character-by-character reveal.

## Features

- Import name lists from TXT, CSV, or Excel (.xlsx) files
- Smart column detection for CSV/Excel — auto-finds the name column even without headers
- Drag-and-drop or click-to-import file input
- Configurable draw count and repeat mode
- Character-by-character animated reveal with Tactical HUD visual theme
- Multi-list management — switch between multiple imported lists
- Persistent state via localStorage — survives app restart
- Portable Windows .exe packaging — no installation required

## Quick Start

```bash
# Install dependencies
npm install

# Run in development (Windows — use cmd.exe, not bash)
cmd.exe /c "start /d . node_modules\electron\dist\electron.exe ."
```

## Build

```bash
# Set mirrors if in China
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"

# Build portable .exe
npx electron-builder --win portable
```

Output: `build/抽奖系统 1.0.0.exe` (~72MB, self-contained)

## Project Structure

```
main.js              # Electron main process — window, IPC, file I/O
preload.js           # contextBridge — secure API exposure
renderer/
  index.html         # Entry point with CSP headers
  app.js             # Main controller — UI, state, events
  animation.js       # AnimationEngine — per-character reveal
  lottery.js         # Pure random draw function
  file-import.js     # Name parser with smart column detection
  audio.js           # MP3 playback + Web Audio API fallback
  style.css          # Tactical HUD theme and animation keyframes
assets/
  icon.png           # App icon
  click.mp3          # Reveal sound effect
```

## Usage

1. Launch the app
2. Import a name list — click the drop zone or drag a file onto it
3. Set the number of winners to draw
4. Optionally enable "allow repeat"
5. Click "开始抽取" to draw
6. Watch the animated reveal
7. View winner history in the left panel
8. Manage multiple lists from the right panel

## AI-Assisted Development

This project was developed using Claude Code (Anthropic) as part of a university software engineering course on AI-assisted software prototyping. See `CLAUDE.md` for project documentation.
