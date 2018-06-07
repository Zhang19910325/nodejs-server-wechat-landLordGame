/**
 * Created by zhangmiao on 2018/3/31.
 */

var util = require('../util/util');

function ExtendSendPacket(headerLenSize){
    this.headerLenSize = headerLenSize || 1;
    this.version = undefined;
    this.cmd = undefined;
    this.uin = undefined;
    this.seq = undefined;
    this.options = undefined;
    this.bodyData = null;

    /**
     * 定义成功回来的回调
     */

    //成功时的回调
    this.success = undefined;
    //失败时的回调
    this.fail    = undefined;

    /**
     * 发送包的时间,用来记录是否超时
     * @type {undefined}
     */
    this.sendTime = undefined;

    /**
     * netService调用send的时候的发时间
     * @type {undefined}
     */

    this.firstSendTime = undefined;
    /**
     * 设定的超时时间
     * @type {undefined}
     */
    this.timeOut  = undefined;
}
/**
 * 取出包对应的数据
 * @returns {{version: *, cmd: *, uin: *, seq: *, options: *, bodyData: *}}
 */
ExtendSendPacket.prototype.toJson = function (){
    return {
        version     : this.version,
        cmd         : this.cmd,
        uin         : this.uin,
        seq         : this.seq,
        options     : this.options,
        bodyData    : this.bodyData
    }
};

ExtendSendPacket.prototype.fromJson = function(obj) {
    return util.merge(this, obj);
};


function packetVersion1(writer){
    writer.uint8(this.version);
    writer.uint32(this.cmd);
    writer.uint64(this.uin);
    writer.uint32(this.seq);
    if(this.options){
        writer.bytes(this.options);
    }
}
/**
 *
 * @param writer
 * @param extendLen
 * @returns {Writer}
 */

ExtendSendPacket.prototype.writerOperation = function (writer, extendLen){
    writer.fork();//先fork一下
    if(this.version == 1){
        packetVersion1.call(this, writer);
    }else {
        //默认构造方式
        packetVersion1.call(this, writer);
    }
    writer.ldelim(this.headerLenSize, extendLen);//收一下尾巴
    return this.bodyData ? writer.bytes(this.bodyData) : writer;//最后写进去数据，没有就不写了
};




module.exports = ExtendSendPacket;