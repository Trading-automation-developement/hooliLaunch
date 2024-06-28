const express = require("express");
const cookieParser = require("cookie-parser");
const fs = require('fs'); // Corrected: using fs.promises
const cors = require("cors");
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const {  checkMacAddressExists } = require('./mongoDBService.js');
const app = express();
const PORT = 2666;
const io = require('socket.io')(PORT);
require('log-timestamp');
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


LOCAL_MEMORY={
"couter":0,
"source": "Sim101",
  "destinations": [
    "Sim102"
  ],
  "approveMAC": [
    "00:50:56:3f:ee:07",
    "4c:5f:70:9d:16:c9"
  ],
  "ComputerWindowsPAth": "C:\\Users\\"+os.userInfo().username+"\\Documents\\NinjaTrader 8\\outgoing\\",
}
const SettingsPath = `${LOCAL_MEMORY.ComputerWindowsPAth}NQ 06-24 Globex_${LOCAL_MEMORY.source}_position.txt`;

io.on('connection', (socket) => {
  console.log('Client connected');
  socket.emit("SendAllData", LOCAL_MEMORY)

  socket.on('disconnect', () => {
      console.log('Client disconnected');
  });

socket.on('UpdateSource', (value) => {
  LOCAL_MEMORY.source= value;
  console.log("UpdateSource", value)
});


var fsTimeout
console.log("------------------rock and roll baby")
console.log("num of clients: ",Object.keys(io.sockets.connected).length,Object.keys(io.sockets.connected))
  fs.watch(SettingsPath,(event, filename)=>{
    fs.readFile(SettingsPath, 'utf8', (err, data) => {
    
    if (!fsTimeout) {
      console.log("emit " , data)
     
      io.sockets.emit("NewTrade", data)
      fsTimeout = setTimeout(function() { fsTimeout=null }, 2000) // give 5 seconds for multiple events
  }else{
    console.log("not ok")
  }

    //socket.emit("NewTrade", data)
    //console.log("emit " , data, d- dateTime)
    // if ( d- dateTime > 2500){
    //   console.log("emit " , data, d- dateTime)
    //   socket.emit("NewTrade", data)
    // }else{
    //   console.log("cant " , d- dateTime)
    // }

    
    
    })
     
  });  
});



fs.writeFile(SettingsPath, "", function (err) {
  if (err) throw err;
  console.log("It's saved!");
});


