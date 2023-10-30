const Users = require('../models').user;

const handleLogout = async (req, res) => {
    // On client side, also delete the accessToken

    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204); // No content
    const refreshToken = cookies.jwt;

    // Is refreshToken in db?
    const foundUser = await Users.findOne({
        where: { refresh_token: refreshToken },
    });
    if (!foundUser) {
        res.clearCookie('jwt', {
            httpOnly: true,
            sameSite: 'None',
            secure: true,
        });
        return res.sendStatus(204);
    }

    // Delete refresh token in db
    // ! Is this syntax correct for sequelize?
    foundUser.refresh_token = '';
    const result = await foundUser.save();
    console.log(result);

    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
    return res.sendStatus(204);
};

module.exports = { handleLogout };
