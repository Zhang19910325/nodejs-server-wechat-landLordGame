/**
 * Created by zhangmiao on 2018/6/7.
 */

import ZMClass from "../base/zmClass"
import ZMLabel from "./zmLabel"
import ZMButton from "./zmButton"
import ZMColor from "../common/zmColor"
import ZMResourceData from "../common/zmResourceData"

let curId = 1;
export default class ZMToast extends ZMClass{
    btnArr = [];//{Array<object{text,onclick}>}
    titleHeight=40;//标题栏高度
    constructor(argP, argWH, opts){
        super(argP, argWH);

        opts = opts || {};
        this.opts = opts;
        this.title = opts.title || "";
        this.setBGColor(ZMColor.white);//设置为灰色的背景
        this.BGColorAlpha = 0.6;
        this.initTitle();
    }
    initTitle(){
        this.titleLabel = new ZMLabel({x:0,y:20});
        this.titleLabel.setSize({width:this.size.width,height:this.titleHeight});
        this.titleLabel.setFontSize(27);
        this.titleLabel.setTextBaseline("middle");
        this.titleLabel.setFontType("bold");
        this.titleLabel.setText(this.title);
        this.titleLabel.setTextPos({x:20,y:0});

        this.addControlInLast([this.titleLabel]);
    }
    addBtnByTextAndClick(text, onClick){
        var btnObject = {
            text: text,
            onClick: onClick
        };
        this.btnArr.push(btnObject);
    }
    beginShow(){
        var self = this;
        let length = this.btnArr.length;
        let width = 70;
        let space = 20;
        let offset = (this.width - length*70 - (length - 1)*space)/2;
        for (let index = 0; index < length; index++){
            let btnObject = this.btnArr[index];
            let btn = btnObject.btn;
            if(btn) continue;
            btn  = new ZMButton({x:offset + (space+width)*index,y:this.size.height-60}, {width:width,height:50}).setBGImage(ZMResourceData.Images.btn);
            btnObject.btn = btn;
            btn.setBGColor(ZMColor.red);
            btn.setText(btnObject.text);
            btn.onClick = function(){
                btnObject.onClick && btnObject.onClick(self, btn);
                self.remove();
                JMain.JForm.show();
            };
            this.addControlInLast([btn]);
        }
        super.beginShow();
    }
}