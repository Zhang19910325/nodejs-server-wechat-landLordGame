/**
 * Created by zhangmiao on 2018/5/29.
 */

var AppCommon = require("../../../pbMessage/appCommon_pb");
var landLordUtil = require("../util/landLordUtil");

var Desk = function(no){
    this.deskNo = no;//桌号
    this.currentScore = 0;//当前叫分最高
    this.rate = 1;//倍数
    this.robRound = 0;//当前叫分次数
    this.hiddenCards = [];//底牌
    this.landLordSeatNo = null;//当前地主座位号
    this.roundWinSeatNo = null;//本轮当前赢牌的玩家座位号
    this.currentPlayerSeatNo = null;//当前出牌玩家座位号
    this.lastPlayCards = null;//最后一位出牌的牌型
    this.robSeatList = [];//当前局抢了地主的座位号数组
    this.curRobLandSeat = null;//当前叫地主座位号
    this.seats = {
        "p1" : null,
        "p2" : null,
        "p3" : null
    };

    this.status = AppCommon.DeskStatus.READY;//当前桌子状态
};

var pro = Desk.prototype;

/**
 * 游戏结束，返回所有玩家牌，胜利者座位，地主座位
 * @param seatNo 胜利者座位号
 * @param lastCards 胜利的牌型
 */
pro.gameOver = function(seatNo, lastCards){
    for (var p in this.seats){
        if(!this.seats.hasOwnProperty(p)) continue;
        var currentPlayer = this.seats[p];
        //todo 这里先不考虑离线的情况
        //if(currentPlayer.status != AppCommon.PlayerStatus.NORMAL){
        //    currentPlayer.score -= self.currentScore*self.rate*(p === self.landLordSeatNo ? 6 : 3);
        //    continue;
        //}
        if (this.landLordSeatNo === seatNo){//地主赢
            if(p === seatNo){//地主获得双倍积分
                currentPlayer.score += this.currentScore * this.rate * 2;
            }else {//农民扣分
                currentPlayer.score -= this.currentScore * this.rate;
            }
        }else {//地主输
            if(p === seatNo){//地主扣除双倍积分
                currentPlayer.score -= this.currentScore * this.rate * 2;
            }else {//农民得分
                currentPlayer.score += this.currentScore * this.rate;
            }
        }
        this.status = AppCommon.DeskStatus.READY;
        return {
            'winnerSeatNo': seatNo,
            'landLordSeatNo': this.landLordSeatNo,
            'seats': this.seats,
            'currentScore': this.currentScore,
            'lastCards': lastCards,
            'rate': this.rate
        }
    }
};

//清除非正常玩家
pro.afterGameOver = function(){
    for (var p in this.seats) {
        if(!this.seats.hasOwnProperty(p)) continue;
        var currentPlayer = this.seats[p];
        if(currentPlayer.status != AppCommon.PlayerStatus.NORMAL){
            //offline.remove(self.seats[p].uid);
            this.seats[p] = null;
        }
    }
};

//重置
pro.reset = function(){
    this.currentScore  = 0;
    this.robRound = 0;
    this.landLordSeatNo = null;
    this.roundWinSeatNo = null;
    this.rate = 1;
    this.lastPlayCards = null;//最后一位出牌的牌型
    this.curRobLandSeat = null;
    this.robSeatList = [];
    this.currentPlayerSeatNo = null;
    for (var p in this.seats){
        if(!this.seats.hasOwnProperty(p)) continue;
        var currentPlayer = this.seats[p];
        if (currentPlayer){
            currentPlayer.reset();
        }
    }
};

pro.setLandLord = function(){
    var self = this,
        seatNo = self.landLordSeatNo;
    self.status = AppCommon.DeskStatus.PLAYCARD;
    self.currentPlayerSeatNo = seatNo;
    self.seats[seatNo].isLandlord = true;
    self.seats[seatNo].cardList = self.seats[seatNo].cardList.concat(self.hiddenCards);
    self.seats['p1'].cardList.sort(landLordUtil.cardSort);
    self.seats['p2'].cardList.sort(landLordUtil.cardSort);
    self.seats['p3'].cardList.sort(landLordUtil.cardSort);
};

pro.getHiddenCardInfoPbList = function(){
    var arr = [];
    for (var index = 0; index < this.hiddenCards.length; index++){
        var cardObject = this.hiddenCards[index];
        var cardPb = new AppCommon.CardInfo;
        cardPb.setType(cardObject.type);
        cardPb.setVal(cardObject.val);
        arr.push(cardPb);
    }
    return arr;
};

pro.getLastPlayCardsPbList = function(){
    var arr = [];
    var lastPlayCards = this.lastPlayCards || [];
    for (var index = 0; index < lastPlayCards.length; index++){
        var cardObject = lastPlayCards[index];
        var cardPb = new AppCommon.CardInfo;
        cardPb.setType(cardObject.type);
        cardPb.setVal(cardObject.val);
        arr.push(cardPb);
    }
    return arr;
};

pro.getPlayerInfoPbList = function(){
    var list = [];
    var seats = this.seats;
    for (var seatNo in seats){
        if(!seats.hasOwnProperty(seatNo) || !seats[seatNo]) continue;
        list.push(seats[seatNo].getPlayerInfoPb());
    }
    return list;
};

pro.setCardsCnt = function(player){
    if(player.seatNo === 'p1'){
        player.preCardsCnt = this.seats.p3.cardList.length;
        player.nextCardsCnt = this.seats.p2.cardList.length;
    } else if(player.seatNo === 'p2'){
        player.preCardsCnt = this.seats.p1.cardList.length;
        player.nextCardsCnt = this.seats.p3.cardList.length;
    } else if(player.seatNo === 'p3'){
        player.preCardsCnt = this.seats.p2.cardList.length;
        player.nextCardsCnt = this.seats.p1.cardList.length;
    }
};

/**
 * 本桌是否以满员且都已准备
 * @method function
 * @return {Boolean}
 */
pro.isAllReady = function(){
    if(this.size() === 3){
        return this.seats.p1.isReady && this.seats.p2.isReady && this.seats.p3.isReady;
    } else {
        return false;
    }
};


//返回本桌人数
pro.size = function(){
    var total = 0;
    for (var p in this.seats) {
        if(this.seats[p]){
            total ++;
        }
    }
    return total;
};

pro.playerExit = function(player){
    if(this.deskNo === player.deskNo){
        //todo 游戏进行时退出，会扣除相应的分
        //if(this.status === AppCommon.DeskStatus.ROBLORAD){
        //
        //}
        this.seats[player.seatNo] = null;
    }
};

//在桌子内的人
pro.send = function(cmd, data){
    for (var p in this.seats){
        var currentPlayer = this.seats[p];
        if(!currentPlayer || currentPlayer.isAI) continue;
        var session = currentPlayer.session;
        var sendPacket = session.SendPacket.create(currentPlayer.uid, cmd, 0, data);
        session.send(sendPacket.msg, function(){});
    }
};

pro.copySeats = function(){
    var self = this,
        dest = {};
    for(var p in self.seats){
        if(self.seats[p]){
            dest[p] = {};
            for(var pro in self.seats[p]){
                if(typeof self.seats[p][pro] === 'number' || typeof self.seats[p][pro] === 'string'){
                    dest[p][pro] = self.seats[p][pro];
                }
            }
        }
    }
    return dest;
};


var genDeskRuntime = function(){

};

module.exports = Desk;
