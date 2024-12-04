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

const VALID_LICENSES = {
  'XKP7-MNTV-HDLR-9W4E': {
    expiryDate: '2024-12-31',
    tier: 'premium',
    features: ['all'],
    maxConnections: 1  // Changed to 1 for single instance
  },
  'JR2H-KWVX-9FPB-5MEY': {
    expiryDate: '2024-12-31',
    tier: 'standard',
    features: ['basic', 'advanced'],
    maxConnections: 1  // Changed to 1 for single instance
  },
  'YT6C-NQLZ-8DVA-3UXB': {
    expiryDate: '2024-12-31',
    tier: 'basic',
    features: ['basic'],
    maxConnections: 1  // Changed to 1 for single instance
  }
};

const activeSessions = new Map();
const activeLicenses = new Map();

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

function verifyLicense(licenseKey, clientInfo) {
  console.log('Verifying license:', licenseKey, clientInfo);
  const license = VALID_LICENSES[licenseKey];

  if (!license) {
    return { valid: false, message: 'Invalid license key' };
  }

  // Check if license is already in use by a different socket
  const activeSession = activeLicenses.get(licenseKey);
  if (activeSession && activeSession.socketId !== clientInfo.id) {
    return { valid: false, message: 'License already in use by another instance' };
  }

  const now = new Date();
  const expiryDate = new Date(license.expiryDate);
  if (now > expiryDate) {
    return { valid: false, message: 'License expired' };
  }

  return {
    valid: true,
    tier: license.tier,
    features: license.features
  };
}

io.on('connection', async (socket) => {
  console.log('New connection attempt:', socket.handshake.address);

  socket.on('authenticate', async (data) => {
    const { licenseKey } = data;
    const verificationResult = verifyLicense(licenseKey, {
      ip: socket.handshake.address,
      id: socket.id
    });

    if (verificationResult.valid) {
      // Register session and license usage
      console.log("Valid authentication");

      activeSessions.set(socket.id, {
        licenseKey,
        tier: verificationResult.tier,
        connectedAt: new Date(),
        features: verificationResult.features
      });

      activeLicenses.set(licenseKey, {
        socketId: socket.id,
        connectedAt: new Date(),
        ip: socket.handshake.address
      });

      socket.emit('authenticated', {
        status: 'success',
        valid: true,
        tier: verificationResult.tier,
        features: verificationResult.features
      });

      socket.emit("SendAllData", LOCAL_MEMORY);
      setupFileWatchers(socket, verificationResult.tier);
    } else {
      socket.emit('authenticated', {
        status: 'error',
        valid: false,
        message: verificationResult.message
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const session = activeSessions.get(socket.id);
    if (session) {
      activeLicenses.delete(session.licenseKey);
      activeSessions.delete(socket.id);
    }
  });

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

  ['trader1', 'trader2', 'trader3'].forEach(trader => {
    Object.entries(PATH_CONFIGS[trader]).forEach(([instrument, path]) => {
      createWatcher(path, `${instrument} 12-24`, LOCAL_MEMORY[trader]);
    });
  });

  // if (tier === 'premium') {
  //   Object.entries(PATH_CONFIGS).forEach(([trader, paths]) => {
  //     Object.entries(paths).forEach(([instrument, path]) => {
  //       createWatcher(path, `${instrument} 12-24`, LOCAL_MEMORY[trader]);
  //     });
  //   });
  // } else if (tier === 'standard') {
  //
  // } else {
  //   Object.entries(PATH_CONFIGS.trader1).forEach(([instrument, path]) => {
  //     createWatcher(path, `${instrument} 12-24`, LOCAL_MEMORY[trader]);
  //   });
  // }
}

io.on('error', (err) => {
  console.error('Socket.io error:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});