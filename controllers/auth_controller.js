const {getFilter} = require("../utils/age_ratings");
const Title = require('../models/title_schema')
const verifyAuth = require('../utils/verify_auth')
const compareFields = require("../utils/verify_auth");
const {getByName} = require('./title_controller')
const mongoose = require('mongoose')

// Remember middleware takes in 'request, response, and next'
const loginRequired = (req, res, next) => {
    if (req.user) {
        req.filter = getFilter(req.user);

        next();
    } else {
        res.status(401).json({
            msg: "Unauthorised user!",
        });
    }
};

// We don't need to check user auth here, because all the title routes use loginRequired anyway
const checkSubscriptionType = async (req, res, next) => {
    let request_type = req.params && Object.keys(req.params)[0]
    let request_value = req.params && Object.values(req.params)[0]


    if (request_type === 'type') {
        request_value = request_value.toUpperCase()
        const filter = req.filter.type.$regex
        if ((request_value === 'SHOWS' || request_value === 'MOVIES') && filter) {
            // e.g. if filter says we can view 'movies and shows' and we requested 'movies', go ahead
            if (!request_type.includes(filter)) {
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
    } else if (request_type === 'id' || request_type === 'title') {
        let response, authorised_results;
        let failing_fields = []

        // In the case of /titles/type, we can determine whether the user is authorised to access that resource or not based on the request filter object,
        // but for /id or /title, we have to make the request to know, since we don't know in advance whether they're searching for a Title of type 'SHOW' or 'MOVIE'

        // I've omitted the $match pipeline here,
        // I don't want to filter the results at all, just let it return whatever it finds,
        // then determine whether the result's attributes match up with the user's permissions
        if (request_type === 'title') {
            await Title.aggregate([
                {
                    '$search': {
                        'index': 'default',
                        'text': {
                            'query': request_value,
                            'path': {
                                'wildcard': '*'
                            },
                            'fuzzy': {
                                // number of characters that can be changed to match the term
                                'maxEdits': 1,
                                // max number of variations on the search term to generate and search for
                                'maxExpansions': 100
                            }
                        }
                    },
                },
                // Just check the first result, most likely to be what they were trying to access
            ]).limit(parseInt(req.query.limit) ?? 5)
                .then((data) => {
                    if (data.length) {

                        // in the case of the search, it makes sense to filter out results here
                        // e.g. maybe a user is subscribed only to movies, and searched for 'breaking bad'
                        // breaking bad is a show, but there could also be movie results for that query, so let's filter it, instead of just returning
                        // as soon as we encounter an unauthorised resource
                        authorised_results = data.filter((result, i, data) => {
                            // check if there are no invalid fields
                            let unauthorised_fields = compareFields(result, req.filter, true)

                            // if compareFields didn't return anything
                            if (!(unauthorised_fields)) {
                                return result;

                                // if there are unauthorised fields in this result
                            } else {
                                // if we already know this field failed to return some result, don't bother pushing it
                                if (!failing_fields.includes(unauthorised_fields[0])) {
                                    failing_fields = unauthorised_fields
                                }
                            }
                        })
                    }
                })
                .catch((err) => {
                    console.error(err);
                    if (err.name === "CastError") {
                        res.status(400).json({
                            message: `Bad request.`,
                        });
                    } else {
                        res.status(500).json(err);
                    }
                });
        } else {
            // Make an initial request which we won't pass to the user,
            // Look through the result to determine if the user's subscription type allows them to view this resource


            if (mongoose.Types.ObjectId.isValid(request_value)) {
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
            } else {
                return res.status(400).json({
                    message: `Bad request, "${request_value}" is not a valid id`,
                });
            }
        }


        // ^^ Make an initial request which we won't pass to the user,
        // Now use verifyAuthorisation to look through the result to determine which attributes, if any, don't align with the user's account settings
        // (e.g. is of type MOVIE, but user subscribes only to shows)
        if (failing_fields?.length && !authorised_results?.length) {
            res.status(401).json({
                message: `Sorry, no resources were found which you are authorised to access. If you were searching for a specific title, try increasing the limit.`,
                "Review the following account attributes": failing_fields
            });
        } else {
            // We already have our preliminary search result in this case, so attach it to the request, then we'll apply maturity filters
            if (request_type === 'id') {
                req.unfilteredResponse = response
            } else {
                req.unfilteredResponse = authorised_results
            }

            request_type === 'id' ? req.unfilteredResponse = response : req.unfilteredResponse = authorised_results
            next()
        }

    } else {
        res.status(401).json({
            msg: 'Sorry, something went wrong.'
        })
    }

}

module.exports = {
    loginRequired,
    checkSubscriptionType
};
