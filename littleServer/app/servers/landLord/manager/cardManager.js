/**
 * Created by zhangmiao on 2018/5/30.
 */

var Card = require("../model/card");
var GameRule = require("../util/gameRule");
var CardManager = function(app, opts){
    this.app = app;
    this.opts = opts;
};


var pro = CardManager.prototype;


pro.dealCards = function(desk){
    var total = 17;
    var cards = Card.getNewCards();

    // 抽底牌
    for (var i = 0; i < 3; i++){
        desk.hiddenCards[i] = getOnCard(cards);
    }

    //p1 p2 p3发牌
    for (var seatNo in desk.seats){
        var currentPlayer = desk.seats[seatNo];
        for (i = 0; i < total; i++){
            currentPlayer.cardList[i] = getOnCard(cards);
        }
        currentPlayer.cardList.sort(GameRule.cardSort);
    }
    //现在排个序
};

var getOnCard = function(cards){
    var randomIndex= random(0,cards.length - 1);
    var card = cards.splice(randomIndex, 1)[0];
    if(card == undefined){
        card = cards.splice(0, 1)[0];
    }
    return card;
};

var random = function(min, max){
    min = min == null ? 0 : min;
    max = max == null ? 1 : max;
    if(min == max) return min;
    var delta = (max - min)+1;
    return Math.floor(Math.random() * delta + min);
};

module.exports = CardManager;