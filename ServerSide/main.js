const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const url = require('url');

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    title: 'Client-Side-Trading',
    width: 1000,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.webContents.openDevTools({mode: 'detach'});

  const startUrl = url.format({
    pathname: path.join(__dirname, 'server_interface', 'build', 'index.html'),
    protocol: 'file:',
    slashes: true
  });

  mainWindow.loadURL(startUrl).catch(e => {
    console.error('Failed to load URL:', e);
  });

  // Start the server as a separate process
  const server = spawn('node', [path.join(__dirname, 'server', 'app.js')]);
  server.stdout.on('data', data => {
    console.log(`Server: ${data}`);
  });
  server.stderr.on('data', data => {
    console.error(`Server Error: ${data}`);
  });
}

app.whenReady().then(createMainWindow);
