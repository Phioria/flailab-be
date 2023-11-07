const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', (req, res) => res.download(path.join(__dirname, '.well-known', 'pki-validation', 'A79F0C2D9267B0594DF7BF112CCDE54C.txt')));

module.exports = router;
