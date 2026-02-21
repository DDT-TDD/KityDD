const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const path = require('path');

let mainWindow;

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => { mainWindow.webContents.send('menu-command', 'new'); } },
        { type: 'separator' },
        { label: 'Open...', accelerator: 'CmdOrCtrl+O', click: () => { mainWindow.webContents.send('menu-command', 'open'); } },
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
            const { nativeImage } = require('electron');
            let iconPath = path.join(__dirname, 'icon.ico');
            let appIcon = nativeImage.createFromPath(iconPath);
            if (!appIcon.isEmpty()) appIcon = appIcon.resize({ width: 128, height: 128 });

            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About KityDD',
              icon: appIcon,
              message: 'KityDD Professional Mindmap IDE v1.0.0',
              detail: 'A professional and robust Mindmapping Tool based on the KityMinder core.\nDesigned for high productivity with an enhanced foldable Action Interface.\n\n' +
                'License Information:\n' +
                '• KityDD Application: MIT License\n' +
                '• KityMinder Core (FEX-Team): BSD-3-Clause License\n\n' +
                'Developed & Maintained by DDT-TDD:\n' +
                'https://github.com/DDT-TDD\n\n' +
                'Useful Keyboard Shortcuts:\n' +
                '  Ctrl+N : Create New Mindmap\n' +
                '  Ctrl+O : Open File / Import\n' +
                '  Ctrl+S : Save or Export Mindmap\n' +
                '  Ctrl+Shift+C : Toggle Node Text Centering\n' +
                '  F2 : Edit Selected Node Text'
            });
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
    },
    icon: path.join(__dirname, 'ico.png')
  });

  mainWindow.loadFile('local-kity-minder/index.html');
  createMenu();
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

  const fs = require('fs');
  const path = require('path');
  const ext = path.extname(filePaths[0]).toLowerCase().replace('.', '');

  let content;
  if (ext === 'xmind' || ext === 'mmap') {
    content = fs.readFileSync(filePaths[0], 'base64');
  } else {
    content = fs.readFileSync(filePaths[0], 'utf8');
  }

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
  const fs = require('fs');
  const path = require('path');
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

  const fs = require('fs');
  if (isBinary) {
    // Handle base64 PNG data
    const base64Data = data.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync(filePath, base64Data, 'base64');
  } else {
    fs.writeFileSync(filePath, data, 'utf8');
  }
  return filePath;
});

