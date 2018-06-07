/**
 * Created by zhangmiao on 2018/5/14.
 */

var utils = require("../util/utils");
var util = require("util");
var Receiver = require("./receiver");
var Sender = require("./sender");
var EventEmitter = require("events").EventEmitter;


var ST_INITED=1;
var ST_STARTED=2;
var ST_COLSED=3;

var kSimpleTcp = "_simpleTcp";

var curId = 0;

var SimpleTcp = function(opts){
    "use strict";
    EventEmitter.call(this);
    opts  = opts || {};
    this.straightSend = opts.straightSend;
    this.straightReceive = opts.straightReceive;
    this.state = ST_INITED;
    this.id = curId++ % 2147483648;
    this._receiver = null;
    this._sender   = null;
};

util.inherits(SimpleTcp, EventEmitter);

module.exports = SimpleTcp;

var pro = SimpleTcp.prototype;

pro.name = 'simpleTcp';
pro.setSocket = function(socket){
    //有一个连接就new 一个receiver
    var receiver = new Receiver({
        straightReceive : this.straightReceive
    });
    receiver[kSimpleTcp] = this;
    receiver.on("message", handleMessage);

    //
    var sender = new Sender(socket,{
        straightSend : this.straightSend
    });
    sender[kSimpleTcp] = this;

    socket[kSimpleTcp] = this;
    socket.on("data", socketOnData);
    socket.on("close", socketOnClose);
    socket.on("end", socketOnEnd);
    socket.on("error", socketOnError);
    this._receiver = receiver;
    this._sender = sender;
};

pro.send = function(data, cb){
    this._sender.send(data, cb);
};

pro.emitClose = function(){
    //发出close的事件
    this.emit('close');
};

var socketOnClose = function(){
    const simpleTcp = this[kSimpleTcp];

    this[kSimpleTcp] = undefined;
    simpleTcp.emitClose();
};

var socketOnEnd = function(){
    "use strict";
    const simpleTcp = this[kSimpleTcp];
    //simpleTcp.emitClose();
};

var socketOnError = function(){

};
var socketOnData = function(buffer){
    //收到了一个需要处理的数据
    this[kSimpleTcp]._receiver.add(buffer);
};

var handleMessage = function(message){
    const simpleTcp = this[kSimpleTcp];
    simpleTcp.emit("message", message);
};