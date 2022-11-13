const express = require("express");
const router = express.Router();
const {loginRequired} = require("../controllers/auth_controller");
const {createData, viewAll} = require("../controllers/avatar_controller");
// Object with methods inside it
const imageUpload = require('../utils/image_upload')

// Can't view avatars without logging in
router
    .get("/all", loginRequired, viewAll)
    .post("/", imageUpload.single("file"), createData);
//   .put("/:id", loginRequired, updateData)
//   .delete("/:id", loginRequired, deleteData);

module.exports = router;
