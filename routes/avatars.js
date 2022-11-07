const express = require("express");
const router = express.Router();
const { loginRequired } = require("../controllers/auth_controller");

const { createData } = require("../controllers/avatar_controller");

router
  //   .get("/", readData)
  //   .get("/:id", loginRequired, readOne)
  .post("/", createData);
//   .put("/:id", loginRequired, updateData)
//   .delete("/:id", loginRequired, deleteData);

module.exports = router;
