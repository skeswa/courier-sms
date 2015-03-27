var xmpp            = require('node-xmpp-server'),
    ltx             = require('node-xmpp-core').ltx,
    bcrypt          = require('bcrypt'),
    Hashtable       = require('hashtable'),
    EventEmitter    = require('events').EventEmitter;

var sms = require('./sms'),
    env = require('./env'),
    db  = require('./db'),
    log = require('./log');

var server          = undefined,
    clientMap       = new Hashtable();

function parse(stanza, emitter) {
    // console.log('Stanza:\t\t', stanza.root().toString());
    if (stanza.root().is('iq')) {
        var iqType  = stanza.root().attrs.type,
            iqId    = stanza.root().attrs.id,
            iqTo    = stanza.root().attrs.to,
            iqFrom  = stanza.root().attrs.from;
        // Read the child elements
        if (stanza.root().children.length >= 1) {
            var child = stanza.root().children[0];
            if (child.nodeName === 'query') {
                if (iqType === 'get') {
                    emitter.emit('getter', iqId, iqTo, iqFrom, child.attrs.xmlns);
                } else if (iqType === 'set') {
                    emitter.emit('setter', iqId, iqTo, iqFrom, child.attrs.xmlns, child.children);
                } else {
                    log.error('Intercepted an XMPP query of an unknown type "' + iqType + '"');
                }
            }
        }
    } else if (stanza.root().is('presence')) {
        // TODO handle presence for real
        emitter.emit('presence', stanza.root().children);
    } else if (stanza.root().is('message')) {
        var messageType  = stanza.root().attrs.type,
            messageFrom  = stanza.root().attrs.from,
            messageTo    = stanza.root().attrs.to;
        // Read the message body
        var body = stanza.root().getChild('body');
        if (body && body.children && body.children.length > 0) {
            // TODO distinguish "chat" and "normal" message types
            emitter.emit('message', messageTo, messageFrom, body.children[0]);
        } else {
            // TODO Handle states like 'active' and 'composing'
        }
    } else {
        log.error('Unexpected stanza received', stanza.root(), stanza.root().toString());
    }
}

function error(client, to, from) {
    var root = new ltx.Element('message', {
        to: to,
        from: from,
        type: 'error'
    });
    root.c('error', {
        type: 'cancel'
    }).c('service-unavailable', {
        xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'
    });
    log.debug('Sending error to client: ' + root.toString());
    client.send(root);
}

module.exports = {
    notify: function(user, contact, text) {
        var client = clientMap.get(user.id);
        if (client) {
            var from = contact.number + '@courier.sms',
                to = user.email;
            var message = new ltx.Element('message', {
                from: from,
                to: to,
                type: 'chat'
            });
            message.c('body').t(text);
            message.c('active', {
                xmlns: 'http://jabber.org/protocol/chatstates'
            });
            log.debug('NOTIFY', message.toString());
            client.send(message);
        } else {
            log.debug('Could not notify client for user id', user.id, '- no such client exists');
        }
    },
    start: function() {
        server = new xmpp.C2SServer({
            port: env.xmppServer
        });

        server.on('connect', function(client) {
            var clientUser  = undefined,
                emitter     = new EventEmitter();

            client.on('authenticate', function(opts, cb) {
                var User        = db.models.User;
                var email       = opts.jid.user + '@' + opts.jid.domain,
                    password    = opts.password;

                User.findAll({
                    where: {
                        email: email
                    }
                }).then(function(users) {
                    if (users.length < 1) {
                        return cb('Authentication failed');
                    } else {
                        var user = users[0];
                        bcrypt.compare(password, user.password, function(err, same) {
                            if (err || !same) {
                                return cb('Authentication failed');
                            } else {
                                clientUser = user;
                                clientMap.put(user.id, client);
                                log.debug('User \"' + clientUser.name + '\" has connected');
                                return cb(null, opts);
                            }
                        });
                    }
                }).catch(function(err) {
                    log.error('User findAll FAILED', users);
                    cb(err);
                });
            });

            // Handle data requests from user's client
            emitter.on('getter', function(id, to, from, topic) {
                log.debug('Getter with id ' + id + ' and topic ' + topic + ' received');
                // Build the response IQ
                var res = (new ltx.Element('iq'));
                res.attr('id', id);
                res.attr('to', from);
                res.attr('from', to);
                res.attr('type', 'result');
                // Formulate a response
                switch (topic) {
                case 'jabber:iq:roster':
                    // Populate the response IQ
                    var query = res.c('query', {
                        xmlns: 'jabber:iq:roster'
                    });
                    // Get all user's contacts
                    db.models.Contact.findAll({
                        where: {
                            ownerId: clientUser.id
                        }
                    }).then(function(contacts) {
                        var contact;
                        for (var i = 0; i < contacts.length; i++) {
                            contact = contacts[i];
                            query.c('item', {
                                jid:    (contact.number + '@courier.sms'),
                                name:   contact.name
                            });
                        }
                        // Send the result back to the client
                        client.send(res);
                    });
                    break;
                }
            });

            // Handle incoming messages from user
            emitter.on('message', function(to, from, text) {
                var toNumber = to.split('@')[0];
                sms.send(clientUser.registrationId, toNumber, text, function(wasSuccessful) {
                    if (wasSuccessful) {
                        log.debug('Message was sent to ' + toNumber);
                    } else {
                        error(client, from, to);
                    }
                });
            });

            client.on('stanza', function(stanza) {
                parse(stanza, emitter);
            });

            client.on('disconnect', function() {
                if (clientUser) {
                    log.debug('User \"' + clientUser.name + '\" has disconnected');
                    clientMap.remove(clientUser.id);
                    clientUser = undefined;
                }
            });
        });
    }
};
