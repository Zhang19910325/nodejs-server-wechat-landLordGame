/**
 * Created by zhangmiao on 2018/6/28.
 */
import ZMClass from "../../base/zmClass"
import LandLordManager from "./landLordManager"
import ZMPokerPanel from "../../components/zmPokerPanel"
import ZMPosition from "../../common/zmPosition"
import ZMResourceData from "../../common/zmResourceData"
import ZMLabel from "../../components/zmLabel"
import ZMButton from "../../components/zmButton"
import ZMPorker from  "../../components/zmPoker"
import ZMColor from "../../common/zmColor"
import ZMFunction from "../../common/zmFunction"
import ZMPokersModel from "../../model/zmPokersModel"
import ZMToast from "../../components/zmToast"

function pos (x,y){
    return new ZMPosition(x,y);
}

function setImageWithUrl(avatar, url){
    let image =  new Image();
    image.src = url;
    avatar.setImage(image);
}

function itemSetVisibleWithArr(arr, isShow){
    arr.map((item)=>item.visible = isShow);
}

function addCards(porkersModel, cardList){
    cardList = cardList || [];
    for (let index = 0; index < cardList.length; index++){
        let card = cardList[index];
        porkersModel.addPoker(new ZMPorker(ZMFunction.getCardIdByTypeAndVal(card.type, card.val)));
    }
}

function addCardsByCount(porkersModel, count){
    for (let index = 0; index < count; index++){
        porkersModel.addPoker(new ZMPorker(1));
    }
}

