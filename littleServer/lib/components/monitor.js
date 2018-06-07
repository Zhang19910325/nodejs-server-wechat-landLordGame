/**
 * Created by zhangmiao on 2018/5/9.
 */
var Monitor = require("../monitor/monitorConsole");
var utils = require("../util/utils");


module.exports = function(app, opts){
    return new Component(app, opts);
};

var Component = function(app, opts){
    this.monitor = new Monitor(app, opts);
};

var pro = Component.prototype;

pro.name = "__monitor__";

pro.start = function(cb){
    this.monitor.start(cb);
};


pro.afterStart = function(cb){
    utils.invokeCallback(cb);
};