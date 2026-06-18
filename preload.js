const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  importNames: () => ipcRenderer.invoke('import-names'),
  importNamesByPath: (filePath) => ipcRenderer.invoke('import-names-by-path', filePath),
  getFilePath: (file) => webUtils.getPathForFile(file)
});
