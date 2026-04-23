# Release Notes - KityDD

## v2.0.0 (2026-04-22)

This major release expands KityDD's visual capabilities with two new diagram templates, fourteen new colour themes, a 2× HiDPI PNG export, a completely redesigned stunning About dialog, and two critical regression fixes.

### Highlights

#### New Templates
- **Left Tree** (`left`): A mirror of the default mind-map layout — all branches expand leftward using arc/bezier connectors. Ideal for right-to-left reading flows.
- **Logical Chart** (`logical`): A horizontal logical diagram that uses a right-only layout with poly connectors. Clean and structured for process flows and hierarchies.

Both templates appear in the template picker with custom SVG icons.

#### New Colour Themes (14 total)
- **Dark** / **Dark Compact**: Deep dark-mode palette inspired by Catppuccin Mocha, with muted indigo backgrounds, lavender text, and rose highlights.
- **Ocean** / **Ocean Compact**: Deep-sea blue colour scheme with cyan accents.
- **Monochrome**: Crisp black-and-white palette ideal for printing and minimal presentations.
- **Forest**: Rich forest-green palette with amber selection highlights — warm and natural.
- **Sunrise**: Warm amber/orange palette inspired by morning light — energetic and vivid.
- **Rose**: Modern deep rose/pink palette with cool-blue selection contrast — elegant and bold.
- **Solarized**: Classic Solarized Light colour scheme — warm cream background with teal/gold accents.

All themes appear in the theme dropdown alongside the existing 20 built-in themes.

#### High-Resolution PNG Export
PNG export now renders the mind map canvas at **2× device resolution**. The output image is twice as wide and tall in pixels, producing crisp, print-ready PNGs on HiDPI screens.

#### Stunning About Dialog
The About box has been completely redesigned as a rich in-app Bootstrap modal with:
- Gradient header with app branding and version badge
- Feature highlights grid
- Keyboard shortcuts quick-reference table
- License information and GitHub link

#### Regression Fixes
- **`style.css` now loaded**: The `<link>` to `style.css` was missing from `index.html`, meaning template icon swatches for `left` and `logical` were invisible. Fixed.
- **PNG fix now active**: `index.html` was loading `kityminder.core.min.js` (unpatched) instead of `kityminder.core.js` (patched with 2× scale). Switched to load the patched unminified version.

#### Internationalisation
Display names for all new templates and themes are provided in all seven supported languages: English, Simplified Chinese, Traditional Chinese, Japanese, German, Spanish, and French.

### Implementation Notes
- Templates/themes registered via live mutation of `getTemplateList()` / `getThemeList()` before Angular bootstrap.
- `$scope.themeKeyList` in `kityminder.editor.js` extended with 14 new keys (34 total).
- About IPC: `main.js` sends `show-about` to renderer; `diy.js` receives it and opens the Bootstrap modal `#kityddAboutModal`.

### Validation
- Added a checked-in `npm run validate:release` command so future release audits run against the same documented source, docs, and EXE checks in one step.
- Verified touched source files are free of editor diagnostics.
- Produced a Windows portable build with `npm run build:portable`.

## v1.1.2 (2026-04-21)

This patch release hardens in-place node editing and tab switching so text edits stay interactive and are preserved across sessions.

### Highlights

#### Reliable Text Editing Entry
- Re-enabled the hidden text receiver before entering input mode from hotbox edit, toolbar edit, and append-and-edit paths.
- Fixes the intermittent state where node text appeared selected but ignored keyboard input.

#### Safer Session Switching
- Commits an active node edit before exporting the current tab during a session switch.
- Prevents in-progress receiver text from being dropped when moving between tabs.

#### Editing Overlay Visibility
- Raises the editor stacking context while the inline receiver is active.
- Keeps the editing surface above the custom tab bar and sidebar when editing nodes near the app chrome.

#### Validation
- Verified the touched source files are free of editor diagnostics.
- Produced a Windows portable build with `npm run build:portable`.

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
npm run build:portable.
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
