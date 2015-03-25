var gcm = require('node-gcm');

var env = require('./env.js'),
    log = require('./log');

var sender = new gcm.Sender(env.get().gcmKey);

module.exports = {
    send: function(registrationId, to, text, cb) {
        var message = new gcm.Message({
            data: {
                to:     to,
                text:   text
            }
        });

        sender.send(message, [registrationId], function(err, result) {
            if (err) {
                log.error('Failed to send GCM message to registration id "' + registrationId + '":', err, result);
                cb(false);
            } else if (result && result.failure > 0) {
                log.error('Failed to send GCM message to registration id "' + registrationId + '":', result);
                cb(false);
            } else {
                cb(true);
            }
        });
    }
};
