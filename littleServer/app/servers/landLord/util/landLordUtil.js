/**
 * Created by zhangmiao on 2018/5/29.
 */
var util = {
    /**
     * 卡牌排序
     * @method cardSort
     * @param  {Object} a [description]
     * @param  {Object} b [description]
     * @return {number}
     */
    cardSort: function (a, b){
        var va = parseInt(a.val);
        var vb = parseInt(b.val);
        if(va === vb){
            return a.type > b.type ? 1 : -1;
        } else if(va > vb){
            return -1;
        } else {
            return 1;
        }
    }
};

module.exports = util;