/**
 * Created by zhangmiao on 2018/5/7.
 */
var sequeue = require("seq-queue");

var manager = module.exports;

var queues = {};

manager.timeout = 3000;

manager.addTask = function(key, fn, ontimeout, timeout){
    var queue = queues[key];
    if(!queue){
        queue = sequeue.createQueue(manager.timeout);
        queues[key] = queue;
    }
    return queue.push(fn. ontimeout, timeout);
};


manager.closeQueue = function(key, force){
    if (!queues[key]){
        return;
    }
    queues[key].close(force);
    delete queues[key];
};