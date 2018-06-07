/**
 * Created by zhangmiao on 2018/5/7.
 */
var messages = require("../../protocolBuffer/commonRpcService_pb");
module.exports = function(app){
    return new Handler(app);
};


var Handler = function(app){
    this.app = app;
};

var handler = Handler.prototype;

handler.route = function(request, next){
    console.log("request:",request);
    var response = new messages.RouteResponse();
    response.setStatus(0);
    next(null, response);
};

