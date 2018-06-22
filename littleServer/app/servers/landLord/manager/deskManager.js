/**
 * Created by zhangmiao on 2018/5/23.
 */
var Desk = require("../model/desk");

var DeskManager = function(app, opts){
    this.opts = opts;
    this.app = app;

    this.desks = {};
    this.currentNo = 0;
};

var pro = DeskManager.prototype;

pro.playerJoin = function(player){
    var self = this;
    if(self.size() === 0){//没有任何桌子
        self.create(player);
    }else {
        //todo 这里是否要检测该用户是否处于正常状态
        for (var tb in self.desks){
            if (self.desks[tb].size() < 3){
                for (var p in self.desks[tb].seats){
                    if(!self.desks[tb].seats[p]){
                        self.desks[tb].seats[p] = player;
                        player.seatNo = p;
                        break;
                    }
                }
                player.deskNo = tb;
                break;
            }
        }
        if (!player.deskNo){
            self.create(player);
        }
    }
};

pro.getDeskByNo = function(deskNo){
    return this.desks[deskNo];
};

pro.deskInfo = function(player){
    return this.desks[player.deskNo].seats;
};


pro.removePlayer = function(player){
    var deskPlayer = this.desks[player.deskNo].seats[player.seatNo];
    if(deskPlayer.uid == player.uid){
        this.desks[player.deskNo].seats = null;
    }
};



pro.create = function(player){
    var self = this,
        deskNo = 'tb' + (++self.currentNo),
        seatNo = 'p1';
    self.desks[deskNo] = new Desk(deskNo);
    player.deskNo = deskNo;
    player.seatNo = seatNo;
    self.desks[deskNo].seats[seatNo] = player;
};

/**
 * 下一位玩家的座位
 * @param seatNo
 */
pro.nextSeatNo = function(seatNo){
    if(seatNo === 'p1'){
        return 'p2';
    } else if (seatNo === 'p2'){
        return 'p3';
    } else {
        return 'p1';
    }
};

pro.deleteDesk = function(deskNo){
    delete  this.desks[deskNo];
};


pro.size = function(){
    var size = 0;
    for (var i in this.desks){
        if (this.desks.hasOwnProperty(i)){
            size ++;
        }
    }
    return size;
};

module.exports = DeskManager;