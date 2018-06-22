/**
 * Created by zhangmiao on 2018/5/23.
 */

var AppCommonPb = require("../../../pbMessage/appCommon_pb");

var LandLordRunTime = require("../runtime/landLordRunTime");
var GameRule = require("../util/gameRule");
var AILogic = require("../util/aILogic");
module.exports = function(app, opts){
    return new Service(app, opts);
};

var Service = function(app, opts){
    this.app = app;
    var landLordRunTime = LandLordRunTime.getLandLordRunTime(app);
    this.deskManager = landLordRunTime.deskManager;
    this.aIPlayerManager = landLordRunTime.aIPlayerManager;
    this.playerManager = landLordRunTime.playerManager;
    this.cardManager = landLordRunTime.cardManager;
};


Service.prototype.getPlayerWithUid = function(uid){
    var player = this.playerManager.getPlayerInfoByUid(uid);
    if(!player){
        player = this.aIPlayerManager.getPlayerInfoByUid(uid);
    }
    return player;
};

Service.prototype.removePlayerWithUid = function(uid){
    var player = this.getPlayerWithUid(uid);
    if(!player) return;
    this.deskManager.removePlayer(player);
    this.aIPlayerManager.removePlayerByUid(uid);
    this.playerManager.removePlayerByUid(uid);
};

Service.prototype.handleMessage = function(recvPacket, session, next){
    var self = this;
    var getCheckNext = function(handle){
        return function (err){
            if(!err){
                handle(self, recvPacket, session, next);
            }
        }
    };
    var cmd = recvPacket.cmd;
    if(cmd == AppCommonPb.Cmd.KSERVERUSERDISCONNECTED){
        handleUserDisconnected(self, recvPacket, session, next);
    }else if(cmd === AppCommonPb.Cmd.KLANDLORDJOINGAMEREQ){//加入游戏
        handleJoinReq(this, recvPacket, session, next);
    } else if(cmd === AppCommonPb.Cmd.KLANDLORDREQCURDESKINFO){//请求发送桌子信息,此命令会触发kLandLordInitDeskNty 0x1200E 通知消息
        checkPlayerExits(this, recvPacket, session, getCheckNext(handleRedCurDeskInfo));
    } else if(cmd === AppCommonPb.Cmd.KLANDLORDREADYGAMEREQ){//准备游戏
        checkPlayerExits(this, recvPacket, session, getCheckNext(handleReadyGameReq));
    }else if(cmd === AppCommonPb.Cmd.KLANDLORDROBLANDREQ){//抢地主
        checkPlayerExits(this, recvPacket, session, getCheckNext(handleRobLandReq));
    }else if(cmd === AppCommonPb.Cmd.KLANDLORDPLAYCARDREQ){//出牌
        checkPlayerExits(this, recvPacket, session, getCheckNext(handlePlayCardReq));
    }
    else{
        //todo 这里其实需要发送错误消息给session
        console.log("目前没有对cmd：",cmd,"做任何处理")
    }

};
//处理某个用户断掉连接
var handleUserDisconnected = function(self, recvPacket, session, next){
    var uid = recvPacket.uid;
    var player = self.getPlayerWithUid(uid);
    if(!player) return;
    player.status = AppCommonPb.PlayerStatus.OFFLINE;
    player.isAI = true;
    console.log("收到用户断线了");
    //this.status = AppCommon.PlayerStatus.NORMAL;//状态
};
//加入是否加入到游戏
var checkPlayerExits = function(self, recvPacket, session, next) {
    var uid = recvPacket.uid;
    var player = self.getPlayerWithUid(uid);
    if(player){
        next(null)
    }else {
        //发送错误到客户端
        var s2CCommonRsp = new AppCommonPb.S2CCommonRsp;
        s2CCommonRsp.setRspHead(getRspHead(0x10003,"用户未加入游戏"));
        var sendPacket = session.SendPacket.create(uid, recvPacket.cmd+1, recvPacket.seq, s2CCommonRsp.serializeBinary());
        session.send(sendPacket.msg, function(){});
        //这里发送到客户端需要重新加入游戏
        console.log("没有找到uid:",uid,"对应的用户");
        next(new Error("没有找到uid:",uid,"对应的用户"));
    }
};
//请求发送桌子信息,此命令会触发kLandLordInitDeskNty 0x1200E 通知消息
var handleRedCurDeskInfo = function(self, recvPacket, session, next){
    var player = self.getPlayerWithUid(recvPacket.uid);
    var desk = self.deskManager.getDeskByNo(player.deskNo);

    var deskInitInfo = new AppCommonPb.DeskInitInfo;
    deskInitInfo.setDeskNo(player.deskNo);
    deskInitInfo.setSeatNo(player.seatNo);
    deskInitInfo.setPlayersList(desk.getPlayerInfoPbList());
    deskInitInfo.setPreSeatNo(player.preSeatNo);
    deskInitInfo.setNextSeatNo(player.nextSeatNo);
    deskInitInfo.setCurDeskStatus(desk.status);
    //如果是准备阶段
    //如果是抢地主阶段
    deskInitInfo.setCurRobSeatNo(desk.curRobLandSeat);
    deskInitInfo.setRobListList(desk.robSeatList);
    //如果是出牌阶段
    deskInitInfo.setLandLordSeatNo(desk.landLordSeatNo);
    deskInitInfo.setRoundWinSeatNo(desk.roundWinSeatNo);
    deskInitInfo.setNextPlayCardSeat(desk.currentPlayerSeatNo);
    deskInitInfo.setDeskRate(desk.rate);
    deskInitInfo.setCardsList(player.getCardInfoPbList());
    deskInitInfo.setHiddenCardsList(desk.getHiddenCardInfoPbList());
    deskInitInfo.setWinCardsList(desk.getLastPlayCardsPbList());
    deskInitInfo.setIsAudience(false);


    player.send(AppCommonPb.Cmd.KLANDLORDINITDESKNTY, 0, deskInitInfo.serializeBinary());
};

