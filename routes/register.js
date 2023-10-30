const express = require('express');
const router = express.Router();
const { handleNewUser, sendVerificationEmail } = require('../controllers/registerController');
const { validateUserEmail } = require('../controllers/authController');

// define routes
router.route('/').post(handleNewUser);

router.route('/resend/').post(sendVerificationEmail);

router.route('/:id/:token').get(validateUserEmail);

// export router
module.exports = router;
