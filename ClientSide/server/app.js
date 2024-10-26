const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const os = require("os");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");
const { checkMacAddressExists } = require("./mongoDBService.js");

const app = express();
const PORT = 2222;

const server = http.createServer(app); // Create HTTP server
const io = socketIo(server); // Attach socket.io to the server

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

const LOCAL_MEMORY = {
  destinations: ["Sim102"],
  server_ip: "127.0.0.1",
  allowed_clients: [],
  clients_connected: [],
  client_destinations: [],
  ComputerWindowsPath: `C:\\Users\\${os.userInfo().username}\\Documents\\NinjaTrader 8\\outgoing\\`,
};

io.on("connection", (socket) => {
  console.log("Client connected:", LOCAL_MEMORY.destinations);

  try {
    socket.emit("SendAllData", LOCAL_MEMORY);
  } catch (error) {
    console.error("Error sending data to client:", error);
  }

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });

  socket.on("DeleteDestination", (value) => {
    if (!value) {
      console.error("DeleteDestination received invalid value:", value);
      return;
    }
    console.log("Server DeleteDestination:", value);
    LOCAL_MEMORY.destinations = LOCAL_MEMORY.destinations.filter(
        (item) => item !== value
    );
    console.log("Updated Local Memory:", LOCAL_MEMORY);
  });

  socket.on("AddDestination", (value) => {
    if (!value) {
      console.error("AddDestination received invalid value:", value);
      return;
    }
    LOCAL_MEMORY.destinations.push(value);
    console.log("Server AddDestination:", LOCAL_MEMORY.destinations);
  });

  socket.on("TradeNow", (data) => {
    if (!isValidTradeData(data)) {
      console.error("Invalid trade data:", data);
      return;
    }

    console.log("TradeNow:", data, new Date());
    LOCAL_MEMORY.destinations.forEach((destination) => {
      console.log("Copy same trade to:", destination);
      executeTrade(data, destination);
    });
    console.log("Finish Trade");
  });
});

function isValidTradeData(data) {
  return typeof data === "string" && data.split(";").length === 2;
}

let CurrentValues = {};
const PrevFunction = {
  Sim102: { action: "FLAT", Amount: 0 },
  Sim101: { action: "FLAT", Amount: 0 },
};

let lastTradeDate = new Date();

function executeTrade(order, account) {
  const currentDate = new Date();

  if (currentDate - lastTradeDate < 2000) {
    console.log("Trade blocked: Too soon after last trade.");
    return;
  }

  CurrentValues["action"] = parseAction(order);
  CurrentValues["Amount"] = parseAmount(order);
  console.log("Current vs Previous:", PrevFunction, CurrentValues);

  let action = CurrentValues["action"];
  let amount = parseInt(CurrentValues["Amount"]) - PrevFunction[account]["Amount"];

  if (amount < 0) {
    action = action.includes("BUY") ? "SELL" : "BUY";
    amount = -amount;
  }

  const filePath = `C:\\Users\\${os.userInfo().username}\\Documents\\NinjaTrader 8\\incoming\\oif.${uuidv4()}.txt`;
  const marketOrder = `PLACE;${account};NQ 09-24;${action};${amount};MARKET;;DAY;;;;`;

  let orderCommand = CurrentValues["action"].includes("FLAT")
      ? `CLOSEPOSITION;${account};NQ 09-24;;;;;;;;;;`
      : marketOrder;

  try {
    fs.writeFileSync(filePath, orderCommand);
    console.log(`Order written to ${filePath}`);
  } catch (err) {
    console.error("Error writing order file:", err);
  }

  PrevFunction[account] = { action: CurrentValues["action"], Amount: parseInt(CurrentValues["Amount"]) };
  lastTradeDate = currentDate;
}

function parseAction(data) {
  return data.includes("FLAT") ? "FLAT" : data.includes("LONG") ? "BUY" : "SELL";
}

function parseAmount(data) {
  return data.split(";")[1];
}

function handleShutdown() {
  console.log("Shutting down server...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
}

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

function start() {
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = { start };