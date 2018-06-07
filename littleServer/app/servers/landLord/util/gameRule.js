/**
 * Created by zhangmiao on 2018/6/5.
 */

var GameRule = module.exports;

GameRule.typeJudge = function(cards){
    var self = this,
        len = cards.length;
    switch (len) {
        case 1:
            return {'cardKind': self.ONE, 'val': cards[0].val, 'size': len};
        case 2:
            if(self.isPairs(cards))
                return {'cardKind': self.PAIRS, 'val': cards[0].val, 'size': len};
            else if (self.isKingBomb(cards))
                return {'cardKind': self.KING_BOMB, 'val': cards[0].val, 'size': len};
            else
                return null;
        case 3:
            if(self.isThree(cards))
                return {'cardKind': self.THREE, 'val': cards[0].val, 'size': len};
            else
                return null;
        case 4:
            if(self.isThreeWithOne(cards)){
                return {'cardKind': self.THREE_WITH_ONE, 'val': self.getMaxVal(cards, 3), 'size': len};
            } else if (self.isBomb(cards)) {
                return {'cardKind': self.BOMB, 'val': cards[0].val, 'size': len};
            }
            return null;
        default:
            if(self.isProgression(cards))
                return {'cardKind': self.PROGRESSION, 'val': cards[0].val, 'size': len};
            else if(self.isProgressionPairs(cards))
                return {'cardKind': self.PROGRESSION_PAIRS, 'val': cards[0].val, 'size': len};
            else if(self.isThreeWithPairs(cards))
                return {'cardKind': self.THREE_WITH_PAIRS, 'val': self.getMaxVal(cards, 3), 'size': len};
            else if(self.isPlane(cards))
                return {'cardKind': self.PLANE, 'val': self.getMaxVal(cards, 3), 'size': len};
            else if(self.isPlaneWithOne(cards))
                return {'cardKind': self.PLANE_WITH_ONE, 'val': self.getMaxVal(cards, 3), 'size': len};
            else if(self.isPlaneWithPairs(cards))
                return {'cardKind': self.PLANE_WITH_PAIRS, 'val': self.getMaxVal(cards, 3), 'size': len};
            else if(self.isFourWithTwo(cards))
                return {'cardKind': self.FOUR_WITH_TWO, 'val': self.getMaxVal(cards, 4), 'size': len};
            else if(self.isFourWithPairs(cards))
                return {'cardKind': self.FOUR_WITH_TWO_PAIRS, 'val': self.getMaxVal(cards, 4), 'size': len};
            else
                return null;
    }
};

//是否是对子
GameRule.isPairs = function(cards){
    return cards.length == 2 && cards[0].val === cards[1].val;
};


//是否是三条
GameRule.isThree = function(cards){
    return cards.length == 3 && cards[0].val === cards[1].val && cards[1].val === cards[2].val;
};

//是否是三带一
GameRule.isThreeWithOne = function(cards){
    if(cards.length != 4) return false;
    var c = GameRule.valCount(cards);
    return c.length === 2 && (c[0].count === 3 || c[1].count === 3);
};

//是否是三带一对
GameRule.isThreeWithPairs = function(cards) {
    if(cards.length != 5) return false;
    var c = GameRule.valCount(cards);
    return c.length === 2 && (c[0].count === 3 || c[1].count === 3);
};


//是否是顺子
GameRule.isProgression = function(cards) {
    if(cards.length < 5 || cards[0].val === 15) return false;
    for (var i = 0; i < cards.length; i++) {
        if(i != (cards.length - 1) && (cards[i].val - 1) != cards[i + 1].val){
            return false;
        }
    }
    return true;
};

//是否是连对
GameRule.isProgressionPairs = function(cards) {
    if(cards.length < 6 || cards.length % 2 != 0 || cards[0].val === 15) return false;
    for (var i = 0; i < cards.length; i += 2) {
        if(i != (cards.length - 2) && (cards[i].val != cards[i + 1].val || (cards[i].val - 1) != cards[i + 2].val)){
            return false;
        }
    }
    return true;
};


//是否是飞机
GameRule.isPlane = function(cards) {
    if(cards.length < 6 || cards.length % 3 != 0 || cards[0].val === 15) return false;
    for (var i = 0; i < cards.length; i += 3) {
        if(i != (cards.length - 3) && (cards[i].val != cards[i + 1].val || cards[i].val != cards[i + 2].val || (cards[i].val - 1) != cards[i + 3].val)){
            return false;
        }
    }
    return true;
};


