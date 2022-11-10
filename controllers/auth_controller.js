const {getFilter} = require("../utils/age_ratings");

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
const checkSubscriptionType = (req, res, next) => {
    const type = req.params.type.toUpperCase()
    const filter = req.filter.type.$regex


    if ((type === 'SHOWS' || type === 'MOVIES') && filter) {
        // eg if filter says we can view 'movies and shows' and we requested 'movies', go ahead
        if (!type.includes(filter)) {
            res.status(401).json({
                msg: `Sorry, your subscription only includes ${type}. Upgrade your subscription to view this resource.`
            })
        } else {
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
