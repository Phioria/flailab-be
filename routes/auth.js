const express = require('express');
const router = express.Router();
const { handleLogin, requestPasswordReset, validatePasswordResetToken, updateUserPassword } = require('../controllers/authController');

router.route('/').post(handleLogin);

// todo should there be a slash after recover?
// todo should we make this links more obscure? lols
router.route('/revocer/').post(requestPasswordReset);

router.route('/:id/:token').get(validatePasswordResetToken);

router.route('/teser/').post(updateUserPassword);

module.exports = router;
