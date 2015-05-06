var express         = require('express'),
    http            = require('http'),
    https           = require('https'),
    // General purpose imports
    fs              = require('fs'),
    path            = require('path'),
    async           = require('async'),
    // Express specific imports
    morgan          = require('morgan'),
    expressJWT      = require('express-jwt'),
    bodyParser      = require('body-parser');

var routes          = require('./routes'),
    xmpp            = require('./xmpp'),
    db              = require('./db'),
    util            = require('./util'),
    env             = require('./env'),
    log             = require('./log');

// Create the server instance
var app = express();
// Strap up the request logger
app.use(morgan('dev'));
// Reads JSON request bodies
app.use(bodyParser.json());
// Reads formdata request bodies
app.use(bodyParser.urlencoded({
    extended: true
}));

async.series([
    function(callback) {
        callback(env.init());
    },
    function(callback) {
        // Setup the database
        db.setup(app, callback);
    },
    function(callback) {
        // Start the XMPP server
        xmpp.start();
        callback();
    },
    function(callback) {
        // Authorization control
        app.use(expressJWT({
            secret: env.get().tokenSecret
        }).unless({
            path: [
                '/api/authenticate',
                '/api/register'
            ]
        }));
        // Error handling middleware
        app.use(function (err, req, res, next) {
            if (err.name === 'UnauthorizedError') {
                res.status(401).json({
                    message: 'A valid token is required to interact with this endpoint'
                });
            } else {
                res.status(500).json({
                    message: 'An unexpected server issue occurred'
                });
            }
        });
        // Continue
        callback();
    },
    function(callback) {
        // Perform server routing
        routes.route(app, callback);
    },
    function(callback) {
        // Load SSL stuff
        var key     = fs.readFileSync(env.get().tlsKeyPath, 'utf-8'),
            cert    = fs.readFileSync(env.get().tlsCertPath, 'utf-8');
        // Start servicing the requests
        var httpServer  = http.createServer(app),
            httpsServer = https.createServer({
                key:    key,
                cert:   cert
            }, app);
        httpServer.listen(env.get().httpPort);
        httpsServer.listen(env.get().httpsPort);
        callback();
    }
], function(err) {
    if (err) {
        log.error('Server could not start', err);
    } else {
        log.info('Server is listening on ' + env.get().httpPort + ' for HTTP, on ' + env.get().httpsPort + ' for HTTPS, and on ' + env.get().xmppPort + ' for XMPP\n');
    }
});
