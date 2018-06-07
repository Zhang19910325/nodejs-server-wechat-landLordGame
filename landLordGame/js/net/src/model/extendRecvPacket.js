/**
 * Created by zhangmiao on 2018/3/31.
 */




var util = require('../util/util');

var ExtendRecvPacket = function (webSocketPacket, headerLenSize){
    headerLenSize = headerLenSize || 1;//包头长定义的字节数,默认一个字节(255)就可以了,对于特别长的包头可以自定义字节数,无符号
    //这样写详细
    this.data = webSocketPacket.data;
    this.reader = webSocketPacket.reader;
    this.pduLen = webSocketPacket.pduLen;

    if (this.pduLen != this.data.length){
        console.log("ExtendPacket 收到了一个包长不符的包")
    }
    //util.merge(this, webSocketPacket);//合并webSocketPacket所有的属性和方法
    /**
     * 接下来是初始化的一些方法,涉及到包头的一些定义
     */
    this.headerLen = undefined;
    //初始化包头长
    if(headerLenSize == 1){this.headerLen = this.reader.read();
    }else if(headerLenSize == 2){
        this.headerLen = this.reader.uint16();
    }

    //    _____________________________________
    //    |______|_______|________|___________|
    //      包长    包头长   包头配置    bodyData

    this.version = this.reader.read();//协议版本,此版本表示解析包头解析方式,以便后续扩展
    this.packetValied = true;
    if (this.version == 1){
        packetVersion1.call(this);
    }else{
        this.packetValied = false;
    }
    this.bodyData = this.data.slice(this.headerLen);
};


function packetVersion1 (){
    this.cmd = this.reader.uint32();
    this.uin = this.reader.uint64();
    this.seq = this.reader.uint32();
}

module.exports = ExtendRecvPacket;