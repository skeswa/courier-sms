var Sequelize = require('sequelize');

var MODEL_ID = 'User';

var model = undefined;
module.exports = {
    id: MODEL_ID,
    model: function(db) {
        if (!model) {
            model = db.define(MODEL_ID, {
                name:           Sequelize.STRING,
                email:          Sequelize.STRING,
                password:       Sequelize.STRING,
                registrationId: Sequelize.STRING,
                pictureUrl:     Sequelize.TEXT
            });
        }
        return model;
    }
};
