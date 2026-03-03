# Release Notes - KityDD

## v1.1.1 (2026-03-03)

This patch release focuses on text alignment reliability, recent files tracking, and overall stability improvements.

###  Highlights

#### Node Text Alignment - Final Fix
- **Completely rewrote** the text alignment system for reliability and correctness.
- Text alignment now uses per-node 
oderender event hooks (synchronized with render pipeline) instead of global polling.
- Eliminates the "going nuts" behavior where text would misalign after initial render.
- Alignment state **always resets** on each render, preventing stale coordinate carry-over.
- Uses **measured text item boundaries** from getBoundaryBox() for accurate multi-line centering/right-alignment.
- Left / Center / Right controls now work reliably without regressions.

#### Recent Files Tracking & Quick Access
- **Automatically track** up to 10 recently opened mindmaps in persistent storage.
- New **File > Open Recent** submenu shows numbered list of recent files.
- **Clear Recent Files** option in the menu.
- Auto-filters deleted files from the recent list.
- **Windows taskbar integration**: Recent mindmaps appear in OS-level recent documents.
- Files open with full format detection (supports .km, .json, .xmind, .mmap, .mm, .md).

#### Offline-Ready
- JSZip is now bundled locally — XMind and MindManager import no longer requires internet.

#### Search + Edit Reliability
- Fixed a regression where navigating search results could leave nodes in a state where text editing stopped working.
- Search now works independently and no longer depends on replace-style behavior.
- Hardened search keyword handling by escaping regex characters in user input.

#### Robustness Hardening
- Added cleanup for directive/event listeners to prevent duplicate handlers and memory leak-style behavior over long sessions.
- Scoped search input handling per editor instance to avoid global selector conflicts.
- Hardened note preview HTML processing before trust.
- Fixed language initialization null-access edge case.

#### Spellcheck Suggestions (Desktop)
- Added context-menu spelling suggestions for misspelled words.
- Added "Add to Dictionary" action in editable contexts.
- Enabled spellcheck explicitly in the Electron browser window configuration.

#### Build & Release
- Version bumped to **1.1.1**.
- Added portable build script: 
pm run build:portable.
- Updated documentation to reflect removed Ctrl+Shift+C toggle (no longer needed with auto-alignment).

---

## v1.1.0

We are excited to announce the release of **KityDD v1.1.0**, a major update that brings long-awaited multi-session support and significant workflow improvements.

## Featured Highlights

###  Tabbed Interface
You can now work on multiple mindmaps simultaneously! Our new tab bar allows you to switch between files seamlessly without losing your progress. Each session is completely isolated, ensuring your data remains organized.

###  Faster Saving
We've introduced "Direct Save" logic. If you've opened a file, hitting Ctrl+S (or using the Save menu) will now overwrite the file instantly, eliminating unnecessary dialogs and speeding up your editing process.

###  Data Protection
Never lose your work again! KityDD now detects unsaved changes across all open tabs and will prompt you before closing the application or an individual tab.

###  Enhanced Importers
Import files in multiple formats with automatic detection and conversion for seamless workflows.

###  Smart Hyperlinks & Images
Hyperlinks and images now automatically detect and prepend missing protocols (e.g., http:// for URLs).

---

## v1.0.0

Initial release with core KityMinder functionality on Electron.
