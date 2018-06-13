/**
 * Created by zhangmiao on 2018/5/8.
 */

var path = require('path');
var pathUtil = module.exports;
var Constants = require("./constants");
var fs = require('fs');



pathUtil.getSysRemotePbPath = function(){
    var p = path.join(__dirname, '/../common/protocolBuffer/commonRpcService_grpc_pb.js');
    return fs.existsSync(p) ? p : null;
};

pathUtil.getRouteRemotePath =function(){
    var p = path.join(__dirname, '/../common/remote/route/routeRemote.js');
    return fs.existsSync(p) ? p : null;
};

pathUtil.getHandlerPath = function(appBase, serverType) {
    var p = path.join(appBase, '/app/servers/', serverType, Constants.DIR.HANDLER);
    return fs.existsSync(p) ? p : null;
};


pathUtil.getHandlerDispatcherPath = function(appBase, serverType) {
    var p = path.join(appBase, '/app/servers/', serverType, Constants.FILEPATH.HANDLE_DISPATCHER);
    return fs.existsSync(p) ? p : null;
};
