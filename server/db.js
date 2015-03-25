var Sequelize   = require('sequelize');

var models      = require('./models'),
    env         = require('./env'),
    log         = require('./log');

var match   = env.get().dbConnString.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/),
    name    = match[5],
    user    = match[1],
    pass    = match[2],
    port    = match[4],
    host    = match[3],
    db      = new Sequelize(name, user, pass, {
        dialect:    'postgres',
        protocol:   'postgres',
        port:       port,
        host:       host,
        logging:    log.details
    });

module.exports = {
    setup: function(app, callback) {
        models.model(db, function(err, modelMap) {
            if (err) callback(err);
            else {
                // Synchronize with the database
                db.sync({}).then(function() {
                    // Attach models to exports
                    module.exports.models = modelMap;
                    // Add middleware to make models accessible in request object
                    app.use(function(req, res, next) {
                        req.models = modelMap;
                        next();
                    });
                    log.info('Database configuration completed');
                    callback();
                }).catch(function(err) {
                    callback(err);
                });
            }
        });
    }
};
