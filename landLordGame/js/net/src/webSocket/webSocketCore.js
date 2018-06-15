/**
 * Created by zhangmiao on 2018/3/29.
 */

var util = require('../util/util');
var SocketRecvPacket = require('../model/socketRecvPacket');
var SocketSendPacket = require('../model/socketSendPacket');
var Reader = require('../reader');

function WebSocketCore () {
    /**
     * 需要连接的url
     * @type {string}
     */
    this.url = undefined;




    /**
     * 包长字节数,默认为2个字节 ,只支持2 和 4
     * @type {number}
     * @private
     */
    this._pduLenByteSize = 2;

    ///**
    // * 包头长字节数,默认为1个字节
    // * @type {number}
    // * @private
    // */
    //this._headerLenByteSize = 1;

    /**
     * 连接建立成功时的回调
     * @type {Function}
     */
    this.onSocketOpen = null;


    /**
     * 连接断开时的回调
     * @type {null}
     */
    this.onSocketClose = null;
    /**
     * 收到的缓存数据,出现半包的时候用到
     * @type {Uint8Array}
     * @private
     */
    this._hasReceviedCacheMutaData = null;


    /**
     * 收到包的监听回调
     * @type {Function}
     */
    this.onRecievePacket_fn = null;

    /**
     * 是否处于链接状态
     * @type {boolean}
     */
    this.isConnected = false;


    this.currentConnectStatus = connectStatus.disconnected;
    //start.call(this);//开始bind微信webSocket各种监听
}

var connectStatus = {
    connecting : 1,
    connected  : 2,
    disconnecting : 3,
    disconnected : 4
}
//定义网络每句类型
WebSocketCore.connectStatus  = connectStatus;

WebSocketCore.prototype.connectStatus = WebSocketCore.connectStatus;

function start(){
    var that = this;
    //进行一些初始化的操作
    this.isConnected = false;
    this.currentConnectStatus = connectStatus.disconnected;
    this._hasReceviedCacheMutaData = null;
    //连接关闭 监听
    wx.onSocketClose(function (){
        console.log("连接关闭了");
        that.currentConnectStatus = connectStatus.disconnected;
        that.onSocketClose  && that.onSocketClose();
        that.isConnected = false;
    });
    //连接成功回调
    wx.onSocketOpen(function () {
        that.currentConnectStatus = connectStatus.connected;
        that.isConnected = true;
        that.onSocketOpen && that.onSocketOpen();
    });
    //接收到数据
    wx.onSocketMessage(function (res) {
        console.log(res);
        var  recvData = util.arrayFrom(new Uint8Array(res.data));
        console.log('recvData:',recvData);
        console.log("webSocketCore 收到服务器数据, 长度:" + recvData.length);
        if(that._hasReceviedCacheMutaData && that._hasReceviedCacheMutaData.length > 0){
            that._hasReceviedCacheMutaData.concat(recvData);
            recvData = that._hasReceviedCacheMutaData;
            that._hasReceviedCacheMutaData = null;
        }
        if(recvData.length < that._pduLenByteSize){
            that._hasReceviedCacheMutaData = recvData;
        }else {
            proceesPacket.call(that, recvData);
        }
    });

}

function proceesPacket(data){
    if (!data || !data.length) return;//当data数据不存在，或者其长度是0时
    var dataLength = data.length;//整个包的长度
    var cursor = 0;
    var subDataLength = dataLength;//剩余包长度
    var subData;
    var i = 0;//单次解包次数，限定防止底层死循环，因为一般情况下，一次收包，就一次解包，防止连包
    while(cursor < dataLength && i <= 200){
        i++;
        subDataLength = dataLength - cursor;
        subData = data.slice(cursor, subDataLength);
        var pduLength = this.getPDULenWithData(subData);
        console.log("读取包头成功，pdu长度：" + pduLength + "当前包长度：" + subDataLength);

        if(pduLength == 0 && subData.length > this._pduLenByteSize){
            console.error("出现了一个错误包");
            disconnectAndReconnectAfterReceiveErrorData.call(this,subData);
        }

        if(pduLength > 0 && pduLength <= subDataLength){
             if(!(i == 1 && pduLength == dataLength)){
                 console.log("---需要拆包, 第[",i,"]个包, pdu长度:", pduLength,"当前包长度:[",subDataLength,"]");
             }
            var packetData = data.slice(cursor, cursor+pduLength);
            disPatchOnePacketInLogic.call(this, packetData);
        } else if (pduLength == 0 || pduLength > subDataLength){
            continueReceivePacket(data);
        }else{
            console.error("解包出现了错误")
        }

        cursor += pduLength;
    }
}

function continueReceivePacket(data){
    if (this._hasReceviedCacheMutaData){
        data = _hasReceviedCacheMutaData.concat(data);
    }
    this._hasReceviedCacheMutaData = data;
}


function disPatchOnePacketInLogic(packetData){
    //这里收到了包是一个完整的数据包
    var socketRecvPacket = new  SocketRecvPacket(packetData, this._pduLenByteSize);
    this.onRecievePacket_fn && this.onRecievePacket_fn(socketRecvPacket);
}

WebSocketCore.prototype.getPDULenWithData = function (data){
    if(data.length < this._pduLenByteSize){
        console.log("出现了一个包长字节不足最小字节:",this._pduLenByteSize,"可能是发生了半包现象");
        return 0;
    }
    var  reader = new Reader(data);
    if (this._pduLenByteSize == 2){
        return reader.uint16();
    }else{
        return reader.uint32();
    }
}

function disconnectAndReconnectAfterReceiveErrorData(){

}


WebSocketCore.prototype.connect = function connect (url, success, fail, complete){
    this.url = url;//存下来一遍查询和重连
    this.currentConnectStatus = connectStatus.connecting;
    console.log("WebSocketCore 请求建立连接","");
    wx.connectSocket({
        url: url,
        //method : "",请求方式
        success : success,
        fail : fail,
        complete : complete
    });
    start.call(this);
};

WebSocketCore.prototype.disconnect = function(){
    this.currentConnectStatus = connectStatus.disconnecting;
    wx.closeSocket();
};



WebSocketCore.prototype.onRecievePacket = function onRecievePacket(fn){
    this.onRecievePacket_fn = fn;
};

WebSocketCore.prototype.sendPacket = function (sendPacket){
    var socketSendPacket = new  SocketSendPacket(sendPacket, this._pduLenByteSize);
    var sendData = socketSendPacket.getData();
    console.log("底层发送Packet:",socketSendPacket);
    wx.sendSocketMessage({
        data : sendData
    });
};

module.exports = WebSocketCore;


