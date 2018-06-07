/**
 * Created by zhangmiao on 2018/5/28.
 */


var Manager = function(){
    this.uidMap = {};//uid -> RouteSessionSet
};


module.exports = Manager;


Manager.prototype.getRouteSessionSet = function(uid){
    return this.uidMap[uid];
};

Manager.prototype.removeRouteSessionSet = function(uid){
    delete this.uidMap[uid];
};

Manager.prototype.createRouteSessionSet = function(uid){
    var routeSessionSet  = new RouteSessionSet(uid);
    this.uidMap[uid] = routeSessionSet;
    return routeSessionSet;
};


var RouteSessionSet = function(uid){
    this.uid = uid;
    this.sessions = {}; //serverType -> session
};

RouteSessionSet.prototype.addSession = function(session){
    var serverType = session.serverType;
    this.sessions[serverType] = session;
};

RouteSessionSet.prototype.getSessionByServerType = function(serverType){
    return this.sessions[serverType];
}