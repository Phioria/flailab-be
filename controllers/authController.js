const Users = require('../models').user;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { updatePasswordLink } = require('../utils/mailer');
const randomBytes = require('randombytes');
const { PORT, BASE_URL } = require('../config/serverInfo');

const handleLogin = async (req, res) => {
    const { user, pwd } = req.body;
    if (!user || !pwd) return res.status(400).json({ message: 'Username and password are required.' });

    const foundUser = await Users.findOne({ where: { username: user } });
    if (!foundUser) return res.sendStatus(401); // Unauthorized

    // Check to see if the user's email address has been verified
    // Adding a reason: 'email' item to the return object
    // The front end should catch this and give the option to resend the verification link
    if (foundUser.isVerified === false) return res.status(401).json({ message: 'Email has not been verified', reason: 'email' });

    // Evaluate Password
    const match = await bcrypt.compare(pwd, foundUser.password);
    if (match) {
        // Create JWTs
        const roles = Object.values(foundUser.roles);
        const username = foundUser.username;
        const accessToken = jwt.sign(
            {
                UserInfo: {
                    username: username,
                    roles: roles,
                },
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '30m' } // 1800s
        );
        const refreshToken = jwt.sign(
            { username: username },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' } // 7d
        );
        // Save refreshToken with current user
        foundUser.refresh_token = refreshToken;
        const result = await foundUser.save();
        console.log(result);

        // Create Secure Cookies with refresh token
        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // Send authorization access token to user
        res.json({ username, roles, accessToken });
    } else {
        return res.sendStatus(401);
    }
};

const requestPasswordReset = async (req, res) => {
    const { user } = req.body;
    if (!user) return res.sendStatus(400);

    const foundUser = await Users.findOne({ where: { username: user } });
    if (!foundUser) return res.sendStatus(401); // Unauthorized

    // The basic idea is that we want to generate a random string of characters
    // Store that string in the user record under reset_token
    // Calculate an expiration time and also store that in the user record
    // Then email the link to the user

    // The controller to validate the token should check if the user exists based on the id param in the link
    // Then check if the token matches in the db
    // Then check if the token hasn't expired
    // If all those are good, send a positive response to the front end which should
    // Allow the user to access a form to submit a new password

    // Then the actual update password controller should receive that password
    // Check to make sure the user exists etc
    // Hash and salt the new password
    // Then save the new password in the user record and return a 200

    const resetToken = randomBytes(16).toString('hex');
    const tokenExpiration = Date.now() + 1000 * 60 * 20; // Now plus 20 minutes

    // This should be the url and port for the front end not the back end
    // const port = process.env.PORT || PORT;
    const port = 3000;

    const tokenLink = `${BASE_URL}:${port}/reset/${foundUser.uid}/${resetToken}`;

    await foundUser
        .update({ reset_token: resetToken, reset_token_exp: tokenExpiration })
        .then(() => {
            updatePasswordLink(user, tokenLink);
            return res.sendStatus(200);
        })
        .catch((err) => {
            return res.status(500).json({ message: err.message });
        });
};

const validatePasswordResetToken = async (req, res) => {
    const { id, token } = req.params;

    if (!id || !token) return res.sendStatus(400);

    const foundUser = await Users.findByPk(id);
    if (!foundUser) return res.sendStatus(401);

    // First check to see if token and exp are null to prevent any dumb fuckery
    if (foundUser.reset_token === null || foundUser.reset_token_exp === null) return res.sendStatus(401);

    // Make sure tokens match
    if (foundUser.reset_token !== token) return res.sendStatus(401);

    // Check if token has expired
    if (foundUser.reset_token_exp < Date.now()) return res.status(401).json({ message: 'Reset token expired. Please request new token' });

    // If we make it to this point, remove the reset_token and reset_token_exp
    // Also, set the password_can_be_reset field to true to keep people from bypassing the
    // Email validation before going to the password reset route
    await foundUser
        .update({ reset_token: null, reset_token_exp: null, password_can_be_reset: true })
        .then(() => {
            return res.sendStatus(200);
        })
        .catch((err) => {
            return res.status(500).json({ message: err.message });
        });
};

const updateUserPassword = async (req, res) => {
    const { id, pwd } = req.body;

    if (!id || !pwd) return res.sendStatus(400);

    const foundUser = await Users.findByPk(id);

    if (!foundUser) return res.sendStatus(401);

    // In case someone tries to get here without going through email validation first
    if (foundUser.password_can_be_reset !== true) return res.sendStatus(401);

    try {
        // Encrypt and salt the password
        const hashedPwd = await bcrypt.hash(pwd, 10);
        // Update the user's password
        await foundUser
            .update({ password: hashedPwd, password_can_be_reset: false })
            .then(() => {
                return res.sendStatus(200);
            })
            .catch((err) => {
                return res.status(500).json({ message: err.message });
            });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const validateUserEmail = async (req, res) => {
    const { id, token } = req.params;

    if (!id || !token) return res.sendStatus(400);

    const foundUser = await Users.findByPk(id);
    if (!foundUser) return res.sendStatus(401);

    // First check to see if token and exp are null to prevent any dumb fuckery
    if (foundUser.email_token === null || foundUser.email_token_exp === null) return res.sendStatus(401);

    // Check to see if user is already verified
    if (foundUser.isVerified === true) return res.sendStatus(204);

    // Make sure tokens match
    if (foundUser.email_token !== token) return res.sendStatus(401);

    // Check if token has expired
    if (foundUser.email_token_exp < Date.now()) return res.status(401).json({ message: 'Reset token expired. Please request new token' });

    // If we've made it to this point, go ahead and set isVerified to true and return
    try {
        await foundUser.update({ isVerified: true });
        return res.sendStatus(201);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

module.exports = { handleLogin, requestPasswordReset, validatePasswordResetToken, updateUserPassword, validateUserEmail };
