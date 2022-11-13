const User = require("../models/user_schema").model;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {default: mongoose} = require("mongoose");

// TODO: Stripe integration as part of this
const register = (req, res) => {
    let newUser = new User(req.body);
    newUser.password = bcrypt.hashSync(req.body.password, 10);

    /*
    user_schema uses faker to generate object IDs
    I do this because I populate each fake user of type 'child' or 'user' (not admin)
    with an admin ID, which is a reference to a real admin type object,

    but doing this means we're overriding mongodb's generation of _id, and we have to do it ourselves
    so since it's now a requirement from the user_schema, I generate one here...
    */
    newUser._id = new mongoose.mongo.ObjectId();

    console.log(newUser);

    newUser.save((err, user) => {
        if (err) {
            return res.status(400).json({
                msg: err.message,
            });
        } else {
            user.password = undefined;
            return res.status(201).json(user);
        }
    });
};

const login = (req, res) => {
    User.findOne({
        email: req.body.email,
    })
        .then((user) => {
            if (!user || !user.comparePassword(req.body.password)) {
                res.status(401).json({
                    msg: "Authentication failed. Invalid user or password",
                });
            } else {
                // token receives object, whatever you put here is encoded inside the token
                let token = jwt.sign(
                    {
                        email: user.email,
                        name: user.name,
                        _id: user._id,
                        // Including this so I can filter Title responses
                        subscription: user.subscription,
                        maturity_setting: user.maturity_setting,
                        type: user.type,
                        // Just let it be undefined if not specified
                        // To act as identifier for 'staff' members to add/update/delete Title listings
                        // Wouldn't make sense for 'customers' to be allowed to do this
                        database_admin: user.database_admin
                        // APP_KEY environment variable is our secret/private key
                    }, process.env.APP_KEY, {
                        // The token should expire in two days
                        expiresIn: "2 days"
                    }
                );

                res.status(200).json({
                    msg: "All good",
                    // below outputs as 'token: token'
                    token,
                });
            }
        })
        .catch((err) => {
            throw err;
        });
};

// TODO: Sub-user not allowed to change their admin
// TODO: An admin removing a profile here deletes them
const editProfile = (req, res) => {
    let id = req.params.id;
    let body = req.body;

    User.findByIdAndUpdate(id, body, {
        new: true,
    })
        .then((data) => {
            if (data) {
                res.status(201).json(data);
            } else {
                res.status(404).json({
                    message: `User with id: ${id} not found`,
                });
            }
        })
        .catch((err) => {
            if (err.name === "ValidationError") {
                console.error("Validation Error!!", err);
                res.status(422).json({
                    msg: "Validation Error",
                    error: err.message,
                });
            } else if (err.name === "CastError") {
                res.status(400).json({
                    message: `Bad request, ${id} is not a valid id`,
                });
            } else {
                console.error(err);
                res.status(500).json(err);
            }
        });
};

// TODO: If an admin wants to delete themselves, use the id from the req

// TODO: If deleting an admin, also delete accounts dependent on the admin.

// TODO: Make sure a user can only delete themselves, unless admin, admin can delete their sub-users as well

const deleteProfile = (req, res) => {
    let id = req.params.id;

    User.deleteOne({_id: id})
        .then((data) => {
            if (data.deletedCount) {
                res.status(200).json({
                    message: `User with id: ${id} deleted successfully`,
                });
            } else {
                res.status(404).json({
                    message: `User with id: ${id} not found`,
                });
            }
        })
        .catch((err) => {
            console.error(err);
            if (err.name === "CastError") {
                res.status(400).json({
                    message: `Bad request, ${id} is not a valid id`,
                });
            } else {
                res.status(500).json(err);
            }
        });
};

const viewProfile = (req, res) => {
    const id = () => mongoose.mongo.ObjectId(req.user._id);
    // Pass in fields to populate, e.g. ?populate=avatar&populate=my_list
    // Which will replace the IDs in these fields with their corresponding objects
    const populate = req.query.populate;

    // connect to db and retrieve festival with :id
    User.findById(id())
        .populate(populate)
        .then((data) => {

            if (data) {
                res.status(200).json(data);
            } else {
                res.status(404).json({
                    message: `User with id: ${id} not found`,
                });
            }
        })
        .catch((err) => {
            console.error(err);
            if (err.name === "CastError") {
                res.status(400).json({
                    message: `Bad request, ${id} is not a valid id`,
                });
            } else {
                res.status(500).json(err);
            }
        });
};

// View all profiles related to one-another
// Will return the admin and their sub-users
const manageProfiles = async (req, res) => {
    const id = mongoose.mongo.ObjectId(req.user._id);
    const populate = req.query.populate

    await User.find({
        $or: [{_id: id}, {admin: id}],
    })
        .populate(populate)
        // Admin should appear first in the list
        .sort({type: 1})
        .then((data) => {
            console.log(data);
            if (data.length > 0) {
                res.status(200).json(data);
            } else {
                res.status(404).json("No users found");
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json(err);
        });
};

// favourites list
// TODO: Separate add/remove from list methods?
const viewMyList = (req, res) => {
    //  .find() expects this to be a function,
    // generate a valid mongo user ID from the user ID string
    const id = () => mongoose.mongo.ObjectId(req.user._id);
    // Only returning username from User, so we could display e.g. 'joe.bloggs98's favourites' in the frontend
    User.find({_id: id()}, "username")
        .populate("my_list")
        .then((data) => {
            if (data.length) {
                console.log(data);
                if (data.length > 0) {
                    res.status(200).json(data);
                } else {
                    res.status(404).json("No users found");
                }
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json(err);
        });
};

const viewAvatars = (req, res) => {
    //  .find() expects this to be a function,
    // generate a valid mongo user ID from the user ID string
    const id = mongoose.mongo.ObjectId(req.user._id);
    // Again here only returning the username
    // So we could have a page with usernames and avatars
    User.find(
        {
            $or: [{_id: id}, {admin: id}],
        },
        "username"
    )
        .populate("avatar", "img")
        .then((data) => {
            if (data.length) {
                console.log(data);
                if (data.length > 0) {
                    res.status(200).json(data);
                } else {
                    res.status(404).json("No users found");
                }
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json(err);
        });
};

module.exports = {
    viewAvatars,
    viewMyList,
    manageProfiles,
    viewProfile,
    deleteProfile,
    editProfile,
    register,
    login,
};
