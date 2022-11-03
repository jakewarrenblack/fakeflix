const { Schema, model } = require("mongoose");

/*
basic:
    - 8.99
    - video: good
    - res: 480p
    - devices: 1

standard:
    - 14.99
    - video: better
    - res: 1080p
    - devices: 2

premium:
    - 20.99
    - video: best
    - res: 4k
    - devices: 4
*/

const planSchema = Schema({
  type: {
    type: String,
    enum: ["basic", "standard", "premium"],
    required: [true, "Type field is required"],
  },
  price: {
    type: Number,
    required: [true, "Price field is required"],
  },
});

module.exports = model("Plan", planSchema);
