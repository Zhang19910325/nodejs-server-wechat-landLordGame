/**
 * Created by zhangmiao on 2018/5/31.
 */

import ResourceData from "./zmResourceData"

export default {
    userInfo :null,
    Random(formNum, toNum){
        return parseInt(Math.random() * (toNum - formNum + 1) + formNum);
    },
    setLSData(key, jsonValue){
        window.localStorage.setItem(key, JSON.stringify(jsonValue));
    },
    getLSData(key){
        return JSON.parse(window.localStorage.getItem(key));
    },
    getNowTime(){
        let now = new Date();
        let year = now.getFullYear();       //年
        let month = now.getMonth() + 1;     //月
        let day = now.getDate();            //日
        let hh = now.getHours(); //时
        let mm = now.getMinutes();  //分
        //return year+"/"+month+"/"+day+" "+hh+":"+mm;
        return `${year}/${month}/${day} ${hh}:${mm}`;
    },
    preLoadData(url, cb){
        var loadedNum = 0;//已加载资源数量
        var resourceNum = 0;//资源数量
        var postAction = cb || function () {};//资源加载完成后的回调函数
        function imageLoadPost() {//每成功加载一个图片执行一次
            loadedNum++;
            if (loadedNum >= resourceNum) {//全部图片文件加载完后，继续加载声音
                loadedNum=0;
                resourceNum=0;
                postAction()
            }
        }
        function loadImage(){//加载图片
            for (var m2 in ResourceData.Images)  resourceNum++;
            if(resourceNum==0){
                imageLoadPost();
            }else{
                for (var m2 in ResourceData.Images) {
                    ResourceData.Images[m2].data = new Image();
                    ResourceData.Images[m2].data.src = url+ResourceData.Images[m2].path;
                    ResourceData.Images[m2].data.onload = function(){
                        imageLoadPost();
                    }
                }
            }

        }
        loadImage();
    },
    getCardIdByTypeAndVal(type, val){
        for (var m2 in ResourceData.Images) {
            if(ResourceData.Images[m2].se+"" === type && ResourceData.Images[m2].num === val){
                return ResourceData.Images[m2].id;
            }
        }
        return null
    },

    getPbCardInfoByCardId(id){
        var data = ResourceData.Images[id];
        if(data.se != undefined && data.num != undefined){
            return {
                type : data.se +"",
                val  : data.num
            }
        }
        return null
    },
    getImageData(_context, _point, _size){
        return _context.getImageData(_point.x, _point.y, _size.width, _size.height);
    },
    drawImageData(_context, _imgdata, _point, _dPoint, _dSize){
        if (!_dPoint)_dPoint = {x:0, y:0};
        if (!_dSize)_dSize = {width:_imgdata.width, height:_imgdata.height};
        _context.putImageData(_imgdata, _point.x, _point.y, _dPoint.x, _dPoint.y, _dSize.width, _dSize.height);
    },
    invert(_imgData){
        var imageData = _imgData;
        for (var i = 0; i < imageData.data.length; i += 4) {
            let red = imageData.data[i], green = imageData.data[i + 1], blue = imageData.data[i + 2], alpha = imageData.data[i + 3];
            imageData.data[i] = 255 - red;
            imageData.data[i + 1] = 255 - green;
            imageData.data[i + 2] = 255 - blue;
            imageData.data[i + 3] = alpha;
        }
        return imageData;
    },
    changeToGray(_imgData){
        var imageData = _imgData;
        for (var i = 0; i < imageData.data.length; i += 4) {
            let wb = parseInt((imageData.data[i] + 2*imageData.data[i + 1] + imageData.data[i + 2]) / 4);
            imageData.data[i] = wb;
            imageData.data[i + 1] = wb;
            imageData.data[i + 2] = wb;
        }
        return imageData;
    },
    changeToRed(_imgData){
        var imageData = _imgData;
        for (var i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] += 50;
            if (imageData.data[i] > 255) imageData.data[i] = 255;

        }
        return imageData;
    },
    rotate(_context, _imageData, angle){
        let returnData = _context.createImageData(_imageData.width, _imageData.height);
        let centerX = _imageData.width / 2.0;
        let centerY = _imageData.height / -2.0;
        let PI = 3.14159;
        for (let h = 0; h < returnData.height; h++) {
            for (let w = 0; w < returnData.width; w++) {
                let i = (_imageData.width * h + w) * 4;
                let newPoint = GetNewPoint({x:w, y:h * -1});
                let x = parseInt(newPoint.x);
                let y = parseInt(newPoint.y);
                if (x >= 0 && x < _imageData.width && -y >= 0 && -y < _imageData.height) {
                    let j = (_imageData.width * -y + x) * 4;
                    returnData.data[i] = _imageData.data[j];
                    returnData.data[i + 1] = _imageData.data[j + 1];
                    returnData.data[i + 2] = _imageData.data[j + 2];
                    returnData.data[i + 3] = _imageData.data[j + 3];
                }
            }
        }
        function GetNewPoint(_point) {
            let l = (angle * PI) / 180;
            let newX = (_point.x - centerX) * Math.cos(l) - (_point.y - centerY) * Math.sin(l);
            let newY = (_point.x - centerX) * Math.sin(l) + (_point.y - centerY) * Math.cos(l);
            return {x:newX + centerX, y:newY + centerY};
        }
        return returnData;
    },
    highLight(_imgData, n){
        var imageData = _imgData;
        for (var i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i]  = (imageData.data[i] +n)>255?255:(imageData.data[i] +n);
            imageData.data[i + 1] = (imageData.data[i+1] +n)>255?255:(imageData.data[i+1] +n);
            imageData.data[i + 2 ] = (imageData.data[i+2] +n)>255?255:(imageData.data[i+2] +n);
        }
        return imageData;
    },
    promiseGetUserInfo(){
        let self = this;
        return new Promise((resolve) => {
            if(self.userInfo) resolve(self.userInfo);
            else
            wx.getUserInfo({
                success: res => {
                    self.userInfo = res.userInfo;
                    resolve(self.userInfo);
                }
            })
        });
    }
}