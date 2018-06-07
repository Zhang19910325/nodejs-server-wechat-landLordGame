/**
 * Created by zhangmiao on 2018/4/2.
 * 用的时候最好将该类设置为单一实例，绑定到app上
 */


var ExtendSendPacket = require("./src/model/extendSendPacket");
var PacketModule = require("./src/packetModule");
var Listener = require("./src/model/listenerCmdModel");
var util = require("./src/util/util");
var NetManager = require("./netManager");
var NetHeartManager =require("./netHeartManager");

var NetService = function(uin){
    this.uin = uin;//必须以uin为基础初始化对象

    this.packetModule = new PacketModule();

    this.currentUrl = undefined;
    this.sendMsgQueue = [];
    this.netManager = new NetManager(this);
    this.netHeartManager = new  NetHeartManager(this);
    this.intervalId = undefined;
    this.needClose = undefined;
    /**
     * 连接建立成功时的回调map集合
     * @type {{}}
     */
    this.onConnectCallbackMap = {};
    /**
     * 连接断开时的回调map集合
     * @type {{}}
     */
    this.onCloseCallbackMap = {};
    /**
     * 监听到特定cmd时的回调map集合
     * @type {{}}
     */
    //this.onRecvCmdCallMap = {};
    this.listener = new Listener();

    //初始化seq并获得其方法
    this.getNewSeq = (function(){
        var seq = Math.round(Math.random() * 1000);
        return function (){
            seq++;
            seq = seq % 100000000;
            return seq;
        }
    })();

    init.call(this);
};

/**
 * 连接被打开回调
 */
function onSocketOpen(){
    //开始发送堆积的包,并且停掉超时检测
    this.sendAllMsgQueue();
    this.exeOnSocketOpenMap();
    this.netHeartManager.start();
}

/**
 * 连接关闭回调
 */
function onSocketClose(){
    this.exeOnSocketCloseMap();
    this.netHeartManager.stop();
}

/**
 * 收到底层传上来的包回调
 * @param recvPacket
 */
function onReceivePacketCallback(recvPacket){
    console.log("recvPacket:",recvPacket);
    //这里需要执行监听的命令值
    var map = this.listener.getListenerMap(recvPacket.cmd);
    for (var keys = Object.keys(map), i = 0; i < keys.length; ++i) {
        var item = map[keys[i]];
        if (typeof item == "function") {
            util.aSync(item,null,recvPacket, keys[i]);
        }
    }
}

function init(){
    var that = this;
    this.packetModule.onSocketOpen(function(){
        onSocketOpen.call(that);
    });

    this.packetModule.onSocketClose(function(){
        onSocketClose.call(that);
    });

    this.packetModule.onReceivePacketCallback(function(recvPacket){
        onReceivePacketCallback.call(that, recvPacket);
    })

    this.getConnectStatus = function(){
        return this.packetModule.getConnectStatus();
    }
}

NetService.prototype.addOnConnectedCallback = function (key, fn){
    if (this.onConnectCallbackMap[key]){
        console.log('onConnectCallback 当心key:'+key+"已经添加过连接监听 现在会被覆盖掉")
    }
    this.onConnectCallbackMap[key] = fn;
};

NetService.prototype.removeOnConnectedCallback = function(key){
    delete this.onConnectCallbackMap[key];
};

NetService.prototype.addOnCloseCallback = function(key, fn){
    if (this.onCloseCallbackMap[key]){
        console.log('onCloseCallbackMap 当心key:'+key+"已经添加过连接监听 现在会被覆盖掉")
    }
    this.onCloseCallbackMap[key] = fn;
};

NetService.prototype.removeOnCloseCallbackMap = function(key){
    delete this.onCloseCallbackMap[key];
};

NetService.prototype.addListenerCmd = function(cmd, key, fn){
    this.listener.addListener(cmd, key, fn);
};

NetService.prototype.removeListenerCmd = function(cmd, key){
    this.listener.removeListener(cmd, key);
}

