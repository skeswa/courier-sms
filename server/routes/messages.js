var fs          = require('fs'),
    path        = require('path'),
    sequelize   = require('sequelize'),
    jwt         = require('jsonwebtoken'),
    async       = require('async'),
    bcrypt      = require('bcrypt');

var log         = require('../log'),
    env         = require('../env'),
    xmpp        = require('../xmpp'),
    util        = require('../util');

exports.route = function(app) {
    app.get('/api/messages/:contactId', function(req, res) {
        var Message     = req.models.Message;

        var userId      = req.user.id,
            contactId   = parseInt(req.params.contactId),
            limit       = parseInt(req.query.limit) || 20,
            offset      = parseInt(req.query.offset) || 0;

        if (isNaN(contactId)) return res.status(400).json({
            message: 'The "contactId" parameter was invalid'
        });

        Message.findAll({
            where: {
                senderId: userId,
                contactId: contactId
            },
            order: [['createdAt', 'DESC']],
            limit: limit,
            offset: offset
        }).then(function(messages) {
            var sanitizedMessages = messages.map(function(message) {
                return {
                    text: message.messageText,
                    type: message.messageType,
                    timeSent: message.createdAt
                };
            });
            return res.status(200).json(sanitizedMessages);
        }).catch(function(err) {
            log.error('Could not fetch messages:', err);
            return res.status(500).json({
                message: 'Could not fetch messages due to an internal error'
            });
        });
    });

    app.post('/api/messages/:contactId', function(req, res) {
        var Message = req.models.Message,
            Contact = req.models.Contact;

        var userId      = req.user.id,
            contactId   = parseInt(req.params.contactId),
            text        = req.body.text,
            type        = 'in'; // This route only receives incoming messages

        if (isNaN(contactId)) return res.status(400).json({
            message: 'The "contactId" parameter was invalid'
        });
        else if (!util.is.string(text) || text.length < 1 || text.length > 160) return res.status(400).json({
            message: 'The "text" field was invalid (probably too short or too long)'
        });

        Contact.findOne(contactId).then(function(contact) {
            Message.create({
                messageText: text,
                messageType: type,
                contactId: contactId,
                senderId: userId
            }).then(function() {
                xmpp.notify(req.user, contact, text);
                return res.status(200).send();
            }).catch(function(err) {
                log.error('Could not create a message', err);
                return res.status(500).json({
                    message: 'Could not create & send the message due to an internal server error'
                });
            });
        }).catch(function(err) {
            return res.status(400).json({
                message: 'Could not find a contact matching the the "contactId" given'
            });
        });

    });
};
