const { Mongoose } = require("mongoose");

const mongoose = require("mongoose-schema-jsonschema")();
const { Schema, model } = mongoose;

const avatarSchema = Schema({
  name: {
    type: String,
    faker: "word.interjection",
    required: [true, "Name field is required"],
  },
  img: {
    data: Buffer | String,
    contentType: String,
    required: [true, "Avatar must have an image"],
  },
});

module.exports = {
  model: model("Avatar", avatarSchema),
  schema: avatarSchema,
};
