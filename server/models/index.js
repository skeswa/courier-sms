var fs      = require('fs'),
    path    = require('path'),
    async   = require('async');

var log     = require('../log');

exports.model = function(db, callback) {
    var models = {};
    fs.readdir(__dirname, function(err, files) {
        if (err) callback(err);
        else {
            async.each(files, function(file, modelCallback) {
                try {
                    if (file !== 'index.js' && (file.indexOf('.js', file.length - 3) !== -1)) {
                        var modelModule = require(path.join(__dirname, file));
                        if (modelModule && modelModule.model) {
                            log.debug('Loading model defined in ' + file);
                            models[modelModule.id] = modelModule.model(db);
                        }
                    }
                    modelCallback();
                } catch (err) {
                    modelCallback(err);
                }
            }, function(err) {
                if (err) callback(err);
                else {
                    async.each(files, function(file, relateCallback) {
                        try {
                            if (file !== 'index.js' && (file.indexOf('.js', file.length - 3) !== -1)) {
                                var modelModule = require(path.join(__dirname, file));
                                if (modelModule && modelModule.relate) {
                                    log.debug('Relating model defined in ' + file);
                                    modelModule.relate(models);
                                }
                            }
                            relateCallback();
                        } catch (err) {
                            relateCallback(err);
                        }
                    }, function(err) {
                        if (err) callback(err);
                        else {
                            callback(undefined, models);
                        }
                    });
                }
            });
        }
    });
};
