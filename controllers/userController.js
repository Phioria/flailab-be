const db = require('../models');
const Users = db.user;
const logger = require('../utils/logger');

const getAllUsers = async (req, res) => {
    // Return only the necessary fields
    const users = await Users.findAll({ attributes: { exclude: ['password', 'refresh_token', 'email_token'] } });
    if (!users) return res.status(204).json({ message: 'No users found' });
    return res.status(200).json(users);
}; // End getAllUsers function

const updateUserRoles = async (req, res) => {
    const { id } = req.params;
    const roles = req.body;

    const foundUser = await Users.findByPk(id);
    if (!foundUser) {
        logger.log('info', `[updateUserRoles] - !WARNING! - No User found associated with ID: ${id}`);
        return res.sendStatus(400);
    }

    await foundUser
        .update({ roles: roles })
        .then(() => {
            logger.log('info', `[updateUserRoles] - USER: [${foundUser.username}] has been given these roles: ${JSON.stringify(roles)}`);
            return res.sendStatus(204);
        })
        .catch((err) => {
            logger.log('error', `[updateUserRoles] - ${err.message}`);
            return res.status(500).json({ message: err.message });
        });
}; // End updateUserRoles function

const deleteUser = async (req, res) => {
    const { id } = req.params;
    const foundUser = await Users.findByPk(id);
    if (!foundUser) return res.sendStatus(204);
    await foundUser
        .destroy()
        .then(() => {
            logger.log('info', `[deleteUser] - USER: [${foundUser.username}] has been deleted`);
            return res.sendStatus(204);
        })
        .catch((err) => {
            logger.log('error', `[deleteUser] - ${err.message}`);
            return res.status(500).json({ message: err.message });
        });
}; // End deleteUser function

module.exports = { getAllUsers, deleteUser, updateUserRoles };
