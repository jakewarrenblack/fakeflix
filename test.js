const userSchema = require("./models/user_schema").schema;
const Title = require("./models/title_schema");
const avatarSchema = require("./models/avatar_schema").schema;
const fakerMaker = require("./utils/fakermaker");
const fs = require("fs");
require("dotenv").config();
require("./utils/db.js")();

// Public images hosted on S3 bucket
const getImage = () => {
  let num = Math.floor(Math.random() * 10) - 1;

  return `https://ca1-avatars.s3.eu-west-1.amazonaws.com/${num}.png`;
};

const generateUsers = async () =>
  await fakerMaker(2, userSchema, undefined, 2).then((res) =>
    fs.writeFile("generated_data/users.json", JSON.stringify(res), (err) => {
      if (err) console.log(err);
      else {
        console.log("File written successfully\n");
      }
    })
  );

const generateAvatars = async () =>
  await fakerMaker(2, avatarSchema, getImage).then((res) =>
    fs.writeFile("generated_data/avatars.json", JSON.stringify(res), (err) => {
      if (err) console.log(err);
      else {
        console.log("File written successfully\n");
      }
    })
  );

// need method to pull in random listing IDs for the favourites

//getFavourites(2).then((res) => console.log(res));

// getFavourites(5).then((res) => {
//   console.log(res);
// });

generateUsers();
