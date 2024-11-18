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


var fsTimeout;
LOCAL_MEMORY={
"couter":0,
"trader1":"Bar",
"source1": "SimBar",
"trader2":"Omer",
"source2":"SimOmer",
  "destinations": [
    "Sim102"
  ],
  "approveMAC": [
    "00:50:56:3f:ee:07",
    "4c:5f:70:9d:16:c9"
  ],
  "ComputerWindowsPAth": "C:\\Users\\"+os.userInfo().username+"\\Documents\\NinjaTrader 8\\outgoing\\",
}
const list_of_trader={
  "Bar":"Sim101",
  "Omer":"Sim102"
}
//const SettingsPath = `${LOCAL_MEMORY.ComputerWindowsPAth}NQ 12-24 Globex_${LOCAL_MEMORY.source}_position.txt`;
//bar
const SettingsPathNQ = `${LOCAL_MEMORY.ComputerWindowsPAth}NQ 12-24 Globex_${LOCAL_MEMORY.source1}_position.txt`;
const SettingsPathES = `${LOCAL_MEMORY.ComputerWindowsPAth}ES 12-24 Globex_${LOCAL_MEMORY.source1}_position.txt`;
const SettingsPathMNQ = `${LOCAL_MEMORY.ComputerWindowsPAth}MNQ 12-24 Globex_${LOCAL_MEMORY.source1}_position.txt`;
const SettingsPathMES = `${LOCAL_MEMORY.ComputerWindowsPAth}MES 12-24 Globex_${LOCAL_MEMORY.source1}_position.txt`;


//-----omer

const SettingsPathNQ2 = `${LOCAL_MEMORY.ComputerWindowsPAth}NQ 12-24 Globex_${LOCAL_MEMORY.source2}_position.txt`;
const SettingsPathES2= `${LOCAL_MEMORY.ComputerWindowsPAth}ES 12-24 Globex_${LOCAL_MEMORY.source2}_position.txt`;
const SettingsPathMNQ2 = `${LOCAL_MEMORY.ComputerWindowsPAth}MNQ 12-24 Globex_${LOCAL_MEMORY.source2}_position.txt`;
const SettingsPathMES2 = `${LOCAL_MEMORY.ComputerWindowsPAth}MES 12-24 Globex_${LOCAL_MEMORY.source2}_position.txt`;


const PATH_Trader1 = [SettingsPathNQ,SettingsPathES,SettingsPathMNQ,SettingsPathMES ]
const PATH_Trader2 = [  SettingsPathNQ2,SettingsPathES2,SettingsPathMNQ2,SettingsPathMES2 ]

var users={
  "83.229.81.169:2666":"ClientYuvalTrial",
  '127.0.0.1:2666': "React local",
  '::ffff:185.241.5.114':"Algo Old",
  '::ffff:176.12.176.240':"Inor",
  "::ffff:46.120.182.108":" Inor 2",
  "::ffff:212.143.98.37":"Edo"
}
var connected = new Set([]);


// try{
//   PATH_Trader1.forEach(element => {
//     fs.writeFile(element, "", function (err) {
//       if (err) throw err;
//       console.log("It's saved!");
//     });
//   });
//   }catch(e){
//     console.log("error in paths")
//   }


