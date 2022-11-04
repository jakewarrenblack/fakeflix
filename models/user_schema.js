const bcrypt = require("bcryptjs");
const mongoose = require("mongoose-schema-jsonschema")();
const { Schema, model } = mongoose;

// note db properties use snake_case by convention
const userSchema = Schema(
  {
    firstName: {
      type: String,
      faker: "name.firstName",

      required: [true, "First name field is required"],
    },
    lastName: {
      type: String,
      faker: "name.lastName",

      required: [true, "Last name field is required"],
    },
    username: {
      type: String,
      faker: {
        "internet.userName": ["#{firstName}", "#{lastName}"],
      },

      required: [true, "Username is required"],
    },
    email: {
      type: String,
      faker: {
        "internet.email": ["#{firstName}", "#{lastName}"],
      },
      required: [true, "Email is required"],
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
      type: Schema.Types.ObjectId,
      ref: "Avatar",
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
      type: [String],
    },
    pin: {
      // pin to access the account, not required
      type: Number,
      // TODO: generate real pin, this doesn't work
      faker: "finance.pin",
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

module.exports = {
  model: model("User", userSchema),
  schema: userSchema,
};
