/**
 * Created by zhangmiao on 2018/6/1.
 */
import ZMClass from "./base/zmClass"
import ZMForm from "./components/zmForm"
import ZMPokerPanel from "./components/zmPokerPanel"
import ZMButton from "./components/zmButton"
import ZMFunction from "./common/zmFunction"
import ZMPorker from  "./components/zmPoker"
import ZMColor from "./common/zmColor"
import ZMResourceData from "./common/zmResourceData"
import ZMPokersModel from "./model/zmPokersModel"
import ZMLabel from "./components/zmLabel"
import ZMToast from "./components/zmToast"
import LordLandGameInfo from "./runtime/landLordGameInfo"
import NetServiceDataHandle from "./netServiceDataHandle"

var NetService = require("./net/netService");
var protobuf = require("./weichatPb/protobuf.js");
var appCommon = require("../pbMessage/appCommon");
var appCommonRoot = protobuf.Root.fromJSON(appCommon);

const screenWidth    = window.innerWidth;
const screenHeight   = window.innerHeight;

var addHiddenCards = function(porkersModel, cardList){
    cardList  = cardList||[];
    for (var index = 0; index < cardList.length; index++){
        var card = cardList[index];
        porkersModel.addPoker(new ZMPorker(ZMFunction.getCardIdByTypeAndVal(card.type, card.val)) );
    }
};

var addCardsByCount = function(porkersModel, count){
    for (var index = 0; index < count; index++){
        porkersModel.addPoker(new ZMPorker(1));
    }
};

