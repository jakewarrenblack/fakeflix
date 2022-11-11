const Title = require("../models/title_schema");
const compareFields = require('../utils/verify_auth')

// TODO: Apply verify_auth to all of these routes? More or less all
// TODO: Endpoint with additional info from TVMaze API
// TODO: (In combination with above new episode endpoint)
// - get episodes by season
// - get episode by title
// - get all episodes (by programme id)


// TODO: Pagination, provide param for number of results, 10, 20, 40, etc
// TODO: Maybe dynamic .find method, pass in some param like category
// ^^ Making this modular to apply to all methods preferable

const viewAll = (req, res) => {
    // A filter is generated based on the user's type, subscription type, and maturity settings
    // 'child' type user defaults to listings suitable for children
    // users see movies only, shows only, or both, depending on their subscription type
    // for users of any type but child, results are filtered by age rating based on the users maturity settings

    // maturity settings inherit from one another,
    // e.g. a user with 'unrestricted' settings will see listings from all 3 maturity categories
    Title.find(req.filter)
        .then((data) => {
            //console.log(data);
            if (data.length > 0) {
                res.status(200).json(data);
            } else {
                res.status(404).json("None found");
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json(err);
        });
};

const getByName = async (req, res) => {
    const title = req.params.title
    const filter = req.filter
    let failingFields = []
    /*
     I've applied a search index to the 'title' field of the Title model, which makes it easy to categorise the Title data in an easily searchable format.
     With this search index added, we can use the aggregate method to run a search on the Titles with any number of 'pipeline steps' applied to it.

     Here, I'm just applying a $search, and a $match. with this pipeline, we can perform a fuzzy search, misspell a word slightly, omit some words from a title, etc.
     The result will be filtered based on our filter object as usual.
    */

    // we'll have an unfiltered (unfiltered for maturity settings) response object passed from the middleware

    // now I'm filtering again, but checking whether the maturity settings match (we already know the user's subscription type allows them to view this resource

    if (req.unfilteredResponse) {
        failingFields = compareFields(req.unfilteredResponse, filter, false)

        if (failingFields?.length) {
            res.status(404).json({
                message: `Results were found for '${title}', but your it doesn't match up with your maturity settings. The following settings are applied:`,
                // Filtering out 'falsey' values, which I've just applied to the unrestricted category to include unrated titles
                "Maturity types": filter.age_certification.$in.filter(rating => rating),
            });
        }
    }


    Title.aggregate([
        {
            '$search': {
                'index': 'default',
                'text': {
                    'query': title,
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
        {
            '$match': {
                // We have to spread the filter object to apply its individual attributes to the match
                ...filter
            }
        }
    ]).limit(5)
        .then((data) => {

            if (data.length) {
                res.status(200).json(data);
            } else {
                // Return a message letting the user know which settings they have applied, in case this is affecting the result
                res.status(404).json({
                    message: `No valid results found for '${title}'.Note the following attributes apply to your account:`,
                    Attributes: {
                        // No point in showing the user the "falsey" values which are included in unrestricted maturity tier
                        // Filtering these from the resulting array
                        "Maturity types": filter.age_certification.$in.filter(rating => rating),
                        "Subscription type": filter.type.$regex
                    }
                });
            }


        })
        .catch((err) => {
            console.error(err);
            if (err.name === "CastError") {
                res.status(400).json({
                    message: `Bad request, "${name}" is not a valid name`,
                });
            } else {
                res.status(500).json(err);
            }
        });

};

const getById = async (req, res) => {
    let id = req.params.id;
    const filter = req.filter
    // If the user got past the middleware, we know they're authorised to access whatever it is they're requesting,
    // now their filters will determine whether it's returned or not

    let failingFields = []

    if (req.unfilteredResponse) {
        if (!req.unfilteredResponse?._id) req.unfilteredResponse = req.unfilteredResponse._doc

        // we'll have an unfiltered response object passed from the middleware
        failingFields = compareFields(req.unfilteredResponse, filter, false)
    }

    if (failingFields?.length) {
        res.status(404).json({
            message: `Results were found for '${id}', but your it doesn't match up with your maturity settings. The following settings are applied:`,
            // Filtering out 'falsey' values, which I've just applied to the unrestricted category to include unrated titles
            "Maturity types": filter.age_certification.$in.filter(rating => rating),
        });
    }


    Title.findOne({_id: id})
        .then((data) => {
            if (data) {
                res.status(200).json(data);
            } else {
                res.status(404).json({
                    message: `Title with id: ${id} not found`,
                });
            }
        })


};

// Because of our checkSubscriptionType middleware, we know that if a user gets to this point,
// they're authorised to view /titles/shows, or /titles/movies
const getAllByType = (req, res) => {
    let type = req.params.type.toUpperCase()
    // if it's plural, make it singular to conform with Title's 'SHOW' or 'MOVIE' types
    type = type.slice(0, type[type.length - 1] === 'S' && -1) // -1 is last char
    Title.find({
        // spread operator to replace filter's existing 'type' attribute with the type received from params
        ...req.filter,
        type: type
    })
        .then((data) => {
            if (data) {
                res.status(200).json(data);
            } else {
                res.status(404).json({
                    message: `No titles of type 'SHOW' found`,
                });
            }
        })
        .catch((err) => {
            console.error(err);
            if (err.name === "CastError") {
                res.status(400).json({
                    message: `Bad request`,
                });
            } else {
                res.status(500).json(err);
            }
        });
};

const sortByImdbScore = (req, res) => {
    let limit = req.params.limit;

    Title.find({imdb_score: {$ne: null}})
        // .sort({ imdb_score: -1 })
        .limit(limit ?? 20)
        .then((data) => {
            if (data) {
                res.status(200).json(data);
            } else {
                res.status(404).json({
                    message: `No titles of type 'MOVIE' found`,
                });
            }
        })
        .catch((err) => {
            console.error(err);
            if (err.name === "CastError") {
                res.status(400).json({
                    message: `Bad request`,
                });
            } else {
                res.status(500).json(err);
            }
        });
};

module.exports = {
    viewAll,
    getByName,
    getById,
    getAllByType,
    sortByImdbScore,
};
