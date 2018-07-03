/**
 * Created by zhangmiao on 2018/6/27.
 */

import ZMFunction from "./common/zmFunction"
import ZMForm from "./components/zmForm"
import ZMResourceData from "./common/zmResourceData"
import MainScene from "./feature/main/mainScene"

var NetService = require("./net/netService");

const screenWidth    = window.innerWidth;
const screenHeight   = window.innerHeight;

export default class Main {
    constructor(){
        this.aniId = null;//动画的id
        this.mainScene = null;
        this.startGame();
    }
    startGame(){
        let self = this;
        let promise = new Promise((resolve)=>{
            ZMFunction.preLoadData("", function(){
                resolve();
            })
        });
        promise.then(function(){
            JMain.JForm = new ZMForm({width: screenWidth, height: screenHeight}).setBGImage(ZMResourceData.Images.bg1);
            JMain.JForm.visible =true;
            JMain.JForm.clearControls();
            self.loop();//启动画面循环
            self.loginGame();
        });
    }
    loop(){
        var self = this;
        if(this.aniId != null) window.cancelAnimationFrame(this.aniId);
        JMain.JForm.show();
        self.aniId = window.requestAnimationFrame(self.loop.bind(self), canvas);
    }
    loginGame(){
        let  self = this;
        new Promise((resolve) => {
            wx.login({
                success:function(res){
                    resolve(res.code)
                }
            })
        }).then(function(loginCode){
            return new Promise((resolve) => {
                let url = 'https://www.lovelijing.top/login/?loginCode='+loginCode + "&isSimulator="+ (window.navigator.platform == 'devtools' ? "1" : "0");
                wx.request({
                    url: url,
                    header:{
                        'content-type': 'application/json'
                    },
                    success: function(res){
                        let uid = parseInt(res.data.uid);
                        resolve(uid);
                    }
                })
            });
        }).then(function(uid){
            //可以开启网络服务了
            let netService = new NetService(uid);
            JMain.netService = netService;
            return new Promise((resolve) => {
                netService.addOnConnectedCallback("Main", function(){
                    netService.sendData({
                        cmd:0x101,
                        success: function(){
                            ZMNotificationCenter.postNotificationName("onHandShakeNty",null);
                            resolve();//这个只有
                        }
                    });
                });
                netService.connect({
                    //"url" : "wss://www.lovelijing.top",
                    "url" : "ws://127.0.0.1:30000",
                    success : function(){console.log("连接建立成功");},
                    fail:function(){console.log("请求链接失败");},
                    complete:function(err){console.log("链接请求回来", err);}
                });
            });

        }).then(function(){
            console.log("MainScene:",MainScene);
            if(self.mainScene) return;
            self.mainScene = new MainScene({width:screenWidth, height:screenHeight});
            JMain.JForm.addControlInLast([self.mainScene]);
        });
    }

}
