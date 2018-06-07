/**
 * Created by zhangmiao on 2018/5/4.
 */
var starter = require("./starter");
var MasterConsole = require("../monitor/masterConsole");
var utils = require("../util/utils");

var Server = function(app, opts){
    this.app = app;
    opts = opts || {};

    this.masterConsole = new MasterConsole(app, opts);//直接将上下文传进去
};


Server.prototype.start = function(cb){
    var servers = this.app.getServersFromConfig();
    var serverIdArr = [];
    for (var serverId in servers){
        if(!servers.hasOwnProperty(serverId)) continue;
        serverIdArr.push(serverId);
    }
    this.serverIdArr = serverIdArr;
    //todo 这里需要注册模块
    var self = this;
    this.masterConsole.start(function(err){
        if(err){
            utils.invokeCallback(cb, err);
            return;
        }
        //todo 这里可能要开启各个模块的工作
        starter.runServers(self.app);
        //todo 这里需要监听各个进程的存活情况,当进程死掉的话要拉起来
    });

    this.masterConsole.on("register", notifyRegister.bind(this));

};


var notifyRegister = function(serverInfo){
    //通知其它服务器他已经注册成功
    var serverId = serverInfo.id;
    var index = this.serverIdArr.indexOf(serverId);
    if(index>-1){
        this.serverIdArr.splice(index, 1);
    }
    if(!this.serverIdArr.length){
        //当数组元素位空时，可以启动路由了
        this.masterConsole.startRoute(function(err){
            console.log("通知各个服务器启动路由err:", err);
        });
    }
};

module.exports = Server;
