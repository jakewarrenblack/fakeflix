const express = require("express");
const router = express.Router();
const {loginRequired, checkSubscriptionType} = require("../controllers/auth_controller")

const {
    viewAll,
    getByName,
    getAllByType,
    sortByImdbScore, getById,
} = require("../controllers/title_controller");

// Every Title route requires login, which we've applied in server.js, rather than to the /titles route, rather than to each path individually.
// We'll also apply middleware to check the user's subscription type against the type of resource they're trying to access.

// For these two:
// we'll filter individually. they can access these paths, but the resources returned will be limited based on their subscription, user type, and maturity settings
// The user may include a type,
router.get("/all", loginRequired, viewAll);
router.get("/title/:title", [loginRequired, checkSubscriptionType], getByName);

// for this one, a user subscribed only to 'movies' cannot access shows, and vice-versa
router.get("/type/:type", [loginRequired, checkSubscriptionType], getAllByType);

router.get("/id/:id", [loginRequired, checkSubscriptionType], getById);

router.get("/top_scores", sortByImdbScore);

module.exports = router;
