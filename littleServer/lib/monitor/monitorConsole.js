/**
 * Created by zhangmiao on 2018/5/9.
 */
var ConsoleService = require("./src/consoleService");
var utils = require("../util/utils");

var Monitor = function(app, opts){
    opts = opts || {};
    this.opts = opts;
    this.app = app;
    this.serverInfo = app.getCurServer();
    this.masterInfo = app.getMaster();


    this.monitorConsole = genMonitorConsole(this);

};



module.exports = Monitor;
var pro = Monitor.prototype;

pro.start = function(cb){
    var self = this;
    this.routeProxy = this.app.components.__routeProxy__;
    //需要注册模块吗
    this.monitorConsole.start(function(err){
        utils.invokeCallback(cb, err);
    });

    this.monitorConsole.on("error", function(err){
       //todo 目前这个好像还没有
    });

    this.monitorConsole.on('register', function(server){
       //处理服务器的注册信息
        if (server.routePort && self.routeProxy){
            //这里有route端口证明是route服务器
            self.routeProxy.addServer(server);
        }
    });
};


var genMonitorConsole = function(self){
    return  new ConsoleService({
        id : self.serverInfo.id,
        type : self.app.getServerType(),
        host : self.masterInfo.host,
        port : self.masterInfo.port,
        info : self.serverInfo
    })
};