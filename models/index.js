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
/*db.emailToken = require('./EmailToken')(sequelize, Sequelize);

db.emailToken.belongsTo(db.user, {
    foreignKey: 'uid',
    targetKey: 'uid',
});

db.user.hasOne(db.emailToken, {
    foreignKey: 'uid',
    targetKey: 'uid',
});
*/

sequelize.sync({ alter: true });

module.exports = db;
