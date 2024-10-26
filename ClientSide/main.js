const { app, BrowserWindow } = require('electron');
const { start } = require('./server/app'); // Corrected path
const path = require('path');

app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-features', 'MediaSource,MediaCapabilities,WebRTC');
app.commandLine.appendSwitch('disable-component-update');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      enableRemoteModule: false,
      disableBlinkFeatures: 'Autofill',
      webSecurity: true,
      sandbox: true,
      plugins: false,
      nativeWindowOpen: true,
    },
  });

  console.log(path.join(__dirname, 'client', 'build', 'index.html'));
  win.loadURL(`file://${path.join(__dirname, 'client', 'build', 'index.html')}`);
}

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-features', 'MediaSource,MediaCapabilities');
app.commandLine.appendSwitch('disable-component-update');

app.whenReady().then(() => {
  start();
  createWindow();
});

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