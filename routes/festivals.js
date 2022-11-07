const express = require("express");
const router = express.Router();
const { loginRequired } = require("../controllers/auth_controller");

const {
  readData,
  readOne,
  createData,
  updateData,
  deleteData,
} = require("../controllers/festival_controller");

router
  .get("/", readData)
  // Makes them all protected routes expect root
  // makes this a 'router level' middleware
  .get("/:id", loginRequired, readOne)
  .post("/", createData)
  .put("/:id", loginRequired, updateData)
  .delete("/:id", loginRequired, deleteData);

module.exports = router;
