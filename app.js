"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Express = require("express");
let app = Express();
const Http = require("http");
let http = new Http.Server(app);
const Socket = require("socket.io");
let io = Socket(http);
const amqp = require("amqplib/callback_api");
const PORT = (process.env.PORT || 3000);
const ex = "Rapid";
const RABBIT_SEND = "amqp://1doFhxuC:WGgk9kXy_wFIFEO0gwB_JiDuZm2-PrlO@black-ragwort-810.bigwig.lshift.net:10802/SDU53lDhKShK";
const RABBIT_RECEIVE = "amqp://1doFhxuC:WGgk9kXy_wFIFEO0gwB_JiDuZm2-PrlO@black-ragwort-810.bigwig.lshift.net:10803/SDU53lDhKShK";
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.get('/socket.io.slim.js', (req, res) => {
    res.sendFile(__dirname + '/socket.io.slim.js');
});
io.on('connection', conn => {
    console.log("new connection");
    conn.on('SendMail', mess => {
        if (mess.data === undefined || mess.template === undefined || mess.email === undefined) {
            conn.emit('SendMail', { status: 400, result: "data, template or email was undefined" });
            return;
        }
        let data = {
            data: mess.data,
            template: mess.template,
            email: mess.email
        };
        send(JSON.stringify(data), 'mailtag').catch((e) => {
            conn.emit('SendMail', { status: 500, result: "" });
            return;
        });
        receiveAndSend(['mailconfirmation'], conn, 'SendMail');
    });
    conn.on('GetAllTransactions', mess => {
        send('', 'lasgetalltrans').catch(e => {
            conn.emit("GetAllTransactions", { status: 500, result: '' });
            return;
        });
        receiveAndSend(['lasgetalltransconfirmation'], conn, 'GetAllTransactions');
    });
    conn.on('GetSingleTransaction', mess => {
        if (mess.id === undefined) {
            conn.send('GetSingleTransaction', { status: 400, result: "id is required" });
            return;
        }
        send(mess.id, 'lasgettransaction').catch(e => {
            conn.send('GetSingleTransaction', { status: 500, result: "" });
            return;
        });
        receiveAndSend(['lasgettransactionconfirmation'], conn, 'GetSingleTransaction');
    });
    conn.on('CreateTransaction', mess => {
        if (mess === undefined ||
            mess.value === undefined ||
            mess.text === undefined ||
            mess.date === undefined ||
            mess.fk_category === undefined) {
            conn.send('CreateTransaction', { status: 400, result: 'Missing values' });
            return;
        }
        send(mess, 'lascreatetransaction').catch(e => {
            conn.send('CreateTransaction', { status: 500, result: "" });
            return;
        });
        receiveAndSend(['lascreatetransactionconfirmation'], conn, 'CreateTransaction');
    });
    conn.on('UpdateTransaction', mess => {
        if (mess === undefined ||
            mess.value === undefined ||
            mess.text === undefined ||
            mess.date === undefined ||
            mess.id === undefined ||
            mess.fk_category === undefined) {
            conn.send('UpdateTransaction', { status: 400, result: 'Missing values' });
            return;
        }
        send(mess, 'lasupdatetransaction').catch(e => {
            conn.send('UpdateTransaction', { status: 500, result: "" });
            return;
        });
        receiveAndSend(['lasupdatetransactionconfirmation'], conn, 'UpdateTransaction');
    });
    conn.on('DeleteTransaction', mess => {
        if (mess === undefined || mess.id === undefined) {
            conn.send('DeleteTransaction', { status: 400, result: 'Missing values' });
            return;
        }
        send(mess, 'lasdeletetransaction').catch(e => {
            conn.send('DeleteTransaction', { status: 500, result: "" });
            return;
        });
        receiveAndSend(['lasdeletetransactionconfirmation'], conn, 'DeleteTransaction');
    });
    conn.on('GetAllCategories', mess => {
        send('', 'lasgetallcategories').catch(e => {
            conn.send('GetAllCategories', { status: 500, result: "" });
            return;
        });
        receiveAndSend(['lasgetallcategoriesconfirmation'], conn, 'GetAllCategories');
    });
    conn.on('disconnect', () => {
        console.log("someone disconnected");
    });
});
http.listen(PORT, () => {
    console.log("listening on port %s...", PORT);
});
function receiveAndSend(severity, socket, channel) {
    recieve(severity).then(res => {
        socket.emit(channel, JSON.parse("" + res));
    }).catch(e => {
        socket.send(channel, { status: 400, result: e });
    });
}
function send(msg, routingKey, mode = 'direct', durable = false) {
    return new Promise((resolve, reject) => {
        amqp.connect(RABBIT_SEND, (err, conn) => {
            if (err !== null)
                reject(err);
            conn.createChannel((err, ch) => {
                ch.assertExchange(ex, mode, { durable });
                ch.publish(ex, routingKey, new Buffer(msg));
                console.log("Sent: " + msg);
                resolve();
                setTimeout(function () {
                    conn.close();
                }, 500);
            });
        });
    });
}
function recieve(severity, mode = 'direct', durable = false, noAck = true) {
    return new Promise((resolve, reject) => {
        amqp.connect(RABBIT_RECEIVE, function (err, conn) {
            conn.createChannel(function (err, ch) {
                if (err !== null)
                    reject(err);
                ch.assertExchange(ex, mode, { durable });
                ch.assertQueue('', { exclusive: true }, function (err, q) {
                    severity.forEach(function (severityArg) {
                        ch.bindQueue(q.queue, ex, severityArg);
                    });
                    ch.consume(q.queue, function (msg) {
                        console.log("Recieved: " + msg.content.toString());
                        resolve(msg.content.toString());
                        conn.close();
                    }, { noAck });
                });
            });
        });
    });
}
