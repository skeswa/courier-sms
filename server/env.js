var util = require('./util');

var ENV_DEV             = 'DEV',
    ENV_VERBOSE         = 'VERBOSE',
    ENV_HTTP_PORT       = 'HTTP_PORT',
    ENV_HTTPS_PORT      = 'HTTPS_PORT',
    ENV_XMPP_PORT       = 'XMPP_PORT',
    ENV_SESSION_SECRET  = 'SESSION_SECRET',
    ENV_DB_CONN_STRING  = 'DB_CONN_STRING',
    ENV_TOKEN_SECRET    = 'TOKEN_SECRET',
    ENV_TLS_KEY_PATH    = 'TLS_KEY_PATH',
    ENV_TLS_CERT_PATH   = 'TLS_CERT_PATH',
    ENV_GCM_KEY         = 'GCM_KEY';

var env = {
    dev:            undefined,
    verbose:        undefined,
    httpPort:       undefined,
    httpsPort:      undefined,
    xmppPort:       undefined,
    sessionSecret:  undefined,
    dbConnString:   undefined,
    tokenSecret:    undefined,
    tlsKeyPath:     undefined,
    tlsCertPath:    undefined,
    gcmKey:         undefined
};

var initialized = false;

function missing(variable) {
    return 'The "' + variable + '" was invalid or undefined';
}

module.exports = {
    init: function() {
        if (util.is.bool(process.env[ENV_DEV])) env.dev = process.env[ENV_DEV] === 'true' ? true : false;
        else return missing(ENV_DEV);
        if (util.is.bool(process.env[ENV_VERBOSE])) env.verbose = process.env[ENV_VERBOSE] === 'true' ? true : false;
        else return missing(ENV_VERBOSE);
        if (util.is.number(process.env[ENV_HTTP_PORT])) env.httpPort = parseInt(process.env[ENV_HTTP_PORT]);
        else return missing(ENV_HTTP_PORT);
        if (util.is.number(process.env[ENV_HTTPS_PORT])) env.httpsPort = parseInt(process.env[ENV_HTTPS_PORT]);
        else return missing(ENV_HTTPS_PORT);
        if (util.is.number(process.env[ENV_XMPP_PORT])) env.xmppPort = parseInt(process.env[ENV_XMPP_PORT]);
        else return missing(ENV_XMPP_PORT);
        if (util.is.string(process.env[ENV_SESSION_SECRET])) env.sessionSecret = process.env[ENV_SESSION_SECRET];
        else return missing(ENV_SESSION_SECRET);
        if (util.is.string(process.env[ENV_TOKEN_SECRET])) env.tokenSecret = process.env[ENV_TOKEN_SECRET];
        else return missing(ENV_TOKEN_SECRET);
        if (util.is.string(process.env[ENV_DB_CONN_STRING])) env.dbConnString = process.env[ENV_DB_CONN_STRING];
        else return missing(ENV_DB_CONN_STRING);
        if (util.is.string(process.env[ENV_GCM_KEY])) env.gcmKey = process.env[ENV_GCM_KEY];
        else return missing(ENV_GCM_KEY);
        if (util.is.string(process.env[ENV_TLS_KEY_PATH])) env.tlsKeyPath = process.env[ENV_TLS_KEY_PATH];
        else return missing(ENV_TLS_KEY_PATH);
        if (util.is.string(process.env[ENV_TLS_CERT_PATH])) env.tlsCertPath = process.env[ENV_TLS_CERT_PATH];
        else return missing(ENV_TLS_CERT_PATH);

        initialized = true;
    },
    get: function() {
        if (!initialized) {
            var err = undefined;
            if (err = module.exports.init()) {
                throw new Error(err);
            }
        }
        return env;
    }
};
