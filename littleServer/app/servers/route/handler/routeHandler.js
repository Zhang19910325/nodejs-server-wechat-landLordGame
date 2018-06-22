/**
 * Created by zhangmiao on 2018/5/17.
 */

var RouteSessionManager = require("../manager/routeSessionManager");
var AppCommonPb = require("../../../pbMessage/appCommon_pb");
module.exports = function(app, opts){
    return new Service(app, opts);
};

var Service = function(app, opts){
    this.app = app;
    this.routeSessionManager = new RouteSessionManager();
};

Service.prototype.handleMessage = function(packet, session, next){
    //将消息转发到,这里就要考虑消息是从什么地方来的
    var self = this;
    preHandleMsg(self, packet, session, function(){
        if (session.serverType === "connector"){
            handleConnectorMsg(self, packet, session, next);
        } else{
            if(session.serverType === "landLord"){
                handleLandLordMsg(self, packet, session, next);
            }
        }
    });

};
/******预处理end******/
var preHandleMsg = function(self, packet, session, cb){
    var cmd = packet.cmd;
    if(cmd == AppCommonPb.Cmd.KSERVERUSERDISCONNECTED){
        handleUserDisconnected(self, packet, session, cb);
    }else if(cmd == AppCommonPb.Cmd.KSERVERUSERREGISTERDISCONNECTED){//todo 这个目前先不做处理
    }else{
        cb && cb(self, packet, session, cb);
    }
};

var handleUserDisconnected = function(self, packet, session, cb){
    if(session.serverType === "connector") {
        handleConnectorMsg(self, packet, session, cb)
    }
};


/*******预处理end*****/



var handleConnectorMsg = function(self, packet, session, next){
    var uid = packet.uid;
    //这里需要绑定connector uid

    var routeSessionSet = self.routeSessionManager.getRouteSessionSet(uid);
    if(!routeSessionSet){
        routeSessionSet = self.routeSessionManager.createRouteSessionSet(uid);
    }
    if(!routeSessionSet.getSessionByServerType(session.serverType)) {
        routeSessionSet.addSession(session);
    }
    //目前只有一个游戏发送到
    //找到
    var backendSessionService = self.app.backendSessionService;
    var sessionSet = backendSessionService.getSessionSet("landLord");
    var sessionArr = sessionSet.sessionArr;
    var landLordSessionId = sessionArr[0];
    var landLordSession = sessionSet.getSessionById(landLordSessionId);
    landLordSession.send(packet, function(){
    });
};

var handleLandLordMsg = function(self, packet, session, next){
    //目前只有landLord服务器会回传
    var uid = packet.uid;
    var routeSessionSet = self.routeSessionManager.getRouteSessionSet(uid);
    if(!routeSessionSet){
        routeSessionSet = self.routeSessionManager.createRouteSessionSet(uid);
    }
    if(!routeSessionSet.getSessionByServerType(session.serverType)) {
        routeSessionSet.addSession(session);
    }
    //找到connector对应的session
    var connectorSession = routeSessionSet.getSessionByServerType("connector");
    if(!connectorSession){
        console.warn("没有找到uid:",uid,"的connectorSession;消息:",packet,"直接丢掉");
        //直接丢掉
        return;
    }
    connectorSession.send(packet, function(){
    });

};