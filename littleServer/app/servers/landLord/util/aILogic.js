/**
 * Created by zhangmiao on 2018/6/5.
 */

var GameRule = require("./GameRule");
var AICardType = require("../model/aICardType");


var AILogic = function(p){
    this.player = p;
    this.cards  = this.player.cardList.slice(0);
    //var self = this;
    //this.__defineGetter__("cards", function(){
    //    return self.player.cardList.slice(0);
    //});

    this.analyse();
};

module.exports = AILogic;

var pro = AILogic.prototype;

pro.analyse = function(){
    var self = this;
    var stat,targetWobt,targetWobp;
    var target = self.cards.slice(0);
    self._one = [];
    self._pairs =[];
    self._kingBomb = [];
    self._bomb = [];
    self._three = [];
    self._plane = [];
    self._progression = [];
    self._progressionPairs = [];
    target.sort(GameRule.cardSort);

    //王炸
    if(GameRule.isKingBomb(target.slice(0, 2))){
        self._kingBomb.push(new AICardType(17, target.splice(0, 2)));
    }
    //炸弹
    stat = GameRule.valCount(target);
    for (var i = 0; i < stat.length; i++){
        if(stat[i].count === 4){
            var list = [];
            moveItem(target, list, stat[i].val);
            self._bomb.push(new AICardType(list[0].val, list));
        }
    }

    targetWobt = target.slice(0);
    self.judgeThree(targetWobt);//判定三根，用于判定三顺
    self.judgePlane();//判定三顺(飞机不带牌)

    //把三根加回用于判定顺子
    for (i = 0; i < self._three.length; i++) {
        targetWobt = targetWobt.concat(self._three[i].cardList);
    }

    self._three = [];
    targetWobt.sort(GameRule.cardSort);

    //判定顺子，先确定五连
    targetWobp = targetWobt.slice(0);
    self.judgeProgression(targetWobp);
    self.judgeProgressionPairs(targetWobp);

    self.judgeThree(targetWobp);

    stat = GameRule.valCount(targetWobp);
    for (i = 0; i < stat.length; i++) {
        var j;
        if(stat[i].count === 1){//单牌
            for (j = 0; j < targetWobp.length; j++) {
                if(targetWobp[j].val === stat[i].val){
                    self._one.push(new AICardType(stat[i].val, targetWobp.splice(j,1)));
                }
            }
        } else if(stat[i].count === 2){//对子
            for (j = 0; j < targetWobp.length; j++) {
                if(targetWobp[j].val === stat[i].val){
                    self._pairs.push(new AICardType(stat[i].val, targetWobp.splice(j,2)));
                }
            }
        }
    }

};

/**
 *
 * @param {Array<Card>} lastPlayCards 当前的牌面
 * @param {boolean} isWinnerIsLandlord 当前是否是地主
 * @param {number} winnerCardCount 当前最大哪家剩余手牌数
 */

pro.follow = function(lastPlayCards, isWinnerIsLandlord, winnerCardCount){
    var self = this;
    var i,one,pairs, three;
    var lastCardTypeObject = GameRule.typeJudge(lastPlayCards);
    var args = [lastCardTypeObject, isWinnerIsLandlord, winnerCardCount];
    var result = null;
    switch (lastCardTypeObject.cardKind){
        case GameRule.ONE ://如果是单牌
            result =  self.followHandleOne.apply(self, args);
            break;
        case GameRule.PAIRS://如果是对子
            result =  self.followHandlePairs.apply(self, args);
            break;
        case GameRule.THREE://三根
            result =  self.followHandleThree.apply(self, args);
            break;
        case GameRule.THREE_WITH_ONE://三带一
            result =  self.followHandleThreeWithOne.apply(self, args);
            break;
        case GameRule.THREE_WITH_PAIRS://三带一对
            result =  self.followHandleThreeWithPairs.apply(self, args);
            break;
        case GameRule.PROGRESSION://顺子
            result =  self.followHandleProgression.apply(self, args);
            break;
        case GameRule.PROGRESSION_PAIRS://联队
            result =  self.followHandleProgressionPairs.apply(self, args);
            break;
        case GameRule.PLANE://三顺
            result =  self.followHandlePlane.apply(self, args);
            break;
        case GameRule.PLANE_WITH_ONE://飞机带单
            result =  self.followHandlePlaneWithOne.apply(self, args);
            break;
        case GameRule.PLANE_WITH_PAIRS://飞机带对
            result =  self.followHandlePlaneWithPairs.apply(self, args);
            break;
        case GameRule.BOMB://炸弹
            result =  self.followHandleBomb.apply(self, args);
            break;
        case GameRule.FOUR_WITH_TWO://四带二
            result =  minCards(self._bomb, GameRule.BOMB, lastCardTypeObject.val);
            break;
        case GameRule.FOUR_WITH_TWO_PAIRS://四带对
            result =  minCards(self._bomb, GameRule.BOMB, lastCardTypeObject.val);
            break;
        default:
            break;
    }
    if(result){
        return result;
    }else if (lastCardTypeObject.cardKind != GameRule.BOMB
        && lastCardTypeObject.cardKind != GameRule.KING_BOMB
        && (self._bomb.length > 0 || self._kingBomb.length > 0)){
        if((isWinnerIsLandlord && winnerCardCount < 5)
        || (self.player.isLandLord && self.player.cardList.length < 5)
        || self.times() <= 2){
            if(self._bomb.length > 0){
                return minCards(self._bomb, GameRule.BOMB);
            }else {
                return setCardKind(self._kingBomb[0], GameRule.KING_BOMB)
            }
        }
    }
    return null;
};

