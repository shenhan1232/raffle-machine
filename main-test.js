const electron = require('electron');
console.log('electron keys:', Object.keys(electron).slice(0, 10));
console.log('ipcMain:', typeof electron.ipcMain);
const { app, BrowserWindow } = electron;
app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 400, height: 300 });
  win.loadURL('data:text/html,<h1>Hello</h1>');
});
