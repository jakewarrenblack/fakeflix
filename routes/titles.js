const express = require("express");
const router = express.Router();
const { loginRequired } = require("../controllers/auth_controller");

const {
  viewAll,
  getByName,
  getAllShows,
  getAllMovies,
  sortByImdbScore,
} = require("../controllers/title_controller");

router.get("/", viewAll);
router.get("/single", getByName);
router.get("/shows", getAllShows);
router.get("/movies", getAllMovies);
router.get("/top_scores", sortByImdbScore);

module.exports = router;
