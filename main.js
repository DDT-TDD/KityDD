const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// ---------------------------------------------------------
// RECENT FILES
// ---------------------------------------------------------
const RECENT_FILES_PATH = path.join(app.getPath('userData'), 'recent-files.json');
const MAX_RECENT = 10;

function loadRecentFiles() {
  try {
    if (fs.existsSync(RECENT_FILES_PATH)) {
      const data = JSON.parse(fs.readFileSync(RECENT_FILES_PATH, 'utf8'));
      // Filter out files that no longer exist
      return (Array.isArray(data) ? data : []).filter(f => {
        try { return fs.existsSync(f); } catch { return false; }
      }).slice(0, MAX_RECENT);
    }
  } catch (e) { /* ignore corrupt json */ }
  return [];
}

function saveRecentFiles(files) {
  try {
    fs.writeFileSync(RECENT_FILES_PATH, JSON.stringify(files), 'utf8');
  } catch (e) { /* ignore */ }
}

function addRecentFile(filePath) {
  if (!filePath) return;
  let files = loadRecentFiles();
  // Remove duplicate then prepend
  files = files.filter(f => f !== filePath);
  files.unshift(filePath);
  if (files.length > MAX_RECENT) files = files.slice(0, MAX_RECENT);
  saveRecentFiles(files);
  // Also add to OS-level recent documents
  app.addRecentDocument(filePath);
  // Rebuild menu so the Recent submenu updates
  createMenu();
}

function clearRecentFiles() {
  saveRecentFiles([]);
  app.clearRecentDocuments();
  createMenu();
}

function setupSpellcheckContextMenu(win) {
  win.webContents.on('context-menu', (event, params) => {
    const menuTemplate = [];
    const hasMisspelling = !!params.misspelledWord;

    if (hasMisspelling && params.dictionarySuggestions && params.dictionarySuggestions.length) {
      params.dictionarySuggestions.slice(0, 8).forEach((suggestion) => {
        menuTemplate.push({
          label: suggestion,
          click: () => win.webContents.replaceMisspelling(suggestion)
        });
      });
      menuTemplate.push({ type: 'separator' });
    }

    if (hasMisspelling) {
      menuTemplate.push({
        label: 'Add to Dictionary',
        click: () => {
          win.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord);
        }
      });
      menuTemplate.push({ type: 'separator' });
    }

    if (params.isEditable) {
      menuTemplate.push(
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      );
    } else if (params.selectionText && params.selectionText.trim()) {
      menuTemplate.push(
        { role: 'copy' },
        { role: 'selectAll' }
      );
    }

    if (!menuTemplate.length) {
      return;
    }

    const menu = Menu.buildFromTemplate(menuTemplate);
    menu.popup({ window: win });
  });
}

