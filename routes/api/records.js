const express = require('express');
const router = express.Router();
const {
    getAllRecords,
    createMultipleRecords,
    getRecord,
    updateRecord,
    updateRecords,
    deleteRecord,
    deleteRecords,
} = require('../../controllers/recordController');
const ROLES_LIST = require('../../config/roles_list');
const verifyRoles = require('../../middlewares/verifyRoles');

router
    .route('/')
    .get(getAllRecords)
    .post(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), createMultipleRecords)
    .put(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), updateRecords)
    .delete(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), deleteRecords);

router
    .route('/:id')
    .get(getRecord)
    .put(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), updateRecord)
    .delete(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), deleteRecord);

module.exports = router;
