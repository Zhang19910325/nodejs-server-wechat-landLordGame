/**
 * Created by zhangmiao on 2018/5/25.
 */


var CommonPb = require("../common/protocolBuffer/common_pb");
var utils = require("../util/utils");
var RecvPacket = require("../common/model/recvPacket");
var SendPacket = require("../common/model/sendPacket");
var EventEmitter = require("events").EventEmitter;
var util = require('util');

var RouterSender = function(simpleSocket){
    EventEmitter.call(this);
    this._simpleSocket = simpleSocket;
};
util.inherits(RouterSender, EventEmitter);

module.exports = RouterSender;

var pro = RouterSender.prototype;

//routeClient需要用到
pro.sendServerRegister = function(server, cb){
    this._simpleSocket.send(routeRegisterBuffer(server), cb);
};

pro.send = function(buffer, cb){
    if(buffer instanceof RecvPacket){
        buffer = buffer.msg;
    }
    else if (buffer instanceof  SendPacket){
        buffer = buffer.msg;
    }
    buffer = utils.toArrayBuffer(buffer);
    this._simpleSocket.send(routeDataBuffer(buffer), cb);
};

var routeDataBuffer = function(buffer){
    if(buffer instanceof ArrayBuffer){
        buffer = new Uint8Array(buffer);
    }
    var routeMsg = new  CommonPb.routeMsg;
    routeMsg.setType(CommonPb.RouteMsgType.ROUTEDATA);
    routeMsg.setMsgBody(buffer);
    return routeMsg.serializeBinary();
};



var routeRegisterBuffer = function(server){
    var routeRegister = new CommonPb.routeRegister;
    routeRegister.setServerId(server.id || server.serverId);
    routeRegister.setServerType(server.serverType);
    routeRegister.setInfo(JSON.stringify(server));

    var routeRegisterBuffer =  routeRegister.serializeBinary();
    var routeMsg = new  CommonPb.routeMsg;
    routeMsg.setType(CommonPb.RouteMsgType.ROUTEREGISTER);
    routeMsg.setMsgBody(routeRegisterBuffer);

    return routeMsg.serializeBinary();
};



