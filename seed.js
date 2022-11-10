const fakerMaker = require("./utils/fakermaker");
require("dotenv").config();
require("./utils/db")();
const {default: mongoose} = require("mongoose");

const User = {
    schema: require("./models/user_schema").schema,
    model: require("./models/user_schema").model,
};

const Avatar = {
    schema: require("./models/avatar_schema").schema,
    model: require("./models/avatar_schema").model,
};

const generate = async (qty, type) => {

    return await fakerMaker(qty, type)
        .then(async (res) => {
            //.create instead of .insertMany. create uses the 'save' middleware, so we can use this to both create the document, and insert our records

            await type.model.create(res, (err, res) => {
                if (err) {
                    console.error("Error: ", err);
                    return err
                }
                if (res) {
                    console.log("Success: ", res);
                    return res
                }
            });

        })
        .catch((e) => console.error(e))
};

const generator = async () => {
    await generate(10, Avatar).then(async (res) => res);

};

generator().then(async (res) => await generate(100, User)).then((res) => {
    console.log("\x1b[32m", "\nSeeding complete!"); // print in green
})



