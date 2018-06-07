/**
 * Created by zhangmiao on 2018/5/9.
 */
var EventEmitter = require("events").EventEmitter;
//var sclient = require("socket.io-client");
var SimpleTcpClient = require("../../socket/simpleTcpClient");
var util = require("util");
var utils = require("../../util/utils");
var CommonPb = require("../../common/protocolBuffer/common_pb");

var ST_INITED = 1;
var ST_CONNECTED = 2;
var ST_REGISTERED = 3;
var ST_CLOSED = 4;

var MonitorAgent = function(opts){
    EventEmitter.call(this);
    this.consoleService = opts.consoleService;
    this.socket = null;
    this.type = opts.type;
    this.id   = opts.id;
    this.info = opts.info;
    this.curId = Math.round(Math.random()*1000)%1000;
    this.state = ST_INITED;
};

util.inherits(MonitorAgent, EventEmitter);

module.exports = MonitorAgent;

MonitorAgent.prototype.connect = function(port, host, cb){
    if (this.state > ST_INITED) {
        console.error('monitor client has connected or closed.');
        return;
    }

    var self = this;
    this.socket = SimpleTcpClient.connect(port, host, function(err){
        //发起注册星球
        self.socket.send(registerBuffer(self));
        utils.invokeCallback(cb,err);
    });

    this.socket.on("message",function(msg){
        //console.log("monitorAgent收到消息了，干嘛啊？msg:",msg);
        //这里要处理服务器注册消息
        msg = utils.toArrayBuffer(msg);
        var svrMsg = CommonPb.svrMsg.deserializeBinary(msg);
        var type = svrMsg.getType();
        if (type === CommonPb.SvrMsgType.REGISTER){
            handleRegister(svrMsg, self);
        }else if (type === CommonPb.SvrMsgType.MONITOR){
        //    handleMonitor(svrMsg, context);
        }else if (type === CommonPb.SvrMsgType.CLIENT){
        //    handleClient(svrMsg, context);
        }else if (type === CommonPb.SvrMsgType.RECONNECT){
        //    handleReconnect(svrMsg, context);
        }else if (type === CommonPb.SvrMsgType.DISCONNECT){
        //    handleDisconnect(svrMsg, context);
        }else {
        //    console.log("解析到一个未知名的消息结构")
        }
    });

    //监听关闭事件
    this.socket.on("close", function(){
        self.emit("close");
    })
};

MonitorAgent.prototype.getNextCurId = function() {
    return this.curId++ % 1000000000;
};
//得到register需要的buffer
var registerBuffer = function(self){
    //首先构造connectMsg
    var info = self.info;
    if(typeof info == 'object'){
        info = JSON.stringify(info);
    }else if(typeof info != 'string'){
        info = "无信息";
    }
    var connectMsg = new CommonPb.connectMsg();
    connectMsg.setServerType(self.type);
    connectMsg.setInfo(info);
    connectMsg.setId(self.id);

    var buffer = connectMsg.serializeBinary();

    var svrMsg = new CommonPb.svrMsg();
    svrMsg.setReqId(self.getNextCurId());
    svrMsg.setType(CommonPb.SvrMsgType.REGISTER);
    svrMsg.setMsgBody(buffer);

    return svrMsg.serializeBinary();
};

var handleRegister = function(svrMsg,self){
    //master下发到各个服务器
    var connectMsg = CommonPb.connectMsg.deserializeBinary(svrMsg.getMsgBody());
    //写入注册信息
    var type = connectMsg.getServerType();
    var id   = connectMsg.getId();
    var info = connectMsg.getInfo();

    var server = JSON.parse(info);
    console.log("Monitor 已收到一个服务注册信息id:",id, "   type:",type);
    //将收到的事件发送出去
    self.emit('register', server);
};

var handleMonitor = function(svrMsg, self){

};
var handleClient = function(svrMsg, self){

};
var handleReconnect = function(svrMsg, self){

};
var handleDisconnect = function(svrMsg, self){

};