//单牌
pro.followHandleOne = function(winc, isWinnerIsLandlord, winnerCardCount){
    var val = winc.val;
    var self = this;
    var one = self.matchCards(self._one, GameRule.ONE, val, isWinnerIsLandlord, winnerCardCount);
    if(!one){
        if(isWinnerIsLandlord || self.player.isLandlord){
            for (var i = 0; i < self.cards.length; i++) {
                if(self.cards[i].val <= 15 && self.cards[i].val > val){
                    return {cardList: self.cards.slice(i, i + 1),
                        cardKind: GameRule.ONE,
                        size: 1,
                        val: self.cards[i].val};
                }
            }
        }
    }
    return one;
};

//对子
pro.followHandlePairs = function(winc, isWinnerIsLandlord, winnerCardCount){
    var val = winc.val;
    var self = this, i;
    var pairs = self._pairs.length > 0 ? self.matchCards(self._pairs, GameRule.PAIRS, val, isWinnerIsLandlord, winnerCardCount) : null;
    if(pairs == null && (isWinnerIsLandlord || self.player.isLandlord)){//需要拆牌
        if(self._progressionPairs.length > 0){//从连对中拿对
            for (i = self._progressionPairs.length - 1; i >= 0 ; i--) {
                if(val >= self._progressionPairs[i].val) continue;
                for (var j =  self._progressionPairs[i].cardList.length - 1 ; j >= 0; j -= 2) {
                    if(self._progressionPairs[i].cardList[j].val > val){
                        var pairsFromPP = self._progressionPairs[i].cardList.splice(j - 1,2);
                        return {cardList: pairsFromPP,
                            cardKind: GameRule.PAIRS,
                            size: 2,
                            val: pairsFromPP[0].val};
                    }
                }
            }
        } else if(self._three.length > 0){//从三张里面拿对
            for (i = self._three.length - 1; i >= 0 ; i--) {
                if(self._three[i].val > val){
                    return {cardList: self._three[i].cardList.slice(0, 2),
                        cardKind: GameRule.PAIRS,
                        size: 2,
                        val: self._three[i].val};
                }
            }
        }
    }
    return pairs;
};

//三根
pro.followHandleThree = function(winc, isWinnerIsLandlord, winnerCardCount){
    var val = winc.val;
    var self = this;
    if(!isWinnerIsLandlord && !self.player.isLandlord){
        return null;
    }
    return self.matchCards(self._three, GameRule.THREE, val, isWinnerIsLandlord, winnerCardCount);
};

//三带一
pro.followHandleThreeWithOne = function(winc, isWinnerIsLandlord){
    var val = winc.val;
    var self = this;
    if(!isWinnerIsLandlord && !self.player.isLandlord){
        return null;
    }
    var three = minCards(self._three, GameRule.THREE, val);
    if(three){
        var one = self.minOne(2, three.val);
        if(!one){
            console.log("one:",one);
            return null;
        } else {
            console.log("one:",one);
            three.cardList.push(one);
        }
        three.cardKind = GameRule.THREE_WITH_ONE;
        three.size = 4;
    }
    return three;
};
//三带一对
pro.followHandleThreeWithPairs = function(winc, isWinnerIsLandlord, winnerCardCount){
    var val = winc.val;
    var self = this;
    if(!isWinnerIsLandlord && !self.player.isLandlord){
        return null;
    }
    var three = minCards(self._three, GameRule.THREE, val);
    if(three){
        var pairs = minCards(self._pairs, GameRule.PAIRS);
        while (true) {//避免对子三根重叠
            if(pairs.cardList[0].val === three.val){
                pairs = minCards(self._pairs, GameRule.PAIRS, pairs.cardList[0].val);
            } else {
                break;
            }
        }
        if(pairs){
            three.cardList = three.cardList.concat(pairs.cardList);
        } else {
            return null;
        }
    }
    return three;
};

