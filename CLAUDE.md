# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Electron desktop lottery/raffle app ("抽奖系统") — imports name lists, randomly draws winners with a Tactical HUD-styled character-by-character reveal animation. Packaged as a standalone Windows .exe via electron-builder.

## Commands

```bash
# Development (must use cmd.exe, NOT bash/MSYS2 — Electron module resolution breaks under MSYS2)
cmd.exe /c "start /d d:\抽奖 node_modules\electron\dist\electron.exe ."

# Build portable .exe
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
npx electron-builder --win portable
# Output: build/抽奖系统 1.0.0.exe (~72MB, fully self-contained)
```

## Architecture

```
main.js          — Electron main process: window creation, IPC handlers (file dialog, Excel parsing)
preload.js       — contextBridge: exposes importNames, importNamesByPath, getFilePath to renderer
renderer/
  index.html     — entry point, CSP headers, loads app.js as ES module
  style.css      — all styles, CSS variables for Tactical HUD theme, animation keyframes
  app.js         — main controller: UI construction, event binding, state management, persistence
  animation.js   — AnimationEngine class: sequential per-character reveal (search → flash → reveal)
  lottery.js     — pure random draw function, no-repeat logic via pool splice
  file-import.js — name list parser with smart column detection (header matching + column scoring)
  audio.js       — MP3 playback via HTMLAudioElement, synthesized 800Hz fallback
```

**Data flow:** Main process handles file I/O and Excel parsing → IPC returns content to renderer → renderer parses names, manages state, runs animation engine → CSS keyframes drive visual effects.

**State model (app.js):**
```
state = {
  lists: { [filename]: { nameList: [], drawnList: [] } },  // multi-list support
  activeKey: string | null,                                 // currently selected list
  settings: { drawCount, allowRepeat },
  phase: 'idle' | 'animating'
}
```
Persisted to localStorage on every mutation, restored on startup. Old single-list format auto-migrated.

## Key Implementation Details

- **Animation engine** (`animation.js`): Reveals names character-by-character. Each char box shows a magnifier icon orbiting in a circle (CSS `searchOrbit` keyframe, 1.2s) for 300ms, then flashes white + scales to 110% + plays audio, then settles with amber glow and corner bracket decorations. Characters are sequential (300-500ms gap). Winners are sequential (~1s gap, slide-in transition).

- **Smart column detection** (`file-import.js`): For CSV/Excel imports, first scans header row for name-related keywords (姓名/名字/名称/name/etc). If no header, scores each column by Chinese character density, penalizes numbers/dates. Chooses highest-scoring column.

- **Excel support**: .xlsx files are parsed in main process via the `xlsx` library (read as binary, converted to CSV), then sent to renderer for name extraction.

- **Audio**: Uses `HTMLAudioElement` (`new Audio()`) to play `assets/click.mp3`. Falls back to Web Audio API synthesized 800Hz 0.1s sine wave if MP3 fails to load.

## Build Environment Gotchas

- **Electron module resolution**: Running `electron.exe` under MSYS2/bash causes `require('electron')` to resolve to the npm stub package instead of the built-in Electron API. Must run via `cmd.exe /c` or native Windows terminal.
- **electron-builder winCodeSign**: The winCodeSign 7z archive contains macOS symlinks that fail to extract on Windows without Developer Mode. Workaround: manually extract with `7za x -snl-` (skip symlinks) to the cache directory at `%LOCALAPPDATA%/electron-builder/Cache/winCodeSign/winCodeSign-2.6.0/`.
- **Mirrors required in China**: Both `ELECTRON_MIRROR` and `ELECTRON_BUILDER_BINARIES_MIRROR` must point to npmmirror.com mirrors for network access.
