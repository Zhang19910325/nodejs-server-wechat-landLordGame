/**
 * Created by zhangmiao on 2018/5/9.
 */
var fs = require("fs");
var path = require("path");

module.exports.load = function(mpath, context){
    if(!mpath){
        throw new Error("load path 不能为空");
    }

    try {
        mpath = fs.realpathSync(mpath);
    }catch (err){
        throw err;
    }

    if(!isDir(mpath)){
        throw new Error('path 必须是路径');
    }
    return loadPath(mpath, context);
};

var loadFile = function (fp, context) {
    var m = requireUncached(fp);
    if(!m){
        return;
    }

    if (typeof m === "function"){
        m = m(context);
    }

    return m;
};


module.exports.loadFile = loadFile;


var loadPath = function(path, context) {
    var files = fs.readdirSync(path);
    if (files.length == 0){
        console.warn('path:'+path+" 没有需要加载的文件");
        return;
    }

    if (path.charAt(path.length - 1) !== '/'){
        path += "/";
    }

    var fp, m, res = {};
    files.forEach(function(fn){
        fp = path + fn;

        if (!isFile(fp) || !checkFileType(fn, '.js')) return;

        m = loadFile(fp, context);

        if(!m) return;

        var name = m.name || getFileName(fn, '.js'.length);
        res[name] = m;
    });

    return res;
};


var getFileName = function(fp, suffixLength) {
    var fn = path.basename(fp);
    if(fn.length > suffixLength) {
        return fn.substring(0, fn.length - suffixLength);
    }

    return fn;
};

var checkFileType = function(fn, suffix) {
    if(suffix.charAt(0) !== '.') {
        suffix = '.' + suffix;
    }

    if(fn.length <= suffix.length) {
        return false;
    }

    var str = fn.substring(fn.length - suffix.length).toLowerCase();
    suffix = suffix.toLowerCase();
    return str === suffix;
};


var isFile = function(path) {
    return fs.statSync(path).isFile();
};

var isDir = function(path) {
    return fs.statSync(path).isDirectory();
};

var requireUncached = function(module){
    delete require.cache[require.resolve(module)];
    return require(module)
};