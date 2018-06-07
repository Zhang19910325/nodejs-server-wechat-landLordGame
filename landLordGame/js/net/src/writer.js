/**
 * Created by zhangmiao on 2018/3/31.
 */

var LongBits = require('./longBits');
var util = require('./util/util');
var Float = require('./float');


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


/**
 * Constructs a new writer state instance.
 * @classdesc Copied writer state.
 * @memberof Writer
 * @constructor
 * @param {Writer} writer Writer to copy state from
 * @ignore
 */
function State(writer) {

    /**
     * Current head.
     * @type {Writer.Op}
     */
    this.head = writer.head;

    /**
     * Current tail.
     * @type {Writer.Op}
     */
    this.tail = writer.tail;

    /**
     * Current buffer length.
     * @type {number}
     */
    this.len = writer.len;

    /**
     * Next state.
     * @type {State|null}
     */
    this.next = writer.states;
}

var  Writer = function (isLE){
    this.isLE = isLE;

    /**
     * Current length.
     * @type {number}
     */
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

    /**
     * Linked forked states.
     * @type {Object|null}
     */
    this.states = null;
};

/**
 * Allocates a buffer of the specified size.
 * @param {number} size Buffer size
 * @returns {Uint8Array} Buffer
 */
Writer.alloc = function alloc(size) {
    return new Uint8Array(size);
};


Writer.prototype._push = function push(fn, len, val) {
    this.tail = this.tail.next = new Op(fn, len, val);
    this.len += len;
    return this;
};

function  writer8(value, buf, pos) {
    buf[pos] = value & 255;
}

Writer.prototype.uint8 = function(value) {
    return this._push(writer8, 1, value & 0xff);
}

Writer.prototype.sint8 = Writer.prototype.uint8;

function write16LE(val, buf, pos) {
    buf[pos] = val & 255;
    buf[pos + 1] = val >>> 8 & 255;
}

function write16BE(val, buf, pos) {
    buf[pos] = val >>> 8 & 255;
    buf[pos + 1] = val & 255;
}


Writer.prototype.uint16 = function (value){
    return this._push(this.isLE ? write16LE : write16BE, 2, value & 0xffff);
};

Writer.prototype.sint16 = Writer.prototype.uint16;

function write32LE(val, buf, pos) {
    buf[pos] = val & 255;
    buf[pos + 1] = val >>> 8 & 255;
    buf[pos + 2] = val >>> 16 & 255;
    buf[pos + 3] = val >>> 24 & 255;
}

function write32BE(val, buf, pos) {
    buf[pos] =  val >>> 24 & 255;
    buf[pos + 1] = val >>> 16 & 255;
    buf[pos + 2] = val >>> 8 & 255;
    buf[pos + 3] = val & 255;
}


Writer.prototype.uint32 = function (value){
    return this._push(this.isLE ? write32LE : write32BE, 4, value >>> 0);
};


Writer.prototype.sint32 = Writer.prototype.uint32;


Writer.prototype.uint64 = function (value){
    var bits = LongBits.from(value);
    if(this.isLE){
        return this._push(write32LE, 4, bits.lo)._push(write32LE, 4, bits.hi);
    }else {
        return this._push(write32BE, 4, bits.hi)._push(write32BE, 4, bits.lo);
    }
};


Writer.prototype.sint64 = Writer.prototype.uint64;


Writer.prototype.float = function (value){
    return this._push(this.isLE ? Float.writeFloatLE : Float.writeFloatBE, 4, value);
};

Writer.prototype.double = function (value){
    return this._push(this.isLE ? Float.writeDoubleLE : Float.writeDoubleBE, 8, value);
};


var writeBytes = function(val, buf, pos) {
    for (var i = 0; i < val.length; ++i)
        buf[pos + i] = val[i];
};



Writer.prototype.bytes = function (value){
    if (!value) return this;
    if (value instanceof ArrayBuffer)
        value = util.arrayFrom(value);
    var len = value.length >>> 0;
    return this._push(writeBytes, len, value);
};



Writer.prototype.fork = function fork() {
    this.states = new State(this);
    this.head = this.tail = new Op(noop, 0, 0);
    this.len = 0;
    return this;
};



/**
 * Resets this instance to the last state.
 * @returns {Writer} `this`
 */
Writer.prototype.reset = function reset() {
    if (this.states) {
        this.head   = this.states.head;
        this.tail   = this.states.tail;
        this.len    = this.states.len;
        this.states = this.states.next;
    } else {
        this.head = this.tail = new Op(noop, 0, 0);
        this.len  = 0;
    }
    return this;
};

/**
 * Resets to the last state and appends the fork state's current write length as a varint followed by its operations.
 * @returns {Writer} `this`
 */
Writer.prototype.ldelim = function ldelim(lenSize, extendLen) {
    extendLen = extendLen || 0;
    var head = this.head,
        tail = this.tail,
        len  = this.len;
    if(lenSize == 1){
        this.reset().uint8(len + 1 + extendLen);
    }else if (lenSize == 2){
        this.reset().uint16(len + 2 + extendLen);
    }else {
        this.reset().uint32(len + 4 + extendLen);
    }
    if (len) {
        this.tail.next = head.next; // skip noop
        this.tail = tail;
        this.len += len;
    }
    return this;
};

/**
 * 结束 write 操作.
 * @returns {Uint8Array} Finished buffer
 */
Writer.prototype.finish = function finish(){
    var head = this.head.next,
        buf  = this.constructor.alloc(this.len),
        pos  = 0;
    while (head) {
        head.fn(head.val, buf, pos);
        pos += head.len;
        head = head.next;
    }
    return buf;
};

//todo
//**这里写进去string要明确是用什么格式去写(普通流行格式 unicode utf8),先todo在这里
//Writer.prototype.string

module.exports = Writer;
