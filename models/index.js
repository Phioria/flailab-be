const Sequelize = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.record = require('./Record')(sequelize, Sequelize);
db.user = require('./User')(sequelize, Sequelize);

sequelize.sync({});

module.exports = db;
