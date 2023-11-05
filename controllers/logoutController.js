const Users = require('../models').user;
const logger = require('../utils/logger');

const handleLogout = async (req, res) => {
    // On client side, also delete the accessToken

    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204); // No content
    const refreshToken = cookies.jwt;

    // Is refreshToken in db?
    try {
        const foundUser = await Users.findOne({
            where: { refresh_token: refreshToken },
        });
        if (!foundUser) {
            res.clearCookie('jwt', {
                httpOnly: true,
                sameSite: 'None',
                secure: true,
            });
            logger.log('info', '[handleLogout] - No USER found associated with attached JWT');
            return res.sendStatus(204);
        }

        // Delete refresh token in db
        // ! Is this syntax correct for sequelize?
        foundUser.refresh_token = '';
        await foundUser.save();

        logger.log('info', `[handleLogout] - USER [${foundUser.username}] has logged out`);
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
        return res.sendStatus(204);
    } catch (err) {
        logger.log('error', `[handleLogout] - ${err.message}`);
        return res.status(500).json({ message: err.message });
    }
};

module.exports = { handleLogout };
