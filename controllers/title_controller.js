const Title = require("../models/title_schema");
const verifyAuthorisation = require('../utils/verify_auth')

// TODO: Endpoint with additional info from TVMaze API

// TODO: (In combination with above new episode endpoint)
// get episodes by season
// get episode by title
// get all episodes (by programme id)

// TODO: Pagination, provide param for number of results, 10, 20, 40, etc

// TODO: Maybe dynamic .find method, pass in some param like category

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
    /*
     I've applied a search index to the 'title' field of the Title model, which makes it easy to categorise the Title data in an easily searchable format.
     With this search index added, we can use the aggregate method to run a search on the Titles with any number of 'pipeline steps' applied to it.

     Here, I'm just applying a $search, and a $match. with this pipeline, we can perform a fuzzy search, misspell a word slightly, omit some words from a title, etc.
     The result will be filtered based on our filter object as usual.
    */

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
    let failing_fields = []
    let initialRes;

    await Title.findOne({
        _id: id,
    }).then((res) => {
        initialRes = res
        failing_fields = verifyAuthorisation(res, filter)
    })

    if (!failing_fields?.length) {
        Title.findOne({
            _id: id,
            ...filter
        })
            .then((data) => {
                if (data) {
                    res.status(200).json(data);
                } else {
                    res.status(404).json({
                        message: `Title with id: ${id} not found`,
                    });
                }
            })
            .catch((err) => {
                console.error(err);
                if (err.name === "CastError") {
                    res.status(400).json({
                        message: `Bad request, "${id}" is not a valid id`,
                    });
                } else {
                    res.status(500).json(err);
                }
            });
    } else {

        res.status(401).json({
            message: `Sorry, you're not authorised to access that resource.`,
            "Review the following account attributes": failing_fields
        });
    }
};

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
