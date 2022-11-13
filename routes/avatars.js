const express = require("express");
const router = express.Router();
const {loginRequired} = require("../controllers/auth_controller");
const {createData, viewAll, updateAvatar, deleteAvatar} = require("../controllers/avatar_controller");
// Object with methods inside it
const imageUpload = require('../utils/image_upload')

// Can't view avatars without logging in
router
    .get("/all", loginRequired, viewAll)
    .post("/", [imageUpload.single("file"), loginRequired], createData)
    .put("/:id", loginRequired, updateAvatar)
    .delete("/:id", loginRequired, deleteAvatar);

module.exports = router;