//顺子
pro.followHandleProgression = function(winc, isWinnerIsLandlord, winnerCardCount){
    var self = this;
    if(!isWinnerIsLandlord && !self.player.isLandlord){
        return null;
    }
    if(self._progression.length > 0){
        for (var i = self._progression.length - 1; i >= 0 ; i--) {//从小值开始判断
            if(winc.val < self._progression[i].val && winc.size <= self._progression[i].cardList.length){
                if(winc.size === self._progression[i].cardList.length){
                    return setCardKind(self._progression[i], GameRule.PROGRESSION);
                } else {
                    if(self.player.isLandlord || isWinnerIsLandlord){
                        var valDiff = self._progression[i].val - winc.val,
                            sizeDiff = self._progression[i].cardList.length - winc.size;
                        for (var j = 0; j < sizeDiff; j++) {//拆顺
                            if(valDiff > 1){
                                self._progression[i].cardList.shift();
                                valDiff -- ;
                                continue;
                            }
                            self._progression[i].cardList.pop();
                        }
                        return setCardKind(self._progression[i], GameRule.PROGRESSION);
                    } else {
                        return null;
                    }
                }
            }
        }
    }
    return null;
};
//连对
pro.followHandleProgressionPairs = function(winc, isWinnerIsLandlord, winnerCardCount){
    var self = this;
    if(!isWinnerIsLandlord && !self.player.isLandlord){
        return null;
    }
    if(self._progressionPairs.length > 0){
        for (var i = self._progressionPairs.length - 1; i >= 0 ; i--) {//从小值开始判断
            if(winc.val < self._progressionPairs[i].val && winc.size <= self._progressionPairs[i].cardList.length){
                if(winc.size === self._progressionPairs[i].cardList.length){
                    return setCardKind(self._progressionPairs[i], GameRule.PROGRESSION_PAIRS);
                } else {
                    if(self.player.isLandlord || isWinnerIsLandlord){
                        var valDiff = self._progressionPairs[i].val - winc.val,
                            sizeDiff = (self._progressionPairs[i].cardList.length - winc.size) / 2;
                        for (var j = 0; j < sizeDiff; j++) {//拆顺
                            if(valDiff > 1){
                                self._progressionPairs[i].cardList.shift();
                                self._progressionPairs[i].cardList.shift();
                                valDiff -- ;
                                continue;
                            }
                            self._progressionPairs[i].cardList.pop();
                            self._progressionPairs[i].cardList.pop();
                        }
                        return setCardKind(self._progressionPairs[i], GameRule.PROGRESSION_PAIRS);
                    } else {
                        return null;
                    }
                }
            }
        }
    }
    return null;
};
//三顺
pro.followHandlePlane = function(winc, isWinnerIsLandlord, winnerCardCount) {
    var self = this;
    if(!isWinnerIsLandlord && !self.player.isLandlord){
        return null;
    }
    return self.minPlane(winc.size, winc);
};
//飞机带单
pro.followHandlePlaneWithOne = function(winc, isWinnerIsLandlord, winnerCardCount){
    var self = this;
    if(!isWinnerIsLandlord && !self.player.isLandlord){
        return null;
    }
    var cnt = winc.size / 4,
        plane = self.minPlane(cnt * 3, winc);
    if(plane){
        var currOneVal = 2;
        for (var i = 0; i < cnt; i++) {
            var one = self.minOne(currOneVal, plane.val);//拿一张单牌
            if(one){
                plane.cardList.push(one);
                currOneVal = one.val;
            } else {
                return null;
            }
        }
        plane.cardKind = GameRule.PLANE_WITH_ONE;
        plane.size = plane.cardList.length;
    }
    return plane;
};

