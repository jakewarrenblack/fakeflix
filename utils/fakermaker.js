const jsf = require("json-schema-faker");
// This person had a more recent fork of faker
const faker = require("@withshepherd/faker");

const getFavourites = require("./getFavourites");

const fakerMaker = async (qty, schema, method = undefined, favouritesQty) => {
  objects = [];
  for (var i = 0; i < qty; i++) {
    let favourites = [];

    if (favouritesQty) {
      await getFavourites(favouritesQty).then((res) => {
        favourites = res;
        favourites.forEach((fav) => console.log(fav));
      });

      jsf.option("maxItems", favouritesQty);
      jsf.option("uniqueItems", true);
    }

    // jsf.extend("faker", () =>
    //   method != undefined
    //     ? {
    //         ...faker,
    //         custom_method: method,
    //       }
    //     : { ...faker, favourites: favourites }
    // );

    jsf.extend("faker", () => {
      return {
        ...faker,
        favourites: favourites,
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
