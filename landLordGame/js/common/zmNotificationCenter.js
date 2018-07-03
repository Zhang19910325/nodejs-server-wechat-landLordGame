/**
 * Created by zhangmiao on 2018/6/28.
 * 通知管理中心
 */

import ZMClass from "../base/zmClass"

let ZMNotificationCenter  = window.ZMNotificationCenter;
if (!ZMNotificationCenter) {
    class notifyService {
        nameMap ={}; //name -> map : {ID -> {observer, selector, name}};
        idMap = {}; //ID -> arr [name1, name2]
        addObserver(observer, selector, name){
            if(!(observer instanceof ZMClass)){
                console.warn("observer:",observer,"注册ZMNotifyCenter失败,不是ZMClass的实例");
                return;
            }
            let ID = observer.ID;
            let item = {observer, selector, name};
            //添加idMap
            if(!this.idMap[ID]) this.idMap[ID] = [];
            if(this.idMap[ID].indexOf(name) > -1){
                console.warn("observer:",observer,"已经注册了name:",name,"不能重复注册");
                return;
            }
            this.idMap[ID].push(name);

            //添加nameMap
            if(!this.nameMap[name]) this.nameMap[name] = {};
            this.nameMap[name][ID] = item;
        }
        removerObserver(observer){
            if(!(observer instanceof ZMClass)){
                console.warn("observer:",observer,"不是ZMClass的实例");
                return;
            }
            let ID = observer.ID;
            let self = this;
            if(!this.idMap[ID]) return;
            this.idMap[ID].map((name)=>{
                if(self.nameMap[name]){
                    delete self.nameMap[name][ID];
                }
            });
            delete this.idMap[ID];
        }
        postNotificationName(name,info){
            let map = this.nameMap[name];
            for (var ID in map){
                let item = map[ID];
                let observer = item.observer;
                let selector = item.selector;
                if(typeof selector === 'function'){
                    selector(info);
                }else if(typeof observer[selector] === 'function'){
                    observer[selector](info);
                }
            }
        }

    }
    ZMNotificationCenter = (function(){
        return new notifyService;
    })();
}
window.ZMNotificationCenter = ZMNotificationCenter;
