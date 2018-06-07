/**
 * Created by zhangmiao on 2018/6/4.
 * 手牌模型
 */

export default class ZMPokersModel {
    pokers = [];//{Array<ZMPoker>}牌数组
    constructor(){
        //需要做什么事吗
    }
    addPoker(poker){
        this.pokers.push(poker);
    }
    removePokerByIndex(index){
        this.pokers.splice(index, 1);
    }

    /**
     *
     * @param ids {Array}
     */
    removePokerByIds(ids){
        for (var index = this.pokers.length - 1; index >= 0; index--){
            var porker = this.pokers[index];
            var i = ids.indexOf(porker.imageData.id);
            if(i >= 0){
                this.pokers.splice(index, 1);
                ids.splice(i,1);
            }
            if(!ids.length) return;
        }
    }
    getSelectedPokers(){
        var arr = [];
        for (var index = 0; index < this.pokers.length; index++){
            var porker = this.pokers[index];
            if(porker.isSelected) arr.push(porker);
        }
        return arr;
    }
    get length(){
        return this.pokers.length;
    }
}
