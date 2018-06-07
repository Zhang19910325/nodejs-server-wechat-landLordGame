/**
 * Created by zhangmiao on 2018/5/15.
 */

var util = require("util");
var EventsEmitter = require("events").EventEmitter;
var SimpleTcp = require("./simpleTcp");
var Net = require("net");


var SimpleTcpClient = function(opts){
    EventsEmitter.call(this);
    opts = opts || {};
    this.straightSend = opts.straightSend;
    this.straightReceive = opts.straightReceive;
    this.host = null;
    this.port = null;
};

util.inherits(SimpleTcpClient, EventsEmitter);

module.exports = SimpleTcpClient;

var pro = SimpleTcpClient.prototype;


//todo 先简单做
SimpleTcpClient.connect = function(port, host, cb){
    //var self = this;
    //this.host = host;
    //this.port = port;
    var socket = new Net.Socket();
    socket.connect(port, host, cb);

    var simpleTcp = new  SimpleTcp({
        straightSend : this.straightSend,
        straightReceive : this.straightReceive
    });
    simpleTcp.setSocket(socket);
    //现在直接这样返回出去好吗？
    return simpleTcp;
};