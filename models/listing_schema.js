const { Schema, model } = require("mongoose");

const listingSchema = Schema(
  {
    url: {
      // possibly use scraping to actually get a link to watch some of these?
      type: String,
    },
    image: {
      // link to url
      type: String,
    },
    title: {
      type: String,
      required: [true, "Title field is required"],
    },
    year: {
      type: Number,
      required: [true, "Year field is required"],
    },
    age_rating: {
      // could be M, U, etc
      type: String,
      enum: ["U", "M"],
      required: [true, "Age rating field is required"],
    },
    audio_description_available: {
      type: Boolean,
      required: [true, "Audio description available field is required"],
    },
    languages: {
      type: String,
      // check API to populate
      enum: ["EN", "FR", "DE"],
      required: [true, "Languages field is required"],
    },
    director: {
      type: String,
      required: [true, "Director field is required"],
    },
    cast_list: {
      // possibly populate this using openIMDB API
      type: Array,
      required: [true, "Cast list field is required"],
    },
    genres: {
      // possibly relate this to genre schema
      type: Array,
      required: [true, "Genres field is required"],
    },
    collection: {
      // e.g. part of 'marvel collection'
      type: String,
    },
    view_count: {
      // increment this every time a request is made for this listing
      type: Number,
    },
    duration: {
      type: Number,
      required: [true, "Duration field is required"],
    },
  },
  { timestamps: true }
);

module.exports = model("Listing", listingSchema);
