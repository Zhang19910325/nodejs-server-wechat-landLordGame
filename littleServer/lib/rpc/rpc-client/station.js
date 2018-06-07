/**
 * Created by zhangmiao on 2018/5/8.
 */
var EventEmitter = require('events').EventEmitter;
var grpc = require("grpc");
var utils = require("../../util/utils");
var util = require("util");


var STATE_INITED  = 1;    // station has inited
var STATE_STARTED  = 2;   // station has started
var STATE_CLOSED  = 3;    // station has closed

var Station = function(opts){
    EventEmitter.call(this);
    opts = opts || {};

    this.opts = opts;
    this.servers = {};      // remote server info map, key: server id, value: info
    this.serversMap = {};   // remote server info map, key: serverType, value: servers array
    this.onlines = {};    // remote server online map, key: server id, value: 0/offline 1/online


    this.boxFactory = {};
    this.boxes = {}; // remote server grpc client;

    this.state = STATE_INITED;
};

module.exports.create = function(opts){
    return new Station(opts);
};

util.inherits(Station, EventEmitter);

var pro = Station.prototype;


pro.addServer =  function(rpcPbPath, serverInfo){
    var services = require(rpcPbPath);
    if(!services){
        console.error("没有对应的rpcPbPath文件:",rpcPbPath);
        return;
    }
    var rpcName = serverInfo["rpcName"];
    var id = serverInfo["id"];
    var serverType = serverInfo["serverType"];
    var host = serverInfo["host"];
    var port = serverInfo["port"];

    var Client = services[rpcName] || services[rpcName+"Client"];
    if(!Client){
        console.error("没有找到对应的rpcName：", rpcName);
        return;
    }
    this.boxFactory[id] = Client;
    this.servers[id] = serverInfo; //new Client(host+":"+port, grpc.credentials.createInsecure());
    this.onlines[id] = 1;
    if(!this.serversMap[serverType]){
        this.serversMap[serverType] = [];
    }
    this.serversMap[serverType].push(id);

    this.emit("addServer", id);
};


pro.addServers = function(rpcPbPath, serverInfos){
    for (var i = 0;i < serverInfos.length; i++){
        var server = serverInfos[i];
        this.addServer(rpcPbPath, server);
    }
};

pro.start = function(cb){
    if(this.state > STATE_INITED) {
        utils.invokeCallback(cb, new Error('station已经启动过了.'));
        return;
    }
    //启动
    for (var serverId in this.servers){
        if (!this.servers.hasOwnProperty(serverId)) continue;
        var serverInfo = this.servers[serverId];
        var host = serverInfo["host"];
        var port = serverInfo["port"];
        var Client = this.boxFactory[serverId];
        this.boxes[serverId] = new Client(host+":"+port, grpc.credentials.createInsecure());
    }
    var self = this;
    process.nextTick(function() {
        self.state = STATE_STARTED;
        utils.invokeCallback(cb);
    });
};

pro.stop = function(){

};