pro.followHandlePlaneWithPairs = function(winc, isWinnerIsLandlord, winnerCardCount){
    var  self = this;
    if(!isWinnerIsLandlord && !self.player.isLandlord){
        return null;
    }
    var cnt = winc.size / 5,
        plane = self.minPlane(cnt * 3, winc);
    if(plane){
        var currPairsVal = 2;
        for (var i = 0; i < cnt; i++) {
            var pairs = minCards(self._pairs, GameRule.PAIRS, currPairsVal);//拿一对
            if(pairs){
                plane.cardList = plane.cardList.concat(pairs.cardList);
                currPairsVal = pairs.val;
            } else {
                return null;
            }
        }
        plane.cardKind = GameRule.PLANE_WITH_PAIRS;
        plane.size = plane.cardList.length;
    }
    return plane;
};

pro.followHandleBomb = function(winc, isWinnerIsLandlord, winnerCardCount){
    var self = this;
    if(!isWinnerIsLandlord && !self.player.isLandlord){//同是农民不压炸弹
        return null;
    }
    var bomb = minCards(self._bomb, GameRule.BOMB, winc.val);
    if(bomb){
        return bomb;
    } else {
        if(self._kingBomb.length > 0){
            if((isWinnerIsLandlord && winnerCardCount < 6)
                || (self.player.isLandlord && self.player.cardList.length < 6)){
                return setCardKind(self._kingBomb[0], GameRule.KING_BOMB);
            }
        }
        return null;
    }
};


