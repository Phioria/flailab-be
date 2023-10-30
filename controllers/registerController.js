const db = require('../models');
const Users = db.user;
const bcrypt = require('bcrypt');
const { sendMail } = require('../utils/mailer');
const randomBytes = require('randombytes');
const { PORT, BASE_URL } = require('../config/serverInfo');

const handleNewUser = async (req, res) => {
    const { user, pwd, firstName, lastName } = req.body;
    console.log(req.body);
    // If any fields are missing, render signup page with error message
    // This shouldn't ever happen since validation is happening on the front end,
    // But just in case...
    if (!user || !pwd || !firstName || !lastName) {
        console.log('Missing Data Error');
        return res.sendStatus(400);
    }

    // Check for duplicate usernames in the database
    const duplicate = await Users.findOne({ where: { username: user } });
    if (duplicate) {
        console.log('Duplicate User Error');
        return res.sendStatus(409); // (409) = conflict
    }
    try {
        console.log('Success!');
        // Encrypt and salt the password
        const hashedPwd = await bcrypt.hash(pwd, 10);
        // Store the new user
        const newUser = {
            username: user,
            password: hashedPwd,
            first_name: firstName,
            last_name: lastName,
            email_token: randomBytes(16).toString('hex'),
            email_token_exp: Date.now() + 1000 * 60 * 20, // 20 minutes from now
        };

        const createdUser = await Users.create(newUser);

        // This should be the port and url of the front end, not back end
        const port = process.env.PORT || PORT;

        const tokenLink = `${BASE_URL}:${port}/verify-email/${createdUser.uid}/${createdUser.email_token}`;

        // Added await here, sendMail() is an async function, so it returns a promise
        await sendMail(createdUser.username, createdUser.first_name, tokenLink);

        return res.sendStatus(201);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const sendVerificationEmail = async (req, res) => {
    const { user } = req.body;

    if (!user) return res.sendStatus(400);

    const foundUser = await Users.findOne({ where: { username: user } });

    if (!foundUser) return res.sendStatus(401);

    if (foundUser.isVerified === true) return res.sendStatus(204);

    try {
        const emailToken = randomBytes(16).toString('hex');
        const tokenExpiration = Date.now() + 1000 * 60 * 20; // 20 minutes from now

        // Should be front end port...in the future, this will likely be omitted
        const port = 3000;

        const emailTokenLink = `${BASE_URL}:${port}/verify-email/${foundUser.uid}/${emailToken}`;

        try {
            await foundUser.update({ email_token: emailToken, email_token_exp: tokenExpiration });
            await sendMail(foundUser.username, foundUser.first_name, emailTokenLink);
            return res.sendStatus(201);
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

module.exports = { handleNewUser, sendVerificationEmail };
