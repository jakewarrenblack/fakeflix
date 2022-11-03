const { Schema, model } = require("mongoose");

const avatarSchema = Schema({
  url: {
    type: String,
    required: [true, "URL field is required"],
  },
  name: {
    type: String,
    required: [true, "Name field is required"],
  },
  // plan to use Mongoose 'Population' to tie this to a real movie title,
  // e.g 'batman' avatar from 'batman forever', etc.
  movie_name: {
    type: String,
    required: [true, "Movie name field is required"],
  },
});

module.exports = model("Avatar", avatarSchema);
