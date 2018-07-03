/**
 * Created by zhangmiao on 2018/6/27.
 * 主场景类
 */
import ZMClass from "../../base/zmClass"
import ZMFunction from "../../common/zmFunction"
import ZMLabel from "../../components/zmLabel"
import ZMButton from "../../components/zmButton"
import ZMResourceData from "../../common/zmResourceData"
import ZMColor from "../../common/zmColor"


import LandLordScene from "../landLord/landLordScene"



export default class MainScene extends ZMClass{
    constructor(size){
        super({x:0, y:0}, size);
        this.initUI();
    }
    initUI(){
        //头像
        let avatar = new ZMClass({x:20,y:20},{width:50, height:50});
        avatar.radius = 25;
        //名字
        let nameLabel = new ZMLabel({x:20, y:80}, "").setFontColor(ZMColor.white);
        nameLabel.textAlign = "left";
        //游戏列表label
        let gameListLabel = new ZMLabel({x:this.width/2 + 25, y:30}, "游戏列表").setFontColor(ZMColor.white).setAnchorPoint({x:0.5,y:0}).setFontSize(24);

        this.addControlInLast([avatar, nameLabel, gameListLabel]);
        this.setAllGameButton();
        ZMFunction.promiseGetUserInfo().then(function(userInfo){
            JMain.userInfo = userInfo;
            let image = new Image(avatar.width, avatar.height);
            image.src = userInfo['avatarUrl'];
            avatar.setImage(image);

            nameLabel.setText(userInfo['nickName']);
        });

    }
    setAllGameButton(){
        let self  = this;
        let games = GameConfig.games;
        for (let  i = 0; i < games.length; i++){
            let game = games[i], w = 130, h = 30;
            let x = i%3 * (w+20) + 150;
            let y = Math.floor(i/3) * 40 + 80;
            let button = new ZMButton({x:x,y:y},{width:w,height:h}).setText(game.name).setBGImage(ZMResourceData.Images.btn);//.setBGColor(ZMColor.white);
            button.radius = 4;
            button.game = game;
            button.onClick = self.gameButtonClick.bind(self);
            this.addControlInLast([button]);
        }
    }
    gameButtonClick(button){
        let self = this;
        let game = button.game;
        let name = game.name;
        let id = game.id;
        let parent = this.parent;
        console.log("开始执行:",name);
        if(id == GameConfig.LandLord){
            let landLordScene = new LandLordScene(parent.size);
            parent.addControlInLast([landLordScene]);
        }
        else{
            console.log("目前还未实现:",name);
        }
        self.visible = false;
    }


}