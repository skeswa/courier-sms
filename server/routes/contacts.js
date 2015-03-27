var fs          = require('fs'),
    path        = require('path'),
    sequelize   = require('sequelize'),
    jwt         = require('jsonwebtoken'),
    async       = require('async'),
    bcrypt      = require('bcrypt');

var log         = require('../log'),
    env         = require('../env'),
    util        = require('../util');

exports.route = function(app) {
    app.get('/api/contacts', function(req, res) {
    });

    app.post('/api/contacts', function(req, res) {
    });
};
