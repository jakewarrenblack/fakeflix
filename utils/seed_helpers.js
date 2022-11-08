const Avatar = require("../models/avatar_schema").model;
const Title = require("../models/title_schema");

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
const getFavourites = async (qty = 1) => {
  // Find out how many titles there are
  let count = await Title.countDocuments();
  if (count > 0) {
    let favourites = [];
    for (var i = 0; i < qty; i++) {
      // Get a random index within our count
      const random = Math.floor(Math.random() * count) + 1;

      let title = await Title.findOne()
        .skip(random)
        .then((res) => {
          //console.log(res._id);
          return res._id.toString();
        });

      favourites.push(title);
    }
    return favourites;
  } else {
    console.log("No favourites found, are there episodes in the DB?");
  }
};

const getImage = (num) =>
  `https://ca1-avatars.s3.eu-west-1.amazonaws.com/${num}.png`;

module.exports = {
  getImage,
  getFavourites,
  getAvatar,
};
