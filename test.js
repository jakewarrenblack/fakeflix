const userSchema = require("./models/user_schema").schema;
const fakerMaker = require("./utils/fakermaker");
const fs = require("fs");
const axios = require("axios");

const customAvatar = () => "https://api.minimalavatars.com/avatar/random/png";

const generateUsers = async () =>
  await fakerMaker(2, userSchema, customAvatar).then((res) =>
    fs.writeFile("generated_data/users.json", JSON.stringify(res), (err) => {
      if (err) console.log(err);
      else {
        console.log("File written successfully\n");
      }
    })
  );

generateUsers();