//是否是飞机带单
GameRule.isPlaneWithOne = function(cards) {
    if(cards.length < 8 || cards.length % 4 != 0) return false;
    var c = GameRule.valCount(cards),
        threeList = [],
        threeCount = cards.length / 4;
    for (var i = 0; i < c.length; i++) {
        if(c[i].count == 3){
            threeList.push(c[i]);
        }
    }
    if(threeList.length != threeCount || threeList[0].val === 15){//检测三根数量和不能为2
        return false;
    }
    for (i = 0; i < threeList.length; i++) {//检测三根是否连续
        if(i != threeList.length - 1 && threeList[i].val - 1 != threeList[i + 1].val){
            return false;
        }
    }
    return true;
};


//是否是飞机带对
GameRule.isPlaneWithPairs = function(cards) {
    if(cards.length < 10 || cards.length % 5 != 0) return false;
    var c = GameRule.valCount(cards),
        threeList = [],
        pairsList = [],
        groupCount = cards.length / 5;
    for (var i = 0; i < c.length; i++) {
        if(c[i].count == 3){
            threeList.push(c[i]);
        }
        else if(c[i].count == 2){
            pairsList.push(c[i]);
        } else {
            return false;
        }
    }
    if(threeList.length != groupCount || pairsList.length != groupCount || threeList[0].val === 15){//检测三根数量和对子数量和不能为2
        return false;
    }
    for (i = 0; i < threeList.length; i++) {//检测三根是否连续
        if(i != threeList.length - 1 && threeList[i].val - 1 != threeList[i + 1].val){
            return false;
        }
    }
    return true;
};


//是否是四带二
GameRule.isFourWithTwo = function(cards) {
    var c = GameRule.valCount(cards);
    if(cards.length != 6 || c.length > 3) return false;
    for (var i = 0; i < c.length; i++) {
        if(c[i].count === 4)
            return true;
    }
    return false;
};


//是否是四带两个对
GameRule.isFourWithPairs = function(cards) {
    if(cards.length != 8) return false;
    var c = GameRule.valCount(cards);
    if(c.length != 3) return false;
    for (var i = 0; i < c.length; i++) {
        if(c[i].count != 4 && c[i].count != 2)
            return false;
    }
    return true;
};


//是否是炸弹
GameRule.isBomb = function(cards) {
    return cards.length === 4 && cards[0].val === cards[1].val && cards[0].val === cards[2].val && cards[0].val === cards[3].val;
};

//是否是王炸
GameRule.isKingBomb = function(cards) {
    return cards.length === 2 && cards[0].type == '0' && cards[1].type == '0';
};


/**
 * 卡牌排序 1 : a < b ,-1 a : > b
 * @method cardSort
 * @param  {Object} a [description]
 * @param  {Object} b [description]
 * @return
 */
GameRule.cardSort = function (a, b){
    var va = parseInt(a.val);
    var vb = parseInt(b.val);
    if(va === vb){
        return parseInt(a.type) > parseInt(b.type) ? 1 : -1;
    } else if(va > vb){
        return -1;
    } else {
        return 1;
    }
};
/**
 * 牌统计，统计各个牌有多少张
 * @param {Array} cards
 * @return {Array<object<val, count>>} val:值 count:数量
 */
GameRule.valCount = function(cards){
    var result = [];
    var addCount = function(v){
        for (var i = 0; i < result.length; i++) {
            if(result[i].val == v){
                result[i].count ++;
                return;
            }
        }
        result.push({'val': v, 'count': 1});
    };
    for (var i = 0; i < cards.length; i++){
        addCount(cards[i].val);
    }
    return result;
};


GameRule.getMaxVal = function(cards, n){
    var c = this.valCount(cards);
    var max = 0;
    for (var i = 0; i < c.length; i++) {
        if(c[i].count === n && c[i].val > max){
            max = c[i].val;
        }
    }
    return max;
};

/**
 * 牌型枚举
 * @type {number}
 */
GameRule.ONE = 1;
GameRule.PAIRS = 2;
GameRule.THREE = 3;
GameRule.THREE_WITH_ONE = 4;
GameRule.THREE_WITH_PAIRS = 5;
GameRule.PROGRESSION = 6;
GameRule.PROGRESSION_PAIRS = 7;
GameRule.PLANE = 8;
GameRule.PLANE_WITH_ONE = 9;
GameRule.PLANE_WITH_PAIRS = 10;
GameRule.FOUR_WITH_TWO = 11;
GameRule.FOUR_WITH_TWO_PAIRS = 12;
GameRule.BOMB = 13;
GameRule.KING_BOMB = 14;