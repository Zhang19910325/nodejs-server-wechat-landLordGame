/**
 * Created by zhangmiao on 2018/6/20.
 */
var PORT = 50000;
var http=require('http');
var https=require('https');
var url = require("url");


var uidMap = {};//openId - > uid
var simulatorMap = {};//openId - > uid
var exsitUids = [];

var getOptions = function(params){
    return {
        host: 'api.weixin.qq.com',
        port: '443',
        path: '/sns/jscode2session'+"?" +param(params),
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    };
};


function cleanArray(actual) {
    const newArray = []
    for (let i = 0; i < actual.length; i++) {
        if (actual[i]) {
            newArray.push(actual[i])
        }
    }
    return newArray
}

function param(json) {
    if (!json) return ''
    return cleanArray(Object.keys(json).map(key => {
        if (json[key] === undefined) return '';
        return encodeURIComponent(key) + '=' +
            encodeURIComponent(json[key])
    })).join('&')
}


var server = http.createServer(function(req, res){
    if(req.method == "GET"){
        //GET请求
        var urlObj = url.parse(req.url, true);
        var pathname = urlObj.pathname;
        var query = urlObj.query;
        var loginCode =  query.loginCode;
        var isSimulator = (query.isSimulator == "1" || query.isSimulator == 1);
        var params = {};
        params.appid = 'wx3f1cea6346e2005e';
        params.secret = "da9251f37e555144c5983ca1cb77571b";
        params.grant_type = "authorization_code";
        params.js_code = loginCode;
        //console.log("getOptions:", getOptions(params));
        reqOpenId(params, (err, rspObj)=>{
            if(err) res.end();
            var openId = rspObj.openid;
            var session_key = rspObj.session_key;
            var uid;
            if(isSimulator){
                if(simulatorMap.hasOwnProperty(openId)) {
                    uid = simulatorMap[openId];
                }else {
                    uid = randomLong() + "";
                    simulatorMap[openId] = uid;
                }
            }else {
                if(uidMap.hasOwnProperty(openId)) {
                    uid = uidMap[openId];
                }else {
                    uid = randomLong() + "";
                    uidMap[openId] = uid
                }
            }
            var rsp = {};
            rsp.uid = uid;
            res.write(JSON.stringify(rsp));
            res.end();
        });
    }
});

randomLong = function () {
    var i = 0;
    var rand;
    do{
        rand = parseInt(Math.random() * 0xffffffffffff + 1);
        i++;
    }while(i <= 200 && exsitUids.indexOf(rand) >= 0);
    exsitUids.push(rand);
    return rand;
};

var reqOpenId = function(params, cb){
    const req = https.request(getOptions(params), (res) => {
        console.log('statusCode:', res.statusCode);
        console.log('headers:', res.headers);
        console.log('res.data:', res.data);
        res.on('data', (d) => {
            var rspJson = JSON.parse(d+"");
            var openid = rspJson.openid;
            var session_key = rspJson.session_key;
            cb(null, rspJson);
        });
    });

    req.on('error', (e) => {
        cb(e);
    });
    req.end();
}

server.listen(PORT);