const express = require('express');
const router = express.Router();
const { handleVerification } = require('../controllers/verifyEmailController');

// define routes
router.route('/:id/:token').get(handleVerification);

// export router
module.exports = router;
