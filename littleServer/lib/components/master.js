/**
 * Created by zhangmiao on 2018/5/4.
 */

var Master = require("../master/master");
var utils = require("../util/utils");


module.exports = function(app, opts){
    return new Component(app, opts);
};

var Component = function(app, opts){
    this.master = new Master(app, opts);
};


var pro = Component.prototype;

pro.name = '__master__';

pro.start = function(cb){
    this.master.start(cb);
};

pro.afterStart = function(cb){
    utils.invokeCallback(cb);
};

pro.stop = function(){

};
