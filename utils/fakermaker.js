const jsf = require("json-schema-faker");
const faker = require("@withshepherd/faker");
const bcrypt = require("bcryptjs");
const {getAvatar, getImage, assignValues} = require("./seed_helpers");
const user_schema = require("../models/user_schema").schema;
const mongoose = require("mongoose");

const fakerMaker = async (qty, type) => {
    const schema = type.schema;
    console.log(`\nNow seeding ${type.model.modelName}...\n`);

    let objects = [];

    await type.model.collection
        .drop()
        .then(async (res) => {
            console.log(res);
            for (let i = 0; i < qty; i++) {
                let favourites = [];
                let avatar, hashPassword, getID;
                if (schema === user_schema) {
                    // Let's say a user has up to 12 favourites
                    hashPassword = () => bcrypt.hashSync(faker.internet.password(), 10);
                    getID = () => mongoose.mongo.ObjectId();

                    /*
                This option is necessary for generating a temporary admin ID, so as not to throw a validation error before I've replaced the faker ID with the _id of another real object
                However, this was overwriting my custom 'my_list' method with fake IDs, so custom assignValues method in seed_helpers solves this
                */
                    jsf.option("alwaysFakeOptionals", true);

                    // Special type for 'staff' updating/adding/removing film and show listings
                    jsf.option('ignoreProperties', ['database_admin', 'stripe_details'])

                    await getAvatar().then((res) => {
                        avatar = res;
                    });

                    let types = ['admin', 'user', 'child']

                }

                jsf.extend("faker", () => {
                    return {
                        ...faker,
                        get_image: getImage(i + 1),
                        avatar,
                        hashPassword,
                        getID,
                    };
                });

                // Necessary to include this. Without it, the 'faker' keyword would be removed from the schema
                const config = require("mongoose-schema-jsonschema/config");
                const fieldOptionsMapping = {
                    faker: "faker",
                };

                config({fieldOptionsMapping});
                // .jsonSchema() converts the mongoose schema to JSON schema
                let jsonSchema = schema.jsonSchema();

                await jsf.resolve(jsonSchema).then((res) => {
                    objects.push(res);
                });
            }

            if (schema === user_schema) {
                return await assignValues(objects).then((res) => {
                    objects = res
                });
            }

            return objects;
        })
        .catch((e) => {
            return e;
        });

    return objects;
};

module.exports = fakerMaker;