pro.play = function(landlordCardsCnt) {
    var self = this;
    // self.log();
    var cardsWithMin = function (idx){
        var minCard = self.cards[idx];
        //在单根里找
        for (var i = 0; i < self._one.length; i++) {
            if(self._one[i].val === minCard.val){
                return minCards(self._one, GameRule.ONE);
            }
        }
        //对子里找
        for (i = 0; i < self._pairs.length; i++) {
            if(self._pairs[i].val === minCard.val){
                return minCards(self._pairs, GameRule.PAIRS);
            }
        }
        //三根里找
        for (i = 0; i < self._three.length; i++) {
            if(self._three[i].val === minCard.val){
                return minCards(self._three, GameRule.THREE);
            }
        }
        //炸弹里找
        for (i = 0; i < self._bomb.length; i++) {
            if(self._bomb[i].val === minCard.val){
                return minCards(self._bomb, GameRule.BOMB);
            }
        }
        //三顺里找
        for (i = 0; i < self._plane.length; i++) {
            for (var j = 0; j < self._plane[i].cardList.length; j++) {
                if(self._plane[i].cardList[j].val === minCard.val && self._plane[i].cardList[j].type === minCard.type ){
                    return minCards(self._plane, GameRule.PLANE);
                }
            }
        }
        //顺子里找
        for (i = 0; i < self._progression.length; i++) {
            for (var j = 0; j < self._progression[i].cardList.length; j++) {
                if(self._progression[i].cardList[j].val === minCard.val && self._progression[i].cardList[j].type === minCard.type ){
                    return minCards(self._progression, GameRule.PROGRESSION);
                }
            }
        }
        //连对里找
        for (i = 0; i < self._progressionPairs.length; i++) {
            for (var j = 0; j < self._progressionPairs[i].cardList.length; j++) {
                if(self._progressionPairs[i].cardList[j].val === minCard.val && self._progressionPairs[i].cardList[j].type === minCard.type ){
                    return minCards(self._progressionPairs, GameRule.PROGRESSION_PAIRS);
                }
            }
        }
        if(self._kingBomb.length > 0){
            return minCards(self._kingBomb, GameRule.KING_BOMB);
        }
    };
    for (var i = self.cards.length - 1; i >=0 ; i--) {
        var r = cardsWithMin(i);
        if(r.cardKind === GameRule.ONE){
            if(self._plane.length > 0){//三顺
                var plane = minCards(self._plane, GameRule.PLANE);
                var len = plane.cardList.length / 3;
                var currOneVal = 2;
                for (var i = 0; i < len; i++) {
                    var one = self.minOne(currOneVal, plane.val);//拿一张单牌
                    plane.cardList.push(one);
                    currOneVal = one.val;
                }
                return setCardKind( plane, GameRule.PLANE_WITH_ONE);
            }
            else if(self._three.length > 0){//三带一
                var three = minCards(self._three, GameRule.THREE);
                var len = three.cardList.length / 3;
                var one = self.minOne(currOneVal, three.val);//拿一张单牌
                three.cardList.push(one);
                if(three.val < 14)
                    return setCardKind( three, GameRule.THREE_WITH_ONE);
            }
            if(self.player.isLandlord){//坐庄打法
                if(self.player.isLandlord){//坐庄打法
                    if(self.player.nextCardsCnt <= 2 || self.player.preCardsCnt <= 2 )
                        return self.playOneAtTheEnd(landlordCardsCnt);
                    else
                        return minCards(self._one, GameRule.ONE);
                }
            } else {//偏家打法
                if(landlordCardsCnt <= 2)
                    return self.playOneAtTheEnd(landlordCardsCnt);
                else
                    return minCards(self._one, GameRule.ONE);
            }
        } else if(r.cardKind === GameRule.THREE){
            var three = minCards(self._three, GameRule.THREE);
            var len = three.cardList.length / 3;
            if(self._one.length >= 0){//单根多带单
                var one = self.minOne(currOneVal, three.val);//拿一张单牌
                three.cardList.push(one);
                return setCardKind( three, GameRule.THREE_WITH_ONE);
            } else if(self._pairs.length > 0){
                var pairs = minCards(self._pairs, GameRule.PAIRS, currPairsVal);//拿一对
                three.cardList = three.cardList.concat(pairs.cardList);
                return setCardKind( three, GameRule.THREE_WITH_PAIRS);
            } else {
                return setCardKind( three, GameRule.THREE);
            }
        } else if(r.cardKind === GameRule.PLANE){
            var plane = minCards(self._plane, GameRule.PLANE);
            var len = plane.cardList.length / 3;
            if(self._one.length > len && self._pairs.length > len){
                if(self._one.length >= self._pairs.length){//单根多带单
                    var currOneVal = 2;
                    for (var i = 0; i < len; i++) {
                        var one = self.minOne(currOneVal, plane.val);//拿一张单牌
                        plane.cardList.push(one);
                        currOneVal = one.val;
                    }
                    return setCardKind( plane, GameRule.PLANE_WITH_ONE);
                } else {
                    var currPairsVal = 2;
                    for (var i = 0; i < len; i++) {
                        var pairs = minCards(self._pairs, GameRule.PAIRS, currPairsVal);//拿一对
                        plane.cardList = plane.cardList.concat(pairs.cardList);
                        currPairsVal = pairs.val;
                    }
                    return setCardKind( plane, GameRule.PLANE_WITH_PAIRS);
                }
            } else if(self._pairs.length > len){
                var currPairsVal = 2;
                for (var i = 0; i < len; i++) {
                    var pairs = minCards(self._pairs, GameRule.PAIRS, currPairsVal);//拿一对
                    plane.cardList = plane.cardList.concat(pairs.cardList);
                    currPairsVal = pairs.val;
                }
                return setCardKind( plane, GameRule.PLANE_WITH_PAIRS);
            } else if(self._one.length > len){
                var currOneVal = 2;
                for (var i = 0; i < len; i++) {
                    var one = self.minOne(currOneVal, plane.val);//拿一张单牌
                    plane.cardList.push(one);
                    currOneVal = one.val;
                }
                return setCardKind( plane, GameRule.PLANE_WITH_ONE);
            } else {
                return setCardKind( plane, GameRule.PLANE);
            }
        }else if(r.cardKind === GameRule.BOMB && self.times() === 1){
            return r;
        } else if(r.cardKind === GameRule.BOMB && self.times() != 1){
            continue;
        } else {
            return r;
        }
    }
};


