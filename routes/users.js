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
    viewAvatars, verifyAdmin, getProfileByEmail, addToMyList
} = require("../controllers/user_controller");

router
    .post("/register", register)

    // .post('/register', (req, res) => {
    //     //res.redirect(307, '/charge');
    // })

    .post("/login", login)
    // Make sure a user/child is editing themselves only
    // An admin can edit their sub users or themselves

    // ? makes the param optional
    // like deleting, if no ID passed, user is editing themselves
    // if an ID is passed, only permitted if user is an admin
    .put("/edit/:id?", [loginRequired, adminRequired], editProfile)

    /*
     If a non-admin requests this, without passing an ID, they delete themselves
     If a non-admin passes an ID here, that's not allowed, they're trying to delete somebody else
     If an admin passes an ID, check if that user belongs to them, if so, approve, otherwise fail
     If an admin doesn't pass an ID, they're deleting themselves, delete all their users as well
     */
    .delete("/delete/:id?", [loginRequired, adminRequired], deleteProfile)
    .get("/profile/", loginRequired, viewProfile)
    // View admin and all related users
    .get("/manageProfiles/:id", loginRequired, manageProfiles)
    // A user's favourite Titles, these are real object ID references, so we can run .populate on the list
    .get("/viewMyList", loginRequired, viewMyList)
    .get("/avatars", loginRequired, viewAvatars)
    .post("/verifyAdmin", verifyAdmin)
    .post("/getProfileByEmail", getProfileByEmail)
    .post("/getProfileById", loginRequired, getProfileById)
    .post("/addToMyList", loginRequired, addToMyList);

module.exports = router;
