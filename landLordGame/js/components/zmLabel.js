/**
 * Created by zhangmiao on 2018/5/31.
 */
import ZMClass from "../base/zmClass"
import  ZMColor from "../common/zmColor"

export default class ZMLabel extends ZMClass{
    text = "";//显示的文本
    textPos = null;//调整文字在label中的位置
    fontType="normal";//文字属性，如："normal","bold"等
    fontColor=null;//字体颜色
    textAlign="center";//水平对齐:left，center，right
    textBaseline="middle";//竖直对齐 top，middle，bottom
    fontSize=10;//字体大小
    isSelect=false;
    constructor(argP, argtext){
        super(argP, {width:0, height:20});
        this.text = argtext;
        this.textPos = {x:2, y:2};
        this.fontSize = 15;
        this.fontColor = ZMColor.black;
    }
    setText(text){
        this.text = text;
        return this;
    }
    getTextString(){
        if(typeof this.text == 'function'){
            return this.text();
        }else {
            return this.text;
        }
    }
    setTextPos(textPos){
        this.textPos = textPos;
        return this;
    }
    setFontType(type){
        this.fontType = type;
        return this;
    }
    setFontColor(color){
        this.fontColor = color;
        return this;
    }
    setTextAlign(textAlign){
        this.textAlign = textAlign;
        return this;
    }
    setTextBaseline(textBaseLine){
        this.textBaseLine = textBaseLine;
        return this;
    }
    setFontSize(frontSize){
        this.fontSize = frontSize;
        return this;
    }
    showing(x, y, w, h){//覆盖父类中showing方法
        var _context = JMain.JForm.context;
        var text = this.getTextString();
        if (text) {
            _context.fillStyle = typeof this.fontColor === 'string' ? typeof this.fontColor : this.fontColor.data;
            _context.font = this.fontType + " " + parseInt(this.fontSize * (JMain.JZoom.y + JMain.JZoom.x) / 2) + "px serif";
            _context.textBaseline = this.textBaseline;
            _context.textAlign = this.textAlign;
            var x1,y1;
            if(_context.textAlign=="left"){
                x1= x + parseInt(this.textPos.x * JMain.JZoom.x);
            }else if(_context.textAlign=="center"){
                x1= x + parseInt(w/2);
            }else if(_context.textAlign=="right"){
                x1= x + w- parseInt(this.textPos.x * JMain.JZoom.x);
            }
            if(_context.textBaseline=="top"){
                y1=y + parseInt(this.textPos.y * JMain.JZoom.y);
            }else if(_context.textBaseline=="middle"){
                y1=y + parseInt(h/2);
            }else if(_context.textBaseline=="bottom"){
                y1=y +h- parseInt(this.textPos.y * JMain.JZoom.y);
            }
            if(!this.size.width){
                this.size.width =  _context.measureText(text).width+4;
            }
            _context.fillText(text,x1,y1, this.width);
        }
        if(this.isSelect){
            _context.strokeStyle = ZMColor.red.data;
            _context.lineWidth = 1;
            _context.strokeRect(x , y,w - _context.lineWidth, h - _context.lineWidth);
        }
        super.showing(x, y, w, h);
    }
}