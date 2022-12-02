const express = require("express");
const router = express.Router();
const {loginRequired} = require("../controllers/auth_controller");
const {createData, viewAll, updateAvatar, deleteAvatar} = require("../controllers/avatar_controller");
// Object with methods inside it
const imageUpload = require('../utils/image_upload')

// LoginRequired on all of these paths, applied at the route level rather than individual paths
router
    .get("/all", viewAll)
    .post("/", imageUpload.single("file"),loginRequired, createData)
    // A user might optionally pass an image to upload when editing
    .put("/:id", imageUpload.single("file"), loginRequired,updateAvatar)
    .delete("/:id", loginRequired, loginRequired,deleteAvatar);

module.exports = router;
