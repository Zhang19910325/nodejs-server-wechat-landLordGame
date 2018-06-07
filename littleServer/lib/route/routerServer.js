/**
 * Created by zhangmiao on 2018/5/16.
 */

var Constants = require("../util/constants");
var utils = require("../util/utils");
var SimpleTcpServer = require("../socket/SimpleTcpServer");
var RecvPacket = require("../common/model/recvPacket");

var util = require("util");
var RouterSender = require("./routerSender");
var RouterReceiver = require("./routerReceiver");
var EventEmitter = require("events").EventEmitter;

var kRouterServer = "_routerServer";

var kRouterSender = "_routerSender";
var kRouterReceiver = "_routerReceiver";

var RouterServer = function(app, opts){
    EventEmitter.call(this);
    opts = opts || {};
    this.app = app;
    this.simpleTcpServer = null;

    this.socketMap  = {};
};

//module.exports = function(app, opts){
//    return RouterServer(app, opts);
//};

util.inherits(RouterServer, EventEmitter);

module.exports = RouterServer;

var pro = RouterServer.prototype;

pro.start = function(cb){
    var self = this;
    var serverInfo = this.app.getCurServer();
    var routePort = serverInfo[Constants.RESERVED.ROUTE_PORT];
    if(!routePort){
        utils.invokeCallback(cb , new Error('没有获得route服务器的端口'));
        return;
    }
    this.simpleTcpServer = new SimpleTcpServer();
    this.simpleTcpServer.listen(routePort, function(err){
        console.log(self.app.getServerId(),"路由服务开启:",err);
        utils.invokeCallback(cb, err);
    });
    this.simpleTcpServer[kRouterServer] = this;
    this.simpleTcpServer.on("connection", receiveOnConnection);

};
//通用协议接口
pro.sendBufferToServer = function(buffer, serverId, cb){
    var socket = this.socketMap[serverId];
    if(!socket){
        utils.invokeCallback(cb, new  Error("没有找到需要发送buffer的serverId",serverId));
        return;
    }
    var sender = socket[kRouterSender];
    sender.send(buffer, cb);
};

pro.emitRegisterOne = function(socket, server){
    //这里其实应该需要设置一个标志位的
    this.emit("registerOne", socket, server);
};

var receiveOnConnection = function(socket){
    //这里是收到一个连接
    var serverInfo;
    var simpleTcpServer = this[kRouterServer];
    socket[kRouterSender] = new RouterSender(socket);
    var receiver = new RouterReceiver();
    socket[kRouterReceiver] = receiver;
    receiver.setSimpleSocket(socket);
    receiver.on("register", function(routeRegisterObject){//这个routeRegisterObject里面只包含了serverId 和 serverType是
        serverInfo = routeRegisterObject;
        if(serverInfo.info.length){
            serverInfo = JSON.parse(serverInfo.info);
        }
        serverInfo.serverId = serverInfo.serverId || serverInfo.id;
        serverInfo.id = serverInfo.serverId || serverInfo.id;
        simpleTcpServer.socketMap[serverInfo.serverId || serverInfo.id] = socket;
        simpleTcpServer.emitRegisterOne(socket, serverInfo);
    });
    receiver.on("message", function(msg){
        receivedOnMessage.call(simpleTcpServer, socket, serverInfo, msg);
    });
};

var receivedOnMessage = function(tcpSocket, server, msg){
    var recvPacket = new RecvPacket(msg);
    this.emit("onPacket", recvPacket, tcpSocket, server);
};