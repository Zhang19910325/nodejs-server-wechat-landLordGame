/**
 * Created by zhangmiao on 2018/6/28.
 */

import ZMClass from "../../base/zmClass"
import ZMFunction from "../../common/zmFunction"
import ZMLabel from "../../components/zmLabel"
import ZMButton from "../../components/zmButton"
import ZMResourceData from "../../common/zmResourceData"
import ZMColor from "../../common/zmColor"
import LandLordManager from "./landLordManager"


import LandLordPlayingScene from "./landLordPlayingScene"

let QuickStartGame = 1;
export default class LandLordScene extends ZMClass{
    functionList = [{
        id : QuickStartGame,
        name : "快速开始游戏"
    }];
    constructor(size){
        super({x:0, y:0}, size);
        JMain.landLordManager = new LandLordManager();
        this.landLordManager = JMain.landLordManager;
        this.userInfo = null;
        this.initUI();
        this.addObserver();
    }
    addObserver(){
        ZMNotificationCenter.addObserver(this, this.handleHandShakeNty.bind(this), "onHandShakeNty");
    }
    handleHandShakeNty(){
        this.userInfo && this.joinGame();//断线重连的逻辑保证
    }
    initUI() {
        let self = this;
        //头像
        let avatar = new ZMClass({x:20,y:20},{width:50, height:50});
        avatar.radius = 25;
        //名字
        let nameLabel = new ZMLabel({x:20, y:80}, "").setFontColor(ZMColor.white);
        nameLabel.textAlign = "left";
        //游戏列表label
        let functionListLabel = new ZMLabel({x:this.width/2 + 25, y:30}, "功能列表").setFontColor(ZMColor.white).setAnchorPoint({x:0.5,y:0}).setFontSize(24);

        this.addControlInLast([avatar, nameLabel, functionListLabel]);
        ZMFunction.promiseGetUserInfo().then(function(userInfo){
            self.userInfo = userInfo;
            let image = new Image(avatar.width, avatar.height);
            image.src = userInfo['avatarUrl'];
            avatar.setImage(image);
            nameLabel.setText(userInfo['nickName']);
            self.joinGame();
        });
    }
    setAllFunctionButton(){
        let self  = this;
        for (let  i = 0; i < self.functionList.length; i++){
            let fuc = self.functionList[i], w = 130, h = 30;
            let x = i%3 * (w+20) + 150;
            let y = Math.floor(i/3) * 40 + 80;
            let button = new ZMButton({x:x,y:y},{width:w,height:h}).setText(fuc.name).setBGImage(ZMResourceData.Images.btn);
            button.radius = 4;
            button.fuc = fuc;
            button.onClick = self.funcButtonClick.bind(self);
            this.addControlInLast([button]);
        }
    }
    funcButtonClick(button){
        let self = this;
        let fuc = button.fuc;
        let id = fuc.id;
        let parent = this.parent;
        console.log("点击斗地主功能:",fuc.name);
        if(QuickStartGame == id){
            let landLordPlayingScene = new LandLordPlayingScene(parent.size);
            parent.addControlInLast([landLordPlayingScene]);
        }
        else {

        }
        self.visible = false;
    }
    joinGame(){
        let self = this;
        var object = {
            name: this.userInfo['nickName'],
            avatarUrl: this.userInfo['avatarUrl']
        };

        this.landLordManager.joinGameReq(object,self.handleJoinGameCallback.bind(self));
    }
    handleJoinGameCallback(joinGameRspObj){
        //console
        if(joinGameRspObj.rspHead && joinGameRspObj.rspHead.code){
            console.log("收到加入游戏错误码");
        }else{

        }
        this.setAllFunctionButton();
    }
}