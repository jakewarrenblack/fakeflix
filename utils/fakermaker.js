const mongoose = require("mongoose-schema-jsonschema")();
require("mongoose-schema-jsonschema")(mongoose);
const jsf = require("json-schema-faker");
const faker = require("faker");
jsf.extend("faker", () => faker);
const config = require("mongoose-schema-jsonschema/config");

const fieldOptionsMapping = {
  faker: "faker",
};

config({ fieldOptionsMapping });

const fakerMaker = async (qty, schema) => {
  const jsonSchema = schema.jsonSchema();
  objects = [];

  for (var i = 0; i < qty; i++)
    await jsf.resolve(jsonSchema).then((res) => objects.push(res));

  return objects;
};

module.exports = fakerMaker;
