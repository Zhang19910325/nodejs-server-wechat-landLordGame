/**
 * Created by zhangmiao on 2018/5/1.
 */

//var util = require("");

var utils = module.exports;

utils.invokeCallback = function(cb) {
    if ( !! cb && typeof cb === 'function') {
        cb.apply(null, Array.prototype.slice.call(arguments, 1));
    }
};

utils.arrayFrom = function (arrayBuffer){
    var uInt8Array = new Uint8Array(arrayBuffer);
    var arr = [];
    for (var i = 0; i < uInt8Array.length; i++){
        arr.push(uInt8Array[i]);
    }
    return arr;
};

utils.isObject = function(arg) {
    return typeof arg === 'object' && arg !== null;
};

utils.toArrayBuffer = function(buf) {
    var ab = new ArrayBuffer(buf.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
};