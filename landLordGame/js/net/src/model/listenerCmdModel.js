/**
 * Created by zhangmiao on 2018/4/2.
 */


var ListenerCmdModel = function(){

};
ListenerCmdModel.prototype.addListener = function(cmd , key, fn){
    var listenerMap = this.getListenerMap(cmd);
    listenerMap[key+""] = fn;
};

ListenerCmdModel.prototype.removeListener = function(cmd, key){
    var listenerMap = this.getListenerMap(cmd);
    delete listenerMap[key+""];//删除掉这个属性
}

ListenerCmdModel.prototype.getListenerMap = function(cmd){
    if(!this[cmd+""]){
        this[cmd+""] = {};
    }
    return this[cmd+""];
};


module.exports = ListenerCmdModel;