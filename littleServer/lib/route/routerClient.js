/**
 * Created by zhangmiao on 2018/5/21.
 */

var SimpleTcpClient = require("../socket/simpleTcpClient");
var RecvPacket = require("../common/model/recvPacket");
var CommonPb = require("../common/protocolBuffer/common_pb");
var utils = require("../util/utils");
var EventEmitter = require("events").EventEmitter;
var util = require('util');
var RouterSender = require("./routerSender");
var RouterReceiver = require("./routerReceiver");

var kRouterClient = '_routerClient';
var kTcpSocket = "_tcpSocket";
var kRouterSender = "_routerSender";
var kRouterReceiver = "_routerReceiver";

var RouterClient = function(app, opts){
    EventEmitter.call(this);
    this.app = app;
    this.opts = opts;
    this.routerServers = []; //serverId list
    this.routerServersMap = {}; // serverId : serverInfo


    this.socketMap  = {};
};


util.inherits(RouterClient, EventEmitter);


module.exports = RouterClient;

var pro = RouterClient.prototype;

pro.start = function(cb){
    //this.server = this.app.components.__server__;
    //this.session = this.app.components.__session__;

    process.nextTick(cb);
};

pro.addRouterServer = function(server){
    var self = this;
    var serverType = server.serverType;
    if(serverType != 'route'){
        console.warn('这里只能添加routeServer');
        return;
    }
    var serverId = server.id;
    if(this.routerServersMap[serverId]){
        console.log('已经添加过该serverId',serverId);
        return;
    }
    if(this.routerServers.indexOf(serverId) > -1){
        console.log("serverId 早已经在routerServers里了");
        return;
    }
    //查看是否已经添加id;
    var routePort = server.routePort;
    var host      = server.host;
    var tcpSocket = SimpleTcpClient.connect(routePort,host,function(err){
        //发送注册协议
        if(err){
            console.warn("SimpleTcpClient 连接的时候发生错误:",err);
            return;
        }
        sender.sendServerRegister(self.app.getCurServer(), self.sendRegisterSuccess.bind(self, tcpSocket, server));
    });
    var sender = new  RouterSender(tcpSocket);
    var receiver = new RouterReceiver();
    receiver.on("message", receivedOnMessage.bind(this, tcpSocket, server));
    receiver.setSimpleSocket(tcpSocket);

    tcpSocket[kRouterSender] = sender;
    tcpSocket[kRouterReceiver] = receiver;
    //tcpSocket[kRouterClient] = this;
    //tcpSocket.on("message",receivedOnMessage);

    this.socketMap[serverId] = tcpSocket;
    this.routerServers.push(serverId);
};

pro.sendRegisterSuccess = function(socket, server){
    //这里其实应该需要设置一个标志位的
    this.emit("registerClient", socket, server);
};

pro.addRouterServers = function(servers){
    var self = this;
    servers.forEach(function(server){
        self.addRouterServer(server);
    })
};

pro.sendMsgToRouteServer = function(msg, cb){
    var socket = this.getTcpSocket();
    //socket.send(msg, cb);
    //this.sendBufferToRouteServer(msg, socket, cb);
};

//通用协议接口
pro.sendBufferToServer = function(buffer, serverId, cb){
    var socket = this.socketMap[serverId];
    if(!socket){
        utils.invokeCallback(cb, new  Error("没有找到需要发送buffer的serverId",serverId));
        return;
    }
    var sender =socket[kRouterSender];
    sender.send(buffer, cb);
};


pro.getTcpSocket = function(){
    var serverId = this.routerServers[Math.floor(Math.random()*this.routerServers.length)];
    //随机取的
    return this.socketMap[serverId];
};

var receivedOnMessage = function(tcpSocket, server, msg){
    var recvPacket = new RecvPacket(msg);
    this.emit("onPacket", recvPacket, tcpSocket, server);
};

//var getSession = function(self, socket){
//    var app = self.app, sid = socket.id;
//    var session = self.session.get(sid);
//    if(session){
//        return session;
//    }
//    session = self.session.create(sid, app.getServerId(), socket);
//
//    socket.on('disconnect', session.closed.bind(session));
//    socket.on('error', session.closed.bind(session));
//    //session.on('closed', onSessionClose.bind(null, app));
//    session.on("bind", function(uid){
//        //绑定uid成功
//    });
//    session.on("unbind", function(uid){
//        //解绑
//    });
//
//    return session;
//};