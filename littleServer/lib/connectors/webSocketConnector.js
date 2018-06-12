/**
 * Created by zhangmiao on 2018/5/1.
 */

var ws = require("ws");
var EventEmitter = require('events').EventEmitter;
var https = require("https");
var fs = require("fs");
var path = require("path");
var util = require('util');
var WebSocket = require("./webSocket");
var Constants = require("../util/constants");
//var keypath='./private.pem';//我把秘钥文件放在运行命令的目录下测试
//var certpath='./file.crt';//console.log(keypath);

var curId = 1;

var Connector = function(port, opts){
    EventEmitter.call(this);
    this.port = port;
    this.opts = opts;
};

util.inherits(Connector, EventEmitter);

module.exports = Connector;

Connector.prototype.start = function(cb){
    var self = this;

    var genSocket = function(wsConnect){
        var webSocket = new WebSocket(curId++, wsConnect);
        self.emit('connection', webSocket);
    };

    //console.log("this.port:",this.port);
    //var server = https.createServer(this.getServerOptions(), function(req, res){
    //    res.writeHead(403);
    //    res.end("This is a webSocket server!\n");
    //}).listen(this.port);
    //this.wss = new ws.Server({
    //    server : server
    //});

    this.wss = new ws.Server({
        port : this.port
    });

    this.wss.on('connection', function(wsConnect){
        genSocket(wsConnect);
    });
    process.nextTick(cb);
};

Connector.prototype.getServerOptions = function(){
    var keyPath = this.opts[Constants.RESERVED.CERT_OPTIONS][Constants.RESERVED.KEY_PATH];
    var certPath = this.opts[Constants.RESERVED.CERT_OPTIONS][Constants.RESERVED.CERT_PATH];
    return {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
        passphrase:'123456'//todo 这个最好是外界传进来如果秘钥文件有密码的话，用这个属性设置密码
    }
};
