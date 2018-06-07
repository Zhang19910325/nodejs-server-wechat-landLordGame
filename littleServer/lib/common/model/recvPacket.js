/**
 * Created by zhangmiao on 2018/5/4.
 */
var Reader = require("../buffer/reader");

var recvPacket = function (msg, opts) {
    this.msg = msg;
    this.opts = opts || opts;

    //这些数据init解析出来
    this.pduLen = null;
    this.headerLen = null;
    this.version = null;
    this.cmd = null;
    this.uin = null;
    this.seq = null;
    this.bodyData = null;


    this.routeRecode = null;
    this.reader  = genReader(msg);

    this.init();
};

var genReader  = function(msg){
    return new Reader(msg);
};

var pro = recvPacket.prototype;

module.exports = recvPacket;

recvPacket.decode = function(msg, opts){
    return new recvPacket(msg, opts);
};


pro.init = function(){
    this.pduLen = this.reader.uint16();
    this.headerLen = this.reader.read();
    this.version = this.reader.read();
    this.cmd = this.reader.uint32();
    this.uin = this.reader.readLong(true).toString();
    this.seq = this.reader.uint32();
    this.bodyData = this.reader.readBuffer(this.pduLen - this.headerLen);

    //防止外界调用的是uid
    this.__defineGetter__("uid", function(){
        return this.uin;
    });
};

pro.getRouteRecode = function(){
    return this.routeRecode;
};