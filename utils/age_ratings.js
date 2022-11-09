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

module.exports = age_ratings;
