/**
 * Created by zhangmiao on 2018/5/25.
 */

var EventEmitter = require("events").EventEmitter;
var utils = require("../../util/utils");
var util = require("util");
var SendPacket = require("../model/sendPacket");

var BackendSessionService = function(){
    this.serverTypeSessionMap = {};//serverType - > sessionSet
};


module.exports = BackendSessionService;

BackendSessionService.prototype.createSessionByIdAndSender = function(sid, routerSender){
    var self = this;
    var session = new  BackendSession(sid, routerSender, this);
    session.on("bind", function(serverId, serverType){
        var sessionSet = self.getSessionSet(serverType);
        sessionSet.addSession(session);
    });
    session.on("unbind", function(serverId, serverType){
        var sessionSet = self.getSessionSet(serverType);
        sessionSet.removeSession(serverId);
    });
    return session;
};

BackendSessionService.prototype.getSessionByIdAndType = function(serverId, serverType){
    var sessionSet = this.serverTypeSessionMap[serverType];
    if (!sessionSet) return null;
    return sessionSet.getSessionById(serverId);
};

BackendSessionService.prototype.getSessionSet = function(serverType){
    var sessionSet = this.serverTypeSessionMap[serverType];
    if(!sessionSet){
        sessionSet = new BackendSessionSet(serverType);
        this.serverTypeSessionMap[serverType] = sessionSet;
    }
    return sessionSet;
};

BackendSessionService.prototype.getBackendSessionBySession = function(session){
    var sessionSet = this.getSessionSet("route");
    var serverId = session.get("routerId");
    if (!serverId){
        //那就要生成一个路由Id
        var sessionArr = sessionSet.sessionArr;
        serverId = sessionArr[Math.floor(Math.random()*sessionArr.length)];
        session.set("routerId", serverId);
    }
    return sessionSet.getSessionById(serverId);
};




var BackendSessionSet = function(serverType){
    this.serverType = serverType;
    this.sessions =  {};//serverId -> session
    this.sessionArr = [];
};


BackendSessionSet.prototype.addSession = function(session){
    this.sessions[session.serverId] = session;
    this.sessionArr.push(session.serverId);
};

BackendSessionSet.prototype.removeSession = function(serverId){
    delete this.sessions[serverId];
    var index = this.sessionArr.indexOf(serverId);
    if(index > -1){
        this.sessionArr.splice(index, 1);
    }

};

BackendSessionSet.prototype.getSessionById  =function(serverId){
    return this.sessions[serverId];
};


var BackendSession = function(sid, routerSender, service){
    EventEmitter.call(this);
    this.id = sid;
    this.serverType = undefined;
    this.serverId = undefined;
    this._routerSender = routerSender;// routerClient/routerServer
    //this.__socket__ = socket;

    this.settings = {};

    this.service = service;
};

util.inherits(BackendSession, EventEmitter);

BackendSession.prototype.name = "BackendSession";

BackendSession.prototype.bind = function(serverId, serverType){
    this.serverId = serverId;
    this.serverType = serverType;
    this.emit("bind", serverId, serverType);
};


BackendSession.prototype.unbind = function(){
    var serverId = this.serverId;
    var serverType = this.serverType;
    this.serverId = undefined;
    this.serverType = undefined;
    this.emit('unbind', serverId, serverType);
};

BackendSession.prototype.SendPacket = SendPacket;


BackendSession.prototype.set = function(key, value){
    if (utils.isObject(key)) {
        for (var i in key) {
            this.settings[i] = key[i];
        }
    } else {
        this.settings[key] = value;
    }
};

BackendSession.prototype.get = function(key){
    return this.settings[key];
};

BackendSession.prototype.send = function(msg, cb){
    if(!this.serverId) {
        utils.invokeCallback(cb, new Error("没有找到发送消息的服务器id"));
        return;
    }
    this._routerSender.sendBufferToServer(msg, this.serverId, cb);//发送信息到对应的服务器
};