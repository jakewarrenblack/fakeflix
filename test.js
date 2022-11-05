const userSchema = require("./models/user_schema").schema;
const avatarSchema = require("./models/avatar_schema").schema;
const fakerMaker = require("./utils/fakermaker");
const fs = require("fs");

// const generateUsers = async () =>
//   await fakerMaker(2, userSchema).then((res) =>
//     fs.writeFile("generated_data/users.json", JSON.stringify(res), (err) => {
//       if (err) console.log(err);
//       else {
//         console.log("File written successfully\n");
//       }
//     })
//   );

// generateUsers();

// ------------------------------------------------------------ //

const randomImage = () => "https://api.minimalavatars.com/avatar/random/png";

// Plan to create a method to pull in listing objects from mongo,
// random selection to form user favourites

const generateAvatars = async () =>
  await fakerMaker(2, avatarSchema, randomImage).then((res) =>
    fs.writeFile("generated_data/avatars.json", JSON.stringify(res), (err) => {
      if (err) console.log(err);
      else {
        console.log("File written successfully\n");
      }
    })
  );

generateAvatars();
