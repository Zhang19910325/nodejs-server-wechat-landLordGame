/**
 * Created by zhangmiao on 2018/6/1.
 */
import ZMClass from "../base/zmClass"
import ZMLabel from "./zmLabel"


export default class ZMForm extends ZMClass{
    constructor(size){
        super({x:0, y:0}, size);
        this.canvas = canvas;
        this.context = this.canvas.getContext('2d');
        this.scenesArr = [];
        var _top = 0,_left=0;
        var _op=this.canvas;
        while (_op != null){
            _top += _op.offsetTop;
            _left += _op.offsetLeft;
            _op = _op.offsetParent;
        }
        this.webPosition={x:_left, y:_top};
        this.setFocus();//主题窗获得焦点
        this.canvas.width = parseInt(this.size.width * JMain.JZoom.x);
        this.canvas.height = parseInt(this.size.height * JMain.JZoom.y);
        //添加点击事件

        this.touchHandler = this.touchEventHandler.bind(this)
        canvas.addEventListener('touchstart', this.touchHandler)
    }

    touchEventHandler(e){
        e.preventDefault();
        let x = e.touches[0].clientX;
        let y = e.touches[0].clientY;
        this.mousePosition = {x:x, y:y};
        this.onControlClick.call(this, this.mousePosition);
    }
}