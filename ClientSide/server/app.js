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
  "destinations": [["Bar","Sim102"]],
  "ComputerWindowsPAth": "C:\\Users\\"+os.userInfo().username+"\\Documents\\NinjaTrader 8\\outgoing\\",  
}


io.on('connection', (socket) => {
  //console.log('Client connected -CLIENT SERVER SIDE',LOCAL_MEMORY.destinations, socket.handshake.headers.host );
  socket.emit("SendAllData", LOCAL_MEMORY.destinations)

  socket.on('disconnect', () => {
      console.log('Client disconnected');
  });

socket.on('DeleteDestination', (value) => {
  console.log('Server DeleteDestination', value);
  LOCAL_MEMORY.destinations = LOCAL_MEMORY.destinations.filter( 
    item => !(item[0] === value["trader"] && item[1] === value["destination"])
);
  console.log("new Local memory", LOCAL_MEMORY)
});
socket.on('AddDestination', (value) => {
  console.log("AddDestination", value[0], value[1])
  LOCAL_MEMORY.destinations.push(value);
  console.log('Server UpdateDestination', LOCAL_MEMORY.destinations);
  socket.emit("SendAllData", LOCAL_MEMORY.destinations)

});

socket.on('TradeNow', (data) => {
  console.log(LOCAL_MEMORY.destinations);
  console.log("--------")
  console.log('TradeNow', data["d"], data["INS"],data["trader"], new Date(), Currentvalues);
  for(var key in LOCAL_MEMORY.destinations ){
    if(data["trader"]==LOCAL_MEMORY.destinations[key][0]){
      console.log("->",LOCAL_MEMORY.destinations[key][0]);
    console.log("Copy same trade to -",LOCAL_MEMORY.destinations[key][0] )
    FuctionForTrade(data["d"], LOCAL_MEMORY.destinations[key][1], data["INS"])
    }else{
      console.log("no for ",LOCAL_MEMORY.destinations[key][0]);
    }
  }
  //console.log('Finish Trade', PrevFunction, Currentvalues);
  console.log('------------------------------------------------------------');
});
});


let Currentvalues = {};
var dateOfLastTrade=new Date();
let PrevFunction = {
  "MNQ 03-25":{

    "Sim102":{
        'action': "FLAT",
        'Amount': 0
    },
    "Sim103":{
      'action': "FLAT",
      'Amount': 0
  },
},
"NQ 03-25":{

  "Sim102":{
      'action': "FLAT",
      'Amount': 0
  },
  "Sim103":{
    'action': "FLAT",
    'Amount': 0
},
},
"MES 03-25":{
  "APEX-36565-26":{
    'action': "FLAT",
    'Amount': 0
},

  "Sim102":{
      'action': "FLAT",
      'Amount': 0
  },
  "Sim103":{
    'action': "FLAT",
    'Amount': 0
},
"Sim104":{
  'action': "FLAT",
  'Amount': 0
},
},
"ES 03-25":{
  "Sim102":{
      'action': "FLAT",
      'Amount': 0
  },
  "Sim103":{
    'action': "FLAT",
    'Amount': 0
},
"Sim104":{
  'action': "FLAT",
  'Amount': 0
},
}

};

const FuctionForTrade=(order, nameofAccount,INS)=>{
  var newDate= new Date();

  // if(newDate - dateOfLastTrade< 2000)
  //   {
  //     console.log("stopppppppppppppppppppppppppppppp")
  //     return
  //   }
  try{

    console.log("FuctionForTrade",order, nameofAccount,INS )
    const path =  "C:\\Users\\"+os.userInfo().username+"\\Documents\\NinjaTrader 8\\incoming\\oif." +  uuidv4() + ".txt";
    const mrkt = "PLACE;"+nameofAccount+";<INS>;<ACT>;<QTY>;MARKET;<LIMIT>;;DAY;;;;";
    var ordr;

  var updated_ins=INS;
  if(updated_ins.includes("SEP24")){
    updated_ins = updated_ins.replace("SEP24", "03-25")
    console.log("new ins is", updated_ins)
  }

  if(updated_ins.includes("DEC24")){
    updated_ins = updated_ins.replace("DEC24", "03-25")
    console.log("new ins is", updated_ins)
  }
  if(updated_ins.includes("MAR25")){
    updated_ins = updated_ins.replace("MAR25", "03-25")
    console.log("new ins is", updated_ins)
  }

  

    if(!PrevFunction[updated_ins].hasOwnProperty(nameofAccount)){
      console.log("INS", INS, nameofAccount, "NOT IN PREV")

      PrevFunction[updated_ins][nameofAccount] = {
        'action': "FLAT",
        'Amount': 0
    };
      console.log("new prev", PrevFunction)

    }

    Currentvalues['action'] =returnAction(order)
    Currentvalues['Amount'] = returnAmount(order)


    if( Currentvalues['action']==("FLAT")){
      ordr = "CLOSEPOSITION;<ACCOUNT>;<INSTRUMENT>;;;;;;;;;;".replace("<ACCOUNT>",nameofAccount).replace("<INSTRUMENT>",updated_ins);
      console.log("ordr ", ordr);
      fs.writeFileSync(path,ordr);
      PrevFunction[updated_ins][nameofAccount]['action'] = Currentvalues['action']
      PrevFunction[updated_ins][nameofAccount]['Amount'] = parseInt(Currentvalues['Amount'])
      console.log("FLAT", updated_ins, nameofAccount, PrevFunction[updated_ins][nameofAccount])
      dateOfLastTrade= newDate;
      return null;
    }

 
  //console.log("--> ",INS,PrevFunction[INS], Currentvalues)

  var action= Currentvalues["action"];
  var amount= parseInt(Currentvalues['Amount'])-  PrevFunction[updated_ins][nameofAccount]['Amount'];

  if (parseInt(Currentvalues['Amount']) - PrevFunction[updated_ins][nameofAccount]["Amount"] < 0){
   
    action = action.includes("BUY") ? "SELL" : "BUY";
    amount = -amount ;
  }
 
  ordr = mrkt.replace("<INS>",updated_ins).replace("<ACT>",action).replace("<QTY>",amount);
  fs.writeFileSync(path,ordr);
  PrevFunction[updated_ins][nameofAccount]['action'] = Currentvalues['action']
  PrevFunction[updated_ins][nameofAccount]['Amount'] = parseInt(Currentvalues['Amount'])

  dateOfLastTrade= newDate;
  return null;
}catch (error) {
  console.error("error", error);
  // Expected output: ReferenceError: nonExistentFunction is not defined
  // (Note: the exact output may be browser-dependent)
}
}

const returnAction = (data) => {  
return data.includes('FLAT')? 'FLAT' :(data.includes('LONG') ? 'BUY': 'SELL');
};

const returnAmount = (data) => {
return data.split(';')[1];
};

