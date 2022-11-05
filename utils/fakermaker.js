const jsf = require("json-schema-faker");
// This person had a more recent fork of faker
const faker = require("@withshepherd/faker");

const fakerMaker = async (qty, schema, method = undefined) => {
  // If custom method provided, add to the faker object
  // otherwise, just return faker
  jsf.extend("faker", () =>
    method != undefined
      ? {
          ...faker,
          custom_method: method,
        }
      : faker
  );

  // necessary to include this,
  // without it, the 'faker' keyword would be removed from the schema
  const config = require("mongoose-schema-jsonschema/config");
  const fieldOptionsMapping = {
    faker: "faker",
  };

  config({ fieldOptionsMapping });
  // .jsonSchema() converts the mongoose schema to JSON schema
  const jsonSchema = schema.jsonSchema();
  objects = [];

  for (var i = 0; i < qty; i++)
    // jsf.resolve runs our faker script
    await jsf.resolve(jsonSchema).then((res) => objects.push(res));

  return objects;
};

module.exports = fakerMaker;
