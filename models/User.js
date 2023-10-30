module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define('user', {
        uid: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            allowNull: false,
            primaryKey: true,
        },
        username: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        first_name: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        last_name: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        roles: {
            type: Sequelize.JSON,
            allowNull: false,
            defaultValue: {
                User: 1500,
            }, // From config/roles_list
        },
        isVerified: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        },
        refresh_token: {
            type: Sequelize.STRING,
        },
        email_token: {
            type: Sequelize.STRING,
        },
        // Storing Date.now(), so need bigint
        email_token_exp: {
            type: Sequelize.BIGINT,
        },
        reset_token: {
            type: Sequelize.STRING,
        },
        // Storing Date.now(), so need bigint
        reset_token_exp: {
            type: Sequelize.BIGINT,
        },
        password_can_be_reset: {
            type: Sequelize.BOOLEAN,
            deafult: false,
        },
    });
    return User;
};
