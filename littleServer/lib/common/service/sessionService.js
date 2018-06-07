/**
 * Created by zhangmiao on 2018/5/7.
 */
var EventEmitter = require("events").EventEmitter;
var util = require("util");
var utils = require("../../util/utils");
var SendPacket = require("../model/sendPacket");

var FRONTEND_SESSION_FIELDS = ['id', 'frontendId', 'uid', '__sessionService__', 'name', "SendPacket"];
var EXPORTED_SESSION_FIELDS = ['id', 'frontendId', 'uid', 'settings', 'name', "SendPacket"];

var ST_INITED = 0;
var ST_CLOSED = 1;

var SessionService = function(opts){
    opts = opts || {};
    this.singleSession = opts.singleSession;
    this.sessions = {};  //sid -> session sessionId
    this.uidMap = {};  // uid -> session 用户id
};

module.exports = SessionService;

SessionService.prototype.create = function(sid, frontendId, socket){
    var session = new Session(sid, frontendId, socket, this);
    this.sessions[session.id] = session;
    return session;
};

SessionService.prototype.bind = function(sid, uid, cb){
    var session = this.sessions[sid];
    if(!session){
        process.nextTick(function(){
            cb(new Error("不存在这样的session, sid: "+ sid));
        });
        return;
    }

    if(session.uid){
        if(session.uid === uid){//已经绑定了相同的uid
            cb(new  Error('session 早已经绑定了 uid : ' + uid ));
            return;
        }

        //绑定了不同的uid
        process.nextTick(function(){
            cb(new  Error('session 早已经绑定了 uid : ' + session.uid ));
        });
        return;
    }

    var sessions = this.uidMap[uid];

    if(!!this.singleSession && !!sessions){
        process.nextTick(function() {
            cb(new Error('singleSession is enabled, and session has already bound with uid: ' + uid));
        });
        return;
    }

    if(!sessions) {
        sessions = this.uidMap[uid] = [];
    }

    for(var i=0, l=sessions.length; i<l; i++) {
        // session has binded with the uid
        if(sessions[i].id === session.id) {
            process.nextTick(cb);
            return;
        }
    }
    sessions.push(session);

    session.bind(uid);

    if(cb) {
        process.nextTick(cb);
    }
};

SessionService.prototype.unbind = function(sid, uid, cb) {
    var session = this.sessions[sid];

    if(!session) {
        process.nextTick(function() {
            cb(new Error('session does not exist, sid: ' + sid));
        });
        return;
    }

    if(!session.uid || session.uid !== uid) {
        process.nextTick(function() {
            cb(new Error('session has not bind with ' + session.uid));
        });
        return;
    }

    var sessions = this.uidMap[uid], sess;
    if(sessions) {
        for(var i=0, l=sessions.length; i<l; i++) {
            sess = sessions[i];
            if(sess.id === sid) {
                sessions.splice(i, 1);
                break;
            }
        }

        if(sessions.length === 0) {
            delete this.uidMap[uid];
        }
    }
    session.unbind();

    if(cb) {
        process.nextTick(cb);
    }
};

SessionService.prototype.get = function(sid) {
    return this.sessions[sid];
};


SessionService.prototype.getByUid = function(uid) {
    return this.uidMap[uid];
};


SessionService.prototype.remove = function(sid) {
    var session = this.sessions[sid];
    if(session) {
        var uid = session.uid;
        delete this.sessions[session.id];

        var sessions = this.uidMap[uid];
        if(!sessions) {
            return;
        }

        for(var i=0, l=sessions.length; i<l; i++) {
            if(sessions[i].id === sid) {
                sessions.splice(i, 1);
                if(sessions.length === 0) {
                    delete this.uidMap[uid];
                }
                break;
            }
        }
    }
};

SessionService.prototype.import = function(sid, key, value, cb) {
    var session = this.sessions[sid];
    if(!session) {
        utils.invokeCallback(cb, new Error('session does not exist, sid: ' + sid));
        return;
    }
    session.set(key, value);
    utils.invokeCallback(cb);
};

SessionService.prototype.importAll = function(sid, settings, cb) {
    var session = this.sessions[sid];
    if(!session) {
        utils.invokeCallback(cb, new Error('session does not exist, sid: ' + sid));
        return;
    }

    for(var f in settings) {
        session.set(f, settings[f]);
    }
    utils.invokeCallback(cb);
};


SessionService.prototype.kick = function(uid, reason, cb) {
    // compatible for old kick(uid, cb);
    if(typeof reason === 'function') {
        cb = reason;
        reason = 'kick';
    }
    var sessions = this.getByUid(uid);

    if(sessions) {
        // notify client
        var sids = [];
        var self = this;
        sessions.forEach(function(session) {
            sids.push(session.id);
        });

        sids.forEach(function(sid) {
            self.sessions[sid].closed(reason);
        });

        process.nextTick(function() {
            utils.invokeCallback(cb);
        });
    } else {
        process.nextTick(function() {
            utils.invokeCallback(cb);
        });
    }
};


