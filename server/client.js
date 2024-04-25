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
accountName = "Source1"
const serverIp = "185.241.5.114"; 
const serverUrl = `http://${serverIp}:3001`;
const localFilePath = `C:/Users/noaam/OneDrive/Documents/NinjaTrader 8/outgoing/Globex_${accountName}_position.txt`

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

        accountName="Sim101";
        buyofsell(accountName);

        console.log('Change appended to local file.');
    });
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});


// byofsell function integration associted code
const filePath = path.join(__dirname, 'settings.json');
const settings = JSON.parse(fs.readFileSync(filePath));
const SettingsPath = path.join(getUserDocumentsPath(), "NinjaTrader 8", "outgoing", "NQ 06-24 Globex_Sim101_position.txt");
console.log(`The settings path is ${SettingsPath}`)
let count = 0;

function getUserDocumentsPath() {
  if (os.platform() !== 'win32') {
      throw new Error('Unsupported platform');
  }

  const homeDir = os.homedir();
  const oneDrivePath = path.join(homeDir, 'OneDrive', 'Documents');
  
  return fs.existsSync(oneDrivePath) ? oneDrivePath : process.env.USERPROFILE || path.join(homeDir, 'Documents');
}

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
  const path =  path.join(getUserDocumentsPath(), `NinjaTrader 8\\incoming\\oif.${uuidv4()}.txt`);
  const mrkt = "PLACE;"+nameofAccount+";<INS>;<ACT>;<QTY>;MARKET;<LIMIT>;;DAY;;;;";
  var ordr = mrkt.replace("<INS>","NQ 06-24").replace("<ACT>",action).replace("<QTY>",amount);
  if( data.includes("FLAT")){
    ordr = "CLOSEPOSITION;<ACCOUNT>;<INSTRUMENT>;;;;;;;;;;".replace("<ACCOUNT>",nameofAccount).replace("<INSTRUMENT>","NQ 06-24");
  }
  fs.writeFileSync(path,ordr);
  //console.log("finally ", path,ordr)
});

};