//加入游戏
var handleJoinReq = function(self, recvPacket, session, next){
    //这里加一下ai机器人
    //todo 查看事先是否已经创建了人,是否已经开始了,如果已经存在,只要替换掉
    var player = self.getPlayerWithUid(recvPacket.uid);
    var joinGameRsp  = new AppCommonPb.JoinGameRsp;

    if(player){
        //player
        player.session = session;//设置新的session
        joinGameRsp.setRspHead(getRspHead(0x10004, "用户已存在,重新拉取桌子信息"));
        new Promise(function(resolve) {
            resolve()
        }).then(function(){
            handleRedCurDeskInfo(self, recvPacket, session, next);
        });
        player.send(0x10002, recvPacket.seq, joinGameRsp.serializeBinary());
        player.status = AppCommonPb.PlayerStatus.NORMAL;
        player.isAI = false;
    }else {
        player = self.playerManager.createPlayer(recvPacket.uid+"", session, recvPacket.uid);
        player.score = 500;//只要加入游戏都给500分
        self.deskManager.playerJoin(player);
        //todo 先默认添加两个AI机器人
        //var AIPlayer1 = self.aIPlayerManager.createNewAIPlayer();
        //AIPlayer1.score = 500;
        //AIPlayer1.isReady = true;
        //self.deskManager.playerJoin(AIPlayer1);
        //
        //var AIPlayer2 = self.aIPlayerManager.createNewAIPlayer();
        //AIPlayer2.score = 500;
        //AIPlayer2.isReady = true;
        //self.deskManager.playerJoin(AIPlayer2);


        var seats = self.deskManager.deskInfo(player);
        var desk = self.deskManager.getDeskByNo(player.deskNo);

        var list = [];
        for (var seatNo in seats){
            if(!seats.hasOwnProperty(seatNo) || !seats[seatNo]) continue;
            list.push(seats[seatNo].getPlayerInfoPb());
        }
        //发送返回的消息
        joinGameRsp.setRspHead(getRspHead());
        joinGameRsp.setDeskNo(player.deskNo);
        joinGameRsp.setSeatNo(player.seatNo);
        joinGameRsp.setPlayersList(list);
        player.send(0x10002, recvPacket.seq, joinGameRsp.serializeBinary());

        sendDeskUpdateNty(desk);
    }
};