//出牌将单根放最后出牌
pro.playOneAtTheEnd  = function(landlordCardsCnt) {
    var self = this;
    if(self._progression.length > 0){//出顺子
        return minCards(self._progression, GameRule.PROGRESSION);
    }
    else if(self._plane.length > 0){//三顺
        var plane = minCards(self._plane, GameRule.PLANE);
        var len = plane.cardList.length / 3;
        if(self._one.length > len && self._pairs.length > len){
            if(self._one.length >= self._pairs.length){//单根多带单
                var currOneVal = 2;
                for (var i = 0; i < len; i++) {
                    var one = self.minOne(currOneVal, plane.val);//拿一张单牌
                    plane.cardList.push(one);
                    currOneVal = one.val;
                }
                return setCardKind( plane, GameRule.PLANE_WITH_ONE);
            } else {
                var currPairsVal = 2;
                for (var i = 0; i < len; i++) {
                    var pairs = minCards(self._pairs, GameRule.PAIRS, currPairsVal);//拿一对
                    plane.cardList = plane.cardList.concat(pairs.cardList);
                    currPairsVal = pairs.val;
                }
                return setCardKind( plane, GameRule.PLANE_WITH_PAIRS);
            }
        } else if(self._pairs.length > len){
            var currPairsVal = 2;
            for (var i = 0; i < len; i++) {
                var pairs = minCards(self._pairs, GameRule.PAIRS, currPairsVal);//拿一对
                plane.cardList = plane.cardList.concat(pairs.cardList);
                currPairsVal = pairs.val;
            }
            return setCardKind( plane, GameRule.PLANE_WITH_PAIRS);
        } else if(self._one.length > len){
            var currOneVal = 2;
            for (var i = 0; i < len; i++) {
                var one = self.minOne(currOneVal, plane.val);//拿一张单牌
                plane.cardList.push(one);
                currOneVal = one.val;
            }
            return setCardKind( plane, GameRule.PLANE_WITH_ONE);
        } else {
            return setCardKind( plane, GameRule.PLANE);
        }
    }
    else if(self._progressionPairs.length > 0){//出连对
        return minCards(self._progressionPairs, GameRule.PROGRESSION_PAIRS);
    }
    else if(self._three.length > 0){//三根、三带一、三带对
        var three = minCards(self._three, GameRule.THREE);
        var len = three.cardList.length / 3;
        if(self._one.length >= 0){//单根多带单
            var one = self.minOne(currOneVal, three.val);//拿一张单牌
            three.cardList.push(one);
            return setCardKind( three, GameRule.THREE_WITH_ONE);
        } else if(self._pairs.length > 0){
            var pairs = minCards(self._pairs, GameRule.PAIRS, currPairsVal);//拿一对
            three.cardList = three.cardList.concat(pairs.cardList);
            return setCardKind( three, GameRule.THREE_WITH_PAIRS);
        } else {
            return setCardKind( three, GameRule.THREE);
        }
    }
    else if(self._pairs.length > 0){//对子
        if((self.player.isLandlord && (self.player.nextCardsCnt === 2 || self.player.preCardsCnt === 2))
            || (!self.player.isLandlord && landlordCardsCnt === 2))
            return maxCards(self._pairs, GameRule.PAIRS);
        else
            return minCards(self._pairs, GameRule.PAIRS);
    }
    else if(self._one.length > 0 ){//出单牌
        if((self.player.isLandlord && (self.player.nextCardsCnt <= 2 || self.player.preCardsCnt <= 2))
            || (!self.player.isLandlord && landlordCardsCnt <= 2))
            return maxCards(self._one, GameRule.ONE);
        else
            return minCards(self._one, GameRule.ONE);
    } else {//都计算无结果出最小的那张牌
        var one = null;
        if((self.player.isLandlord && (self.player.nextCardsCnt <= 2 || self.player.preCardsCnt <= 2))
            || (!self.player.isLandlord && landlordCardsCnt <= 2))
            one = self.cards.slice(self.cards.length - 1, self.cards.length);
        else
            one = self.cards.slice(0, 1);
        return {
            size : 1,
            cardKind: GameRule.ONE,
            cardList: one,
            val: one[0].val
        };
    }
};

/**
 * 判断给定牌中的三根
 */
pro.judgeThree = function(cards){
    var self = this,
        stat = GameRule.valCount(cards);
    for (var i = 0; i < stat.length; i++) {
        if(stat[i].count === 3){
            var list = [];
            moveItem(cards, list, stat[i].val);
            self._three.push(new AICardType(list[0].val, list));
        }
    }
};

pro.judgePlane = function(){
    var self = this;

    var saveThree = function(proList){
        var planeCards = [];
        for (var j = 0; j < proList.length; j++) {
            planeCards = planeCards.concat(proList[j].obj.cardList);
        }
        self._plane.push(new AICardType(proList[0].obj.val, planeCards));
        for (var k = proList.length - 1; k >= 0; k--) {//除去已经被取走的牌
            self._three.splice(proList[k].fromIndex, 1);
        }
    };

    if(self._three.length > 1){
        var proList = [];
        for (var i = 0; i < self._three.length; i++){
            if(self._three[i].val >= 15) continue;//三顺必须小于2
            if(proList.length == 0){
                proList.push({'obj': self._three[i], 'fromIndex': i});
                continue;
            }
            if(proList[proList.length - 1].val - 1 == self._three[i].val){//判定递减
                proList.push({'obj': self._three[i], 'fromIndex': i});
            }else {
                if(proList.length > 1) {//已经有三顺，先保存
                    saveThree(proList);
                }
                //重新计算
                proList = [];
                proList.push({'obj': self._three[i], 'fromIndex': i});
            }
        }
        if(proList.length > 1){//有三顺，保存
            saveThree(proList);
        }
    }
};

