/**
 * Created by zhangmiao on 2018/5/24.
 */

var BaseProcessor = function(app, isProcess){
    this.app = app;
    //this.cmd = cmd;
    this.isProcess = isProcess;
};

BaseProcessor.BaseProcessor = BaseProcessor;

module.exports = BaseProcessor;

BaseProcessor.prototype.handleMessage = function(packet, session, next){
    if(!this.isProcess(packet.cmd)) return true;
    return this.processRecvPacket(packet, session, next);
};
BaseProcessor.prototype.processRecvPacket = function(packet, session, next){
    this.app.routeMessage(packet.msg, function(){
    });
    return false;
};