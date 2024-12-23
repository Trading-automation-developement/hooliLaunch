var app = require('express')();
const http = require("http");
const socketIo = require("socket.io");
const server = http.createServer(app);
const io = socketIo(server); // Attach socket.io to the server

//Whenever someone connects this gets executed
io.on('connection', function(socket){
    console.log('A user connected');

    //Whenever someone disconnects this piece of code executed
    socket.on('disconnect', function () {
        console.log('A user disconnected');
    });
});

function starter(){
    // Add any initialization code here
}


server.listen(1111, function(){
    console.log('listening on port 1111');
});
