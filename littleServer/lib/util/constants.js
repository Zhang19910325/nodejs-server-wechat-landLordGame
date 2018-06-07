/**
 * Created by zhangmiao on 2018/4/27.
 */

module .exports = {
    KEYWORDS : {
        BEFORE_FILTER: '__befores__',
        AFTER_FILTER: '__afters__',
        SERVER_MAP: '__serverMap__',
        SERVER_STARTER_ID : "__startId__"
    },
    FILEPATH: {
        MASTER: '/config/master.json',
        SERVER: '/config/servers.json',
        CRON: '/config/crons.json',
        LOG: '/config/log4js.json',
        SERVER_PROTOS: '/config/serverProtos.json',
        CLIENT_PROTOS: '/config/clientProtos.json',
        MASTER_HA: '/config/masterha.json',
        LIFECYCLE: '/lifecycle.js',
        SERVER_DIR: '/app/servers/',
        CONFIG_DIR: '/config',
        CERT_DIR:'/cert',
        CERT_KEY:"/cert/private.pem",
        CERT_PATH:'/cert/file.crt',
        HANDLE_DISPATCHER :'/dispatcher.js',
    },
    HANDLERFUN:{
      HANDLE_MESSAGE : 'handleMessage'
    },
    DIR: {
        HANDLER: 'handler',
        REMOTE: 'remote',
        CRON: 'cron',
        LOG: 'logs',
        SCRIPT: 'scripts',
        EVENT: 'events',
        COMPONENT: 'components'
    },

    LIFECYCLE: {
        BEFORE_STARTUP: 'beforeStartup',
        BEFORE_SHUTDOWN: 'beforeShutdown',
        AFTER_STARTUP: 'afterStartup',
        AFTER_STARTALL: 'afterStartAll'
    },
    RESERVED : {
        BASE: 'base',
        MAIN: 'main',
        CPU: 'cpu',
        MASTER: 'master',
        SERVERS: 'servers',
        ENV: 'env',
        ENV_DEV: 'development',
        ENV_PRO: 'production',
        ALL: 'all',
        SERVER_TYPE: 'serverType',
        START: 'start',
        AFTER_START: 'afterStart',
        CURRENT_SERVER: 'curServer',
        SERVER_ID : 'serverId',
        CERT_OPTIONS : 'certOptions',
        KEY_PATH : 'keyPath',
        CERT_PATH : 'certPath',
        ERROR_HANDLER: 'errorHandler',
        CONNECTOR : 'connector',
        ROUTE :"route",
        ROUTE_PORT:"routePort"
        //certOptions
    }
};