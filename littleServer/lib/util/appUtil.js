/**
 * Created by zhangmiao on 2018/4/27.
 */

var appUtil = module.exports;
var async = require('async');
var Constants = require("./constants");
var starter = require("../master/starter");
var utils = require('./utils');


appUtil.defaultConfiguration = function(app){
    var args = parseArgs(process.argv);
    setupEnv(app, args);
    loadMaster(app);
    loadServers(app);
    processArgs(app,args);
    loadLifecycle(app);
};


appUtil.startByType = function (app, cb){
    var starterId = app.get(Constants.KEYWORDS.SERVER_STARTER_ID);
    if(!!starterId){
        if (starterId === Constants.RESERVED.MASTER){
            utils.invokeCallback(cb);
        }else {
            starter.runServers(app);
        }
    }else{
        if(!!app.type && app.type !== Constants.RESERVED.ALL && app.type !== Constants.RESERVED.MASTER) {
            starter.runServers(app);
        } else {
            utils.invokeCallback(cb);
        }
    }

};

appUtil.loadDefaultComponents = function(app){
    //这里加载长链接的组件
    var ServerApp = require("../serverApp");
    if(app.serverType === Constants.RESERVED.MASTER){
        //如果开启的是master服务器那就只加载master,master用来启动其它进程
        app.load(ServerApp['master'], app.get("masterConfig"));
        //app.load(ServerApp.load)
    }else{
        //1、构建rpc客户端
        app.load(ServerApp['proxy'], app.get("proxyConfig"));
        app.load(ServerApp['backendSession'], app.get("backendSessionConfig"));
        if(app.getCurServer().port){
            //2、如果存在rpc端口就构造rpc服务器
            app.load(ServerApp['remote'], app.get('remoteConfig'));
        }
        if (app.getCurServer().routePort){
            app.load(ServerApp['route'], app.get('routeConfig'));
        }else {
            app.load(ServerApp['routeProxy'], app.get('routeProxyConfig'));
        }
        if(app.isFrontend()){
            app.load(ServerApp['connector'], app.get("connectorConfig"));
            app.load(ServerApp['session'], app.get('sessionConfig'));
        }
        app.load(ServerApp['server'], app.get('serverConfig'));
        app.load(ServerApp['monitor'], app.get('monitorConfig'));
    }
};

appUtil.optComponents = function(comps, method, cb){
    var i = 0;
    async.forEachSeries(comps, function(comp, done){
        i++;
        if(typeof comp[method] === 'function'){
            comp[method](done);
        }else if(typeof done === 'function'){
            done();
        }else{
            console.log("我需要执行什么东西吗");
        }
    },function(err){
        if(err){
            console.log("method:"+method+"出错了:",err);
        }
        utils.invokeCallback(cb, err)
    });

};

var  setupEnv = function (app, args){
    app.set(Constants.RESERVED.ENV, args.env || process.env.NODE_ENV || Constants.RESERVED.ENV_DEV, true)
};

var loadMaster = function (app){
    app.loadConfigBaseApp(Constants.RESERVED.MASTER, Constants.FILEPATH.MASTER);
    app.master = app.get(Constants.RESERVED.MASTER);
};

var processArgs = function (app, args){
    var serverType = args.serverType || Constants.RESERVED.MASTER;
    var serverId = args.id || app.getMaster().id;
    //var mode = args.mode || Constants.RESERVED.CLUSTER;

    app.set(Constants.RESERVED.MAIN, args.main, true);
    app.set(Constants.RESERVED.SERVER_TYPE, serverType, true);
    app.set(Constants.RESERVED.SERVER_ID, serverId, true);

    //设置Server

    if(serverType != Constants.RESERVED.MASTER){
        app.set(Constants.RESERVED.CURRENT_SERVER, args, true);
    }else {
        app.set(Constants.RESERVED.CURRENT_SERVER, app.master, true);
    }
};

var loadLifecycle = function(app, cb){

};

var loadServers = function (app){
    app.loadConfigBaseApp(Constants.RESERVED.SERVERS, Constants.FILEPATH.SERVER);
    var servers = app.get(Constants.RESERVED.SERVERS);
    var serverMap = {}, slist, i, l, server;
    for (var serverType in servers){
        if(!servers.hasOwnProperty(serverType)) continue;
        slist = servers[serverType];
        for (i = 0, l = slist.length; i < l; i++){
            server = slist[i];
            server.serverType = serverType;
            serverMap[server.id] = server;
        }
    }
    app.set(Constants.KEYWORDS.SERVER_MAP, serverMap);
};


var parseArgs = function(args) {
    var argsMap = {};
    var mainPos = 1;

    while (args[mainPos].indexOf('--') > 0) {
        mainPos++;
    }
    argsMap.main = args[mainPos];

    for (var i = (mainPos + 1); i < args.length; i++) {
        var arg = args[i];
        var sep = arg.indexOf('=');
        var key = arg.slice(0, sep);
        var value = arg.slice(sep + 1);
        if (!isNaN(Number(value)) && (value.indexOf('.') < 0)) {
            value = Number(value);
        }
        argsMap[key] = value;
    }

    return argsMap;
};