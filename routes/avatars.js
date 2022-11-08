const express = require("express");
const router = express.Router();
const { loginRequired } = require("../controllers/auth_controller");

const { createData, viewAll } = require("../controllers/avatar_controller");

// Can't view avatars without logging in
router
  .get("/all", loginRequired, viewAll)
  //   .get("/:id", loginRequired, readOne)
  .post("/", createData);
//   .put("/:id", loginRequired, updateData)
//   .delete("/:id", loginRequired, deleteData);

module.exports = router;
