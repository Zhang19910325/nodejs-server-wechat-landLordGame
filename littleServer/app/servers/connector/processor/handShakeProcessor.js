/**
 * Created by zhangmiao on 2018/5/24.
 */

var BaseProcessor = require("../../../common/processService/baseProcessor.js").BaseProcessor;
var AppCommonPb = require("../../../pbMessage/appCommon_pb");
var utils = require("../../../../lib/util/utils");
var util = require("util");
var Long = require("long");

var HandShakeProcessor = function(app, isProcess){
    BaseProcessor.call(this, app, isProcess);
};

util.inherits(HandShakeProcessor, BaseProcessor);

module.exports = HandShakeProcessor;


var pro = HandShakeProcessor.prototype;

pro.processRecvPacket = function(packet ,session, next){
    var SessionService = this.app.sessionService;
    var uid = packet.uin;
    if(uid instanceof Long){
        uid = uid.toString();
    }
    //var c2SHandshakeRsp = new AppCommonPb.S2CHandshakeRsp;
    //if(packet.bodyData && packet.bodyData.length){
    //    var c2SHandshakeReq = AppCommonPb.C2SHandshakeReq.deserializeBinary(packet.bodyData);
    //    var openId = c2SHandshakeReq.getOpenId();
    //    var isSimulator = c2SHandshakeReq.getIsSimulator();
    //    if(isSimulator){
    //        if(this.simulatorMap.hasOwnProperty(openId)) {
    //            uid = this.simulatorMap[openId];
    //        }else {
    //            uid = this.randomLong() + "";
    //            this.simulatorMap[openId] = uid;
    //        }
    //    }else {
    //        if(this.uidMap.hasOwnProperty(openId)) {
    //            uid = this.uidMap[openId];
    //        }else {
    //            uid = this.randomLong() + "";
    //            this.uidMap[openId] = uid
    //        }
    //    }
    //    c2SHandshakeRsp.setUid(Long.fromValue(uid));
    //    c2SHandshakeRsp.setRspHead(getRspHead());
    //    console.log("openId:",openId, "uid:", uid);
    //}

    session.bind(uid);
    //这里需要一个回包告诉客户端连接已经建立
    //var sendPacket = session.SendPacket.create(uid, 0x102, packet.seq, c2SHandshakeRsp.serializeBinary());
    var sendPacket = session.SendPacket.create(uid, 0x102, packet.seq, null);
    SessionService.sendMessageByUid(uid, sendPacket.msg);

    //建立握手了,可以开始对这个链接进行监听
    session.on("closed", onSocketDisconnect.bind(null,this.app));
    return false;

};
pro.randomLong = function () {
    var i = 0;
    var rand;
    do{
        rand = parseInt(Math.random() * 0xffffffffffff + 1);
        i++;
    }while(i <= 200 && this.exsitUids.indexOf(rand) >= 0);
    this.exsitUids.push(rand);
    return rand;
};

var getRspHead = function(code = 0, des){
    var rspHead = new AppCommonPb.RspHead;
    rspHead.setCode(code);
    des && rspHead.setDes(des);
    return rspHead;
};

var onSocketDisconnect = function(app, session){
    //需要发给路由告诉各个服务器这个长连接已经断掉了
    var backendSession = app.backendSessionService.getBackendSessionBySession(session);
    var sendPacket = session.SendPacket.create(session.uid, AppCommonPb.Cmd.KSERVERUSERDISCONNECTED, 0, null);
    backendSession.send(sendPacket, function(){});
};



