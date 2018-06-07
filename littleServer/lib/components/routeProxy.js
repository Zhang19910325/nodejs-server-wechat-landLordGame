/**
 * Created by zhangmiao on 2018/5/21.
 */
var utils = require("../util/utils");
var RouterClient = require("../route/routerClient");

module.exports = function(app, opts){
    return new Component(app, opts);
};

var Component = function(app, opts){
    this.app  = app;
    this.opts = opts;
};

var pro = Component.prototype;


pro.name = '__routeProxy__';

pro.start = function(cb){
    this.server = this.app.components.__server__;
    this.backendSession = this.app.components.__backendSession__;
    //this.session = this.app.components.__session__;
    process.nextTick(cb);
};

pro.addServer = function(server){
    if(!this.routerClient){
        console.warn("routerClient 还未建立不能添加server 请afterStart过后再来");
        return;
    }
    this.routerClient.addRouterServer(server);
};

pro.addServers = function(servers){
    this.routerClient.addRouterServers(servers);
};

pro.afterStart = function(cb){
    var self = this;
    //this.app.__defineGetter__('routeMessage', function(){
    //    return function (msg, cb){
    //        self.routerClient.sendMsgToRouteServer(msg, cb);
    //    }
    //});
    this.routerClient = new RouterClient(this.app, {});
    this.routerClient.start(cb);
    this.routerClient.on("registerClient", onRegisterClient.bind(this));
    this.routerClient.on("onPacket", onPacket.bind(this));
    //this.app.__defineGetter__('receivedOnMessage recvPacket:routeMessage', self.routerClient.sendMsgToRouteServer.bind(self.routerClient));
};

var onRegisterClient = function(tcpSocket, serverInfo){
    var self = this;
    var sid = tcpSocket.id;
    getBackendSession(self, sid, serverInfo);
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

var getBackendSession = function(self, sid, serverInfo){
    var serverId = serverInfo.serverId;
    var serverType = serverInfo.serverType;
    var session = self.backendSession.getSessionByIdAndType(serverId, serverType);
    if (!session){
        session = self.backendSession.createSessionByIdAndSender(sid, self.routerClient);
        session.bind(serverInfo.id, serverInfo.serverType);
    }
    return session;
};