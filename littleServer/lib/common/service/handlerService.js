/**
 * Created by zhangmiao on 2018/5/4.
 */
var pathUtil = require("../../util/pathUtil");
var Loader = require("../../util/loader");
var path = require("path");
var fs = require("fs");
var utils = require("../../util/utils");
var Constants = require("../../util/constants");


var Service = function(app, opts){
    this.app = app;
    this.handleMap = {};
    this.dispatcher = genDispatcher(app);
    watchHandlers(app, this.handleMap);
};

module.exports = Service;

var pro = Service.prototype;

pro.name = "handler";

pro.handle = function(recvPacket, session, cb){
    var handler = this.getHandle(recvPacket);
    if(!handler){
        utils.invokeCallback(cb, new Error('没有找到处理handler的函数'));
        return;
    }
    if(typeof handler[Constants.HANDLERFUN.HANDLE_MESSAGE] != 'function'){
        utils.invokeCallback(cb, new  Error("handler:", handler,"没实现",Constants.HANDLERFUN.HANDLE_MESSAGE));
        return;
    }
    handler[Constants.HANDLERFUN.HANDLE_MESSAGE](recvPacket, session, cb);
};


pro.getHandle = function(recvPacket){
    if(!this.dispatcher){
        console.warn("没有找到处理recvPacket",this.app.serverType,"的dispatcher");
        return null;
    }
    var handlerName = this.dispatcher.getHandleName(recvPacket);
    var handler = this.handleMap[handlerName];
    if(!handler){
        //懒加载的形式获取handler实例
        handler = loadModuleHandler(this.app, this.handleMap, handlerName);
    }

    if(!handler){
        console.warn("没有找到处理recvPacket",recvPacket,"的handle");
        return null;
    }
    return handler;
};



var loadModuleHandler = function(app,handlerMap,moduleName){
    var p = pathUtil.getHandlerPath(app.getBase(), app.serverType);
    var filePath = path.join(p, '/'+moduleName);

    if (fs.existsSync(filePath) || fs.existsSync(filePath+".js")){
        handlerMap[moduleName] = Loader.loadFile(filePath, app);
    }
    return handlerMap[moduleName];
};


var watchHandlers = function(app, handlerMap) {
    var p = pathUtil.getHandlerPath(app.getBase(), app.serverType);
    if (!!p){
        fs.watch(p, function(event, name) {
            var moduleName = path.basename(name, ".js");
            if((event === 'change' || event === "rename")&& handlerMap[moduleName]) {//todo 这里可能针对不同的服务器系统需要做不同的处理
                var filePath = path.join(p,name);
                handlerMap[moduleName] = Loader.loadFile(filePath, app);
            }
        });
    }
};

var genDispatcher = function(app){
    var p = pathUtil.getHandlerDispatcherPath(app.getBase(), app.serverType);
    if(!p){
        console.warn("没有找到",app.serverType,"handlerDispatcher");
        return null;
    }
    return Loader.loadFile(p, app);
};