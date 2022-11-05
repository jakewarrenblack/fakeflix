const { Schema, model } = require("mongoose");

const episodeSchema = Schema({
  // refer to listing object
  listing: {
    type: Schema.Types.ObjectId,
    ref: "Listing",
    required: [true, "Episode must refer to a listing. Provide an object id."],
  },
  episode_title: {
    type: String,
    required: [true, "Episode title field is required"],
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
