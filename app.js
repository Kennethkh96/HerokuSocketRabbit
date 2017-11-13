"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Express = require("express");
var app = Express();
var Http = require("http");
var http = new Http.Server(app);
var Socket = require("socket.io");
var io = Socket(http);
/* app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    next();
}); */
app.get('/', function (req, res) {
    console.log("index");
    res.sendFile(__dirname + "/index.html");
});
app.get('/socket.io.slim.js', function (req, res) {
    res.sendFile(__dirname + "/socket.io.slim.js");
});
io.on('connection', function (conn) {
    console.log("new connection");
    conn.on('receive', function (mess) {
        console.log("new message received");
    });
    conn.on('message', function (mess) {
        console.log("new message: " + mess);
        // conn.broadcast.emit('new message', {username: mess.username, message: mess.message, id: conn.id});
    });
    conn.on('disconnect', function () {
        console.log("someone disconnected");
    });
});
io.on('message', function (mess) {
    console.log("new io mess: " + mess);
});
http.listen(3000, function () {
    console.log("listening on port 3000...");
});
