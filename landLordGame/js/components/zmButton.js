/**
 * Created by zhangmiao on 2018/6/1.
 */
import ZMClass from "../base/zmClass"
import ZMLabel from "./zmLabel"
import ZMColor from "../common/zmColor"
import ZMPosition from "../common/zmPosition"

export default class ZMButton extends ZMClass{
    keyCode = null;
    buttonLabel = null;//
    constructor(argP, argWH){
        super(argP, argWH);
        let self = this;
        this.buttonLabel = new ZMLabel(new ZMPosition(()=>self.width/2,()=>self.height/2),"").setAnchorPoint({x:0.5,y:0.5});
        this.buttonLabel.setSize(argWH).setTextBaseline("middle").setTextAlign("center").setFontType("bold").setFontSize(20);
        this.addControlInLast([this.buttonLabel]);
    };
    setText(text){
        this.buttonLabel.setText(text);
        return this;
    }
    setSize(size){
        if(size){
            this.size = size;
            this.buttonLabel.setSize(size);
        }
        return this;
    }
    setKeyCode(keyCode){
        this.keyCode = keyCode;
        return this;
    }
}