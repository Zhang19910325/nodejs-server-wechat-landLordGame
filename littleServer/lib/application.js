/**
 * Created by zhangmiao on 2018/4/27.
 */

module.exports = Application;
var Constants = require("./util/constants.js");
var utils = require("./util/utils");
var EventEmitter = require('events').EventEmitter;
var fs = require("fs");
var path = require('path');
var appUtil = require("./util/appUtil.js");
var events = require("./util/events");

var STATE_INITED  = 1;  // app has inited
var STATE_START   = 2;  // app start
var STATE_STARTED = 3;  // app has started
var STATE_STOPED  = 4;  // app has stoped

function Application(opts){
    opts = opts || {};
    this.loaded = [];
    this.components = {};   // name -> component map
    this.settings = {};
    this.serverId = null;
    this.serverType = null;
    this.master = null;
    var base = opts.base || path.dirname(require.main.filename);
    this.set(Constants.RESERVED.BASE, base, true);
    this.event = new EventEmitter();

    //server
    this.curServer = null;  // current server info


    this.port = null;//这个服务器监听的端口


    this.lifecycleCbs = {};     // current server custom lifecycle callbacks

    appUtil.defaultConfiguration(this);
    this.state = STATE_INITED;
}


Application.prototype.start = function (cb){
    this.startTime = Date.now();
    var self = this;
    appUtil.startByType(self,function(){
        //这里可以加载一些自定义的组建,绑定到self上
        appUtil.loadDefaultComponents(self);
        appUtil.optComponents(self.loaded, Constants.RESERVED.START,function(err){
            self.state = STATE_START;
            if(err){
                utils.invokeCallback(cb, err);
            }else{
                self.afterStart(cb);
            }
        });
        //todo 这里需要执行beforeFilter的一些函数
        //开始建立

    });
};

Application.prototype.afterStart = function(cb){
    if (this.state != STATE_START){
        utils.invokeCallback(cb, new  Error("application is not running now."));
        return;
    }
    var afterFun = this.lifecycleCbs[Constants.LIFECYCLE.AFTER_STARTUP];
    var self = this;
    appUtil.optComponents(this.loaded, Constants.RESERVED.AFTER_START, function(err){
        self.state = STATE_STARTED;
        var id = self.getServerId();
        if(!err){
            console.log(id+" finish start");
        }

        if(!!afterFun){
            afterFun.call(null, self, function(){
                utils.invokeCallback(cb, err)
            });
        }else{
            utils.invokeCallback(cb, err);
        }

        var usedTime = Date.now() - self.startTime;
        console.log(id+" startup in "+usedTime);
        self.event.emit(events.START_SERVER, id);
    });
};

Application.prototype.getCurServer = function() {
    return this.curServer;
};

Application.prototype.getServersFromConfig= function(){
    return this.get(Constants.KEYWORDS.SERVER_MAP);
};


Application.prototype.set = function (setting, val, attach){
    if(arguments.length === 1){
        return this.settings[setting];
    }
    this.settings[setting] = val;
    if(attach)
        this[setting] = val;
    return this;
};

Application.prototype.get = function(setting){
    return this.settings[setting];
};

Application.prototype.loadConfigBaseApp = function(key, val, reload){
    var self = this;
    var env = this.get(Constants.RESERVED.ENV);
    var originPath = path.join(this.get(Constants.RESERVED.BASE), val);
    var presentPath = path.join(this.get(Constants.RESERVED.BASE), Constants.FILEPATH.CONFIG_DIR, env, path.basename(val));
    var realPath;
    if(fs.existsSync(originPath)){
        realPath = originPath;
        var file = require(realPath);
        if(file[env]){
            file = file[env];
        }
        this.set(key, file);
    }else if(fs.existsSync(presentPath)){
        realPath = presentPath;
        var pfile = require(realPath);
        this.set(key, pfile);
    }else{
        console.log("没有找到需要加载的文件")
    }
};

Application.prototype.getMaster = function(){
    return this.master;
};

Application.prototype.getServerId = function() {
    return this.serverId;
};

Application.prototype.getServerType = function() {
    return this.serverType;
};

Application.prototype.getBase = function() {
    return this.get(Constants.RESERVED.BASE);
};

Application.prototype.isFrontend =  function(server){
    server = server || this.getCurServer();
    return !!server && server['frontend'] === 'true';
};
Application.prototype.load = function(name, component, opts){
    if(typeof name !== 'string') {
        opts = component;
        component = name;
        name = null;
        if(typeof component.name === 'string') {
            name = component.name;
        }
    }

    if(typeof component === 'function') {
        component = component(this, opts);
    }

    if(!name && typeof component.name === 'string') {
        name = component.name;
    }

    if(name && this.components[name]) {
        // ignore duplicat component
        console.warn('ignore duplicate component: %j', name);
        return;
    }

    this.loaded.push(component);
    if(name) {
        // components with a name would get by name throught app.components later.
        this.components[name] = component;
    }

    return this;
};

Application.prototype.configure = function(type, fn){
    var args = [].slice.call(arguments);
    fn = args.pop();

    if(type === Constants.RESERVED.ALL || contains(this.settings.serverType, type)){
        fn.call(this);
    }

    return this;
};

var contains = function(str, settings) {
    if(!settings) {
        return false;
    }

    var ts = settings.split("|");
    for(var i=0, l=ts.length; i<l; i++) {
        if(str === ts[i]) {
            return true;
        }
    }
    return false;
};