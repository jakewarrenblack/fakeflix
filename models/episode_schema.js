const { Schema, model } = require("mongoose");

const episodeSchema = Schema({
  title: {
    type: String,
    required: [true, "Title field is required"],
  },
  thumbnail: {
    type: String,
  },
  description: {
    type: String,
    required: [true, "Description field is required"],
  },
  duration: {
    type: Number,
    required: [true, "Duration field is required"],
  },
  season: {
    type: Number,
    required: [true, "Season field is required"],
  },
});

module.exports = model("Episode", episodeSchema);
