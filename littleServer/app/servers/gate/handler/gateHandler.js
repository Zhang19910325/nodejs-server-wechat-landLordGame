/**
 * Created by zhangmiao on 2018/5/23.
 */
module.exports = function(app, opts){
    return new Service(app, opts);
};

var Service = function(app, opts){
    this.app = app;
};



Service.prototype.handleMessage = function(recvPacket, session, next){
    this.app.routeMessage(recvPacket.msg, function(){
    });
};