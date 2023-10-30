const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController');
const ROLES_LIST = require('../../config/roles_list');
const verifyRoles = require('../../middlewares/verifyRoles');

router.route('/').get(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), userController.getAllUsers);

router.route('/:id').put(verifyRoles(ROLES_LIST.Admin), userController.updateUserRoles).delete(verifyRoles(ROLES_LIST.Admin), userController.deleteUser);

module.exports = router;
