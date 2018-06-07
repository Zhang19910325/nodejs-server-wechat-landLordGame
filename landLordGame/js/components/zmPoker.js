/**
 * Created by zhangmiao on 2018/6/4.
 */

import ZMClass from "../base/zmClass"
import ZMResourceData from "../common/zmResourceData"

export default class ZMPoker extends ZMClass{
    isHidePoker = true;
    constructor(imageName, size = JMain.pokerSize){
        super({x:0,y:0},size);
        this.imageData=ZMResourceData.Images[imageName];
        this.pokerNumber=this.imageData.num;
        this.seNumber = this.imageData.se;
        this.isSelected = false;
        this.onClick = this.onclick.bind(this);
    }
    beginShow(){
        super.beginShow();
        if(this.isHidePoker) this.setBGImage(ZMResourceData.Images.BeiMian)
        else this.setBGImage(this.imageData);
    }
    onclick(){
        if(this.parent.toSelectPoker){
            this.isSelected = !this.isSelected;
            JMain.JForm.show();
            return true;
        }
        return false;
    }
}