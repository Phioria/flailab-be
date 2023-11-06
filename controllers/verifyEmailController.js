// Controller to verify new users with generated tokens sent via Email
const db = require('../models');
const Users = db.user;

const handleVerification = async (req, res) => {
    // Since the route that uses this function specifically
    // must have an id and token, we should be good to skip
    // checking if it exists.
    const { id, token } = req.params;
    const foundUser = await Users.findOne({ where: { uid: id } });

    if (!foundUser) return res.sendStatus(401);
    if (foundUser.isVerified === true) {
        return res.status(204).json({ message: 'Verified' });
    }
    if (foundUser.email_token !== token) {
        return res.sendStatus(401);
    } else {
        foundUser.isVerified = true;
        foundUser.email_token = '';
        await foundUser.save();
        logger.log('info', `[handleVerification] - USER: [${foundUser.username}] has been verified`);
        return res.status(204).json({ message: 'Verified' });
    }
};

module.exports = { handleVerification };
