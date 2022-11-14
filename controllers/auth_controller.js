const {getFilter} = require("../utils/age_ratings");
const Title = require('../models/title_schema')
const {getAuthorisedResults, compareFields} = require("../utils/verify_auth");
const mongoose = require('mongoose')
const validate_imdb_id = require('../utils/imdb_validate')
const searchPipeline = require('../utils/search_pipeline')
const User = require('../models/user_schema').model


const aggregateTitle = async (searchPipeline, request_value, req, res) => {
    let authorised_results, failing_fields;
    return await Title.aggregate([
        searchPipeline(request_value)
    ]).limit(parseInt(req?.query?.limit ?? 5))
        .then(async (data) => {
            if (data.length) {

                // in the case of the search, it makes sense to filter out results here
                // e.g. maybe a user is subscribed only to movies, and searched for 'breaking bad'
                // breaking bad is a show, but there could also be movie results for that query, so let's filter it, instead of just returning
                // as soon as we encounter an unauthorised resource
                const result = await getAuthorisedResults(data, req.filter, true)

                let authorised_results = result.authorised_results;
                let failing_fields = result.failing_fields


                return {
                    data,
                    authorised_results,
                    failing_fields
                }

            }


        })
        .catch((err) => {
            console.error(err);
            if (err.name === "CastError") {
                return res.status(400).json({
                    message: `Bad request.`,
                });
            } else {
                return res.status(500).json(err);
            }
        })

}

// Remember middleware takes in 'request, response, and next'
const loginRequired = (req, res, next) => {
    if (req.user) {
        let filter = getFilter(req.user)

        if (filter) {
            req.filter = filter
            next();
        } else {
            res.status(401).json({
                // This shouldn't actually happen
                msg: "Invalid user object, missing properties! Is your token valid?",
            });
        }


    } else {
        res.status(401).json({
            msg: "Unauthorised user!",
        });
    }
};

// Database administrator performs create/edit/delete on Titles (movie/show listings)
const isDatabaseAdmin = (req, res, next) => {
    if (req.user.database_admin) {
        next()
    } else {
        res.status(401).json({
            msg: "Unauthorised user! Only database administrators are authorised to access that resource.",
        });
    }
}

// User of type 'admin' is an account owner
// There are also 'child' and 'user' type Users, who have admin IDs
// A child or user account can be deleted/edited by their admin
const adminRequired = async (req, res, next) => {
    let admin = req.user && req.user.type === 'admin'
    // if no id is passed, they want to delete/edit themselves

    // deleting/editing your own account is always allowed, don't need admin for that
    // but if an ID is passed, you're trying to delete somebody else's account,
    // in which case you need to be an admin, and that user must have your ID as their admin ID

    // if an admin wants to delete themselves, we should recursively delete all users they are the admin for
    let id = req.params.id

    // id and admin, admin is deleting/editing somebody else
    if (id && admin) {
        // first get the user they're trying to delete, find out if their admin ID matches the current user's ID
        await User.findOne({_id: id}).then((data) => {
            if (data) {
                // if we found the user they're looking for, read their admin ID
                if (data.admin.toString() === req.user._id.toString()) {
                    // if this is true, they are this user's admin, proceed with the request
                    next()
                } else {
                    res.status(401).json({
                        // Returning admin ID to make debugging easier
                        message: `Unauthorised. You are not the administrator for account with id: ${id}. Admin ID is: ${data.admin}`,
                    });
                }
            } else {
                res.status(404).json({
                    message: `User with id: ${id} not found`,
                });
            }
        })
    }

    // if an ID was passed, the user is trying to delete/edit somebody other than themselves, which is not allowed for non-admins
    else if (!admin && id) {

        res.status(401).json({
            msg: "Unauthorised. Only admins are authorised to edit or delete other users.",
        });

    }
    /*
    if admin and !id, or !admin and !id, proceed
    it's either an admin deleting/editing themselves (if deleting, delete all dependent users)
    or a user deleting/editing themselves, which is fine
    */

    else {
        if (req.user)
            next()
    }

}

