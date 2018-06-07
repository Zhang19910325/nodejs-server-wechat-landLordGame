/**
 * Created by zhangmiao on 2018/5/23.
 */

var AppCommonPb = require("../../../pbMessage/appCommon_pb");
var DeskManager = require("../manager/deskManager"); //桌子管理
var AIPlayerManager = require("../manager/aiPlayerManager"); // AI 机器人管理
var PlayerManager = require("../manager/playerManager");// 真实用户玩家管理
var CardManager = require("../manager/cardManager"); // 牌管理
var GameRule = require("../util/gameRule");
var AILogic = require("../util/aILogic");
//var Player = require("../model/player");
module.exports = function(app, opts){
    return new Service(app, opts);
};

var Service = function(app, opts){
    this.app = app;
    this.deskManager = new DeskManager(app);
    this.aIPlayerManager = new AIPlayerManager(app);
    this.playerManager = new PlayerManager(app);
    this.cardManager = new CardManager(app);
};



Service.prototype.handleMessage = function(recvPacket, session, next){

    var cmd = recvPacket.cmd;
    if(cmd === AppCommonPb.Cmd.KLANDLORDJOINGAMEREQ){//加入游戏
        handleJoinReq(this, recvPacket, session, next);
    }else if(cmd === AppCommonPb.Cmd.KLANDLORDSTARTGAMEREQ){//开始游戏
        handleStartGameReq(this, recvPacket, session, next);
    }else if(cmd === AppCommonPb.Cmd.KLANDLORDROBLANDREQ){//抢地主
        handleRobLandReq(this, recvPacket, session, next);
    }else if(cmd === AppCommonPb.Cmd.KLANDLORDPLAYCARDREQ){//出牌
        handlePlayCardReq(this, recvPacket, session, next);
    }
    else{
        //todo 这里其实需要发送错误消息给session
        console.log("目前没有对cmd：",cmd,"做任何处理")
    }

};

//加入游戏
var handleJoinReq = function(self, recvPacket, session, next){
    //这里加一下ai机器人
    console.log("收到uid",recvPacket.uid, "加入游戏");
    var player = self.playerManager.createPlayer(recvPacket.uid+"", session, recvPacket.uid);
    player.score = 500;//只要加入游戏都给500分
    self.deskManager.playerJoin(player);
    //todo 先默认添加两个AI机器人
    var AIPlayer1 = self.aIPlayerManager.createNewAIPlayer();
    AIPlayer1.score = 500;
    self.deskManager.playerJoin(AIPlayer1);

    var AIPlayer2 = self.aIPlayerManager.createNewAIPlayer();
    AIPlayer2.score = 500;
    self.deskManager.playerJoin(AIPlayer2);

    var seats = self.deskManager.deskInfo(player);

    var list = [];
    for (var seatNo in seats){
        if(!seats.hasOwnProperty(seatNo) || !seats[seatNo]) continue;
        list.push(seats[seatNo].getPlayerInfoPb());
    }
    //todo 这里需要给该桌子的其它玩家广播消息

    //发送返回的消息
    var joinGameRsp  = new AppCommonPb.JoinGameRsp;
    joinGameRsp.setDeskNo(player.deskNo);
    joinGameRsp.setSeatNo(player.seatNo);
    joinGameRsp.setPlayersList(list);

    var sendPacket = session.SendPacket.create(recvPacket.uid, 0x10002, recvPacket.seq, joinGameRsp.serializeBinary());
    session.send(sendPacket.msg, function(){

    });
};
//开始游戏请求处理
var handleStartGameReq = function(self, recvPacket, session, next){
    //接下来处理发牌逻辑 todo 这里其实需要检测各个用户是否都已经准备好了
    var uid = recvPacket.uid;
    //根据uid找到对应的用户
    var player = self.playerManager.getPlayerInfoByUid(uid);
    //找到对应的桌子
    var desk = self.deskManager.getDeskByNo(player.deskNo);
    //重置当前桌子信息,防上局干扰
    desk.reset();

    //立马回一个已经收到开始请求的回报
    var sendPacket = session.SendPacket.create(recvPacket.uid, 0x10004, recvPacket.seq, null);
    session.send(sendPacket.msg, function(){
    });

    (function () {
        self.cardManager.dealCards(desk);//发牌
        desk.status = AppCommonPb.DeskStatus.ROBLORAD;
        var firstRob = player.seatNo;//直接将抢地主的座位号设为自己
        //发送各自的牌给对应用户 todo 这里目前只有一个用户需要发送
        for (var p in desk.seats) {
            var currentPlayer = desk.seats[p];
            if (!currentPlayer.isAI) {
                //不是ai机器人
                var startGameNty = new AppCommonPb.StartGameNty;
                startGameNty.setFirstrob(firstRob);
                startGameNty.setCardsList(currentPlayer.getCardInfoPbList());//主要是每个人的牌都不一样
                var sendPacket = session.SendPacket.create(uid, 0x12002, 0, startGameNty.serializeBinary());
                session.send(sendPacket.msg, function(){});
            }
        }
    })();
};
//抢地主请求处理
var handleRobLandReq = function(self, recvPacket, session, next){
    var uid = recvPacket.uid;
    var player = self.playerManager.getPlayerInfoByUid(uid);
    var desk = self.deskManager.getDeskByNo(player.deskNo);

    var robLandReq = AppCommonPb.RobLandReq.deserializeBinary(recvPacket.bodyData);
    var robLandReqObject = robLandReq.toObject();

    var robLandRsp = new  AppCommonPb.RobLandRsp;



    var setLandLord = function(){
        var setLandLordNty = new AppCommonPb.SetLandLordNty;
        setLandLordNty.setCurrentScore(desk.currentScore);
        setLandLordNty.setLandLordSeatNo(player.seatNo);
        setLandLordNty.setHiddenCardsList(desk.getHiddenCardInfoPbList());

        desk.setLandLord();
        desk.send(AppCommonPb.Cmd.KLANDLORDSETLANDLORDNTY, setLandLordNty.serializeBinary());
    };


    if(!robLandReqObject.score){
        //没有抢地主
        robLandRsp.setRspHead(getRspHead());
        desk.robRound ++;
        //todo 这里其实需要安排机器人抢地主
    }else {//抢了地主
        if(robLandReqObject.score <= desk.currentScore || robLandReqObject.score < 0 || robLandReqObject.score > 3){
            robLandRsp.setRspHead(getRspHead(0x10001,"抢地主叫分不能为score:" + robLandReqObject.score));
        }else {
            robLandRsp.setRspHead(getRspHead());
            desk.robRound ++;
            desk.landlordSeatNo = player.seatNo;
            desk.currentScore =  robLandReqObject.score;
            setLandLord();
        }
    }
    var sendPacket = session.SendPacket.create(recvPacket.uid, AppCommonPb.Cmd.KLANDLORDROBLANDRSP, recvPacket.seq, robLandRsp.serializeBinary());
    session.send(sendPacket.msg, function(){
    });
};

