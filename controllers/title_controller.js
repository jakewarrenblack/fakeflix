const Title = require("../models/title_schema");
const {compareFields} = require('../utils/verify_auth')
const validate_imdb_id = require("../utils/imdb_validate");
const searchPipeline = require('../utils/search_pipeline')
const axios = require('axios')

const checkFailingFields = (req, filter, query, res) => {


    // Even if it's an array and there are multiple objects with failing fields, return the first one, they'll all be failing based on the user's subscription type anyway

    if (req.unfilteredResponse) {
        if (typeof req.unfilteredResponse === 'object') {
            req.unfilteredResponse = req.unfilteredResponse[0]
        } else {
            if (!req.unfilteredResponse?._id)
                req.unfilteredResponse = req.unfilteredResponse._doc
        }
    }


    // we'll have an unfiltered response object passed from the middleware
    let failingFields = compareFields(req.unfilteredResponse, filter, false)


    if (failingFields?.length) {
        res.status(404).json({
            message: `Results were found for '${query}', but your it doesn't match up with your maturity settings. The following settings are applied:`,
            // Filtering out 'falsey' values, which I've just applied to the unrestricted category to include unrated titles
            "Maturity types": filter.age_certification.$in.filter(rating => rating),
        });
    }
}

// TODO: Endpoint with additional info from TVMaze API:
// - get episodes by season
// - get episode by title
// - get all episodes (by programme id)


// TODO: Pagination, provide param for number of results, 10, 20, 40, etc
// TODO: Maybe dynamic .find method, pass in some param like category
// TODO: Add sort by imdb score, etc
// ^^ Making this modular to apply to all methods preferable

// TODO: Add limit, sortBy, sorting direction (asc/desc), which page you want to view
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
     I've applied a search index to the 'title' field of the Title model, which makes it possible to categorise the Title data in an easily searchable format.
     With this search index added, we can use the aggregate method to run a search on the Titles with any number of 'pipeline steps' applied to it.
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


    // If all is well, our filters allow for accessing this resource
    Title.aggregate([
        searchPipeline(title, filter)
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

    // checkFailingField will return if there are failing fields, no need to .then, .catch
    checkFailingFields(req, filter, id, res)


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


// TODO: createTitle()
const createTitle = () => {
    throw new Error('Not yet implemented')
}

// TODO: updateTitleByID()
const updateTitle = () => {
    throw new Error('Not yet implemented')
}

// TODO: deleteTitleById()
const deleteTitle = () => {
    throw new Error('Not yet implemented')
}

// make a call to TVMaze to get some more info about this programme
const getAdditionalShowInfo = async (response) => {
    // regardless of what way we searched initially, we'll use the imdb id (if exists) from the response

    if (response.imdb_id)
        return await axios.get(`https://api.tvmaze.com/lookup/shows?imdb=${response.imdb_id}`).then((res) => {
            return res.data;
        }).catch((e) => console.log(e))
}

const getShow = async (req, res) => {
    let request_value = req?.params?.show
    let filter = req.filter
    // Will respond if failing fields present. Checking the unfiltered response received from auth_controller
    checkFailingFields(req, req.filter, request_value, res)
    let search_type;
    let imdb_id = request_value && validate_imdb_id(request_value)

    // If we received a valid imdb id, search using that, otherwise try searching by title
    search_type = imdb_id ? 'imdb_id' : 'title';

    let pipeline = (searchPipeline(request_value, filter))

    let additionalInfo = req?.query?.moreDetail


    if (search_type === 'title') {
        await Title.aggregate([pipeline]).limit(5)
            //.allowDiskUse(true)
            .then(async (data) => {

                if (data.length) {

                    if (additionalInfo) {
                        for (let i = 0; i < data.length; i++) {
                            data[i].additional_info = await getAdditionalShowInfo(data[i]).then((res) => res)
                        }

                    }


                    res.status(200).json(data);
                } else {
                    res.status(404).json({
                        message: `No valid results found for '${request_value}'.Note the following attributes apply to your account:`,
                        Attributes: {
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

    } else {
        await Title.find({
            imdb_id: request_value,
            type: 'SHOW',
        }).limit(req.query.limit ?? 5).then(async (aggregateResponse) => {
            let response = aggregateResponse;

            if (response) {

                if (additionalInfo) {
                    for (let i = 0; i < response.length; i++) {
                        response[i]._doc.additional_info = await getAdditionalShowInfo(response[i]).then((res) => res)
                    }
                }

                res.status(200).json(response);

            } else {
                res.status(404).json({
                    message: `No titles found`,
                });
            }

        }).catch((err) => {
            console.error(err);
            if (err.name === "CastError") {
                res.status(400).json({
                    message: `Bad request.`,
                });
            } else {
                res.status(500).json(err);
            }
        });
    }


}

module.exports = {
    viewAll,
    getByName,
    getById,
    getAllByType,

    getShow,
};
