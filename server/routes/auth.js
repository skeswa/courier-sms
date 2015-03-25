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
    app.get('/api/me', function(req, res) {
        if (!req.user) {
            res.status(500).json({
                message: 'Could not find your user information'
            });
        } else {
            res.status(200).json({
                id:         req.user.id,
                name:       req.user.name,
                email:      req.user.email,
                pictureUrl: req.user.pictureUrl
            });
        }
    });

    app.post('/api/register', function(req, res) {
        var User            = req.models.User;
        var name            = req.body.name,
            email           = req.body.email,
            password        = req.body.password,
            registrationId  = req.body.registrationId,
            pictureUrl      = req.body.pictureUrl,
            invalid         = function(field) {
                res.status(400).json({
                    message: 'The "' + field + '" field was missing or invalid'
                });
            },
            ambiguousError  = function(err) {
                log.error('User creation failed', err);
                res.status(500).json({
                    message: 'Could not create User due to internal issue'
                });
            };
        if (!util.is.string(name) || name.length < 1 || name.length > 254) return invalid('name');
        if (!util.is.email(email) || email.length > 254) return invalid('email');
        if (!util.is.string(password) || password.length < 1 || password.length > 254) return invalid('password');
        if (!util.is.string(registrationId) || registrationId.length < 1 || registrationId.length > 254) return invalid('registrationId');
        if (!util.is.string(pictureUrl) || pictureUrl.length < 1 || pictureUrl.length > 254) return invalid('pictureUrl');
        User.count({
            where: {
                email: email
            }
        }).then(function(count) {
            if (count > 0) return res.status(400).json({
                message: 'The provided email is already taken'
            });

            bcrypt.hash(password, 10, function(err, hashedPassword) {
                if (err) {
                    return ambiguousError(err);
                } else {
                    User.create({
                        name: name,
                        email: email,
                        password: hashedPassword,
                        registrationId: registrationId,
                        pictureUrl: pictureUrl
                    }).then(function(user) {
                        var token = jwt.sign(user, env.get().tokenSecret, {
                            expiresInMinutes: (60 * 24)
                        });
                        res.status(200).json({
                            token: token
                        });
                    }).catch(function(err) {
                        ambiguousError(err);
                    });
                }
            });
        }).catch(function(err) {
            ambiguousError(err);
        });
    });

    app.post('/api/authenticate', function(req, res) {
        var email           = req.body.email,
            password        = req.body.password,
            registrationId  = req.body.registrationId,
            User            = req.models.User,
            invalid         = function(field) {
                res.status(400).json({
                    message: 'The "' + field + '" field was missing or invalid'
                });
            },
            deny  = function() {
                res.status(401).json({
                    message: 'User authentication failed'
                });
            };

        if (!util.is.email(email) || email.length > 254) return invalid('email');
        if (!util.is.string(password) || password.length < 1 || password.length > 254) return invalid('password');

        User.findAll({
            where: {
                email: email
            }
        }).then(function(users) {
            if (users.length < 1) {
                return deny();
            } else {
                var user = users[0];
                bcrypt.compare(password, user.password, function(err, same) {
                    if (err || !same) {
                        return deny();
                    } else {
                        var token = jwt.sign(user, env.get().tokenSecret, {
                            expiresInMinutes: (60 * 24)
                        });

                        if (util.is.string(registrationId) && registrationId.length > 1 && registrationId.length < 254 && user.registrationId !== registrationId) {
                            user.registrationId = registrationId;
                            user.save()
                                .then(function() {
                                    return res.status(200).json({
                                        token: token
                                    });
                                })
                                .catch(function(err) {
                                    if (err) {
                                        log.error('Failed to persist registration id', err);
                                        return res.status(500).json({
                                            message: 'An unexpected internal exception has occurred - please try again later'
                                        });
                                    }
                                });
                        } else {
                            return res.status(200).json({
                                token: token
                            });
                        }
                    }
                });
            }
        }).catch(function(err) {
            log.error('Could not execute the find users query', err);
            return deny();
        });
    });
};
