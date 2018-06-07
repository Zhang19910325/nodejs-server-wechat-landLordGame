/**
 * Created by zhangmiao on 2018/5/24.
 */

var BaseProcessor = require("../../../common/processService/BaseProcessor.js").BaseProcessor;
var AppCommonPb = require("../../../pbMessage/appCommon_pb");
var util = require("util");
var Long = require("long");

var HandShakeProcessor = function(app, cmd){
  BaseProcessor.call(this, app, cmd);
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
    session.bind(uid);
    //这里需要一个回包告诉客户端连接已经建立
    var sendPacket = session.SendPacket.create(uid, 0x102, packet.seq, null);
    SessionService.sendMessageByUid(uid, sendPacket.msg);
    return false;

};


