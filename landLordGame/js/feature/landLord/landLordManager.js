/**
 * Created by zhangmiao on 2018/6/28.
 *
 */
let protobuf = require("../../weichatPb/protobuf.js");
let appCommon = require("../../../pbMessage/appCommon");
let appCommonRoot = protobuf.Root.fromJSON(appCommon);

let decodePacketToObject = function(recvPacket, messageType){
    var bodyData = recvPacket.bodyData;
    return appCommonRoot.lookupType(messageType).decode(bodyData).toObject();
};

let createPbBufferWith = function(messageType, object){
    var message = appCommonRoot.lookupType(messageType).create(object);
    return message.encode().finish();
};

export default class LandLordManager{
    robTime = 0;//抢地主的次数
    maxScore = 0;//抢地主的分数
    rate = 1;
    landLordSeatNo = null; //当前地主的座位号
    deskNo = null;//自己的桌号
    seatNo = null;//自己的座位号
    preSeatNo = null;//上一位座位号
    nextSeatNo = null;//下一位座位号
    currentDealSeatNo = null;//当前操作座位号
    lastDealSeatNo = null;//本回合上一位操作者座位号，
    currentRobSeatNo = null;//当前叫地主座位号
    roundWinSeatNo = null;//本轮当前赢牌的玩家座位号
    players = null;
    constructor(){
        this.netService = JMain.netService;
        this.addListener();
    }
    reset(){
        this.maxScore = 0;//抢地主的分数
        this.rate = 1;
        this.landLordSeatNo = null; //当前地主的座位号
        this.currentDealSeatNo = null;//当前操作座位号
        this.lastDealSeatNo = null;//本回合上一位操作者座位号，
        this.currentRobSeatNo = null;//当前叫地主座位号
    }
    getNextSeatNo(seatNo){
        if(seatNo == this.seatNo) return this.nextSeatNo;
        if(seatNo == this.preSeatNo) return this.seatNo;
        if(seatNo == this.nextSeatNo) return this.preSeatNo;
    }
    getPreSeatNo(seatNo){
        if(seatNo == this.seatNo) return this.preSeatNo;
        if(seatNo == this.preSeatNo) return this.nextSeatNo;
        if(seatNo == this.nextSeatNo) return this.seatNo;
    }
    addListener(){
        this.netService.addListenerCmd(0x12000, "landLordManager", this.handleDeskUpdateNty.bind(this));//游戏开始通知
        this.netService.addListenerCmd(0x12002, "landLordManager", this.handleStartGameNty.bind(this));//游戏开始通知
        this.netService.addListenerCmd(0x12004, "landLordManager", this.handleTobLandNty.bind(this));//玩家抢地主通知
        this.netService.addListenerCmd(0x12006, "landLordManager", this.handleSetRobLandNty.bind(this));//玩家地主确定通知
        this.netService.addListenerCmd(0x12008, "landLordManager", this.handlePlayCardNty.bind(this));//玩家出牌通知
        this.netService.addListenerCmd(0x1200A, "landLordManager", this.handleGameOverNty.bind(this));//游戏结束通知
        this.netService.addListenerCmd(0x1200C, "landLordManager", this.handleNoLordNty.bind(this));//因没人抢地主而结束的游戏通知
        this.netService.addListenerCmd(0x1200E, "landLordManager", this.handleInitDeskNty.bind(this));//初始化桌子的信息(一般用于断网重连,此信息包含较大)
    }
    handleDeskUpdateNty(recvPacket){
        //let self = this;
        //var deskUpdateNtyMessageObject = decodePacketToObject(recvPacket,"DeskUpdateNty");
        //ZMNotificationCenter.postNotificationName("",deskUpdateNtyMessageObject);
    }
    handleStartGameNty(recvPacket){//游戏开始通知
        var startGameNtyMessageObject = decodePacketToObject(recvPacket, "StartGameNty");
        ZMNotificationCenter.postNotificationName("landLordStartGameNty", startGameNtyMessageObject);
    }
    handleTobLandNty(recvPacket){//玩家抢地主通知
        var robLandInfoNtyObject = decodePacketToObject(recvPacket, "RobLandInfoNty");
        ZMNotificationCenter.postNotificationName("landLordToLandNty", robLandInfoNtyObject);
    }
    handleSetRobLandNty(recvPacket){//玩家地主确定通知
        var setRobLandNtyObject = decodePacketToObject(recvPacket, "SetLandLordNty");
        ZMNotificationCenter.postNotificationName("landLordSetLorderNty", setRobLandNtyObject);
    }
    handlePlayCardNty(recvPacket){//玩家出牌通知
        var playCardNtyObject = decodePacketToObject(recvPacket, "PlayCardNty");
        ZMNotificationCenter.postNotificationName("landLordPlayCardNty", playCardNtyObject);
    }
    handleGameOverNty(recvPacket){//游戏结束通知
        var gameOverNtyObject = decodePacketToObject(recvPacket, "GameOverNty");
        ZMNotificationCenter.postNotificationName("landLordGameOverNty", gameOverNtyObject);
    }
    handleNoLordNty(recvPacket){//因没人抢地主而结束的游戏通知
        ZMNotificationCenter.postNotificationName("landLordNoLordNty",null);
    }
    handleInitDeskNty(recvPacket){
        var deskInitInfoObject = decodePacketToObject(recvPacket, "DeskInitInfo");
        ZMNotificationCenter.postNotificationName("landLordInitDeskNty",deskInitInfoObject);
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
        let self = this;
        let data = createPbBufferWith("JoinGameReq", object);
        this.netService.sendData({
            cmd:0x10001,
            data:data,
            success:self.handleJoinGameRsp.bind(self, cb)
        });
    }
    handleJoinGameRsp(cb, recvPacket){
        let self = this;
        let joinGameRspObj = decodePacketToObject(recvPacket, "JoinGameRsp");
        cb && cb(joinGameRspObj);
    }
    /*******加入游戏*****/
    /*******开始游戏*****/
    startGameReq(object, cb){
        this.netService.sendData({
            cmd:0x1000A,
            success:this.handleStartGameRsp.bind(this, cb)
        })
    };
    handleStartGameRsp(cb, recvPacket){
        let startGameRspObj = decodePacketToObject(recvPacket, "StartGameRsp");
        cb && cb(startGameRspObj)
    }
    /*******开始游戏*****/
    /*******准备游戏*****/
    readyGameReq(object, cb){
        this.netService.sendData({
            cmd:0x10003,
            success:this.checkRspInvokeCallback.bind(this, this.readyGameRsp.bind(this), cb)
        })
    }
    readyGameRsp(recvPacket, cb){
        var object = decodePacketToObject(recvPacket, "S2CCommonRsp");
        cb && cb(object);
    }
    /*******准备游戏*****/
    /*******抢地主******/
    robLandReq(object, cb){
        var robLandReq = appCommonRoot.lookupType("RobLandReq").create(object);
        this.netService.sendData({
            cmd : 0x10005,
            data : robLandReq.encode().finish(),
            success:this.checkRspInvokeCallback.bind(this, this.robLandRsp.bind(this), cb)
        })
    }
    robLandRsp(recvPacket, cb){
        var robLandRspObject = decodePacketToObject(recvPacket, "RobLandRsp");
        cb && cb(robLandRspObject);
    }
    /*******抢地主******/
    /*******出牌*******/
    playCardReq(object, cb){
        var playCardReq = appCommonRoot.lookupType("PlayCardReq").create(object);
        this.netService.sendData({
            cmd : 0x10007,
            data : playCardReq.encode().finish(),
            success:this.checkRspInvokeCallback.bind(this, this.playCardRsp.bind(this), cb)
        });
    }
    playCardRsp(recvPacket, cb){
        var playCardRspObject = decodePacketToObject(recvPacket, "PlayCardRsp");
        cb && cb(playCardRspObject);
    }
    /*******出牌*******/
}
