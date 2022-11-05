const jsf = require("json-schema-faker");
const faker = require("@withshepherd/faker");

const fakerMaker = async (qty, schema, method = undefined) => {
  jsf.extend("faker", () =>
    method != undefined
      ? {
          ...faker,
          custom_method: method,
        }
      : faker
  );
  const config = require("mongoose-schema-jsonschema/config");

  const fieldOptionsMapping = {
    faker: "faker",
  };

  config({ fieldOptionsMapping });
  const jsonSchema = schema.jsonSchema();
  objects = [];

  for (var i = 0; i < qty; i++)
    await jsf.resolve(jsonSchema).then((res) => objects.push(res));

  return objects;
};

module.exports = fakerMaker;
