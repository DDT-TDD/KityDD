# Changelog

All notable changes to this project will be documented in this file.

## [1.1.2] - 2026-04-21

### Changed
- Updated application version metadata to **1.1.2** in `package.json` and `package-lock.json`.
- Expanded `.gitignore` to cover Electron Builder working metadata.

### Fixed
- Restored node text editing after hotbox and toolbar edit entry by re-enabling the receiver before each `fsm.jump(..., 'input-request')` path.
- Committed active text input before session export on tab switch to prevent losing in-progress edits.
- Kept the inline text editor above the custom tab bar and sidebar while input mode is active.

## [1.1.1] - 2026-03-03

### Added
- **Node Text Alignment Controls**: Added explicit Left / Center / Right alignment controls in the font toolbar.
- **Recent Files Tracking**: Track up to 10 recently opened mindmaps in `File > Open Recent` menu.
- **Clear Recent Files**: Option to clear the recent files list from the menu.
- **Recent Files Persistence**: Automatically stores recent files in user data directory; auto-filters deleted files.
- **Portable EXE Build Script**: Added `build:portable` script using `electron-builder` for Windows portable executable output.
- **Windows Taskbar Integration**: Recent mindmaps are added to Windows OS-level recent documents list.

### Changed
- Updated application version metadata to **1.1.1** in `package.json` and `package-lock.json`.
- Bundled JSZip locally — removed CDN dependency for XMind/MindManager import (now works offline).
- Fixed window icon reference (`ico.png` → `icon.png`).
- Updated HTML page title from "Kminder Editor" to "KityDD".
- Search input handling is now instance-scoped to avoid global `#search-input` collisions.
- **Improved Text Alignment**: Refactored alignment system to use per-node `noderender` event hook instead of global polling.
  - Eliminates stale `x` coordinate carry-over between renders.
  - Uses measured text item boundaries instead of predicted box widths.
  - Alignment now resets to native defaults on every render, ensuring smooth visual behavior.

### Fixed
- Fixed a regression where node text editing could stop working after search navigation due to additive selection behavior.
- Fixed text alignment that would go "nuts" after initial render due to concurrent global alignment traversal.
- Hardened search note highlighting by escaping regex special characters in user-entered keywords.
- Fixed `searchBtn` directive scope reference to use its bound `minder` instance.
- Added lifecycle cleanup for search and note preview listeners to avoid duplicated handlers and memory leaks.
- Hardened note preview HTML handling before trust to reduce unsafe markup risks.
- Fixed language initialization null access (`language.value` before null-check).
- Removed stale `Ctrl+Shift+C` text centering toggle from documentation.
 
## [1.1.0] - 2026-02-24

### Added
- **Multi-Session Tab Bar**: Support for multiple open mindmaps in a tabbed interface.
- **Session Presistence**: Switching tabs preserves mindmap state (scroll, selection, content).
- **Direct Save**: Overwrites existing files directly for faster workflow.
- **Close Confirmation**: Warning dialog when closing the app with unsaved changes.
- **XMind 2022 Support**: Improved import for newer XMind file versions.
- **MindManager Support**: Initial support for `.mmap` file imports.
- **FreeMind Support**: Improved support for `.mm` file imports.
- **Auto-Protocol Detection**: Hyperlinks and images now automatically prepend `http://` if missing.

### Fixed
- Fixed race conditions during fast file opening.
- Improved error handling for corrupted mindmap JSON.
- Fixed node text centering persistence across layout changes.
- Fixed strict URL validation in link/image dialogs (e.g., allowed domain-only input like `www.google.com`).
- Fixed widespread "Cancle" typo in multiple language packs and UI templates.
- Fixed `TypeError` when adding progress icons due to `kity.Pie` prototype conflict.
- Fixed ribbon UI closing unexpectedly when clicking on priority or progress icons.


## [1.0.0] - 2026-02-21

### Added
- Native Electron implementation of KityMinder.
- Support for importing `.xmind`, `.mmap`, `.km`, `.json`, and `.md` files.
- Support for exporting `.km`, `.json`, `.png`, and `.md` files.
- Local image insertion with automatic Base64 encoding.
- LaTeX equation rendering via high-resolution SVG.
- Foldable sidebar for advanced Insert and Export actions.
- Professional "About" dialog with shortcuts and licensing information.
- Smooth de-bounced node rendering for large maps.
- Comprehensive `.gitignore` for a clean repository state.
- Standalone Windows executable build system.

### Changed
- Replaced web `prompt()` calls with internal custom Bootstrap modals for Electron compatibility.
- Relocated advanced features from the native top menu to the sidebar for better UI flow.
- Updated KityMinder core with enhanced XMind protocol support.

### Fixed
- Fixed "Failed to fetch" errors when importing binary files.
- Fixed UI overlap between the web ribbon and custom headers.
- Fixed navigator window visibility issues.
- Fixed application icon packaging.
