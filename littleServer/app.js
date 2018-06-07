/**
 * Created by zhangmiao on 2018/4/27.
 */
var ServerApp = require("./lib/serverApp.js");

littleServerApp = ServerApp.createApp();

littleServerApp.set("name", "littleServer");

littleServerApp.start();

process.on("uncaughtException", function(err){
   console.error(' Caught exception: ' + err.stack);
});