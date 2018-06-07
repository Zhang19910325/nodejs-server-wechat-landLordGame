/**
 * Created by zhangmiao on 2018/5/31.
 */

import ZMClass from "../base/zmClass"
import ZMLabel from "./zmLabel"
import ZMButton from "./zmButton"
import ZMColor from "../common/zmColor"

export default class ZMPanel extends ZMClass{
    closeButton=null;//关闭按钮
    title=null;//显示标题的控件
    isShowTitle=null;//是否显示标题栏
    titleHeight=40;//标题栏高度
    constructor(argP, argWH){
        super(argP, argWH);
        this.titleHeight = 40;
        this.initTitle();
        this.hideTitle();
    }
    initTitle(){
        this.isShowTitle=true;
        this.title=new ZMLabel({x:0,y:0}).setSize({width:this.size.width,height:this.titleHeight})
            .setBGColor(ZMColor.blue).setFontSize(27).setTextBaseline("middle").setFontType("bold").setTextPos({x:20,y:0});
        this.closeButton=new ZMButton({x:this.size.width-60,y:0},{width:60,height:this.titleHeight})
            .setBGColor(ZMColor.white);
        this.closeButton.buttonLabel.setText("关闭").setFontColor(ZMColor.red).setFontSize(22);
        this.closeButton.onClick=function(){
            this.parent.visible=false;
            this.parent.onCloseButtonClick&&this.parent.onCloseButtonClick();
            return true;
        };
        this.addControlInLast([this.title,this.closeButton]);
    }
    hideTitle(){
        if(this.isShowTitle){
            this.isShowTitle = false;
            this.title.visible = false;
            this.closeButton.visible = false;
            for (var i = 0; this.controls.length; i++){
                this.controls[i].relativePosition.y -= this.titleHeight;
            }
        }
    }
    showTitle(title){
        this.title.setText(title);
        if(!this.isShowTitle){
            for (var i = 0; i < this.controls.length; i++){
                this.controls[i].relativePosition.y += this.titleHeight;
            }
            this.isShowTitle = true;
            this.title.visible = true;
            this.closeButton.visible = true;
        }
    }
    onCloseButtonClick=null;
    clearControls(){
        super.clearControls();
        this.initTitle();
        this.hideTitle();
    }
}