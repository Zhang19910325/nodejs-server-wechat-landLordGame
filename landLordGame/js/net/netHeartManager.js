/**
 * Created by zhangmiao on 2018/4/12.
 * 心跳包管理类
 */


var intervalIdTime = 10;
var NetHeartManager = function(netService){
    this.netService = netService;
    this.intervalId = undefined;
    this.isClose = function(){
        return !!netService.needClose;
    };
};


NetHeartManager.prototype.skipHeart = function(){
    this.startIntervalId();
};


NetHeartManager.prototype.start = function () {
    if(!this.netService) return;
    var that = this;
    that.startIntervalId();
    this.netService.addOnConnectedCallback("__netHeartManager", function(){
        that.startIntervalId();
    });
    this.netService.addOnCloseCallback("__netHeartManager",function(){
        that.stopIntervalId();
    });
};

NetHeartManager.prototype.stop = function () {
    this.stopIntervalId();
};


NetHeartManager.prototype.sendHeart = function(){
    //this.netService.sendData({
    //    cmd:0x1,
    //    success : function(recvPacket){
    //        console.log("收到的心跳包回包是个什么鬼:",recvPacket);
    //    }
    //});
};


NetHeartManager.prototype.startIntervalId =function(){
    if (this.intervalId != undefined){
        clearInterval(this.intervalId);
    }
    var that = this;
    this.intervalId = setInterval(function(){
        //发送一个心跳包
        if(that.isClose()) return; //如果现在处于断连状态就不发心跳包
        that.stopIntervalId();
        that.sendHeart();
    }, intervalIdTime * 1000);
};

NetHeartManager.prototype.stopIntervalId =function(){
    if(this.intervalId){
        clearInterval(this.intervalId);
    }
    this.intervalId = undefined;
};

module.exports = NetHeartManager;