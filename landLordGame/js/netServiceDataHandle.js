/**
 * Created by zhangmiao on 2018/6/14.
 */


var NetService = require("./net/netService");
var protobuf = require("./weichatPb/protobuf.js");
var appCommon = require("../pbMessage/appCommon");
var appCommonRoot = protobuf.Root.fromJSON(appCommon);


var decodePacket = function(recvPacket, messageType){
    var bodyData = recvPacket.bodyData;
    return appCommonRoot.lookupType(messageType).decode(bodyData);
};

export default class NetServiceDataHandle{
    gameMain = null;
    netService = null;
    constructor(gameMain){
        this.gameMain = gameMain;
        this.netService = new  NetService(0);//todo 这个uid想办法获取
    }
    addListener(){
        var self = this;
        this.netService.addListenerCmd(0x12000, "netServiceDataHandle", this.handleDeskUpdateNty.bind(self));//游戏开始通知
        this.netService.addListenerCmd(0x12002, "netServiceDataHandle", this.handleStartGameNty.bind(self));//游戏开始通知
        this.netService.addListenerCmd(0x12004, "netServiceDataHandle", this.handleTobLandNty.bind(self));//玩家抢地主通知
        this.netService.addListenerCmd(0x12006, "netServiceDataHandle", this.handleSetRobLandNty.bind(self));//玩家地主确定通知
        this.netService.addListenerCmd(0x12008, "netServiceDataHandle", this.handlePlayCardNty.bind(self));//玩家出牌通知
        this.netService.addListenerCmd(0x1200A, "netServiceDataHandle", this.handleGameOverNty.bind(self));//游戏结束通知
        this.netService.addListenerCmd(0x1200C, "netServiceDataHandle", this.handleNoLordNty.bind(self));//因没人抢地主而结束的游戏通知
        this.netService.addListenerCmd(0x1200E, "netServiceDataHandle", this.handleInitDeskNty.bind(self));//初始化桌子的信息(一般用于断网重连,此信息包含较大)
    }
    handleDeskUpdateNty(recvPacket){
        var deskUpdateNtyMessage = decodePacket(recvPacket, "DeskUpdateNty");
        var deskUpdateNtyMessageObject = deskUpdateNtyMessage.toObject();
        this.gameMain.handleDeskUpdateNty && this.gameMain.handleDeskUpdateNty(deskUpdateNtyMessageObject);
    }
    handleStartGameNty(recvPacket){//游戏开始通知
        var startGameNtyMessage = decodePacket(recvPacket, "StartGameNty");
        var startGameNtyMessageObject = startGameNtyMessage.toObject();
        this.gameMain.handleStartGameNty && this.gameMain.handleStartGameNty(startGameNtyMessageObject);
    }
    handleTobLandNty(recvPacket){//玩家抢地主通知
        var bodyData = recvPacket.bodyData;
        var robLandInfoNty = appCommonRoot.lookupType("RobLandInfoNty").decode(bodyData);
        var robLandInfoNtyObject = robLandInfoNty.toObject();
        this.gameMain.handleTobLandNty && this.gameMain.handleTobLandNty(robLandInfoNtyObject);
    }
    handleSetRobLandNty(recvPacket){//玩家地主确定通知
        var bodyData = recvPacket.bodyData;
        var setRobLandNty = appCommonRoot.lookupType("SetLandLordNty").decode(bodyData);
        var setRobLandNtyObject = setRobLandNty.toObject();
        this.gameMain.handleSetRobLandNty && this.gameMain.handleSetRobLandNty(setRobLandNtyObject);
    }
    handlePlayCardNty(recvPacket){//玩家出牌通知
        var bodyData = recvPacket.bodyData;
        var playCardNty = appCommonRoot.lookupType("PlayCardNty").decode(bodyData);
        var playCardNtyObject = playCardNty.toObject();
        this.gameMain.handlePlayCardNty && this.gameMain.handlePlayCardNty(playCardNtyObject);
    }
    handleGameOverNty(recvPacket){//游戏结束通知
        var bodyData = recvPacket.bodyData;
        var gameOverNty = appCommonRoot.lookupType("GameOverNty").decode(bodyData);
        var gameOverNtyObject = gameOverNty.toObject();
        this.gameMain.handleGameOverNty && this.gameMain.handleGameOverNty(gameOverNtyObject);
    }
    handleNoLordNty(recvPacket){//因没人抢地主而结束的游戏通知
        this.gameMain.handleNoLordNty && this.gameMain.handleNoLordNty();
    }
    handleInitDeskNty(recvPacket){
        var bodyData = recvPacket.bodyData;
        var deskInitInfo = appCommonRoot.lookupType("DeskInitInfo").decode(bodyData);
        var deskInitInfoObject = deskInitInfo.toObject();
        this.gameMain.handleInitDeskNty && this.gameMain.handleInitDeskNty(deskInitInfoObject);
    }
    connect(uid, cb){
        if(uid!=null) this.netService.uin = uid;
        var self = this;
        this.netService.addOnConnectedCallback("netServiceDataHandle", function(){
            //其实握手包一定要保证是第一个,todo 现在先这么处理
            console.log("发送握手包");
            self.netService.sendData({
                cmd:0x101,
                success: self.handleShakeCallback.bind(self, cb)
            });
        });
        this.netService.connect({
            "url" : "wss://www.lovelijing.top",
            //"url" : "ws://127.0.0.1:30000",
            success : function(){
                console.log("连接建立成功");
            },
            fail:function(){
                console.log("请求链接失败");
            },
            complete:function(err){
                console.log("链接请求回来", err);
            }
        });
    }

