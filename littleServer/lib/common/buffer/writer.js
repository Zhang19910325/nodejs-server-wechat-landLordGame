/**
 * Created by zhangmiao on 2018/5/29.
 * 这些写入规则只能用于包的解析，没有复杂的解析格式
 */

var Long = require("long");

function Op(fn, len, val) {

    /**
     * Function to call.
     * @type {function(Uint8Array, number, *)}
     */
    this.fn = fn;

    /**
     * Value byte length.
     * @type {number}
     */
    this.len = len;

    /**
     * Next operation.
     * @type {Writer.Op|undefined}
     */
    this.next = undefined;

    /**
     * Value to write.
     * @type {*}
     */
    this.val = val; // type varies
}

function noop() {} // eslint-disable-line no-empty-function

var Writer = function(){
    this.len = 0;
    /**
     * Operations head.
     * @type {Object}
     */
    this.head = new Op(noop, 0, 0);
    /**
     * Operations tail
     * @type {Object}
     */
    this.tail = this.head;
};


Writer.prototype._push = function (fn, len, val){
    this.len += len;
    this.tail = this.tail.next = new Op(fn, len, val);
    return this;
};

function writer8(val, buf, pos){
    buf[pos] = val;
}

Writer.prototype.UInt8 = function(value){
    return this._push(writer8, 1, value & 0xff);
};

//网络序是大端
function write16BE(val, buf, pos) {
    buf[pos] = val >>> 8 & 255;
    buf[pos + 1] = val & 255;
}

Writer.prototype.UInt16 = function(value){
    return this._push(write16BE, 2, value & 0xffff);
};

function write32BE(val, buf, pos) {
    buf[pos] =  val >>> 24 & 255;
    buf[pos + 1] = val >>> 16 & 255;
    buf[pos + 2] = val >>> 8 & 255;
    buf[pos + 3] = val & 255;
}

Writer.prototype.UInt32 = function(value){
    return this._push(write32BE, 4, value >>> 0);
};

Writer.prototype.UInt64 = function(value){
    var long = Long.fromValue(value, true);
    return this._push(write32BE, 4, long.high)._push(write32BE, 4, long.low);//写进高位和低位
};

var writeBytes = function(val, buf, pos) {
    for (var i = 0; i < val.length; ++i)
        buf[pos + i] = val[i];
};

Writer.prototype.bytes = function (value){
    if (!value) return this;
    var len = value.length >>> 0;
    return this._push(writeBytes, len, value);
};

Writer.prototype.finish = function(){
    var head = this.head.next,
        buf  = new Uint8Array(this.len),
        pos  = 0;
    while (head) {
        head.fn(head.val, buf, pos);
        pos += head.len;
        head = head.next;
    }
    return buf;
};

module.exports = Writer;