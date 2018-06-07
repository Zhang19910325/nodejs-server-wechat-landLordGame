/**
 * Created by zhangmiao on 2018/3/29.
 */
var LongBits = require('./longBits');
var Float = require('./float');
var util = require('./util/util');


function Reader(buffer, isLE){
    /**
     * Read buffer.
     * @type {Array}
     */
    this.buf =  util.arrayFrom(new Uint8Array(buffer));

    /**
     * Read buffer position.
     * @type {number}
     */
    this.pos = 0;

    /**
     * Read buffer length.
     * @type {number}
     */
    this.len = this.buf.length;

    /**
     * is little endian 默认big endian(为网络序)
     * @type {boolean}
     */
    this.isLE = isLE;
}

Reader.prototype.addData = function (buffer){
    var arr = util.arrayFrom(new Uint8Array(buffer));
    this.buf.concat(arr);
    this.len = this.buf.length;
};

function read(){
    if(this.pos >= this.len)
        throw Error("Reader read读取数据超出范围");
    else
        return this.buf[this.pos++];
}

Reader.prototype.read = function (){
    return read.call(this);
};

//32位以下,需要区别字节序 是大端(网络序)还是小端,默认为大端(网络序)
function readFixInt(byteNumber){
    var value = 0;
    for (var  i = 1; i <= byteNumber; i++){
        var move =  this.isLE ? (i-1) : (byteNumber - i);
        value = (value | (this.read() << (move * 8))) >>> 0;
    }
    return value;
}

Reader.prototype.uint16 = function(){
    return readFixInt.call(this, 2);
};


Reader.prototype.sint16 = function(){
    var  value = this.uint16();
    if(value >= 0x8000){
        value = -(~(value -1) & 0xffff);
    }
    return value;
};

Reader.prototype.uint32 = function(){
    return readFixInt.call(this, 4);
};

Reader.prototype.sint32 = function(){
    return this.uint32() | 0;
};

/**
 * return {LongBits}
 */
function readLong(){
    var hi;//高32位
    var lo;//底32位
    if(this.isLE){
        lo = this.uint32();
        hi = this.uint32();
    } else {
        hi = this.uint32();
        lo = this.uint32();
    }
    return new LongBits(lo,hi);
}

//转化成一个数值型
Reader.prototype.uint64 = function(){
    return readLong.call(this).toNumber(true);
};

//转化成一个数值型
Reader.prototype.sint64 = function(){
    return readLong.call(this).toNumber(false);
};



Reader.prototype.float = function(){
    var value = this.isLE ? Float.readFloatLE(this.buf, this.pos) : Float.readFloatBE(this.buf, this.pos);
    this.pos += 4;
    return value;
};

Reader.prototype.double = function(){
    var value = this.isLE ? Float.readDoubleLE(this.buf, this.pos) : Float.readDoubleBE(this.buf, this.pos);
    this.pos += 8;
    return value;
}

Reader.prototype.readBuffer = function(length){
    length = length || this.len - this.pos;
    if(length > this.len - this.pos)
        throw Error("Reader readBuffer读取数据超出范围");
    else
        return this.buf.slice(this.pos, this.pos + length);
};


module.exports = Reader;