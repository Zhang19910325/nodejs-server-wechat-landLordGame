/**
 * Created by zhangmiao on 2018/5/16.
 */

var utils = require("../util/utils");
var RouterServer = require("../route/routerServer");


module.exports = function(app, opts){
    return new Component(app, opts);
};

var Component = function(app, opts){
    opts = opts || {};
    this.app = app;
    this.opts = opts;
};

var pro = Component.prototype;

pro.name = '__route__';

pro.start = function(cb){
    //var self =this;
    this.server = this.app.components.__server__;
    this.backendSession = this.app.components.__backendSession__;
    this.routerServer = new RouterServer(this.app, {});
    this.routerServer.start(cb);
    this.routerServer.on("registerOne", onRegisterOne.bind(this));
    this.routerServer.on("onPacket", onPacket.bind(this));
};


pro.afterStart = function(cb){
    utils.invokeCallback(cb);
};


var onPacket = function(recvPacket, tcpSocket, serverInfo){
    var self = this;
    var sid = tcpSocket.id;
    var session = getBackendSession(self, sid, serverInfo);
    handlePacket(self, session, recvPacket);
};

var  handlePacket = function(self, session, packet){
    self.server.globalHandle(packet, session, function(){

    });
};

var onRegisterOne = function(socket, serverInfo){
    //有一个新的连接来注册
    var self = this;
    var sid = socket.id;
    getBackendSession(self, sid, serverInfo);
    //session.bind(serverInfo.id, serverInfo.serverType);
};

var getBackendSession = function(self, sid, serverInfo){
    var serverId = serverInfo.serverId;
    var serverType = serverInfo.serverType;
    var session = self.backendSession.getSessionByIdAndType(serverId, serverType);
    if (!session){
        session = self.backendSession.createSessionByIdAndSender(sid, self.routerServer);
        session.bind(serverInfo.id, serverInfo.serverType);
    }
    return session;
};