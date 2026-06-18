const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#080c0d',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

function readFileByPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.xlsx') {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const content = XLSX.utils.sheet_to_csv(sheet);
    return { content, filePath };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return { content, filePath };
}

// IPC: 点击导入（弹出文件对话框）
ipcMain.handle('import-names', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: '支持的格式', extensions: ['txt', 'csv', 'xlsx'] }
    ]
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return readFileByPath(result.filePaths[0]);
});

// IPC: 拖拽导入（直接传入文件路径）
ipcMain.handle('import-names-by-path', async (event, filePath) => {
  return readFileByPath(filePath);
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});
