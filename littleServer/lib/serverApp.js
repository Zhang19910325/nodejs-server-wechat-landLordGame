/**
 * Created by zhangmiao on 2018/4/27.
 */

var  Application = require("./application");
var  ServerApp = module.exports = {};
var  Package = require("../package");
var  fs = require("fs");
var  Path = require("path");

var self = this;

ServerApp.createApp = function(opts){
    var app = new Application(opts);
    self.app = app;
    return app;
};

ServerApp.version = Package.version;

ServerApp.components = {};


Object.defineProperty(ServerApp, 'app', {
    get : function(){
        return self.app;
    }
});

fs.readdirSync(__dirname+"/components").forEach(function(filename){
   if(!/\.js$/.test(filename)) return;//过滤不是js的文件
    var name = Path.basename(filename, '.js');
    var _load = load.bind(null,"./components/",name);

    ServerApp.components.__defineGetter__(name, _load);//绑定在components上
    ServerApp.__defineGetter__(name, _load);//绑定在自己身上
});


function load(path, name){
    if(name){
        return require(path+name);
    }
    return require(path);
}