//出牌请求处理
var handlePlayCardReq = function(self, recvPacket, session, next){
    var uid = recvPacket.uid;
    var player = self.playerManager.getPlayerInfoByUid(uid);
    var desk = self.deskManager.getDeskByNo(player.deskNo);

    var playCardReq = AppCommonPb.PlayCardReq.deserializeBinary(recvPacket.bodyData);
    var playCardReqObject = playCardReq.toObject();
    var cardsList = playCardReqObject.cardsList;


    //todo 检测是不是轮到自己出牌,不要乱出

    var playCardRsp = new AppCommonPb.PlayCardRsp;
    var curCardTypeObject = GameRule.typeJudge(cardsList);
    var handleWithIsSuccess = function(success){
        if(success){
            playCardRsp.setRspHead(getRspHead());
            playCard(self, {
                uid : uid,
                cardsList : cardsList
            });
        }else {
            playCardRsp.setRspHead(getRspHead(0x10002, "出牌牌型有问题"));
        }
        var sendPacket = session.SendPacket.create(uid, AppCommonPb.Cmd.KLANDLORDPLAYCARDRSP, recvPacket.seq, playCardRsp.serializeBinary());
        session.send(sendPacket.msg, function(){});
    };

    if(!curCardTypeObject && (!desk.lastPlayCards || !desk.lastPlayCards.length)){
        handleWithIsSuccess(false);
    }else {
        if (desk.lastPlayCards) {//本回合 不是第一个出牌
            var lastCardTypeObject = GameRule.typeJudge(desk.lastPlayCards);
            if(!curCardTypeObject){//没有出牌,代表不要
                handleWithIsSuccess(true);
            }else if(curCardTypeObject.cardKind == GameRule.KING_BOMB){//如果是王炸
                desk.rate *= 2;
                handleWithIsSuccess(true);
            } else if(curCardTypeObject.cardKind == GameRule.BOMB){//如果是炸弹
                if(lastCardTypeObject.cardKind == GameRule.BOMB && curCardTypeObject.val < lastCardTypeObject.val){
                    handleWithIsSuccess(false);
                }else {
                    desk.rate *= 2;
                    handleWithIsSuccess(true);
                }
            } else if(playCardReqObject.cardsList.length == desk.lastPlayCards.length){//牌的数量一致
                if(curCardTypeObject.cardKind == lastCardTypeObject.cardKind && curCardTypeObject.val > lastCardTypeObject.val){//牌类一致,且大于他
                    handleWithIsSuccess(true);
                }else {
                    handleWithIsSuccess(false);
                }
            } else {
                handleWithIsSuccess(false);
            }
        }else {
            handleWithIsSuccess(true);
        }
    }
};