function createMenu() {
  // Build recent files submenu
  const recentFiles = loadRecentFiles();
  const recentSubmenu = [];
  if (recentFiles.length) {
    recentFiles.forEach((filePath, idx) => {
      const label = `${idx + 1}. ${path.basename(filePath)}`;
      recentSubmenu.push({
        label: label,
        toolTip: filePath,
        click: () => {
          mainWindow.webContents.send('menu-command', 'open-recent', filePath);
        }
      });
    });
    recentSubmenu.push({ type: 'separator' });
    recentSubmenu.push({
      label: 'Clear Recent Files',
      click: () => { clearRecentFiles(); }
    });
  } else {
    recentSubmenu.push({ label: '(No recent files)', enabled: false });
  }

  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => { mainWindow.webContents.send('menu-command', 'new'); } },
        { type: 'separator' },
        { label: 'Open...', accelerator: 'CmdOrCtrl+O', click: () => { mainWindow.webContents.send('menu-command', 'open'); } },
        { label: 'Open Recent', submenu: recentSubmenu },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => { mainWindow.webContents.send('menu-command', 'save'); } },
        { label: 'Save As...', accelerator: 'CmdOrCtrl+Shift+S', click: () => { mainWindow.webContents.send('menu-command', 'save-as'); } },
        { type: 'separator' },
        { label: 'Export PNG', click: () => { mainWindow.webContents.send('menu-command', 'export-png'); } },
        { label: 'Export SVG', click: () => { mainWindow.webContents.send('menu-command', 'export-svg'); } },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: () => { mainWindow.webContents.send('menu-command', 'undo'); } },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Y', click: () => { mainWindow.webContents.send('menu-command', 'redo'); } },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      role: 'help',
      submenu: [
        { label: 'Learn More', click: () => { require('electron').shell.openExternal('https://github.com/fex-team/kityminder-editor'); } },
        {
          label: 'About KityDD', click: () => {
            mainWindow.webContents.send('show-about');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      spellcheck: true,
    },
    icon: path.join(__dirname, 'icon.png')
  });

  try {
    mainWindow.webContents.session.setSpellCheckerLanguages(['en-US']);
  } catch (err) {
    console.warn('Spellchecker language setup failed:', err.message);
  }

  mainWindow.loadFile('local-kity-minder/index.html');
  setupSpellcheckContextMenu(mainWindow);
  createMenu();

  mainWindow.on('close', (e) => {
    if (mainWindow.isModified) {
      e.preventDefault();
      mainWindow.webContents.send('ask-close-confirmation');
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for KityDD file open/save dialogs
ipcMain.handle('open-file-dialog', async (event, options = {}) => {
  const defaultOptions = {
    filters: [
      { name: 'Supported Mindmaps', extensions: ['km', 'json', 'xmind', 'mmap', 'md', 'xml', 'mm'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  };

  const { canceled, filePaths } = await dialog.showOpenDialog(Object.assign(defaultOptions, options));
  if (canceled || !filePaths.length) return null;

  const ext = path.extname(filePaths[0]).toLowerCase().replace('.', '');

  let content;
  if (ext === 'xmind' || ext === 'mmap') {
    content = fs.readFileSync(filePaths[0], 'base64');
  } else {
    content = fs.readFileSync(filePaths[0], 'utf8');
  }

  // Track in recent files
  addRecentFile(filePaths[0]);

  return {
    content: content,
    filePath: filePaths[0],
    extension: ext
  };
});

ipcMain.handle('open-image-dialog', async (event) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'jpeg', 'svg', 'webp'] }],
    properties: ['openFile']
  });
  if (canceled || !filePaths.length) return null;
  const ext = path.extname(filePaths[0]).toLowerCase().replace('.', '');
  // read as base64
  const content = fs.readFileSync(filePaths[0], 'base64');
  let mime = 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
  else if (ext === 'gif') mime = 'image/gif';
  else if (ext === 'svg') mime = 'image/svg+xml';
  else if (ext === 'webp') mime = 'image/webp';
  return `data:${mime};base64,${content}`;
});


ipcMain.handle('save-file-dialog', async (event, payload) => {
  const { data, isBinary, options = {} } = payload;

  const defaultOptions = {
    filters: [
      { name: 'Kityminder Mindmap', extensions: ['km'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  };

  const { canceled, filePath } = await dialog.showSaveDialog(Object.assign(defaultOptions, options));
  if (canceled || !filePath) return null;

  if (isBinary) {
    // Handle base64 PNG data
    const base64Data = data.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync(filePath, base64Data, 'base64');
  } else {
    fs.writeFileSync(filePath, data, 'utf8');
  }

  // Track in recent files (for mindmap saves, not PNG exports)
  if (!isBinary) addRecentFile(filePath);

  return filePath;
});

ipcMain.handle('save-file-direct', async (event, payload) => {
  const { filePath, data } = payload;
  if (!filePath) return null;

  try {
    fs.writeFileSync(filePath, data, 'utf8');
    addRecentFile(filePath);
    return filePath;
  } catch (err) {
    console.error('Failed to save file:', err);
    return null;
  }
});

ipcMain.on('set-modified-status', (event, isModified) => {
  if (mainWindow) {
    mainWindow.isModified = isModified;
    // Update window title or other indicators if needed
    let title = 'KityDD';
    if (isModified) title += ' *';
    mainWindow.setTitle(title);
  }
});

ipcMain.on('confirm-close', (event, confirm) => {
  if (confirm && mainWindow) {
    mainWindow.isModified = false;
    mainWindow.close();
  }
});

// Read a file by path (used for opening recent files)
ipcMain.handle('read-file-by-path', async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) return null;
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    let content;
    if (ext === 'xmind' || ext === 'mmap') {
      content = fs.readFileSync(filePath, 'base64');
    } else {
      content = fs.readFileSync(filePath, 'utf8');
    }
    addRecentFile(filePath);
    return { content, filePath, extension: ext };
  } catch (err) {
    console.error('Failed to read recent file:', err);
    return null;
  }
});

