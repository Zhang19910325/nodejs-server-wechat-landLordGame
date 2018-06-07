/**
 * Created by zhangmiao on 2018/5/9.
 */
var EventEmitter = require('events').EventEmitter;
var sio = require('socket.io');
var Net = require("net");
var util = require("util");
var utils = require("../../util/utils");
var Constants = require("../../util/constants");
var SimpleTcpServer = require("../../socket/simpleTcpServer");
var CommonPb = require("../../common/protocolBuffer/common_pb");


var ST_INITED = 1;
var ST_STARTED = 2;
var ST_CLOSED = 3;

var kMasterAgent = "_masterAgent";
var kSocketContext = "_socketContext";
var MasterAgent = function(consoleService, opts){
    EventEmitter.call(this);
    this.consoleService = consoleService;
    this.server = undefined;
    this.sockets = {};

    this.state = ST_INITED;
};

util.inherits(MasterAgent, EventEmitter);

module.exports = MasterAgent;

var pro = MasterAgent.prototype;


var TYPE_CLIENT = 'client';
var TYPE_MONITOR = 'monitor';

pro.listen = function(port, cb){
    if(this.state > ST_INITED){
        console.log("MasterAgent 已经启动或者关闭了");
        return;
    }
    var self = this;
    this.state = ST_STARTED;
    this.server = new SimpleTcpServer();
    this.server[kMasterAgent] = this;
    this.server.listen(port);
    this.server.on("listening", function(){
        setImmediate(function() {
            utils.invokeCallback(cb);
        });
    });

    this.server.on("connection", receiveOnConnection);
};

pro.startRoute = function(cb){
    //通知各个服务器启动路由服务
    //将路由服务和非路由服务器进行区分
    var sockets = this.sockets;
    var routeServers = [];
    var servers = [];
    for (var serverId in sockets){
        if(!sockets.hasOwnProperty(serverId)) continue;
        var context = sockets[serverId][kSocketContext];
        if(context.type === Constants.RESERVED.ROUTE){
            routeServers.push(JSON.parse(context.info));
        }else {
            servers.push(serverId);
        }
    }
    //再将route服务器通知到各个部分
    for (var index = 0 ; index < servers.length; index++){
        var socket = sockets[servers[index]];
        routeServers.forEach(function(server){
            socket.send(registerBuffer(server));
        });
    }
    process.nextTick(cb);

};


var registerBuffer = function(server){
    //首先构造connectMsg
    var info = JSON.stringify(server);

    var connectMsg = new CommonPb.connectMsg();
    connectMsg.setServerType(server.serverType);
    connectMsg.setInfo(info);
    connectMsg.setId(server.id);

    var buffer = connectMsg.serializeBinary();

    var svrMsg = new CommonPb.svrMsg();
    svrMsg.setReqId(0);
    svrMsg.setType(CommonPb.SvrMsgType.REGISTER);
    svrMsg.setMsgBody(buffer);

    return svrMsg.serializeBinary();
};

var receiveOnConnection = function(socket){
    var context = {};//存储上下文的容器
    var masterAgent = this[kMasterAgent];
    context.socketId = socket.id;
    masterAgent.sockets[socket.id] = socket;
    socket[kSocketContext] = context;
    socket.on('message', function(msg){
        msg = utils.toArrayBuffer(msg);
        var svrMsg = CommonPb.svrMsg.deserializeBinary(msg);
        var type = svrMsg.getType();
        if (type === CommonPb.SvrMsgType.REGISTER){
            handleRegister(masterAgent, svrMsg, context);
        }else if (type === CommonPb.SvrMsgType.MONITOR){
            handleMonitor(masterAgent, svrMsg, context);
        }else if (type === CommonPb.SvrMsgType.CLIENT){
            handleClient(svrMsg, context);
        }else if (type === CommonPb.SvrMsgType.RECONNECT){
            handleReconnect(masterAgent, svrMsg, context);
        }else if (type === CommonPb.SvrMsgType.DISCONNECT){
            handleDisconnect(masterAgent, svrMsg, context);
        }else {
            console.log("解析到一个未知名的消息结构")
        }
    })
};

var handleRegister = function(self, svrMsg, context){
    var connectMsg = CommonPb.connectMsg.deserializeBinary(svrMsg.getMsgBody());
    //写入注册信息
    context.type = connectMsg.getServerType();
    context.id   = connectMsg.getId();
    context.info = connectMsg.getInfo();
    context.registered = true;//标记为已经注册
    console.log("已收到一个服务注册信息id:",context.id, "   type:",context.type);
    //将收到的事件发送出去
    self.emit("register", JSON.parse(context.info));
};
var handleMonitor = function(self, svrMsg, context){

};
var handleClient = function(self, svrMsg, context){

};
var handleReconnect = function(self, svrMsg, context){

};
var handleDisconnect = function(self, svrMsg, context){

};