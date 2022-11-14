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
        imdb_id: {type: Schema.Types.Mixed},
        // May not be present, sometimes "" or null, so allowing any value for the purpose of searching and sorting
        imdb_score: {type: Schema.Types.Mixed},

        imdb_votes: {type: Schema.Types.Mixed},

        tmdb_popularity: {type: Schema.Types.Mixed},

        tmdb_score: {type: Schema.Types.Mixed},

        video_quality: {
            type: String,
            enum: ["Good", "Better", "Best"],
        },
    },
    {timestamps: true}
);

titleSchema.index({title: 'text'});

module.exports = model("Title", titleSchema);
