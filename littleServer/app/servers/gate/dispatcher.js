/**
 * Created by zhangmiao on 2018/5/23.
 */
var Dispatcher = function(app, opts){
    this.app = app;
};

var pro = Dispatcher.prototype;
module.exports = function(app, opts){
    return new Dispatcher(app, opts);
};

pro.getHandleName = function(msg){
    //这里只有一个处理msg的handler
    return "gateHandler";
};