pro.judgeProgression = function(cards){
    var self = this;
    var saveProgression = function (proList){
        var progression = [];
        for (var j = 0; j < proList.length; j++) {
            progression.push(proList[j].obj);
        }
        self._progression.push(new AICardType(proList[0].obj.val, progression));
        for (var k = proList.length - 1; k >= 0; k--) {//除去已经被取走的牌
            cards.splice(proList[k].fromIndex, 1);
        }
    };

    //判定顺子
    if(cards.length >= 5){
        var proList = [];
        for (var i = 0; i < cards.length; i++) {
            if(cards[i].val >= 15) continue;//顺子必须小于2
            if(proList.length == 0){
                proList.push({'obj': cards[i], 'fromIndex': i});
                continue;
            }
            if(proList[proList.length - 1].obj.val - 1 === cards[i].val){//判定递减
                proList.push({'obj': cards[i], 'fromIndex': i});
                if(proList.length === 5) break;
            } else if (proList[proList.length - 1].obj.val === cards[i].val) {//相等跳出本轮
                continue;
            } else {
                if(proList.length >= 5){//已经有顺子，先保存
                    //saveProgression(proList);
                    //proList = [];
                    break;
                } else {
                    //重新计算
                    proList = [];
                    proList.push({'obj': cards[i], 'fromIndex': i});
                }
            }
        }
        if(proList.length === 5){//有顺子，保存
            saveProgression(proList);
            self.judgeProgression(cards);//再次判断顺子
        } else {
            self.joinProgression(cards);
        }
    }
};

pro.joinProgression = function(cards){
    var self = this;
    for (var i = 0; i < self._progression.length; i++) {//拼接其他散牌
        for (var j = 0; j < cards.length; j++) {
            if(self._progression[i].val != 14 && self._progression[i].val === cards[j].val - 1){
                self._progression[i].cardList.unshift(cards.splice(j, 1)[0]);
            } else if(cards[j].val === self._progression[i].val - self._progression[i].cardList.length){
                self._progression[i].cardList.push(cards.splice(j, 1)[0]);
            }
        }
    }
    var temp = self._progression.slice(0);
    for (i = 0; i < temp.length; i++) {//连接顺子
        if( i < temp.length - 1 && temp[i].val - temp[i].cardList.length === temp[i + 1].val){
            self._progression[i].cardList = self._progression[i].cardList.concat(self._progression[i + 1].cardList);
            self._progression.splice( ++i, 1);
        }
    }
};

pro.judgeProgressionPairs = function(cards){
    var self = this;
    var saveProgressionPairs = function (proList){
        var progressionPairs = [];
        for (var i = proList.length - 1; i >= 0; i--) {//除去已经被取走的牌
            for (var j = 0; j < cards.length; j++) {
                if(cards[j].val === proList[i]){
                    progressionPairs = progressionPairs.concat(cards.splice(j, 2));
                    break;
                }
            }
        }
        progressionPairs.sort(GameRule.cardSort);
        self._progressionPairs.push(new AICardType(proList[0], progressionPairs));
    };
    //判定连对
    if(cards.length >= 6){
        var proList = [];
        var stat = GameRule.valCount(cards);//统计
        for (var i = 0; i < stat.length; i++) {
            if(stat[i].val >= 15){//连对必须小于2
                continue;
            }
            if(proList.length == 0  && stat[i].count >= 2){
                proList.push(stat[i].val);
                continue;
            }
            if(proList[proList.length - 1] - 1 === stat[i].val && stat[i].count >= 2){//判定递减
                proList.push(stat[i].val);
            } else {
                if(proList.length >= 3){//已经有连对，先保存
                    //saveProgressionPairs(proList);
                    //proList = [];
                    break;
                } else {
                    //重新计算
                    proList = [];
                    if(stat[i].count >= 2) proList.push(stat[i].val);
                }
            }
        }
        if(proList.length >= 3){//有顺子，保存
            saveProgressionPairs(proList);
            self.judgeProgressionPairs(cards);
        }
    }
};