// We don't need to check user auth here, because all the title routes use loginRequired anyway
const checkSubscriptionType = async (req, res, next) => {
    let request_type = req.params && Object.keys(req.params)[0]
    let request_value = req.params && Object.values(req.params)[0]


    if (request_type === 'type') {
        request_value = request_value.toUpperCase()
        const filter = req.filter.type.$regex
        if ((request_value === 'SHOWS' || request_value === 'MOVIES') && filter) {
            // e.g. if filter says we can view 'movies and shows' and we requested 'movies', go ahead
            if (!request_value.includes(filter)) {
                res.status(401).json({
                    msg: `Sorry, your subscription doesn't include the type of resource you requested. Upgrade your subscription to view this resource.`
                })
            } else {
                next()
            }
        } else {
            res.status(401).json({
                msg: 'Sorry, something went wrong.'
            })
        }
    } else if (request_type === 'id' || request_type === 'title' || request_type === 'show') {
        let response, authorised_results;
        let failing_fields = []

        // In the case of /titles/type, we can determine whether the user is authorised to access that resource or not based on the request filter object,
        // but for /id or /title, we have to make the request to know, since we don't know in advance whether they're searching for a Title of type 'SHOW' or 'MOVIE'

        // I've omitted the $match pipeline here,
        // I don't want to filter the results at all, just let it return whatever it finds,
        // then determine whether the result's attributes match up with the user's permissions
        if (request_type === 'title') {
            await aggregateTitle(searchPipeline, request_value, req, res).then((res) => {
                authorised_results = res.authorised_results;
                failing_fields = res.failing_fields;
            })
        } else {
            // Make an initial request which we won't pass to the user,
            // Look through the result to determine if the user's subscription type allows them to view this resource


            if (mongoose.Types.ObjectId.isValid(request_value) && request_type === 'id') {
                await Title.findOne({
                    _id: request_value,
                }).then((res) => {
                    response = res;
                    failing_fields = compareFields(res, req.filter, true)
                }).catch((err) => {
                    console.error(err);
                    if (err.name === "CastError") {
                        res.status(400).json({
                            message: `Bad request, "${request_value}" is not a valid id`,
                        });
                    } else {
                        res.status(500).json(err);
                    }
                });
                // This endpoint is for shows only
                // Modify user's filter object to search only for shows regardless of their plan
            } else if (request_type === 'show') {
                let request_value = request_type == 'show' ? req?.params?.show : req?.params?.movie
                let search_type;

                let tempFilter = {
                    ...req.filter,
                    $regex: {
                        type: 'SHOW'
                    }
                }


                let imdb_id_valid = request_value && validate_imdb_id(request_value)

                // If we received a valid imdb id, search using that, otherwise try searching by title
                search_type = imdb_id_valid ? 'imdb_id' : 'title';

                if (search_type === 'title') {
                    // aggregate is better to use if searching by title, has fuzzy search
                    // I could RegEx it, but fuzzy search is more likely to get it right
                    let response = await aggregateTitle(searchPipeline, request_value, {
                        ...req,
                        filter: tempFilter
                    }, res)

                    authorised_results = response?.authorised_results;
                    failing_fields = response?.failing_fields

                } else {
                    await Title.find({
                        imdb_id: request_value,
                        type: 'SHOW',
                    }).limit(req.query.limit ?? 5).then(async (aggregateResponse) => {
                        response = aggregateResponse;
                        await getAuthorisedResults(response, req.filter, true)
                            .then((res) => {
                                authorised_results = res.authorised_results;
                                failing_fields = res.failing_fields
                            })

                    }).catch((err) => {
                        console.error(err);
                        if (err.name === "CastError") {
                            res.status(400).json({
                                message: `Bad request, "${request_value}" is not a valid id`,
                            });
                        } else {
                            res.status(500).json(err);
                        }
                    });
                }
            } else {
                res.status(401).json({
                    msg: 'Sorry, something went wrong.'
                })
            }
        }


        // ^^ Make an initial request which we won't pass to the user,
        // Now use verifyAuthorisation to look through the result to determine which attributes, if any, don't align with the user's account settings
        // (e.g. is of type MOVIE, but user subscribes only to shows)
        if (failing_fields?.length && !authorised_results?.length) {
            return res.status(401).json({
                message: `Sorry, no resources were found which you are authorised to access. If you were searching for a specific title, try increasing the limit.`,
                "Review the following account attributes": failing_fields
            });
        } else {
            // We already have our preliminary search result in this case, so attach it to the request, then we'll apply maturity filters
            if (request_type === 'id') {
                req.unfilteredResponse = response
            } else {
                // multiple results for other request types
                req.unfilteredResponse = authorised_results
            }
            next()
        }

    }
}

module.exports = {
    loginRequired,
    checkSubscriptionType,
    isDatabaseAdmin,
    adminRequired
};
