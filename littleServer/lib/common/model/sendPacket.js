/**
 * Created by zhangmiao on 2018/5/29.
 */

var Writer = require("../buffer/writer");

var SendPacket = function(opts){
    this.opts = opts || opts;

    //这些数据init解析出来
    //this.pduLen = 0;
    //this.headerLen = 0;
    this.version = 1;
    this.cmd = 0;
    this.uin = 0;
    this.seq = 0;
    this.bodyData = null;


    var self = this;
    this.__defineGetter__("msg", function(){
        return getMsgBuffer(self);
    });
    this.__defineGetter__("pduLen", function(){
        return self.headerLen + (self.bodyData ? self.bodyData.length : 0);
    });
    this.__defineGetter__("headerLen", function(){
        return 20;
    });
};

SendPacket.create = function(uin, cmd, seq, bodyData){
    var packet = new SendPacket();
    packet.uin = uin;
    packet.cmd = cmd;
    packet.seq = seq;
    packet.bodyData = bodyData;
    return packet;
};

module.exports = SendPacket;

var getMsgBuffer = function(sendPacket){
    var writer = new Writer();
    writer.UInt16(sendPacket.pduLen);
    writer.UInt8(sendPacket.headerLen);
    writer.UInt8(sendPacket.version);
    writer.UInt32(sendPacket.cmd);
    writer.UInt64(sendPacket.uin);
    writer.UInt32(sendPacket.seq);
    writer.bytes(sendPacket.bodyData);
    return writer.finish();
};