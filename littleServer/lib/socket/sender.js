/**
 * Created by zhangmiao on 2018/5/14.
 */


var util = require("util");

var Sender = function(socket, opts){
    this._socket = socket;
    this.straightSend = opts.straightSend;
};
var pro = Sender.prototype;

module.exports = Sender;


pro.send = function(data, cb){
    if(!Buffer.isBuffer(data)){
        if(data instanceof ArrayBuffer){
            data = Buffer.from(data);
        }else if(ArrayBuffer.isView(data) ){
            data = viewToBuffer(data);
        }else {
            data = Buffer.from(data);
        }
    }
    this.sendFrame(frame(data), cb)
};


pro.sendFrame = function(list, cb){
    if (list.length === 2) {
        this._socket.write(list[0]);
        this._socket.write(list[1], cb);
    } else {
        this._socket.write(list[0], cb);
    }
};

function frame(buffer){
    if(this.straightSend){
        return [buffer];
    }
    //加上大端写入的32位无符号长度
    const lenBuffer = Buffer.allocUnsafe(4);
    lenBuffer.writeUInt32BE(buffer.byteLength,0);
    return [lenBuffer, buffer];
}

function viewToBuffer (view) {
    const buf = Buffer.from(view.buffer);

    if (view.byteLength !== view.buffer.byteLength) {
        return buf.slice(view.byteOffset, view.byteOffset + view.byteLength);
    }

    return buf;
}