io.on('connection', (socket) => {


  if(socket.request.headers.host in users  ){
    console.log('connected:' ,connected.has(socket.request.headers),socket.request.headers.host, connected);
    connected.add(socket.request.headers.host)
  }else{
    return;
    console.log('unknown:', socket.request.headers.host);
    
  }
  socket.emit("SendAllData", LOCAL_MEMORY)

  socket.on("connect", () => {
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx
  });
  socket.on('disconnect', (socket) => {
    console.log('Client disconnected', socket);

  
});

io.on('UpdateSource', (value) => {
  console.log("UpdateSource", value)
  LOCAL_MEMORY.source1= value;
});

  // io.on('disconnect', (socket) => {
  //     console.log('Client disconnected:', socket.request.headers.host);
  // });
  


//console.log("------------------rock and roll baby")
Object.values(io.sockets.connected).forEach(socket => {
  const ip = socket.handshake.address; // כתובת ה-IP
  const id = socket.id;               // מזהה ייחודי של הסוקט
  console.log(`Client ID: ${id}, IP Address: ${ip} , num of clients ${Object.keys(io.sockets.connected).length}`);
});
//console.log("num of clients: ",Object.keys(io.sockets.connected).length)//,Object.keys(io.sockets.connected))

fs.watch(SettingsPathNQ,(event, filename)=>{
    fs.readFile(SettingsPathNQ, 'utf8', (err, data) => {
    console.log("fs ",data, fsTimeout)
    if (data) {
      var myObject = {
        d: data.trim(),
        INS:"NQ 12-24",
        trader:LOCAL_MEMORY.trader1
    }
      console.log("emit NQ " , myObject)
      io.sockets.emit("NewTrade", myObject)
      fsTimeout = setTimeout(function() { fsTimeout=null }, 2000) 
  }else{
    console.log("not ok NQ")
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

  fs.watch(SettingsPathES,(event, filename)=>{
    fs.readFile(SettingsPathES, 'utf8', (err, data) => {
    
      console.log("fs ",data)
      if (data) {
        var myObject = {
          d: data.trim(),
          INS:"ES 12-24",
          trader:LOCAL_MEMORY.trader1
        }
      console.log("emit ES " , myObject)
     io.sockets.emit("NewTrade", myObject)
      fsTimeout = setTimeout(function() { fsTimeout=null }, 100) 
  }else{
    console.log("not ok ES")
  }
  
    
    })
     
  }); 
  
  fs.watch(SettingsPathMNQ,(event, filename)=>{
    fs.readFile(SettingsPathMNQ, 'utf8', (err, data) => {
    
      console.log("fs ",data)
      if (data) {
        var myObject = {
          d: data.trim(),
          INS:"MNQ 12-24",
          trader:LOCAL_MEMORY.trader1
        }
      console.log("emit MNQ " , myObject)
     io.sockets.emit("NewTrade", myObject)
      fsTimeout = setTimeout(function() { fsTimeout=null }, 100) 
  }else{
    console.log("not ok MNQ")
  }
  
    
    })
     
  }); 
  
  fs.watch(SettingsPathMES,(event, filename)=>{
    fs.readFile(SettingsPathMES, 'utf8', (err, data) => {
    
      console.log("fs ",data)
      if (data) {
        var myObject = {
          d: data.trim(),
          INS:"MES 12-24",
          trader:LOCAL_MEMORY.trader1
        }
      console.log("emit MES " , myObject)
     io.sockets.emit("NewTrade", myObject)
      fsTimeout = setTimeout(function() { fsTimeout=null }, 100) 
  }else{
    console.log("not ok MES")
  }
    
    })
     
  }); 



  //-----------



  fs.watch(SettingsPathNQ2,(event, filename)=>{
    fs.readFile(SettingsPathNQ2, 'utf8', (err, data) => {
    console.log(data)
    if (data) {
      var myObject = {
        d: data.trim(),
        INS:"NQ 12-24",
        trader:LOCAL_MEMORY.trader2
    }
      console.log("emit NQ " , myObject)
      io.sockets.emit("NewTrade", myObject)
      fsTimeout = setTimeout(function() { fsTimeout=null }, 100) 
  }else{
    console.log("not ok NQ")
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

  fs.watch(SettingsPathES2,(event, filename)=>{
    fs.readFile(SettingsPathES2, 'utf8', (err, data) => {
    
      console.log(data)
      if (data) {
        var myObject = {
          d: data.trim(),
          INS:"ES 12-24",
          trader:LOCAL_MEMORY.trader2
        }
      console.log("emit ES " , myObject)
     io.sockets.emit("NewTrade", myObject)
      fsTimeout = setTimeout(function() { fsTimeout=null }, 1000) 
  }else{
    console.log("not ok ES")
  }
  
    
    })
     
  }); 
  
  fs.watch(SettingsPathMNQ2,(event, filename)=>{
    fs.readFile(SettingsPathMNQ2, 'utf8', (err, data) => {
    
      console.log(data)
      if (data) {
        var myObject = {
          d: data.trim(),
          INS:"MNQ 12-24",
          trader:LOCAL_MEMORY.trader2
        }
      console.log("emit MNQ " , myObject)
     io.sockets.emit("NewTrade", myObject)
      fsTimeout = setTimeout(function() { fsTimeout=null }, 100) 
  }else{
    console.log("not ok MNQ")
  }
  
    
    })
     
  }); 
  
  fs.watch(SettingsPathMES2,(event, filename)=>{
    fs.readFile(SettingsPathMES2, 'utf8', (err, data) => {
    
      console.log(data)
      if (data) {
        var myObject = {
          d: data.trim(),
          INS:"MES 12-24",
          trader:LOCAL_MEMORY.trader2
        }
      console.log("emit MES " , myObject)
     io.sockets.emit("NewTrade", myObject)
      fsTimeout = setTimeout(function() { fsTimeout=null }, 200) 
  }else{
    console.log("not ok MES")
  }
    
    })
     
  }); 

});

// fs.watch(SettingsPathNQ,(event, filename)=>{
//   fs.readFile(SettingsPathNQ, 'utf8', (err, data) => {
  
//     console.log(data)
//     if (!fsTimeout & data!='') {
//       var myObject = {
//         d: data.trim(),
//         INS:"NQ 12-24"
//     }
//     console.log("emit NQ " , myObject)
//    io.sockets.emit("NewTrade", myObject)
//     fsTimeout = setTimeout(function() { fsTimeout=null }, 100) 
// }else{
//   console.log("not ok NQ")
// }

  
//   })
   
// }); 



// fs.writeFile(SettingsPathMES, "", function (err) {
//   if (err) throw err;
//   console.log("READY TO GO");
// });

// fs.writeFile(SettingsPathMNQ, "", function (err) {
//   if (err) throw err;
//   console.log("READY TO GO");
// });

// fs.writeFile(SettingsPathES, "", function (err) {
//   if (err) throw err;
//   console.log("READY TO GO");
// });

// fs.writeFile(SettingsPathNQ, "", function (err) {
//   if (err) throw err;
//   console.log("READY TO GO");
// });