NetService.prototype.connect = function(obj, force){
    obj = obj || {};
    var url  = obj["url"];
    this.currentUrl = url =  url || this.currentUrl;
    var success  = obj["success"];
    var fail  = obj["fail"];
    var complete  = obj["complete"];
    if(force || !this.packetModule.isConnected()){
        if(!this.currentUrl) {
            console.error("没有找到需要链接的url");
            return;
        }
        this.needClose = false;
        this.packetModule.connect(this.currentUrl, success, fail, complete);
        this.netManager.start();
    }
};

/**
 * 断开webSocket连接 如果clear为YES，清除当前记录的url，如果为false不清除
 * @param clear
 */
NetService.prototype.close = function(clear){
    this.needClose = true;
    if(clear){
        this.currentUrl = undefined;
    }
    this.packetModule.close();
};

NetService.prototype.sendAllMsgQueue = function (){
    var that = this;
    this.sendMsgQueue.forEach(function(sendPacket){
        that.packetModule.sendPacket(sendPacket);
    });
    this.sendMsgQueue = [];
};

function exeOnSocketMap (map) {
    for (var keys = Object.keys(map), i = 0; i < keys.length; ++i) {
        var item = map[keys[i]];
        if (typeof item == "function") {
            util.aSync(item,null,keys[i]);
        }
    }
}


//todo 这个要测测记住了
NetService.prototype.exeOnSocketOpenMap =function(){
    exeOnSocketMap(this.onConnectCallbackMap);
} ;

//todo 这个要测测记住了
NetService.prototype.exeOnSocketCloseMap = function(){
    exeOnSocketMap(this.onCloseCallbackMap);
}


NetService.prototype.getPacket = function(bodyData,cmd,success,fail){
    var extendSendPacket = new ExtendSendPacket();//包头长这里选取默认的值
    var seq = this.getNewSeq();
    var version = 0x1;
    var uin = this.uin;
    var options = null;

    return extendSendPacket.fromJson({
        version     : version,
        cmd         : cmd,
        uin         : uin,
        seq         : seq,
        options     : options,
        bodyData    : bodyData,
        success     : success,
        fail        : fail
    });

};

NetService.prototype.sendData = function(sendObject){
    var bodyData = sendObject["data"];
    var cmd      = sendObject["cmd"];
    var success  = sendObject["success"];
    var fail     = sendObject["fail"];

    var  packet = this.getPacket(bodyData,cmd,success,fail);

    if (this.packetModule.isConnected()) {
        this.packetModule.sendPacket(packet);
        this.netHeartManager.skipHeart();
    }else{
        this.pushDisConnectedMsg(packet);
    }

    return packet;
};

NetService.prototype.checkTimeOutPacket =function (){
    var currentTime = Date.now();
    var removePacketArr= []//记录超时需要删除的Packet
    var that = this;
    this.sendMsgQueue.forEach(function(sendPacket){
        var sendTime = sendPacket.firstSendTime;
        var timeOut  = sendPacket.timeOut;
        if(currentTime > sendTime + timeOut * 1000){
            removePacketArr.push(sendPacket);
        }
    });
    removePacketArr.forEach(function(sendPacket){
        util.onTimeOut(sendPacket);
        that.removeMsgQueuePacket(sendPacket);
    });

    if(!removePacketArr.length) this.stopCheckTimeOut();
};


NetService.prototype.removeMsgQueuePacket = function(sendPacket){
    var index = this.sendMsgQueue.indexOf(sendPacket);
    if (index>-1){
        return this.sendMsgQueue.splice(index, 1);
    }
    return null;
};
NetService.prototype.pushDisConnectedMsg = function(packet){
    packet.firstSendTime = Date.now();
    this.sendMsgQueue.push(packet);
    this.startCheckTimeOut();
};


var  intervalLoop = function(netService){
    //执行check函数
    netService ? netService.checkTimeOutPacket() : null;
};


NetService.prototype.startCheckTimeOut = function(){
    if(!this.intervalId){
        this.intervalId = util.setInterval(intervalLoop, 3000, this);
    }
};

NetService.prototype.stopCheckTimeOut = function (){
    if(this.intervalId){
        clearInterval(this.intervalId);
        this.intervalId = undefined;
    }
};

module.exports = NetService;