pro.matchCards = function(list, kind, val, isWinnerIsLandlord, winnerCardCount){
    var self = this;
    if (self.player.isLandLord){//坐庄打法
        return minCards(list, kind, val);
    } else {//偏家打法
        if(isWinnerIsLandlord){
            if(winnerCardCount < 3) {
                return maxCards(list, kind, val);
            } else {
                return minCards(list, kind, val);
            }
        } else {
            var c = minCards(list, kind, val);
            return c ? (c.val < 14 || self.times() <= 2 ? c : null) : null;
        }
    }
};

/**
 * 手数需要打几次才能打完
 * @returns {number}
 */
pro.times = function (){
    var t = this._kingBomb.length +
        this._bomb.length +
        this._progression.length +
        this._progressionPairs.length +
        this._one.length +
        this._pairs.length;
    var threeCount = this._three.length;
    if(this._plane.length > 0){
        for (var i = 0; i < this._plane.length; i++) {
            threeCount += this._plane[i].cardList.length / 3;
        }
    }
    if( threeCount - (this._one.length + this._pairs.length) > 0){
        t += threeCount - (this._one.length + this._pairs.length);
    }
    return t;
};

/**
 * 从对子或者单张中获取一张牌
 * @param v
 * @param notEq
 */
pro.minOne = function(v, notEq){
    var self = this,
        one = minCards(self._one, GameRule.ONE, v),
        oneFromPairs = self.offPairs(notEq);
    if(!one){//没有单根，找对
        if(oneFromPairs){
            self.deleteOne(oneFromPairs);
            return oneFromPairs;
        } else {
            return null;
        }
    }else {
        if(one.val > 14){//保留2和大小王
            if(oneFromPairs){
                self.deleteOne(oneFromPairs);
                return oneFromPairs;
            } else
                return null;
        } else {
            return one.cardList[0];
        }
    }
};

/**
 * 拆对
 * @param  {number} v 要大过的值
 * @param  {number} notEq 不能等于的值
 */
pro.offPairs = function(v, notEq){
    var self = this,
        pairs = minCards(self._pairs, GameRule.PAIRS, v);
    if(pairs){
        while (true) {
            if(pairs.cardList[0].val === notEq){
                pairs = minCards(self._pairs, GameRule.PAIRS, pairs.cardList[0].val);
            } else {
                break;
            }
        }
    }

    return pairs ? pairs.cardList[0] : null;
};


pro.deleteOne = function(card){
    for (var i = 0; i < this.cards.length; i++) {
        if(this.cards[i].val === card.val && this.cards[i].type === card.type){
            this.cards.splice(i, 1);
        }
    }
    this.analyse();
};


pro.minPlane = function(len, winc){
    var self = this;
    if(self._plane.length > 0){
        for (var i = self._plane.length - 1; i >= 0 ; i--) {//从小值开始判断
            if(winc.val < self._plane[i].val && len <= self._plane[i].cardList.length){
                if(len === self._plane[i].cardList.length){
                    return setCardKind(self._plane[i], GameRule.PLANE);
                } else {
                    var valDiff = self._plane[i].val - winc.val,
                        sizeDiff = (self._plane[i].cardList.length - len) / 3;
                    for (var j = 0; j < sizeDiff; j++) {//拆顺
                        if(valDiff > 1){
                            for (var k = 0; k < 3; k++) {
                                self._plane[i].cardList.shift();
                            }
                            valDiff -- ;
                            continue;
                        }
                        for (var k = 0; k < 3; k++) {
                            self._plane[i].cardList.pop();
                        }
                    }
                    return setCardKind(self._plane[i], GameRule.PLANE);
                }
            }
        }
    }
    return null;
};

var minCards = function(list, kind, v){
    v = v ? v : 2;
    if(list.length > 0){
        for (var i = list.length - 1; i >= 0 ; i--) {//从小值开始判断
            if(v < list[i].val){
                return setCardKind(list[i], kind);
            }
        }
    }
    return null;
};


var maxCards = function(list, kind, v){
    var max = null;
    if(list.length > 0){
        for (var i = 0; i < list.length ; i++) {//从小值开始判断
            if((max && list[i].val > max.val)|| !max){
                max = list[i];
            }
        }
        return v ? (max.val > v ? setCardKind(max, kind) : null) : setCardKind(max, kind);
    }
    return null;
};


var setCardKind = function(obj, kind){
    obj.cardKind = kind;
    obj.size = obj.cardList.length;
    return obj;
};

var moveItem = function(src, dest, v){
    for (var i = src.length -1; i>= 0; i--){
        if (src[i].val === v){
            dest.push(src.splice(i, 1)[0]);
        }
    }
};