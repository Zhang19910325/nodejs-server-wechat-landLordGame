/**
 * Created by zhangmiao on 2018/5/7.
 */
var EventEmitter = require("events").EventEmitter;
var Receiver  = require("../common/buffer/receiver");
var util = require("util");
var RecvPacket = require("../common/model/recvPacket");

var ST_INITED = 0;
var ST_WAIT_ACK = 1;
var ST_WORKING = 2;
var ST_CLOSED = 3;

var Socket = function(id, socket, opts){
    EventEmitter.call(this);
    opts = opts || {};
    this.id = id;
    this.socket = socket;

    this.remoteAddress = {
        ip : socket._socket.remoteAddress,
        port : socket._socket.remotePort
    };

    var self = this;

    this.receiver = opts.receiver;
    if(!this.receiver){
        this.receiver = new Receiver();
    }
    this.receiver.on("message", function(buf){
        var msg = RecvPacket.decode(buf);
        self.emit('message', msg);
    });

    socket.once('close', this.emit.bind(this, 'disconnect'));
    socket.on('error', this.emit.bind(this, 'error'));
    socket.on('message', function(msg){
        if (msg) {
            self.receiver.add(msg);
        }
    });

    this.state = ST_INITED;
};

util.inherits(Socket, EventEmitter);

module.exports = Socket;

Socket.prototype.send = function(msg){
    if(msg instanceof String){
        msg = new Buffer(msg);
    }
    else if (msg instanceof RecvPacket){
        msg = msg.msg;
    }
    this.socket.send(msg, {binary:true},function(err){
       if(!!err){
           console.error('websocket send 失败', err.stack);
       }
    });
};

Socket.prototype.disconnect = function(){
    if(this.state === ST_CLOSED){
        return;
    }

    this.state = ST_CLOSED;
    this.socket.emit('close');
    this.socket.close();
};
