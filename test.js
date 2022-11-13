require("dotenv").config();

require("./utils/db")();

const User = require("./models/user_schema").model;
const Title = require("./models/title_schema");
;

User.find({}, "username")
    .populate("my_list")
    .then((data) => {
        console.log("%j", data);
    })
    .catch((err) => {
        console.log(err);
    });
