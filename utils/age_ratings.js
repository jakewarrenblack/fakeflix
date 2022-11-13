const restricted = ["TV-Y", "TV-G", "TV-Y7", "G"];

const semi_restricted = [
    "NC-17",
    "TV-14",
    "PG-13",
    "PG",
    "TV-PG",
    ...restricted,
];

const unrestricted = [
    "TV-MA",
    "R",
    NaN,
    undefined,
    null,
    "",
    // 'include lesser categories and unrated
    ...semi_restricted,
    ...restricted,
];

const age_ratings = {
    unrestricted,
    restricted,
    "semi-restricted": semi_restricted,
};

const getFilter = (object) => {
    if (object.subscription && object.maturity_setting && object.type) {
        const s = object.subscription.toUpperCase();
        let allowed;
        // Match where type contains 'MOVIE' or 'SHOW'
        // i = ignore case
        const rgx = RegExp(/(^SHOW|MOVIE$)?/, "i");
        const type = (s === "SHOWS" && "SHOW") || (s === "MOVIES" && "MOVIE") || rgx;

        // If type is child, ignore maturity settings and default to types suitable for children only
        // otherwise, determine the age_ratings included in the filter based on the user's maturity settings
        object.type === "child"
            ? (allowed = age_ratings.restricted)
            : (allowed = age_ratings[object.maturity_setting]);

        return {
            // Has to be in the array of allowed ratings for this account's restriction settings.
            // If it's a child, only 'unrestricted' listings are shown.
            // Semi-restricted user sees restricted/semi-restricted, unrestricted sees all 3 categories.
            age_certification: {$in: allowed},
            type: {
                $regex: type, // Return movies or shows based on subscription type
            },
        }
    } else {
        return false;
    }
};

module.exports = {
    age_ratings,
    getFilter,
};
