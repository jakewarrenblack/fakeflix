const { Schema, model } = require("mongoose");

// title can be either a series or a film

const titleSchema = Schema(
  {
    id: {
      type: String,
      required: [true, "id field is required"],
    },
    title: {
      type: String,
      required: [true, "Title field is required"],
    },
    type: {
      type: String,
      enum: ["SHOW", "MOVIE"],
      required: [
        true,
        'Type field is required. Must be of type "SHOW" or "MOVIE"',
      ],
    },
    description: {
      type: String,
      required: [true, "Description field is required"],
    },
    release_year: {
      type: Number,
      required: [true, "Year field is required"],
    },
    age_certification: {
      // could be M, U, etc
      type: String,
      enum: ["U", "M", "R", "TV-MA"],
      required: [true, "Age rating field is required"],
    },
    runtime: {
      type: Number,
      required: [true, "Runtime is required"],
    },
    genres: {
      type: String,
      required: [true, "Genres is required"],
    },
    production_countries: {
      type: String,
      required: [true, "Production countries is required"],
    },
    // Not required, might be a film
    seasons: {
      type: Number,
    },
    imdb_id: { type: String },
    // May not be present
    imdb_score: { type: Number },

    imdb_votes: { type: Number },

    tmdb_popularity: { type: Number },

    tmdb_score: { type: Number },
  },
  { timestamps: true }
);

module.exports = model("Title", titleSchema);
