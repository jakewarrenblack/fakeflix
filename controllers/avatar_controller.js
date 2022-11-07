const Avatar = require("../models/avatar_schema").model;

const viewAll = (req, res) => {
  throw new Error("Not yet implemented");
};

const createData = (req, res) => {
  // console.log(req.body);
  let avatarData = req.body;

  Avatar.create(avatarData)
    .then((data) => {
      console.log("New Avatar Created!", data);
      res.status(201).json(data);
    })
    .catch((err) => {
      if (err.name === "ValidationError") {
        console.error("Validation Error!!", err);
        res.status(422).json({
          msg: "Validation Error",
          error: err.message,
        });
      } else {
        console.error(err);
        res.status(500).json(err);
      }
    });
};

module.exports = {
  viewAll,
  createData,
};
