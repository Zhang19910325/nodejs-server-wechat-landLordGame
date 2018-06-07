/**
 * Created by zhangmiao on 2018/5/25.
 */

var CommonPb = require("../common/protocolBuffer/common_pb");
var utils = require("../util/utils");
var EventEmitter = require("events").EventEmitter;
var util = require('util');

var RouteReceiver = function(){
    EventEmitter.call(this);
    this._simpleSocket = undefined;
};

util.inherits(RouteReceiver, EventEmitter);

module.exports = RouteReceiver;

var pro = RouteReceiver.prototype;

pro.setSimpleSocket = function(simpleSocket){
    simpleSocket.on('message', onMessage.bind(this));
};

var onMessage = function(msg){
    msg = utils.toArrayBuffer(msg);
    var routeMessage = CommonPb.routeMsg.deserializeBinary(msg);

    if(routeMessage.getType() == CommonPb.RouteMsgType.ROUTEREGISTER){
        //这个主要是正对服务器,todo 不过可能后续会加回报，针对回报的处理可能需要
        var routeRegisterMessage = CommonPb.routeRegister.deserializeBinary(routeMessage.getMsgBody());
        this.emit("register", routeRegisterMessage.toObject());
    }else if(routeMessage.getType() == CommonPb.RouteMsgType.ROUTEDATA){
        this.emit("message", routeMessage.getMsgBody());
    }
};
