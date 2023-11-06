const jwt = require('jsonwebtoken');
const { TokenExpiredError, JsonWebTokenError } = jwt;

const catchError = (err, res) => {
    if (err instanceof TokenExpiredError) {
        return res.status(403).json({
            // The front end will be looking for this 403 code to know when to refresh
            message: 'Unauthorized! Access Token was expired.',
        });
    } else if (err instanceof JsonWebTokenError) {
        return res.sendStatus(401);
    }
    return res.sendStatus(401);
};

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.sendStatus(401);
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return catchError(err, res);
        }
        // Determined by the structure of the access token
        // Setup in refreshTokenController.js
        req.user = decoded.UserInfo.username;
        req.roles = decoded.UserInfo.roles;

        next();
    });
};

module.exports = verifyJWT;
