/**
 * Created by zhangmiao on 2018/3/31.
 */

var Writer = require('../writer');
var ExtendSendPacket = require('./extendSendPacket');

var SocketSendPacket = function (extendSendPacket, pduLenSize){
    this.pduLenSize = pduLenSize || 2;
    this.extendSendPacket = extendSendPacket;
};


SocketSendPacket.prototype.getData = function(){
    var writer = new Writer();
    writer.fork();
    if(this.extendSendPacket instanceof ExtendSendPacket){
        this.extendSendPacket.writerOperation(writer, this.pduLenSize);
        writer.ldelim(this.pduLenSize, 0);
    }else{
        console.error("extendSendPacket 实例对象不正确");
    }
    var buffer = writer.finish();
    return buffer.slice().buffer
};


module.exports = SocketSendPacket;