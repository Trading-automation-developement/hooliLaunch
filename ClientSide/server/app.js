const express = require("express");
const cookieParser = require("cookie-parser");
const fs = require('fs'); // Corrected: using fs.promises
const fsp = fs.promises;
const cors = require("cors");
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const {  checkMacAddressExists } = require('./mongoDBService.js');
const app = express();
const PORT = 2222;
const io = require('socket.io')(PORT);


app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

LOCAL_MEMORY={
  "destinations": [
    "Sim102",
  ],
  "server_ip": "185.241.5.114",
  "allowed_clients": [],
  
  "clients_connected": [],
  "client_destinations": [
  ],
  "ComputerWindowsPAth": "C:\\Users\\"+os.userInfo().username+"\\Documents\\NinjaTrader 8\\outgoing\\",  
}

const SettingsPath = `${LOCAL_MEMORY.ComputerWindowsPAth}NQ 06-24 Globex_${LOCAL_MEMORY.source}_position.txt`;

io.on('connection', (socket) => {
  console.log('Client connected -CLIENT SERVER SIDE',LOCAL_MEMORY.destinations );
  socket.emit("SendAllData", LOCAL_MEMORY)

  socket.on('disconnect', () => {
      console.log('Client disconnected');
  });

socket.on('DeleteDestination', (value) => {
  console.log('Server DeleteDestination', value);
  LOCAL_MEMORY.destinations = LOCAL_MEMORY.destinations.filter(item => item !== value);
  console.log("new Local memory", LOCAL_MEMORY)
});
socket.on('AddDestination', (value) => {
  LOCAL_MEMORY.destinations.push(value);
  console.log('Server UpdateDestination', LOCAL_MEMORY.destinations);
});

socket.on('TradeNow', (data) => {
  console.log('TradeNow', data, new Date());
  for(var key in LOCAL_MEMORY.destinations ){
    console.log("Copy same trade to -",LOCAL_MEMORY.destinations[key] )
    FuctionForTrade(data, LOCAL_MEMORY.destinations[key])
  }
  console.log('Finish Trade');
});
});

let Currentvalues = {};
let PrevFunction = {
  "Sim102":{
      'action': "FLAT",
      'Amount': 0
  },
  "Sim101":{
    'action': "FLAT",
    'Amount': 0
  }
};

var dateOfLastTrade=new Date();
const FuctionForTrade=(order, nameofAccount)=>{
  var newDate= new Date();

  if(newDate - dateOfLastTrade< 2000)
    {
      console.log("stopppppppppppppppppppppppppppppp")
      return
    }
  
  Currentvalues['action'] =returnAction(order)
  Currentvalues['Amount'] = returnAmount(order)
  console.log("--> ",PrevFunction, Currentvalues)

  var action= Currentvalues["action"];
  var amount= parseInt(Currentvalues['Amount'])-  PrevFunction[nameofAccount]['Amount'];

  if (parseInt(Currentvalues['Amount']) - PrevFunction[nameofAccount]["Amount"] < 0){
    
    action = action.includes("BUY") ? "SELL" : "BUY";
    amount = -amount ;
  }

  const path =  "C:\\Users\\gnach\\Documents\\NinjaTrader 8\\incoming\\oif." +  uuidv4() + ".txt";
  const mrkt = "PLACE;"+nameofAccount+";<INS>;<ACT>;<QTY>;MARKET;<LIMIT>;;DAY;;;;";
  var ordr = mrkt.replace("<INS>","NQ 06-24").replace("<ACT>",action).replace("<QTY>",amount);
  if( Currentvalues['action'].includes("FLAT")){
     ordr = "CLOSEPOSITION;<ACCOUNT>;<INSTRUMENT>;;;;;;;;;;".replace("<ACCOUNT>",nameofAccount).replace("<INSTRUMENT>","NQ 06-24");
  }
  //console.log("amount ", amount)
 // console.log("path ", path);
 // console.log("ord ", ordr);
  fs.writeFileSync(path,ordr);
  PrevFunction[nameofAccount]['action'] = Currentvalues['action']
  PrevFunction[nameofAccount]['Amount'] = parseInt(Currentvalues['Amount'])

  dateOfLastTrade= newDate;
  return null;
}

const returnAction = (data) => {  
return data.includes('FLAT')? 'FLAT' :(data.includes('LONG') ? 'BUY': 'SELL');
};

const returnAmount = (data) => {
return data.split(';')[1];
};