SessionService.prototype.kickBySessionId = function(sid, reason, cb) {
    if(typeof reason === 'function') {
        cb = reason;
        reason = 'kick';
    }

    var session = this.get(sid);

    if(session) {
        // notify client
        session.closed(reason);
        process.nextTick(function() {
            utils.invokeCallback(cb);
        });
    } else {
        process.nextTick(function() {
            utils.invokeCallback(cb);
        });
    }
};

SessionService.prototype.getClientAddressBySessionId = function(sid) {
    var session = this.get(sid);
    if(session) {
        var socket = session.__socket__;
        return socket.remoteAddress;
    } else {
        return null;
    }
};

SessionService.prototype.sendMessage = function(sid, msg) {
    var session = this.sessions[sid];

    if(!session) {
        return false;
    }

    return send(this, session, msg);
};

SessionService.prototype.sendMessageByUid = function(uid, msg) {
    var sessions = this.uidMap[uid];

    if(!sessions) {
        return false;
    }

    for(var i=0, l=sessions.length; i<l; i++) {
        send(this, sessions[i], msg);
    }
};

SessionService.prototype.forEachSession = function(cb) {
    for(var sid in this.sessions) {
        cb(this.sessions[sid]);
    }
};


SessionService.prototype.forEachBindedSession = function(cb) {
    var i, l, sessions;
    for(var uid in this.uidMap) {
        sessions = this.uidMap[uid];
        for(i=0, l=sessions.length; i<l; i++) {
            cb(sessions[i]);
        }
    }
};



var send = function(service, session, msg) {
    session.send(msg);

    return true;
};



var Session = function(sid, frontendId, socket, service){
    EventEmitter.call(this);
    this.id = sid;
    this.frontendId = frontendId;
    this.uid = null;
    this.settings = {};

    this.__socket__ = socket;
    this.__sessionService__ = service;
    this.__state__ = ST_INITED;
};

util.inherits(Session, EventEmitter);

Session.prototype.toFrontendSession = function() {
    return new FrontendSession(this);
};
Session.prototype.name = 'Session';

//Session.prototype
Session.prototype.bind = function(uid){
    this.uid = uid;
    this.emit('bind', uid);
};

Session.prototype.unbind = function(){
    var uid = this.uid;
    this.uid = null;
    this.emit("unbind", uid);
};

Session.prototype.set = function(key, value){
    if (utils.isObject(key)) {
        for (var i in key) {
            this.settings[i] = key[i];
        }
    } else {
        this.settings[key] = value;
    }
};

Session.prototype.remove = function(key){
    delete this[key];
};

Session.prototype.get = function(key){
    return this.settings[key];
};

Session.prototype.SendPacket = SendPacket;

Session.prototype.send = function(msg){
    this.__socket__.send(msg);
};

Session.prototype.closed = function(reason){
    if(this.__state__ === ST_CLOSED){
        return;
    }

    this.__state__ = ST_CLOSED;
    this.__sessionService__.remove(this.id);
    this.emit('closed', this.toFrontendSession(), reason);
    this.__socket__.emit('closing', reason);

    var self = this;

    process.nextTick(function(){
        self.__socket__.disconnect();
    })
};


var FrontendSession = function(session){
    EventEmitter.call(this);
    clone(session, this, FRONTEND_SESSION_FIELDS);

    this.settings = dclone(session.settings);
    this.__session__ = session;
};

util.inherits(FrontendSession, EventEmitter);

FrontendSession.prototype.bind = function(uid, cb) {
    var self = this;
    this.__sessionService__.bind(this.id, uid, function(err) {
        if(!err) {
            self.uid = uid;
        }
        utils.invokeCallback(cb, err);
    });
};

FrontendSession.prototype.unbind = function(uid, cb) {
    var self = this;
    this.__sessionService__.unbind(this.id, uid, function(err) {
        if(!err) {
            self.uid = null;
        }
        utils.invokeCallback(cb, err);
    });
};

FrontendSession.prototype.set = function(key, value) {
    this.settings[key] = value;
};

FrontendSession.prototype.get = function(key) {
    return this.settings[key];
};

FrontendSession.prototype.push = function(key, cb) {
    this.__sessionService__.import(this.id, key, this.get(key), cb);
};

FrontendSession.prototype.pushAll = function(cb) {
    this.__sessionService__.importAll(this.id, this.settings, cb);
};

FrontendSession.prototype.on = function(event, listener) {
    EventEmitter.prototype.on.call(this, event, listener);
    this.__session__.on(event, listener);
};

FrontendSession.prototype.export = function() {
    var res = {};
    clone(this, res, EXPORTED_SESSION_FIELDS);
    return res;
};

var clone = function(src, dest, includes) {
    var f;
    for(var i=0, l=includes.length; i<l; i++) {
        f = includes[i];
        dest[f] = src[f];
    }
};

var dclone = function(src) {
    var res = {};
    for(var f in src) {
        res[f] = src[f];
    }
    return res;
};