var getRspHead = function(code = 0, des){
    var rspHead = new AppCommonPb.RspHead;
    rspHead.setCode(code);
    des && rspHead.setDes(des);
    return rspHead;
};


/**
 *
 * @param self
 * @param data {object} uid:出牌者uid cardsList出牌的牌型
 */
var playCard = function(self, data){
    var uid = data.uid;
    var cardsList = data.cardsList || [];
    var player = self.playerManager.getPlayerInfoByUid(uid);
    if(!player){
        player = self.aIPlayerManager.getPlayerInfoByUid(uid);
    }

    var desk = self.deskManager.getDeskByNo(player.deskNo);
    var nextSeatNo = self.deskManager.nextSeatNo(player.seatNo);
    desk.currentPlaySeatNo = nextSeatNo;

    if(cardsList.length){
        desk.lastPlayCards = cardsList;
        desk.roundWinSeatNo = player.seatNo;
    }
    player.subCards(cardsList);//去除掉牌

    if(player.cardList.length == 0){//游戏结束了
        console.log("游戏结束了");
        var gameOverInfo = desk.gameOver(player.seatNo, cardsList);
        var gameOverNty = new AppCommonPb.GameOverNty;
        gameOverNty.setWinnerSeatNo(gameOverInfo.winnerSeatNo);
        gameOverNty.setLandLordSeatNo(gameOverInfo.landlordSeatNo);
        gameOverNty.setCurrentScore(gameOverInfo.currentScore);
        gameOverNty.setRate(gameOverInfo.rate);
        gameOverNty.setCardsList(getCardInfoPbListByCards(cardsList));
        gameOverNty.setPlayersList(desk.getPlayerInfoPbList());
        desk.send(AppCommonPb.Cmd.KLANDLORDGAMEOVERNTY, gameOverNty.serializeBinary());
        //todo 这里需要清除掉离线玩家
        return;
    }
    var playCardNty = new AppCommonPb.PlayCardNty;
    playCardNty.setPreSeatNo(player.seatNo);
    playCardNty.setNextSeatNo(nextSeatNo);
    playCardNty.setRate(desk.rate);
    playCardNty.setCardsList(getCardInfoPbListByCards(cardsList));

    desk.send(AppCommonPb.Cmd.KLANDLORDPLAYCARDNTY, playCardNty.serializeBinary());//向桌子上的玩家发送通知

    var nextPlayer = desk.seats[nextSeatNo];
    if(nextSeatNo == desk.roundWinSeatNo){
        desk.lastPlayCards = null;//没有需要跟踪的牌
        desk.currentPlaySeatNo = nextSeatNo;
        if(nextPlayer.isAI){
            setTimeout(function(){
                aiPlayCard(self, nextPlayer.uid.toString());
            }, 1000);
        }
    }else {
        if(nextPlayer.isAI){
            setTimeout(function(){
                aiPlayCard(self, nextPlayer.uid.toString());
            }, 1000);
        }
    }
};

var aiPlayCard = function(self, uid){
    var player = self.aIPlayerManager.getPlayerInfoByUid(uid);
    var desk = self.deskManager.getDeskByNo(player.deskNo);

    var ai = new AILogic(player),
        result = null;
    desk.setCardsCnt(player);
    if(desk.lastPlayCards){
        result = ai.follow(desk.lastPlayCards, (desk.landlordSeatNo === desk.roundWinSeatNo),desk.seats[desk.roundWinSeatNo].cardList.length);
    } else {
        result = ai.play(desk.seats[desk.landlordSeatNo].cardList.length);
    }

    console.log("result:",result);
    playCard(self, {
        uid:uid,
        cardsList:result ? result.cardList : []
    });
};

var getCardInfoPbListByCards = function(cards){
    var arr = [];
    for (var index = 0; index < cards.length; index++){
        var cardObject = cards[index];
        var cardPb = new AppCommonPb.CardInfo;
        cardPb.setType(cardObject.type);
        cardPb.setVal(cardObject.val);
        arr.push(cardPb);
    }
    return arr;
};