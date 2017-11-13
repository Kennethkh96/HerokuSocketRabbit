import * as Express from 'express';
let app = Express();
import * as Http from 'http';
let http = new Http.Server(app);
import * as Socket from 'socket.io';
let io = Socket(http);

/* app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    next();
}); */

app.get('/', (req, res) => {
    console.log("index");
    res.sendFile(__dirname + "/index.html");
});
app.get('/socket.io.slim.js', (req, res) => {
    res.sendFile(__dirname + "/socket.io.slim.js");
});

io.on('connection', conn => {
    console.log("new connection");
    conn.on('receive', mess => {
        console.log("new message received");
    });
    
    conn.on('message', mess => {
        console.log("new message: " + mess);
        // conn.broadcast.emit('new message', {username: mess.username, message: mess.message, id: conn.id});
    });
    
    conn.on('disconnect', () => {
        console.log("someone disconnected");
    }); 
});

io.on('message', (mess: any) => {
    console.log("new io mess: " + mess);
});

http.listen(3000, () => {
    console.log("listening on port 3000...");
});