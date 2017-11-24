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
let obj = {
    data: {
        x: 't',
    },
    template: 'asdsadsad [[x]]',
    email: 'kennethkh96@gmail.com'
};
io.on('connection', conn => {
    console.log("new connection");
    conn.on('GetImage', mess => {
        if (mess === null || mess.Text === undefined) {
            conn.emit('GetImage', { Status: 400, Result: "message or text is missing" });
            return;
        }
        send(mess.Text, 'LasseImage').catch(e => {
            conn.emit('GetImage', { Status: 500, Result: "" });
            return;
        });
        receiveAndSend(['LasseImageResp'], conn, 'GetImage');
    });
    conn.on('SendMail', mess => {
        if (mess.data === undefined || mess.template === undefined || mess.email === undefined) {
            conn.emit('SendMail', { Status: 400, Result: "data, template or email was undefined" });
            return;
        }
        let data = {
            data: mess.data,
            template: mess.template,
            email: mess.email
        };
        send(JSON.stringify(data), 'mailtag').catch((e) => {
            conn.emit('SendMail', { Status: 500, Result: "" });
            return;
        });
        receiveAndSend(['mailconfirmation'], conn, 'SendMail');
    });
    conn.on('GetAllTransactions', mess => {
        send('', 'lasgetalltrans').catch(e => {
            conn.emit("GetAllTransactions", { Status: 500, Result: '' });
            return;
        });
        receiveAndSend(['lasgetalltransconfirmation'], conn, 'GetAllTransactions');
    });
    conn.on('GetSingleTransaction', mess => {
        if (mess.Id === undefined) {
            conn.emit('GetSingleTransaction', { Status: 400, Result: "id is required" });
            return;
        }
        send(JSON.stringify(mess), 'lasgettransaction').catch(e => {
            conn.emit('GetSingleTransaction', { Status: 500, Result: "" });
            return;
        });
        receiveAndSend(['lasgettransactionconfirmation'], conn, 'GetSingleTransaction');
    });
    conn.on('CreateTransaction', mess => {
        if (mess === undefined ||
            mess.Value === undefined ||
            mess.Text === undefined ||
            mess.Date === undefined ||
            mess.FK_Category === undefined) {
            conn.emit('CreateTransaction', { Status: 400, Result: 'Missing values' });
            return;
        }
        send(JSON.stringify(mess), 'lascreatetransaction').catch(e => {
            conn.emit('CreateTransaction', { Status: 500, Result: "" });
            return;
        });
        receiveAndSend(['lascreatetransactionconfirmation'], conn, 'CreateTransaction');
    });
    conn.on('UpdateTransaction', mess => {
        if (mess === undefined ||
            mess.Value === undefined ||
            mess.Text === undefined ||
            mess.Date === undefined ||
            mess.Id === undefined ||
            mess.FK_Category === undefined) {
            conn.emit('UpdateTransaction', { Status: 400, Result: 'Missing values' });
            return;
        }
        send(mess, 'lasupdatetransaction').catch(e => {
            conn.emit('UpdateTransaction', { Status: 500, Result: "" });
            return;
        });
        receiveAndSend(['lasupdatetransactionconfirmation'], conn, 'UpdateTransaction');
    });
    conn.on('DeleteTransaction', mess => {
        if (mess === undefined || mess.Id === undefined) {
            conn.emit('DeleteTransaction', { Status: 400, Result: 'Missing values' });
            return;
        }
        send(mess, 'lasdeletetransaction').catch(e => {
            conn.emit('DeleteTransaction', { Status: 500, Result: "" });
            return;
        });
        receiveAndSend(['lasdeletetransactionconfirmation'], conn, 'DeleteTransaction');
    });
    conn.on('GetAllCategories', mess => {
        send('', 'lasgetallcategories').catch(e => {
            conn.emit('GetAllCategories', { Status: 500, Result: "" });
            return;
        });
        receiveAndSend(['lasgetallcategoriesconfirmation'], conn, 'GetAllCategories');
    });
    conn.on('GetCategory', mess => {
        if (mess === undefined || mess.id === undefined) {
            conn.emit('GetCategory', { Status: 400, Result: "id is required" });
            return;
        }
        send(mess, 'lasgetcategory').catch(e => {
            conn.emit('GetCategory', { Status: 500, Result: "" });
            return;
        });
        receiveAndSend(['lasgetcategoryconfirmation'], conn, 'GetCategory');
    });
    conn.on('CreateCategory', mess => {
        if (mess === undefined || mess.name === undefined || mess.parent === undefined) {
            conn.emit('CreateCategory', { Status: 400, Result: "Missing values" });
            return;
        }
        send(mess, 'lascreatecategory').catch(e => {
            conn.emit('CreateCategory', { Status: 500, Result: "" });
            return;
        });
        receiveAndSend(['lascreatecategoryconfirmation'], conn, 'CreateCategory');
    });
    conn.on('UpdateCategory', mess => {
        if (mess === undefined || mess.name === undefined || mess.parent === undefined || mess.id === undefined) {
            conn.emit('UpdateCategory', { Status: 400, Result: "Missing values" });
            return;
        }
        send(mess, 'lasupdatecategory').catch(e => {
            conn.emit('UpdateCategory', { Status: 500, Result: "" });
            return;
        });
        receiveAndSend(['lasupdatecategoryconfirmation'], conn, 'UpdateCategory');
    });
    conn.on('DeleteCategory', mess => {
        if (mess === undefined || mess.id === undefined) {
            conn.emit('DeleteCategory', { Status: 400, Result: "Missing values" });
            return;
        }
        send(mess, 'lasdeletecategory').catch(e => {
            conn.emit('DeleteCategory', { Status: 500, Result: "" });
            return;
        });
        receiveAndSend(['lasdeletecategoryconfirmation'], conn, 'DeleteCategory');
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
        console.log("sending success to socket");
        let result = JSON.parse("" + res);
        console.log("sending: " + JSON.stringify(result, null, 4) + " to socket");
        socket.emit(channel, result);
    }).catch(e => {
        console.log("error");
        console.log(JSON.stringify(e, null, 4));
        console.log("sending error to socket");
        socket.emit(channel, { Status: 400, Result: e });
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
                ch.assertQueue('lasheroku', { exclusive: false }, function (err, q) {
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
