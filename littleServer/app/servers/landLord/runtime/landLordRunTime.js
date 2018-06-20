/**
 * Created by zhangmiao on 2018/6/18.
 */

var DeskManager = require("../manager/deskManager"); //桌子管理
var AIPlayerManager = require("../manager/aIPlayerManager"); // AI 机器人管理
var PlayerManager = require("../manager/playerManager");// 真实用户玩家管理
var CardManager = require("../manager/cardManager"); // 牌管理

var LandLordRunTime = function(app){
    this.deskManager = new DeskManager(app);
    this.aIPlayerManager = new AIPlayerManager(app);
    this.playerManager = new PlayerManager(app);
    this.cardManager = new CardManager(app);
};


LandLordRunTime.getLandLordRunTime = function(app){
    if(!app.get("landLordRunTime")){
        var landLordRunTime = new LandLordRunTime(app);
        app.set("landLordRunTime", landLordRunTime, true);
    }
    return app.get("landLordRunTime");
};

module.exports = LandLordRunTime;
