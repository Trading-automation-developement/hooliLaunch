const express = require('express');
const cors = require("cors");
const fs = require('fs');
const socketIO = require('socket.io');
const chokidar = require('chokidar');
const path = require("path");

const app = express();
const port = 3001;

// Enable CORS for all origins
app.use(cors());

app.use(express.json());

let fileChangesTracking = [];

app.get('/getDestinationsTracking', async (req, res) => {
  try {
    const settings = await getDestinationsFromSettings();
    const destinationsTracking = settings.destinations_tracking;
    res.json(destinationsTracking); 
  } catch (error) {
    console.error('Failed to retrieve settings:', error);
    res.status(500).json({ error: "Failed to retrieve destinations tracking data" });
  }
});

async function initializeServer() {
  try {
    const settings = await getDestinationsFromSettings();
    const broadcast_clients = settings.destinations_tracking;  
    console.log(`After the assignment to the data structure: ${broadcast_clients}`);

    const pathToWatch = "/home/noaa/Documents/NinjaTrader 8/outgoing/Globex_Source1_position.txt";
    const watcher = chokidar.watch(pathToWatch, {
      ignored: /(^|[\/\\])\../, 
      persistent: true
    });

    const server = app.listen(port, () => {
      console.log(`Server listening at http://localhost:${port}`);
    });

    const io = socketIO(server, {
      cors: {
        origin: "*", 
        methods: ["GET", "POST"]
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected');
      socket.emit('initialFileChanges', fileChangesTracking);

      watcher.on('change', (path) => {
        fs.readFile(path, 'utf8', (err, data) => {
          if (err) {
            console.error('Error reading file:', err);
            return;
          }
          fileChangesTracking.push(data); 
          io.emit('fileChange', data);
        });
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
  } catch (error) {
    console.error('Failed to initialize the server:', error);
  }
}

async function getDestinationsFromSettings() {
  const settingsPath = path.join(__dirname, 'settings.json');
  return new Promise((resolve, reject) => {
    fs.readFile(settingsPath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading settings.json:', err);
        reject(new Error('Failed to read settings'));
        return;
      }

      try {
        const settings = JSON.parse(data);
        console.log(`The destinations from the settings.json file are ${settings.destinations_tracking} with the type ${typeof(settings.destinations_tracking)}`);
        resolve(settings);
      } catch (parseError) {
        console.error('Error parsing settings.json:', parseError);
        reject(new Error('Failed to parse settings'));
      }
    });
  });
}

initializeServer().catch(console.error);
