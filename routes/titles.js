const express = require("express");
const router = express.Router();
const {loginRequired, checkSubscriptionType, isDatabaseAdmin} = require("../controllers/auth_controller")

const {
    viewAll,
    getByName,
    getAllByType,
    getById,
    getShow,
    createTitle,
    updateTitle,
    deleteTitle
} = require("../controllers/title_controller");

// Every Title route requires login, which we've applied in server.js, rather than to the /titles route, rather than to each path individually.
// We'll also apply middleware to check the user's subscription type against the type of resource they're trying to access.
// So users subscribed to Movies can see only movie results, or Shows if subscribed to shows, or both if 'Shows & Movies'
// checkSubscriptionType, in combination with compareFields and getAuthorisedResults, will still query for an unauthorised resource to find out what aspect of it makes it unauthorised
// e.g. a user subscribed to shows searches for 'the dark knight'. it will get the result for that anyway, comparing its type with the user's subscription,
// to let the user know that title isn't available, because it doesn't match their subscription type

// in the case that the result is authorised, it passes to the title_controller, where it will be filtered again based on the user's maturity settings
// if it fails again, we let the user know results are available, but they're excluded because of their maturity settings

// otherwise, the user sees the title

// For these two:
// we'll filter individually. they can access these paths, but the resources returned will be limited based on their subscription, user type, and maturity settings
// may pass ?limit=x to this endpoint
router.get("/all", loginRequired, viewAll);

// Useful for when a user wants a broad search, not necessarily searching by type (this uses fuzzy search)
router.get("/title/:title", [loginRequired, checkSubscriptionType], getByName);

// for this one, a user subscribed only to 'movies' cannot access shows, and vice-versa
// will get 'all movies' or 'all shows'
router.get("/type/:type", [loginRequired, checkSubscriptionType], getAllByType);

// gets shows only, can search by imdb ID (validated against RegEx), or a fuzzy search with a string
// if ?moreDetails query param is passed, will also try to make an axios call to TVMaze to return even more detail
router.get("/show/:show", [loginRequired, checkSubscriptionType], getShow);

// searching by generated Mongo ID here, not IMDB ID
// may pass ?limit=x to this endpoint
router.get("/id/:id", [loginRequired, checkSubscriptionType], getById);

// Only database admins can create/update/delete Title listings
router.post("/create", [loginRequired, isDatabaseAdmin], createTitle);
router.put("/update/:id", [loginRequired, isDatabaseAdmin], updateTitle);
router.delete("/delete/:id", [loginRequired, isDatabaseAdmin], deleteTitle);

module.exports = router;
