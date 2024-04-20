const express = require('express');
const cors = require("cors");
const fs = require('fs');
const socketIO = require('socket.io');
const chokidar = require('chokidar');
const path = require("path");

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

let fileChangesTracking = [];
let clients = {};  

app.post('/updatePermissions', async (req, res) => {
  const updatedPermissions = req.body; // Expected to be an object with { [index]: true/false }

  try {
    const settings = await getSettings();  // Load current settings
    const currentDestinations = await getDestinationsFromSettings();

    // Update the allowed_destinations based on index received and whether it is allowed
    settings.allowed_destinations = Object.entries(updatedPermissions).reduce((acc, [index, isAllowed]) => {
      if (isAllowed) {  // If tracking is allowed, add the destination name using the index
        const destinationName = currentDestinations.destinations_tracking[parseInt(index)];
        if (destinationName) {
          acc.push(destinationName); // Assuming destinationName is just a string
        }
      }
      return acc;
    }, []);

    // Write the updated settings back to the settings.json
    const settingsPath = path.join(__dirname, 'settings.json');
    fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8', err => {
      if (err) {
        console.error('Failed to update settings.json:', err);
        res.status(500).json({ error: "Failed to update destination tracking settings" });
        return;
      }
      console.log('Destination tracking settings updated');
      res.status(200).json({ message: "Destination tracking settings successfully updated" });
    });
  } catch (error) {
    console.error('Failed to update destination tracking permissions:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});


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
    console.log(`Destinations tracking loaded: ${settings.destinations_tracking}`);

    const pathToWatch = "/home/noaa/Documents/NinjaTrader 8/outgoing/Globex_Source1_position.txt";
    const watcher = chokidar.watch(pathToWatch, { ignored: /(^|[\/\\])\../, persistent: true });

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
      const clientInfo = {
        socket: socket,
        ip: socket.request.connection.remoteAddress,
        connectTime: new Date()
      };
      clients[socket.id] = clientInfo;  
      updateSettingsWithClients(clients);
      console.log(`Client connected: ${socket.id} from IP: ${clientInfo.ip}`);
      updateSettingsWithClients(clients);
      console.log(`Total clients connected: ${Object.keys(clients).length}`);
    
      socket.emit('initialFileChanges', fileChangesTracking);
    
      watcher.on('change', (filePath) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
            console.error('Error reading file:', err);
            return;
          }
          fileChangesTracking.push(data);
          io.emit('fileChange', data);
        });
      });
      
      
    
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id} from IP: ${clients[socket.id]?.ip}`);
        delete clients[socket.id]; 
        updateSettingsWithClients(clients)
        console.log(`Total clients connected: ${Object.keys(clients).length}`);
      });
    });
    
  } catch (error) {
    console.error('Failed to initialize the server:', error);
  }
}
app.get('/getDestinationsAllowTracking', async (req, res) => {
  try {
    const settings = await getDestinationsFromSettings();
    const destinationsTrackingAllowed = settings.allowed_destinations;
    res.json(destinationsTrackingAllowed); 
  } catch (error) {
    console.error('Failed to retrieve settings:', error);
    res.status(500).json({ error: "Failed to retrieve destinations tracking data" });
  }
});
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
        resolve(settings);
      } catch (parseError) {
        console.error('Error parsing settings.json:', parseError);
        reject(new Error('Failed to parse settings'));
      }
    });
  });
}
async function updateSettingsWithClients(clients) {
  const settingsPath = path.join(__dirname, 'settings.json');
  const settings = await getSettings();
  settings.clients_connected = Object.keys(clients).map(id => ({
    id: id,
    ip: clients[id].ip,
    connectTime: clients[id].connectTime
  }));

  fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8', err => {
    if (err) {
      console.error('Failed to update settings.json:', err);
      return;
    }
    console.log('Updated settings.json with current client info');
  });
}
async function getSettings() {
  const settingsPath = path.join(__dirname, 'settings.json');
  return new Promise((resolve, reject) => {
    fs.readFile(settingsPath, 'utf8', (err, data) => {
      if (err) {
        reject(new Error('Failed to read settings'));
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (parseError) {
        reject(new Error('Failed to parse settings'));
      }
    });
  });
}

initializeServer().catch(console.error);
