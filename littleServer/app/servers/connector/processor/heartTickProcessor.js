/**
 * Created by zhangmiao on 2018/6/21.
 */
var BaseProcessor = require("../../../common/processService/baseProcessor.js").BaseProcessor;
var AppCommonPb = require("../../../pbMessage/appCommon_pb");
var utils = require("../../../../lib/util/utils");
var util = require("util");
var Long = require("long");

var checkHeartTime = 70;

var HeartTickProcessor = function(app, isProcess){
    BaseProcessor.call(this, app, isProcess);
    this.sidTimerMap = {};
};

util.inherits(HeartTickProcessor, BaseProcessor);

module.exports = HeartTickProcessor;


var pro = HeartTickProcessor.prototype;

pro.processRecvPacket = function(packet ,session, next){
    var self = this;
    var sid = session.id;
    if (session.name === 'Session') {//只处理client发过来消息
        if (this.sidTimerMap[sid] != undefined) clearTimeout(this.sidTimerMap[sid]);
        this.sidTimerMap[sid] = setTimeout(function () {
            var session = self.app.sessionService.get(sid);
            session && session.closed();
        }, checkHeartTime * 1000);
    }
    if (packet.cmd == AppCommonPb.Cmd.KHEARTTICKREQ){
        console.log("服务器收到了心跳包uid:", packet.uid,"sid:",sid);
    }
    if (packet.cmd == AppCommonPb.Cmd.KHANDSAKEREQ){
        session.on("closed", heartTickOnClose.bind(null, self, sid));
    }
    return packet.cmd != AppCommonPb.Cmd.KHEARTTICKREQ;
};

var heartTickOnClose = function(self, sid){
    if (self.sidTimerMap[sid] != undefined) clearTimeout(self.sidTimerMap[sid]);
    delete self.sidTimerMap[sid];//去除掉
};