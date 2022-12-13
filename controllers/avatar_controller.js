const Avatar = require("../models/avatar_schema").model;
const faker = require('@withshepherd/faker')
const {model: User} = require("../models/user_schema");


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

const hasImage = (file) => {
    if (file) {

        let avatarData = {
            img: file.filename,
            name: faker.word.interjection()
        }

        return avatarData
    }
}

const createData = (req, res) => {
    let avatarData = {
        img: `https://ca1-avatars.s3.eu-west-1.amazonaws.com/${req.body.img}`,
        name: req.body.name ?? faker.word.interjection()
    }


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


const updateAvatar = (req, res) => {
    let id = req.params.id
    let avatarData = hasImage(req.file) ?? req.body

    Avatar.findByIdAndUpdate(id, avatarData, {
        new: true,
    })
        .then((data) => {
            if (data) {
                res.status(201).json(data);
            } else {
                res.status(404).json({
                    message: `Avatar with id: ${id} not found`,
                });
            }
        })
        .catch((err) => {
            if (err.name === "ValidationError") {
                console.error("Validation Error!!", err);
                res.status(422).json({
                    msg: "Validation Error",
                    error: err.message,
                });
            } else if (err.name === "CastError") {
                res.status(400).json({
                    message: `Bad request, ${id} is not a valid id`,
                });
            } else {
                console.error(err);
                res.status(500).json(err);
            }
        });
}

const deleteAvatar = (req, res) => {
    let id = req.params.id

    Avatar.deleteOne({_id: id})
        .then((data) => {
            if (data.acknowledged) {
                res.status(200).json({
                    message: `Avatar with id: ${id} deleted successfully`,
                });
            } else {
                res.status(404).json({
                    message: `Avatar with id: ${id} not found`,
                });
            }
        })
        .catch((err) => {
            console.error(err);
            if (err.name === "CastError") {
                res.status(400).json({
                    message: `Bad request, ${id} is not a valid id`,
                });
            } else {
                res.status(500).json(err);
            }
        });

}

module.exports = {
    viewAll,
    createData,
    updateAvatar,
    deleteAvatar
};
