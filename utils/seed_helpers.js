const Avatar = require("../models/avatar_schema").model;
const Title = require("../models/title_schema");
const age_ratings = require("../utils/age_ratings");
const mongoose = require("mongoose");

const getAvatar = async () => {
  // Find out how many avatars there are, there are 10, but let's make it dynamic
  let count = await Avatar.estimatedDocumentCount();

  // Get a random index within our count
  if (count > 0) {
    const random = Math.floor(Math.random() * count);

    let avatar = await Avatar.findOne()
      .skip(random)
      .then((res) => {
        return res.id;
      });
    return avatar;
  } else {
    console.error("No avatars in DB");
  }
};

// Getting random Title IDs for populating users with fake favourites
const getFavourites = async (qty = 1, object) => {
  let allowed;
  let s = object.subscription.toUpperCase();

  object.type == "child"
    ? (allowed = age_ratings.unrestricted)
    : (allowed = age_ratings[object.maturity_setting]);

  const rgx = RegExp(/(^SHOW|MOVIE$){0,1}/);
  const type = (s == "SHOWS" && "SHOW") || (s == "MOVIES" && "MOVIE") || rgx;

  const filter = {
    // has to be in the array of allowed ratings for this account's restriction settings
    // if it's a child, only 'unrestricted' listings are shown
    // semi-restricted user sees restricted/semi-restricted, unrestricted sees all 3 categories
    age_certification: { $in: allowed },
    type: {
      // as in title_controller, return movies or shows based on subscription type
      $regex: type,
    },
  };

  let count = await Title.countDocuments(filter);

  // await Title.countDocuments(filter).then(async (res) => {
  //.then(async (res) => {
  if (count > 0) {
    const favourites = [];
    for (var i = 0; i < qty; i++) {
      // Get a random index within our count
      const random = Math.floor(Math.random() * count) + 1;

      // filtering by both age_certification and type
      let title = await Title.findOne(filter)
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

  //})
  // .catch((e) => console.error(e));
};

const assignValues = async (objects) => {
  let filtered = await objects.filter((object) => {
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
