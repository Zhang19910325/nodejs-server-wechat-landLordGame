/**
 * Created by zhangmiao on 2018/3/29.
 */

var  util = require('../util/util');
var Reader = require('../reader');


var  SocketRecvPacket = function(data,pduLenSize){

    pduLenSize = pduLenSize || 2;
    /**
     * 8位的数据
     * @type {Array}
     */
    this.data = util.arrayFrom(data);

    /**
     * 数据读取reader
     * @type {Reader}
     */
    this.reader = new Reader(data);


    /**
     * 整个数据包长度 包含自己
     * @type {number}
     */
    this.pduLen = pduLenSize == 2 ? this.reader.uint16() : this.reader.uint32();

    init.call(this);
};


function init(){
    //好像没什么可以做
}

module.exports = SocketRecvPacket;

