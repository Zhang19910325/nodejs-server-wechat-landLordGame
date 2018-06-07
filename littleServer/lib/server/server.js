/**
 * Created by zhangmiao on 2018/5/4.
 */

var FilterService = require("../common/service/filterService");
var CommonRpcMessage = require("../common/protocolBuffer/commonRpcService_pb");
var HandlerService = require("../common/service/handlerService");
var Constants = require("../util/constants");
var utils = require("../util/utils");

var Server = function(app, opts){
    this.opts = opts || {};
    this.app  = app;

    this.filterService = null;
    this.handlerService = genHandlerService(app);
};


var genHandlerService = function(app){
    return new HandlerService(app);
};


module.exports.create = function(app, opts){
    return new Server(app, opts);
};

var pro = Server.prototype;

pro.start = function(){
    this.filterService = initFilter(this.app);
    //this.handlerService =
};

pro.afterStart = function(){

};


pro.globalHandle = function(msg, session, cb){
    var self = this;
    var dispatch = function(err, resp, opts){
        if(err){
            handleError(self, err, msg, session, resp, opts, function(err, resp, opts){
                response(self, err, msg, session, resp, opts, cb);
            });
            return;
        }

        ////先自己处理，自己处理了再转发出去
        //if(self.app.getServerType() === Constants.RESERVED.CONNECTOR){
        //    sendRouteServer(self, msg, session, function(err,data){
        //        console.log("err:",err);
        //        console.log("data:",data);
        //        response(self, err, msg, session, resp, opts, cb);
        //    });
        //}else {
        //    //自己处理
        //}
        doHandle(self, msg, session, function(err, data){
            response(self, err, msg, session, resp, opts, cb);
        });

    };
    beforeFilter(self, msg, session, dispatch);
};


var initFilter = function(app){
    var service = new FilterService();

    var befores = app.get(Constants.KEYWORDS.BEFORE_FILTER);
    var afters = app.get(Constants.KEYWORDS.AFTER_FILTER);

    var i, l;
    if(befores){
        for (i = 0, l=befores.length; i < l; i++){
            service.before(befores[i]);
        }
    }

    if(afters){
        for (i = 0, l=afters.length; i < l; i++){
            service.after(afters[i]);
        }
    }

    return service;
};

var initHandler = function(app, opts){

};
var beforeFilter = function(server, msg, session, cb){
    var fm = server.filterService;
    if(fm)
        fm.beforeFilter(msg, session, cb);
    else
        utils.invokeCallback(cb);
};

var afterFilter = function(server, err, msg, session, resp, opts, cb){
    //var fm = server.filterService;
    //if(fm)
    //    fm.afterFilter(err, msg, session, resp, function(err) {
    //        cb(err, resp, opts);
    //    });
};

var handleError = function (server, err, msg, session, resp, opts, cb){
    var handler = server.app.get(Constants.RESERVED.ERROR_HANDLER);
    if(!handler){
        utils.invokeCallback(cb, err, resp, opts);
    }else{
        if(handler.length === 5) {
            handler(err, msg, resp, session, cb);
        } else {
            handler(err, msg, resp, session, opts, cb);
        }
    }
};

var response = function(server, err, msg, session, resp, opts, cb){
    afterFilter(server, err, msg, session, resp, opts, cb);
};

var sendRouteServer = function(self, msg, session, cb){
    var finish = false;
    try {
    //    console.log("app",app);
      //这里是通过rpc协议发送消息，不过对于密集型的网络业务最好直接tcp网络交互
        self.app.routeRpc(genRouteMessage(msg), session, cb);
    }catch (err){
        console.error(err);
    }
};

var doHandle = function(self, msg, session, cb){
    self.handlerService.handle(msg, session, function(err, resp, opts){

    });
};


var genRouteMessage = function(msg){
    var routeMessage = new CommonRpcMessage.RouteRequest();
    routeMessage.setCmd(msg.cmd);
    routeMessage.setUid(msg.uin.toNumber());
    routeMessage.setSeq(msg.seq);
    routeMessage.setBodydata(msg.bodyData);
    return routeMessage;
};
//var doForward = function(app, msg, routeRecord, cb){
//    var finish = false;
//    //需要路由到下一个对应的服务器去
//    try {
//
//    }
//};


