const express = require("express");
const jwt = require("jsonwebtoken");
const app = express();
const port = 3000;
require("dotenv").config();
const key = process.env.APP_KEY;
const {loginRequired} = require("./controllers/auth_controller");
require("./utils/db.js")();
app.use(express.json());
app.use(express.static("public"));
const path = require('path')
const {charge} = require('./utils/stripe/charge')
const bodyParser = require('body-parser')
// Need bodyParser for reading form data from home.ejs
app.use(bodyParser.urlencoded({extended: true}));
const stripe = require('stripe')
const cors = require('cors')

app.use(cors())

app.use((req, res, next) => {
    let header = req.headers?.authorization?.split(" ");
    if (header && header[0] === "Bearer")
        jwt.verify(header[1], key, (err, decoded) => !err && (req.user = decoded));

    next();
});

app.use((req, res, next) => {
    console.log(req?.user);
    // it'd hang if we didn't tell it next() or give some response (which would end it)
    next();
});

app.set('views', path.join(__dirname, 'views'))
// Using the ejs template engine
// ejs is very similar to html
app.set('view engine', 'ejs')


app.use("/api/users", require("./routes/users"));
// Putting loginRequired here, because *every* Avatar route is protected
app.use("/api/avatars", loginRequired, require("./routes/avatars"));
app.use("/api/titles", require("./routes/titles"));
app.post('/charge', charge)

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});


module.exports = app