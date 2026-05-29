# Release Notes - KityDD

## v3.0.1 (2026-05-29)

This release introduces major enhancements to relation lines and branch connections, adding support for freestyle draggable Bezier curves, custom style/color menus, per-branch custom connection styles with real-time layout reflows, two new vertical tree templates, and a horizontal orthogonal logical chart icon in the template picker.

### Highlights

#### 1. Draggable Freestyle Bezier Relation Curves & Movable Labels
- Replaced standard straight relation lines with smooth quadratic Bezier curves.
- Fully interactive circular control point handles and explanation labels that can be dragged organically.
- Integrated automatic viewport zoom calibration so dragging vectors is pixel-perfect at all zoom levels.
- Added exact tangent angle rotation math for arrowheads so they always point flush along the curve's endpoint bend.

#### 2. Relation Styles & Colors Customization Dialog
- Extended the custom prompt modal (`Ctrl+L` or sidebar action) when creating or editing links.
- Let users select custom line styles (**Dashed**, **Solid**, or **Dotted**) and custom colors (**Red**, **Blue**, **Green**, **Purple**, **Orange**, or **Gray**).
- Support for editing or deleting existing relation connections in a single click with pre-populated form values.

#### 3. Customizable Branch Connection Styles
- Added a Connection Line Style selector to the sidebar actions panel.
- Allows users to customize the link rendering style of any branch individually (**Smooth Curve (Bezier)**, **Right-Angle (Orthogonal)**, **Curved Arc**, **Straight Line**, or **No Connection Line**).
- Configured connection style updates to trigger instant animated mindmap reflows (`minder.layout(200)`), fully respecting compact themes without overlaps.

#### 4. New Templates & Horizontal Logical Picker Icon
- Registered `top-tree` (Upward Tree) and `bottom-tree` (Downward Tree) layouts with full multi-lingual translations.
- Swapped the vertical file-tree icon of the Logical Chart template with a correct horizontal orthogonal diagram SVG swatch.

---

## v3.0.0 (2026-05-28)

This major release introduces extensive new mindmap creation capabilities (isolated nodes, branch layout inheritance, customizable brackets, dashed relation lines), direct compatibility with DrawDD formats (.drawdd), and native support for .km as the default saving format.

### Highlights

#### 1. Default Natively Saved `.km` File Format
- Standardized file operations to prioritize `.km` (KityMinder JSON structure) as the default save extension.
- Full bidirectional handling of `.km` and `.json` files in the multi-session tab bar, Open Recent menu, and direct saving pipelines.

#### 2. Import & Export to DrawDD Format
- **Direct Export**: Transforms hierarchical tree structures into flat AntV X6 graph files (`.drawdd`). Uses a vertical centering layout algorithm to automatically align parent nodes beautifully between their child branches, preventing overlaps.
- **Direct Import**: Traces parent-child associations back from flat graph cells, automatically resolves the root node based on parent-child frequencies and in-degrees, and re-imports them flawlessly into KityMinder's tree structure.
- **On-the-fly Format Detection**: Automatically checks standard `.json` and `.km` file loads for a `cells` list, transparently converting DrawDD diagrams.

#### 3. Advanced Mindmap Structures (XMind-inspired)
- **Isolated Nodes**: Add completely detached, free-floating topics to your mindmap (`Ctrl+I`). Connector lines are hidden (`connect: "none"`), allowing them to be dragged anywhere on the canvas. Stagger positions are automatically computed to prevent overlap.
- **Flicker-Free Connection Lines**: Instantly intercepts core KityMinder templates to return `'none'` connection lines for isolated nodes, eliminating any visual rendering line flashing on all cycles.
- **Detach and Reattach Actions**: Interactive sidebar action buttons to detach any branch node into a free-floating isolated topic, or reattach an isolated node back into a normal layout-managed topic.
- **Node Layout Directions**: XMind-style branch layout inheritance. Lets the user configure the layout direction (`right`, `left`, `bottom`, `top`, or `inherit`) of any individual node via a new sidebar dropdown, dynamically reflowing all descendants.
- **Customizable Group Bracket Positions**: Let users choose `right`, `left`, `top`, or `bottom` custom curly brackets when creating sibling summaries, and edit or delete them dynamically via the enhanced prompt modal.
- **Dashed Relation Lines**: Connect any arbitrary nodes with a beautiful custom red dashed line with an arrowhead (`Ctrl+L`). Includes a centered text box for labeling relationships, automatically redrawn in real-time as nodes are moved, zoomed, or panned.
- **Sibling Enclosing Brackets**: Group sibling nodes together (`Ctrl+B`) under a premium light violet shaded bounding box (`rgba(167, 139, 250, 0.08)`) with a custom smooth curved bracket line (`}`) and a violet bold explanation tag.
- **Native Insert Menu**: Integrated keyboard shortcuts and menu items directly into the Electron window menu bar under a new "Insert" column.

#### 4. Bounded Modern UI & Floating Canvas Controls
- **Floating Glassmorphic Canvas Controls**: Added a bottom-right floating controls bar featuring Zoom In, Zoom Out, Zoom-to-Fit, Zoom 100%, Zen Focus toggle, and outline copying, complete with light/dark adaptive theme styling.
- **Dynamic Sliding Zoom Bar**: The controls bar automatically shifts left by exactly `244px` when the Action Menu sidebar is open, preventing overlapping of buttons.
- **Zen Focus Mode**: Focus mode hides the session bar, sidebars, and menus with smooth slide transitions, optimizing layout focus.
- **Indented Text Outline Exporter**: Compiles tree hierarchies into Markdown-style indented text outline lists copied directly to the clipboard with sleek toasts.
- **Stable Bootstrapping Poller**: Fallback polling to guarantee 100% startup stability under low system resources.
- **Taskbar-Aware Sidebar**: Sidebar bounding constrained with `top: 60px; bottom: 24px;` and inner scrollable `overflow-y` to prevent permanent Windows taskbar overlaps.

---

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
