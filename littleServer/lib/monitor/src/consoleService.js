/**
 * Created by zhangmiao on 2018/5/9.
 */

var EventEmitter = require('events').EventEmitter;
var util = require("util");
var utils = require("../../util/utils");
var MasterAgent = require("./masterAgent");
var MonitorAgent = require("./monitorAgent");

var ConsoleService = function(opts){
    EventEmitter.call(this);
    this.port = opts.port;
    this.master = opts.master;

    if(this.master){
        //如果是master服务器
        this.agent = new MasterAgent(this, {});
    }else {
        //如果是非master服务器
        this.type = opts.type;
        this.id   = opts.id;
        this.host = opts.host;
        this.agent = new MonitorAgent({
            consoleService : this,
            id : this.id,
            type : this.type,
            info : opts.info
        })
    }
};

util.inherits(ConsoleService, EventEmitter);

module.exports = ConsoleService;

var pro  = ConsoleService.prototype;

pro.startRoute = function(cb){
    this.agent.startRoute(cb);
}

pro.start = function(cb){
    var self = this;
    if(this.master){
        //var  self = this;
        this.agent.listen(this.port, function(err){
            if(!!err){
                utils.invokeCallback(cb, err);
                return;
            }
            //将一些事件抛出去
            process.nextTick(function(){
                utils.invokeCallback(cb);
            })

        });
    }else {
        this.agent.connect(this.port, this.host, cb)
    }

    this.agent.on("register", function(server){
        self.emit("register", server);
    });
};

