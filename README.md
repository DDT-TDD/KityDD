# KityDD

Professional Mindmap Tool - An Electron implementation of KityMinder with advanced features and cross-platform compatibility.

KityDD is a high-performance mind mapping tool built on the robust KityMinder engine, tailored for desktop use with Electron. It offers a seamless experience for creating, editing, and sharing professional mind maps with support for advanced elements like equations, images, and notes.

## Current Release

**v1.1.2** (2026-04-21)

- Restores reliable node text editing when edit mode is entered from hotbox and toolbar actions.
- Commits in-progress node text before switching tabs so session changes do not discard active edits.
- Keeps the inline text editor above the custom tab bar and sidebar while editing.

## ✨ Features

- **Intuitive Interface**: A clean, foldable sidebar for advanced actions and a quick-access ribbon for core mind mapping functions.
- **Advanced Insertions**:
  - 📝 **Notes**: Add detailed rich-text notes to any node.
  - 🔗 **Hyperlinks**: Link nodes to external websites or documents.
  - 🖼️ **Local Images**: Embed local images directly into your mind maps using an integrated file picker.
  - ∑ **Equations**: Render professional LaTeX equations using high-quality SVG output.
- **Universal Import & Export**:
  - **Import**: Support for `.km`, `.json`, `.xmind`, `.mmap` (MindManager), and `.md` (Markdown).
  - **Export**: Export your maps as `.km`, `.json`, `.png` (Image), or `.md` (Markdown).
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
