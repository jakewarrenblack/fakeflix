const User = require("../models/user_schema").model;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {default: mongoose} = require("mongoose");
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_API_KEY);

const register = async (req, res) => {
    let newUser = new User(req.body);
    newUser.password = bcrypt.hashSync(req.body.password, 10);
    newUser._id = new mongoose.mongo.ObjectId();
    console.log(newUser);
    let key, price, subscription, email;

    key = process.env.PK_TEST,
    price = req.body.body.amount
    subscription = newUser.subscription,
    email = newUser.email

     stripe.customers.create({
        name: `${req.body.firstName} ${req.body.lastName}`,
        email,
         // need to add a second step to the registration, swap form to a stripe form to get the token
         // passing user data and stripe token all together
        source: req.body.body.token.id
    }).then(async (stripeRes) => {
        await stripe.charges.create({
            // Doesn't support floats and receives value in cents
            amount: price*100,
            currency: 'eur',
            description: `${subscription}`,
            customer: stripeRes.id
        }).then(async(stripeResponse) => {
                newUser._doc = {
                    ...newUser._doc,
                    stripe_details: stripeResponse
                }

                await newUser.save((err, user) => {
                    if (err) {
                        res.status(400).json({
                            // Give special response for 11000, because it's bound to be common
                            msg: err.code === 11000 ? 'A user account with this email already exists! Email must be unique.' : err.message,
                        });
                    } else {
                        res.status(200).json({
                            msg: 'User registration successful!'
                        })
                    }
                })
        })
    })


};

// Verify that the email entered by a sub-user on the frontend belongs to an existing admin user
const verifyAdmin = (req, res) => {
    User.findOne({
        email: req.body.email,
        type: 'admin'
    })
        .then((user) => {
            if (!user) {
                res.status(401).json({
                    msg: "Error. An admin with that email may not exist.",
                });
            } else {

                res.status(200).json({
                    msg: "Success. Email belongs to an existing admin.",
                    // Send the ID back so we can use this as the 'admin id'
                    id: user._id
                });
            }
        })
        .catch((err) => {
            throw err;
        });
}

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

const editProfile = async (req, res) => {
    let id = req.params.id;
    let body = req.body;
    let admin = req.user.type === 'admin'

    if (admin && id) {
        // if admin is modifying another user

        // admin can't change a user's admin ID, they are tied to this admin
        // if we allowed this, we could end up with a user with an invalid admin ID
        // only valid way to do this is to delete the user
        if (req.body.admin || req.body.password || req.body.email || req.body?.type === 'admin') {
            res.status(422).json({
                message: 'Invalid operation. You can\'t change a sub-user\'s admin ID, email, or password. You can\'t set another user as an admin. If you wish to remove this sub-user, please delete them instead.'
            })
        } else {
            // else, process update
            await editMethod(id, body, res)
        }
    } else if (admin && !id) {
        // admin editing themselves, use the ID from the request object
        if (req.body._id) {
            // if the admin is changing their own ID, make sure to also update the admin IDs of all its sub-users
            await User.updateMany({admin: req.user._id}, {admin: req.body.id}).then(async (update) => {
                if (update.acknowledged) {
                    await editMethod(req.user._id, body, res)
                }
            })

        } else {
            // Admin isn't editing their ID, all good
            await editMethod(req.user._id, body, res)
        }

    }
    // a sub-user editing themselves
    else if (!admin && !id) {
        // A sub-user should remain tied to their admin (if, in reality, this is the account paying the bill)
        if (req.body.admin || req.body.type) {
            res.status(422).json({
                message: 'Invalid operation. You can\'t change your admin ID or your account type. Only your administrator may change your account type.'
            })
        } else {
            // else, process update
            await editMethod(req.user._id, body, res)
        }
    }


};


// Extracting to be reusable
const editMethod = async (id, body, res) => {
    await User.findByIdAndUpdate(id, body, {
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
}

const deleteMethod = async (id, res) => {

    await User.deleteOne({_id: id})
        .then((data) => {
            if (data.acknowledged) {
                const headers_sent = res.headersSent
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
}

const deleteProfile = async (req, res) => {
    let id = req.params.id;
    let admin = req.user && req.user.type === 'admin'

    // id passed in params by an admin, admin is deleting somebody else
    if (id && admin) {
        // middleware has already confirmed that this is authorised, and there is a user with this id
        // no need to findOne again
        await deleteMethod(id, res)
    }
    // If admin doesn't pass an ID, admin is deleting themselves
    else if (admin && !id) {
        // find all user's who have this admin, have to delete them first. we can't have users who don't have admins.
        await User.deleteMany({admin: req.user._id}).then(async (deletion) => {
            if (deletion.acknowledged) {
                // deleted the users, now delete the admin themselves
                await deleteMethod(req.user._id, res)
            }
        }).catch((e) => {
            res.status(500).json({
                message: 'Sorry. Something went wrong deleting this admin account.'
            })
        })
    }
    // If user is non-admin, and no ID passed, a user/child is deleting themselves
    else if (!admin && !id) {
        return await deleteMethod(req.user._id, res)
    }


};

const viewProfile = (req, res) => {
    const id = req.user._id
    // Pass in fields to populate, e.g. ?populate=avatar&populate=my_list
    // Which will replace the IDs in these fields with their corresponding objects
    const populate = req.query.populate;

    // connect to db and retrieve festival with :id
    User.findById(id)
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
    // Search by the ID of the person currently logged in

    let id;

    if(req.user.type === 'admin'){
        id = mongoose.mongo.ObjectId(req.user._id);
    }
    else{
        id = mongoose.mongo.ObjectId(req.user.admin);
    }

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
    verifyAdmin
};
