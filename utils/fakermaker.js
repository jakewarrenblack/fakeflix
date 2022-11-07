const jsf = require("json-schema-faker");
const faker = require("@withshepherd/faker");
const bcrypt = require("bcryptjs");
const { getAvatar, getFavourites, getImage } = require("./seed_helpers");
const user_schema = require("../models/user_schema").schema;

const fakerMaker = async (qty, schema) => {
  objects = [];
  for (var i = 0; i < qty; i++) {
    let favourites = [];
    let avatar, hashPassword;

    if (schema == user_schema) {
      // Let's say a user has up to 12 favourites
      const random = Math.floor(Math.random() * 12) + 1;

      await getFavourites(random).then((res) => {
        favourites = res;
      });

      hashPassword = () => bcrypt.hashSync(faker.internet.password(), 10);

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

  return objects;
};

module.exports = fakerMaker;
