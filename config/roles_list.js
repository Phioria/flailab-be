// Role Permissions
// Admin:
// View Tracks
// Edit Tracks, Delete Tracks that anyone uploaded
// Add Tracks with no required fields
//
// Editor:
// View Tracks
// Can edit and delete the tracks that they uploaded but not others
// Add tracks with required fields
//
// User:
// View Tracks

const ROLES_LIST = {
    Admin: 2600,
    Editor: 1999,
    User: 1500,
};

module.exports = ROLES_LIST;
