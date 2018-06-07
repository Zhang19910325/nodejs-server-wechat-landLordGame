/**
 * Created by zhangmiao on 2018/3/29.
 */
var util = module.exports;

util.arrayFrom = function (arrayBuffer){
    var uInt8Array = new Uint8Array(arrayBuffer);
    var arr = [];
    for (var i = 0; i < uInt8Array.length; i++){
        arr.push(uInt8Array[i]);
    }
    return arr;
};

util.merge = function merge(dst, src, ifNotSet) {
    for (var keys = Object.keys(src), i = 0; i < keys.length; ++i)
        if (dst[keys[i]] === undefined || !ifNotSet)
            dst[keys[i]] = src[keys[i]];
    return dst;
};

util.wxPromisify = function wxPromisify(fn){
    return function (obj = {}){
        return new Promise((resolve, reject) => {
            obj.success = function(res){
                resolve(res);
            };
            obj.fail = function(res){
                reject(res)
            };

            fn(obj)
        })
    }
};
util.aSync = function(){
    var fn = arguments[0];
    if(!fn) return;
    var target = arguments[1];
    var args = Array.prototype.slice.call(arguments,2);
    (util.wxPromisify(function(){
        fn.apply(target, args);
    }))();
};


var __sto = setInterval;
util.setInterval =  function(callback,timeout,param){
    var args = Array.prototype.slice.call(arguments,2);
    var _cb = function(){
        callback.apply(null,args);
    };
    __sto(_cb,timeout);
};


util.onTimeOut = function(sendPacket){
    //异步执行出去
    util.wxPromisify(function(){
        if(typeof sendPacket.fail == 'function'){
            sendPacket.fail(sendPacket);
        }
    })
}
//util.Array = typeof Uint8Array !== "undefined" ? Uint8Array /* istanbul ignore next */ : Array;