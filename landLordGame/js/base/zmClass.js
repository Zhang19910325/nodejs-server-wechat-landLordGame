/**
 * Created by zhangmiao on 2018/5/31.
 * 元基础类
 */
import ZMColor from '../common/zmColor';
import ZMFunction from  '../common/zmFunction'

let idCounter = 0;

export default class ZMClass{
    rotationStep=null; //旋转步伐
    showImageData= null; //该对象以及其子对象的缓存图片数据
    blockInvert=null;
    tag = -1;
    constructor(argP = {x:0,y:0} , argWH = {width:0, height:0}){
        this.ID = idCounter++;//对象标识，需唯一
        this.position = argP;//绝对位置{x:0,y:0}
        this.size = argWH;//对象长宽{width:0,height:0}
        this.BGColorAlpha = 1.0;//背景颜色透明度
        this.BGImageAlpha = 1.0;//背景透明度
        this.moveStep = {x:0, y:0};//移动步伐{x:0,y:0}
        this.fontColor = ZMColor.black;//字体颜色 默认黑
        this.textPos = {x:0, y:0};//文本位置
        this.alpha = 1.0;//透明度
        this.relativePosition = argP;//与父对象的相对位置
        this.controls = [];//子对象数组
        this.parent = null;//父对象
        this.enabled = true;
        this.visible = true;
        this.canMove = true;//是否可移动

        var self = this;
        this.__defineGetter__("width", function(){
            return  self.size.width;
        });
        this.__defineGetter__("height", function(){
            return  self.size.height;
        })
    }
    setPosition(position){
        this.position = position;
        return this;
    }
    setTag (tag){
        this.tag = tag;
        return this;
    }
    getTag(){
        return this.tag;
    }
    setSize(size){
        this.size = size;
        return this;
    }
    setBGColor(bgColor) {//设置背景颜色
        this.BGColor = bgColor;
        return this;
    }
    setBGImage(image) {//设置背景图片
        //console.log("image:",image, "data", image.data);
        this.BGImage = image.data;
        //this.BGImage.src = image.path;
        this.BGImagePosition={x:0,y:0};
        this.BGImageSize={width:image.cellSize.width,height:image.cellSize.height};
        return this;
    }
    setRelativePosition(relativePosition) {//设置与父对象的相对位置
        this.relativePosition = relativePosition;
        return this;
    }

