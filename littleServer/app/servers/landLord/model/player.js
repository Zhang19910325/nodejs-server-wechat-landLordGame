/**
 * Created by zhangmiao on 2018/5/29.
 */
var landLordUtil = require("../util/landLordUtil");
var AppCommon = require("../../../pbMessage/appCommon_pb");

/**
 * 玩家类
 * @param name {string} 玩家名称
 * @param session {BackendSession} 与路由服务器交互的session，此服务器可能会有多个路由服务器相连
 * @param uid {Long} 玩家uid
 * @constructor
 */
var Player = function(name, session, uid){
    this.name = name;
    this.session = session;
    this.uid  = uid;

    this.cardList = [];
    this.isReady = false;//是否已经准备
    this.deskNo = null;//桌号
    this.seatNo = null;//座位号
    this.score = 0;//积分
    this.isLandLord = false;//是否是地主
    this.status = AppCommon.PlayerStatus.NORMAL;//状态
    this.nextCardsCnt = 0; //下一位玩家的手牌数
    this.preCardsCnt  = 0; //上一位玩家的手牌数

    //计时器
    this.timer = null;

    this.isAI = false;

    var self = this;
    this.__defineGetter__("preSeatNo", function(){
        if(!self.seatNo) return null;
        for (var p = 1; p <= 3; p ++){
            if(self.seatNo === "p"+p){
                return "p" + ((p - 1) || 3);
            }
        }
    });
    this.__defineGetter__("nextSeatNo", function(){
        if(!self.seatNo) return null;
        for (var p = 1; p <= 3; p ++){
            if(self.seatNo === "p"+p){
                return "p" + ((p + 1)%3 || 3);
            }
        }
    });
};

/**
 * 去除list中牌，打出牌的数组
 * @param list
 */
Player.prototype.subCards = function(list){
    this.cardList.sort(landLordUtil.cardSort);
    for (var i = 0; i < list.length; i++) {
        for (var j = 0; j < this.cardList.length; j++) {
            if(list[i] && this.cardList[j].val === list[i].val && this.cardList[j].type === list[i].type){
                this.cardList.splice(j, 1);
                break;
            }
        }
    }
};

//获取用户对应的pb info
Player.prototype.getPlayerInfoPb = function(){
    var playerInfo  = new AppCommon.PlayerInfo;
    playerInfo.setName(this.name);
    playerInfo.setUid(this.uid);
    playerInfo.setIsReady(this.isReady);
    playerInfo.setDeskNo(this.deskNo);
    playerInfo.setSeatNo(this.seatNo);
    playerInfo.setScore(this.score);
    playerInfo.setPreSeatNo(this.preSeatNo);
    playerInfo.setNextSeatNo(this.nextSeatNo);

    return playerInfo;
};

//获取牌型pb 数组
Player.prototype.getCardInfoPbList = function(){
    var arr = [];
    for (var index = 0; index < this.cardList.length; index++){
        var cardObject = this.cardList[index];
        var cardPb = new AppCommon.CardInfo;
        cardPb.setType(cardObject.type);
        cardPb.setVal(cardObject.val);
        arr.push(cardPb);
    }
    return arr;
};


module.exports = Player;