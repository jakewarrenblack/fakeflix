const Title = require("../models/title_schema");
const {compareFields} = require('../utils/verify_auth')
const validate_imdb_id = require("../utils/imdb_validate");
const searchPipeline = require('../utils/search_pipeline')
const axios = require('axios')
const {model: User} = require("../models/user_schema");

const getQueryParams = (req) => {
    let limit = req.query.limit && parseInt(req.query.limit);
    // Make sure this is a valid sorting value by checking it against the fields in the schema
    let sort = Object.keys(Title.schema.paths).includes(req.query?.sort) && req.query.sort;
    let direction = req?.query?.order === 'asc' ? 1 : -1 || undefined

    // Creating another filter to make sure the value we're sorting by is not null
    // E.g. if sorting by imdb_id, many Titles don't have an imdb_id, so will appear higher than the highest rating in the list when sorted
    let secondFilter;
    if (sort) {
        secondFilter = {
            // ES6 computed property name, using a variable as an object key
            // Values are also often empty strings despite being of type number in the schema, so filter these out if we're trying to sort
            $and: [{[sort]: {$ne: null}}, {[sort]: {$ne: ""}}]
        }
    }

    let queryParams = {
        limit,
        sort,
        direction,
        secondFilter
    }

    return queryParams
}

const checkFailingFields = (req, filter, query, res) => {


    // Even if it's an array and there are multiple objects with failing fields, return the first one, they'll all be failing based on the user's subscription type anyway

    if (req.unfilteredResponse) {
        if (typeof req.unfilteredResponse === 'object') {
            req.unfilteredResponse = req.unfilteredResponse[0] ?? req.unfilteredResponse._doc
        } else {
            if (!req.unfilteredResponse?._id)
                req.unfilteredResponse = req.unfilteredResponse._doc
        }
    }


    // we'll have an unfiltered response object passed from the middleware
    let failingFields = compareFields(req.unfilteredResponse, filter, false)


    if (failingFields?.length) {
        res.status(404).json({
            message: `Results were found for '${query}', but don't match up with your maturity settings. The following settings are applied:`,
            // Filtering out 'falsey' values, which I've just applied to the unrestricted category to include unrated titles
            "Maturity types": filter.age_certification.$in.filter(rating => rating),
        });
        return;
    } else {
        return false
    }
}


const viewAll = (req, res) => {
    // A filter is generated based on the user's type, subscription type, and maturity settings
    // 'child' type user defaults to listings suitable for children
    // users see movies only, shows only, or both, depending on their subscription type
    // for users of any type but child, results are filtered by age rating based on the users maturity settings

    // maturity settings inherit from one another,
    // e.g. a user with 'unrestricted' settings will see listings from all 3 maturity categories
    let {sort, limit, direction, secondFilter} = getQueryParams(req)

    if(!limit){
        limit = 50
    }

    // Adding pagination
    let page;

    // assign if param provided, or return first page by default
    page = parseInt(req.query?.page) ?? 1

    // new default limit will be 30
    // because we want 3 rows with 10 movies/shows each to begin with



    const skip = (page-1) * limit;

    // If second filter is present, combine the two
    // syntax for two combined filters: { $or : [{age_certification: {$in: ['TV-MA']}}, {age_certification: {$ne: null}}]}
    Title.find(secondFilter ? {$or: [req.filter, secondFilter]} : req.filter)
        .sort([[sort ?? 'title', direction === 'asc' ? 1 : -1]])
        .skip(skip)
        .limit(limit)
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

    let {sort, limit, direction} = getQueryParams(req)


    // If all is well, our filters allow for accessing this resource

    // with an aggregate search, the sort value must be applied to the pipeline
    let pipeline;
    pipeline = sort && direction ? searchPipeline(title, filter, sort, direction) : searchPipeline(title, filter)

    Title.aggregate([pipeline])
        .limit(limit ?? 5)
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

    // checkFailingField will respond if there are failing fields, returns false if no failing fields (fields that are incompatible with maturity settings, e.g. a child won't get an 18+ film)
    if (!checkFailingFields(req, filter, id, res)) {
        Title.findOne({_id: id})
            .limit(req.query.limit ?? 5)
            .then((data) => {
                if (data) {
                    res.status(200).json(data);
                } else {
                    res.status(404).json({
                        message: `Title with id: ${id} not found`,
                    });
                }
            })
    }
};

