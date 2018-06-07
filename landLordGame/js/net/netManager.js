/**
 * Created by zhangmiao on 2018/4/2.
 * 1、断连后,每隔30秒检测网络是否连接,如果不是连接则自动重连
 * 2、网络切换时，如果当时链接存在则链接
 */
var WebSocketCore = require("./src/webSocket/webSocketCore");

var intervalIdTime = 10;
var loopIntervalIdTime = 30;

var NetManager = function(netService){
    this.networkType = undefined;
    this.intervalId = undefined;
    this.loopIntervalId = undefined;//
    this.netService = netService;
    this.connectSuccess = undefined;
    this.hadStart = undefined;
    //这里其实判断是不是用户需要主动断开的链接
    this.isClose = function(){
        return !!netService.needClose;
    };
    init.call(this);
};


var init = function(){
    var that = this;
    wx.getNetworkType({
        success: function(res) {
            // 返回网络类型, 有效值：
            // wifi/2g/3g/4g/unknown(Android下不常见的网络类型)/none(无网络)
            that.networkType = res.networkType
        }
    });

    wx.onNetworkStatusChange(function(res) {
        that.networkType = res.networkType;
        that.onNetworkStatusChange(res.isConnected);
    });
};

NetManager.prototype.onNetworkStatusChange=function(isConnected){
    //首先需要清楚掉延迟的链接
    this.clearInterval();
    if(isConnected){//当前处于链接状态
        this.connectWebSocket();
    } else {//当前不处于链接状态
        if(this.networkType != 'none'){
            this.startIntervalId();
        }
    }

};

NetManager.prototype.connectWebSocket = function(){
    this.stopIntervalId();
    this.stopLoopIntervalId();
    if(this.isClose()) return;//如果外界以及要求断开链接则不必进行下一步
    console.log("自动重连");
    this.netService.connect();

    this.startLoopIntervalId();
};


NetManager.prototype.start = function () {
    console.log("底层开始自动建立长链接，检测有无网络情况");
    if(!this.netService || this.hadStart) return;
    this.hadStart = true;
    var that = this;
    this.netService.addOnConnectedCallback("__netManager", function(){
        that._onConnectSuccess();
    });
    this.netService.addOnCloseCallback("__netManager",function(){
        that._onClose();
    });
};


NetManager.prototype.stop = function () {
    this.hadStart = false;
    if(this.netService){
        this.netService.removeOnCloseCallbackMap("__netManager");
        this.netService.removeOnConnectedCallback("__netManager");
    }
};


NetManager.prototype._onConnectSuccess = function(){
    this.stopIntervalId();
    this.stopLoopIntervalId();
};

NetManager.prototype._onClose = function (){
    if(!this.isClose())
        this.startLoopIntervalId();
};


NetManager.prototype.startIntervalId =function(){
    if (this.intervalId != undefined){
        clearInterval(this.intervalId);
    }
    var that = this;
    this.intervalId = setInterval(function(){
        that.connectWebSocket();
        that.stopIntervalId();
    }, intervalIdTime * 1000);
};

NetManager.prototype.stopIntervalId =function(){
    if(this.intervalId){
        clearInterval(this.intervalId);
    }
    this.intervalId = undefined;
};

NetManager.prototype.startLoopIntervalId=function(){
    if(this.loopIntervalId != undefined){
        clearInterval(this.loopIntervalId);
    }
    var that = this;
    this.loopIntervalId = setInterval(function(){
        that.connectWebSocket();
    }, loopIntervalIdTime * 1000);
};

NetManager.prototype.stopLoopIntervalId=function(){
    if(this.loopIntervalId){
        clearInterval(this.loopIntervalId);
    }
    this.loopIntervalId = undefined;
};

module.exports = NetManager;