var sendDeskUpdateNty = function( desk ){
    var seats  = desk.seats;
    var list = [];
    for (var seatNo in seats){
        if(!seats.hasOwnProperty(seatNo) || !seats[seatNo]) continue;
        list.push(seats[seatNo].getPlayerInfoPb());
    }
    var deskUpdateNty = new AppCommonPb.DeskUpdateNty;
    deskUpdateNty.setPlayersList(list);
    desk.send(0x12000, deskUpdateNty.serializeBinary());

};

//开始游戏请求处理
var handleReadyGameReq = function(self, recvPacket, session, next){
    //接下来处理发牌逻辑 todo 这里其实需要检测各个用户是否都已经准备好了
    var uid = recvPacket.uid;
    console.log("uid:",uid);
    //根据uid找到对应的用户
    var player = self.playerManager.getPlayerInfoByUid(uid);
    player.isReady = true;
    //找到对应的桌子

    var desk = self.deskManager.getDeskByNo(player.deskNo);
    //重置当前桌子信息,防上局干扰
    //desk.reset();

    var s2CCommonRsp = new AppCommonPb.S2CCommonRsp;
    s2CCommonRsp.setRspHead(getRspHead());
    //立马回一个已经收到开始请求的回报
    var sendPacket = session.SendPacket.create(recvPacket.uid, 0x10004, recvPacket.seq, s2CCommonRsp.serializeBinary());
    session.send(sendPacket.msg, function(){
    });

    //检查是否所有人都已准备好
    checkAllPlayerReady(self, desk);
};

