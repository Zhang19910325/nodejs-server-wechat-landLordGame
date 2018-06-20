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

    this.wss = new ws.Server({
        port : this.port
    });

    this.wss.on('connection', function(wsConnect){
        genSocket(wsConnect);
    });
    process.nextTick(cb);
};
