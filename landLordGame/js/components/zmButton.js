/**
 * Created by zhangmiao on 2018/6/1.
 */
import ZMClass from "../base/zmClass"
import ZMLabel from "./zmLabel"
import ZMColor from "../common/zmColor"

export default class ZMButton extends ZMClass{
    keyCode = null;
    buttonLabel = null;//
    constructor(argP, argWH){
        super(argP, argWH);
        this.buttonLabel = new ZMLabel({x:0, y:0}).setSize(argWH).setTextBaseline("middle").setTextAlign("center").setFontType("bold").setFontSize(20);
        this.addControlInLast([this.buttonLabel]);
    };
    setText(text){
        this.buttonLabel.setText(text);
        return this;
    }
    setSize(size){
        if(size){
            this.size = size;
            this.buttonLabel.setSize({width:size.width, height:size.height});
        }
        return this;
    }
    setKeyCode(keyCode){
        this.keyCode = keyCode;
        return this;
    }
}