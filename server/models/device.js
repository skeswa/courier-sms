var Sequelize = require('sequelize');

var MODEL_ID = 'Device';

var model = undefined;
module.exports = {
    id: MODEL_ID,
    model: function(db) {
        if (!model) {
            model = db.define(MODEL_ID, {
                os:     Sequelize.STRING,
                model:  Sequelize.STRING,
                name:   Sequelize.STRING,
                number: Sequelize.STRING
            });
        }
        return model;
    },
    relate: function(models) {
        var Device  = models[MODEL_ID],
            User    = models.User;
        // A contact has an owner
        Device.belongsTo(User, {
            as: 'owner'
        });
    }
};