    handleShakeCallback(cb, recvPacket){//握手请求回包
        console.log("握手包回包:",recvPacket);
        this.addListener();
        cb && cb();
    }

    checkRspInvokeCallback(next, cb, recvPacket, sendPacket){
        //先解析成S2CCommonRsp
        var self = this;
        var bodyData = recvPacket.bodyData;
        var s2CCommonRsp = appCommonRoot.lookupType("S2CCommonRsp").decode(bodyData);
        var s2CCommonRspObject = s2CCommonRsp.toObject();
        var rspHead = s2CCommonRspObject.rspHead;
        if(rspHead.code){//有错误码
            console.log("cmd:",recvPacket.cmd,"收到错误码code:",rspHead.code);
            if(rspHead.code === 0x10003){//
                this.gameMain.gameNeedReStart && this.gameMain.gameNeedReStart();
            }
        }else {//无错误码
        }
        next(recvPacket, cb);
    }
    /*******加入游戏*****/
    joinGameReq(object, cb){
        var self = this;
        this.netService.sendData({
            cmd:0x10001,
            success:self.handleJoinGameRsp.bind(self, cb)
        });
    }
    handleJoinGameRsp(cb, recvPacket){
        var self = this;
        var bodyData = recvPacket.bodyData;
        var JoinGameRspMessage = appCommonRoot.lookupType("JoinGameRsp");
        var joinGameRsp = JoinGameRspMessage.decode(bodyData);
        var joinGameRspObj = joinGameRsp.toObject();
        cb && cb(joinGameRspObj);
    }
    /*******加入游戏*****/
    /*******准备游戏*****/
    readyGameReq(object, cb){
        var self = this;
        this.netService.sendData({
            cmd:0x10003,
            success: self.checkRspInvokeCallback.bind(self, self.readyGameRsp.bind(self), cb)
        });
    }
    readyGameRsp(recvPacket, cb){
        var self = this;
        var bodyData = recvPacket.bodyData;
        var s2CCommonRsp = appCommonRoot.lookupType("S2CCommonRsp").decode(bodyData);
        var s2CCommonRspObject = s2CCommonRsp.toObject();
        cb && cb(s2CCommonRspObject);
    }
    /*******准备游戏*****/
    /*******抢地主*****/
    robLandReq(object, cb){
        var self = this;
        var robLandReq = appCommonRoot.lookupType("RobLandReq").create(object);
        this.netService.sendData({
            cmd : 0x10005,
            data : robLandReq.encode().finish(),
            success:self.checkRspInvokeCallback.bind(self, self.robLandRsp.bind(self), cb)
        })
    }
    robLandRsp(recvPacket, cb){
        var self = this;
        var bodyData = recvPacket.bodyData;
        var robLandRsp = appCommonRoot.lookupType("RobLandRsp").decode(bodyData);
        var robLandRspObject = robLandRsp.toObject();
        cb && cb(robLandRspObject);
    }
    /*******抢地主*****/
    /*******出牌******/
    playCardReq(object, cb){
        var self = this;
        var playCardReq = appCommonRoot.lookupType("PlayCardReq").create();
        playCardReq.cards = object.cards;
        this.netService.sendData({
            cmd : 0x10007,
            data : playCardReq.encode().finish(),
            success:self.checkRspInvokeCallback.bind(self, self.playCardRsp.bind(self), cb)
        });
    }
    playCardRsp(recvPacket, cb){
        var self = this;
        var bodyData = recvPacket.bodyData;
        var playCardRsp = appCommonRoot.lookupType("PlayCardRsp").decode(bodyData);
        var playCardRspObject = playCardRsp.toObject();
        cb && cb(playCardRspObject);
    }
    /*******出牌******/

}