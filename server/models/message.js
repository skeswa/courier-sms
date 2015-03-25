var Sequelize = require('sequelize');

var MODEL_ID = 'Message';

var model = undefined;
module.exports = {
    id: MODEL_ID,
    model: function(db) {
        if (!model) {
            model = db.define(MODEL_ID, {
                messageText:    Sequelize.TEXT,
                messageType:    Sequelize.ENUM('in', 'out')
            });
        }
        return model;
    },
    relate: function(models) {
        var Message = models[MODEL_ID],
            User    = models.User,
            Device  = models.Device,
            Contact = models.Contact;
        // A message has an owner
        Message.belongsTo(User, {
            as: 'sender'
        });
        // A message has an contact
        Message.belongsTo(Contact, {
            as: 'contact'
        });
        // A message has a device
        Message.belongsTo(Device, {
            as: 'device'
        });
    }
};
