# KityDD

Professional Mindmap Tool - An Electron implementation of KityMinder with advanced features and cross-platform compatibility.

KityDD is a high-performance mind mapping tool built on the robust KityMinder engine, tailored for desktop use with Electron. It offers a seamless experience for creating, editing, and sharing professional mind maps with support for advanced elements like equations, images, and notes.

## Current Release

**v3.0.0** (2026-05-28)

- Adds **Default `.km` Saving**: Standardized native saving/loading to `.km` (KityMinder JSON).
- Adds **DrawDD Import and Export**: High-fidelity `.drawdd` file support with vertical centering layout to prevent overlaps.
- Adds **Isolated Nodes**: Free-floating detached nodes with hidden connection lines (`Ctrl+I`).
- Adds **Dashed Relation Lines**: Draw customized red dashed connection lines with labels and arrowheads (`Ctrl+L`).
- Adds **Sibling Enclosing Brackets**: Group siblings under violet shaded bounding boxes with a curly bracket and explanation (`Ctrl+B`).
- Adds **Insert Menu**: Native application menu column with shortcuts for these new elements.
- Adds **Floating Canvas Zoom Controls**: Bottom-right floating controls bar featuring Zoom In, Zoom Out, Zoom-to-Fit, Zoom 100%, Zen Focus toggle, and outline copying, complete with light/dark adaptive theme styling.
- Adds **Dynamic Sliding Zoom Bar**: The controls bar automatically shifts left by exactly `244px` when the Action Menu sidebar is open, preventing overlapping of buttons.
- Adds **Zen Focus Mode**: Focus mode hides the session bar, sidebars, and menus with smooth slide transitions, optimizing layout focus.
- Adds **Indented Text Outline Exporter**: Compiles tree hierarchies into Markdown-style indented text outline lists copied directly to the clipboard with sleek toasts.
- Adds **Stable Bootstrapping Poller**: Fallback polling to guarantee 100% startup stability under low system resources.
- Adds **Taskbar-Aware Sidebar**: Sidebar bounding constrained with `top: 60px; bottom: 24px;` and inner scrollable `overflow-y` to prevent permanent Windows taskbar overlaps.

## ✨ Features

- **Intuitive Interface**: A clean, foldable sidebar for advanced actions and a quick-access ribbon for core mind mapping functions.
- **Templates**: Multiple layout templates including Kityminder, Sky Chart, Organization Chart, Directory Chart, Logical Structure, Fishbone, **Left Tree**, and **Logical Chart**.
- **Themes**: 34 colour themes spanning classic, fresh-colour, sky-chart, dark, ocean, monochrome, forest, sunrise, rose, and solarized palettes.
- **Advanced Insertions**:
  - 📝 **Notes**: Add detailed rich-text notes to any node.
  - 🔗 **Hyperlinks**: Link nodes to external websites or documents.
  - 🖼️ **Local Images**: Embed local images directly into your mind maps using an integrated file picker.
  - ∑ **Equations**: Render professional LaTeX equations using high-quality SVG output.
- **Universal Import & Export**:
  - **Import**: Support for `.km`, `.json`, `.xmind`, `.mmap` (MindManager), and `.md` (Markdown).
  - **Export**: Export your maps as `.km`, `.json`, `.png` (2× HiDPI Image), or `.md` (Markdown).
- **Professional About Dialog**: Built-in attribution, licensing information, and keyboard shortcuts.
- **Multi-Session Tabs**: Work on multiple mindmaps simultaneously with a tabbed interface.
- **Search & Replace**: Quickly find and replace text across all nodes (Ctrl+F).
- **Recent Files**: Track up to 10 recently opened mindmaps in File > Open Recent.
- **Text Alignment**: Left / Center / Right alignment controls for multi-line nodes.
- **Spellcheck**: Spelling suggestions and "Add to Dictionary" via right-click context menu.
- **Desktop Ready**: Fully packaged as a standalone Windows executable for offline use.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/DDT-TDD/KityDD.git
   cd KityDD
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

### Building the Executable

To build the standalone Windows portable executable:
```bash
npm run build:portable
```
The output will be located in the `dist` directory.

### Validating a Release Audit

To validate the current release surface in one command:
```bash
npm run validate:release
```

This audit checks the source wiring for templates, themes, About dialog, HiDPI PNG export, the release documentation for `v3.0.0`, and that `dist/KityDD 3.0.0.exe` exists and is newer than the audited release files.

## ⌨️ Keyboard Shortcuts

- **Enter**: Add sibling node
- **Tab**: Add child node
- **F2**: Edit node text
- **Delete**: Remove node
- **Space**: Center view
- **Ctrl + C / V**: Copy / Paste nodes
- **Ctrl + Z / Y**: Undo / Redo
- **Ctrl + F**: Search nodes

## 📜 License

- **KityDD**: MIT License
- **KityMinder Core**: BSD-3-Clause License (Copyright (c) 2013, Baidu FEX)

## 🤝 Credits

Developed with ❤️ by the **KityDD Team** and [DDT-TDD](https://github.com/DDT-TDD).
Based on the excellent [KityMinder](https://github.com/fex-team/kityminder) project by Baidu FEX.
