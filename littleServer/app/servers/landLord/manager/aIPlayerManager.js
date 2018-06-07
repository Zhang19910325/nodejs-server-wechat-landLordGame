/**
 * Created by zhangmiao on 2018/6/5.
 */
var Player = require("../model/player");
var Long = require("long");
var curAIUid = 1; //当前Ai机器人的Uid

var AIPlayerManager = function(app, opts){
    //ai机器人管理类，用来生产机器人
    this.app = app;
    this.opts = opts || {};
    this.aiMap = {}; // uid -> player;

};

AIPlayerManager.prototype.createNewAIPlayer = function(){
    //创建一个ai机器人
    var player = new Player("我是AI机器人"+curAIUid+"号",null, Long.fromValue(curAIUid++));
    player.isAI = true;
    var uid = player.uid;
    var uidString;
    if (typeof uid === "number" || typeof uid === "string"){
        uidString = uid + "";
    } else {
        uidString = uid.toString();
    }
    this.aiMap[uidString] = player;
    return player;
};

AIPlayerManager.prototype.getPlayerInfoByUid = function(uid){
    var uidString;
    if (typeof uid === "number" || typeof uid === "string"){
        uidString = uid + "";
    } else {
        uidString = uid.toString();
    }
    return this.aiMap[uidString];
};



module.exports = AIPlayerManager;


