const {mongoose, Schema, model} = require("mongoose");
// title can be either a series or a film
//mongoose.set("debug", true);

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
        // If it's a show, it's an EPISODE, not an entire SERIES
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
            enum: [
                "TV-MA",
                "R",
                "PG",
                "TV-14",
                "PG-13",
                "TV-PG",
                "TV-Y",
                "TV-G",
                "TV-Y7",
                "G",
                "NC-17",
            ],
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
        imdb_id: {type: String},
        // May not be present
        imdb_score: {type: Number},

        imdb_votes: {type: Number},

        tmdb_popularity: {type: Number},

        tmdb_score: {type: Number},
        // to validate based on user's plan when requesting
        // basic plan retrieves 'good', standard retrieves, 'better', etc
        // we have all listings in all qualities,
        // so return an error if permission mismatch
        // e.g. basic user requests best quality
        video_quality: {
            type: String,
            enum: ["Good", "Better", "Best"],
        },
    },
    {timestamps: true}
);

titleSchema.index({title: 'text'});

module.exports = model("Title", titleSchema);
