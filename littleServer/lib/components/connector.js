/**
 * Created by zhangmiao on 2018/5/1.
 */
var WebSocketConnector = require("../connectors/webSocketConnector.js");
var path = require("path");
var events = require("../util/events");
var Constants = require("../util/constants");
var taskManager = require("../common/manager/taskManager");

module.exports = function(app, opts){
    return new Component(app, opts);
};


var Component = function(app, opts){
    this.app = app;
    opts = opts || {};

    this.encode = opts.encode;
    this.decode = opts.decode;
    this.connector = getConnector(app, opts);

};

var pro = Component.prototype;

pro.name = "__connector__";

pro.start = function(cb){
    //添加一些server、session、connection
    this.server = this.app.components.__server__;
    this.session = this.app.components.__session__;

    process.nextTick(cb);
};

pro.afterStart = function(cb){
    this.connector.start(cb);
    this.connector.on('connection', bindEvents.bind(this));
};

pro.stop = function(force, cb){

};

pro.send = function(){

};

var bindEvents = function(socket){
    var self = this;

    var session = getSession(self, socket);
    socket.on('disconnect', function(){

    });
    socket.on('error', function(){

    });
    socket.on('message', function(msg){
        var dmsg = msg;

        //decode
        if(self.decode){
            dmsg = self.decode.call(self, msg);
        }else if(self.connector.decode){
            dmsg = self.connector.decode(msg);
        }

        if(!dmsg){
            return;
        }


        //检测这里是否有加密
        //检测这里是否有压缩
        handleMessage(self,session, dmsg);
    });
};

var getSession = function(self, socket){
    var app = self.app, sid = socket.id;
    var session = self.session.get(sid);
    if(session){
        return session;
    }
    session = self.session.create(sid, app.getServerId(), socket);

    socket.on('disconnect', session.closed.bind(session));
    socket.on('error', session.closed.bind(session));
    session.on('closed', onSessionClose.bind(null, app));
    session.on("bind", function(uid){
       //绑定uid成功,将uid和socketId进行关联
        self.session.bind(sid, uid, function(err){
            console.log("connector绑定uid:",uid,"到sid:",sid);
        });
    });
    session.on("unbind", function(uid){
        //解绑
    });

    return session;
};

var onSessionClose = function(app, session, reason){
    taskManager.closeQueue(session.id, true);
    app.event.emit(events.CLOSE_SESSION, session, reason);
};

var  handleMessage = function(self, session, msg){
    self.server.globalHandle(msg, session.toFrontendSession(), function(){

    });
};

var getConnector = function(app, opts){
    var curServer = app.getCurServer();
    if(!opts[Constants.RESERVED.CERT_OPTIONS]){
        var keyPath = path.join("");
        var options = {};
        options[Constants.RESERVED.KEY_PATH] = path.join(app.get(Constants.RESERVED.BASE), Constants.FILEPATH.CERT_KEY);
        options[Constants.RESERVED.CERT_PATH] = path.join(app.get(Constants.RESERVED.BASE), Constants.FILEPATH.CERT_PATH);
        opts[Constants.RESERVED.CERT_OPTIONS] = options;
    }
    return new WebSocketConnector(curServer.clientPort, opts);
};
