/**
 * Created by zhangmiao on 2018/4/27.
 */
var cp = require('child_process');
var os=require('os');
var util = require('util');
var starter = module.exports;
var Constants = require('../util/constants');
var cpus = {};
var env = Constants.RESERVED.ENV_DEV;

starter.runServers =  function(app){
    var server;
    var servers = app.getServersFromConfig();
    //逐一启动所有服务器
    for (var serverId in servers){
        if(!servers.hasOwnProperty(serverId)) continue;
        server = servers[serverId];
        this.run(app, server);
    }
};

starter.run = function(app, server, cb){
    env = app.get(Constants.RESERVED.ENV);
    var cmd, key;
    var options = [];
    cmd = app.get(Constants.RESERVED.MAIN);
    options.push(cmd);
    options.push(util.format('env=%s',  env));

    for(key in server) {
        if(key === Constants.RESERVED.CPU) {
            cpus[server.id] = server[key];
        }
        options.push(util.format('%s=%s', key, server[key]));
    }
    starter.localrun(process.execPath, null, options, cb);

};


starter.localrun = function (cmd, host, options, callback) {
    console.log('Executing ' + cmd + ' ' + options + ' locally');
    spawnProcess(cmd, host, options, callback);
};

var spawnProcess = function(command, host, options, cb) {
    var child = cp.spawn(command, options);
    var prefix = '';

    child.stderr.on('data', function (chunk) {
        var msg = chunk.toString();
        process.stderr.write(msg);
        if(!!cb) {
            cb(msg);
        }
    });

    child.stdout.on('data', function (chunk) {
        var msg = prefix + chunk.toString();
        process.stdout.write(msg);
    });

    child.on('exit', function (code) {
        if(code !== 0) {
            console.log('child process exit with error, error code: %s, executed command: %s', code,  command);
        }
        if (typeof cb === 'function') {
            cb(code === 0 ? null : code);
        }
    });
};