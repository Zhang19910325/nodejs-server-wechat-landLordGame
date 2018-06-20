/**
 * Created by zhangmiao on 2018/5/11.
 */

var utils = require("../../util/utils");
var util = require("util");
var RecvPacket = require("../model/recvPacket");
var EventEmitter = require("events").EventEmitter;

const GET_PDU_LEN = 0;
const GET_ENTIRE_PACKET_DATA = 1;

var Receiver = function(){
    EventEmitter.call(this);
    this._bufferedBytes = 0;
    this._buffer = [];

    this._pduLen = 0;
    this._state = GET_PDU_LEN;
};

util.inherits(Receiver, EventEmitter);

var pro = Receiver.prototype;

pro.add = function(data){
    data = utils.arrayFrom(data);
    this._bufferedBytes += data.length || data.byteLength;
    this._buffer = this._buffer.concat(data);
    this.startLoop();
};

pro.startLoop = function(){
    this._loop = true;
    do {
        switch (this._state){
            case GET_PDU_LEN:
                this.getPduLen();
                break;
            case GET_ENTIRE_PACKET_DATA:
                this.getEntirePacketData();
                break;
            default:
                this._loop = false;
                return;
        }
    } while (this._loop);
};

pro.getPduLen = function(){
    if(this._bufferedBytes < 2){//不足以提取出包长
        this._loop  = false;
        return;
    }
    var buf = Buffer.from(this._buffer.slice(0,2));
    this._pduLen = buf.readUInt16BE(0);
    this._state = GET_ENTIRE_PACKET_DATA;//下一步读取body长度
    return this._pduLen;
};

Receiver.prototype.getEntirePacketData = function(){//获取整个包的数据,包括包头
    if(this._bufferedBytes < this._pduLen){
        this._loop = false;
        return;
    }
    var buf =  this.consume(this._pduLen);
    this.emit("message", buf);
    this._state = GET_PDU_LEN;//初始化状态，准备读取下一个包
    this._pduLen = 0;//将长度设置为零
    return buf;
};


pro.consume = function(n){
    this._bufferedBytes -= n;
    var dst = Buffer.from(this._buffer.slice(0,n));
    this._buffer = this._buffer.slice(n);
    return dst;
};

module.exports = Receiver;