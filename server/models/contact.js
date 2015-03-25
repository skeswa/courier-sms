var Sequelize = require('sequelize');

var MODEL_ID = 'Contact';

var model = undefined;
module.exports = {
    id: MODEL_ID,
    model: function(db) {
        if (!model) {
            model = db.define(MODEL_ID, {
                name:   Sequelize.STRING,
                number: Sequelize.STRING
            });
        }
        return model;
    },
    relate: function(models) {
        var Contact = models[MODEL_ID],
            User    = models.User;
        // A contact has an owner
        Contact.belongsTo(User, {
            as: 'owner'
        });
    }
};