var checkAllPlayerReady = function(self, desk){
    var readyPlayers =[];
    for (var p in desk.seats){
        var currentPlayer = desk.seats[p];
        if(currentPlayer && currentPlayer.isReady) readyPlayers.push(currentPlayer);
    }
    if(readyPlayers.length < 3) return;
    self.cardManager.dealCards(desk);//发牌
    desk.status = AppCommonPb.DeskStatus.ROBLORAD;
    var firstRob = readyPlayers[self.cardManager.random(0,2)].seatNo;//直接将抢地主的座位号设为自己
    desk.curRobLandSeat = firstRob;
    readyPlayers.forEach(function(player){
        if (!player.isAI) {
            //不是ai机器人
            var startGameNty = new AppCommonPb.StartGameNty;
            startGameNty.setFirstRob(firstRob);
            startGameNty.setCardsList(player.getCardInfoPbList());//主要是每个人的牌都不一样
            player.send(0x12002, 0, startGameNty.serializeBinary());
        }
    });
};
//抢地主请求处理
var handleRobLandReq = function(self, recvPacket, session, next){
    var uid = recvPacket.uid;
    var player = self.playerManager.getPlayerInfoByUid(uid);
    var desk = self.deskManager.getDeskByNo(player.deskNo);

    var robLandReq = AppCommonPb.RobLandReq.deserializeBinary(recvPacket.bodyData);
    var robLandReqObject = robLandReq.toObject();

    var score  = robLandReqObject.score;

    var robLandRsp = new  AppCommonPb.RobLandRsp;

    var setLandLord = function(){
        var setLandLordNty = new AppCommonPb.SetLandLordNty;
        setLandLordNty.setCurrentScore(desk.currentScore);
        setLandLordNty.setLandLordSeatNo(desk.landLordSeatNo);
        setLandLordNty.setHiddenCardsList(desk.getHiddenCardInfoPbList());
        console.log("setLandLordNty:",setLandLordNty);
        desk.setLandLord();
        desk.send(AppCommonPb.Cmd.KLANDLORDSETLANDLORDNTY, setLandLordNty.serializeBinary());
        //这里如果是机器人的话可以开始出牌了
        var landLorder = desk.seats[desk.landLordSeatNo];
        if(landLorder.isAI){
            setTimeout(aiPlayCard.bind(self, self, landLorder.uid), 5000);
        }
    };

    var notifyRobLandLord = function(player, score){
        var robLandInfoNty = new AppCommonPb.RobLandInfoNty;
        robLandInfoNty.setPreSeatNo(player.seatNo);
        robLandInfoNty.setPreScore(score);
        robLandInfoNty.setCurrentScore(desk.currentScore);
        robLandInfoNty.setNextSeat(self.deskManager.nextSeatNo(player.seatNo));
        desk.curRobLandSeat = self.deskManager.nextSeatNo(player.seatNo);
        desk.send(AppCommonPb.Cmd.KLANDLORDROBLANDNTY, robLandInfoNty.serializeBinary());
    };

    var aiRobLandLord = function(desk, player){//机器人抢地主
        desk.robRound ++;
        desk.robSeatList.push(player.seatNo);
        var score = randomInt(0,3);//模拟这就是机器人抢的分
        score = score <= desk.currentScore ? 0 : score;
        player.robLandScore = score;
        if(score <= desk.currentScore){//没有叫
            notifyRobLandLord(player, 0);
            loop(player);
        } else if(score == 3){//叫到了顶
            desk.landLordSeatNo = player.seatNo;
            desk.currentScore =  score;
            notifyRobLandLord(player, score);
            setLandLord();
        }else{//叫了中间的一个分
            desk.landLordSeatNo = player.seatNo;
            desk.currentScore =  score;
            notifyRobLandLord(player, score);
            loop(player);
        }
    };

    var ntyNoLord = function(){
        desk.send(AppCommonPb.Cmd.KLANDLORDGAMENOLORDNTY, null);
    };

    var loop = function(player){
        if(desk.robRound == 3){
            if(desk.currentScore == 0){
                ntyNoLord();
            }else {
                notifyRobLandLord(desk.seats[desk.landLordSeatNo], desk.currentScore);
                setLandLord();
            }
        }else {
            var currentSeatNo = player.seatNo;
            var nextSeat = self.deskManager.nextSeatNo(currentSeatNo);
            var nextPlayer = desk.seats[nextSeat];
            if(nextPlayer.isAI){
                setTimeout(function(){
                    aiRobLandLord(desk, nextPlayer);
                }, 3000);
            }
        }
    };

    if(!score){
        desk.robRound ++;
        desk.robSeatList.push(player.seatNo);
        player.robLandScore = score;
        robLandRsp.setRspHead(getRspHead());
        notifyRobLandLord(player, score);
        loop(player);
    }else {//抢了地主
        if(score <= desk.currentScore || score < 0 || score > 3){
            robLandRsp.setRspHead(getRspHead(0x10001,"抢地主叫分不能为score:" + robLandReqObject.score));
        }else {
            desk.robRound ++;
            desk.robSeatList.push(player.seatNo);
            player.robLandScore = score;
            robLandRsp.setRspHead(getRspHead());
            desk.landLordSeatNo = player.seatNo;
            desk.currentScore =  score;
            if(desk.robRound == 3 || desk.currentScore == 3){
                notifyRobLandLord(desk.seats[desk.landLordSeatNo], desk.currentScore);
                setLandLord();
            } else {
                notifyRobLandLord(player, score);
                loop(player);
            }
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
    desk.currentPlayerSeatNo = nextSeatNo;

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
        gameOverNty.setLandLordSeatNo(gameOverInfo.landLordSeatNo);
        gameOverNty.setCurrentScore(gameOverInfo.currentScore);
        gameOverNty.setRate(gameOverInfo.rate);
        gameOverNty.setCardsList(getCardInfoPbListByCards(cardsList));
        gameOverNty.setPlayersList(desk.getPlayerInfoPbList());
        desk.send(AppCommonPb.Cmd.KLANDLORDGAMEOVERNTY, gameOverNty.serializeBinary());
        desk.reset();
        //todo 这里需要清除掉离线玩家
        clearOfflinePlayer(self, desk);
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
        desk.currentPlayerSeatNo = nextSeatNo;
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
        result = ai.follow(desk.lastPlayCards, (desk.landLordSeatNo === desk.roundWinSeatNo),desk.seats[desk.roundWinSeatNo].cardList.length);
    } else {
        result = ai.play(desk.seats[desk.landLordSeatNo].cardList.length);
    }
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

var randomInt = function (formNum, toNum) {
    return parseInt(Math.random() * (toNum - formNum + 1) + formNum);
};

var clearOfflinePlayer = function(self, desk){
    for (var p in desk.seats){
        var currentPlayer = desk.seats[p];
        if(!currentPlayer) continue;
        if(currentPlayer.status != AppCommonPb.PlayerStatus.NORMAL)
            self.removePlayerWithUid(currentPlayer.uid);
    }
};