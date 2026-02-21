# Changelog

All notable changes to this project will be documented in this file.

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
