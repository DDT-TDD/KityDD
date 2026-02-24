# Changelog

All notable changes to this project will be documented in this file.
 
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
