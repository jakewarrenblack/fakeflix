const mongoose = require("mongoose-schema-jsonschema")();
const { Schema, model } = mongoose;

const avatarSchema = Schema({
  url: {
    type: String,
    required: [true, "URL field is required"],
    faker: "custom_method",
  },
  name: {
    type: String,
    faker: "word.interjection",
    required: [true, "Name field is required"],
  },
  // plan to use Mongoose 'Population' to tie this to a real movie title,
  // e.g 'batman' avatar from 'batman forever', etc.
  movie: {
    type: Schema.Types.ObjectId,
    ref: "Listing",
    required: [true, "Movie name field is required"],
  },
});

module.exports = {
  model: model("Avatar", avatarSchema),
  schema: avatarSchema,
};
