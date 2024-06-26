const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');


const cacheDir = path.join(app.getPath('userData'), 'cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir);
}

app.commandLine.appendSwitch('disk-cache-dir', cacheDir);

function createWindow() {
  let mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: true,
      preload: path.join(__dirname, './preload.js')  
    },
  });

  const indexPath = path.join(__dirname, 'client_interface', 'build', 'index.html');
  console.log(`Loading URL: file://${indexPath}`);
 
  if (fs.existsSync(indexPath)) {
    console.log('index.html file exists.');
  } else {
    console.log('index.html file does not exist.');
  }

  mainWindow.loadURL(`file://${indexPath}`);

  // Open DevTools to check for errors
 // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

