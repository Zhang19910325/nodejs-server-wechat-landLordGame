/**
 * Created by zhangmiao on 2018/5/8.
 */

var crc = require("crc");
var utils = require("../../util/utils");


var defRoute = function(client, serverType, msg, cb) {
    var servers = client.station.serversMap[serverType];
    if(!servers || !servers.length) {
        utils.invokeCallback(cb, new Error('rpc servers not exist with serverType: ' + serverType));
        return;
    }
    //var index = Math.floor(Math.random() * servers.length);
    var uid = msg ? (msg.uid || msg.uin || '') : '';
    var index = Math.abs(crc.crc32(uid.toString())) % servers.length;//根据uid去路由
    utils.invokeCallback(cb, null, servers[index]);
};

module.exports = {
    def : defRoute
};