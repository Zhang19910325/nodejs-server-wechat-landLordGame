/**
 * Created by zhangmiao on 2018/5/14.
 */
var Net = require("net");
var utils = require("../util/utils");
var util = require("util");
var EventEmitter = require("events").EventEmitter;
var TcpSocket = require("./simpleTcp");

var ST_INITED=1;
var ST_STARTED=2;
var ST_COLSED=3;

var tcpServer = "__tcpServer";

var Server = function(opts){
    "use strict";
    EventEmitter.call(this);
    opts = opts || {};
    this.straightSend = opts.straightSend;
    this.straightReceive = opts.straightReceive;
    this.state = ST_INITED;
};



util.inherits(Server, EventEmitter);

module.exports = Server;

var pro = Server.prototype;

pro.listen = function(port, cb){
    if(this.state > ST_INITED){
        utils.invokeCallback(cb, new Error("已经开始监听了"));
        return;
    }
    var  self = this;
    this.state = ST_STARTED;
    //这里需要进行状态的判定
    var  netServer = Net.createServer().listen(port, '0.0.0.0');

    netServer.on("connection", function(socket){
        //构建一个tcpSocket
        var tcpSocket = new TcpSocket({
            straightSend : self.straightSend,
            straightReceive : self.straightReceive
        });
        tcpSocket.setSocket(socket);
        self.emit("connection", tcpSocket);
    });
    netServer.on("error",function(err){
        //收到一个服务器错误
        console.log("收到一个服务器错误:",err);
    });
    netServer.on('close',function(){
        //所有的连接都关闭时，这个会触发
    });
    netServer.once('listening', function(){
        utils.invokeCallback(cb);
        self.emit("listening");
    });
};


