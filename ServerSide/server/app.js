const express = require("express");
const cookieParser = require("cookie-parser");
const fs = require('fs');
const cors = require("cors");
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const { checkMacAddressExists } = require('./mongoDBService.js');
const app = express();
const PORT = 2666;
const io = require('socket.io')(PORT);
require('log-timestamp');

// License system
const VALID_LICENSES = {
  'XKP7-MNTV-HDLR-9W4E': {
    expiryDate: '2024-12-31',
    tier: 'premium',
    features: ['all'],
    maxConnections: 10
  },
  'JR2H-KWVX-9FPB-5MEY': {
    expiryDate: '2024-12-31',
    tier: 'standard',
    features: ['basic', 'advanced'],
    maxConnections: 5
  },
  'YT6C-NQLZ-8DVA-3UXB': {
    expiryDate: '2024-12-31',
    tier: 'basic',
    features: ['basic'],
    maxConnections: 2
  }
};

// Active sessions tracking
const activeSessions = new Map();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

var fsTimeout;
LOCAL_MEMORY = {
  "couter": 0,
  "trader1": "Bar",
  "source1": "SimBar",
  "trader2": "Omer",
  "source2": "SimOmer",
  "trader3": "Edo",
  "source3": "SimEdo",
  "destinations": ["Sim102"],
  "approveMAC": [
    "00:50:56:3f:ee:07",
    "4c:5f:70:9d:16:c9"
  ],
  "ComputerWindowsPAth": "C:\\Users\\" + os.userInfo().username + "\\Documents\\NinjaTrader 8\\outgoing\\",
};

// Path configurations
const PATH_CONFIGS = {
  trader1: {
    NQ: `${LOCAL_MEMORY.ComputerWindowsPAth}NQ 12-24 Globex_${LOCAL_MEMORY.source1}_position.txt`,
    ES: `${LOCAL_MEMORY.ComputerWindowsPAth}ES 12-24 Globex_${LOCAL_MEMORY.source1}_position.txt`,
    MNQ: `${LOCAL_MEMORY.ComputerWindowsPAth}MNQ 12-24 Globex_${LOCAL_MEMORY.source1}_position.txt`,
    MES: `${LOCAL_MEMORY.ComputerWindowsPAth}MES 12-24 Globex_${LOCAL_MEMORY.source1}_position.txt`
  },
  trader2: {
    NQ: `${LOCAL_MEMORY.ComputerWindowsPAth}NQ 12-24 Globex_${LOCAL_MEMORY.source2}_position.txt`,
    ES: `${LOCAL_MEMORY.ComputerWindowsPAth}ES 12-24 Globex_${LOCAL_MEMORY.source2}_position.txt`,
    MNQ: `${LOCAL_MEMORY.ComputerWindowsPAth}MNQ 12-24 Globex_${LOCAL_MEMORY.source2}_position.txt`,
    MES: `${LOCAL_MEMORY.ComputerWindowsPAth}MES 12-24 Globex_${LOCAL_MEMORY.source2}_position.txt`
  },
  trader3: {
    NQ: `${LOCAL_MEMORY.ComputerWindowsPAth}NQ 12-24 Globex_${LOCAL_MEMORY.source3}_position.txt`,
    ES: `${LOCAL_MEMORY.ComputerWindowsPAth}ES 12-24 Globex_${LOCAL_MEMORY.source3}_position.txt`,
    MNQ: `${LOCAL_MEMORY.ComputerWindowsPAth}MNQ 12-24 Globex_${LOCAL_MEMORY.source3}_position.txt`,
    MES: `${LOCAL_MEMORY.ComputerWindowsPAth}MES 12-24 Globex_${LOCAL_MEMORY.source3}_position.txt`
  }
};

// License verification function
function verifyLicense(licenseKey, clientInfo) {
  console.log('Verifying license:', licenseKey, clientInfo);
  const license = VALID_LICENSES[licenseKey];
  if (!license) {
    return { valid: false, message: 'Invalid license key' };
  }

  const now = new Date();
  const expiryDate = new Date(license.expiryDate);
  if (now > expiryDate) {
    return { valid: false, message: 'License expired' };
  }

  // Check number of active connections for this license
  const activeConnectionsCount = Array.from(activeSessions.values())
      .filter(session => session.licenseKey === licenseKey)
      .length;

  if (activeConnectionsCount >= license.maxConnections) {
    return { valid: false, message: 'Maximum connections reached for this license' };
  }

  return {
    valid: true,
    tier: license.tier,
    features: license.features
  };
}

io.on('connection', async (socket) => {
  console.log('New connection attempt:', socket.handshake.address);

  // Handle authentication
  socket.on('authenticate', async (data) => {
    const { licenseKey } = data;
    const verificationResult = verifyLicense(licenseKey, {
      ip: socket.handshake.address,
      id: socket.id
    });

    if (verificationResult.valid) {
      // Register session
      console.log("Valid authentication")
      activeSessions.set(socket.id, {
        licenseKey,
        tier: verificationResult.tier,
        connectedAt: new Date(),
        features: verificationResult.features
      });

      // In the server code, modify the authentication success response:
      socket.emit('authenticated', {
        status: 'success',
        valid: verificationResult.valid,  // Add this line
        tier: verificationResult.tier,
        features: verificationResult.features
      });

      // Send initial data based on tier
      socket.emit("SendAllData", LOCAL_MEMORY);

      // Set up file watchers based on tier
      setupFileWatchers(socket, verificationResult.tier);
    } else {
      socket.emit('authenticated', {
        status: 'error',
        message: verificationResult.message
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    activeSessions.delete(socket.id);
  });

  // Handle updating source
  socket.on('UpdateSource', (value) => {
    const session = activeSessions.get(socket.id);
    if (!session) {
      socket.emit('error', { message: 'Authentication required' });
      return;
    }

    console.log("UpdateSource", value);
    LOCAL_MEMORY.source1 = value;
  });
});

// Function to setup file watchers based on tier
function setupFileWatchers(socket, tier) {
  function createWatcher(path, instrument, trader) {
    fs.watch(path, (event, filename) => {
      fs.readFile(path, 'utf8', (err, data) => {
        if (data) {
          const myObject = {
            d: data.trim(),
            INS: instrument,
            trader: trader
          };
          socket.emit("NewTrade", myObject);
        }
      });
    });
  }

  // Set up watchers based on tier
  if (tier === 'premium') {
    // Premium gets access to all traders
    Object.entries(PATH_CONFIGS).forEach(([trader, paths]) => {
      Object.entries(paths).forEach(([instrument, path]) => {
        createWatcher(path, `${instrument} 12-24`, LOCAL_MEMORY[trader]);
      });
    });
  } else if (tier === 'standard') {
    // Standard gets access to trader1 and trader2
    ['trader1', 'trader2'].forEach(trader => {
      Object.entries(PATH_CONFIGS[trader]).forEach(([instrument, path]) => {
        createWatcher(path, `${instrument} 12-24`, LOCAL_MEMORY[trader]);
      });
    });
  } else {
    // Basic gets access to trader1 only
    Object.entries(PATH_CONFIGS.trader1).forEach(([instrument, path]) => {
      createWatcher(path, `${instrument} 12-24`, LOCAL_MEMORY.trader1);
    });
  }
}

// Error handling
io.on('error', (err) => {
  console.error('Socket.io error:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});