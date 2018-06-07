/**
 * Created by zhangmiao on 2018/5/8.
 */

var Client = require("../rpc/rpc-client/rpcClient");
var Constants = require("../util/constants");
var pathUtil = require("../util/pathUtil");

module.exports = function(app, opts){
    opts = opts || {};
    return new Component(app, opts);
};


var Component = function(app, opts){
    this.app = app;
    this.opts = opts;
    this.client = Client.create(app, opts);
    //这里要考虑服务器的增加
};

var pro = Component.prototype;

pro.name = '__proxy__';

pro.start = function (cb){
    if(this.app.getServerType() == 'connector'){
        var servers = this.app.get(Constants.RESERVED.SERVERS);
        var routeServers = servers[Constants.RESERVED.ROUTE];
        var list = [];
        routeServers.forEach(function(server){
            var serverInfo = {};
            serverInfo.id  = server.id;
            serverInfo.serverType = Constants.RESERVED.ROUTE;
            serverInfo.host = server.host;
            serverInfo.port = server.port;
            serverInfo.rpcName = "RouteService";
            list.push(serverInfo);
        });
        this.client.addServers(pathUtil.getSysRemotePbPath(), list);
    }else{
        //todo 另行配置
    }
    process.nextTick(cb);
};

pro.afterStart = function(cb){
    var self = this;
    this.app.__defineGetter__('routeRpc', function() {
        return function (msg,session, cb){
            self.client.dispatch(Constants.RESERVED.ROUTE, Constants.RESERVED.ROUTE, msg, cb)
        }
    });
    this.client.start(cb);
};