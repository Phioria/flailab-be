const express = require('express');
const router = express.Router();
const {
    getAllRecords,
    createRecords,
    getRecord,
    getSomeRecords,
    updateRecords,
    deleteRecord,
    deleteRecords,
    searchSomeRecords,
} = require('../../controllers/recordController');
const ROLES_LIST = require('../../config/roles_list');
const verifyRoles = require('../../middlewares/verifyRoles');

router
    .route('/')
    .get(getAllRecords)
    .post(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), createRecords)
    .put(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), updateRecords)
    .delete(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), deleteRecords);

router.route('/:id').get(getRecord).delete(verifyRoles(ROLES_LIST.Admin, ROLES_LIST.Editor), deleteRecord);

router.route('/:limit/:offset').get(getSomeRecords).post(searchSomeRecords);

module.exports = router;