export default class LandLordPlayingScene extends ZMClass{
    dealingInterval = null;
    constructor(size){
        super({x:0, y:0}, size);
        this.landLordManager = JMain.landLordManager;
        this.addObserver();
        this.initUI();
        this.setupInitialStatus();
        this.startGameReq();
    }
    addObserver(){
        ZMNotificationCenter.addObserver(this, this.handleInitDeskNty.bind(this), "landLordInitDeskNty");
        ZMNotificationCenter.addObserver(this, this.handleStartGameNty.bind(this), "landLordStartGameNty");
        ZMNotificationCenter.addObserver(this, this.handleToRobLordNty.bind(this), "landLordToLandNty");
        ZMNotificationCenter.addObserver(this, this.handleSetLandLordNty.bind(this), "landLordSetLorderNty");
        ZMNotificationCenter.addObserver(this, this.handlePlayCardNty.bind(this), "landLordPlayCardNty");
        ZMNotificationCenter.addObserver(this, this.handleGameOverNty.bind(this), "landLordGameOverNty");
        ZMNotificationCenter.addObserver(this, this.handleNoLordNty.bind(this), "landLordNoLordNty");
        ZMNotificationCenter.addObserver(this, this.handleDeskUpdateNty.bind(this), "landLordDeskUpdateNty");
    }
    handleHandShakeNty(){
        let self = this;
        console.log("收到握手成功通知");
    }
    handleStartGameNty(startGameNtyMessageObject){
        this.setupInitialStatus();
        let cards = startGameNtyMessageObject["cards"];
        this.landLordManager.currentRobSeatNo = startGameNtyMessageObject["firstRob"];
        this.dealingPorker(cards);
    }
    handleInitDeskNty(deskInitInfoObject){
        console.log("deskInitInfoObject",deskInitInfoObject);
        this.setupInitialStatus();
        let self = this;
        this.landLordManager.deskNo  = deskInitInfoObject.deskNo;
        this.landLordManager.seatNo  = deskInitInfoObject.seatNo;
        this.landLordManager.players = deskInitInfoObject.players;
        this.landLordManager.preSeatNo = deskInitInfoObject.preSeatNo;
        this.landLordManager.nextSeatNo = deskInitInfoObject.nextSeatNo;

        let playerMap = {}; // seatNo -> playerObject;
        for (let index = 0; index < this.landLordManager.players.length; index++){
            let currentPlayer = this.landLordManager.players[index];
            playerMap[currentPlayer.seatNo] = currentPlayer;
        }
        let selfPlayerInfo = playerMap[this.landLordManager.seatNo];

        this.updateDeskPlayerInfo();
        let status = deskInitInfoObject.curDeskStatus;//当前的桌子状态(1、准备阶段 2、叫地主阶段 3、出牌阶段)

        if(status == 1){//准备阶段
            if(!selfPlayerInfo.isReady) this.setReadyBtn();
        }else if(status == 2){//叫地主阶段
            let robList = deskInitInfoObject.robList || [];
            robList.forEach(function(seatNo){
                let score = playerMap[seatNo].robLandScore;
                self.setPlayerRobScore(seatNo, score);
                self.landLordManager.maxScore = score > self.landLordManager.maxScore ? score : self.landLordManager.maxScore;
            });
            this.landLordManager.currentRobSeatNo = deskInitInfoObject.curRobSeatNo;
            this.topPorkersModel.pokers.splice(3,this.topPorkersModel.length - 3);

            this.leftHandPorkersModel.pokers = [];
            this.rightHandPorkersModel.pokers = [];
            addCardsByCount(this.leftHandPorkersModel, 17);
            addCardsByCount(this.rightHandPorkersModel, 17);
            addCards(this.selfHandPorkersModel, deskInitInfoObject.cards);
            this.toRobLord();
        }else if(status == 3){//出牌阶段
            this.landLordManager.landLordSeatNo = deskInitInfoObject.landLordSeatNo;
            this.updateLordAssignVisible();
            this.landLordManager.maxScore = playerMap[deskInitInfoObject.landLordSeatNo].robLandScore;

            this.landLordManager.rate  = deskInitInfoObject.deskRate;
            this.landLordManager.roundWinSeatNo = deskInitInfoObject.roundWinSeatNo;
            this.landLordManager.currentDealSeatNo = deskInitInfoObject.nextPlayCardSeat;

            let leftPlayer = playerMap[this.landLordManager.nextSeatNo];
            let rightPlayer = playerMap[this.landLordManager.preSeatNo];

            this.leftHandPorkersModel.pokers = [];
            this.rightHandPorkersModel.pokers = [];
            addCardsByCount(this.leftHandPorkersModel, leftPlayer.cardCount);
            addCardsByCount(this.rightHandPorkersModel, rightPlayer.cardCount);
            if(this.landLordManager.currentDealSeatNo == this.landLordManager.seatNo && (!this.landLordManager.roundWinSeatNo && this.landLordManager.roundWinSeatNo == this.landLordManager.seatNo)){
                this.landLordManager.lastDealSeatNo = null
            }else {
                this.landLordManager.lastDealSeatNo = this.landLordManager.getPreSeatNo(this.landLordManager.currentDealSeatNo);
            }
            addCards(this.selfHandPorkersModel, deskInitInfoObject.cards);//添加自己的牌型

            this.topPorkersModel.pokers = [];
            this.topPorkerPanel.hidePoker = false;
            this.topPorkerPanel.density = 90;
            addCards(this.topPorkersModel, deskInitInfoObject.hiddenCards);

            addCards(this.selfPlayPorkersModel, selfPlayerInfo.lastPlayCards);
            addCards(this.leftPlayPorkersModel, leftPlayer.lastPlayCards);
            addCards(this.rightPlayPorkersModel, rightPlayer.lastPlayCards);

            if(this.landLordManager.currentDealSeatNo == this.landLordManager.roundWinSeatNo){//其余两家都没要
                //this.setStatusLabel(this.landLordGameInfo.getNextSeatNo(this.landLordGameInfo.currentDealSeatNo), []);
                //this.setStatusLabel(this.landLordGameInfo.getPreSeatNo(this.landLordGameInfo.currentDealSeatNo),[]);
            }else if(this.landLordManager.currentDealSeatNo == this.landLordManager.getPreSeatNo(this.landLordManager.roundWinSeatNo)){
                //this.setStatusLabel(this.landLordGameInfo.getNextSeatNo(this.landLordGameInfo.roundWinSeatNo), []);
            }

            if(this.landLordManager.currentDealSeatNo != selfPlayerInfo.seatNo){
                this.setPlayCardInfo(selfPlayerInfo.seatNo, selfPlayerInfo.lastPlayCards)
            }else if(this.landLordManager.currentDealSeatNo != rightPlayer.seatNo){
                this.setPlayCardInfo(rightPlayer.seatNo, rightPlayer.lastPlayCards)
            }else if(this.landLordManager.currentDealSeatNo != leftPlayer.seatNo){
                this.setPlayCardInfo(leftPlayer.seatNo, leftPlayer.lastPlayCards);
            }

            this.toPlay();
        }
    }
    handleDeskUpdateNty(deskUpdateNtyMessageObject){
        this.landLordManager.players = deskUpdateNtyMessageObject.players;
        this.updateDeskPlayerInfo()
    }
    handleToRobLordNty(robLandInfoNtyObject){
        this.btnPanel.clearControls();
        var preScore = robLandInfoNtyObject.preScore;
        var preSeatNo = robLandInfoNtyObject.preSeatNo;
        this.setPlayerRobScore(preSeatNo, preScore);

        this.landLordManager.maxScore = robLandInfoNtyObject.currentScore;
        this.landLordManager.currentRobSeatNo = robLandInfoNtyObject.nextSeat;
        this.toRobLord();
    }
    handleSetLandLordNty(setRobLandNtyObject){
        this.landLordManager.maxScore = setRobLandNtyObject.currentScore;
        this.landLordManager.landLordSeatNo = setRobLandNtyObject.landLordSeatNo;
        var hiddenCards = setRobLandNtyObject.hiddenCards;

        this.topPorkersModel.pokers = [];
        addCards(this.topPorkersModel, hiddenCards);
        this.topPorkerPanel.hidePoker = false;
        this.topPorkerPanel.density = 90;

        if(this.landLordManager.landLordSeatNo == this.landLordManager.preSeatNo){
            addCards(this.rightHandPorkersModel, hiddenCards);
        }else if(this.landLordManager.landLordSeatNo == this.landLordManager.nextSeatNo){
            addCards(this.leftHandPorkersModel, hiddenCards);
        }else {
            addCards(this.selfHandPorkersModel, hiddenCards);
        }
        this.updateLordAssignVisible();
        this.btnPanel.visible = false;
        this.landLordManager.currentDealSeatNo = this.landLordManager.landLordSeatNo;
        this.toPlay();
    }
    updateLordAssignVisible(){
        if(this.landLordManager.landLordSeatNo == this.landLordManager.preSeatNo){
            this.rightLordAssign.visible = true;
        }else if(this.landLordManager.landLordSeatNo == this.landLordManager.nextSeatNo){
            this.leftLordAssign.visible = true;
        }else {
            this.selfLordAssign.visible = true;
        }
    }
    handlePlayCardNty(playCardNtyObject){
        this.hiddenScoreLabel();
        itemSetVisibleWithArr([this.leftStatusLabel,this.rightStatusLabel,this.selfStatusLabel], true);
        let preSeatNo = playCardNtyObject.preSeatNo;//前一位出牌的座位号
        let currentDealSeatNo = playCardNtyObject.nextSeatNo;

        this.landLordManager.rate = playCardNtyObject.rate;
        this.landLordManager.currentDealSeatNo = currentDealSeatNo;
        this.landLordManager.lastDealSeatNo = preSeatNo;

        this.setPlayCardInfo(preSeatNo, playCardNtyObject.cards);
        this.toPlay();
    }
    handleGameOverNty(gameOverNtyObject){
        itemSetVisibleWithArr([this.btnPanel, this.leftClock, this.rightClock, this.selfClock], false);
        this.btnPanel.clearControls();
        let cards = gameOverNtyObject.cards;

        let playPokersModel;
        let self = this;
        if(gameOverNtyObject.winnerSeatNo == this.landLordManager.preSeatNo){
            this.rightHandPorkersModel.pokers= [];
            playPokersModel = this.rightPlayPorkersModel;
        }else if(gameOverNtyObject.winnerSeatNo == this.landLordManager.nextSeatNo){
            this.leftHandPorkersModel.pokers = [];
            playPokersModel = this.leftPlayPorkersModel;
        }else {
            this.selfHandPorkersModel.pokers = [];
            playPokersModel = this.selfPlayPorkersModel;
        }
        playPokersModel.pokers = [];
        for(let index = 0; index < cards.length; index++){
            let card = cards[index];
            let id = ZMFunction.getCardIdByTypeAndVal(card.type, card.val);
            playPokersModel.addPoker(new ZMPorker(id));
        }

        var showResultToast = function(isWin){
            var text = isWin ? "恭喜你:赢了" : "很遗憾:输了";
            var toast = new ZMToast({x:180, y:100},{width:300, height:200},{title:text});
            toast.addBtnByTextAndClick("取消", self.reStartGameWithIsStart.bind(self, false));
            toast.addBtnByTextAndClick("再来一局", self.reStartGameWithIsStart.bind(self, true));
            self.addControlInLast([toast]);
        };

        if(this.landLordManager.seatNo == gameOverNtyObject.landLordSeatNo){//如果我是地主
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
    handleNoLordNty(){
        let text = "没人抢地主,游戏结束";
        var toast = new ZMToast({x:180, y:100},{width:300, height:200},{title:text});
        toast.addBtnByTextAndClick("取消", this.reStartGameWithIsStart.bind(this, false));
        toast.addBtnByTextAndClick("重新开始", this.reStartGameWithIsStart.bind(this, true));
        this.addControlInLast([toast]);
    }
    initUI(){
        console.log("布局玩牌");
        let userInfo = JMain.userInfo;
        //底牌
        this.topPorkerPanel = new ZMPokerPanel({x:this.width/2, y:5}, {width:200, height:60}, false, 1).setAnchorPoint({x:0.5, y:0});//用于显示底牌
        //this.topPorkerPanel.setBGColor(ZMColor.red);
        this.addControlInLast([this.topPorkerPanel]);

        //左边人物的头像
        let leftAvatar = new ZMClass({x:5,y:this.height/2-15}, {width:40, height:40}).setAnchorPoint({x:0,y:0.5}).setRadius(20);
        setImageWithUrl(leftAvatar, userInfo['avatarUrl']);
        this.leftAvatar = leftAvatar;
        //左边的名字
        let leftName = new ZMLabel(pos(()=>leftAvatar.left,()=>leftAvatar.bottom+8),"左边的名字").setFontSize(10).setAnchorPoint({x:0,y:0}).setFontColor(ZMColor.white);
        this.leftName = leftName;
        //设置左边牌的背面
        let leftHidePorker = new ZMClass(pos(()=>leftAvatar.right+5,leftAvatar.centerY), {width:40,height:50}).setAnchorPoint({x:0,y:0.5}).setBGColor(ZMColor.white);
        setImageWithUrl(leftHidePorker, ZMResourceData.Images.BeiMian.path);
        this.leftHidePorker = leftHidePorker;
        //左边牌背面上的数字
        let leftPorkerNum = new ZMLabel(pos(leftHidePorker.width/2, leftHidePorker.height/2), "17").setAnchorPoint({x:0.5,y:0.5}).setFontColor(ZMColor.black);
        this.leftPorkerNum = leftPorkerNum;
        leftHidePorker.addControlInLast([leftPorkerNum]);
        //左边的地主标示,todo 目前没有搞到图片
        let leftLordAssign = new ZMLabel(pos(5,leftAvatar.top -5),"地主").setFontColor(ZMColor.white).setAnchorPoint({x:0,y:1});
        this.leftLordAssign = leftLordAssign;
        //左边出的牌
        let leftPorkerPanel = new ZMPokerPanel(pos(()=>leftHidePorker.right+5, leftHidePorker.centerY), {width:350, height:55}, false, 15).setAnchorPoint({x:0, y:0.5}).setPokerAlign("left");//用于显示底牌
        //leftPorkerPanel.setBGColor(ZMColor.blue);
        this.leftPorkerPanel = leftPorkerPanel;
        //左边的小闹钟
        let leftClock = new ZMClass(pos(()=>leftHidePorker.right+5, leftHidePorker.top - 10),{width:20, height:20}).setAnchorPoint({x:0,y:1});
        setImageWithUrl(leftClock, ZMResourceData.Images.clock.path);
        this.leftClock = leftClock;
        //右边的不要label
        let leftStatusLabel = new ZMLabel(pos(leftHidePorker.right + 5, leftHidePorker.centerY), "不要").setAnchorPoint({x:0,y:0.5}).setFontColor(ZMColor.white);
        this.leftStatusLabel = leftStatusLabel;
        //右边的分数的label
        let leftScoreLabel = new ZMLabel(pos(leftHidePorker.right + 5, leftHidePorker.centerY), "").setAnchorPoint({x:0,y:0.5}).setFontColor(ZMColor.white);
        this.leftScoreLabel = leftScoreLabel;


        //右边人物的头像
        let rightAvatar = new ZMClass({x:this.width - 5,y:this.height/2-15}, {width:40, height:40}).setAnchorPoint({x:1,y:0.5}).setRadius(20);
        setImageWithUrl(rightAvatar, userInfo['avatarUrl']);
        this.rightAvatar = rightAvatar;
        let rightName = new ZMLabel(pos(()=>rightAvatar.right,()=>rightAvatar.bottom+8),"右边的名字").setFontSize(10).setAnchorPoint({x:1,y:0}).setFontColor(ZMColor.white);
        this.rightName = rightName;
        let rightHidePorker = new ZMClass(pos(()=>rightAvatar.left-5,rightAvatar.centerY), {width:40,height:50}).setAnchorPoint({x:1,y:0.5});
        setImageWithUrl(rightHidePorker, ZMResourceData.Images.BeiMian.path);
        this.rightHidePorker = rightHidePorker;
        let rightPorkerNum = new ZMLabel(pos(rightHidePorker.width/2, rightHidePorker.height/2), "17").setAnchorPoint({x:0.5,y:0.5});
        this.rightPorkerNum = rightPorkerNum;
        rightHidePorker.addControlInLast([rightPorkerNum]);
        let rightLordAssign = new ZMLabel(pos(this.width - 5,rightAvatar.top -5),"地主").setFontColor(ZMColor.white).setAnchorPoint({x:1,y:1});
        this.rightLordAssign = rightLordAssign;
        let rightPorkerPanel = new ZMPokerPanel(pos(()=>rightHidePorker.left-5, rightHidePorker.centerY), {width:350, height:55}, false, 15).setAnchorPoint({x:1, y:0.5}).setPokerAlign("right");//用于显示底牌
        //rightPorkerPanel.setBGColor(ZMColor.red);
        this.rightPorkerPanel = rightPorkerPanel;
        //右边的小闹钟
        let rightClock = new ZMClass(pos(()=>rightHidePorker.left-5, rightHidePorker.top - 10), {width:20, height:20}).setAnchorPoint({x:1,y:1});
        setImageWithUrl(rightClock, ZMResourceData.Images.clock.path);
        this.rightClock = rightClock;
        let rightStatusLabel = new ZMLabel(pos(rightHidePorker.left - 5, rightHidePorker.centerY), "不要").setAnchorPoint({x:1,y:0.5}).setFontColor(ZMColor.white);
        this.rightStatusLabel = rightStatusLabel;
        let rightScoreLabel = new ZMLabel(pos(rightHidePorker.left - 5, rightHidePorker.centerY), "").setAnchorPoint({x:1,y:0.5}).setFontColor(ZMColor.white);
        this.rightScoreLabel = rightScoreLabel;

        //自己人物的头像
        let selfAvatar = new ZMClass({x:this.width/2,y:this.height - 5}, {width:40, height:40}).setAnchorPoint({x:0.5,y:1}).setRadius(20);
        setImageWithUrl(selfAvatar, userInfo['avatarUrl']);
        this.selfAvatar = selfAvatar;
        let selfName = new ZMLabel(pos(()=>selfAvatar.right + 5,()=>selfAvatar.centerY),"自己的名字").setFontSize(10).setAnchorPoint({x:0,y:0.5}).setFontColor(ZMColor.white);
        this.selfName = selfName;
        let selfLordAssign = new ZMLabel(pos(selfAvatar.left - 5, selfAvatar.centerY),"地主").setFontColor(ZMColor.white).setAnchorPoint({x:1,y:0.5});
        this.selfLordAssign = selfLordAssign;
        //自己的手牌
        let selfHandPorkerPane = new ZMPokerPanel(pos(()=>this.width/2, selfAvatar.top - 5), {width:350, height:55}, false, 15).setAnchorPoint({x:0.5, y:1});//用于显示底牌
        //selfHandPorkerPane.setBGColor(ZMColor.red);
        this.selfHandPorkerPane = selfHandPorkerPane;
        let selfPorkerPanel = new ZMPokerPanel(pos(()=>this.width/2, selfHandPorkerPane.top - 5), {width:350, height:55}, false, 15).setAnchorPoint({x:0.5, y:1});//用于显示底牌
        this.selfPorkerPanel = selfPorkerPanel;
        let selfClock = new ZMClass(pos(()=>selfHandPorkerPane.centerX, selfHandPorkerPane.top - 5), {width:20, height:20}).setAnchorPoint({x:0.5,y:1});
        setImageWithUrl(selfClock, ZMResourceData.Images.clock.path);
        this.selfClock = selfClock;
        let selfStatusLabel = new ZMLabel(pos(selfHandPorkerPane.centerX, selfHandPorkerPane.top -5), "不要").setAnchorPoint({x:0.5,y:1}).setFontColor(ZMColor.white);
        this.selfStatusLabel = selfStatusLabel;
        let selfScoreLabel = new ZMLabel(pos(selfHandPorkerPane.centerX, selfHandPorkerPane.top -5), "").setAnchorPoint({x:0.5,y:1}).setFontColor(ZMColor.white);
        this.selfScoreLabel = selfScoreLabel;
        //按钮控件
        let btnPanel = new ZMClass({x:0,y:210}, {width:this.width, height:50});
        this.btnPanel = btnPanel;

        this.addControlInLast([leftAvatar, rightAvatar, selfAvatar, leftHidePorker, rightHidePorker, leftLordAssign, rightLordAssign, selfLordAssign,
            leftPorkerPanel,rightPorkerPanel,selfHandPorkerPane, selfPorkerPanel,leftClock,rightClock,selfClock,
            leftStatusLabel,rightStatusLabel,selfStatusLabel,btnPanel,leftName,rightName,selfName, selfScoreLabel, leftScoreLabel, rightScoreLabel]);

    }
    setReadyBtn(){
        this.btnPanel.clearControls();
        let readyBtn = new ZMButton({x:this.btnPanel.width/2, y:this.btnPanel.height/2}, {width:130, height:50}).setText("准备")
            .setAnchorPoint({x:0.5,y:0.5}).setBGColor(ZMColor.green).setBGImage(ZMResourceData.Images.btn);
        readyBtn.onClick = this.onClickReadyBtn.bind(this);
        this.btnPanel.addControlInLast([readyBtn]);
    }
    onClickReadyBtn(){
        var self = this;
        this.landLordManager.readyGameReq(null, function(s2CCommonRspObject){
            var rspHead = s2CCommonRspObject.rspHead;
            if(rspHead && rspHead.code == 0){
                self.btnPanel.clearControls();
            }
        });
    }
    hiddenScoreLabel(){
        itemSetVisibleWithArr([this.selfScoreLabel, this.leftScoreLabel, this.rightScoreLabel], false);
    }
    //设置初始状态
    setupInitialStatus(){
        let self = this;
        let hiddenArr = [
            this.leftClock, this.leftLordAssign,this.leftStatusLabel,
            this.rightClock, this.rightLordAssign,this.rightStatusLabel,
            this.selfClock, this.selfLordAssign,this.selfStatusLabel,
            this.selfScoreLabel, this.leftScoreLabel, this.rightScoreLabel
            ];
        itemSetVisibleWithArr(hiddenArr, false);

        this.topPorkersModel = new ZMPokersModel();//顶部的牌
        this.topPorkerPanel.setPokersModel(this.topPorkersModel);
        this.topPorkerPanel.density = 1;
        this.topPorkerPanel.hidePoker = true;
        addCardsByCount(this.topPorkersModel,54);

        this.leftHandPorkersModel = new ZMPokersModel();//左边手牌
        this.leftPorkerNum.setText(function(){
            return self.leftHandPorkersModel.length + "";
        });
        this.rightHandPorkersModel = new ZMPokersModel();//右边手牌
        this.rightPorkerNum.setText(function(){
            return self.rightHandPorkersModel.length + "";
        });
        this.selfHandPorkersModel = new ZMPokersModel();//自己手牌
        this.selfHandPorkerPane.setPokersModel(this.selfHandPorkersModel);

        this.leftPlayPorkersModel = new ZMPokersModel();//左边的出牌
        this.leftPorkerPanel.setPokersModel(this.leftPlayPorkersModel);
        this.leftStatusLabel.setText(function(){
            if (self.landLordManager.currentDealSeatNo == self.landLordManager.nextSeatNo){
                return "";
            }
            return self.leftPlayPorkersModel.length ? "" : "不要"
        });
        this.rightPlayPorkersModel = new ZMPokersModel();//右边的出牌
        this.rightPorkerPanel.setPokersModel(this.rightPlayPorkersModel);
        this.rightStatusLabel.setText(function(){
            if (self.landLordManager.currentDealSeatNo == self.landLordManager.preSeatNo){
                return "";
            }
            return self.rightPlayPorkersModel.length ? "" : "不要"
        });
        this.selfPlayPorkersModel = new ZMPokersModel();//自己的出牌
        this.selfPorkerPanel.setPokersModel(this.selfPlayPorkersModel);
        this.selfStatusLabel.setText(function(){
            if (self.landLordManager.currentDealSeatNo == self.landLordManager.seatNo){
                return "";
            }
            return self.selfPlayPorkersModel.length ? "" : "不要"
        });

        this.dealerNum= ZMFunction.Random(1,3);
    }
    startGameReq(){
        let self = this;
        this.landLordManager.startGameReq(null, self.startGameRsp.bind(self));
    }
    startGameRsp(startGameRspObj){
        console.log("startGameRspObj:",startGameRspObj);
        let self = this;
        this.landLordManager.deskNo = startGameRspObj.deskNo;
        let seatNo = startGameRspObj.seatNo;
        let players = startGameRspObj.players;
        this.landLordManager.seatNo = seatNo;
        this.landLordManager.players = players;

        this.updateDeskPlayerInfo();
    }
    updateDeskPlayerInfo(){
        let setPlayerAvatarAndName = function(avatarImg, nameLabel, player){
            if(player){
                setImageWithUrl(avatarImg, player.avatarUrl);
                nameLabel.setText(player.name);
            }
        };
        let players = this.landLordManager.players;
        let seatNo = this.landLordManager.seatNo;
        let playerMap = {};
        for(let index = 0; index < players.length; index++){
            let currentPlayer = players[index];
            playerMap[currentPlayer.seatNo] = currentPlayer;
        }
        let selfPlayerInfo = playerMap[seatNo];
        this.landLordManager.preSeatNo = selfPlayerInfo.preSeatNo;
        this.landLordManager.nextSeatNo = selfPlayerInfo.nextSeatNo;
        setPlayerAvatarAndName(this.selfAvatar, this.selfName, selfPlayerInfo);
        setPlayerAvatarAndName(this.leftAvatar, this.leftName, playerMap[selfPlayerInfo.nextSeatNo]);
        setPlayerAvatarAndName(this.rightAvatar, this.rightName, playerMap[selfPlayerInfo.preSeatNo]);
    }
    dealingPorker(cards){
        if(this.dealingInterval) clearInterval(this.dealingInterval);
        if(this.dealerNum>3) this.dealerNum = 1;
        if(this.dealerNum == 1){//发给自己
            let card = cards.splice(0,1)[0];
            if(!card){
                console.log("card:",card);
            }
            this.selfHandPorkersModel.addPoker(new ZMPorker(ZMFunction.getCardIdByTypeAndVal(card.type, card.val)));
        }else if(this.dealerNum == 2){
            this.leftHandPorkersModel.addPoker(this.topPorkersModel.pokers[0]);
        }else if(this.dealerNum == 3){
            this.rightHandPorkersModel.addPoker(this.topPorkersModel.pokers[0]);
        }
        this.topPorkersModel.removePokerByIndex(0);
        this.dealerNum++;
        if(this.topPorkersModel.length > 3){
            this.dealingInterval = setTimeout(this.dealingPorker.bind(this, cards), 40);//40毫秒
        }else{
            this.toRobLord();
        }
    }
    toRobLord(){
        console.log("currentRobSeatNo:", this.landLordManager.currentRobSeatNo);
        let currentRobSeatNo = this.landLordManager.currentRobSeatNo;
        this.selfClock.visible = currentRobSeatNo == this.landLordManager.seatNo;
        this.rightClock.visible = currentRobSeatNo == this.landLordManager.preSeatNo;
        this.leftClock.visible = currentRobSeatNo == this.landLordManager.nextSeatNo;
        if(currentRobSeatNo == this.landLordManager.seatNo){
            this.robLandLord();
        }else{
            this.btnPanel.visible = false;
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
        this.landLordManager.robLandReq(object, this.robLandLordCallback.bind(this));
    }
    robLandLordCallback(robLandRsp){
    }
    setPlayerRobScore(seatNo, score){
        console.log("seatNo:",seatNo,"叫:",score);
        let text = score ? score+"分" : "不叫";
        if(seatNo == this.landLordManager.preSeatNo){
            this.rightScoreLabel.setText(text).visible = true;
        }else if(seatNo == this.landLordManager.nextSeatNo){
            this.leftScoreLabel.setText(text).visible = true;
        }else {
            this.selfScoreLabel.setText(text).visible = true;
        }
    }
    setPlayCardInfo(prePlayerCardSeatNo, cards){
        cards = cards || [];
        if(cards.length){
            this.landLordManager.roundWinSeatNo = prePlayerCardSeatNo;
        }

        let pokersModel  = null;
        let selfHandPorkersModel =null;
        if(prePlayerCardSeatNo == this.landLordManager.preSeatNo){
            pokersModel = this.rightPlayPorkersModel;
            this.rightHandPorkersModel.pokers.splice(0, cards.length);
        }else if(prePlayerCardSeatNo == this.landLordManager.nextSeatNo){
            pokersModel = this.leftPlayPorkersModel;
            this.leftHandPorkersModel.pokers.splice(0, cards.length);
        }else {
            pokersModel = this.selfPlayPorkersModel;
            selfHandPorkersModel = this.selfHandPorkersModel;
        }

        let arr = [];
        pokersModel.pokers = [];
        for (var index = 0; index < cards.length; index++) {
            var card = cards[index];
            var id = ZMFunction.getCardIdByTypeAndVal(card.type, card.val);
            pokersModel.addPoker(new ZMPorker(id));
            arr.push(id);
        }
        if(selfHandPorkersModel) selfHandPorkersModel.removePokerByIds(arr);
    }
    toPlay(){
        this.btnPanel.clearControls();
        this.leftClock.visible = this.landLordManager.currentDealSeatNo == this.landLordManager.nextSeatNo;
        this.rightClock.visible = this.landLordManager.currentDealSeatNo == this.landLordManager.preSeatNo;
        this.selfClock.visible = this.landLordManager.currentDealSeatNo == this.landLordManager.seatNo;

        if(this.landLordManager.currentDealSeatNo == this.landLordManager.preSeatNo){//上家出牌
            this.btnPanel.visible = false;
            this.selfHandPorkerPane.toSelectPoker = false;
        }else if(this.landLordManager.currentDealSeatNo == this.landLordManager.nextSeatNo){//下家出牌
            this.btnPanel.visible = false;
            this.selfHandPorkerPane.toSelectPoker = false;
        }else{//自己出牌
            var btn2 = new ZMButton(pos(this.btnPanel.width/2 - 55, this.btnPanel.height/2),{width:100,height:50}).setText("出牌").setBGImage(ZMResourceData.Images.btn).setTag(2).setAnchorPoint({x:0.5,y:0.5});
            btn2.onClick = this.onClickPlayBtn.bind(this, btn2);
            this.btnPanel.addControlInLast([btn2]);
            if(this.landLordManager.lastDealSeatNo
            &&this.landLordManager.lastDealSeatNo != this.landLordManager.seatNo
            &&(this.landLordManager.roundWinSeatNo && this.landLordManager.roundWinSeatNo != this.landLordManager.seatNo)){//不是第一个出牌
                var btn1 = new ZMButton(pos(this.btnPanel.width/2 + 55, this.btnPanel.height/2),{width:100,height:50}).setText("不出").setBGImage(ZMResourceData.Images.btn).setTag(1).setAnchorPoint({x:0.5,y:0.5});
                btn1.onClick = this.onClickPlayBtn.bind(this, btn1);
                this.btnPanel.addControlInLast([btn1]);
            }else {
                btn2.setRelativePosition(pos(this.btnPanel.width/2, this.btnPanel.height/2))
            }
            this.btnPanel.visible = true;
            this.selfHandPorkerPane.toSelectPoker = true;
        }
        this.landLordManager.lastDealSeatNo = this.landLordManager.currentDealSeatNo;
    }
    onClickPlayBtn(btn){
        var tag = btn.getTag();
        var cards = [];
        if(tag == 1){//不出牌
        } else if(tag == 2){//出牌
            var selectedPorkers = this.selfHandPorkersModel.getSelectedPokers();
            for (var index = 0; index < selectedPorkers.length; index++){
                var id = selectedPorkers[index].imageData.id;
                cards.push(ZMFunction.getPbCardInfoByCardId(id));
            }
        }
        this.landLordManager.playCardReq({cards}, this.playCardCallback.bind(this))
    }
    /**
     * 重新开始
     * @param isStart  是否立即开始
     */
    reStartGameWithIsStart(isStart){
        this.setupInitialStatus();
        if(isStart){
            this.onClickReadyBtn();
        }else {
            this.setReadyBtn();
        }
    }

    playCardCallback(playCardRsp){
    }
}