    setFocus(){//获取焦点
        if(JMain.JFocusControl)JMain.JFocusControl.lostFocus();
        this.focus=true;
        JMain.JFocusControl=this;
        if(this.onFocus)this.onFocus();
    }
    onFocus = null;
    lostFocus(){//失去焦点
        this.focus=false;
        JMain.JFocusControl=null;
    }
    pointInBlock(e, _this){
        if (!_this)_this = this;
        return e.x >= _this.position.x
            && e.x < _this.position.x + _this.size.width
            && e.y >= _this.position.y
            && e.y < _this.position.y + _this.size.height;
    }
    onClick=null;//自定义点击事件
    onControlClick(position){//点击对象时
        if (!this.visible || !this.enabled)return false;
        for (var i = this.controls.length - 1; i >= 0; i--) {
            if (this.controls[i].pointInBlock(position, this.controls[i])
                && this.controls[i].onControlClick.call(this.controls[i], position)) return true;
        }
        return this.onClick && this.onClick()
    }
    addControlInLast(aObj) {//把对象数组aObj加在子对象数组后面
        for(var i = 0; i < aObj.length; i++){
            if (aObj[i]) {
                var length = this.controls.length;
                this.controls[length] = aObj[i];
                this.controls[length].parent = this;
                if(this.position){
                    this.controls[length].position = {x:this.position.x + this.controls[length].relativePosition.x,
                        y:this.position.y + this.controls[length].relativePosition.y};
                }
            }
        }
    }
    removeControl(objID) {//根据对象名称删除子对象数组中的对象
        for (var i = 0; i < this.controls.length; i++) {
            if (objID == this.controls[i].ID) {
                this.controls.splice(i,1);
                break;
            }
        }
    }
    remove () {//删除当前对象
        if (this.parent) {
            this.parent.removeControl.call(this.parent, this.ID);
        } else {
            this.ID = null;
        }
    }
    clearControls() {//清空子对象数组
        this.controls = [];
    }
    saveShowImageData() {//保存该对象以及其子对象的缓存图片数据
        var w = parseInt(this.size.width * JMain.JZoom.x), h = parseInt(this.size.height * JMain.JZoom.y);
        var relativePosition = this.relativePosition;
        var parent = this.parent;
        this.parent = null;
        this.relativePosition = {x:0, y:0};
        JMain.JForm.canvas.width = w;
        JMain.JForm.canvas.height = h;
        this.showImageData = null;
        this.show();
        this.showImageData = ZMFunction.getImageData(JMain.JForm.context, this.relativePosition, {width:w, height:h});
        this.parent = parent;
        this.relativePosition = relativePosition;
        JMain.JForm.canvas.width = parseInt(JMain.JForm.size.width * JMain.JZoom.x);
        JMain.JForm.canvas.height = parseInt(JMain.JForm.size.height * JMain.JZoom.y);
    }
    beginShow() {//显示该对象前执行
        this.position.x = this.relativePosition.x;
        this.position.y = this.relativePosition.y;
        if (this.parent) {
            this.position.x += this.parent.position.x;
            this.position.y += this.parent.position.y;
        }
    }
    showing(x, y, w, h){//显示该对象时执行
        for (var member = 0; member < this.controls.length; member++) {
            this.controls[member].show.call(this.controls[member]);
        }
        if (!this.enabled) {
            var imageData = ZMFunction.getImageData(JMain.JForm.context, {x:x, y:y},{width:w, height:h});
            ZMFunction.drawImageData(JMain.JForm.context, ZMFunction.changeToGray(imageData), {x:x, y:y});
        }
    }
    endShow() {//显示该对象后执行
        if (this.rotationStep) {
            this.blockAngle += this.rotationStep;
            this.blockAngle = this.blockAngle % 360;
        }
        if (this.canMove && this.moveStep) {
            this.relativePosition.x += this.moveStep.x;
            this.relativePosition.y += this.moveStep.y;
        }
    }
    show() {//显示该对象
        this.beginShow();
        if (this.visible&&this.size) {
            if (this.showImageData) {//如果有缓存数据，直接绘图
                ZMFunction.drawImageData(JMain.JForm.context, this.showImageData,
                    {x:parseInt(this.position.x * JMain.JZoom.x), y:parseInt(this.position.y * JMain.JZoom.y)});
            } else {
                var _context = JMain.JForm.context;
                if (this.ID == null)return;
                var x = parseInt(this.position.x * JMain.JZoom.x);
                var y = parseInt(this.position.y * JMain.JZoom.y);
                var w = parseInt(this.size.width * JMain.JZoom.x);
                var h = parseInt(this.size.height * JMain.JZoom.y);
                if (_context) {
                    if(this.alpha<1){//设置画布透明度
                        _context.save();
                        _context.globalAlpha=this.alpha;
                    }
                    if(this.blockInvert){//翻转画布
                        _context.save();
                        _context.translate(x + parseInt(w / 2),0);
                        _context.scale(-1, 1);
                        _context.translate((x + parseInt(w / 2))*-1,0);
                    }
                    if(this.blockAngle){//旋转画布
                        _context.save();
                        _context.translate(x + parseInt(w / 2), y + parseInt(h / 2));
                        x = -parseInt(w / 2);
                        y = -parseInt(h / 2);
                        _context.rotate(this.blockAngle * Math.PI / 180);
                    }
                    if (this.BGColor) {//绘制背景颜色
                        _context.save();
                        _context.globalAlpha=this.alpha*this.BGColorAlpha;
                        _context.fillStyle = this.BGColor.data;
                        _context.fillRect(x, y, w, h);
                        _context.restore();
                    }
                    if (this.BGImage) {//绘制背景图片
                        _context.save();
                        _context.globalAlpha=this.alpha*this.BGImageAlpha;
                        _context.drawImage(this.BGImage, this.BGImagePosition.x, this.BGImagePosition.y, this.BGImageSize.width,
                            this.BGImageSize.height, x, y, w, h);
                        _context.restore();
                    }
                    this.showing&&this.showing(x, y, w, h);//如果有showing事件，则执行该事件
                    if(this.blockAngle) _context.restore();//如果画布有旋转则恢复到旋转前状态
                    if(this.blockInvert){//如果画布有翻转则恢复到翻转前状态
                        _context.translate(JMain.JForm.size.width-x - parseInt(w / 2),0);
                        _context.scale(-1, 1);
                        _context.translate((JMain.JForm.size.width-x - parseInt(w / 2))*-1,0);
                        _context.restore();
                    }
                    if(this.alpha<1)_context.restore();//恢复画布透明度
                }
            }
        }
        this.endShow();
    }
}
