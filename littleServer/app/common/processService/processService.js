/**
 * Created by zhangmiao on 2018/5/24.
 */

var ProcessService = function(app, opts){
    this.app = app;
    this.opts = opts;

    this.processors = [];
};

module.exports = ProcessService;

var pro = ProcessService.prototype;


pro.addProcessor = function(processor){
    this.processors.push(processor);
};

pro.handleProcessorsPacket = function(packet, session, next){
    var toNext = true;
    for (var i = 0; toNext && i<this.processors.length; i++){
        var processor = this.processors[i];
        toNext = processor.handleMessage(packet, session, next);
    }
    return toNext;
};