const User = require("../models/user_schema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const register = (req, res) => {
  let newUser = new User(req.body);
  newUser.password = bcrypt.hashSync(req.body.password, 10);

  console.log(newUser);

  newUser.save((err, user) => {
    if (err) {
      return res.status(400).json({
        msg: err,
      });
    } else {
      user.password = undefined;
      return res.status(201).json(user);
    }
  });
};

const login = (req, res) => {
  User.findOne({
    email: req.body.email,
  })
    .then((user) => {
      if (!user || !user.comparePassword(req.body.password)) {
        res.status(401).json({
          msg: "Authentication failed. Invalid user or password",
        });
      } else {
        // token receives object, whatever you put here is encoded inside the token
        let token = jwt.sign(
          {
            email: user.email,
            name: user.name,
            _id: user._id,
          },
          process.env.APP_KEY
        );

        res.status(200).json({
          msg: "All good",
          // below outputs as 'token: token'
          token,
        });
      }
    })
    .catch((err) => {
      throw err;
    });
};

const editProfile = () => {
  throw new Error("Not yet implemented");
};

const deleteProfile = () => {
  throw new Error("Not yet implemented");
};

const viewProfile = () => {
  throw new Error("Not yet implemented");
};

// as in, admin can manage sub profiles
const manageProfiles = () => {
  throw new Error("Not yet implemented");
};

// favourites list
const viewMyList = () => {
  throw new Error("Not yet implemented");
};

module.exports = {
  register,
  login,
};
