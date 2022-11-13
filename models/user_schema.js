const bcrypt = require("bcryptjs");
const mongoose = require("mongoose-schema-jsonschema")();
const {Schema, model} = mongoose;

// note db properties use snake_case by convention
const userSchema = Schema(
    {
        // I'm generating these manually so I can refer to them as admin IDs before inserting during seeding

        // This means we need to insert an _id every time we register, but we fix this in user_controller
        _id: {
            type: Schema.Types.ObjectId,
        },
        firstName: {
            type: String,
            faker: "name.firstName",

            required: [true, "First name field is required"],
        },
        lastName: {
            type: String,
            faker: "name.lastName",

            required: [true, "Last name field is required"],
        },
        username: {
            type: String,
            // generate userName based on first and last name
            faker: {
                "internet.userName": ["#{firstName}", "#{lastName}"],
            },

            required: [true, "Username is required"],
        },
        email: {
            type: String,
            // generate email based on firstName and lastName
            faker: {
                "internet.email": ["#{firstName}", "#{lastName}"],
            },
            required: [true, "Email is required"],
        },
        password: {
            type: String,
            faker: "hashPassword",
            required: [true, "Password is required"],
        },
        type: {
            type: String,
            // child = literally a child, a kid's account with locked features
            // admin = account owner, like on netflix, can have many 'users' but one admin
            enum: ["admin", "user", "child"],
            required: [true, "Type is required"],
        },
        database_admin: {
            // Don't want it to fake any database_admins, reserving that for creation
            // In reality this would make sense
            // admins, users, and child accounts are 'customers'
            // database_admins are 'staff'
            type: Boolean
        },
        avatar: {
            // refer to avatar schema type here
            type: Schema.Types.ObjectId,
            ref: "Avatar",
            faker: "avatar",
            required: [true, "User must have an avatar"],
        },
        language: {
            type: String,
            enum: ["EN", "FR", "DE"],
            required: [true, "Language is required"],
        },
        maturity_setting: {
            type: String,
            enum: ["unrestricted", "semi-restricted", "restricted"],
            required: [
                true,
                "Maturity setting is required. All, semi-restricted, or restricted.",
            ],
            default: "unrestricted",
        },
        autoplay_enabled: {
            type: Boolean,
            default: true,
        },
        subscription: {
            type: String,
            enum: ["Movies", "Shows", "Movies & Shows"],
            required: [
                // A 'user' or 'child' should inherit their subscription from their admin
                // Only the admin themselves must choose a subscription type
                validateNotAdmin,
                "Subscription is required for admins. Shows, Movies, or Movies & Shows.",
            ],
        },
        // Refer to an array of Listings (Favourite programmes/films)
        my_list: {
            type: [Schema.Types.ObjectId],
            ref: "Title",
        },
        // 'child' or 'user' types will have an account admin
        admin: {
            type: Schema.Types.ObjectId,
            faker: "getID",
            ref: "User",

            required: [
                validateAdmin,
                "Users of type 'child' or 'user' must have an admin",
            ],
        },

        pin: {
            // pin to access the account, not required, maybe user doesn't want to set one
            // (this isn't the password), but to stop e.g. users on a family account accessing each others
            type: Number,
            faker: "datatype.number",
        },
    },
    {timestamps: true}
);

function validateAdmin() {
    return this.type !== "admin";
}

function validateNotAdmin() {
    return this.type === 'admin'
}

// note 'comparePassword' here is arbitrary, can be whatever name you want
// we're just adding an object on
userSchema.methods.comparePassword = function (password) {
    // this.password here is the password of this user schema instance in the database
    // it doesnt have to make a database call
    // remember that we've added this method to THIS object's methods on line 31
    // when we declared a new user object, we're storing everything we need locally
    return bcrypt.compareSync(password, this.password, function (result) {
        return result; // returns true or false
    });
};

// Exporting these separately,
// faker script needs the schema itself,
// not the model
module.exports = {
    model: model("User", userSchema),
    schema: userSchema,
};
