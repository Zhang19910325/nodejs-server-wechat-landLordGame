/**
 * Created by zhangmiao on 2018/5/17.
 */

var RouteSessionManager = require("../manager/routeSessionManager");
module.exports = function(app, opts){
    return new Service(app, opts);
};

var Service = function(app, opts){
    this.app = app;
    this.routeSessionManager = new RouteSessionManager();
};

Service.prototype.handleMessage = function(msg, session, next){
    //将消息转发到,这里就要考虑消息是从什么地方来的
    console.log(this.app.getServerId(),"路由服务收到消息",session.serverType);
    if (session.serverType === "connector"){
        handleConnectorMsg(this, msg, session, next);
    } else if(session.serverType === "landLord"){
        handleLandLordMsg(this, msg, session, next);
    }
};


var handleConnectorMsg = function(self, msg, session, next){
    var uid = msg.uid;
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
    landLordSession.send(msg, function(){
    });
};

var handleLandLordMsg = function(self, msg, session, next){
    //目前只有landLord服务器会回传
    var uid = msg.uid;
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
        console.warn("没有找到uid:",uid,"的connectorSession;消息:",msg,"直接丢掉");
        //直接丢掉
        return;
    }
    connectorSession.send(msg, function(){
    });

};