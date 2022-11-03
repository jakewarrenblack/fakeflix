const Title = require("../models/title_schema");

const viewAll = (req, res) => {
  Title.find()
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
