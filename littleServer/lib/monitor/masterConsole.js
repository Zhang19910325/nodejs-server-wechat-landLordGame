/**
 * Created by zhangmiao on 2018/5/15.
 */

var ConsoleService = require("./src/consoleService");
var utils = require("../util/utils");
var EventsEmitter = require("events").EventEmitter;
var util = require("util");

var Master = function(app, opts){
    EventsEmitter.call(this);
    this.app = app;
    this.opts = opts || {};

    this.serverInfo = app.getCurServer();
    this.masterInfo = app.getMaster();


    this.console = genMonitorConsole(this);
};

module.exports = Master;

util.inherits(Master, EventsEmitter);

var pro = Master.prototype;

pro.start = function(cb){
    var self = this;
    this.console.start(function(err){
        if(err) {
            console.log("master ConsoleService 启动失败");
            utils.invokeCallback(cb, err);
            return
        }
        console.log("master ConsoleService 启动成功");
        utils.invokeCallback(cb);
    });

    this.console.on("register", function(server){
        self.emit('register', server);
    });
};


pro.startRoute = function(cb){
    this.console.startRoute(cb);
};

var genMonitorConsole = function(self){
    return  new ConsoleService({
        master : true,
        id : self.serverInfo.id,
        type : self.app.getServerType(),
        host : self.masterInfo.host,
        port : self.masterInfo.port,
        info : self.serverInfo
    })
};