export default class landLordMain {
    constructor(){
        this.aniId = 0;
        this.landLordGameInfo = new LordLandGameInfo();
        this.startLandLord();
    }
    loginGame(){
        //调用微信登录接口
        var  self = this;
        wx.login({
            success: function (loginCode) {
                console.log("loginCode:",loginCode);
                //调用request请求api转换登录凭证
                wx.request({
                    url: 'https://www.lovelijing.top/login/?loginCode='+loginCode.code + "&isSumlator="+ (window.navigator.platform == 'devtools' ? "1" : "0"),
                    header: {
                        'content-type': 'application/json'
                    },
                    success: function(res) {
                        var uid = parseInt(res.data.uid);
                        console.log("用户的uid:",uid);
                        self.readyButton.visible = true;
                        //网络服务
                        JMain.netServiceDataHandle = new NetServiceDataHandle(self);
                        JMain.netServiceDataHandle.connect(uid, function(){
                            JMain.netServiceDataHandle.joinGameReq(null, self.handleJoinGameCallback.bind(self));
                        });
                    }
                })
            }
        });

    }
    startLandLord(){
        var self = this;
        ZMFunction.preLoadData("", function(){
            console.log("screenWidth:",screenWidth,"screenHeight:",screenHeight);
            JMain.JForm = new ZMForm({width: screenWidth, height: screenHeight}).setBGImage(ZMResourceData.Images.bg1);
            JMain.JForm.visible =true;
            JMain.JForm.clearControls();

            self.btnPanel = new ZMClass({x:0, y:180}, {width:screenWidth, height:50});//用于显示游戏控制按钮

            self.pokerPanel0 = new ZMPokerPanel({x:110, y:5}, {width:screenWidth - 220, height:100}, false, 0);//用于显示底牌
            self.pokerPanel1 = new ZMPokerPanel({x:110, y:screenHeight - 105}, {width:screenWidth - 220, height:100}, false, 20);//用于显示自己的牌
            self.pokerPanel2 = new ZMPokerPanel({x:screenWidth - 95, y:30}, {width:90, height:screenHeight - 50}, true, 12);//用于显示右边的牌
            self.pokerPanel3 = new ZMPokerPanel({x:5,y:30},{width:90,height:screenHeight - 50},true,12);//用于显示左边的牌
            self.pokerPanel4 = new ZMPokerPanel({x:150,y:150},{width:screenWidth - 300,height:100},false,20);//用于显示最后一手出的牌
            self.readyButton = new ZMButton({x:screenWidth/2 - 65,y:0},{width:130,height:50}).setText("准备").setBGImage(ZMResourceData.Images.btn);

            self.clock1 = new ZMClass({x:screenWidth/2, y:screenHeight - 130},{width:20, height:20}).setBGImage(ZMResourceData.Images.clock);//自己的小闹钟
            self.clock2 = new ZMClass({x:screenWidth - 120, y:screenHeight/2},{width:20, height:20}).setBGImage(ZMResourceData.Images.clock);//右边的小闹钟
            self.clock3 = new ZMClass({x:120, y:screenHeight/2},{width:20, height:20}).setBGImage(ZMResourceData.Images.clock);//左边的小闹钟

            self.pokerName1 = new ZMLabel({x:200,y:screenHeight - 25}, "自己的名字").setFontColor(ZMColor.blue);//自己的名称
            self.pokerName2 = new ZMLabel({x:screenWidth-120,y:10}, "右边的名称").setFontColor(ZMColor.blue);//右边的名称
            self.pokerName3 = new ZMLabel({x:5,y:10}, "左边的名称").setFontColor(ZMColor.blue);//左边的名称

            //不要的文字提示
            self.statusLabel1 = new ZMLabel({x:screenWidth/2+30, y:screenHeight - 128}, "不要").setFontColor(ZMColor.white);//自己的
            self.statusLabel2 = new ZMLabel({x:screenWidth - 165, y:screenHeight/2}, "不要").setFontColor(ZMColor.white);//右边的
            self.statusLabel3 = new ZMLabel({x:60, y:screenHeight/2-30}, "不要").setFontColor(ZMColor.white);//左边的

            //抢分的分子提示
            self.landScoreLabel1 = new ZMLabel({x:screenWidth/2-50, y:screenHeight - 128}, "自己的叫分").setFontColor(ZMColor.white);//自己的
            self.landScoreLabel2 = new ZMLabel({x:screenWidth - 165, y:screenHeight/2-40}, "右边的叫分").setFontColor(ZMColor.white);//右边的
            self.landScoreLabel3 = new ZMLabel({x:60, y:screenHeight/2-70}, "左边的叫分").setFontColor(ZMColor.white);//左边的

            self.readyButton.onClick = self.onClickReadyBtn.bind(self);
            self.readyButton.visible = false;
            self.btnPanel.addControlInLast([self.readyButton]);
            JMain.JForm.addControlInLast([self.pokerPanel0, self.pokerPanel1, self.pokerPanel2, self.pokerPanel3, self.pokerPanel4, self.btnPanel]);
            JMain.JForm.addControlInLast([self.pokerName1,self.pokerName2,self.pokerName3]);
            JMain.JForm.addControlInLast([self.clock1,self.clock2,self.clock3]);
            JMain.JForm.addControlInLast([self.statusLabel1,self.statusLabel2,self.statusLabel3]);
            JMain.JForm.addControlInLast([self.landScoreLabel1,self.landScoreLabel2,self.landScoreLabel3]);

            self.loginGame();
            self.initGame();
            self.aniId = window.requestAnimationFrame(
                self.loop.bind(self),
                canvas
            );
        });
    }
    loop(){
        var self = this;
        window.cancelAnimationFrame(this.aniId);
        JMain.JForm.show();
        self.aniId = window.requestAnimationFrame(
            self.loop.bind(self),
            canvas
        );
    }
    handleJoinGameCallback(joinGameRspObj){//加入游戏请求回包
        if(joinGameRspObj.rspHead && joinGameRspObj.rspHead.code){
            //收到加入游戏错误码;
            console.log("收到加入游戏错误码");
            return;
        }
        var self = this;
        this.landLordGameInfo.deskNo = joinGameRspObj.deskNo;//自己的桌号
        var seatNo = joinGameRspObj.seatNo;//桌子上对应的座位号;
        var players = joinGameRspObj.players;//玩家数组

        this.landLordGameInfo.seatNo = seatNo;
        this.landLordGameInfo.players = players;
        this.updateDeskPlayerName();
    }
    handleDeskUpdateNty(deskUpdateNtyMessageObject){
        this.landLordGameInfo.players = deskUpdateNtyMessageObject.players;//玩家数组
        this.updateDeskPlayerName();

    }
    updateDeskPlayerName(){
        var setPlayerName = function(pokerName, player){
            if(player){
                pokerName.setText(player.name);
            }else {
                pokerName.setText("目前没人");
            }
        };
        var players = this.landLordGameInfo.players;
        var seatNo  = this.landLordGameInfo.seatNo;
        var playerMap = {};
        for (var index = 0; index < players.length; index++){
            var currentPlayer = players[index];
            playerMap[currentPlayer.seatNo] = currentPlayer;
        }
        var selfPlayerInfo = playerMap[seatNo];
        setPlayerName(this.pokerName1, selfPlayerInfo);
        setPlayerName(this.pokerName2, playerMap[selfPlayerInfo.preSeatNo]);
        setPlayerName(this.pokerName3, playerMap[selfPlayerInfo.nextSeatNo]);

    }
    handleTobLandNty(robLandInfoNtyObject){//玩家抢地主通知
        this.btnPanel.clearControls();
        var preScore = robLandInfoNtyObject.preScore;
        var preSeatNo = robLandInfoNtyObject.preSeatNo;
        this.setPlayerRobScore(preSeatNo, preScore);

        this.landLordGameInfo.maxScore = robLandInfoNtyObject.currentScore;
        this.landLordGameInfo.currentRobSeatNo = robLandInfoNtyObject.nextSeat;
        this.toRobLord();
    }
    handleNoLordNty(object){
        var self = this;
        var text = "没人抢地主游戏结束";
        var toast = new ZMToast({x:180, y:100},{width:300, height:200},{title:text});
        toast.addBtnByTextAndClick("取消", self.reStartGameWithIsStart.bind(self, false));
        toast.addBtnByTextAndClick("重新开始", self.reStartGameWithIsStart.bind(self, true));
        JMain.JForm.addControlInLast([toast]);
    }
    handleStartGameNty(startGameNtyMessageObject){
        var self =this;
        self.initGame();
        var cards = startGameNtyMessageObject["cards"];
        this.landLordGameInfo.currentRobSeatNo = startGameNtyMessageObject["firstRob"];
        self.dealingPoker(cards);
    }
    handleGameOverNty(gameOverNtyObject){
        this.btnPanel.visible = false;
        this.clock3.visible = false;
        this.clock2.visible = false;
        this.clock1.visible = false;

        this.btnPanel.clearControls();

        var self = this;
        //将最后一手牌
        var cards = gameOverNtyObject.cards || [];

        var arr = [];
        if(cards.length) {
            this.poker[4].pokers = [];
            for (var index = 0; index < cards.length; index++) {
                var card = cards[index];
                var id = ZMFunction.getCardIdByTypeAndVal(card.type, card.val);
                this.poker[4].addPoker(new ZMPorker(id));
                arr.push(id);
            }
        }
        this.hiddenStatusLabels();

        if(gameOverNtyObject.winnerSeatNo == this.landLordGameInfo.preSeatNo){//上一家打出的牌
            this.poker[2].pokers.splice(0,cards.length);
        }else if(gameOverNtyObject.winnerSeatNo == this.landLordGameInfo.nextSeatNo){//下家打出的牌
            this.poker[3].pokers.splice(0,cards.length);
        }else {//自己打出的牌,去掉自己打出的牌
            this.poker[1].removePokerByIds(arr);
        }
        //展示游戏结束
        var showResultToast = function(isWin){
            var text = isWin ? "恭喜你:赢了" : "很遗憾:输了";
            var toast = new ZMToast({x:180, y:100},{width:300, height:200},{title:text});
            toast.addBtnByTextAndClick("取消", self.reStartGameWithIsStart.bind(self, false));
            toast.addBtnByTextAndClick("再来一局", self.reStartGameWithIsStart.bind(self, true));
            JMain.JForm.addControlInLast([toast]);
        };

        if(this.landLordGameInfo.seatNo == gameOverNtyObject.landLordSeatNo){//如果我是地主
            if(gameOverNtyObject.winnerSeatNo == gameOverNtyObject.landLordSeatNo){//赢了
                showResultToast(true);
            }else {//输了
                showResultToast(false);
            }
        }else {//我不是地主
            if(gameOverNtyObject.winnerSeatNo == gameOverNtyObject.landLordSeatNo){//输了
                showResultToast(false);
            } else {//赢了
                showResultToast(true);
            }
        }
    }
    handleSetRobLandNty(setRobLandNtyObject){//网络回调确定地主通知
        this.landLordGameInfo.maxScore = setRobLandNtyObject.currentScore;
        this.landLordGameInfo.landLordSeatNo = setRobLandNtyObject.landLordSeatNo;
        var hiddenCards = setRobLandNtyObject.hiddenCards;
        //显示底牌
        this.poker[0].pokers = [];
        addHiddenCards(this.poker[0], hiddenCards);
        this.pokerPanel0.hidePoker=false;//调整为正面
        this.pokerPanel0.density = 90;

        if(this.landLordGameInfo.landLordSeatNo == this.landLordGameInfo.preSeatNo){//地主是我的上家
            addHiddenCards(this.poker[2], hiddenCards);
        }else if(this.landLordGameInfo.landLordSeatNo == this.landLordGameInfo.nextSeatNo){//地主是我的下家
            addHiddenCards(this.poker[3], hiddenCards);
        } else {//地主是我自己
            addHiddenCards(this.poker[1], hiddenCards);
        }
        this.btnPanel.visible = false;
        this.landLordGameInfo.currentDealSeatNo = this.landLordGameInfo.landLordSeatNo;//当前操作座位号设置为地主
        this.toPlay();
    }
    handlePlayCardNty(playCardNtyObject){
        var preSeatNo = playCardNtyObject.preSeatNo;//前一位出牌的座位号
        var currentDealSeatNo = playCardNtyObject.nextSeatNo;
        console.log("playCardNtyObject:",playCardNtyObject);
        this.landLordGameInfo.rate  = playCardNtyObject.rate;
        this.landLordGameInfo.currentDealSeatNo = currentDealSeatNo;
        this.landLordGameInfo.lastDealSeatNo = preSeatNo;

        this.setStatusLabel(preSeatNo, playCardNtyObject.cards);

        //将打出的牌展示在中间
        this.pokerPanel4.visible = true;
        this.toPlay();
    }
    handleInitDeskNty(deskInitInfoObject){
        this.initGame();
        var self = this;
        this.landLordGameInfo.deskNo  = deskInitInfoObject.deskNo;
        this.landLordGameInfo.seatNo  = deskInitInfoObject.seatNo;
        this.landLordGameInfo.players = deskInitInfoObject.players;
        this.landLordGameInfo.preSeatNo = deskInitInfoObject.preSeatNo;
        this.landLordGameInfo.nextSeatNo = deskInitInfoObject.nextSeatNo;

        var playerMap = {}; // seatNo -> playerObject;
        for (var index = 0; index < this.landLordGameInfo.players.length; index++){
            var currentPlayer = this.landLordGameInfo.players[index];
            playerMap[currentPlayer.seatNo] = currentPlayer;
        }
        var selfPlayerInfo = playerMap[this.landLordGameInfo.seatNo];

        this.updateDeskPlayerName();

        var status = deskInitInfoObject.curDeskStatus;//当前的桌子状态(1、准备阶段 2、叫地主阶段 3、出牌阶段)
        if(status == 1){//准备阶段
            if(!selfPlayerInfo.isReady){
                this.btnPanel.visible = true;
                this.btnPanel.addControlInLast([this.readyButton]);
            }
        }
        else if(status == 2){//叫地主阶段
            var robList = deskInitInfoObject.robList || [];
            robList.forEach(function(seatNo){
                var score = playerMap[seatNo].robLandScore;
                self.setPlayerRobScore(seatNo, score);
                self.landLordGameInfo.maxScore = score > self.landLordGameInfo.maxScore ? score : self.landLordGameInfo.maxScore;
            });
            this.landLordGameInfo.currentRobSeatNo = deskInitInfoObject.currentRobSeatNo;

            this.poker[0].pokers.splice(3, this.poker[0].length - 3);

            this.poker[2].pokers=[];
            this.poker[3].pokers=[];
            addCardsByCount(this.poker[2], 17);
            addCardsByCount(this.poker[3], 17);
            addHiddenCards(this.poker[1], deskInitInfoObject.cards);//添加自己的牌型
            this.toRobLord();
        }
        else if(status == 3){//出牌阶段
            this.landLordGameInfo.landLordSeatNo = deskInitInfoObject.landLordSeatNo;
            this.landLordGameInfo.maxScore = playerMap[deskInitInfoObject.landLordSeatNo].robLandScore;

            this.landLordGameInfo.rate  = deskInitInfoObject.deskRate;
            this.landLordGameInfo.roundWinSeatNo = deskInitInfoObject.roundWinSeatNo;
            this.landLordGameInfo.currentDealSeatNo = deskInitInfoObject.nextPlayCardSeat;


            this.poker[2].pokers=[];
            this.poker[3].pokers=[];
            addCardsByCount(this.poker[2], playerMap[this.landLordGameInfo.preSeatNo].cardCount);
            addCardsByCount(this.poker[3], playerMap[this.landLordGameInfo.nextSeatNo].cardCount);

            //this.landLordGameInfo.lastDealSeatNo = preSeatNo;
            if(this.landLordGameInfo.currentDealSeatNo == this.landLordGameInfo.seatNo && (!this.landLordGameInfo.roundWinSeatNo && this.landLordGameInfo.roundWinSeatNo == this.landLordGameInfo.seatNo)){
                this.landLordGameInfo.lastDealSeatNo = null
            }else {
                this.landLordGameInfo.lastDealSeatNo = this.landLordGameInfo.getPreSeatNo(this.landLordGameInfo.currentDealSeatNo);
            }
            addHiddenCards(this.poker[1], deskInitInfoObject.cards);//添加自己的牌型
            this.poker[0].pokers = [];
            this.pokerPanel0.hidePoker=false;//调整为正面
            this.pokerPanel0.density = 90;
            addHiddenCards(this.poker[0], deskInitInfoObject.hiddenCards);//添加底牌
            this.poker[4].pokers = [];
            this.pokerPanel4.visible = true;
            addHiddenCards(this.poker[4], deskInitInfoObject.winCards);//显示出的牌

            if(this.landLordGameInfo.currentDealSeatNo == this.landLordGameInfo.roundWinSeatNo){//其余两家都没要
                this.setStatusLabel(this.landLordGameInfo.getNextSeatNo(this.landLordGameInfo.currentDealSeatNo), []);
                this.setStatusLabel(this.landLordGameInfo.getPreSeatNo(this.landLordGameInfo.currentDealSeatNo),[]);
            }else if(this.landLordGameInfo.currentDealSeatNo == this.landLordGameInfo.getPreSeatNo(this.landLordGameInfo.roundWinSeatNo)){
                this.setStatusLabel(this.landLordGameInfo.getNextSeatNo(this.landLordGameInfo.roundWinSeatNo), []);
            }
            this.toPlay();
        }

    }
    setStatusLabel(prePlayerCardSeatNo, cards){
        cards = cards || [];
        var arr = [];
        if(cards.length) {
            this.landLordGameInfo.roundWinSeatNo = prePlayerCardSeatNo;
            this.poker[4].pokers = [];
            for (var index = 0; index < cards.length; index++) {
                var card = cards[index];
                var id = ZMFunction.getCardIdByTypeAndVal(card.type, card.val);
                this.poker[4].addPoker(new ZMPorker(id));
                arr.push(id);
            }
        }
        if(prePlayerCardSeatNo == this.landLordGameInfo.preSeatNo){//上一家打出的牌
            this.poker[2].pokers.splice(0,cards.length);
            this.statusLabel2.visible = !cards.length;
            this.statusLabel1.visible = false;
        }else if(prePlayerCardSeatNo == this.landLordGameInfo.nextSeatNo){//下家打出的牌
            this.poker[3].pokers.splice(0,cards.length);
            this.statusLabel3.visible = !cards.length;
            this.statusLabel2.visible = false;
        }else {//自己打出的牌,去掉自己打出的牌
            this.poker[1].removePokerByIds(arr);
            this.statusLabel1.visible = !cards.length;
            this.statusLabel3.visible = false;
        }
    }
    setPlayerRobScore(seatNo, score){
        var label;
        var text = !score ? "不叫" : score + "分";
        if(seatNo == this.landLordGameInfo.preSeatNo){//上家
            label = this.landScoreLabel2;
        }else if( seatNo== this.landLordGameInfo.nextSeatNo){//下家
            label = this.landScoreLabel3;
        } else {//自己
            label = this.landScoreLabel1;
        }
        label.setText(text)
        label.visible = true;
    }
    gameNeedReStart(){
        this.btnPanel.clearControls();
        var text = "您需要重新开始新一局游戏";
        var toast = new ZMToast({x:180, y:100},{width:300, height:200},{title:text});
        toast.addBtnByTextAndClick("取消", this.reStartGameWithIsStart.bind(this, false));
        toast.addBtnByTextAndClick("再来一局", this.reStartGameWithIsStart.bind(this, true));
        JMain.JForm.addControlInLast([toast]);
    }

