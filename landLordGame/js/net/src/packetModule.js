/**
 * Created by zhangmiao on 2018/3/30.
 */


var util = require("./util/util");
var WebSocketCore = require('./webSocket/webSocketCore');
var ExtendRecvPacket = require('./model/extendRecvPacket');

var  PacketModule = function (){
    this.sendPacketArr = [];
    this.intervalId = undefined;
    //var intervalId = setInterval(intervalLoop, 3000, this);
    /**
     *
     * @type {WebSocketCore}
     */
    this.currentWebsocket = null;

    /**
     *
     * @type {null}
     */
    this.recvPacketCallback = null;

    this.currentWebsocket = new WebSocketCore();
};


var  intervalLoop = function(packetModule){
    //执行check函数
    packetModule ? packetModule.checkTimeOutPacket() : null;
};

PacketModule.prototype.checkTimeOutPacket = function(){
    var currentTime = Date.now();
    var removePacketArr= []//记录超时需要删除的Packet
    var that = this;
    this.sendPacketArr.forEach(function(sendPacket){
        var sendTime = sendPacket.sendTime;
        var timeOut  = sendPacket.timeOut;
        if(currentTime > sendTime + timeOut * 1000){
            removePacketArr.push(sendPacket);
        }
    });
    removePacketArr.forEach(function(sendPacket){
        util.onTimeOut(sendPacket);
        that.removePacket(sendPacket);
    });

    if(!removePacketArr.length) this.stopCheckTimeOut();
};

PacketModule.prototype.removePacket = function(sendPacket){
    var index = this.sendPacketArr.indexOf(sendPacket);
    if (index>-1){
        return this.sendPacketArr.splice(index, 1);
    }
    return null;
};

PacketModule.prototype.isConnected = function(){
    return this.currentWebsocket.isConnected;
};


PacketModule.prototype.startCheckTimeOut = function(){
    if(!this.intervalId){
        this.intervalId = util.setInterval(intervalLoop, 3000, this);
    }
};

PacketModule.prototype.stopCheckTimeOut = function (){
    if(this.intervalId){
        clearInterval(this.intervalId);
        this.intervalId = undefined;
    }
}
//建立连接的时候丢弃掉原来老的webSocket吗?
PacketModule.prototype.connect = function (url, success, fail, complete){
    //if(!this.currentWebsocket)//没有实力初始化一个


    connectInit.call(this);
    this.currentWebsocket.connect(url, success, fail, complete);
};


PacketModule.prototype.close = function(){
    this.currentWebsocket.disconnect();
}

PacketModule.prototype.getConnectStatus = function(){
    return this.currentWebsocket.currentConnectStatus;
}

PacketModule.prototype.sendPacket = function (packet){
    //首先查看有米有success
    if(packet.success){
        packet.sendTime = Date.now();//写进当时的时间
        this.sendPacketArr.push(packet);
    }
    this.currentWebsocket.sendPacket(packet);
    this.startCheckTimeOut();
};



var onReceivePacket = function(socketRecvPacket){
    var extendRecvPacket = new ExtendRecvPacket(socketRecvPacket);
    var extendSendPacket = this.extendC2SPkgFromExtendS2CPkg(extendRecvPacket);//根据

    if(extendSendPacket){
        //执行extendSendPacket监听的回调
        util.aSync(function(){
            extendSendPacket.success && extendSendPacket.success(extendRecvPacket, extendSendPacket);
        })
    }
    //此时还要extendRecvPacket发送给监听应用层,以防有进一步监听
    if(typeof this.recvPacketCallback == "function"){
        this.recvPacketCallback(extendRecvPacket);
    }
};

PacketModule.prototype.onSocketOpen = function(fn){
    this.currentWebsocket && (this.currentWebsocket.onSocketOpen = fn);//将方法传递
};

PacketModule.prototype.onSocketClose = function (fn) {
    this.currentWebsocket && (this.currentWebsocket.onSocketClose = fn);
};

PacketModule.prototype.onReceivePacketCallback = function(fn){
    this.recvPacketCallback = fn;
};

PacketModule.prototype.extendC2SPkgFromExtendS2CPkg = function(extendRecvPacket){
    for (var  i = 0; i < this.sendPacketArr.length; i++){
        var sendPacket = this.sendPacketArr[i];
        if (sendPacket.seq == extendRecvPacket.seq){//首先检查回应的seq
            if(sendPacket.cmd+1 == extendRecvPacket.cmd){
                return this.sendPacketArr.splice(i,1)[0];
            }
        }
    }
};
function  connectInit(){
    //收包回调
    var  that = this;
    this.currentWebsocket.onRecievePacket(function (socketRecvPacket){
        //是直接抛给上层还是需要做一些处理
        onReceivePacket.call(that,socketRecvPacket);
    });
}

module.exports = PacketModule;