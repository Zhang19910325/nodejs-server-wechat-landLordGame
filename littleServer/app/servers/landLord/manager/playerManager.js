/**
 * Created by zhangmiao on 2018/5/30.
 */

var Player = require("../model/player");
var Long = require("long");

var PlayerManager = function(app, opts){
    this.app = app;
    this.opts = opts;

    this.uidMap = {}; // uid -> player
};


var pro  = PlayerManager.prototype;

pro.getPlayerInfoByUid = function(uid){
    return this.uidMap[uid];
};
pro.createPlayer = function(name, session, uid){
    var player = new Player(name, session, uid);
    var uidString;
    if (typeof uid === "number" || typeof uid === "string"){
        uidString = uid + "";
    } else {
        uidString = uid.toString();
    }
    this.uidMap[uidString] = player;
    return player;
};

module.exports = PlayerManager;