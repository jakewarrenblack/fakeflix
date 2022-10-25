// Remember middleware takes in 'request, response, and next'
const loginRequired = (req, res, next) => {
  if (req.user) {
    next();
  }

  res.status(401).json({
    msg: "Unauthorised user!",
  });
};

module.exports = {
  loginRequired,
};
