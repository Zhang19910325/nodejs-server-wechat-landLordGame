/**
 * Created by zhangmiao on 2018/5/4.
 */
var Long = require("long");


function Reader(buffer){
    this.buf = buffer;

    this.pos = 0;

    this.len = this.buf.length;
}
module.exports = Reader;

var pro = Reader.prototype;

pro.read = function(){
    if(this.pos >= this.len)
        throw Error('Reader read 读取数据超出范围');
    else
        return this.buf[this.pos++];
};

function readFixInt(byteNumber){
    var value = 0;
    for (var i = 1; i <= byteNumber; i++){
        var move = byteNumber - i;
        value = (value | (this.read() << (move * 8))) >>> 0;
    }
    return value;
}

pro.uint16 = function (){
    return readFixInt.call(this, 2);
};

pro.sint16 = function (){
    var value = this.uint16();
    if(value >= 0x8000){
        value = -(~(value - 1) & 0xffff);
    }
    return value;
};

pro.uint32 = function(){
    return readFixInt.call(this, 4);
};

pro.sint32 = function(){
    return this.uint32() | 0;
};


function readLong(unsigned){
    var hi;//高32位
    var lo;//低32位

    hi = this.uint32();
    lo = this.uint32();

    return new Long(lo,hi, unsigned);
}

pro.readLong = function(unsigned){
    return readLong.call(this, unsigned);
};

pro.uint64 = function(){
    return this.readLong(true).toNumber();
};

pro.sint64 = function(){
    return this.readLong(false).toNumber();
};

pro.readBuffer = function(length){
    length = length || this.len - this.pos;
    if(length > this.len - this.pos)
        throw Error("Reader readBuffer读取数据超出范围");
    else
        return this.buf.slice(this.pos, this.pos + length);
};
