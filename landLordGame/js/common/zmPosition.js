/**
 * Created by zhangmiao on 2018/6/28.
 */


export default class ZMPosition{
    constructor(x,y){
        this._x = x;
        this._y = y;
        let self = this;

        this.__defineGetter__("x", function(){
            if(typeof self._x === 'function'){
                return self._x();
            }else {
                return self._x;
            }
        });
        this.__defineGetter__("y", function(){
            if(typeof self._y === 'function'){
                return self._y();
            }else {
                return self._y;
            }
        });
        this.__defineSetter__("x", function(x){
            self._x = x;
        });
        this.__defineSetter__("y", function(y){
            self._y = y;
        });
    }
    setX(x){
        this._x = x;
        return this;
    }
    setY(y){
        this._y = y;
        return this;
    }
}