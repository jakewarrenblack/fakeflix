const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");

// note db properties use snake_case by convention
const userSchema = Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
    },
    type: {
      type: String,
      // child = literally a child, a kid's account with locked features
      // admin = account owner, like on netflix, can have many 'users' but one admin
      enum: ["admin", "user", "child"],
      required: [true, "Type is required"],
    },
    avatar: {
      // refer to avatar schema type here
    },
    language: {
      type: String,
      enum: ["EN", "FR", "DE"],
      required: [true, "Language is required"],
    },
    maturity_setting: {
      type: String,
      enum: ["all", "semi-restricted", "restricted"],
      required: [true, "Maturity setting is required"],
      default: "all",
    },
    autoplay_enabled: {
      type: Boolean,
    },
    my_list: {
      // favourites, use listing schema as type
      type: Array,
    },
    pin: {
      // pin to access the account, not required
      type: Number,
    },
  },
  { timestamps: true }
);

// note 'comparePassword' here is arbitrary, can be whatever name you want
// we're just adding an object on
userSchema.methods.comparePassword = function (password) {
  // this.password here is the password of this user schema instance in the database
  // it doesnt have to make a database call
  // remember that we've added this method to THIS object's methods on line 31
  // when we declared a new user object, we're storing everything we need locally
  return bcrypt.compareSync(password, this.password, function (result) {
    return result; // returns true or false
  });
};

module.exports = model("User", userSchema);
