const Title = require("../models/title_schema");

// Getting random Title IDs for populating users with fake favourites
const getFavourites = async (qty = 1) => {
  // Find out how many titles there are
  let count = await Title.estimatedDocumentCount();

  let favourites = [];
  for (var i = 0; i < qty; i++) {
    // Get a random index within our count
    const random = Math.floor(Math.random() * count);
    //console.log(random);

    let title = await Title.findOne()
      .skip(random)
      .then((res) => {
        console.log(res._id);
        return res._id.toString();
      });

    favourites.push(title);
  }
  return favourites;
};

module.exports = getFavourites;
