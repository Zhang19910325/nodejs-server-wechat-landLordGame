/**
 * Created by zhangmiao on 2018/5/8.
 */
var Router = require("./router");
var Station = require("./station");
var utils = require("../../util/utils");


var STATE_INITED  = 1;  // client has inited
var STATE_STARTED  = 2;  // client has started
var STATE_CLOSED  = 3;  // client has closed

var RpcClient = function(app, opts){
    opts = opts || {};
    this.opts = opts;
    this.app = app;
    this.router = opts.router || Router.def;
    //this.proxies = {};//用来存储rpc
    this.station = Station.create(opts);

    this.state = STATE_INITED;
};


RpcClient.prototype.addServer = function(rpcPbPath, server){
    this.station.addServer(rpcPbPath, server);
};

RpcClient.prototype.start = function(cb){
    if(this.state > STATE_INITED) {
        utils.invokeCallback(cb, new Error('rpc client has started.'));
        return;
    }
    var self = this;

    this.station.start(function(err) {
        if(err) {
            utils.invokeCallback(cb, err);
            return;
        }
        self.state = STATE_STARTED;
        utils.invokeCallback(cb);
    });
};

RpcClient.prototype.stop = function(cb){

};

RpcClient.prototype.dispatch = function(serverType, methodName, msg, cb){
    var route, target, self =this;
    if(typeof this.router === 'function') {
        route = this.router;
        target = null;
    } else if(typeof this.router.route === 'function') {
        route = this.router.route;
        target = this.router;
    }
    route.call(target, this, serverType, msg, function(err, serverId){
        if(err){
            utils.invokeCallback(cb, err);
            return;
        }
        var client = self.station.boxes[serverId];
        client[methodName].call(client, msg, cb);
    });
};

/**
 * @param {String} rpcPbPath
 * @param {Array} servers {id, serverType, host, port, rpcName}
 */
RpcClient.prototype.addServers = function(rpcPbPath, servers){
    this.station.addServers(rpcPbPath, servers);
};

module.exports.create = function(app, opts){
    return new RpcClient(app, opts);
};


