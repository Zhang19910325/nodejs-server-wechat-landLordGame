/**
 * Created by zhangmiao on 2018/5/7.
 */
var SessionService = require("../common/service/sessionService");
var utils = require("../util/utils");

module.exports = function(app, opts){
    var cmp = new Component(app, opts);
    app.set('sessionService', cmp, true);
    return cmp;
}

var Component = function(app, opts){
    opts = opts || {};
    this.app = app;
    this.service = new SessionService(opts);

    var getFun = function(m) {
        return function() {
            return self.service[m].apply(self.service, arguments);
        };
    };

    var method, self = this;
    for(var m in this.service){
        if(m !== 'start' && m !== 'stop') {
            method = this.service[m];
            if(typeof method === 'function') {
                this[m] = getFun(m);
            }
        }
    }
};


Component.prototype.name = '__session__';

var pro = Component.prototype;

pro.start = function(cb){
    utils.invokeCallback(cb);
};

pro.afterStart = function(cb){
    utils.invokeCallback(cb);
};