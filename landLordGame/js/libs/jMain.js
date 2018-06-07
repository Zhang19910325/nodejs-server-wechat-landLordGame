/**
 * Created by zhangmiao on 2018/6/1.
 */

let JMain  = window.JMain;
if (!JMain) {
    JMain = {
        JZoom:{x:1.0, y:1.0},
        JFocusControl : null,
        JForm:null,
        JTick:null,
        JID:0,
        pokerSize : {width: 70, height:80},
        netService : null
    }
}
window.JMain = JMain;