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
  const s = object.subscription.toUpperCase();
  let allowed;
  // Match where type contains 'MOVIE' or 'SHOW'
  const rgx = RegExp(/(^SHOW|MOVIE$){0,1}/);
  const type = (s == "SHOWS" && "SHOW") || (s == "MOVIES" && "MOVIE") || rgx;

  object.type == "child"
    ? (allowed = age_ratings.unrestricted)
    : (allowed = age_ratings[object.maturity_setting]);

  const filter = {
    // Has to be in the array of allowed ratings for this account's restriction settings.
    // If it's a child, only 'unrestricted' listings are shown.
    // Semi-restricted user sees restricted/semi-restricted, unrestricted sees all 3 categories.
    age_certification: { $in: allowed },
    type: {
      $regex: type, // Return movies or shows based on subscription type
    },
  };

  return filter;
};

module.exports = {
  age_ratings,
  getFilter,
};
