const express = require("express");
const router = express.Router();
const { loginRequired } = require("../controllers/auth_controller");

const {
  register,
  login,
  editProfile,
  deleteProfile,
  viewProfile,
  manageProfiles,
  viewMyList,
} = require("../controllers/user_controller");

router
  .post("/register", register)
  .post("/login", login)
  .put("/edit/:id", loginRequired, editProfile)
  .delete("/delete/:id", loginRequired, deleteProfile)
  .get("/profile/", loginRequired, viewProfile)
  .get("/manageProfiles/", loginRequired, manageProfiles)
  .get("/viewMyList", loginRequired, viewMyList);

module.exports = router;
