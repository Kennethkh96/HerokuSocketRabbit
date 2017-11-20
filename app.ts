import * as Express from 'express';
let app = Express();
import * as Http from 'http';
let http = new Http.Server(app);
import * as Socket from 'socket.io';
let io = Socket(http);

import * as amqp from 'amqplib/callback_api';
const PORT = (process.env.PORT || 3000);

const ex = "Rapid";
const RABBIT_SEND = "amqp://1doFhxuC:WGgk9kXy_wFIFEO0gwB_JiDuZm2-PrlO@black-ragwort-810.bigwig.lshift.net:10802/SDU53lDhKShK"
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
            conn.emit('SendMail', {status: 400, result: "data, template or email was undefined"});
            return;
        }

        let data = {
            data: mess.data,
            template: mess.template,
            email: mess.email
        }
        send(JSON.stringify(data), 'mailtag').catch((e) => {
            conn.emit('SendMail', {status: 500, result: ""});
            return;
        });

        receiveAndSend(['mailconfirmation'], conn, 'SendMail');
    });

    conn.on('GetAllTransactions', mess => {
        send('', 'lasgetalltrans').catch(e => {
            conn.emit("GetAllTransactions", {status: 500, result: ''});
            return;
        });

        receiveAndSend(['lasgetalltransconfirmation'], conn, 'GetAllTransactions');
    });

    conn.on('GetSingleTransaction', mess => {
        if (mess.id === undefined)
        {
            conn.emit('GetSingleTransaction', {status: 400, result: "id is required"});
            return;
        }

        send(mess.id, 'lasgettransaction').catch(e => {
            conn.emit('GetSingleTransaction', {status: 500, result: ""});
            return;
        });

        receiveAndSend(['lasgettransactionconfirmation'], conn, 'GetSingleTransaction');
    });

    conn.on('CreateTransaction', mess => {
        if (mess === undefined       || 
            mess.value === undefined || 
            mess.text === undefined  || 
            mess.date === undefined  || 
            mess.fk_category === undefined) 
        {
            conn.send('CreateTransaction', {status: 400, result: 'Missing values'});
            return;
        }

        send(mess, 'lascreatetransaction').catch(e => {
            conn.emit('CreateTransaction', {status: 500, result: ""});
            return;
        });

        receiveAndSend(['lascreatetransactionconfirmation'], conn, 'CreateTransaction');
    });

    conn.on('UpdateTransaction', mess => {
        if (mess === undefined       || 
            mess.value === undefined || 
            mess.text === undefined  || 
            mess.date === undefined  || 
            mess.id === undefined    ||
            mess.fk_category === undefined) 
        {
            conn.send('UpdateTransaction', {status: 400, result: 'Missing values'});
            return;
        }

        send(mess, 'lasupdatetransaction').catch(e => {
            conn.send('UpdateTransaction', {status: 500, result: ""});
            return;
        });

        receiveAndSend(['lasupdatetransactionconfirmation'], conn, 'UpdateTransaction');
    });

    conn.on('DeleteTransaction', mess => {
        if (mess === undefined || mess.id === undefined) 
        {
            conn.emit('DeleteTransaction', {status: 400, result: 'Missing values'});
            return;
        }

        send(mess, 'lasdeletetransaction').catch(e => {
            conn.emit('DeleteTransaction', {status: 500, result: ""});
            return;
        });

        receiveAndSend(['lasdeletetransactionconfirmation'], conn, 'DeleteTransaction');
    });

    conn.on('GetAllCategories', mess => {
        send('', 'lasgetallcategories').catch(e => {
            conn.emit('GetAllCategories', {status: 500, result: ""});
            return;
        });

        receiveAndSend(['lasgetallcategoriesconfirmation'], conn, 'GetAllCategories');
    });

    conn.on('GetCategory', mess => {
        if (mess === undefined || mess.id === undefined)
        {
            conn.emit('GetCategory', {status: 400, result: "id is required"});
            return;
        }

        send(mess, 'lasgetcategory').catch(e => {
            conn.emit('GetCategory', {status: 500, result: ""});
            return;
        });

        receiveAndSend(['lasgetcategoryconfirmation'], conn, 'GetCategory');
    });

    conn.on('CreateCategory', mess => {
        if (mess === undefined || mess.name === undefined || mess.parent === undefined)
        {
            conn.emit('CreateCategory', {status: 400, result: "Missing values"});
            return;
        }

        send(mess, 'lascreatecategory').catch(e => {
            conn.emit('CreateCategory', {status: 500, result: ""});
            return;
        });

        receiveAndSend(['lascreatecategoryconfirmation'], conn, 'CreateCategory');
    });

    conn.on('UpdateCategory', mess => {
        if (mess === undefined || mess.name === undefined || mess.parent === undefined || mess.id === undefined)
        {
            conn.emit('UpdateCategory', {status: 400, result: "Missing values"});
            return;
        }

        send(mess, 'lasupdatecategory').catch(e => {
            conn.emit('UpdateCategory', {status: 500, result: ""});
            return;
        });

        receiveAndSend(['lasupdatecategoryconfirmation'], conn, 'UpdateCategory');
    });

    conn.on('DeleteCategory', mess => {
        if (mess === undefined || mess.id === undefined)
        {
            conn.emit('DeleteCategory', {status: 400, result: "Missing values"});
            return;
        }

        send(mess, 'lasdeletecategory').catch(e => {
            conn.emit('DeleteCategory', {status: 500, result: ""});
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

function receiveAndSend(severity: string[], socket: SocketIO.Socket, channel: string )
{
    recieve(severity).then(res => {
        socket.emit(channel, JSON.parse("" + res));
    }).catch(e => {
        socket.send(channel, {status: 400, result: e});
    });
}


function send(msg: any, routingKey: string, mode: string = 'direct', durable: boolean = false) {
    return new Promise((resolve, reject) => {
        amqp.connect(RABBIT_SEND, (err, conn) => {
            if (err !== null) 
                reject(err);
    
            conn.createChannel((err, ch) => {
                ch.assertExchange(ex, mode, { durable });
    
                ch.publish(ex, routingKey, new Buffer(msg));
                console.log("Sent: " + msg);
                resolve();
                setTimeout(function() {
                    conn.close();
                }, 500);
            });
        });
    });
}

function recieve(severity: string[], mode: string = 'direct', durable: boolean = false, noAck: boolean = true) {
    return new Promise((resolve, reject) => {
        amqp.connect(RABBIT_RECEIVE, function (err: any, conn: any) {
            conn.createChannel(function (err: any, ch: any) {
                if (err !== null)
                    reject(err);

                ch.assertExchange(ex, mode, { durable });

                ch.assertQueue('', { exclusive: true }, function (err: any, q: any) {

                    severity.forEach(function (severityArg) {
                        ch.bindQueue(q.queue, ex, severityArg);
                    });
                    ch.consume(q.queue, function (msg: any) {
                        console.log("Recieved: " + msg.content.toString());
                        resolve(msg.content.toString());
                        conn.close();
                    }, { noAck });
                });
            });
        });
    });
}