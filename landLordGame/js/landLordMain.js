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

var NetService = require("./net/netService");
var protobuf = require("./weichatPb/protobuf.js");
var appCommon = require("../pbMessage/appCommon");
var appCommonRoot = protobuf.Root.fromJSON(appCommon);

const screenWidth    = window.innerWidth;
const screenHeight   = window.innerHeight;

export default class landLordMain {
    constructor(){
        this.aniId = 0;
        this.landLordGameInfo = new LordLandGameInfo();
        this.startLandLord();
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
            self.beginButton = new ZMButton({x:screenWidth/2 - 65,y:0},{width:130,height:50}).setText("开始").setBGImage(ZMResourceData.Images.btn);

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

            self.beginButton.onClick = self.onClickStartBtn.bind(self);
            self.btnPanel.addControlInLast([self.beginButton]);
            JMain.JForm.addControlInLast([self.pokerPanel0, self.pokerPanel1, self.pokerPanel2, self.pokerPanel3, self.pokerPanel4, self.btnPanel]);
            JMain.JForm.addControlInLast([self.pokerName1,self.pokerName2,self.pokerName3]);
            JMain.JForm.addControlInLast([self.clock1,self.clock2,self.clock3]);
            JMain.JForm.addControlInLast([self.statusLabel1,self.statusLabel2,self.statusLabel3]);
            JMain.JForm.addControlInLast([self.landScoreLabel1,self.landScoreLabel2,self.landScoreLabel3]);

            //网络服务
            var netService = new  NetService(0x123456789A);
            netService.connect({
                "url" : "ws://127.0.0.1:30000",
                success : function(){
                    console.log("连接建立成功");
                },
                fail:function(){
                    //
                    console.log("请求链接失败");
                },
                complete:function(err){
                    console.log("链接请求回来", err);
                }
            });
            //发送握手协议
            netService.sendData({
                cmd:0x101,
                success: self.handleShakeCallback.bind(self)
            });
            JMain.netService = netService;

            self.initGame();
            //JMain.JForm.show();

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
    addListener(){
        var self = this;
        var netService = JMain.netService;
        netService.addListenerCmd(0x12002, "lanLordMain", this.handleStartGameNty.bind(self));
        netService.addListenerCmd(0x12004, "lanLordMain", this.handleTobLandNty.bind(self));
        netService.addListenerCmd(0x12006, "lanLordMain", this.handleSetRobLandNty.bind(self));
        netService.addListenerCmd(0x12008, "lanLordMain", this.handlePlayCardNty.bind(self));
        netService.addListenerCmd(0x1200A, "lanLordMain", this.handleGameOverNty.bind(self));
        netService.addListenerCmd(0x1200C, "lanLordMain", this.handleNoLordNty.bind(self));
    }
    handleShakeCallback(){//握手请求回包
        var self = this;
        this.addListener();
        JMain.JForm.show();
        //发送进入游戏请求
        JMain.netService.sendData({
            cmd:0x10001,
            success:self.handleJoinGameCallback.bind(self)
        });
    }
    handleJoinGameCallback(recvPacket){//加入游戏请求回包
        //加入游戏成功返回
        var self = this;
        var bodyData = recvPacket.bodyData;
        var JoinGameRspMessage = appCommonRoot.lookupType("JoinGameRsp");
        var joinGameRsp = JoinGameRspMessage.decode(bodyData);
        //joinGameRsp
        var joinGameRspObj = joinGameRsp.toObject();
        this.landLordGameInfo.deskNo = joinGameRspObj.deskNo;//自己的桌号
        var seatNo = joinGameRspObj.seatNo;//桌子上对应的座位号;
        this.landLordGameInfo.seatNo = seatNo;
        var players = joinGameRspObj.players;//玩家数组
        this.landLordGameInfo.players = players;

        var playerMap = {}; // seatNo -> playerObject;
        for (var index = 0; index < players.length; index++){
            var currentPlayer = players[index];
            playerMap[currentPlayer.seatNo] = currentPlayer;
        }

        var selfPlayerInfo = playerMap[seatNo];
        this.landLordGameInfo.preSeatNo = selfPlayerInfo.preSeatNo;
        this.landLordGameInfo.nextSeatNo = selfPlayerInfo.nextSeatNo;

            //设置自己的名称
        self.pokerName1.setText(playerMap[selfPlayerInfo.seatNo].name);
        //设置右边的名称
        self.pokerName2.setText(playerMap[selfPlayerInfo.preSeatNo].name);
        //设置左边的名称
        self.pokerName3.setText(playerMap[selfPlayerInfo.nextSeatNo].name);
        JMain.JForm.show();

    }
    //玩家抢地主通知
    handleTobLandNty(recvPacket){
        this.btnPanel.clearControls();
        var self = this;
        var bodyData = recvPacket.bodyData;
        var robLandInfoNty = appCommonRoot.lookupType("RobLandInfoNty").decode(bodyData);
        var robLandInfoNtyObject = robLandInfoNty.toObject();

        var preScore = robLandInfoNtyObject.preScore;
        var preSeatNo = robLandInfoNtyObject.preSeatNo;
        var text = !preScore ? "不叫" : preScore + "分";
        var label;
        if(preSeatNo == this.landLordGameInfo.preSeatNo){//上家
            label = this.landScoreLabel2;
        }else if( preSeatNo== this.landLordGameInfo.nextSeatNo){//下家
            label = this.landScoreLabel3;
        } else {//自己
            label = this.landScoreLabel1;
        }
        label.setText(text);
        label.visible = true;


        this.landLordGameInfo.maxScore = robLandInfoNtyObject.currentScore;
        this.landLordGameInfo.currentRobSeatNo = robLandInfoNtyObject.nextSeat;
        //this.maxScore = robLandInfoNtyObject.currentScore;

        console.log("robLandInfoNtyObject:",robLandInfoNtyObject);
        this.toRobLord();
    }
    handleNoLordNty(recvPacket){
        var self = this;
        var text = "没人抢地主游戏结束";
        var toast = new ZMToast({x:180, y:100},{width:300, height:200},{title:text});
        toast.addBtnByTextAndClick("取消", self.reStartGameWithIsStart.bind(self, false));
        toast.addBtnByTextAndClick("重新开始", self.reStartGameWithIsStart.bind(self, true));
        JMain.JForm.addControlInLast([toast]);
        JMain.JForm.show();
    }
    handleStartGameNty(recvPacket){
        var self =this;
        self.initGame();
        var bodyData = recvPacket.bodyData;
        var StartGameNtyMessage = appCommonRoot.lookupType("StartGameNty");
        var startGameNtyMessage = StartGameNtyMessage.decode(bodyData);
        var startGameNtyMessageObject = startGameNtyMessage.toObject();
        var cards = startGameNtyMessageObject["cards"];
        this.landLordGameInfo.currentRobSeatNo = startGameNtyMessageObject["firstRob"];
        self.dealingPoker(cards);
    }
    handleGameOverNty(recvPacket){
        this.btnPanel.visible = false;
        this.clock3.visible = false;
        this.clock2.visible = false;
        this.clock1.visible = false;

        this.btnPanel.clearControls();

        var self = this;
        var bodyData = recvPacket.bodyData;
        var gameOverNty = appCommonRoot.lookupType("GameOverNty").decode(bodyData);
        var gameOverNtyObject = gameOverNty.toObject();
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
            JMain.JForm.show();
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

    /**
     * 重新开始
     * @param isStart  是否立即开始
     */
    reStartGameWithIsStart(isStart){
        this.initGame();
        if(isStart){
            this.onClickStartBtn();
        }else {
            this.btnPanel.visible = true;
            this.btnPanel.addControlInLast([this.beginButton]);
        }
        JMain.JForm.show();
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
    onClickStartBtn(){
        this.btnPanel.visible = false;
        var self = this;
        var netService = JMain.netService;
        netService.sendData({
            cmd:0x10003,
            success: function(){
                console.log("发送游戏开始请求成功");
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
        JMain.JForm.show();
        if(this.poker[0].length > 3){//发到还剩3张就可以了
            this.dealingHandle = setTimeout(this.dealingPoker.bind(this, cards), 40);//40毫秒发一张牌
        }else {
            //这里判断是不是自己叫地主
            //if(this.landLordGameInfo.currentRobSeatNo == this.landLordGameInfo.seatNo){
            //    this.robLandLord();
            //}
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
        JMain.JForm.show();
        //if(this.landLordGameInfo.robTime >= 3 && this.landLordGameInfo.maxScore == 0){
        //    //gameOver 没人抢地主游戏结束
        //    this.gameOver();
        //    return;
        //}

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
        var netService = JMain.netService;

        var robLandReq = appCommonRoot.lookupType("RobLandReq").create(object);
        netService.sendData({
            cmd : 0x10005,
            data : robLandReq.encode().finish(),
            success:self.robLandLordCallback.bind(self)
        })
    }
    robLandLordCallback(recvPacket){//网络回调
        var self = this;
        var bodyData = recvPacket.bodyData;
        var robLandRsp = appCommonRoot.lookupType("RobLandRsp").decode(bodyData);
        console.log("robLandRsp:",robLandRsp.toObject());
        if(!robLandRsp.rspHead){//一般情况下不可能会出现
            console.log("服务器没有返回head ,应该谈一个错误提示")
            return;
        }
        if(robLandRsp.rspHead.code){
            console.warn("抢地主收到错误码code:", robLandRsp.rspHead.code);
        }else {
            console.log("抢地主成功返回");
        }
    }

    handleSetRobLandNty(recvPacket){//网络回调确定地主通知
        //this.hiddenLandScoreLabel();
        var bodyData = recvPacket.bodyData;
        var setRobLandNty = appCommonRoot.lookupType("SetLandLordNty").decode(bodyData);
        var setRobLandNtyObject = setRobLandNty.toObject();
        this.landLordGameInfo.maxScore = setRobLandNtyObject.currentScore;
        this.landLordGameInfo.landLordSeatNo = setRobLandNtyObject.landLordSeatNo;
        var hiddenCards = setRobLandNtyObject.hiddenCards;

        var addHiddenCards = function(porkersModel){
            for (var index = 0; index < hiddenCards.length; index++){
                var card = hiddenCards[index];
                porkersModel.addPoker(new ZMPorker(ZMFunction.getCardIdByTypeAndVal(card.type, card.val)) );
            }
        };
        //显示底牌
        this.poker[0].pokers = [];
        addHiddenCards(this.poker[0]);
        this.pokerPanel0.hidePoker=false;//调整为正面
        this.pokerPanel0.density = 90;

        if(this.landLordGameInfo.landLordSeatNo == this.landLordGameInfo.preSeatNo){//地主是我的上家
            addHiddenCards(this.poker[2]);
        }else if(this.landLordGameInfo.landLordSeatNo == this.landLordGameInfo.nextSeatNo){//地主是我的下家
            addHiddenCards(this.poker[3]);
        } else {//地主是我自己
            addHiddenCards(this.poker[1]);
        }
        this.btnPanel.visible = false;
        this.landLordGameInfo.currentDealSeatNo = this.landLordGameInfo.landLordSeatNo;//当前操作座位号设置为地主
        this.toPlay();
        JMain.JForm.show();
    }

    handlePlayCardNty(recvPacket){
        var bodyData = recvPacket.bodyData;
        var playCardNty = appCommonRoot.lookupType("PlayCardNty").decode(bodyData);
        var playCardNtyObject = playCardNty.toObject();
        var preSeatNo = playCardNtyObject.preSeatNo;//前一位出牌的座位号
        console.log("playCardNtyObject:",playCardNtyObject);
        this.landLordGameInfo.rate  = playCardNtyObject.rate;
        this.landLordGameInfo.currentDealSeatNo = playCardNtyObject.nextSeatNo;
        this.landLordGameInfo.lastDealSeatNo = preSeatNo;


        var cards = playCardNtyObject.cards || [];

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

        if(preSeatNo == this.landLordGameInfo.preSeatNo){//上一家打出的牌
            this.poker[2].pokers.splice(0,cards.length);
            this.statusLabel2.visible = !cards.length;
        }else if(preSeatNo == this.landLordGameInfo.nextSeatNo){//下家打出的牌
            this.poker[3].pokers.splice(0,cards.length);
            this.statusLabel3.visible = !cards.length;
        }else {//自己打出的牌,去掉自己打出的牌
            this.poker[1].removePokerByIds(arr);
            this.statusLabel1.visible = !cards.length;
        }

        //将打出的牌展示在中间
        this.pokerPanel4.visible = true;
        this.toPlay();
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
            if(this.landLordGameInfo.lastDealSeatNo && this.landLordGameInfo.lastDealSeatNo != this.landLordGameInfo.seatNo){//不是第一个出牌
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
        JMain.JForm.show();
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
        var playCardReq = appCommonRoot.lookupType("PlayCardReq").create();
        playCardReq.cards = cards;
        var netService = JMain.netService;
        netService.sendData({
            cmd : 0x10007,
            data : playCardReq.encode().finish(),
            success:self.playCardCallback.bind(self)
        })
    }
    playCardCallback(recvPacket){
        var self = this;
        var bodyData = recvPacket.bodyData;
        var playCardRsp = appCommonRoot.lookupType("PlayCardRsp").decode(bodyData);
        //
        console.log("playCardRsp:",playCardRsp.toObject());
    }

    gameOver(){

    }
}