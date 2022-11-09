const fakerMaker = require("./utils/fakermaker");
require("dotenv").config();
require("./utils/db")();
const { default: mongoose } = require("mongoose");

const User = {
  schema: require("./models/user_schema").schema,
  model: require("./models/user_schema").model,
};

const Avatar = {
  schema: require("./models/avatar_schema").schema,
  model: require("./models/avatar_schema").model,
};

const generate = async (qty, type) => {
  await fakerMaker(qty, type)
    .then(async (res, err) => {
      await type.model.collection.drop().then(async () => {
        try {
          // Making sure to use .create instead of .insertMany
          // they're similar, but create uses the 'save' middleware,
          // meaning we can use this to both create the document, and insert our records
          await type.model.create(res, function (err, res) {
            // if (res) console.log(res);

            if (err) console.error(`\n${err}`);
          });
        } catch (e) {
          console.error(`\n${e}`);
        }
      });
    })
    .catch((e) => console.error(e));
};

const generator = async () => {
  //await generate(10, Avatar);
  await generate(100, User);

  // print in green
  console.log("\x1b[32m", "\nSeeding complete!");
  //process.exit(1);
};

generator();