    /**
     * 重新开始
     * @param isStart  是否立即开始
     */
    reStartGameWithIsStart(isStart){
        this.initGame();
        if(isStart){
            this.onClickReadyBtn();
        }else {
            this.btnPanel.visible = true;
            this.btnPanel.addControlInLast([this.readyButton]);
        }
    }
    initGame(){
        this.poker=[];
        for(var i=0;i<5;i++) {
            this.poker[i] = new ZMPokersModel();

        }//初始化扑克对象存储空间
        for(var j=0;j<54;j++) {
            this.poker[0].addPoker(new ZMPorker(j+1));
        }

        this.pokerPanel0.hidePoker=true;//hidePoker为true，显示扑克背面
        this.pokerPanel0.setPokersModel(this.poker[0]);//设置底牌的牌型model
        this.pokerPanel1.hidePoker=false;//hidePoker为false，显示扑克正面
        this.pokerPanel1.setPokersModel(this.poker[1]);//设置自己牌的牌型model
        this.pokerPanel2.hidePoker=true;
        this.pokerPanel2.setPokersModel(this.poker[2]);//设置左边的牌型model
        this.pokerPanel3.hidePoker=true;
        this.pokerPanel3.setPokersModel(this.poker[3]);//设置右边的牌型model
        this.pokerPanel4.hidePoker=false;
        this.pokerPanel4.setPokersModel(this.poker[4]);//设置最后出牌的牌型model先
        this.pokerPanel1.toSelectPoker=false;

        this.clock1.visible = false;
        this.clock2.visible = false;
        this.clock3.visible = false;

        this.hiddenStatusLabels();
        this.hiddenLandScoreLabel();

        this.landLordGameInfo.reset();

        this.pokerPanel0.density=1;//设置扑克牌显示密度
        this.dealerNum= ZMFunction.Random(1,3);
    }
    hiddenStatusLabels(){
        this.statusLabel1.visible = false;
        this.statusLabel2.visible = false;
        this.statusLabel3.visible = false;
    }
    hiddenLandScoreLabel(){
        this.landScoreLabel1.visible = false;
        this.landScoreLabel2.visible = false;
        this.landScoreLabel3.visible = false;
    }
    onClickReadyBtn(){
        var self = this;
        JMain.netServiceDataHandle.readyGameReq(null, function(s2CCommonRspObject){
            var rspHead = s2CCommonRspObject.rspHead;
            if(rspHead && rspHead.code == 0){
                self.btnPanel.visible = false;
            }
        });
    }
    //发牌
    dealingPoker(cards){
        if(this.dealingHandle) clearTimeout(this.dealingHandle);
        if(this.dealerNum>3) this.dealerNum=1;
        if(this.dealerNum == 1){
            //发给自己
            var card = cards.splice(0,1)[0];//模拟真实效果 这里可以随机取了之后再排序
            this.poker[this.dealerNum].addPoker(new ZMPorker(ZMFunction.getCardIdByTypeAndVal(card.type, card.val)));
        }else {
            this.poker[this.dealerNum].addPoker(this.poker[0].pokers[0]);
        }
        this.poker[0].removePokerByIndex(0);
        this.dealerNum++;
        if(this.poker[0].length > 3){//发到还剩3张就可以了
            this.dealingHandle = setTimeout(this.dealingPoker.bind(this, cards), 40);//40毫秒发一张牌
        }else {
            this.toRobLord();
        }
    }
    robLandLord(){
        this.btnPanel.clearControls();
        var button1 = new ZMButton({x:30,y:0},{width:130,height:50}).setText("1分").setBGImage(ZMResourceData.Images.btn).setTag(1);
        var button2 = new ZMButton({x:180,y:0},{width:130,height:50}).setText("2分").setBGImage(ZMResourceData.Images.btn).setTag(2);
        var button3 = new ZMButton({x:330,y:0},{width:130,height:50}).setText("3分").setBGImage(ZMResourceData.Images.btn).setTag(3);
        var button4 = new ZMButton({x:480,y:0},{width:130,height:50}).setText("不抢").setBGImage(ZMResourceData.Images.btn).setTag(4);

        button1.onClick = this.onClickRobLandLord.bind(this, button1);
        button2.onClick = this.onClickRobLandLord.bind(this, button2);
        button3.onClick = this.onClickRobLandLord.bind(this, button3);
        button4.onClick = this.onClickRobLandLord.bind(this, button4);

        this.btnPanel.addControlInLast([button1, button2, button3, button4]);
        this.btnPanel.visible = true;

    }
    onClickRobLandLord(btn){//点击抢地主回调
        var self = this;
        var tag = btn.getTag();
        console.log("抢地主：",tag);
        var score = 0;
        if(tag == 1){//抢1分
            score = 1;
        }else if(tag == 2){//抢2分
            score = 2;
        }else if(tag == 3){//抢3分
            score = 3;
        }else if(tag == 4){//不抢
            score = 0;
        }
        var object = {
            score : score
        };
        JMain.netServiceDataHandle.robLandReq(object, self.robLandLordCallback.bind(self));
    }
    robLandLordCallback(robLandRsp){//网络回调

    }
    //开始进入出牌阶段
    toPlay(){
        this.btnPanel.clearControls();
        //this.clock1.visible = this.landLordGameInfo.currentDealSeatNo == this.landLordGameInfo.seatNo;
        this.clock1.visible = false;
        this.clock2.visible = this.landLordGameInfo.currentDealSeatNo == this.landLordGameInfo.preSeatNo;
        this.clock3.visible = this.landLordGameInfo.currentDealSeatNo == this.landLordGameInfo.nextSeatNo;

        if (this.landLordGameInfo.currentDealSeatNo == this.landLordGameInfo.preSeatNo){//上家出牌
            this.btnPanel.visible = false;
            this.pokerPanel1.toSelectPoker = false;//开始开始出牌了
        }else if(this.landLordGameInfo.currentDealSeatNo == this.landLordGameInfo.nextSeatNo){//下家出牌
            this.btnPanel.visible = false;
            this.pokerPanel1.toSelectPoker = false;//开始开始出牌了
        }else {//自己出牌
            var btn2 = new ZMButton({x:screenWidth/2 + 10,y:0},{width:100,height:50}).setText("出牌").setBGImage(ZMResourceData.Images.btn).setTag(2);
            btn2.onClick = this.onClickPlayBtn.bind(this, btn2);
            if(this.landLordGameInfo.lastDealSeatNo
                && this.landLordGameInfo.lastDealSeatNo != this.landLordGameInfo.seatNo
                && (this.landLordGameInfo.roundWinSeatNo && this.landLordGameInfo.roundWinSeatNo != this.landLordGameInfo.seatNo)){//不是第一个出牌
                var btn1 = new ZMButton({x:screenWidth/2 - 100 - 10,y:0},{width:100,height:50}).setText("不出").setBGImage(ZMResourceData.Images.btn).setTag(1);
                btn1.onClick = this.onClickPlayBtn.bind(this, btn1);
            }
            else {//自己第一个出牌
                btn2.setRelativePosition({x:screenWidth/2 - 50, y:0});
            }
            //todo 构造一个提示按钮

            this.btnPanel.visible = true;
            this.pokerPanel1.toSelectPoker = true;//开始开始出牌了
            this.btnPanel.addControlInLast([btn1,btn2]);
        }
        this.landLordGameInfo.lastDealSeatNo = this.landLordGameInfo.currentDealSeatNo;
    }
    //开始进入叫地主阶段
    toRobLord(){
        this.clock1.visible = this.landLordGameInfo.currentRobSeatNo == this.landLordGameInfo.seatNo;
        this.clock2.visible = this.landLordGameInfo.currentRobSeatNo == this.landLordGameInfo.preSeatNo;
        this.clock3.visible = this.landLordGameInfo.currentRobSeatNo == this.landLordGameInfo.nextSeatNo;
        if (this.landLordGameInfo.currentRobSeatNo == this.landLordGameInfo.preSeatNo){//上家叫
            this.btnPanel.visible = false;
        }else if(this.landLordGameInfo.currentRobSeatNo == this.landLordGameInfo.nextSeatNo){//下家叫
            this.btnPanel.visible = false;
        }else{//自己叫
            this.robLandLord();
        }

    }
    onClickPlayBtn(btn){
        var self = this;
        var tag = btn.getTag();
        var cards = [];
        if(tag == 1){//不出牌
        } else if(tag == 2){//出牌
            var selectedPorkers = this.poker[1].getSelectedPokers();
            for (var index = 0; index < selectedPorkers.length; index++){
                var id = selectedPorkers[index].imageData.id;
                cards.push(ZMFunction.getPbCardInfoByCardId(id));
            }
        }
        JMain.netServiceDataHandle.playCardReq({
            cards: cards
        }, self.playCardCallback.bind(self));
    }

    playCardCallback(playCardRsp){
        console.log("playCardRsp:",playCardRsp);
    }

    gameOver(){

    }
}