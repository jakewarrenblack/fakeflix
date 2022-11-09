const Title = require("../models/title_schema");

// TODO: Also, control responses based on age rating + restrictions/child account type

// TODO: Endpoint with additional info from TVMaze API

// TODO: (In combination with above new episode endpoint)
// get episodes by season
// get episode by title
// get all episodes (by programme id)

// TODO: Pagination, provide param for number of results, 10, 20, 40, etc

// TODO: Maybe dynamic .find method, pass in some param like category

const viewAll = (req, res) => {
  // Match where type contains 'MOVIE' or 'SHOW'
  let rgx = RegExp(/(^SHOW|MOVIE$){0,1}/);
  let s = req.user.subscription.toUpperCase();
  let val = (s == "SHOWS" && "SHOW") || (s == "MOVIES" && "MOVIE") || rgx;

  Title.find({
    type: {
      $regex: val,
    },
  })
    .then((data) => {
      console.log(data);
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

const getByName = (req, res) => {
  let name = req.body.title;

  Title.findOne({ title: name })
    .then((data) => {
      if (data) {
        res.status(200).json(data);
      } else {
        res.status(404).json({
          message: `Title with name: ${name} not found`,
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

const getById = (req, res) => {
  let id = req.params.id;

  Title.findOne({ _id: id })
    .then((data) => {
      if (data) {
        res.status(200).json(data);
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
          message: `Bad request, "${id}" is not a valid id`,
        });
      } else {
        res.status(500).json(err);
      }
    });
};

const getAllShows = (req, res) => {
  Title.find({ type: "SHOW" })
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

const getAllMovies = (req, res) => {
  Title.find({ type: "MOVIE" })
    .then((data) => {
      if (data) {
        res.status(200).json(data);
      } else {
        res.status(404).json({
          message: `No titles of type 'MOVIE' found`,
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

const sortByImdbScore = (req, res) => {
  let limit = req.params.limit;

  Title.find({ imdb_score: { $ne: null } })
    // .sort({ imdb_score: -1 })
    .limit(limit ?? 20)
    .then((data) => {
      if (data) {
        res.status(200).json(data);
      } else {
        res.status(404).json({
          message: `No titles of type 'MOVIE' found`,
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

module.exports = {
  viewAll,
  getByName,
  getById,
  getAllMovies,
  getAllShows,
  sortByImdbScore,
};
