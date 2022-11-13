const Avatar = require("../models/avatar_schema").model;


const viewAll = (req, res) => {
    Avatar.find()
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


// TODO: Image upload here
const createData = (req, res) => {
    let avatarData = req.body;

    Avatar.create(avatarData)
        .then((data) => {
            console.log("New Avatar Created!", data);
            res.status(201).json(data);
        })
        .catch((err) => {
            if (err.name === "ValidationError") {
                console.error("Validation Error!!", err);
                res.status(422).json({
                    msg: "Validation Error",
                    error: err.message,
                });
            } else {
                console.error(err);
                res.status(500).json(err);
            }
        });
};

module.exports = {
    viewAll,
    createData,
};
