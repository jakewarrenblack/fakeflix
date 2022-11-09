// Remember middleware takes in 'request, response, and next'
const loginRequired = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.status(401).json({
      msg: "Unauthorised user!",
    });
  }
};

// TODO: Add roles to auth? E.g. 'basic' user can't get shows, only movies

module.exports = {
  loginRequired,
};
