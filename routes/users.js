const express = require("express");
const router = express.Router();
const {loginRequired, adminRequired} = require("../controllers/auth_controller");

const {
    register,
    login,
    editProfile,
    deleteProfile,
    viewProfile,
    manageProfiles,
    viewMyList,
    viewAvatars,
} = require("../controllers/user_controller");

router
    .post("/register", register)
    .post("/login", login)
    .put("/edit/:id", loginRequired, editProfile)
    // If a non-admin requests this, without passing an ID, they delete themselves
    // If a non-admin passes an ID here, that's not allowed, they're trying to delete somebody else
    // If an admin passes an ID, check if that user belongs to them, if so, approve, otherwise fail
    // If an admin doesn't pass an ID, they're deleting themselves, delete all their users as well
    // ? makes the param optional
    .delete("/delete/:id?", [loginRequired, adminRequired], deleteProfile)
    .get("/profile/", loginRequired, viewProfile)
    .get("/manageProfiles/", loginRequired, manageProfiles)
    .get("/viewMyList", loginRequired, viewMyList)
    .get("/avatars", loginRequired, viewAvatars);

module.exports = router;
