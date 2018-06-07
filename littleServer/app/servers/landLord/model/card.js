/**
 * Created by zhangmiao on 2018/5/29.
 */

var dataArr = [
    {type: '0', val: 17},
    {type: '0', val: 16},
    {type: '1', val: 14},
    {type: '1', val: 15},
    {type: '1', val: 3},
    {type: '1', val: 4},
    {type: '1', val: 5},
    {type: '1', val: 6},
    {type: '1', val: 7},
    {type: '1', val: 8},
    {type: '1', val: 9},
    {type: '1', val: 10},
    {type: '1', val: 11},
    {type: '1', val: 12},
    {type: '1', val: 13},
    {type: '2', val: 14},
    {type: '2', val: 15},
    {type: '2', val: 3},
    {type: '2', val: 4},
    {type: '2', val: 5},
    {type: '2', val: 6},
    {type: '2', val: 7},
    {type: '2', val: 8},
    {type: '2', val: 9},
    {type: '2', val: 10},
    {type: '2', val: 11},
    {type: '2', val: 12},
    {type: '2', val: 13},
    {type: '3', val: 14},
    {type: '3', val: 15},
    {type: '3', val: 3},
    {type: '3', val: 4},
    {type: '3', val: 5},
    {type: '3', val: 6},
    {type: '3', val: 7},
    {type: '3', val: 8},
    {type: '3', val: 9},
    {type: '3', val: 10},
    {type: '3', val: 11},
    {type: '3', val: 12},
    {type: '3', val: 13},
    {type: '4', val: 14},
    {type: '4', val: 15},
    {type: '4', val: 3},
    {type: '4', val: 4},
    {type: '4', val: 5},
    {type: '4', val: 6},
    {type: '4', val: 7},
    {type: '4', val: 8},
    {type: '4', val: 9},
    {type: '4', val: 10},
    {type: '4', val: 11},
    {type: '4', val: 12},
    {type: '4', val: 13}
];

var Card = function(type, value){
    this.type = type; // 花色  鬼:0 黑:1 红:2 梅:3 方:4
    this.val = value; //  3 -> 13  A:14 2:15 小鬼:16 大鬼:17
};

//获得一新组牌
Card.getNewCards = function(){
    var arr = [];
    for (var index = 0; index < dataArr.length; index++){
        var type = dataArr[index].type;
        var val = dataArr[index].val;
        arr.push(new Card(type, val));
    }
    return arr;
};

module.exports = Card;