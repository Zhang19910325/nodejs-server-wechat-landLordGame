/**
 * Created by zhangmiao on 2018/5/7.
 */

var fs = require("fs");
var RemoteServer = require("../rpc/rpc-server/rpcServer");
var pathUtil = require("../util/pathUtil");
var Constants = require("../util/constants");
var utils = require("../util/utils");

module.exports = function(app, opts){
    return new Component(app, opts);
};

var Component = function(app, opts){
    opts = opts || {};
    this.app = app;
    this.opts = opts;
};

var pro = Component.prototype;

pro.name = '__remote__';

pro.start = function(cb){
    this.opts.port = this.app.getCurServer().port;
    this.remote = RemoteServer.create(this.app, this.opts);
    //配置remote信息
    if(this.app.getServerType() === Constants.RESERVED.ROUTE) {
        this.remote.addService(getRoutPbPath(), {
            RouteService: getRouteRemotePath()
        });
    }else{
        //todo 另行配置
    }
    this.remote.start();
    process.nextTick(cb);
};

pro.afterStart = function(cb){
    utils.invokeCallback(cb);
};

var getRoutPbPath = function(){
    return pathUtil.getSysRemotePbPath();
};

var getRouteRemotePath = function(){
    return pathUtil.getRouteRemotePath();
};