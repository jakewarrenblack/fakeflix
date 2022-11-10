const Avatar = require("../models/avatar_schema").model;
const Title = require("../models/title_schema");
const { getFilter } = require("../utils/age_ratings");
const mongoose = require("mongoose");

const getAvatar = async () => {
  // Find out how many avatars there are, there are 10, but let's make it dynamic
  const count = await Avatar.estimatedDocumentCount();

  // Get a random index within our count
  if (count > 0) {
    const random = Math.floor(Math.random() * count);

    const avatar = await Avatar.findOne()
      .skip(random)
      .then((res) => {
        return res.id;
      });
    return avatar;
  } else {
    console.error(
      "No avatars in DB! Insert some avatars before seeding users."
    );
    process.exit(0);
  }
};

// Getting random Title IDs for populating users with fake favourites
const getFavourites = async (qty = 1, object) => {
  const filter = getFilter(object);
  const count = await Title.countDocuments(filter);

  if (count > 0) {
    const favourites = [];
    for (var i = 0; i < qty; i++) {
      // Get a random index within our count
      const random = Math.floor(Math.random() * count) + 1;

      // filtering by both age_certification and type
      const title = await Title.findOne(filter)
        .skip(random)
        .then((res) => {
          if (res) {
            return res._id.toString();
          }
        });

      favourites.push(title);
    }
    return favourites;
  }
};

const assignValues = async (objects) => {
  const filtered = await objects.filter((object) => {
    if (object.type == "admin") {
      // this value is being faked, but I don't need it
      delete object.admin;
      return {
        ...object,
        _id: new mongoose.mongo.ObjectId(),
      };
    }
  });

  let assignedObjects = [];
  for (var i = 0; i < filtered.length; i++) {
    const rand = Math.floor(Math.random() * filtered.length);
    const favRand = Math.floor(Math.random() * 12) + 1;
    let object = filtered[i];

    // A child or user should inherit their plan type from their corresponding admin
    if (object.type == "child" || object.type == "user") {
      let admin = filtered[rand];
      object.admin = new mongoose.mongo.ObjectId(admin._id);
      object.subscription = admin.subscription;
    }

    object.my_list = await getFavourites(favRand, object).then((res) => res);

    assignedObjects.push(object);
  }

  return assignedObjects;
};

const getImage = (num) =>
  `https://ca1-avatars.s3.eu-west-1.amazonaws.com/${num}.png`;

module.exports = {
  assignValues,
  getImage,
  getFavourites,
  getAvatar,
};