// Because of our checkSubscriptionType middleware, we know that if a user gets to this point,
// they're authorised to view /titles/shows, or /titles/movies
const getAllByType = (req, res) => {

    let type = req.params.type.toUpperCase()
    // if it's plural, make it singular to conform with Title's 'SHOW' or 'MOVIE' types
    type = type.slice(0, type[type.length - 1] === 'S' && -1) // -1 is last char

    let {sort, limit, direction, secondFilter} = getQueryParams(req)

    if(!limit){
        limit = 50
    }

    // Adding pagination
    let page;

    // assign if param provided, or return first page by default
    page = parseInt(req.query?.page) ?? 1

    // new default limit will be 30
    // because we want 3 rows with 10 movies/shows each to begin with



    const skip = (page-1) * limit;


    // If sort passed, apply the second filter to remove null values for the sort, improving sorting accuracy
    // spread operator to replace filter's existing 'type' attribute with the type received from params
    Title.find({...req.filter, type: type, ...secondFilter})
        .sort([[sort ?? 'title', direction === 'asc' ? 1 : -1]])
        .skip(skip)
        .limit(limit)
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


const createTitle = (req, res) => {
    let newTitle = new Title(req.body)

    newTitle.save((err, user) => {
        if (err) {
            return res.status(400).json({
                msg: err.message,
            });
        } else {
            user.password = undefined;
            return res.status(201).json(user);
        }
    });
}


const updateTitle = (req, res) => {
    let id = req.params.id;
    let body = req.body;

    Title.findByIdAndUpdate(id, body, {
        new: true,
    })
        .then((data) => {
            if (data) {
                res.status(201).json(data);
            } else {
                res.status(404).json({
                    message: `Title with id: ${id} not found`,
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

// deleteTitle doesn't necessarily have to remove the title reference from user's favourites list
// on something like netflix, if a user has a favourite title which has been deleted, it just won't show up in their list
// just as .populate won't return anything for it in our case
const deleteTitle = (req, res) => {
    let id = req.params.id;

    Title.deleteOne({_id: id})
        .then((data) => {
            if (data.deletedCount) {
                res.status(200).json({
                    message: `Title with id: ${id} deleted successfully`,
                });
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
                    message: `Bad request, ${id} is not a valid id`,
                });
            } else {
                res.status(500).json(err);
            }
        });
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
    let pipeline;
    // Will respond if failing fields present. Checking the unfiltered response received from auth_controller
    if (!checkFailingFields(req, req.filter, request_value, res)) {
        let search_type;
        let imdb_id = request_value && validate_imdb_id(request_value)

        // If we received a valid imdb id, search using that, otherwise try searching by title
        search_type = imdb_id ? 'imdb_id' : 'title';

        let {limit, sort, direction} = getQueryParams(req)

        let tempFilter = {
            ...req.filter,
            type: {
                $regex: 'SHOW',
            },
        }

        // passing undefined values is fine
        pipeline = searchPipeline(request_value, tempFilter, sort, direction)

        // pipeline = sort || direction || limit ? searchPipeline(request_value, tempFilter, sort, direction) : searchPipeline(request_value, tempFilter)

        let additionalInfo = req?.query?.moreDetail


        if (search_type === 'title') {
            // Endpoint is specifically for shows, filter out movies on the filter object temporarily, regardless of the subscription type

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
                            message: `No valid results found for '${request_value}'. Remember this is endpoint is for shows only. Note the following attributes apply to your account:`,
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
                type: 'SHOW'
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
                        message: `No titles found. Remember, this endpoint is for shows only.`,
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
}


module.exports = {
    viewAll,
    getByName,
    getById,
    getAllByType,
    createTitle,
    getShow,
    updateTitle,
    deleteTitle
};
