const userSchema = require("./models/user_schema").schema;
const fakerMaker = require("./utils/fakermaker");
const fs = require("fs");

const generateUsers = async () =>
  await fakerMaker(2, userSchema).then((res) =>
    fs.writeFile("users.json", JSON.stringify(res), (err) => {
      if (err) console.log(err);
      else {
        console.log("File written successfully\n");
      }
    })
  );

generateUsers();
