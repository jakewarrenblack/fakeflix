const fakerMaker = require("./utils/fakermaker");
const fs = require("fs");
require("dotenv").config();
require("./utils/db.js")();

const User = {
  schema: require("./models/user_schema").schema,
  model: require("./models/user_schema").model,
};

const Avatar = {
  schema: require("./models/avatar_schema").schema,
  model: require("./models/avatar_schema").model,
};

const generate = async (qty, type) => {
  await fakerMaker(qty, type.schema).then((res) => {
    type.model.insertMany(res, function (err, res) {
      if (err) {
        console.log(err);
      }
      console.log("Data upload successful");
    });

    fs.writeFile(
      `generated_data/generated.json`,
      JSON.stringify(res),
      (err) => {
        if (err) console.log(err);
        else {
          console.log("File written successfully\n");
        }
      }
    );
  });
};

generate(10, Avatar).then(() => generate(100, User));
