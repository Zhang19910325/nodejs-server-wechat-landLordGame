/**
 * Created by zhangmiao on 2018/5/7.
 */

var Service = function(){
    this.befores = [];
    this.afters = [];
};

module.exports = Service;

var pro = Service.prototype;

pro.name = 'filter';


pro.before = function(filter){
    this.befores.push(filter);
};

pro.after = function(filter){
    this.afters.unshift(filter);
};

pro.beforeFilter = function(msg, session, cb){
    var next = genNext(msg, session, cb, this.befores, "before");
    next();
};

pro.afterFilter = function(msg, session, cb){
    var next = genNext(msg, session, cb, this.afters, "after");
    next();
};

var genNext = function(msg, session, cb, filters, handleName){
    var index = 0;
    var next = function (err, resp, opts){
        if(err || index >= filters.length){
            cb(err, resp, opts);
            return;
        }
        var handler = filters[index++];
        if(typeof handler === "function"){
            handler(err, msg, session, next);
        }else if(typeof handler[handleName] === "function"){
            handler[handleName](err, msg, session, next);
        }else{
            next(new Error('没有找到 filter'));
        }
    };

    return next;
};