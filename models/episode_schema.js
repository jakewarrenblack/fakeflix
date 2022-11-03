const { Schema, model } = require("mongoose");

const episodeSchema = Schema({
  title: {
    type: String,
    required: [true, "URL field is required"],
  },
  thumbnail: {
    type: String,
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
