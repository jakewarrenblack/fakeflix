const express = require("express");
const router = express.Router();
const {loginRequired} = require("../controllers/auth_controller");

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
    // TODO: Implement recursive delete for admins
    .delete("/delete/:id", loginRequired, deleteProfile)
    .get("/profile/", loginRequired, viewProfile)
    .get("/manageProfiles/", loginRequired, manageProfiles)
    .get("/viewMyList", loginRequired, viewMyList)
    .get("/avatars", loginRequired, viewAvatars);

module.exports = router;
