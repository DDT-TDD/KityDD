# Release Notes - KityDD v1.1.0

We are excited to announce the release of **KityDD v1.1.0**, a major update that brings long-awaited multi-session support and significant workflow improvements.

## Featured Highlights

### 📑 Tabbed Interface
You can now work on multiple mindmaps simultaneously! Our new tab bar allows you to switch between files seamlessly without losing your progress. Each session is completely isolated, ensuring your data remains organized.

### 💾 Faster Saving
We've introduced "Direct Save" logic. If you've opened a file, hitting `Ctrl+S` (or using the Save menu) will now overwrite the file instantly, eliminating unnecessary dialogs and speeding up your editing process.

### ⚠️ Data Protection
Never lose your work again! KityDD now detects unsaved changes across all open tabs and will prompt you before closing the application or an individual tab.

### 🔄 Enhanced Importers
We've significantly improved our import engine to support:
- **XMind**: Better handling of markers and labels.
- **MindManager**: Direct `.mmap` import support.
- **FreeMind**: enhanced `.mm` structure mapping.

## Keyboard Shortcuts
- `Ctrl + N`: New Session
- `Ctrl + O`: Open / Import
- `Ctrl + S`: Save (Direct or As)
- `Ctrl + Shift + S`: Save As
- `Ctrl + Shift + C`: Toggle Text Centering

## Bug Fixes
- Fixed hyperlink insertion and image URL validation to be more permissive (e.g., allowed entering `www.google.com` directly).
- Implemented auto-prepending of `http://` for links and images to prevent broken redirection.
- Corrected various typos in the UI, including a widespread "Cancle" -> "Cancel" fix across multiple languages.
- Improved ribbon stability by preventing accidental closure when interacting with icons.
- Fixed a `TypeError` when adding progress icons due to library prototype conflicts.
- Resolved a race condition where files would sometimes load blank on high-speed drives.
- Fixed an issue with node text alignment not persisting after "camera" resets.

---
Thank you for using KityDD!
[DDT-TDD Team](https://github.com/DDT-TDD)
