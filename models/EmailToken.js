// Token model
// Using references to establish the model that the token is connected to
// ever token will include the userId
module.exports = (sequelize, Sequelize) => {
    const EmailToken = sequelize.define('emailToken', {
        id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        uid: {
            type: Sequelize.UUID,
            allowNull: false,
            onUpdate: 'cascade',
            onDelete: 'cascade',
            references: { model: 'users', key: 'uid' },
        },
        token: {
            type: Sequelize.STRING,
        },
    });
    return EmailToken;
};
