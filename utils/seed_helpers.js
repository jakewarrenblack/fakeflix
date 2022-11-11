const Avatar = require("../models/avatar_schema").model;
const Title = require("../models/title_schema");
const {getFilter} = require("../utils/age_ratings");
const mongoose = require("mongoose");

const getAvatar = async () => {
    // Find out how many avatars there are, there are 10, but let's make it dynamic
    const count = await Avatar.estimatedDocumentCount();

    // Get a random index within our count
    if (count > 0) {
        const random = Math.floor(Math.random() * count);

        const avatar = await Avatar.findOne()
            .skip(random)
            .then((res) => {
                return res.id;
            });
        return avatar;
    } else {
        console.error(
            "No avatars in DB! Insert some avatars before seeding users."
        );
        process.exit(0);
    }
};

// Getting random Title IDs for populating users with fake favourites
const getFavourites = async (qty = 1, object) => {
    const filter = getFilter(object);
    const count = await Title.countDocuments(filter);

    if (count > 0) {
        const favourites = [];
        for (let i = 0; i < qty; i++) {
            // Get a random index within our count
            const random = Math.floor(Math.random() * count) + 1;

            // filtering by both age_certification and type
            const title = await Title.findOne(filter)
                .skip(random)
                .then((res) => {
                    if (res) {
                        return res._id.toString();
                    }
                });

            favourites.push(title);
        }
        return favourites;
    }
};


const assignValues = async (objects) => {
    let others = []
    // Find all the admins in our generated users
    let admins = await objects.filter(async (object) => {
        if (object.type === "admin") {
            // this value is being faked, but I don't need it in this case. an admin doesn't need an admin ID.
            delete object.admin
            delete object.my_list;
            const favRand = Math.floor(Math.random() * 12) + 1;

            await getFavourites(favRand, object).then((res) => {
                // Remove any faked favourites first
                object.my_list = res
            })

            return {
                // Generate an ID for this user:
                // Remember this is done intentionally, so we can refer to this ID *before* it gets saved to the DB
                // Usually we'd just use the one MongoDB generates for us, but  that's not possible since we want *real*
                // references between objects before inserting these users
                ...object,
                _id: new mongoose.mongo.ObjectId(),
            };
        } else {
            others.push(object)
        }
    });

    let updated_users = [];
    for (let i = 0; i < others.length; i++) {
        // Getting a random admin's index
        const rand = Math.floor(Math.random() * admins.length);
        // A user can have up to 12 favourites, just an arbitrary length for seeding purposes
        const favRand = Math.floor(Math.random() * 12) + 1;

        // Select the current user
        let object = others[i];
        delete object.my_list

        // A child or user should inherit their plan type from their corresponding admin.
        // No need to check user's type here,
        // we know 'others' is made up of user objects which failed the filter predicate we used to populate the 'admins' array

        // Now choosing our random admin
        let admin = admins[rand];

        // Assign this admin's newly generated ID as this user/child's 'admin' ID, so we have a real reference between them
        object.admin = new mongoose.mongo.ObjectId(admin._id);

        // Now inherit this admin's subscription type
        object.subscription = admin.subscription;

        // Using our random number from 1-12 to generate random favourites, pulling out Title IDs
        // These favourites will also conform to this user's subscription type, maturity settings, and account type
//        object.my_list = await getFavourites(favRand, object).then((res) => res);

        await getFavourites(favRand, object).then((res) => {
            // Remove any faked favourites first

            object.my_list = res
        })


        updated_users.push(object);
    }

    return updated_users;
};

const getImage = (num) =>
    `https://ca1-avatars.s3.eu-west-1.amazonaws.com/${num}.png`;

module.exports = {
    assignValues,
    getImage,
    getFavourites,
    getAvatar,
};
