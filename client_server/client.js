const io = require('socket.io-client');
const fs = require('fs');
const path = require('path');
const { checkMacAddressExists } = require('./mongoDBService.js');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

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

//const serverIp = "185.241.5.114"; 
const serverIp = "127.0.0.1";
const serverUrl = `http://${serverIp}:3003`;
const homedir = os.homedir();

//const localFilePath = "C:/Users/noaam/OneDrive/Documents/NinjaTrader 8/outgoing/Globex_Source1_position.txt";
const localFilePath = path.join(homedir, 'Documents', `NinjaTrader 8/outgoing/NQ 06-24 Globex_Sim101_position.txt`);
console.log(`Connecting to server at: ${serverUrl}`);
const socket = io(serverUrl);
let reconnectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 5;

function connectWithRetry(){
  if(reconnectionAttempts >= MAX_RECONNECTION_ATTEMPTS){
    console.log("Max reconnection attempts reached. Exiting...");
    return;
  }
  socket.connect();
}


socket.on('connect_error', (error) => {
  console.log('Connection error:', error.message);
  reconnectionAttempts++;
  console.log(`Reconnection attempt ${reconnectionAttempts} of ${MAX_RECONNECTION_ATTEMPTS}`);
  setTimeout(connectWithRetry, 5000); // Waiting five seconds before trying to reconnect
});


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
function extractAccountName(filePath) {
  const pattern = /Globex_(.+?)_position\.txt$/;
  const match = filePath.match(pattern);

  if (match && match[1]) {
      return match[1];
  } else {
      return null; 
  }
}
socket.on('fileChange', (data) => {
    console.log(`Change detected in file: ${data.path}`);
    console.log(`New content: ${data.content}`);
    console.log('File change detected, updating local file.');
    fs.appendFile(localFilePath, `${data.content}\n`, (err) => {
        if (err) {
            console.error('Error appending to local file:', err);
            return;
        }
        console.log('Change appended to local file.');
    });

    // Here I need to extract the name of the the account from the path
    const extractedNameOfAccount = extractAccountName(data.path);
    count++;
      if(count%2==0){
          //console.log("File Changed", event, filename);
          fs.readFile(data.path, 'utf8', (err, data) => {
            if (err) {
              console.error(err);
              return;
            }

          });
          // for(var key in settings.destinations ){
          //   buyofsell(settings.destinations[key]);
          // }
          if(extractAccountName){
            console.log('Beofre buyofsell function...')
            buyofsell(extractedNameOfAccount);
          }
      };
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

// Integrate the buyofsell function

//Extract Settings Content
const filePath = path.join(__dirname, 'settings.json');
const settings = JSON.parse(fs.readFileSync(filePath));
const nameOfAccount = "Sim101";

function getUserDocumentsPath() {
  let homeDir = os.homedir();
  let documentsPath;

  switch (os.platform()) {
      case 'win32': // Windows
          documentsPath = path.join(homeDir, 'Documents');
          break;
      case 'darwin': // macOS
          documentsPath = path.join(homeDir, 'Documents');
          break;
      case 'linux': // Linux
          
          documentsPath = path.join(homeDir, 'Documents');
          break;
      default:
          throw new Error('Unsupported platform');
  }

  return documentsPath;
}
function getSettingsPath(accountName) {
    return path.join(getUserDocumentsPath(), "NinjaTrader 8", "outgoing", `NQ 06-24 Globex_${accountName}_position.txt`);
}

const SettingsPath = path.join(getUserDocumentsPath(), "NinjaTrader 8", "outgoing", `NQ 06-24 Globex_${nameOfAccount}_position.txt`);
console.log(`The settings path is ${SettingsPath}`)
let count = 0;

const returnAction = (data) => {  
  return data.includes('LONG') ? 'BUY': 'SELL';
};

const returnAmount = (data) => {
  return data.split(';')[1];
};

const returnCurrentValues = (data) => {
  valuedictionary = {
    'action': returnAction(data),
    'Amount': returnAmount(data)
  };
  return valuedictionary;
};


let Currentvalues = {};

let PrevFunction = {
    'action': null,
    'Amount': 0
  };
      
var buyofsell = (nameofAccount)=>{
    SettingsPath = getSettingsPath(nameOfAccount);
    fs.readFile(SettingsPath.replace(settings.source, nameofAccount), 'utf8', (err, OldFileData) => {
        if (err) {
          console.error(err);
          return;
        }
        
        PrevFunction["action"] = OldFileData.includes('LONG') ? 'BUY': 'SELL';
        PrevFunction["Amount"] = OldFileData.split(';')[1];
       // console.log("new sim data ",OldFileData, PrevFunction)
    });
    fs.readFile(SettingsPath, 'utf8', (err, data) => {
   
    Currentvalues= returnCurrentValues(data);
    //console.log("data ",data, Currentvalues, PrevFunction)
    if (!PrevFunction["Amount"]){
        PrevFunction["Amount"]=0;
    }
    var action= Currentvalues["action"];
    var amount= Currentvalues["Amount"]-  PrevFunction["Amount"];

    if (Currentvalues["Amount"]-  PrevFunction["Amount"] < 0){
      console.log("inside if statement ", Currentvalues["Amount"]-  PrevFunction["Amount"]);
      action = action.includes("SELL") ? "BUY" : "SELL";
      //action=data.includes("LONG") ? "BUY": "SELL";
      amount = -amount ;
    }
    console.log("account name- ",nameofAccount, "action -", action, " amount- ",amount, "prev was -", PrevFunction, " current- ", Currentvalues)
    const _path =  path.join(getUserDocumentsPath(), `NinjaTrader 8\\incoming\\oif.${uuidv4()}.txt`);
    const mrkt = "PLACE;"+nameofAccount+";<INS>;<ACT>;<QTY>;MARKET;<LIMIT>;;DAY;;;;";
    var ordr = mrkt.replace("<INS>","NQ 06-24").replace("<ACT>",action).replace("<QTY>",amount);
    if( data.includes("FLAT")){
       ordr = "CLOSEPOSITION;<ACCOUNT>;<INSTRUMENT>;;;;;;;;;;".replace("<ACCOUNT>",nameofAccount).replace("<INSTRUMENT>","NQ 06-24");
    }
    fs.writeFileSync(_path,ordr);
    //console.log("finally ", path,ordr)
  });
  
  };
  
  
  