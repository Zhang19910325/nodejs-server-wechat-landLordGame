/**
 * Created by zhangmiao on 2018/5/14.
 */
var utils = require("../util/utils");
var util = require("util");
var EventEmitter = require("events").EventEmitter;

const ReadLength = 0;
const ReadBody = 1;


var Receiver = function(opts){
    "use strict";
    EventEmitter.call(this);
    this.straightReceive = opts.straightReceive;
    this._bufferedBytes = 0;
    this._buffer = [];

    this._curPacketLen = 0;
    this._state = ReadLength;
    this._loop = false;
};

util.inherits(Receiver, EventEmitter);

var pro = Receiver.prototype;

pro.add = function(data){
    if(this.straightReceive){
        this.emit("message", Buffer.from(data));//直接发送出去
    }else {
        data = utils.arrayFrom(data);
        this._bufferedBytes += data.length || data.byteLength;
        this._buffer = this._buffer.concat(data);
        this.startLoop();
    }
};


pro.startLoop = function(cb){
    //var err;
    this._loop = true;
    do {
        switch (this._state){
            case ReadLength:
                this.getPacketLen();
                break;
            case ReadBody:
                this.getPacketBody();
                break;
            default:
                this._loop = false;
                return;
        }
    } while (this._loop);
    //cb(err);
};

pro.consume = function(n){
    this._bufferedBytes -= n;
    var dst = Buffer.from(this._buffer.slice(0,n));
    this._buffer = this._buffer.slice(n);
    return dst;
};

pro.getPacketLen = function(){
    if(this._bufferedBytes < 2){//不足以提取出包长
        this._loop  = false;
        return;
    }

    var buf = this.consume(4);
    this._curPacketLen = buf.readUInt32BE(0);
    this._state = ReadBody;//下一步读取body长度
    return this._curPacketLen;
};

pro.getPacketBody = function(){
    if(this._curPacketLen > this._bufferedBytes){//数据长度不够需要等数据
        this._loop =  false;
        return;
    }
    var buf = this.consume(this._curPacketLen);
    //已经得到一个包了,发送出去
    this.emit("message", buf);
    this._state = ReadLength;//初始化状态，准备读取下一个包
    this._curPacketLen = 0;//将长度设置为零
    return buf;
};

module.exports = Receiver;