const io = require('socket.io-client');
const fs = require('fs');
const path = require('path');
const { checkMacAddressExists } = require('./mongoDBService.js');
const os = require('os');

function getMacAddress() {
  const networkInterfaces = os.networkInterfaces();
  let macAddress = null;

  // Loop through all network interfaces
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    const networkInterface = networkInterfaces[interfaceName];
    
    // Loop through all addresses of the current interface
    networkInterface.forEach((address) => {
      // Check if the address is a MAC address and not internal or loopback
      if (!address.internal && address.mac && address.mac !== '00:00:00:00:00:00') {
        macAddress = address.mac;
      }
    });
  });

  return macAddress;
}

const serverIp = "185.241.5.114"; 
const serverUrl = `http://${serverIp}:3001`;
const localFilePath = "C:/Users/noaam/OneDrive/Documents/NinjaTrader 8/outgoing/Globex_Source1_position.txt";

console.log(`Connecting to server at: ${serverUrl}`);
const socket = io(serverUrl);

socket.on('connect', async () => {
    console.log('Connected to server');
    
    const macAddressToCheck = getMacAddress();
    if (!macAddressToCheck) {
        console.log('Failed to retrieve MAC address. Stopping client server.');
        process.exit(1);
    }
    
    const macAddressExists = await checkMacAddressExists(macAddressToCheck);
    
    if (!macAddressExists) {
        console.log('Current MAC address does not exist in the database. Stopping client server.');
        process.exit(1); 
    }
});

socket.on('initialFileChanges', (fileChanges) => {
    console.log('Initial file changes received:', fileChanges);
});

socket.on('fileChange', (data) => {
    console.log('File change detected, updating local file.');
    fs.appendFile(localFilePath, `${data}\n`, (err) => {
        if (err) {
            console.error('Error appending to local file:', err);
            return;
        }
        console.log('Change appended to local file.');
    });
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});
