/**
 * Created by zhangmiao on 2018/5/21.
 */
var ProcessService = require("../../../common/processService/processService");
var HandShakeProcessor = require("../processor/handShakeProcessor");
var HeartTickProcessor = require("../processor/heartTickProcessor");
var BaseProcessor = require("../../../common/processService/baseProcessor");
var AppCommonPb = require("../../../pbMessage/appCommon_pb");

module.exports = function(app, opts){
    return new Service(app, opts);
};

var Service = function(app, opts){
    this.app = app;
    this.processService = new ProcessService(app);
    this.init();
};

Service.prototype.init = function(){
    //心跳包
    this.processService.addProcessor(new HeartTickProcessor(this.app, function(cmd){
        return true;
    }));
    //握手包
    this.processService.addProcessor(new HandShakeProcessor(this.app, function(cmd){
        return AppCommonPb.Cmd.KHANDSAKEREQ == cmd;
    }));
};




Service.prototype.handleMessage = function(packet, session, next){
    //检查命令值cmd是否自己能处理
    //这里需要查看session的类型，消息是从什么地方来的
    var toNext = this.processService.handleProcessorsPacket(packet, session, next);
    if(!toNext) return;

    if (session.name === 'Session'){
        //这个是client直接发的
        //我需要发给路由服务器
        //var backendSession = getBackendSession(this, session);
        var backendSession = this.app.backendSessionService.getBackendSessionBySession(session);
        backendSession.send(packet, function(){
        });
    }else if(session.name === 'BackendSession'){
        //这个是路由服务过来的,直接找到需要传给客户端的session传回去
        var sessionService = this.app.sessionService;
        sessionService.sendMessageByUid(packet.uid, packet.msg);
    }
};



var getBackendSession = function(self, session){
    var backendSessionService = self.app.backendSessionService;
    var sessionSet = backendSessionService.getSessionSet("route");
    var serverId = session.get("routerId");
    if (!serverId){
        //那就要生成一个路由Id
        var sessionArr = sessionSet.sessionArr;
        serverId = sessionArr[Math.floor(Math.random()*sessionArr.length)];
        session.set("routerId", serverId);
    }
    return sessionSet.getSessionById(serverId);
};

//var handle = function(recvPakct, session, next){
//
//};