const jsf = require("json-schema-faker");
const faker = require("@withshepherd/faker");
const bcrypt = require("bcryptjs");
const { getAvatar, getFavourites, getImage } = require("./seed_helpers");
const user_schema = require("../models/user_schema").schema;
const mongoose = require("mongoose");

const timer = () => {
  const lines = ["\\", "|", "/", "-"];
  let x = 0;

  return setInterval(() => {
    // \r is for 'inplace'
    process.stdout.write("\r" + "Seeding... " + lines[x]);

    x < 3 ? x++ : (x = 0);
  }, 100);
};

const fakerMaker = async (qty, type) => {
  const schema = type.schema;
  console.log(`\nNow seeding ${type.model.modelName}...\n`);
  timer();
  objects = [];

  for (var i = 0; i < qty; i++) {
    let favourites = [];
    let avatar, hashPassword, getID;
    if (schema == user_schema) {
      // Let's say a user has up to 12 favourites
      const random = Math.floor(Math.random() * 12) + 1;

      await getFavourites(random)
        .then((res, err) => {
          favourites = res;
        })
        .catch((err) => {
          console.log(err);
        });

      hashPassword = () => bcrypt.hashSync(faker.internet.password(), 10);
      getID = () => mongoose.mongo.ObjectId();

      jsf.option("maxItems", random);
      jsf.option("uniqueItems", true);

      await getAvatar().then((res) => {
        avatar = res;
      });
    }

    jsf.extend("faker", () => {
      return {
        ...faker,
        favourites,
        get_image: getImage(i + 1),
        avatar,
        hashPassword,
        getID,
        // admin: async (type) => await getAdmin(type),
      };
    });

    // necessary to include this,
    // without it, the 'faker' keyword would be removed from the schema
    const config = require("mongoose-schema-jsonschema/config");
    const fieldOptionsMapping = {
      faker: "faker",
    };

    config({ fieldOptionsMapping });
    // .jsonSchema() converts the mongoose schema to JSON schema
    const jsonSchema = schema.jsonSchema();

    // jsf.resolve runs our faker script
    await jsf.resolve(jsonSchema).then((res) => {
      objects.push(res);
    });
  }

  if (schema == user_schema) {
    let admins = await objects.filter((object) => {
      if (object.type == "admin") {
        // this value is being faked, but I don't need it
        delete object.admin;
        return {
          ...object,
          _id: new mongoose.mongo.ObjectId(),
        };
      }
    });

    objects.forEach((object) => {
      const rand = Math.floor(Math.random() * admins.length);

      if (object.type == "child" || object.type == "user")
        object.admin = new mongoose.mongo.ObjectId(admins[rand]._id);
    });
  }

  return objects;
};

module.exports = fakerMaker;
